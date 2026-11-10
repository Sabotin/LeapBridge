"""Home Assistant integration for Leapmotor vehicle data."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from functools import partial
import json
import logging
from pathlib import Path
from types import MappingProxyType
import uuid

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME, Platform
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr, issue_registry as ir
import voluptuous as vol

from .api import LeapmotorApiClient
from .button import BUTTON_SPECS
from .card import async_remove_panel, async_setup_frontend
from .const import (
    CONF_SHOW_PANEL,
    DEFAULT_OPERATION_PASSWORD,
    CONF_ACCOUNT_P12_PASSWORD,
    CONF_ABRP_ENABLED,
    CONF_ABRP_TOKEN,
    CONF_DEVICE_ID,
    CONF_DRIVING_SCAN_INTERVAL,
    CONF_ECO_POLLING_ENABLED,
    CONF_ECO_SCAN_INTERVAL,
    CONF_OPERATION_PASSWORD,
    CONF_SCAN_INTERVAL,
    CONF_VIN,
    DEFAULT_SCAN_INTERVAL_MINUTES,
    DEFAULT_DRIVING_SCAN_INTERVAL_MINUTES,
    DEFAULT_ECO_SCAN_INTERVAL_MINUTES,
    DOMAIN,
    STATIC_CERT_STORAGE_DIR,
    SUBENTRY_TYPE_VEHICLE,
)
from .coordinator import LeapmotorDataUpdateCoordinator
from .leap_api import LeapmotorApiError
from .entity_migration import async_remove_obsolete_entities
from .lock import LOCK_ACTION, UNLOCK_ACTION
from .remote_helpers import (
    RemoteActionSpec,
    async_execute_remote_action,
    failure_starts_cooldown,
    format_remote_error,
    remote_action_error,
    resolve_target_vin,
)
from .vehicle_config import legacy_config_value, vehicle_subentries

_LOGGER = logging.getLogger(__name__)

SERVICE_FIELDS = vol.Schema(
    {
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

WINDOW_POSITION_SERVICE_FIELDS = vol.Schema(
    {
        vol.Optional("value"): vol.All(vol.Coerce(int), vol.Range(min=0, max=100)),
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

SUNSHADE_POSITION_SERVICE_FIELDS = vol.Schema(
    {
        vol.Optional("value"): vol.All(vol.Coerce(int), vol.Range(min=0, max=10)),
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

SET_CLIMATE_FIELDS = vol.Schema(
    {
        vol.Required("mode"): vol.In(("cold", "hot", "wind", "nohotcold")),
        vol.Optional("temperature", default=26): vol.All(vol.Coerce(int), vol.Range(min=18, max=32)),
        vol.Optional("fan_speed", default=3): vol.All(vol.Coerce(int), vol.Range(min=1, max=7)),
        vol.Optional("recirculate", default=False): bool,
        vol.Optional("windshield_defrost", default=False): bool,
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

def _schedule_days(value: object) -> list[int]:
    """Validate climate schedule weekdays. The app uses 0=Sunday through 6=Saturday."""
    if value in (None, ""):
        return []
    if isinstance(value, str):
        raw_values = [part.strip() for part in value.split(",") if part.strip()]
    elif isinstance(value, (list, tuple, set)):
        raw_values = list(value)
    else:
        raise vol.Invalid("days must be a list or comma-separated string")

    days: list[int] = []
    for raw_value in raw_values:
        try:
            day = int(raw_value)
        except (TypeError, ValueError) as exc:
            raise vol.Invalid("days must contain integers from 0 to 6") from exc
        if not 0 <= day <= 6:
            raise vol.Invalid("days must contain integers from 0 to 6")
        if day not in days:
            days.append(day)
    return days


def _prepare_car_kwargs(data: dict[str, object]) -> dict[str, object]:
    """Extract prepare-car payload options from Home Assistant service data."""
    return {
        "climate_enabled": data["climate_enabled"],
        "mode": data["mode"],
        "operate": data["operate"],
        "temperature": data["temperature"],
        "fan_speed": data["fan_speed"],
        "recirculate": data["recirculate"],
        "windshield_defrost": data["windshield_defrost"],
        "driver_seat": data["driver_seat"],
        "driver_seat_level": data["driver_seat_level"],
        "passenger_seat": data["passenger_seat"],
        "passenger_seat_level": data["passenger_seat_level"],
        "steering_wheel_heat": data["steering_wheel_heat"],
        "mirror_heat": data["mirror_heat"],
        "destination_name": data.get("destination_name"),
        "destination_address": data.get("destination_address"),
        "destination_latitude": data.get("destination_latitude"),
        "destination_longitude": data.get("destination_longitude"),
    }


SET_CLIMATE_SCHEDULE_FIELDS = vol.Schema(
    {
        vol.Required("start_time"): vol.All(str, vol.Length(min=1)),
        vol.Optional("mode", default="nohotcold"): vol.In(("cold", "hot", "nohotcold")),
        vol.Optional("operate", default="manual"): vol.In(("manual", "auto")),
        vol.Optional("temperature", default=26): vol.All(vol.Coerce(int), vol.Range(min=18, max=32)),
        vol.Optional("fan_speed", default=4): vol.All(vol.Coerce(int), vol.Range(min=1, max=7)),
        vol.Optional("recirculate", default=False): bool,
        vol.Optional("windshield_defrost", default=False): bool,
        vol.Optional("days", default=[]): _schedule_days,
        vol.Optional("enabled", default=True): bool,
        vol.Optional("set_id"): str,
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

PREPARE_CAR_BASE_FIELDS = {
    vol.Optional("climate_enabled", default=True): bool,
    vol.Optional("mode", default="cold"): vol.In(("cold", "hot", "nohotcold")),
    vol.Optional("operate", default="manual"): vol.In(("manual", "auto")),
    vol.Optional("temperature", default=18): vol.All(vol.Coerce(int), vol.Range(min=18, max=32)),
    vol.Optional("fan_speed", default=7): vol.All(vol.Coerce(int), vol.Range(min=1, max=7)),
    vol.Optional("recirculate", default=True): bool,
    vol.Optional("windshield_defrost", default=False): bool,
    vol.Optional("driver_seat", default="off"): vol.In(("off", "heat", "ventilation")),
    vol.Optional("driver_seat_level", default=3): vol.All(vol.Coerce(int), vol.Range(min=1, max=3)),
    vol.Optional("passenger_seat", default="off"): vol.In(("off", "heat", "ventilation")),
    vol.Optional("passenger_seat_level", default=3): vol.All(vol.Coerce(int), vol.Range(min=1, max=3)),
    vol.Optional("steering_wheel_heat", default=False): bool,
    vol.Optional("mirror_heat", default=False): bool,
    vol.Optional("destination_name"): vol.All(str, vol.Length(min=1)),
    vol.Optional("destination_address"): vol.All(str, vol.Length(min=1)),
    vol.Optional("destination_latitude"): vol.All(vol.Coerce(float), vol.Range(min=-90, max=90)),
    vol.Optional("destination_longitude"): vol.All(vol.Coerce(float), vol.Range(min=-180, max=180)),
    vol.Optional("vin"): str,
    vol.Optional("entity_id"): str,
}

PREPARE_CAR_FIELDS = vol.Schema(PREPARE_CAR_BASE_FIELDS)

PREPARE_CAR_SCHEDULE_FIELDS = vol.Schema(
    {
        vol.Required("start_time"): vol.All(str, vol.Length(min=1)),
        vol.Optional("days", default=[]): _schedule_days,
        vol.Optional("enabled", default=True): bool,
        vol.Optional("set_id"): str,
        **PREPARE_CAR_BASE_FIELDS,
    }
)

_SERVICE_SCHEMAS = {
    "windows_open": WINDOW_POSITION_SERVICE_FIELDS,
    "windows_close": WINDOW_POSITION_SERVICE_FIELDS,
    "sunshade_open": SUNSHADE_POSITION_SERVICE_FIELDS,
    "sunshade_close": SUNSHADE_POSITION_SERVICE_FIELDS,
}

SET_CLIMATE_ACTION = RemoteActionSpec(
    action="set_climate",
    translation_key="set_climate",
    icon="mdi:air-conditioner",
    method_name="set_climate",
    service_name="set_climate",
)

SET_CLIMATE_SCHEDULE_ACTION = RemoteActionSpec(
    action="set_climate_schedule",
    translation_key="set_climate_schedule",
    icon="mdi:calendar-clock",
    method_name="set_climate_schedule",
    service_name="set_climate_schedule",
)

CANCEL_CLIMATE_SCHEDULE_ACTION = RemoteActionSpec(
    action="cancel_climate_schedule",
    translation_key="cancel_climate_schedule",
    icon="mdi:calendar-remove",
    method_name="cancel_climate_schedule",
    service_name="cancel_climate_schedule",
)

PREPARE_CAR_ACTION = RemoteActionSpec(
    action="prepare_car",
    translation_key="prepare_car",
    icon="mdi:car-cog",
    method_name="prepare_car",
    service_name="prepare_car",
)

SET_PREPARE_CAR_SCHEDULE_ACTION = RemoteActionSpec(
    action="set_prepare_car_schedule",
    translation_key="set_prepare_car_schedule",
    icon="mdi:calendar-clock",
    method_name="set_prepare_car_schedule",
    service_name="set_prepare_car_schedule",
)

CANCEL_PREPARE_CAR_SCHEDULE_ACTION = RemoteActionSpec(
    action="cancel_prepare_car_schedule",
    translation_key="cancel_prepare_car_schedule",
    icon="mdi:calendar-remove",
    method_name="cancel_prepare_car_schedule",
    service_name="cancel_prepare_car_schedule",
)

SET_CHARGE_LIMIT_FIELDS = vol.Schema(
    {
        vol.Required("charge_limit_percent"): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

SEND_DESTINATION_FIELDS = vol.Schema(
    {
        vol.Required("name"): vol.All(str, vol.Length(min=1)),
        vol.Required("latitude"): vol.All(vol.Coerce(float), vol.Range(min=-90, max=90)),
        vol.Required("longitude"): vol.All(vol.Coerce(float), vol.Range(min=-180, max=180)),
        vol.Optional("address"): vol.All(str, vol.Length(min=1)),
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

LOG_MAINTENANCE_FIELDS = vol.Schema(
    {
        vol.Required("service_type"): vol.All(str, vol.Length(min=1, max=80)),
        vol.Optional("odometer_km"): vol.All(vol.Coerce(float), vol.Range(min=0, max=2_000_000)),
        vol.Optional("date"): str,
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

PREHEAT_CABIN_FIELDS = vol.Schema(
    {
        vol.Optional("temperature"): vol.All(vol.Coerce(int), vol.Range(min=18, max=32)),
        vol.Optional("fan_speed"): vol.All(vol.Coerce(int), vol.Range(min=1, max=7)),
        vol.Optional("recirculate"): bool,
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

RESET_MAINTENANCE_FIELDS = vol.Schema(
    {
        vol.Required("service_type"): vol.All(str, vol.Length(min=1, max=80)),
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

EXPORT_DIAGNOSTICS_FIELDS = vol.Schema(
    {
        vol.Optional("filename"): str,
    }
)

GET_HISTORY_FIELDS = vol.Schema(
    {
        vol.Optional("limit", default=500): vol.All(vol.Coerce(int), vol.Range(min=1, max=500)),
        vol.Optional("vin"): str,
        vol.Optional("entity_id"): str,
    }
)

SHARE_INVITATION_FIELDS = vol.Schema(
    {
        vol.Optional("vin_tail"): vol.All(str, vol.Length(min=4, max=17)),
    }
)

#: Services added with the insights and the extra cloud data.
EXTRA_SERVICES = (
    "get_trips",
    "get_charging_sessions",
    "refresh_cloud_data",
    "accept_share_invitation",
    "decline_share_invitation",
)
SHARE_ISSUE_PREFIX = "share_invitation_"

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.DEVICE_TRACKER,
    Platform.EVENT,
    Platform.IMAGE,
    Platform.LOCK,
    Platform.NUMBER,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.UPDATE,
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Leapmotor from a config entry."""
    entry_data = dict(entry.data)
    if not entry_data.get(CONF_DEVICE_ID):
        entry_data[CONF_DEVICE_ID] = uuid.uuid4().hex
        hass.config_entries.async_update_entry(entry, data=entry_data)

    scan_interval = int(
        entry.options.get(
            CONF_SCAN_INTERVAL,
            entry_data.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL_MINUTES),
        )
    )
    eco_scan_interval = int(
        entry.options.get(
            CONF_ECO_SCAN_INTERVAL,
            entry_data.get(CONF_ECO_SCAN_INTERVAL, DEFAULT_ECO_SCAN_INTERVAL_MINUTES),
        )
    )
    driving_scan_interval = int(
        entry.options.get(CONF_DRIVING_SCAN_INTERVAL, DEFAULT_DRIVING_SCAN_INTERVAL_MINUTES)
    )
    operation_password = (
        entry.options[CONF_OPERATION_PASSWORD]
        if CONF_OPERATION_PASSWORD in entry.options
        else entry_data.get(CONF_OPERATION_PASSWORD)
    )
    client = LeapmotorApiClient(
        username=entry_data[CONF_USERNAME],
        password=entry_data[CONF_PASSWORD],
        account_p12_password=entry_data.get(CONF_ACCOUNT_P12_PASSWORD),
        operation_password=operation_password or None,
        device_id=entry_data[CONF_DEVICE_ID],
        static_cert_dir=hass.config.path(STATIC_CERT_STORAGE_DIR),
        history_timezone=hass.config.time_zone,
    )
    # Software release notes in the language Home Assistant is set to.
    client.notes_language = hass.config.language
    coordinator = LeapmotorDataUpdateCoordinator(
        hass=hass,
        config_entry=entry,
        client=client,
        update_interval=timedelta(minutes=scan_interval),
        eco_polling_enabled=bool(
            entry.options.get(
                CONF_ECO_POLLING_ENABLED,
                entry_data.get(CONF_ECO_POLLING_ENABLED, False),
            )
        ),
        eco_update_interval=timedelta(minutes=max(eco_scan_interval, scan_interval)),
        driving_update_interval=timedelta(minutes=driving_scan_interval),
    )
    await coordinator.async_load_location_signs()
    await coordinator.async_load_analytics()
    await coordinator.async_config_entry_first_refresh()
    _async_ensure_vehicle_subentries(hass, entry, coordinator.data.get("vehicles") or {})
    coordinator.refresh_vehicle_configuration()
    await async_remove_obsolete_entities(hass)

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
    if not hass.services.has_service(DOMAIN, "lock"):
        await _async_register_services(hass)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await async_remove_obsolete_entities(hass)

    @callback
    def _sync_share_invitations() -> None:
        _async_sync_share_invitation_issues(hass, entry, coordinator)

    _sync_share_invitations()
    entry.async_on_unload(coordinator.async_add_listener(_sync_share_invitations))
    entry.async_on_unload(lambda: _async_clear_share_invitation_issues(hass, entry))
    await async_setup_frontend(
        hass,
        show_panel=any(
            item.options.get(CONF_SHOW_PANEL, True)
            for item in hass.config_entries.async_entries(DOMAIN)
        ),
    )
    return True


