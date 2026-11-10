"""Sensor entities for Leapmotor."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta, UTC
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    EntityCategory,
    PERCENTAGE,
    UnitOfElectricCurrent,
    UnitOfElectricPotential,
    UnitOfLength,
    UnitOfPower,
    UnitOfSpeed,
    UnitOfTemperature,
    UnitOfVolume,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .cloud_extras import next_schedule_run
from .const import DOMAIN
from .coordinator import LeapmotorDataUpdateCoordinator
from .entity_helpers import build_vehicle_display_name, vehicle_feature_supported
from .entity_migration import english_entity_slug

PRESSURE_BAR = "bar"
ENERGY_KWH = "kWh"
CONSUMPTION_KWH_PER_100KM = "kWh/100 km"
CONSUMPTION_MI_PER_KWH = "mi/kWh"
WHOLE_KILOMETER_KEYS = {
    "remaining_range_km",
    "fuel_range_km",
    "max_fuel_range_km",
    "combined_range_km",
    "max_combined_range_km",
    "cltc_range_km",
    "live_remaining_range_km",
    "odometer_km",
    "total_mileage_km",
    "last_7_days_mileage_km",
}
OPTIONAL_SENSOR_PATHS = {
    "fuel_level_percent": "status.fuel_level_percent",
    "fuel_level_liters": "status.fuel_level_liters",
    "fuel_average_consumption": "status.fuel_level_liters",
    "fuel_range_km": "status.fuel_range_km",
    "max_fuel_range_km": "status.max_fuel_range_km",
    "combined_range_km": "status.combined_range_km",
    "max_combined_range_km": "status.max_combined_range_km",
    "battery_percent_precise": "status.battery_percent_precise",
    "wltp_max_range_km": "status.wltp_max_range_km",
    "live_remaining_range_km": "status.live_remaining_range_km",
    "range_mode": "status.range_mode",
    "interior_temp_c": "status.interior_temp_c",
    "climate_set_temp_left_c": "status.climate_set_temp_left_c",
    "climate_set_temp_right_c": "status.climate_set_temp_right_c",
    "battery_min_temp_c": "diagnostics.battery_min_temp_c",
    "battery_thermal_request": "diagnostics.battery_thermal_request",
    "ptc_power_w": "diagnostics.ptc_power_w",
    "ptc_state": "diagnostics.ptc_state",
    "ptc_power_setting_value": "diagnostics.ptc_power_setting_value",
    "available_energy_kwh": "diagnostics.available_energy_kwh",
    "charging_planned_start": "charging.charging_planned_start",
    "charging_planned_end": "charging.charging_planned_end",
    "charging_planned_circulation": "charging.charging_planned_circulation",
    "charging_plan_updated_at": "charging.charging_plan_updated_at",
    "lock_state_age_seconds": "status.lock_state_age_seconds",
    "raw_lock_status_code": "status.raw_lock_status_code",
    "climate_mode": "diagnostics.climate_mode",
    "outdoor_temp_c": "diagnostics.outdoor_temp_c",
    "climate_fan_volume": "diagnostics.climate_fan_volume",
    "climate_fan_volume_setting": "diagnostics.climate_fan_volume_setting",
    "climate_air_direction": "diagnostics.climate_air_direction",
    "climate_cooling_heating_mode": "diagnostics.climate_cooling_heating_mode",
    "climate_min_single_temp_c": "diagnostics.climate_min_single_temp_c",
    "sunshade_position": "diagnostics.sunshade_position",
    "steering_wheel_heating_remaining_minutes": (
        "diagnostics.steering_wheel_heating_remaining_minutes"
    ),
    "driver_seat_heating_level": "diagnostics.driver_seat_heating_level",
    "passenger_seat_heating_level": "diagnostics.passenger_seat_heating_level",
    "driver_seat_ventilation_level": "diagnostics.driver_seat_ventilation_level",
    "passenger_seat_ventilation_level": "diagnostics.passenger_seat_ventilation_level",
    "speed_limit_kmh": "diagnostics.speed_limit_kmh",
    "average_consumption_6w_mi_kwh": "history.average_consumption_6w_mi_kwh",
    "last_charge_energy_kwh": "charging_history.last_charge_energy_kwh",
}


MONETARY_KEYS = {
    "last_charge_session_cost", "charging_cost_month", "driving_cost_month",
    "fuel_savings_month", "fuel_savings_total",
}
CURRENCY_PER_100KM_KEYS = {"driving_cost_per_100km"}
DAY_TOTAL_KEYS = {"trips_today_distance_km"}
MONTH_TOTAL_KEYS = {
    "trips_month_distance_km", "charging_cost_month", "charged_energy_month_kwh", "driving_cost_month",
    "fuel_savings_month", "co2_saved_month",
}
YEAR_TOTAL_KEYS = {"distance_this_year"}
#: Sensors that only make sense for the account that owns the car.
OWNER_ONLY_KEYS = {"software_version"}


def _analytics(data: dict[str, Any], *path: str) -> Any:
    """Read a value from the trip/charging analysis summary."""
    current: Any = data.get("analytics") or {}
    for part in path:
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _record_attrs(record: Any, *, skip: str) -> dict[str, Any]:
    if not isinstance(record, dict):
        return {}
    return {k: v for k, v in record.items() if k != skip}


def _iso_datetime(value: Any) -> datetime | None:
    """A timezone-aware datetime from an ISO string, else None."""
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _lifetime_consumption(data: dict[str, Any]) -> float | None:
    """kWh/100 km over the car's whole life, from the cloud's lifetime totals."""
    history = data.get("history") or {}
    try:
        km = float(history.get("total_mileage_km"))
        kwh = float(history.get("total_energy_kwh"))
    except (TypeError, ValueError):
        return None
    if km < 100 or kwh <= 0:
        return None
    value = kwh / km * 100
    return round(value, 1) if 5 <= value <= 60 else None


def _parked_since(data: dict[str, Any]) -> datetime | None:
    """When the last trip ended, while the car is not driving."""
    if (data.get("status") or {}).get("is_driving") is True or _analytics(data, "current_trip"):
        return None
    return _iso_datetime(_analytics(data, "last_trip", "end"))


def _home_charging_share(data: dict[str, Any]) -> float | None:
    month = _analytics(data, "month_charging") or {}
    home, public = month.get("home_energy_kwh"), month.get("public_energy_kwh")
    if home is None or public is None or home + public <= 0:
        return None
    return round(home / (home + public) * 100, 1)


def _earned_badges(data: dict[str, Any]) -> int | None:
    badges = _analytics(data, "achievements")
    if not isinstance(badges, list):
        return None
    return sum(1 for badge in badges if (badge.get("level") or 0) > 0)


def _curve_peak(data: dict[str, Any]) -> float | None:
    curve = _analytics(data, "charge_curve") or {}
    shown = curve.get("current") or curve.get("last") or {}
    powers = [point[1] for point in shown.get("points") or []]
    return max(powers) if powers else None


def _schedule_entries(data: dict[str, Any]) -> list[dict[str, Any]]:
    schedules = data.get("schedules") or {}
    return [
        entry
        for kind in ("climate", "prepare_car")
        for entry in schedules.get(kind) or []
    ]


@dataclass(frozen=True, kw_only=True)
class LeapmotorSensorEntityDescription(SensorEntityDescription):
    """Describes a Leapmotor sensor."""

    value_fn: Callable[[dict[str, Any]], Any]
    extra_attrs_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None


SENSOR_DESCRIPTIONS: tuple[LeapmotorSensorEntityDescription, ...] = (
    LeapmotorSensorEntityDescription(
        key="battery_percent",
        translation_key="battery_percent",
        native_unit_of_measurement=PERCENTAGE,
        device_class=SensorDeviceClass.BATTERY,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data["status"].get("battery_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="battery_percent_precise",
        translation_key="battery_percent_precise",
        native_unit_of_measurement=PERCENTAGE,
        device_class=SensorDeviceClass.BATTERY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("battery_percent_precise"),
    ),
    LeapmotorSensorEntityDescription(
        key="remaining_range_km",
        translation_key="remaining_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-distance",
        value_fn=lambda data: data["status"].get("remaining_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_level_liters",
        translation_key="fuel_level_liters",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.MEASUREMENT,
        device_class=SensorDeviceClass.VOLUME,
        suggested_display_precision=1,
        icon="mdi:gas-station",
        value_fn=lambda data: data["status"].get("fuel_level_liters"),
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_average_consumption",
        translation_key="fuel_average_consumption",
        native_unit_of_measurement="L/100km",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:gas-station",
        value_fn=lambda data: (
            (data["status"].get("fuel_level_liters") / data["status"].get("fuel_range_km") * 100.0)
            if data["status"].get("fuel_level_liters") is not None 
            and data["status"].get("fuel_range_km")
            else None
        ),
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_level_percent",
        translation_key="fuel_level_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:gas-station",
        value_fn=lambda data: data["status"].get("fuel_level_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_range_km",
        translation_key="fuel_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:gas-station",
        value_fn=lambda data: data["status"].get("fuel_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="max_fuel_range_km",
        translation_key="max_fuel_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:gas-station",
        value_fn=lambda data: data["status"].get("max_fuel_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="combined_range_km",
        translation_key="combined_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-distance",
        value_fn=lambda data: data["status"].get("combined_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="max_combined_range_km",
        translation_key="max_combined_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-distance",
        value_fn=lambda data: data["status"].get("max_combined_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="wltp_max_range_km",
        translation_key="wltp_max_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-radius",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
        value_fn=lambda data: data["status"].get("wltp_max_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="live_remaining_range_km",
        translation_key="live_remaining_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-distance",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
        value_fn=lambda data: data["status"].get("live_remaining_range_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="range_mode",
        translation_key="range_mode",
        icon="mdi:map-clock",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("range_mode"),
    ),
    LeapmotorSensorEntityDescription(
        key="odometer_km",
        translation_key="odometer_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=0,
        icon="mdi:counter",
        value_fn=lambda data: data["status"].get("odometer_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="speed_kmh",
        translation_key="speed_kmh",
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
        device_class=SensorDeviceClass.SPEED,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:speedometer",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("speed_kmh"),
    ),
    LeapmotorSensorEntityDescription(
        key="gear",
        translation_key="gear",
        icon="mdi:car-shift-pattern",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("gear"),
    ),
    LeapmotorSensorEntityDescription(
        key="interior_temp_c",
        translation_key="interior_temp_c",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data["status"].get("interior_temp_c"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_set_temp_left_c",
        translation_key="climate_set_temp_left_c",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data["status"].get("climate_set_temp_left_c"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_set_temp_right_c",
        translation_key="climate_set_temp_right_c",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data["status"].get("climate_set_temp_right_c"),
    ),
    LeapmotorSensorEntityDescription(
        key="charge_limit_percent",
        translation_key="charge_limit_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:battery-sync",
        value_fn=lambda data: data["charging"].get("charge_limit_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="remaining_charge_minutes",
        translation_key="remaining_charge_minutes",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:timer-outline",
        value_fn=lambda data: data["charging"].get("remaining_charge_minutes"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_finish_time",
        translation_key="charging_finish_time",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:battery-clock",
        value_fn=lambda data: _charging_finish_time(
            data["charging"].get("remaining_charge_minutes")
        ),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_power_kw",
        translation_key="charging_power_kw",
        native_unit_of_measurement=UnitOfPower.KILO_WATT,
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_power_kw"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_current_a",
        translation_key="charging_current_a",
        native_unit_of_measurement=UnitOfElectricCurrent.AMPERE,
        device_class=SensorDeviceClass.CURRENT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_current_a"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_voltage_v",
        translation_key="charging_voltage_v",
        native_unit_of_measurement=UnitOfElectricPotential.VOLT,
        device_class=SensorDeviceClass.VOLTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_voltage_v"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_connection_state",
        translation_key="charging_connection_state",
        icon="mdi:ev-plug-type2",
        value_fn=lambda data: data["charging"].get("connection_state"),
    ),
    LeapmotorSensorEntityDescription(
        key="evcc_status",
        translation_key="evcc_status",
        icon="mdi:ev-station",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: {
            "unplugged": "A",
            "plugged_in": "B",
            "charging": "C",
            "finished": "B",
        }.get(data["charging"].get("connection_state")),
    ),
    LeapmotorSensorEntityDescription(
        key="battery_min_temp_c",
        translation_key="battery_min_temp_c",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:thermometer-low",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("battery_min_temp_c"),
    ),
    LeapmotorSensorEntityDescription(
        key="battery_thermal_request",
        translation_key="battery_thermal_request",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:battery-heart",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("battery_thermal_request"),
    ),
    LeapmotorSensorEntityDescription(
        key="ptc_power_w",
        translation_key="ptc_power_w",
        native_unit_of_measurement=UnitOfPower.WATT,
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:heat-wave",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("ptc_power_w"),
    ),
    LeapmotorSensorEntityDescription(
        key="ptc_state",
        translation_key="ptc_state",
        icon="mdi:heat-wave",
        entity_registry_enabled_default=False,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("ptc_state"),
    ),
    LeapmotorSensorEntityDescription(
        key="ptc_power_setting_value",
        translation_key="ptc_power_setting_value",
        icon="mdi:heat-wave",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("ptc_power_setting_value"),
    ),
    LeapmotorSensorEntityDescription(
        key="available_energy_kwh",
        translation_key="available_energy_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        device_class=SensorDeviceClass.ENERGY_STORAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:battery-lightning",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("available_energy_kwh"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_planned_start",
        translation_key="charging_planned_start",
        icon="mdi:clock-start",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_planned_start"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_planned_end",
        translation_key="charging_planned_end",
        icon="mdi:clock-end",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_planned_end"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_planned_circulation",
        translation_key="charging_planned_circulation",
        icon="mdi:calendar-sync",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_planned_circulation"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_plan_updated_at",
        translation_key="charging_plan_updated_at",
        icon="mdi:calendar-edit",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging"].get("charging_plan_updated_at"),
    ),
    LeapmotorSensorEntityDescription(
        key="vehicle_state",
        translation_key="vehicle_state",
        icon="mdi:car-info",
        value_fn=lambda data: data["status"].get("vehicle_state"),
    ),
    LeapmotorSensorEntityDescription(
        key="lock_state_source",
        translation_key="lock_state_source",
        icon="mdi:lock-question",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("lock_state_source"),
    ),
    LeapmotorSensorEntityDescription(
        key="lock_state_age_seconds",
        translation_key="lock_state_age_seconds",
        native_unit_of_measurement=UnitOfTime.SECONDS,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:timer-lock",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("lock_state_age_seconds"),
    ),
    LeapmotorSensorEntityDescription(
        key="raw_lock_status_code",
        translation_key="raw_lock_status_code",
        icon="mdi:code-tags",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["status"].get("raw_lock_status_code"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_mode",
        translation_key="climate_mode",
        icon="mdi:air-conditioner",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("climate_mode"),
    ),
    LeapmotorSensorEntityDescription(
        key="ac_operation_mode",
        translation_key="ac_operation_mode",
        device_class=SensorDeviceClass.ENUM,
        options=["auto", "manual"],
        icon="mdi:air-conditioner",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("ac_operation_mode"),
    ),
    LeapmotorSensorEntityDescription(
        key="outdoor_temp_c",
        translation_key="outdoor_temp_c",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:thermometer",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("outdoor_temp_c"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_fan_volume",
        translation_key="climate_fan_volume",
        icon="mdi:fan",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("climate_fan_volume"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_fan_volume_setting",
        translation_key="climate_fan_volume_setting",
        icon="mdi:fan-auto",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("climate_fan_volume_setting"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_air_direction",
        translation_key="climate_air_direction",
        icon="mdi:arrow-decision",
        entity_registry_enabled_default=False,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("climate_air_direction"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_cooling_heating_mode",
        translation_key="climate_cooling_heating_mode",
        icon="mdi:hvac",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("climate_cooling_heating_mode"),
    ),
    LeapmotorSensorEntityDescription(
        key="climate_min_single_temp_c",
        translation_key="climate_min_single_temp_c",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:thermometer-low",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("climate_min_single_temp_c"),
    ),
    LeapmotorSensorEntityDescription(
        key="sunshade_position",
        translation_key="sunshade_position",
        icon="mdi:roller-shade",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("sunshade_position"),
    ),
    LeapmotorSensorEntityDescription(
        key="steering_wheel_heating_remaining_minutes",
        translation_key="steering_wheel_heating_remaining_minutes",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:steering",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("steering_wheel_heating_remaining_minutes"),
    ),
    LeapmotorSensorEntityDescription(
        key="driver_seat_heating_level",
        translation_key="driver_seat_heating_level",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:car-seat-heater",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("driver_seat_heating_level"),
    ),
    LeapmotorSensorEntityDescription(
        key="passenger_seat_heating_level",
        translation_key="passenger_seat_heating_level",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:car-seat-heater",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("passenger_seat_heating_level"),
    ),
    LeapmotorSensorEntityDescription(
        key="driver_seat_ventilation_level",
        translation_key="driver_seat_ventilation_level",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:car-seat-cooler",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("driver_seat_ventilation_level"),
    ),
    LeapmotorSensorEntityDescription(
        key="passenger_seat_ventilation_level",
        translation_key="passenger_seat_ventilation_level",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:car-seat-cooler",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("passenger_seat_ventilation_level"),
    ),
    LeapmotorSensorEntityDescription(
        key="speed_limit_kmh",
        translation_key="speed_limit_kmh",
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
        device_class=SensorDeviceClass.SPEED,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:speedometer",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("speed_limit_kmh"),
    ),
    LeapmotorSensorEntityDescription(
        key="front_left_window_position_percent",
        translation_key="front_left_window_position_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:window-open-variant",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("front_left_window_position_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="front_right_window_position_percent",
        translation_key="front_right_window_position_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:window-open-variant",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("front_right_window_position_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="rear_left_window_position_percent",
        translation_key="rear_left_window_position_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:window-open-variant",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("rear_left_window_position_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="rear_right_window_position_percent",
        translation_key="rear_right_window_position_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:window-open-variant",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("rear_right_window_position_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_successful_refresh",
        translation_key="last_successful_refresh",
        device_class=SensorDeviceClass.TIMESTAMP,
        entity_category=EntityCategory.DIAGNOSTIC,
        icon="mdi:clock-check-outline",
        value_fn=lambda data: _coordinator_timestamp(
            data.get("_integration", {}).get("last_successful_update_at")
        ),
    ),
    LeapmotorSensorEntityDescription(
        key="last_vehicle_update",
        translation_key="last_vehicle_update",
        device_class=SensorDeviceClass.TIMESTAMP,
        entity_category=EntityCategory.DIAGNOSTIC,
        icon="mdi:car-clock",
        value_fn=lambda data: _vehicle_timestamp(
            data["status"].get("last_vehicle_timestamp")
        ),
    ),
    LeapmotorSensorEntityDescription(
        key="total_mileage_km",
        translation_key="total_mileage_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=0,
        icon="mdi:chart-line",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("total_mileage_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="total_energy_kwh",
        translation_key="total_energy_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=0,
        icon="mdi:lightning-bolt",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("total_energy_kwh"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_7_days_mileage_km",
        translation_key="last_7_days_mileage_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:calendar-week",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("last_7_days_mileage_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_7_days_energy_kwh",
        translation_key="last_7_days_energy_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:calendar-week",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("last_7_days_energy_kwh"),
    ),
    LeapmotorSensorEntityDescription(
        key="average_consumption_6w_kwh_100km",
        translation_key="average_consumption_6w_kwh_100km",
        native_unit_of_measurement=CONSUMPTION_KWH_PER_100KM,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:chart-bar",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("average_consumption_6w_kwh_100km"),
    ),
    LeapmotorSensorEntityDescription(
        key="average_consumption_6w_mi_kwh",
        translation_key="average_consumption_6w_mi_kwh",
        native_unit_of_measurement=CONSUMPTION_MI_PER_KWH,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:chart-bar",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("average_consumption_6w_mi_kwh"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_week_driving_energy_percent",
        translation_key="last_week_driving_energy_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:car-electric",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("last_week_driving_energy_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_week_climate_energy_percent",
        translation_key="last_week_climate_energy_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:air-conditioner",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("last_week_climate_energy_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_week_other_energy_percent",
        translation_key="last_week_other_energy_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:lightning-bolt-outline",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("last_week_other_energy_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="today_driving_energy_percent",
        translation_key="today_driving_energy_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:car-electric",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("today_driving_energy_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="today_climate_energy_percent",
        translation_key="today_climate_energy_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:air-conditioner",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("today_climate_energy_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="today_other_energy_percent",
        translation_key="today_other_energy_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:lightning-bolt-outline",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["history"].get("today_other_energy_percent"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_charge_energy_kwh",
        translation_key="last_charge_energy_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        icon="mdi:battery-charging-outline",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["charging_history"].get("last_charge_energy_kwh"),
        extra_attrs_fn=lambda data: {
            "charge_type": data["charging_history"].get("last_charge_type"),
            "start_ts": data["charging_history"].get("last_charge_start_ts"),
            "end_ts": data["charging_history"].get("last_charge_end_ts"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="tire_pressure_front_left_bar",
        translation_key="tire_pressure_front_left_bar",
        native_unit_of_measurement=PRESSURE_BAR,
        device_class=SensorDeviceClass.PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("tire_pressure_front_left_bar"),
    ),
    LeapmotorSensorEntityDescription(
        key="tire_pressure_front_right_bar",
        translation_key="tire_pressure_front_right_bar",
        native_unit_of_measurement=PRESSURE_BAR,
        device_class=SensorDeviceClass.PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("tire_pressure_front_right_bar"),
    ),
    LeapmotorSensorEntityDescription(
        key="tire_pressure_rear_left_bar",
        translation_key="tire_pressure_rear_left_bar",
        native_unit_of_measurement=PRESSURE_BAR,
        device_class=SensorDeviceClass.PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("tire_pressure_rear_left_bar"),
    ),
    LeapmotorSensorEntityDescription(
        key="tire_pressure_rear_right_bar",
        translation_key="tire_pressure_rear_right_bar",
        native_unit_of_measurement=PRESSURE_BAR,
        device_class=SensorDeviceClass.PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data["diagnostics"].get("tire_pressure_rear_right_bar"),
    ),
    LeapmotorSensorEntityDescription(
        key="unread_message_count",
        translation_key="unread_message_count",
        icon="mdi:message-badge",
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: (data.get("notifications") or {}).get("unread_count"),
        extra_attrs_fn=lambda data: {
            "messages": (data.get("inbox") or {}).get("messages") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="last_message_title",
        translation_key="last_message_title",
        icon="mdi:message-text",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: (data.get("notifications") or {}).get("last_message_title"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_message_time",
        translation_key="last_message_time",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:message-clock",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: _message_timestamp(
            (data.get("notifications") or {}).get("last_message_time")
        ),
    ),
    # Trip log, charging sessions and battery health (ported from LeapConnect).
    LeapmotorSensorEntityDescription(
        key="last_trip_distance_km",
        translation_key="last_trip_distance_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:map-marker-path",
        value_fn=lambda data: _analytics(data, "last_trip", "distance_km"),
        extra_attrs_fn=lambda data: {
            **_record_attrs(_analytics(data, "last_trip"), skip="distance_km"),
            "current_trip": _analytics(data, "current_trip"),
            "recent_trips": _analytics(data, "recent_trips") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="last_trip_consumption_kwh_100km",
        translation_key="last_trip_consumption_kwh_100km",
        native_unit_of_measurement=CONSUMPTION_KWH_PER_100KM,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:car-electric-outline",
        value_fn=lambda data: _analytics(data, "last_trip", "consumption_kwh_100km"),
        extra_attrs_fn=lambda data: {
            "similar_trips": _analytics(data, "last_trip", "similar_trips"),
            "usual_consumption_kwh_100km": _analytics(data, "last_trip", "usual_consumption_kwh_100km"),
            "vs_usual_pct": _analytics(data, "last_trip", "vs_usual_pct"),
            "efficiency_by_temperature": _analytics(data, "efficiency_by_temperature") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="trips_today_distance_km",
        translation_key="trips_today_distance_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=1,
        icon="mdi:calendar-today",
        value_fn=lambda data: _analytics(data, "today", "distance_km"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "today"), skip="distance_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="trips_month_distance_km",
        translation_key="trips_month_distance_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        icon="mdi:calendar-month",
        value_fn=lambda data: _analytics(data, "month", "distance_km"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "month"), skip="distance_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="last_charge_session_energy_kwh",
        translation_key="last_charge_session_energy_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        device_class=SensorDeviceClass.ENERGY,
        suggested_display_precision=2,
        icon="mdi:ev-station",
        value_fn=lambda data: _analytics(data, "last_session", "energy_kwh"),
        extra_attrs_fn=lambda data: {
            **_record_attrs(_analytics(data, "last_session"), skip="energy_kwh"),
            "current_session": _analytics(data, "current_session"),
            "recent_sessions": _analytics(data, "recent_sessions") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="last_charge_session_cost",
        translation_key="last_charge_session_cost",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        icon="mdi:cash",
        value_fn=lambda data: _analytics(data, "last_session", "cost"),
    ),
    LeapmotorSensorEntityDescription(
        key="charging_cost_month",
        translation_key="charging_cost_month",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        icon="mdi:cash-multiple",
        value_fn=lambda data: _analytics(data, "month_charging", "cost"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "month_charging"), skip="cost"),
    ),
    LeapmotorSensorEntityDescription(
        key="charged_energy_month_kwh",
        translation_key="charged_energy_month_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=1,
        icon="mdi:battery-charging-high",
        value_fn=lambda data: _analytics(data, "month_charging", "energy_kwh"),
    ),
    LeapmotorSensorEntityDescription(
        key="battery_health_percent",
        translation_key="battery_health_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:battery-heart-variant",
        value_fn=lambda data: _analytics(data, "battery_health", "soh_pct"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "battery_health"), skip="soh_pct"),
    ),
    # Stage 2 (LeapConnect) and additions.
    LeapmotorSensorEntityDescription(
        key="next_maintenance",
        translation_key="next_maintenance",
        icon="mdi:wrench-clock",
        value_fn=lambda data: (_analytics(data, "maintenance", "next") or {}).get("label"),
        extra_attrs_fn=lambda data: {
            **_record_attrs(_analytics(data, "maintenance", "next"), skip="label"),
            "overdue": _analytics(data, "maintenance", "overdue"),
            "due_soon": _analytics(data, "maintenance", "due_soon"),
            "schedule": _analytics(data, "maintenance", "schedule"),
            "items": _analytics(data, "maintenance", "items") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="driving_cost_month",
        translation_key="driving_cost_month",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        icon="mdi:cash-fast",
        value_fn=lambda data: _analytics(data, "month", "cost"),
        extra_attrs_fn=lambda data: {
            "today": _analytics(data, "today", "cost"),
            "last_trip": _analytics(data, "last_trip", "cost"),
            "avg_price_kwh": _analytics(data, "avg_price_kwh"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="driving_cost_per_100km",
        translation_key="driving_cost_per_100km",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        icon="mdi:cash-marker",
        value_fn=lambda data: _analytics(data, "month", "cost_per_100km"),
    ),
    LeapmotorSensorEntityDescription(
        key="parked_drain_kwh_day",
        translation_key="parked_drain_kwh_day",
        native_unit_of_measurement="kWh/d",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        icon="mdi:battery-arrow-down-outline",
        value_fn=lambda data: _analytics(data, "parked_drain", "kwh_per_day"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "parked_drain"), skip="kwh_per_day"),
    ),
    LeapmotorSensorEntityDescription(
        key="energy_to_charge_limit_kwh",
        translation_key="energy_to_charge_limit_kwh",
        native_unit_of_measurement=ENERGY_KWH,
        device_class=SensorDeviceClass.ENERGY_STORAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:battery-charging-80",
        value_fn=lambda data: _analytics(data, "charge_plan", "energy_kwh"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "charge_plan"), skip="energy_kwh"),
    ),
    # Insights: what the car's own history says about tomorrow and the long run.
    LeapmotorSensorEntityDescription(
        key="real_range_km",
        translation_key="real_range_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-radius",
        value_fn=lambda data: _analytics(data, "real_range", "km"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "real_range"), skip="km"),
    ),
    LeapmotorSensorEntityDescription(
        key="range_at_charge_limit_km",
        translation_key="range_at_charge_limit_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:map-marker-check",
        value_fn=lambda data: _analytics(data, "real_range", "at_limit_km"),
        extra_attrs_fn=lambda data: {
            "full_km": _analytics(data, "real_range", "full_km"),
            "consumption_kwh_100km": _analytics(data, "real_range", "consumption_kwh_100km"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="next_departure",
        translation_key="next_departure",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:clock-start",
        value_fn=lambda data: _iso_datetime(_analytics(data, "habits", "next_departure", "at")),
        extra_attrs_fn=lambda data: {
            **{
                key: value
                for key, value in (_analytics(data, "habits", "next_departure") or {}).items()
                if key not in {"at", "in_minutes"}
            },
            "learned_from_weeks": _analytics(data, "habits", "weeks"),
            "weekdays": _analytics(data, "habits", "weekdays") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="next_day_distance_km",
        translation_key="next_day_distance_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        suggested_display_precision=0,
        icon="mdi:calendar-arrow-right",
        value_fn=lambda data: _analytics(data, "outlook", "expected_km"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "outlook"), skip="expected_km"),
    ),
    LeapmotorSensorEntityDescription(
        key="next_day_battery_needed",
        translation_key="next_day_battery_needed",
        native_unit_of_measurement=PERCENTAGE,
        suggested_display_precision=0,
        icon="mdi:battery-clock",
        value_fn=lambda data: _analytics(data, "outlook", "needed_soc"),
        extra_attrs_fn=lambda data: {
            "day": _analytics(data, "outlook", "day"),
            "expected_kwh": _analytics(data, "outlook", "expected_kwh"),
            "reserve_soc": _analytics(data, "outlook", "reserve_soc"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="eco_score",
        translation_key="eco_score",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:leaf",
        value_fn=lambda data: _analytics(data, "eco", "last"),
        extra_attrs_fn=lambda data: _record_attrs(_analytics(data, "eco"), skip="last"),
    ),
    LeapmotorSensorEntityDescription(
        key="eco_score_average",
        translation_key="eco_score_average",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:leaf-circle",
        value_fn=lambda data: _analytics(data, "eco", "average"),
        extra_attrs_fn=lambda data: {
            "trips": _analytics(data, "eco", "trips"),
            "previous_average": _analytics(data, "eco", "previous_average"),
            "best": _analytics(data, "eco", "best"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="frequent_routes",
        translation_key="frequent_routes",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:routes",
        value_fn=lambda data: (
            len(_analytics(data, "routes", "routes"))
            if isinstance(_analytics(data, "routes", "routes"), list) else None
        ),
        extra_attrs_fn=lambda data: {
            "routes": _analytics(data, "routes", "routes") or [],
            "places": _analytics(data, "routes", "places") or [],
            "place_count": _analytics(data, "routes", "place_count"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="battery_capacity_trend",
        translation_key="battery_capacity_trend",
        native_unit_of_measurement="%/y",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        icon="mdi:chart-line-variant",
        value_fn=lambda data: _analytics(data, "battery_forecast", "trend_pct_per_year"),
        extra_attrs_fn=lambda data: _record_attrs(
            _analytics(data, "battery_forecast"), skip="trend_pct_per_year"
        ),
    ),
    LeapmotorSensorEntityDescription(
        key="battery_health_in_one_year",
        translation_key="battery_health_in_one_year",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:battery-heart-outline",
        value_fn=lambda data: _analytics(data, "battery_forecast", "soh_in_1_year"),
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_savings_month",
        translation_key="fuel_savings_month",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        icon="mdi:piggy-bank",
        value_fn=lambda data: _analytics(data, "savings", "month", "saved"),
        extra_attrs_fn=lambda data: {
            **_record_attrs(_analytics(data, "savings", "month"), skip="saved"),
            **(_analytics(data, "savings", "assumptions") or {}),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_savings_total",
        translation_key="fuel_savings_total",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        icon="mdi:piggy-bank-outline",
        value_fn=lambda data: _analytics(data, "savings", "lifetime", "saved"),
        extra_attrs_fn=lambda data: _record_attrs(
            _analytics(data, "savings", "lifetime"), skip="saved"
        ),
    ),
    LeapmotorSensorEntityDescription(
        key="co2_saved_month",
        translation_key="co2_saved_month",
        native_unit_of_measurement="kg",
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        icon="mdi:molecule-co2",
        value_fn=lambda data: _analytics(data, "savings", "month", "co2_saved_kg"),
    ),
    LeapmotorSensorEntityDescription(
        key="co2_saved_total",
        translation_key="co2_saved_total",
        native_unit_of_measurement="kg",
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        icon="mdi:molecule-co2",
        value_fn=lambda data: _analytics(data, "savings", "lifetime", "co2_saved_kg"),
        extra_attrs_fn=lambda data: _analytics(data, "savings", "assumptions") or {},
    ),
    LeapmotorSensorEntityDescription(
        key="fuel_avoided_total_l",
        translation_key="fuel_avoided_total_l",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        device_class=SensorDeviceClass.VOLUME,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        icon="mdi:gas-station-off",
        value_fn=lambda data: _analytics(data, "savings", "lifetime", "fuel_litres"),
    ),
    LeapmotorSensorEntityDescription(
        key="distance_this_year",
        translation_key="distance_this_year",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        icon="mdi:calendar-star",
        value_fn=lambda data: _analytics(data, "journey", "year", "km"),
        extra_attrs_fn=lambda data: {
            "year": _analytics(data, "journey", "year"),
            "totals": _analytics(data, "journey", "totals"),
            "records": _analytics(data, "journey", "records"),
            "months": _analytics(data, "journey", "months") or [],
            "calendar": _analytics(data, "journey", "calendar"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="driving_streak_days",
        translation_key="driving_streak_days",
        native_unit_of_measurement=UnitOfTime.DAYS,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:fire",
        value_fn=lambda data: (
            (_analytics(data, "journey", "records", "current_streak_days") or 0)
            if _analytics(data, "journey") else None
        ),
        extra_attrs_fn=lambda data: {
            "best": _analytics(data, "journey", "records", "best_streak_days"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="longest_trip_km",
        translation_key="longest_trip_km",
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        suggested_display_precision=1,
        icon="mdi:map-marker-path",
        value_fn=lambda data: _analytics(data, "journey", "records", "longest_trip", "km"),
        extra_attrs_fn=lambda data: {
            "date": _analytics(data, "journey", "records", "longest_trip", "date"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="lifetime_trips",
        translation_key="lifetime_trips",
        state_class=SensorStateClass.TOTAL_INCREASING,
        icon="mdi:counter",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: _analytics(data, "journey", "totals", "trips"),
    ),
    LeapmotorSensorEntityDescription(
        key="lifetime_charging_sessions",
        translation_key="lifetime_charging_sessions",
        state_class=SensorStateClass.TOTAL_INCREASING,
        icon="mdi:counter",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: _analytics(data, "journey", "totals", "charging_sessions"),
    ),
    LeapmotorSensorEntityDescription(
        key="achievements",
        translation_key="achievements",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:trophy",
        value_fn=_earned_badges,
        extra_attrs_fn=lambda data: {"badges": _analytics(data, "achievements") or []},
    ),
    LeapmotorSensorEntityDescription(
        key="charging_curve",
        translation_key="charging_curve",
        native_unit_of_measurement=UnitOfPower.KILO_WATT,
        device_class=SensorDeviceClass.POWER,
        suggested_display_precision=1,
        icon="mdi:chart-bell-curve-cumulative",
        value_fn=_curve_peak,
        extra_attrs_fn=lambda data: {
            **(_analytics(data, "charge_curve") or {}),
            "usual_power_kw": _analytics(data, "charge_health", "usual_kw"),
        },
    ),
    LeapmotorSensorEntityDescription(
        key="home_charging_share_percent",
        translation_key="home_charging_share_percent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        icon="mdi:home-lightning-bolt",
        value_fn=_home_charging_share,
    ),
    LeapmotorSensorEntityDescription(
        key="parked_since",
        translation_key="parked_since",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:parking",
        value_fn=_parked_since,
    ),
    LeapmotorSensorEntityDescription(
        key="lifetime_consumption_kwh_100km",
        translation_key="lifetime_consumption_kwh_100km",
        native_unit_of_measurement=CONSUMPTION_KWH_PER_100KM,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:chart-timeline-variant",
        value_fn=_lifetime_consumption,
    ),
    LeapmotorSensorEntityDescription(
        key="average_daily_distance_km",
        translation_key="average_daily_distance_km",
        native_unit_of_measurement="km/d",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        icon="mdi:calendar-range",
        value_fn=lambda data: _analytics(data, "journey", "totals", "km_per_day"),
    ),
    # More from the cloud: software, charging history, schedules, permissions.
    LeapmotorSensorEntityDescription(
        key="software_version",
        translation_key="software_version",
        icon="mdi:car-cog",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: (data.get("software") or {}).get("installed_version"),
        extra_attrs_fn=lambda data: {
            key: (data.get("software") or {}).get(key)
            for key in ("installed_at", "update_available", "latest_version",
                        "update_size_mb", "update_packages", "reason")
        },
    ),
    LeapmotorSensorEntityDescription(
        key="cloud_charging_sessions",
        translation_key="cloud_charging_sessions",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:ev-station",
        value_fn=lambda data: (
            len((data.get("cloud_charging") or {}).get("sessions"))
            if isinstance((data.get("cloud_charging") or {}).get("sessions"), list) else None
        ),
        extra_attrs_fn=lambda data: {
            "window_days": (data.get("cloud_charging") or {}).get("window_days"),
            "month": (data.get("cloud_charging") or {}).get("month"),
            # Not "sessions": that name is the session count of another sensor.
            "cloud_sessions": (data.get("cloud_charging") or {}).get("sessions") or [],
        },
    ),
    LeapmotorSensorEntityDescription(
        key="next_scheduled_preconditioning",
        translation_key="next_scheduled_preconditioning",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:calendar-clock",
        value_fn=lambda data: None,
        extra_attrs_fn=lambda data: {
            "schedules": data.get("schedules") or {},
        },
    ),
    LeapmotorSensorEntityDescription(
        key="remote_permissions",
        translation_key="remote_permissions",
        icon="mdi:shield-key",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: (
            len((data.get("permissions") or {}).get("rights") or [])
            if (data.get("permissions") or {}).get("rights_known") else None
        ),
        extra_attrs_fn=lambda data: {
            key: (data.get("permissions") or {}).get(key)
            for key in ("shared", "rights", "modules", "abilities")
        },
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leapmotor sensors."""
    coordinator: LeapmotorDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    for vin, vehicle_data in coordinator.data.get("vehicles", {}).items():
        async_add_entities(
            [
                LeapmotorSensor(coordinator, vin, description)
                for description in SENSOR_DESCRIPTIONS
                if _should_create_sensor(vehicle_data, description.key)
            ],
            config_subentry_id=coordinator.config_subentry_id_for_vin(vin),
        )


