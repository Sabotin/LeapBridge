"""Helpers for Leapmotor remote-control actions and service resolution."""

from __future__ import annotations

from dataclasses import dataclass
from functools import partial
from typing import Any

from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .coordinator import LeapmotorDataUpdateCoordinator
from .leap_api import (
    LeapmotorApiError,
    LeapmotorMissingAppCertError,
    LeapmotorRemoteCommandUnconfirmedError,
)

SESSION_REJECTED_MESSAGE = (
    "Leapmotor rejected the session even after logging in again. If the official "
    "app is signed in with the same account, give Home Assistant its own (shared) account."
)


@dataclass(frozen=True, slots=True)
class RemoteActionSpec:
    """Description of one exposed remote-control action."""

    action: str
    translation_key: str
    icon: str
    method_name: str
    service_name: str
    followup_refresh_delay: float | None = 4.0


def resolve_target_vin(
    coordinator: LeapmotorDataUpdateCoordinator,
    vin: str | None = None,
) -> str:
    """Resolve a single target VIN from service input."""
    vehicles = coordinator.data.get("vehicles") or {}
    if vin:
        if vin not in vehicles:
            raise HomeAssistantError(f"Unknown VIN for this account: {vin}")
        return vin

    if len(vehicles) == 1:
        return next(iter(vehicles))

    raise HomeAssistantError(
        "Multiple vehicles are available. Specify a VIN when calling this service."
    )


def _unconfirmed_cause(exc: LeapmotorRemoteCommandUnconfirmedError) -> str:
    """Return why an accepted command could not be confirmed."""
    return str(exc.__cause__ or exc).strip() or exc.__class__.__name__


def format_remote_error(exc: Exception) -> str:
    """Translate raw API errors into clearer Home Assistant error text."""
    message = str(exc).strip() or exc.__class__.__name__
    lowered = message.lower()

    if isinstance(exc, LeapmotorRemoteCommandUnconfirmedError):
        return (
            "Leapmotor accepted the command but did not confirm the result "
            f"({_unconfirmed_cause(exc)}). Check the car before trying again."
        )
    if isinstance(exc, LeapmotorMissingAppCertError):
        return (
            "App certificate or private key is missing. "
            "Login requires both app_cert.pem and app_key.pem."
        )
    if "betriebspasswort" in lowered or "operatepassword" in lowered:
        return (
            "Vehicle PIN verification failed. Check the configured vehicle PIN; "
            "read-only data can still work without it."
        )
    if "account_cert_error" in lowered or "konto-zertifikat" in lowered:
        return "The Leapmotor account certificate could not be opened for this login."
    if "missing local app certificate material" in lowered:
        return (
            "Local app certificate material is missing. "
            "Upload the app certificate and app key in the integration options."
        )
    if "anmeldung fehlgeschlagen" in lowered or "login" in lowered and "failed" in lowered:
        return "Leapmotor login failed. Check username, password and certificate material."
    if "shared" in lowered and "right" in lowered:
        return "This shared-car account does not have the required right for this action."
    if _is_session_error(lowered):
        return SESSION_REJECTED_MESSAGE
    return message


def _is_session_error(lowered_message: str) -> bool:
    """Match the token errors the API client could not recover from."""
    return "token" in lowered_message and any(
        marker in lowered_message
        for marker in ("invalid", "expired", "expire", "unauthorized", "not valid")
    )


def failure_starts_cooldown(exc: Exception) -> bool:
    """Return whether a failed remote action may have reached the car.

    Only then does the cooldown guard against a second, duplicate command.
    A rejected PIN also keeps the cooldown, so repeated presses cannot hammer
    the PIN check. Session and network errors before sending can be retried
    straight away.
    """
    if isinstance(exc, LeapmotorRemoteCommandUnconfirmedError):
        return True
    lowered = str(exc).lower()
    return "remote verify" in lowered and not _is_session_error(lowered)


def remote_action_error(exc: Exception) -> HomeAssistantError:
    """Build a translatable Home Assistant error for a failed remote action."""
    message = format_remote_error(exc)
    if isinstance(exc, LeapmotorRemoteCommandUnconfirmedError):
        return HomeAssistantError(
            message,
            translation_domain=DOMAIN,
            translation_key="remote_unconfirmed",
            translation_placeholders={"error": _unconfirmed_cause(exc)},
        )
    if message == SESSION_REJECTED_MESSAGE:
        return HomeAssistantError(
            message,
            translation_domain=DOMAIN,
            translation_key="session_rejected",
        )
    return HomeAssistantError(message)


async def async_execute_remote_action(
    coordinator: LeapmotorDataUpdateCoordinator,
    vin: str,
    spec: RemoteActionSpec,
    kwargs: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Execute one remote action with shared cooldown, error and refresh handling."""
    cooldown = coordinator.remote_action_cooldown_remaining(vin)
    if cooldown:
        raise HomeAssistantError(
            f"Wait {cooldown} s before the next command; the previous one may still be running.",
            translation_domain=DOMAIN,
            translation_key="remote_cooldown",
            translation_placeholders={"seconds": str(cooldown)},
        )
    if not coordinator.operation_password_configured(vin):
        raise HomeAssistantError(
            "Vehicle PIN is not configured. Read-only data works without a PIN, "
            "but remote-control actions require it."
        )

    method = getattr(coordinator.client, spec.method_name)
    callable_ = partial(method, vin, **kwargs) if kwargs else partial(method, vin)
    try:
        result = await coordinator.hass.async_add_executor_job(callable_)
    except LeapmotorApiError as exc:
        coordinator.record_remote_action(
            vin,
            spec.action,
            success=False,
            error=format_remote_error(exc),
            cooldown=failure_starts_cooldown(exc),
        )
        if isinstance(exc, LeapmotorRemoteCommandUnconfirmedError):
            # The command may be running; show its effect as soon as it lands.
            coordinator.schedule_remote_followup_refresh(
                vin,
                delay_seconds=spec.followup_refresh_delay or 4.0,
            )
        raise remote_action_error(exc) from exc

    coordinator.record_remote_action(
        vin,
        spec.action,
        success=True,
        result=result,
    )
    if spec.action == "lock":
        coordinator.set_lock_state_override(vin, True, ttl_seconds=15)
    elif spec.action == "unlock":
        coordinator.set_lock_state_override(vin, False, ttl_seconds=15)
    await coordinator.async_request_refresh()
    if spec.followup_refresh_delay is not None:
        coordinator.schedule_remote_followup_refresh(
            vin,
            delay_seconds=spec.followup_refresh_delay,
        )
    return result