def _share_issue_id(entry: ConfigEntry, vin_tail: str) -> str:
    return f"{SHARE_ISSUE_PREFIX}{entry.entry_id}_{vin_tail}"


@callback
def _async_sync_share_invitation_issues(
    hass: HomeAssistant,
    entry: ConfigEntry,
    coordinator: LeapmotorDataUpdateCoordinator,
) -> None:
    """Show a repair for each car-share invitation waiting for this account."""
    try:
        invitations = (coordinator.data or {}).get("share_invitations") or []
        wanted: dict[str, dict] = {}
        for invitation in invitations:
            vin_tail = str(invitation.get("vin_tail") or "")
            if vin_tail:
                wanted[_share_issue_id(entry, vin_tail)] = invitation
        registry = ir.async_get(hass)
        prefix = f"{SHARE_ISSUE_PREFIX}{entry.entry_id}_"
        for (domain, issue_id) in list(registry.issues):
            if domain == DOMAIN and issue_id.startswith(prefix) and issue_id not in wanted:
                ir.async_delete_issue(hass, DOMAIN, issue_id)
        for issue_id, invitation in wanted.items():
            ir.async_create_issue(
                hass,
                DOMAIN,
                issue_id,
                is_fixable=True,
                is_persistent=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key="share_invitation",
                translation_placeholders={
                    "owner": str(invitation.get("owner") or "?"),
                    "car": str(
                        invitation.get("car_name") or invitation.get("car_type") or "Leapmotor"
                    ),
                    "vin_tail": str(invitation.get("vin_tail") or ""),
                },
                data={"entry_id": entry.entry_id, "vin_tail": str(invitation.get("vin_tail") or "")},
            )
    except Exception:  # noqa: BLE001 - a hint only, never break the integration
        _LOGGER.debug("Could not update car-share invitation repairs", exc_info=True)