class LeapmotorSensor(CoordinatorEntity[LeapmotorDataUpdateCoordinator], SensorEntity):
    """Leapmotor sensor."""

    entity_description: LeapmotorSensorEntityDescription
    _unrecorded_attributes = frozenset({
        "recent_trips", "recent_sessions", "current_trip", "current_session", "items",
        "efficiency_by_temperature",
        # Lists and tables the dashboard reads; they do not belong in the recorder.
        "weekdays", "routes", "places", "months", "calendar", "totals", "records", "badges",
        "current", "last", "usual", "messages", "cloud_sessions", "schedules", "departure",
        "rights", "modules", "abilities",
    })

    def __init__(
        self,
        coordinator: LeapmotorDataUpdateCoordinator,
        vin: str,
        description: LeapmotorSensorEntityDescription,
    ) -> None:
        super().__init__(coordinator)
        self.vin = vin
        self.entity_description = description
        self._attr_unique_id = f"{vin}_{description.key}"
        vehicle = self.vehicle_data["vehicle"]
        self._attr_has_entity_name = True
        self._attr_suggested_object_id = _suggested_object_id(
            vehicle,
            english_entity_slug("sensor", description.key) or description.key,
        )
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
        if not super().available:
            return False
        if self.entity_description.key in {"remaining_charge_minutes", "charging_finish_time"}:
            return bool(self.vehicle_data["charging"].get("is_charging"))
        return True

    @property
    def native_unit_of_measurement(self) -> str | None:
        """Use the Home Assistant currency for charging costs."""
        if self.entity_description.key in MONETARY_KEYS:
            hass = getattr(self, "hass", None)
            return hass.config.currency if hass is not None else None
        if self.entity_description.key in CURRENCY_PER_100KM_KEYS:
            hass = getattr(self, "hass", None)
            currency = hass.config.currency if hass is not None else None
            return f"{currency}/100 km" if currency else "/100 km"
        return super().native_unit_of_measurement

    @property
    def last_reset(self) -> datetime | None:
        """Daily and monthly totals restart at local midnight / the 1st."""
        key = self.entity_description.key
        if key not in DAY_TOTAL_KEYS and key not in MONTH_TOTAL_KEYS and key not in YEAR_TOTAL_KEYS:
            return None
        period = _analytics(self.vehicle_data, "period") or {}
        if key in YEAR_TOTAL_KEYS:
            start = _iso_datetime(period.get("month_start"))
            if start is None:
                return None
            # Local midnight on 1 January with January's own UTC offset, so the
            # value does not move when summer time starts or ends.
            return dt_util.start_of_local_day(datetime(start.year, 1, 1))
        value = period.get("day_start" if key in DAY_TOTAL_KEYS else "month_start")
        try:
            return datetime.fromisoformat(value) if value else None
        except (TypeError, ValueError):
            return None

    @property
    def native_value(self) -> Any:
        """Return the sensor value."""
        if self.entity_description.key == "last_successful_refresh":
            return _coordinator_timestamp(
                self.coordinator.integration_status.get("last_successful_update_at")
            )
        if self.entity_description.key == "next_scheduled_preconditioning":
            run = next_schedule_run(_schedule_entries(self.vehicle_data), dt_util.now())
            return _iso_datetime((run or {}).get("at"))
        value = self.entity_description.value_fn(self.vehicle_data)
        if self.entity_description.key in WHOLE_KILOMETER_KEYS:
            return _whole_number_if_possible(value)
        return value

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return useful vehicle metadata."""
        vehicle = self.vehicle_data["vehicle"]
        attributes = {
            "vin": self.vin,
            "car_id": vehicle.get("car_id"),
            "car_type": vehicle.get("car_type"),
            "is_shared": vehicle.get("is_shared"),
        }
        if self.entity_description.key == "battery_percent":
            # Set while the car sleeps and the level of its last complete status is shown.
            source = self.vehicle_data["status"].get("battery_percent_source")
            if source:
                attributes["source"] = source
        if self.entity_description.key == "charge_limit_percent":
            charging = self.vehicle_data["charging"]
            attributes.update({
                "source": charging.get("charge_limit_source"),
                "reliability": charging.get("charge_limit_reliability"),
            })
        if self.entity_description.key == "vehicle_state":
            status = self.vehicle_data["status"]
            attributes.update(
                {
                    "is_parked": status.get("is_parked"),
                    "vehicle_state_source": status.get("vehicle_state_source", "cloud"),
                    "stale_vehicle_state": status.get("stale_vehicle_state"),
                    "vehicle_state_age_seconds": status.get("vehicle_state_age_seconds"),
                    "vehicle_state_is_stale": status.get("vehicle_state_is_stale"),
                    "raw_ac_operation_mode_code": status.get(
                        "raw_ac_operation_mode_code"
                    ),
                    "raw_charge_connection_code": status.get(
                        "raw_charge_connection_code"
                    ),
                    "raw_ac_fan_speed_code": status.get("raw_ac_fan_speed_code"),
                    "raw_vehicle_state_code": status.get("raw_vehicle_state_code"),
                    "raw_parked_status_code": status.get("raw_parked_status_code"),
                }
            )
        if self.entity_description.key == "last_vehicle_update":
            status = self.vehicle_data["status"]
            attributes.update(
                {
                    "raw_vehicle_timestamp": status.get("last_vehicle_timestamp"),
                    "age_seconds": status.get("vehicle_state_age_seconds"),
                    "is_stale": status.get("vehicle_state_is_stale"),
                }
            )
        if self.entity_description.key in {
            "lock_state_source",
            "lock_state_age_seconds",
            "raw_lock_status_code",
        }:
            status = self.vehicle_data["status"]
            attributes.update(
                {
                    "is_locked": status.get("is_locked"),
                    "lock_state_source": status.get("lock_state_source"),
                    "lock_state_age_seconds": status.get("lock_state_age_seconds"),
                    "lock_state_is_stale": status.get("lock_state_is_stale"),
                    "raw_lock_status_code": status.get("raw_lock_status_code"),
                    "last_vehicle_timestamp": status.get("last_vehicle_timestamp"),
                }
            )
        if self.entity_description.key == "last_successful_refresh":
            integration = self.coordinator.integration_status
            attributes.update(
                {
                    "last_update_status": integration.get("last_update_status"),
                    "last_update_reason": integration.get("last_update_reason"),
                    "last_update_error_code": integration.get("last_update_error_code"),
                    "last_update_duration_seconds": integration.get("last_update_duration_seconds"),
                    "update_interval_seconds": integration.get("update_interval_seconds"),
                    "polling_mode": integration.get("polling_mode"),
                    "eco_polling_enabled": integration.get("eco_polling_enabled"),
                    "normal_update_interval_seconds": integration.get(
                        "normal_update_interval_seconds"
                    ),
                    "eco_update_interval_seconds": integration.get(
                        "eco_update_interval_seconds"
                    ),
                }
            )
        if self.entity_description.key in {
            "average_consumption_6w_kwh_100km",
            "average_consumption_6w_mi_kwh",
        }:
            history = self.vehicle_data["history"]
            attributes.update(
                {
                    "consumption_rank": history.get("consumption_rank"),
                    "weekly_consumption": history.get("weekly_consumption"),
                }
            )
        if self.entity_description.key in {
            "last_7_days_mileage_km",
            "last_7_days_energy_kwh",
        }:
            history = self.vehicle_data["history"]
            attributes.update(
                {
                    "energy_complete": history.get("last_7_days_energy_complete"),
                    "energy_source": "accumulatedEnergyConsume",
                    "energy_scope": "unconfirmed",
                    "energy_scope_confirmed": False,
                    "energy_unit": history.get("last_7_days_energy_unit"),
                    "energy_source_unit": history.get("last_7_days_energy_source_unit"),
                    "history_timezone": history.get("last_7_days_timezone"),
                    "energy_unavailable_reason": history.get("last_7_days_energy_unavailable_reason"),
                    "energy_precision": "as_reported_by_cloud",
                    "energy_complete_scope": "fields_and_mileage_coverage",
                    "detail_days": history.get("last_7_days_detail_days"),
                    "detail_mileage_km": history.get(
                        "last_7_days_detail_mileage_km"
                    ),
                    "covered_mileage_km": history.get(
                        "last_7_days_energy_covered_mileage_km"
                    ),
                    "period_mileage_km": history.get("last_7_days_mileage_km"),
                    "daily_detail": history.get("last_7_days_detail"),
                }
            )
        if self.entity_description.key in {
            "last_week_driving_energy_percent",
            "last_week_climate_energy_percent",
            "last_week_other_energy_percent",
        }:
            history = self.vehicle_data["history"]
            attributes.update(
                {
                    "driving_energy_kwh": history.get("last_week_driving_energy_kwh"),
                    "climate_energy_kwh": history.get("last_week_climate_energy_kwh"),
                    "other_energy_kwh": history.get("last_week_other_energy_kwh"),
                }
            )
        if self.entity_description.key in {
            "today_driving_energy_percent",
            "today_climate_energy_percent",
            "today_other_energy_percent",
        }:
            history = self.vehicle_data["history"]
            attributes.update(
                {
                    "driving_energy_kwh": history.get("today_driving_energy_kwh"),
                    "climate_energy_kwh": history.get("today_climate_energy_kwh"),
                    "other_energy_kwh": history.get("today_other_energy_kwh"),
                }
            )
        if self.entity_description.extra_attrs_fn is not None:
            attributes.update(self.entity_description.extra_attrs_fn(self.vehicle_data))
        return attributes


def _whole_number_if_possible(value: Any) -> Any:
    """Return int for whole numeric values to avoid unnecessary .00 display."""
    if value is None:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return value
    if numeric.is_integer():
        return int(numeric)
    return value


def _should_create_sensor(vehicle_data: dict[str, Any], key: str) -> bool:
    """Return whether a sensor is supported by the current vehicle payload."""
    if not vehicle_feature_supported(vehicle_data["vehicle"], key):
        return False
    if key in OWNER_ONLY_KEYS and (vehicle_data.get("vehicle") or {}).get("is_shared"):
        return False
    path = OPTIONAL_SENSOR_PATHS.get(key)
    if path is None:
        return True
    return _path_value(vehicle_data, path) is not None


def _path_value(data: dict[str, Any], path: str) -> Any:
    """Read a dotted path from nested dictionaries."""
    current: Any = data
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _suggested_object_id(vehicle: dict[str, Any], slug: str) -> str:
    """Return a stable English suggested object id independent from UI language."""
    prefix = str(vehicle.get("car_type") or "leapmotor").strip().lower()
    prefix = "".join(char if char.isalnum() else "_" for char in prefix).strip("_")
    return f"{prefix or 'leapmotor'}_{slug}"


def _coordinator_timestamp(value: Any) -> datetime | None:
    """Return a timezone-aware datetime from a UNIX timestamp."""
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(float(value), tz=UTC)
    except (TypeError, ValueError, OSError):
        return None


def _message_timestamp(value: Any) -> datetime | None:
    """Return a timezone-aware datetime from a message API timestamp."""
    if value is None:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        if not isinstance(value, str):
            return None
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)
    if numeric > 10_000_000_000:
        numeric /= 1000
    try:
        return datetime.fromtimestamp(numeric, tz=UTC)
    except (OSError, ValueError):
        return None


def _vehicle_timestamp(value: Any) -> datetime | None:
    """Return the timestamp of the latest data received from the vehicle."""
    try:
        if float(value) <= 0:
            return None
    except (TypeError, ValueError):
        pass
    return _message_timestamp(value)


def _charging_finish_time(remaining_minutes: Any) -> datetime | None:
    """Return estimated charging finish time based on remaining charge minutes."""
    try:
        minutes = int(remaining_minutes)
    except (TypeError, ValueError):
        return None
    if minutes <= 0:
        return None
    return datetime.now(tz=UTC) + timedelta(minutes=minutes)
