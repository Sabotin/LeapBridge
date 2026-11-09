"""VIN-scoped configuration helpers for multi-vehicle accounts."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

CONF_ABRP_ENABLED = "abrp_enabled"
CONF_ABRP_TOKEN = "abrp_token"
CONF_OPERATION_PASSWORD = "operation_password"
CONF_VIN = "vin"
CONF_BATTERY_REFERENCE_KWH = "battery_reference_kwh"
CONF_MAINTENANCE_SEVERE = "maintenance_severe_use"
CONF_PREHEAT_TEMPERATURE = "preheat_temperature"
CONF_PREHEAT_FAN = "preheat_fan_speed"
CONF_PREHEAT_RECIRCULATE = "preheat_recirculate"
CONF_PRECOOL_TEMPERATURE = "precool_temperature"
CONF_PRECOOL_FAN = "precool_fan_speed"
CONF_PRECOOL_RECIRCULATE = "precool_recirculate"
CONF_PRECONDITION_THRESHOLD = "precondition_cool_above"
CONF_SPEED_ALERT = "speed_alert_kmh"
SUBENTRY_TYPE_VEHICLE = "vehicle"


def vehicle_subentries(config_entry: Any) -> dict[str, Any]:
    """Return vehicle subentries indexed by VIN."""
    return {
        str(subentry.data[CONF_VIN]): subentry
        for subentry in config_entry.subentries.values()
        if subentry.subentry_type == SUBENTRY_TYPE_VEHICLE
        and subentry.data.get(CONF_VIN)
    }


def legacy_config_value(config_entry: Any, key: str, default: Any = None) -> Any:
    """Read a pre-0.7 option while old entries are being migrated."""
    if key in config_entry.options:
        return config_entry.options[key]
    return config_entry.data.get(key, default)


def operation_password_for_vehicle(config_entry: Any, vin: str) -> str | None:
    """Resolve the PIN for one VIN, with a legacy fallback."""
    subentry = vehicle_subentries(config_entry).get(vin)
    value = (
        subentry.data.get(CONF_OPERATION_PASSWORD)
        if subentry is not None
        else legacy_config_value(config_entry, CONF_OPERATION_PASSWORD, "")
    )
    value = str(value or "").strip()
    return value or None


def battery_reference_for_vehicle(config_entry: Any, vin: str) -> float | None:
    """Return the user-entered usable battery capacity (kWh) for one VIN."""
    subentry = vehicle_subentries(config_entry).get(vin)
    if subentry is None:
        return None
    try:
        value = float(subentry.data.get(CONF_BATTERY_REFERENCE_KWH) or 0)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


def maintenance_severe_use_for_vehicle(config_entry: Any, vin: str) -> bool:
    """Return whether the severe/city maintenance schedule applies to one VIN."""
    subentry = vehicle_subentries(config_entry).get(vin)
    return bool(subentry and subentry.data.get(CONF_MAINTENANCE_SEVERE))


def _vehicle_data(config_entry: Any, vin: str) -> Mapping[str, Any]:
    subentry = vehicle_subentries(config_entry).get(vin)
    return subentry.data if subentry is not None else {}


def _bounded(data: Mapping[str, Any], key: str, default: int, low: int, high: int) -> int:
    try:
        value = int(float(data.get(key, default)))
    except (TypeError, ValueError):
        return default
    return min(high, max(low, value))


def preheat_settings_for_vehicle(config_entry: Any, vin: str) -> dict[str, Any]:
    """Cabin preheat preset: heating, temperature, fan level, recirculation."""
    data = _vehicle_data(config_entry, vin)
    return {
        "mode": "hot",
        "temperature": _bounded(data, CONF_PREHEAT_TEMPERATURE, 22, 18, 32),
        "fan_speed": _bounded(data, CONF_PREHEAT_FAN, 7, 1, 7),
        "recirculate": bool(data.get(CONF_PREHEAT_RECIRCULATE, True)),
    }


def precool_settings_for_vehicle(config_entry: Any, vin: str) -> dict[str, Any]:
    """Cabin pre-cool preset: A/C cooling, lowest temperature, full fan by default."""
    data = _vehicle_data(config_entry, vin)
    return {
        "mode": "cold",
        "temperature": _bounded(data, CONF_PRECOOL_TEMPERATURE, 18, 18, 32),
        "fan_speed": _bounded(data, CONF_PRECOOL_FAN, 7, 1, 7),
        "recirculate": bool(data.get(CONF_PRECOOL_RECIRCULATE, True)),
    }


def precondition_settings_for_vehicle(
    config_entry: Any, vin: str, outside_temp_c: float | None
) -> dict[str, Any]:
    """Cool when it is warm outside, otherwise heat (unknown temperature: heat)."""
    threshold = _bounded(_vehicle_data(config_entry, vin), CONF_PRECONDITION_THRESHOLD, 20, 5, 40)
    if outside_temp_c is not None and outside_temp_c >= threshold:
        return precool_settings_for_vehicle(config_entry, vin)
    return preheat_settings_for_vehicle(config_entry, vin)


def speed_alert_for_vehicle(config_entry: Any, vin: str) -> int | None:
    """User speed-alert threshold in km/h for one VIN; None when off (0)."""
    value = _bounded(_vehicle_data(config_entry, vin), CONF_SPEED_ALERT, 0, 0, 250)
    return value or None


def abrp_config_for_vehicle(
    config_entry: Any,
    vin: str,
    *,
    vehicle_count: int,
) -> tuple[bool, str]:
    """Resolve ABRP settings without sending multiple cars to one legacy token."""
    subentry = vehicle_subentries(config_entry).get(vin)
    if subentry is not None:
        data: Mapping[str, Any] = subentry.data
        return bool(data.get(CONF_ABRP_ENABLED)), str(data.get(CONF_ABRP_TOKEN) or "").strip()

    if vehicle_count != 1:
        return False, ""
    return (
        bool(legacy_config_value(config_entry, CONF_ABRP_ENABLED, False)),
        str(legacy_config_value(config_entry, CONF_ABRP_TOKEN, "") or "").strip(),
    )
