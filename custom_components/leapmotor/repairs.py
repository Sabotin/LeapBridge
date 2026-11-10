"""Repairs: accept a shared car, or download missing app certificates."""

from __future__ import annotations

from functools import partial
import logging
from typing import Any

import voluptuous as vol

from homeassistant import data_entry_flow
from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant

from .cert_download import (
    CERT_REPOSITORY_URL,
    CertificateDownloadError,
    download_app_certificates,
)
from .const import DOMAIN, STATIC_CERT_STORAGE_DIR
from .coordinator import (
    MISSING_CERTIFICATES_ISSUE_PREFIX,
    async_reload_after_share_accept,
)
from .leap_api import LeapmotorApiError

_LOGGER = logging.getLogger(__name__)


class ShareInvitationRepairFlow(RepairsFlow):
    """Ask before accepting a car that was shared with this account."""

    def __init__(self, entry_id: str, vin_tail: str) -> None:
        self._entry_id = entry_id
        self._vin_tail = vin_tail

    async def async_step_init(
        self, user_input: dict[str, str] | None = None
    ) -> data_entry_flow.FlowResult:
        return await self.async_step_confirm()

    async def async_step_confirm(
        self, user_input: dict[str, str] | None = None
    ) -> data_entry_flow.FlowResult:
        if user_input is not None:
            coordinator = (self.hass.data.get(DOMAIN) or {}).get(self._entry_id)
            if coordinator is None:
                return self.async_abort(reason="entry_not_loaded")
            try:
                await self.hass.async_add_executor_job(
                    partial(
                        coordinator.client.answer_share_invitation,
                        self._vin_tail or None,
                        accept=True,
                    )
                )
            except LeapmotorApiError:
                return self.async_abort(reason="share_accept_failed")
            # The shared car needs its own entities: load the entry again,
            # a moment later, when the cloud lists the car.
            async_reload_after_share_accept(self.hass, self._entry_id)
            return self.async_create_entry(title="", data={})
        return self.async_show_form(step_id="confirm", data_schema=vol.Schema({}))


class MissingCertificatesRepairFlow(RepairsFlow):
    """Download the app certificates an account needs to log in."""

    def __init__(self, entry_id: str) -> None:
        self._entry_id = entry_id

    async def async_step_init(
        self, user_input: dict[str, str] | None = None
    ) -> data_entry_flow.FlowResult:
        return await self.async_step_confirm()

    async def async_step_confirm(
        self, user_input: dict[str, str] | None = None
    ) -> data_entry_flow.FlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await self.hass.async_add_executor_job(
                    download_app_certificates,
                    self.hass.config.path(STATIC_CERT_STORAGE_DIR),
                )
            except CertificateDownloadError as exc:
                _LOGGER.warning(
                    "Leapmotor certificate download failed (%s): %s", exc.reason, exc.detail
                )
                errors["base"] = exc.reason
            else:
                if self.hass.config_entries.async_get_entry(self._entry_id) is not None:
                    self.hass.config_entries.async_schedule_reload(self._entry_id)
                return self.async_create_entry(title="", data={})
        return self.async_show_form(
            step_id="confirm",
            data_schema=vol.Schema({}),
            errors=errors,
            description_placeholders={"repository": CERT_REPOSITORY_URL},
        )


async def async_create_fix_flow(
    hass: HomeAssistant, issue_id: str, data: dict[str, Any] | None
) -> RepairsFlow:
    """Create the flow for a Leapmotor repair."""
    data = data or {}
    if issue_id.startswith(MISSING_CERTIFICATES_ISSUE_PREFIX):
        return MissingCertificatesRepairFlow(str(data.get("entry_id") or ""))
    return ShareInvitationRepairFlow(str(data.get("entry_id") or ""), str(data.get("vin_tail") or ""))