@callback
def _async_clear_share_invitation_issues(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove this entry's invitation repairs when it is unloaded."""
    try:
        registry = ir.async_get(hass)
        prefix = f"{SHARE_ISSUE_PREFIX}{entry.entry_id}_"
        for (domain, issue_id) in list(registry.issues):
            if domain == DOMAIN and issue_id.startswith(prefix):
                ir.async_delete_issue(hass, DOMAIN, issue_id)
    except Exception:  # noqa: BLE001
        _LOGGER.debug("Could not clear car-share invitation repairs", exc_info=True)


def _async_ensure_vehicle_subentries(
    hass: HomeAssistant,
    entry: ConfigEntry,
    vehicles: dict[str, dict],
) -> None:
    """Create VIN-scoped settings and migrate existing devices in place."""
    configured = vehicle_subentries(entry)
    migrating_legacy_settings = not configured
    legacy_pin = str(legacy_config_value(entry, CONF_OPERATION_PASSWORD, "") or "")
    legacy_abrp_enabled = bool(legacy_config_value(entry, CONF_ABRP_ENABLED, False))
    legacy_abrp_token = str(legacy_config_value(entry, CONF_ABRP_TOKEN, "") or "")
    device_registry = dr.async_get(hass)

    for vin, vehicle_data in vehicles.items():
        subentry = configured.get(vin)
        if subentry is None:
            vehicle = vehicle_data.get("vehicle") or {}
            model = str(vehicle.get("car_type") or "Leapmotor")
            nickname = str(vehicle.get("nickname") or "").strip()
            title = f"{nickname or model} (...{vin[-4:]})"
            single_vehicle = len(vehicles) == 1
            subentry = ConfigSubentry(
                data=MappingProxyType(
                    {
                        CONF_VIN: vin,
                        CONF_OPERATION_PASSWORD: legacy_pin
                        if migrating_legacy_settings
                        else DEFAULT_OPERATION_PASSWORD,
                        CONF_ABRP_ENABLED: legacy_abrp_enabled
                        if migrating_legacy_settings and single_vehicle
                        else False,
                        CONF_ABRP_TOKEN: legacy_abrp_token
                        if migrating_legacy_settings and single_vehicle
                        else "",
                    }
                ),
                subentry_type=SUBENTRY_TYPE_VEHICLE,
                title=title,
                unique_id=vin,
            )
            hass.config_entries.async_add_subentry(entry, subentry)
            configured[vin] = subentry

        if hasattr(device_registry, "async_get_device_by_identifier"):
            device = device_registry.async_get_device_by_identifier(
                (DOMAIN, vin), entry.entry_id
            )
            if device:
                device_registry.async_update_device(
                    device.id,
                    new_config_entry_id=entry.entry_id,
                    new_config_subentry_id=subentry.subentry_id,
                )
            continue

        # Home Assistant before 2026.8 stored main/subentry ownership as a set.
        if device := device_registry.async_get_device(identifiers={(DOMAIN, vin)}):
            device_registry.async_update_device(
                device.id,
                add_config_entry_id=entry.entry_id,
                add_config_subentry_id=subentry.subentry_id,
            )
            device_registry.async_update_device(
                device.id,
                remove_config_entry_id=entry.entry_id,
                remove_config_subentry_id=None,
            )


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        coordinator = hass.data[DOMAIN].pop(entry.entry_id)
        coordinator.cancel_scheduled_followup_refreshes()
        await coordinator.async_flush_location_signs()
        await coordinator.async_flush_analytics()
        await hass.async_add_executor_job(coordinator.client.close)
        if not hass.data.get(DOMAIN):
            _async_unregister_services(hass)
            await async_remove_panel(hass)
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the integration when options change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_services(hass: HomeAssistant) -> None:
    """Register Leapmotor domain services once."""

    specs = {spec.service_name: spec for spec in BUTTON_SPECS}
    specs["lock"] = LOCK_ACTION
    specs["unlock"] = UNLOCK_ACTION
    specs["cancel_climate_schedule"] = CANCEL_CLIMATE_SCHEDULE_ACTION
    specs["cancel_prepare_car_schedule"] = CANCEL_PREPARE_CAR_SCHEDULE_ACTION

    def resolve_call_target(call: ServiceCall) -> tuple[LeapmotorDataUpdateCoordinator, str]:
        """Resolve one Leapmotor service call to coordinator and VIN."""
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        target_vin = call.data.get("vin")
        entity_id = call.data.get("entity_id")
        if entity_id:
            state = hass.states.get(entity_id)
            if state:
                target_vin = state.attributes.get("vin") or target_vin
        for candidate in domain_data.values():
            if target_vin and target_vin not in (candidate.data.get("vehicles") or {}):
                continue
            try:
                resolved_vin = resolve_target_vin(candidate, target_vin)
            except Exception:
                continue
            return candidate, resolved_vin

        raise HomeAssistantError(
            "No matching Leapmotor vehicle found. Specify a VIN if multiple vehicles are configured."
        )

    async def handle_remote(service_action: str, call: ServiceCall) -> None:
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        action_spec = specs[service_action]

        coordinator = None
        target_vin = call.data.get("vin")
        entity_id = call.data.get("entity_id")
        if entity_id:
            state = hass.states.get(entity_id)
            if state:
                target_vin = state.attributes.get("vin") or target_vin
        for candidate in domain_data.values():
            if target_vin and target_vin not in (candidate.data.get("vehicles") or {}):
                continue
            try:
                resolved_vin = resolve_target_vin(candidate, target_vin)
            except Exception:
                continue
            coordinator = candidate
            target_vin = resolved_vin
            break

        if coordinator is None or not target_vin:
            raise HomeAssistantError(
                "No matching Leapmotor vehicle found. Specify a VIN if multiple vehicles are configured."
            )

        kwargs = None
        if "value" in call.data:
            kwargs = {"value": call.data["value"]}
        await async_execute_remote_action(coordinator, target_vin, action_spec, kwargs)

    async def handle_set_charge_limit(call: ServiceCall) -> None:
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        coordinator = None
        target_vin = call.data.get("vin")
        entity_id = call.data.get("entity_id")
        if entity_id:
            state = hass.states.get(entity_id)
            if state:
                target_vin = state.attributes.get("vin") or target_vin
        for candidate in domain_data.values():
            if target_vin and target_vin not in (candidate.data.get("vehicles") or {}):
                continue
            try:
                resolved_vin = resolve_target_vin(candidate, target_vin)
            except Exception:
                continue
            coordinator = candidate
            target_vin = resolved_vin
            break

        if coordinator is None or not target_vin:
            raise HomeAssistantError(
                "No matching Leapmotor vehicle found. Specify a VIN if multiple vehicles are configured."
            )

        try:
            result = await hass.async_add_executor_job(
                coordinator.client.set_charge_limit,
                target_vin,
                call.data["charge_limit_percent"],
            )
        except Exception as exc:
            message = format_remote_error(exc)
            coordinator.record_remote_action(
                target_vin,
                "set_charge_limit",
                success=False,
                error=message,
                cooldown=failure_starts_cooldown(exc),
            )
            raise remote_action_error(exc) from exc

        coordinator.record_remote_action(
            target_vin,
            "set_charge_limit",
            success=True,
            result=result,
        )
        await coordinator.async_request_refresh()
        coordinator.schedule_remote_followup_refresh(target_vin)

    async def handle_set_climate(call: ServiceCall) -> None:
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        coordinator = None
        target_vin = call.data.get("vin")
        entity_id = call.data.get("entity_id")
        if entity_id:
            state = hass.states.get(entity_id)
            if state:
                target_vin = state.attributes.get("vin") or target_vin
        for candidate in domain_data.values():
            if target_vin and target_vin not in (candidate.data.get("vehicles") or {}):
                continue
            try:
                resolved_vin = resolve_target_vin(candidate, target_vin)
            except Exception:
                continue
            coordinator = candidate
            target_vin = resolved_vin
            break

        if coordinator is None or not target_vin:
            raise HomeAssistantError(
                "No matching Leapmotor vehicle found. Specify a VIN if multiple vehicles are configured."
            )

        kwargs = {
            "mode": call.data["mode"],
            "temperature": call.data["temperature"],
            "fan_speed": call.data["fan_speed"],
            "recirculate": call.data["recirculate"],
            "windshield_defrost": call.data["windshield_defrost"],
        }
        await async_execute_remote_action(coordinator, target_vin, SET_CLIMATE_ACTION, kwargs)

    async def handle_set_climate_schedule(call: ServiceCall) -> None:
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        coordinator = None
        target_vin = call.data.get("vin")
        entity_id = call.data.get("entity_id")
        if entity_id:
            state = hass.states.get(entity_id)
            if state:
                target_vin = state.attributes.get("vin") or target_vin
        for candidate in domain_data.values():
            if target_vin and target_vin not in (candidate.data.get("vehicles") or {}):
                continue
            try:
                resolved_vin = resolve_target_vin(candidate, target_vin)
            except Exception:
                continue
            coordinator = candidate
            target_vin = resolved_vin
            break

        if coordinator is None or not target_vin:
            raise HomeAssistantError(
                "No matching Leapmotor vehicle found. Specify a VIN if multiple vehicles are configured."
            )

        kwargs = {
            "start_time": call.data["start_time"],
            "mode": call.data["mode"],
            "operate": call.data["operate"],
            "temperature": call.data["temperature"],
            "fan_speed": call.data["fan_speed"],
            "recirculate": call.data["recirculate"],
            "windshield_defrost": call.data["windshield_defrost"],
            "days": call.data["days"],
            "enabled": call.data["enabled"],
            "set_id": call.data.get("set_id"),
        }
        await async_execute_remote_action(
            coordinator,
            target_vin,
            SET_CLIMATE_SCHEDULE_ACTION,
            kwargs,
        )

    async def handle_prepare_car(call: ServiceCall) -> None:
        coordinator, target_vin = resolve_call_target(call)
        await async_execute_remote_action(
            coordinator,
            target_vin,
            PREPARE_CAR_ACTION,
            _prepare_car_kwargs(call.data),
        )

    async def handle_set_prepare_car_schedule(call: ServiceCall) -> None:
        coordinator, target_vin = resolve_call_target(call)
        kwargs = {
            "start_time": call.data["start_time"],
            "days": call.data["days"],
            "enabled": call.data["enabled"],
            "set_id": call.data.get("set_id"),
            **_prepare_car_kwargs(call.data),
        }
        await async_execute_remote_action(
            coordinator,
            target_vin,
            SET_PREPARE_CAR_SCHEDULE_ACTION,
            kwargs,
        )

    async def handle_send_destination(call: ServiceCall) -> None:
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        coordinator = None
        target_vin = call.data.get("vin")
        entity_id = call.data.get("entity_id")
        if entity_id:
            state = hass.states.get(entity_id)
            if state:
                target_vin = state.attributes.get("vin") or target_vin
        for candidate in domain_data.values():
            if target_vin and target_vin not in (candidate.data.get("vehicles") or {}):
                continue
            try:
                resolved_vin = resolve_target_vin(candidate, target_vin)
            except Exception:
                continue
            coordinator = candidate
            target_vin = resolved_vin
            break

        if coordinator is None or not target_vin:
            raise HomeAssistantError(
                "No matching Leapmotor vehicle found. Specify a VIN if multiple vehicles are configured."
            )

        destination_name = call.data["name"].strip()
        address = call.data.get("address", destination_name).strip()
        try:
            result = await hass.async_add_executor_job(
                partial(
                    coordinator.client.send_destination,
                    target_vin,
                    address=address,
                    address_name=destination_name,
                    latitude=call.data["latitude"],
                    longitude=call.data["longitude"],
                )
            )
        except Exception as exc:
            message = format_remote_error(exc)
            coordinator.record_remote_action(
                target_vin,
                "send_destination",
                success=False,
                error=message,
            )
            raise HomeAssistantError(message) from exc

        coordinator.record_remote_action(
            target_vin,
            "send_destination",
            success=True,
            result=result,
        )
        await coordinator.async_request_refresh()

    async def handle_export_diagnostics(call: ServiceCall) -> None:
        from .diagnostics import async_get_config_entry_diagnostics

        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")

        export: dict[str, object] = {
            "created_at": datetime.now(UTC).isoformat(),
            "entries": {},
        }
        for entry in hass.config_entries.async_entries(DOMAIN):
            if entry.entry_id not in domain_data:
                continue
            export["entries"][entry.entry_id] = await async_get_config_entry_diagnostics(
                hass,
                entry,
            )

        filename = str(call.data.get("filename") or "").strip()
        if not filename:
            timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
            filename = f"leapmotor-diagnostics-{timestamp}.json"
        filename = Path(filename).name
        if not filename.endswith(".json"):
            filename = f"{filename}.json"

        export_dir = Path(hass.config.path(STATIC_CERT_STORAGE_DIR))
        export_path = export_dir / filename
        await hass.async_add_executor_job(
            _write_json_export,
            export_path,
            export,
        )
        _LOGGER.info("Exported redacted Leapmotor diagnostics to %s", export_path)

    def make_handler(service_action: str):
        async def _handler(call: ServiceCall) -> None:
            await handle_remote(service_action, call)

        return _handler

    for service_name in ("lock", "unlock", *(spec.service_name for spec in BUTTON_SPECS)):
        hass.services.async_register(
            DOMAIN,
            service_name,
            make_handler(service_name),
            schema=_SERVICE_SCHEMAS.get(service_name, SERVICE_FIELDS),
        )
        _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, service_name)
    hass.services.async_register(
        DOMAIN,
        "set_climate",
        handle_set_climate,
        schema=SET_CLIMATE_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "set_climate")
    hass.services.async_register(
        DOMAIN,
        "set_climate_schedule",
        handle_set_climate_schedule,
        schema=SET_CLIMATE_SCHEDULE_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "set_climate_schedule")
    hass.services.async_register(
        DOMAIN,
        "cancel_climate_schedule",
        make_handler("cancel_climate_schedule"),
        schema=SERVICE_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "cancel_climate_schedule")
    hass.services.async_register(
        DOMAIN,
        "prepare_car",
        handle_prepare_car,
        schema=PREPARE_CAR_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "prepare_car")
    hass.services.async_register(
        DOMAIN,
        "set_prepare_car_schedule",
        handle_set_prepare_car_schedule,
        schema=PREPARE_CAR_SCHEDULE_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "set_prepare_car_schedule")
    hass.services.async_register(
        DOMAIN,
        "cancel_prepare_car_schedule",
        make_handler("cancel_prepare_car_schedule"),
        schema=SERVICE_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "cancel_prepare_car_schedule")
    hass.services.async_register(
        DOMAIN,
        "set_charge_limit",
        handle_set_charge_limit,
        schema=SET_CHARGE_LIMIT_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "set_charge_limit")
    hass.services.async_register(
        DOMAIN,
        "send_destination",
        handle_send_destination,
        schema=SEND_DESTINATION_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "send_destination")
    hass.services.async_register(
        DOMAIN,
        "export_diagnostics",
        handle_export_diagnostics,
        schema=EXPORT_DIAGNOSTICS_FIELDS,
    )
    _LOGGER.debug("Registered Leapmotor service %s.%s", DOMAIN, "export_diagnostics")

    async def handle_log_maintenance(call: ServiceCall) -> None:
        """Record a completed service (ported maintenance tracking)."""
        coordinator, vin = resolve_call_target(call)
        km = call.data.get("odometer_km")
        if km is None:
            status = ((coordinator.data or {}).get("vehicles", {}).get(vin) or {}).get("status") or {}
            try:
                km = float(status.get("odometer_km"))
            except (TypeError, ValueError):
                km = None
        when = datetime.now(UTC)
        if call.data.get("date"):
            try:
                when = datetime.fromisoformat(str(call.data["date"])).replace(tzinfo=UTC)
            except ValueError as exc:
                raise HomeAssistantError("Use the date format YYYY-MM-DD.") from exc
        await coordinator.async_log_maintenance(
            vin, call.data["service_type"], km=km, ts=when.timestamp()
        )

    async def handle_reset_maintenance(call: ServiceCall) -> None:
        """Forget a logged service so the on-schedule assumption applies again."""
        coordinator, vin = resolve_call_target(call)
        await coordinator.async_log_maintenance(
            vin, call.data["service_type"], km=None, ts=0, reset=True
        )

    def make_climate_preset_handler(kind: str):
        async def handler(call: ServiceCall) -> None:
            """Heat/cool the cabin with the vehicle preset; fields override it."""
            from .button import (
                PRECONDITION_CABIN_SPEC,
                PRECOOL_CABIN_SPEC,
                PREHEAT_CABIN_SPEC,
                outside_temperature,
            )
            from .vehicle_config import (
                precondition_settings_for_vehicle,
                precool_settings_for_vehicle,
                preheat_settings_for_vehicle,
            )

            coordinator, vin = resolve_call_target(call)
            if kind == "heat":
                spec, settings = PREHEAT_CABIN_SPEC, preheat_settings_for_vehicle(coordinator.config_entry, vin)
            elif kind == "cool":
                spec, settings = PRECOOL_CABIN_SPEC, precool_settings_for_vehicle(coordinator.config_entry, vin)
            else:
                vehicle_data = (coordinator.data or {}).get("vehicles", {}).get(vin) or {}
                spec = PRECONDITION_CABIN_SPEC
                settings = precondition_settings_for_vehicle(
                    coordinator.config_entry, vin, outside_temperature(vehicle_data)
                )
            for key in ("temperature", "fan_speed", "recirculate"):
                if key in call.data:
                    settings[key] = call.data[key]
            await async_execute_remote_action(coordinator, vin, spec, settings)

        return handler

    for service_name, kind in (("preheat_cabin", "heat"), ("precool_cabin", "cool"), ("precondition_cabin", "auto")):
        hass.services.async_register(
            DOMAIN, service_name, make_climate_preset_handler(kind), schema=PREHEAT_CABIN_FIELDS
        )
    hass.services.async_register(
        DOMAIN, "log_maintenance", handle_log_maintenance, schema=LOG_MAINTENANCE_FIELDS
    )
    hass.services.async_register(
        DOMAIN, "reset_maintenance", handle_reset_maintenance, schema=RESET_MAINTENANCE_FIELDS
    )

    async def handle_get_trips(call: ServiceCall) -> ServiceResponse:
        """Return the stored trip log (for exports and logbooks)."""
        coordinator, vin = resolve_call_target(call)
        trips = coordinator.export_trips(vin, call.data.get("limit", 500))
        return {"count": len(trips), "trips": trips}

    async def handle_get_charging_sessions(call: ServiceCall) -> ServiceResponse:
        """Return the charging sessions recorded here and by the cloud."""
        coordinator, vin = resolve_call_target(call)
        sessions = coordinator.export_sessions(vin, call.data.get("limit", 500))
        vehicle_data = (coordinator.data or {}).get("vehicles", {}).get(vin) or {}
        cloud = (vehicle_data.get("cloud_charging") or {}).get("sessions") or []
        return {"count": len(sessions), "sessions": sessions, "cloud_sessions": cloud}

    async def handle_refresh_cloud_data(call: ServiceCall) -> None:
        """Read software, schedules, charging history and invitations again now."""
        domain_data = hass.data.get(DOMAIN) or {}
        if not domain_data:
            raise HomeAssistantError("No Leapmotor config entry is loaded.")
        for coordinator in domain_data.values():
            coordinator.client.invalidate_extras()
            await coordinator.async_manual_refresh()

    def make_share_handler(accept: bool):
        async def handler(call: ServiceCall) -> ServiceResponse:
            """Accept or decline a car-share invitation waiting for the account."""
            domain_data = hass.data.get(DOMAIN) or {}
            if not domain_data:
                raise HomeAssistantError("No Leapmotor config entry is loaded.")
            vin_tail = call.data.get("vin_tail")
            wanted = str(vin_tail or "").upper()
            for entry_id, coordinator in domain_data.items():
                pending = (coordinator.data or {}).get("share_invitations") or []
                if not any(
                    not wanted or wanted.endswith(str(item.get("vin_tail") or "").upper())
                    or str(item.get("vin_tail") or "").upper().endswith(wanted)
                    for item in pending
                ):
                    continue
                try:
                    result = await hass.async_add_executor_job(
                        partial(coordinator.client.answer_share_invitation, vin_tail, accept=accept)
                    )
                except LeapmotorApiError as exc:
                    raise HomeAssistantError(str(exc)) from exc
                if accept:
                    # The shared car needs its own entities: load the entry again.
                    hass.async_create_task(hass.config_entries.async_reload(entry_id))
                else:
                    await coordinator.async_manual_refresh()
                return result if call.return_response else None
            raise HomeAssistantError("No matching car-share invitation is waiting.")

        return handler

    hass.services.async_register(
        DOMAIN, "get_trips", handle_get_trips, schema=GET_HISTORY_FIELDS,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN, "get_charging_sessions", handle_get_charging_sessions, schema=GET_HISTORY_FIELDS,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(DOMAIN, "refresh_cloud_data", handle_refresh_cloud_data)
    hass.services.async_register(
        DOMAIN, "accept_share_invitation", make_share_handler(True),
        schema=SHARE_INVITATION_FIELDS, supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, "decline_share_invitation", make_share_handler(False),
        schema=SHARE_INVITATION_FIELDS, supports_response=SupportsResponse.OPTIONAL,
    )


def _async_unregister_services(hass: HomeAssistant) -> None:
    """Remove Leapmotor domain services when the last entry unloads."""
    for service_name in ("lock", "unlock", *(spec.service_name for spec in BUTTON_SPECS)):
        if hass.services.has_service(DOMAIN, service_name):
            hass.services.async_remove(DOMAIN, service_name)
    if hass.services.has_service(DOMAIN, "set_climate"):
        hass.services.async_remove(DOMAIN, "set_climate")
    if hass.services.has_service(DOMAIN, "set_climate_schedule"):
        hass.services.async_remove(DOMAIN, "set_climate_schedule")
    if hass.services.has_service(DOMAIN, "cancel_climate_schedule"):
        hass.services.async_remove(DOMAIN, "cancel_climate_schedule")
    if hass.services.has_service(DOMAIN, "prepare_car"):
        hass.services.async_remove(DOMAIN, "prepare_car")
    if hass.services.has_service(DOMAIN, "set_prepare_car_schedule"):
        hass.services.async_remove(DOMAIN, "set_prepare_car_schedule")
    if hass.services.has_service(DOMAIN, "cancel_prepare_car_schedule"):
        hass.services.async_remove(DOMAIN, "cancel_prepare_car_schedule")
    if hass.services.has_service(DOMAIN, "set_charge_limit"):
        hass.services.async_remove(DOMAIN, "set_charge_limit")
    if hass.services.has_service(DOMAIN, "send_destination"):
        hass.services.async_remove(DOMAIN, "send_destination")
    if hass.services.has_service(DOMAIN, "export_diagnostics"):
        hass.services.async_remove(DOMAIN, "export_diagnostics")
    for service_name in (
        "log_maintenance", "reset_maintenance", "preheat_cabin", "precool_cabin",
        "precondition_cabin", *EXTRA_SERVICES,
    ):
        if hass.services.has_service(DOMAIN, service_name):
            hass.services.async_remove(DOMAIN, service_name)


def _write_json_export(path: Path, payload: object) -> None:
    """Write a JSON export file from an executor thread."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
