"""Charge now on a car without a start command: its schedule is off for one charge.

The T03 has no remote command that starts a charge. A plugged-in T03 that
waits for its charging schedule starts when the schedule is switched off, so
"charge now" does that (``api.LeapmotorApiClient.start_charging``) and the
client remembers the schedule in ``paused_schedules``. This module decides
when that schedule is switched on again:

- the charge that followed has ended (the car was seen charging and has not
  charged for a few minutes since),
- or the car has driven,
- or a long time has passed without either.

Switching the schedule on while the charge still runs could stop it, so that
is never done. This module has no Home Assistant imports.
"""

from __future__ import annotations

from typing import Any

#: The charge counts as over once the car has not charged for this long.
CHARGE_END_SETTLE_SECONDS = 300
#: Without a charge and without a drive, the schedule goes back on after this long.
MAX_PAUSE_SECONDS = 36 * 3600
#: After a failed attempt to switch the schedule on, wait this long.
RESUME_RETRY_SECONDS = 900
#: Then the schedule is left as it is and the failure is reported.
RESUME_MAX_ATTEMPTS = 4

REASON_CHARGE_ENDED = "charge_ended"
REASON_DROVE = "drove"
REASON_TIMEOUT = "timeout"


def _number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def _drove(vehicle_data: dict[str, Any], pause: dict[str, Any]) -> bool:
    status = vehicle_data.get("status") or {}
    if status.get("is_driving") is True or status.get("gear") in {"R", "N", "D"}:
        return True
    speed = _number(status.get("speed_kmh"))
    if speed is not None and speed > 0:
        return True
    before = _number(pause.get("odometer_km"))
    now = _number(status.get("odometer_km"))
    return before is not None and now is not None and abs(now - before) >= 1


def observe(pause: dict[str, Any], vehicle_data: dict[str, Any], now: float) -> str | None:
    """Take one status of the car. Returns why the schedule is due to go back on, or None.

    ``pause`` (one entry of ``paused_schedules``) is updated in place with
    what was seen: the odometer at the pause, whether the car has charged
    since, and since when it no longer does.
    """
    charging = vehicle_data.get("charging") or {}
    status = vehicle_data.get("status") or {}
    if pause.get("odometer_km") is None and _number(status.get("odometer_km")) is not None:
        pause["odometer_km"] = _number(status.get("odometer_km"))
    if _drove(vehicle_data, pause):
        return REASON_DROVE
    # A sleeping car's reduced status has no charge state; charging keeps the
    # battery electronics awake, so a reduced status is a car that does not charge.
    if charging.get("battery_data_reported") is not False and charging.get("is_charging") is True:
        pause["charge_seen"] = True
        pause.pop("idle_since", None)
        return None
    if pause.get("charge_seen"):
        idle_since = _number(pause.get("idle_since"))
        if idle_since is None:
            pause["idle_since"] = int(now)
            return None
        return REASON_CHARGE_ENDED if now - idle_since >= CHARGE_END_SETTLE_SECONDS else None
    since = _number(pause.get("since")) or now
    return REASON_TIMEOUT if now - since >= MAX_PAUSE_SECONDS else None


def may_try(pause: dict[str, Any], now: float) -> bool:
    """Return whether switching the schedule on may be tried now."""
    return now >= (_number(pause.get("next_try")) or 0)


def failed(pause: dict[str, Any], error: str, now: float) -> bool:
    """Note a failed attempt. Returns whether another one will be made."""
    pause["attempts"] = int(_number(pause.get("attempts")) or 0) + 1
    pause["last_error"] = str(error)
    pause["next_try"] = int(now + RESUME_RETRY_SECONDS)
    return pause["attempts"] < RESUME_MAX_ATTEMPTS


def apply(vehicle_data: dict[str, Any], pause: dict[str, Any] | None) -> None:
    """Show in the ``charging`` block that the schedule is off for this charge only."""
    charging = vehicle_data.get("charging")
    if not isinstance(charging, dict):
        return
    charging["charging_schedule_paused"] = bool(pause)
    charging["charging_schedule_paused_since"] = (pause or {}).get("since")


def from_storage(stored: Any) -> dict[str, dict[str, Any]]:
    """Return the paused schedules of a storage file, dropping anything malformed."""
    if not isinstance(stored, dict):
        return {}
    return {
        str(vin): dict(pause)
        for vin, pause in stored.items()
        if isinstance(pause, dict) and isinstance(pause.get("plan"), dict)
    }


__all__ = [
    "CHARGE_END_SETTLE_SECONDS",
    "MAX_PAUSE_SECONDS",
    "REASON_CHARGE_ENDED",
    "REASON_DROVE",
    "REASON_TIMEOUT",
    "RESUME_MAX_ATTEMPTS",
    "RESUME_RETRY_SECONDS",
    "apply",
    "failed",
    "from_storage",
    "may_try",
    "observe",
]
