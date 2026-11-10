"""Event entity: what the car just did.

One entity per car fires an event when a trip starts or finishes, charging
starts, finishes or is interrupted, the cable is plugged in or removed, the
battery gets low, the car sends a message, a software update is offered or an
achievement is reached. The same events are fired on the Home Assistant bus
as ``leapmotor_event`` for automations that prefer an event trigger.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.event import EventEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import LeapmotorDataUpdateCoordinator
from .entity_helpers import build_vehicle_display_name
from .insights import EVENT_TYPES


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up one activity event entity per car."""
    coordinator: LeapmotorDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    for vin in coordinator.data.get("vehicles", {}):
        async_add_entities(
            [LeapmotorActivityEvent(coordinator, vin)],
            config_subentry_id=coordinator.config_subentry_id_for_vin(vin),
        )


class LeapmotorActivityEvent(
    CoordinatorEntity[LeapmotorDataUpdateCoordinator], EventEntity
):
    """Fires when something happens with the car."""

    _attr_has_entity_name = True
    _attr_translation_key = "activity"
    _attr_event_types = list(EVENT_TYPES)
    _attr_icon = "mdi:car-info"

    def __init__(self, coordinator: LeapmotorDataUpdateCoordinator, vin: str) -> None:
        super().__init__(coordinator)
        self.vin = vin
        self._attr_unique_id = f"{vin}_activity"
        vehicle = coordinator.data["vehicles"][vin]["vehicle"]
        prefix = str(vehicle.get("car_type") or "leapmotor").strip().lower()
        prefix = "".join(char if char.isalnum() else "_" for char in prefix).strip("_")
        self._attr_suggested_object_id = f"{prefix or 'leapmotor'}_activity"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, vin)},
            manufacturer="Leapmotor",
            model=vehicle.get("car_type"),
            name=build_vehicle_display_name(vehicle),
            serial_number=vin,
        )

    async def async_added_to_hass(self) -> None:
        """Also hand over what happened during the poll at startup."""
        await super().async_added_to_hass()
        self._fire_pending()

    @callback
    def _handle_coordinator_update(self) -> None:
        self._fire_pending()
        super()._handle_coordinator_update()

    @callback
    def _fire_pending(self) -> None:
        events = self.coordinator.pop_events(self.vin)
        for event in events:
            kind = event.get("type")
            if kind not in EVENT_TYPES:
                continue
            attributes: dict[str, Any] = {
                key: value for key, value in event.items() if key not in {"type", "id"}
            }
            self._trigger_event(kind, attributes)
            if self.hass is not None and self.entity_id:
                self.async_write_ha_state()
