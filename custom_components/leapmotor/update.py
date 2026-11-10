"""Update entity for the car's own software (over-the-air updates).

It shows the installed version, a version waiting to be installed and its
release notes. Installing is left to the car and the official app: this
entity is for information and automations only. The cloud gives the software
version to the account that owns the car, not to accounts it is shared with.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.update import (
    UpdateDeviceClass,
    UpdateEntity,
    UpdateEntityFeature,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .cloud_extras import release_notes_markdown
from .const import DOMAIN
from .coordinator import LeapmotorDataUpdateCoordinator
from .entity_helpers import build_vehicle_display_name

#: Reasons that will not change while this account is used.
_NEVER_AVAILABLE = {"shared_account", "no_permission"}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the software update entity of each owned car."""
    coordinator: LeapmotorDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    for vin, vehicle_data in coordinator.data.get("vehicles", {}).items():
        software = vehicle_data.get("software") or {}
        if software.get("reason") in _NEVER_AVAILABLE:
            continue
        async_add_entities(
            [LeapmotorSoftwareUpdate(coordinator, vin)],
            config_subentry_id=coordinator.config_subentry_id_for_vin(vin),
        )


class LeapmotorSoftwareUpdate(
    CoordinatorEntity[LeapmotorDataUpdateCoordinator], UpdateEntity
):
    """The car's software version and a pending over-the-air update."""

    _attr_has_entity_name = True
    _attr_translation_key = "vehicle_software"
    _attr_device_class = UpdateDeviceClass.FIRMWARE
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_supported_features = UpdateEntityFeature.RELEASE_NOTES

    def __init__(self, coordinator: LeapmotorDataUpdateCoordinator, vin: str) -> None:
        super().__init__(coordinator)
        self.vin = vin
        self._attr_unique_id = f"{vin}_vehicle_software"
        vehicle = self.vehicle_data["vehicle"]
        prefix = str(vehicle.get("car_type") or "leapmotor").strip().lower()
        prefix = "".join(char if char.isalnum() else "_" for char in prefix).strip("_")
        self._attr_suggested_object_id = f"{prefix or 'leapmotor'}_software"
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
    def _software(self) -> dict[str, Any]:
        return self.vehicle_data.get("software") or {}

    @property
    def available(self) -> bool:
        """Only available once the cloud has reported a version."""
        return super().available and bool(self._software.get("installed_version"))

    @property
    def installed_version(self) -> str | None:
        """Version running in the car."""
        return self._software.get("installed_version")

    @property
    def latest_version(self) -> str | None:
        """Version waiting to be installed, else the installed one."""
        return self._software.get("latest_version") or self._software.get("installed_version")

    @property
    def release_summary(self) -> str | None:
        """First release-note heading, at most 255 characters."""
        for section in self._software.get("release_notes") or []:
            text = section.get("title") or section.get("content")
            if text:
                return str(text)[:255]
        return None

    async def async_release_notes(self) -> str | None:
        """Release notes of the pending (or installed) version as Markdown."""
        return release_notes_markdown(self._software)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Details the dashboard shows."""
        software = self._software
        return {
            "vin": self.vin,
            "installed_at": software.get("installed_at"),
            "update_size_mb": software.get("update_size_mb"),
            "update_packages": software.get("update_packages"),
            "release_notes_language": software.get("release_notes_language"),
            "release_notes_for": software.get("release_notes_for"),
            "notes": software.get("release_notes") or [],
        }
