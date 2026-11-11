"""Time entities for Leapmotor: the charging schedule's start and end."""

from __future__ import annotations

from datetime import time
from functools import partial
from typing import Any

from homeassistant.components.time import TimeEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .charging_schedule import DAY_NAMES, parse_time, schedule_view
from .const import DOMAIN
from .coordinator import LeapmotorDataUpdateCoordinator
from .entity_helpers import build_vehicle_display_name
from .remote_helpers import (
    RemoteActionSpec,
    failure_starts_cooldown,
    format_remote_error,
    remote_action_error,
)

#: Also the `leapmotor.set_charging_schedule` action.
SET_CHARGING_SCHEDULE_ACTION = RemoteActionSpec(
    action="set_charging_schedule",
    translation_key="set_charging_schedule",
    icon="mdi:calendar-clock",
    method_name="set_charging_schedule",
    service_name="set_charging_schedule",
)

#: (unique-id suffix and translation key, schedule value, command argument, icon)
SCHEDULE_TIMES: tuple[tuple[str, str, str, str], ...] = (
    ("charging_schedule_start", "start", "start_time", "mdi:clock-start"),
    ("charging_schedule_end", "end", "end_time", "mdi:clock-end"),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the charging schedule times of every vehicle."""
    coordinator: LeapmotorDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    for vin in coordinator.data.get("vehicles", {}):
        async_add_entities(
            [
                LeapmotorChargingScheduleTime(coordinator, vin, *description)
                for description in SCHEDULE_TIMES
            ],
            config_subentry_id=coordinator.config_subentry_id_for_vin(vin),
        )


class LeapmotorChargingScheduleTime(
    CoordinatorEntity[LeapmotorDataUpdateCoordinator],
    TimeEntity,
):
    """Start or end of the car's charging schedule; changing it keeps the rest."""

    _attr_has_entity_name = True
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(
        self,
        coordinator: LeapmotorDataUpdateCoordinator,
        vin: str,
        key: str,
        view_key: str,
        argument: str,
        icon: str,
    ) -> None:
        super().__init__(coordinator)
        self.vin = vin
        self._view_key = view_key
        self._argument = argument
        self._attr_translation_key = key
        self._attr_icon = icon
        self._attr_unique_id = f"{vin}_{key}"
        vehicle = self.vehicle_data["vehicle"]
        self._attr_suggested_object_id = _suggested_object_id(vehicle, key)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, vin)},
            manufacturer="Leapmotor",
            model=vehicle.get("car_type"),
            name=build_vehicle_display_name(vehicle),
            serial_number=vin,
        )

    @property
    def vehicle_data(self) -> dict[str, Any]:
        """Return current data for this vehicle."""
        return self.coordinator.data["vehicles"][self.vin]

    @property
    def available(self) -> bool:
        """Return entity availability."""
        return super().available and self.coordinator.operation_password_configured(self.vin)

    @property
    def native_value(self) -> time | None:
        """Return the schedule time the car reports."""
        return parse_time(schedule_view(self.vehicle_data.get("charging")).get(self._view_key))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """The whole schedule, so dashboards need only one entity."""
        charging = self.vehicle_data.get("charging") or {}
        view = schedule_view(charging)
        days = view["days"]
        return {
            "vin": self.vin,
            "schedule_enabled": view["enabled"],
            "schedule_start": view["start"],
            "schedule_end": view["end"],
            "schedule_days": None if days is None else [DAY_NAMES[day - 1] for day in days],
            "repeat_weekly": view["repeat_weekly"],
            "auto_recharge": view["auto_recharge"],
            "charge_limit_percent": view["charge_limit_percent"],
            # "Charge now" switched the schedule off for one charge; it goes back on afterwards.
            "schedule_paused": bool(charging.get("charging_schedule_paused")),
            "schedule_paused_since": charging.get("charging_schedule_paused_since"),
            "operation_password_configured": self.coordinator.operation_password_configured(
                self.vin
            ),
        }

    async def async_set_value(self, value: time) -> None:
        """Change this time; the other values of the schedule stay as they are."""
        if not self.coordinator.operation_password_configured(self.vin):
            raise HomeAssistantError(
                "Vehicle PIN is not configured. Read-only data works without a PIN, "
                "but charging schedule changes require it."
            )
        action = SET_CHARGING_SCHEDULE_ACTION.action
        try:
            result = await self.hass.async_add_executor_job(
                partial(
                    self.coordinator.client.set_charging_schedule,
                    self.vin,
                    **{self._argument: value},
                )
            )
        except Exception as exc:
            self.coordinator.record_remote_action(
                self.vin,
                action,
                success=False,
                error=format_remote_error(exc),
                cooldown=failure_starts_cooldown(exc),
            )
            raise remote_action_error(exc) from exc

        self.coordinator.record_remote_action(self.vin, action, success=True, result=result)
        await self.coordinator.async_request_refresh()
        self.coordinator.schedule_remote_followup_refresh(self.vin)


def _suggested_object_id(vehicle: dict[str, Any], slug: str) -> str:
    """Return a stable English suggested object id independent from UI language."""
    prefix = str(vehicle.get("car_type") or "leapmotor").strip().lower()
    prefix = "".join(char if char.isalnum() else "_" for char in prefix).strip("_")
    return f"{prefix or 'leapmotor'}_{slug}"
