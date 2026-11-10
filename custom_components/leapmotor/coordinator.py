"""Data coordinator for Leapmotor."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from functools import partial
import logging
import time
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from . import insights
from .abrp import build_abrp_telemetry, send_abrp_telemetry
from .api import LeapmotorApiClient
from .cert_download import CERT_REPOSITORY_URL
from .const import (
    CONF_FUEL_CONSUMPTION,
    CONF_FUEL_PRICE,
    CONF_GRID_CO2,
    CONF_LOW_TARIFF_END,
    CONF_LOW_TARIFF_START,
    CONF_LOW_TARIFF_WEEKENDS,
    CONF_PRICE_HOME,
    CONF_PRICE_HOME_LOW,
    CONF_PRICE_PUBLIC_AC,
    CONF_PRICE_PUBLIC_DC,
    DEFAULT_ABRP_API_KEY,
    DEFAULT_STATE_STALE_SECONDS,
    DOMAIN,
    EVENT_LEAPMOTOR,
    REMOTE_ACTION_COOLDOWN_SECONDS,
)
from .leap_api import (
    LeapmotorAccountCertError,
    LeapmotorApiError,
    LeapmotorAuthError,
    LeapmotorMissingAppCertError,
)
from . import battery_memory
from .drive_analytics import (
    STORAGE_VERSION as ANALYTICS_STORAGE_VERSION,
    TIER_HOME,
    TIER_PUBLIC_AC,
    TIER_PUBLIC_DC,
    DriveAnalytics,
    haversine_m,
    price_session,
    speed_alert,
)
from .location import CoordinateResolution, resolve_coordinate
from .maintenance_catalog import items_for_vehicle, load_catalog
from .vehicle_config import (
    abrp_config_for_vehicle,
    battery_reference_for_vehicle,
    maintenance_severe_use_for_vehicle,
    operation_password_for_vehicle,
    speed_alert_for_vehicle,
    vehicle_subentries,
)

_LOGGER = logging.getLogger(__name__)

GPS_SIGN_STORAGE_VERSION = 1
BATTERY_MEMORY_STORAGE_VERSION = 1
#: A charging car changes its values every poll; they are written at most this often.
BATTERY_MEMORY_SAVE_DELAY_SECONDS = 60


def _minutes(value: Any) -> int | None:
    """Minutes after midnight from 'HH:MM' or 'HH:MM:SS'."""
    try:
        parts = str(value).split(":")
        hours, minutes = int(parts[0]), int(parts[1])
    except (TypeError, ValueError, IndexError):
        return None
    if 0 <= hours < 24 and 0 <= minutes < 60:
        return hours * 60 + minutes
    return None

ANALYTICS_SAVE_DELAY_SECONDS = 60
DEFAULT_HOME_RADIUS_M = 100.0
#: Car events waiting for the event entity (e.g. from the poll at startup).
MAX_PENDING_EVENTS = 20
#: Extra tolerance on a zone radius for GPS jitter.
ZONE_MARGIN_M = 50.0



#: The cloud lists a newly accepted shared car a few seconds after the answer.
SHARE_RELOAD_DELAY_SECONDS = 8
MISSING_CERTIFICATES_ISSUE_PREFIX = "missing_app_cert_"


def missing_certificates_issue_id(entry_id: str) -> str:
    """Repair shown while an account cannot log in without app certificates."""
    return f"{MISSING_CERTIFICATES_ISSUE_PREFIX}{entry_id}"


@callback
def async_reload_after_share_accept(hass: HomeAssistant, entry_id: str) -> None:
    """Load the entry again once the accepted car had time to appear."""

    @callback
    def _reload(_now: Any = None) -> None:
        if hass.config_entries.async_get_entry(entry_id) is not None:
            hass.async_create_task(hass.config_entries.async_reload(entry_id))

    if SHARE_RELOAD_DELAY_SECONDS <= 0:
        _reload()
    else:
        async_call_later(hass, SHARE_RELOAD_DELAY_SECONDS, _reload)


class LeapmotorDataUpdateCoordinator(DataUpdateCoordinator[dict]):
    """Fetch Leapmotor vehicle data."""

    def __init__(
        self,
        *,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        client: LeapmotorApiClient,
        update_interval: timedelta,
        eco_polling_enabled: bool = False,
        eco_update_interval: timedelta | None = None,
        driving_update_interval: timedelta | None = None,
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            config_entry=config_entry,
            update_interval=update_interval,
        )
        self.client = client
        self._normal_update_interval = update_interval
        self._eco_polling_enabled = eco_polling_enabled
        self._eco_update_interval = eco_update_interval or update_interval
        self._driving_update_interval = min(
            driving_update_interval or update_interval, update_interval
        )
        self._polling_mode = "normal"
        self._lock_state_overrides: dict[str, tuple[bool, float]] = {}
        self._last_remote_results: dict[str, dict[str, Any]] = {}
        # None until the first update says whether the certificates are there.
        self._missing_certificates_reported: bool | None = None
        self._last_abrp_results: dict[str, dict[str, Any]] = {}
        self._last_vehicle_states: dict[str, str] = {}
        self._followup_refresh_tasks: dict[str, asyncio.Task[None]] = {}
        self._location_signs: dict[str, dict[str, int]] = {}
        self._location_sign_pending: dict[tuple[str, str], int] = {}
        self._location_sign_store = Store[dict[str, dict[str, int]]](
            hass,
            GPS_SIGN_STORAGE_VERSION,
            f"{DOMAIN}.gps_signs.{config_entry.entry_id}",
        )
        self._location_sign_save_task: asyncio.Task[None] | None = None
        # Battery level and cable state of the last complete status, per VIN.
        self._battery_memory: dict[str, dict[str, Any]] = {}
        self._battery_memory_store = Store[dict[str, dict[str, Any]]](
            hass,
            BATTERY_MEMORY_STORAGE_VERSION,
            f"{DOMAIN}.battery_memory.{config_entry.entry_id}",
        )
        self._analytics = DriveAnalytics()
        self._pending_events: dict[str, list[dict[str, Any]]] = {}
        self._maintenance_catalog: dict[str, Any] = {"packs": {}}
        self._analytics_store = Store[dict[str, Any]](
            hass,
            ANALYTICS_STORAGE_VERSION,
            f"{DOMAIN}.analytics.{config_entry.entry_id}",
        )
        self._integration_status: dict[str, Any] = {
            "last_update_status": "unknown",
            "last_update_success": None,
            "last_update_error": None,
            "last_update_error_code": None,
            "last_update_started_at": None,
            "last_update_completed_at": None,
            "last_successful_update_at": None,
            "last_update_duration_seconds": None,
            "last_update_reason": "startup",
            "update_interval_seconds": int(update_interval.total_seconds()),
            "normal_update_interval_seconds": int(update_interval.total_seconds()),
            "eco_update_interval_seconds": int(self._eco_update_interval.total_seconds()),
            "driving_update_interval_seconds": int(self._driving_update_interval.total_seconds()),
            "eco_polling_enabled": self._eco_polling_enabled,
            "polling_mode": self._polling_mode,
            "vehicle_count": 0,
        }
        self._pending_update_reason = "startup"

    def refresh_vehicle_configuration(self) -> None:
        """Apply current VIN-scoped settings to the shared API client."""
        vins = set(vehicle_subentries(self.config_entry))
        if self.data:
            vins.update((self.data.get("vehicles") or {}).keys())
        self.client.set_vehicle_operation_passwords(
            {
                vin: operation_password_for_vehicle(self.config_entry, vin)
                for vin in vins
            }
        )

    def operation_password_configured(self, vin: str) -> bool:
        """Return whether remote control is configured for one vehicle."""
        return bool(operation_password_for_vehicle(self.config_entry, vin))

    def config_subentry_id_for_vin(self, vin: str) -> str | None:
        """Return the Home Assistant subentry owning one vehicle."""
        subentry = vehicle_subentries(self.config_entry).get(vin)
        return subentry.subentry_id if subentry else None

    async def async_load_location_signs(self) -> None:
        """Load remembered GPS hemisphere signs before the first poll."""
        stored = await self._location_sign_store.async_load() or {}
        if not isinstance(stored, dict):
            stored = {}
        self._location_signs = {
            str(vin): {
                axis: int(sign)
                for axis, sign in signs.items()
                if axis in {"latitude", "longitude"} and sign in {-1, 1}
            }
            for vin, signs in stored.items()
            if isinstance(signs, dict)
        }

    async def async_load_battery_memory(self) -> None:
        """Load the last complete battery status, so a restart keeps it while the car sleeps."""
        self._battery_memory = battery_memory.from_storage(
            await self._battery_memory_store.async_load()
        )

    def battery_memory_for(self, vin: str) -> dict[str, Any] | None:
        """Return what the last complete status of this car said, for diagnostics."""
        memory = self._battery_memory.get(vin)
        return dict(memory) if memory else None

    def _apply_battery_memory(self, data: dict[str, Any]) -> None:
        """Keep battery level and cable state across the reduced status of a sleeping car."""
        if battery_memory.update(self._battery_memory, data.get("vehicles"), time.time()):
            self._battery_memory_store.async_delay_save(
                lambda: {vin: dict(memory) for vin, memory in self._battery_memory.items()},
                BATTERY_MEMORY_SAVE_DELAY_SECONDS,
            )

    async def async_load_analytics(self) -> None:
        """Load the trip log, charging sessions and full-charge history."""
        stored = await self._analytics_store.async_load()
        self._analytics = DriveAnalytics(stored if isinstance(stored, dict) else None)
        self._maintenance_catalog = await self.hass.async_add_executor_job(load_catalog)

    def _maintenance_plan(self, vin: str, vehicle_data: dict[str, Any]) -> tuple[str, list[dict[str, Any]]]:
        status = vehicle_data.get("status") or {}
        is_reev = status.get("fuel_level_percent") is not None or status.get("fuel_range_km") is not None
        return items_for_vehicle(
            self._maintenance_catalog,
            (vehicle_data.get("vehicle") or {}).get("car_type"),
            is_reev=is_reev,
            severe_use=maintenance_severe_use_for_vehicle(self.config_entry, vin),
        )

    async def async_log_maintenance(
        self, vin: str, service_type: str, *, km: float | None, ts: float, reset: bool = False
    ) -> None:
        """Log (or forget) a completed service and refresh the summaries."""
        if reset:
            self._analytics.reset_maintenance(vin, service_type)
        else:
            self._analytics.log_maintenance(vin, service_type, km=km, ts=ts)
        if self.data:
            self._apply_analytics(self.data)
            self.async_set_updated_data(self.data)
        await self.async_flush_analytics()

    async def async_flush_analytics(self) -> None:
        """Write analytics immediately, e.g. before unloading."""
        await self._analytics_store.async_save(self._analytics.as_storage())

    def _analytics_home(self) -> tuple[float, float, float] | None:
        zone = self.hass.states.get("zone.home")
        attrs = zone.attributes if zone is not None else {}
        lat = attrs.get("latitude", getattr(self.hass.config, "latitude", None))
        lon = attrs.get("longitude", getattr(self.hass.config, "longitude", None))
        try:
            radius = float(attrs.get("radius") or DEFAULT_HOME_RADIUS_M)
            return float(lat), float(lon), radius
        except (TypeError, ValueError):
            return None

    def _analytics_prices(self) -> dict[str, float]:
        options = self.config_entry.options
        prices: dict[str, float] = {}
        for tier, key in (
            (TIER_HOME, CONF_PRICE_HOME),
            (TIER_PUBLIC_AC, CONF_PRICE_PUBLIC_AC),
            (TIER_PUBLIC_DC, CONF_PRICE_PUBLIC_DC),
        ):
            try:
                value = float(options.get(key) or 0)
            except (TypeError, ValueError):
                continue
            if value > 0:
                prices[tier] = value
        low = options.get(CONF_PRICE_HOME_LOW)
        start = _minutes(options.get(CONF_LOW_TARIFF_START))
        end = _minutes(options.get(CONF_LOW_TARIFF_END))
        try:
            low_value = float(low or 0)
        except (TypeError, ValueError):
            low_value = 0.0
        if low_value > 0 and start is not None and end is not None:
            prices["home_low"] = low_value
            prices["low_band"] = {
                "start_min": start,
                "end_min": end,
                "weekends": bool(options.get(CONF_LOW_TARIFF_WEEKENDS)),
            }
        return prices

    def _analytics_zones(self) -> list[dict[str, Any]]:
        """Home Assistant zones, for naming the places the car drives between."""
        zones: list[dict[str, Any]] = []
        for state in self.hass.states.async_all("zone"):
            attrs = state.attributes
            try:
                zones.append(
                    {
                        "name": str(attrs.get("friendly_name") or state.name),
                        "lat": float(attrs["latitude"]),
                        "lon": float(attrs["longitude"]),
                        "radius": float(attrs.get("radius") or DEFAULT_HOME_RADIUS_M),
                        "home": state.entity_id == "zone.home",
                    }
                )
            except (KeyError, TypeError, ValueError):
                continue
        return zones

    def _fuel_comparison(self) -> dict[str, Any]:
        """Fuel price, comparison consumption and grid CO2 from the options."""
        options = self.config_entry.options
        result: dict[str, Any] = {}
        for key, option in (
            ("price", CONF_FUEL_PRICE),
            ("l_100km", CONF_FUEL_CONSUMPTION),
            ("grid_co2_g_kwh", CONF_GRID_CO2),
        ):
            try:
                value = float(options.get(option)) if options.get(option) is not None else None
            except (TypeError, ValueError):
                value = None
            result[key] = value
        return result

    def _label_cloud_charging(
        self,
        vin: str,
        vehicle_data: dict[str, Any],
        *,
        zones: list[dict[str, Any]],
        prices: dict[str, Any],
        tz: Any,
        month_start_ts: float,
    ) -> None:
        """Give the cloud's charging sessions a place, a tier and a cost.

        The cached list from the client is never changed; a new one is built.
        The result keeps the start and end times, so labelling it again (the
        analysis also runs between polls, e.g. after logging a service) gives
        the same result.
        """
        block = vehicle_data.get("cloud_charging") or {}
        sessions = block.get("sessions")
        if not isinstance(sessions, list):
            return
        signs = self._location_signs.get(vin) or {}
        home = self._analytics_home()
        labelled: list[dict[str, Any]] = []
        month = {"sessions": 0, "energy_kwh": 0.0, "cost": 0.0, "home_energy_kwh": 0.0,
                 "public_energy_kwh": 0.0}
        priced = False
        for session in sessions:
            lat, lon = session.get("lat"), session.get("lon")
            if lat is not None and lon is not None:
                # The cloud may report absolute values; use the remembered hemisphere.
                if lat > 0 and signs.get("latitude") == -1:
                    lat = -lat
                if lon > 0 and signs.get("longitude") == -1:
                    lon = -lon
            at_home = bool(
                home is not None and lat is not None and lon is not None
                and haversine_m(lat, lon, home[0], home[1]) <= home[2] + ZONE_MARGIN_M
            )
            tier = (
                TIER_HOME if at_home
                else TIER_PUBLIC_DC if session.get("type") == "dc"
                else TIER_PUBLIC_AC
            )
            place = None
            if lat is not None and lon is not None:
                best: tuple[float, str] | None = None
                for zone in zones:
                    distance = haversine_m(lat, lon, zone["lat"], zone["lon"])
                    if distance <= zone["radius"] + ZONE_MARGIN_M and (
                        best is None or distance < best[0]
                    ):
                        best = (distance, zone["name"])
                place = best[1] if best else None
            energy = session.get("energy_kwh")
            start_ts, end_ts = session.get("start_ts"), session.get("end_ts")
            cost = None
            # Without a position the tier is a guess, so no cost is given.
            if lat is not None and energy is not None and start_ts is not None:
                cost, _price = price_session(
                    {"tier": tier, "energy_kwh": energy, "start": start_ts, "end": end_ts or start_ts},
                    prices,
                    tz,
                )
            labelled.append(
                {
                    "start": session.get("start"),
                    "end": session.get("end"),
                    "start_ts": start_ts,
                    "end_ts": end_ts,
                    "duration_min": session.get("duration_min"),
                    "energy_kwh": energy,
                    "type": session.get("type"),
                    "avg_power_kw": session.get("avg_power_kw"),
                    "tier": tier if lat is not None else None,
                    "place": place,
                    "cost": cost,
                    "lat": round(lat, 4) if lat is not None else None,
                    "lon": round(lon, 4) if lon is not None else None,
                }
            )
            if start_ts is not None and start_ts >= month_start_ts:
                month["sessions"] += 1
                if energy is not None:
                    month["energy_kwh"] += energy
                    key = "home_energy_kwh" if at_home else "public_energy_kwh"
                    month[key] += energy
                if cost is not None:
                    month["cost"] += cost
                    priced = True
        vehicle_data["cloud_charging"] = {
            "sessions": labelled,
            "window_days": block.get("window_days"),
            "month": {
                "sessions": month["sessions"],
                "energy_kwh": round(month["energy_kwh"], 2),
                "cost": round(month["cost"], 2) if priced else None,
                "home_energy_kwh": round(month["home_energy_kwh"], 2),
                "public_energy_kwh": round(month["public_energy_kwh"], 2),
            },
        }

    def _apply_insights(
        self,
        vin: str,
        vehicle_data: dict[str, Any],
        summary: dict[str, Any],
        *,
        now_ts: float,
        tz: Any,
        zones: list[dict[str, Any]],
        prices: dict[str, Any],
    ) -> None:
        """Habits, outlook, routes, journey and events on top of the analysis."""
        limit = speed_alert(vehicle_data, speed_alert_for_vehicle(self.config_entry, vin))
        trips = self._analytics.trips(vin)
        result = insights.compute(
            trips=trips,
            sessions=self._analytics.sessions(vin),
            buffer=self._analytics.buffer(vin),
            full_charge=self._analytics.full_charges(vin),
            summary=summary,
            vehicle=vehicle_data,
            extra=self._analytics.extra(vin),
            now_ts=now_ts,
            tz=tz,
            zones=zones,
            prices=prices,
            reference_kwh=battery_reference_for_vehicle(self.config_entry, vin),
            speed_limit_kmh=limit.get("threshold_kmh"),
            fuel=self._fuel_comparison(),
        )
        events = result.pop("events", [])
        summary.update(result)
        # The trip rows were copied before the scores were given: add them.
        scores = {
            datetime.fromtimestamp(trip["start"], tz=UTC).isoformat(timespec="seconds"): trip
            for trip in trips[-60:]
            if trip.get("eco_score") is not None
        }
        for row in [summary.get("last_trip"), *(summary.get("recent_trips") or [])]:
            scored = scores.get((row or {}).get("start"))
            if scored is not None:
                row["eco_score"] = scored["eco_score"]
                row["eco_vs_usual_pct"] = scored.get("eco_vs_usual_pct")
        if events:
            queue = self._pending_events.setdefault(vin, [])
            queue.extend(events)
            del queue[:-MAX_PENDING_EVENTS]
            for event in events:
                self.hass.bus.async_fire(EVENT_LEAPMOTOR, {"vin": vin, **event})

    def pop_events(self, vin: str) -> list[dict[str, Any]]:
        """Car events that have not been handed to the event entity yet."""
        return self._pending_events.pop(vin, [])

    def export_trips(self, vin: str, limit: int = 500) -> list[dict[str, Any]]:
        """The stored trip log, newest first, with zone names where known."""
        zones = insights.usable_zones(self._analytics_zones())
        rows: list[dict[str, Any]] = []
        for trip in reversed(self._analytics.trips(vin)[-max(1, limit):]):
            row = {key: value for key, value in trip.items() if not key.startswith("_")}
            for key in ("start", "end"):
                if isinstance(row.get(key), (int, float)):
                    row[key] = datetime.fromtimestamp(row[key], tz=UTC).isoformat(timespec="seconds")
            row["from"], row["to"] = insights.trip_place_names(trip, zones)
            rows.append(row)
        return rows

    def export_sessions(self, vin: str, limit: int = 500) -> list[dict[str, Any]]:
        """The stored charging sessions, newest first."""
        rows: list[dict[str, Any]] = []
        for session in reversed(self._analytics.sessions(vin)[-max(1, limit):]):
            row = {key: value for key, value in session.items() if not key.startswith("_")}
            for key in ("start", "end"):
                if isinstance(row.get(key), (int, float)):
                    row[key] = datetime.fromtimestamp(row[key], tz=UTC).isoformat(timespec="seconds")
            rows.append(row)
        return rows

    def _apply_analytics(self, data: dict) -> None:
        """Feed this poll into the trip/charging/battery-health analysis."""
        tz = dt_util.get_time_zone(self.hass.config.time_zone) or UTC
        home = self._analytics_home()
        prices = self._analytics_prices()
        zones = self._analytics_zones()
        now_ts = time.time()
        for vin, vehicle_data in (data.get("vehicles") or {}).items():
            try:
                schedule, items = self._maintenance_plan(vin, vehicle_data)
                vehicle_data["analytics"] = self._analytics.update(
                    vin,
                    vehicle_data,
                    now_ts=now_ts,
                    tz=tz,
                    home=home,
                    prices=prices,
                    reference_kwh=battery_reference_for_vehicle(self.config_entry, vin),
                    maintenance_items=items,
                    maintenance_schedule=schedule,
                )
            except Exception:  # noqa: BLE001 - analytics must never break polling
                _LOGGER.warning("Leapmotor trip/charging analysis failed", exc_info=True)
                vehicle_data["analytics"] = {}
                continue
            try:
                self._apply_insights(
                    vin, vehicle_data, vehicle_data["analytics"],
                    now_ts=now_ts, tz=tz, zones=zones, prices=prices,
                )
            except Exception:  # noqa: BLE001 - insights must never break polling
                _LOGGER.warning("Leapmotor insights failed", exc_info=True)
            try:
                month_start = datetime.fromtimestamp(now_ts, tz=tz).replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                self._label_cloud_charging(
                    vin, vehicle_data, zones=zones, prices=prices, tz=tz,
                    month_start_ts=month_start.timestamp(),
                )
            except Exception:  # noqa: BLE001 - optional data must never break polling
                _LOGGER.warning("Leapmotor charging history could not be labelled", exc_info=True)
                vehicle_data["cloud_charging"] = {"sessions": None, "window_days": None, "month": None}
        self._analytics_store.async_delay_save(
            self._analytics.as_storage, ANALYTICS_SAVE_DELAY_SECONDS
        )

    async def _async_backfill_history(self, data: dict) -> None:
        """Fetch one window of older daily history per poll until it is complete.

        The cloud keeps per-day distance and energy from before the
        integration was installed; it is read once, a quarter of a year at a
        time, and then kept up to date from the regular 7-day history.
        """
        tz = dt_util.get_time_zone(self.hass.config.time_zone) or UTC
        today = datetime.now(tz).date()
        for vin in (data.get("vehicles") or {}):
            try:
                extra = self._analytics.extra(vin)
                window = insights.backfill_request(extra, today=today)
                if window is None:
                    continue
                begin = datetime(window[0].year, window[0].month, window[0].day, tzinfo=tz)
                end = datetime(
                    window[1].year, window[1].month, window[1].day, tzinfo=tz
                ) + timedelta(days=1) - timedelta(seconds=1)
                rows = await self.hass.async_add_executor_job(
                    partial(
                        self.client.fetch_daily_history,
                        vin,
                        begin_ms=int(begin.timestamp() * 1000),
                        end_ms=int(end.timestamp() * 1000),
                    )
                )
                insights.backfill_result(extra, window, rows)
            except Exception:  # noqa: BLE001 - history is optional
                _LOGGER.debug("Leapmotor daily history backfill failed", exc_info=True)

    def _apply_speed_alerts(self, data: dict) -> None:
        """Compare each car's speed with its alert speed or own speed limit."""
        for vin, vehicle_data in (data.get("vehicles") or {}).items():
            vehicle_data["speed_alert"] = speed_alert(
                vehicle_data, speed_alert_for_vehicle(self.config_entry, vin)
            )

    async def async_flush_location_signs(self) -> None:
        """Wait for a pending GPS sign write before unloading."""
        task = self._location_sign_save_task
        if task and not task.done():
            await task

    def remote_action_cooldown_remaining(self, vin: str) -> int:
        """Return remaining remote-action cooldown seconds for one vehicle."""
        last_result = self._last_remote_results.get(vin)
        if not last_result or last_result.get("cooldown") is False:
            return 0
        updated_at = last_result.get("updated_at")
        if not isinstance(updated_at, (int, float)):
            return 0
        remaining = REMOTE_ACTION_COOLDOWN_SECONDS - (time.time() - updated_at)
        return max(0, int(remaining + 0.999))

    async def _async_update_data(self) -> dict:
        started_at = time.time()
        update_reason = self._pending_update_reason
        self._pending_update_reason = "poll"
        try:
            data = await self.hass.async_add_executor_job(self.client.fetch_data)
        except LeapmotorApiError as exc:
            error_code = self._classify_error(str(exc))
            if error_code == "invalid_auth" and not isinstance(exc, LeapmotorAuthError):
                error_code = "api_error"
            self._integration_status = {
                "last_update_status": "error",
                "last_update_success": False,
                "last_update_error": str(exc),
                "last_update_error_code": error_code,
                "last_update_started_at": started_at,
                "last_update_completed_at": time.time(),
                "last_successful_update_at": self._integration_status.get("last_successful_update_at"),
                "last_update_duration_seconds": round(time.time() - started_at, 3),
                "last_update_reason": update_reason,
                "update_interval_seconds": int(self.update_interval.total_seconds())
                if self.update_interval
                else self._integration_status.get("update_interval_seconds"),
                "normal_update_interval_seconds": int(self._normal_update_interval.total_seconds()),
                "eco_update_interval_seconds": int(self._eco_update_interval.total_seconds()),
                "driving_update_interval_seconds": int(self._driving_update_interval.total_seconds()),
                "eco_polling_enabled": self._eco_polling_enabled,
                "polling_mode": self._polling_mode,
                "vehicle_count": self._integration_status.get("vehicle_count", 0),
            }
            if isinstance(exc, LeapmotorMissingAppCertError):
                self._async_report_missing_certificates(True)
            if isinstance(exc, LeapmotorAuthError) and not isinstance(
                exc, (LeapmotorAccountCertError, LeapmotorMissingAppCertError)
            ):
                raise ConfigEntryAuthFailed(str(exc)) from exc
            raise UpdateFailed(str(exc)) from exc
        self._async_report_missing_certificates(False)
        # First, so everything below works with the kept values.
        self._apply_battery_memory(data)
        self._stabilize_vehicle_states(data)
        self._apply_state_freshness(data)
        self._normalize_locations(data)
        self._apply_analytics(data)
        if self.data is not None:
            # Not on the first refresh, so setup is never slowed down by it.
            await self._async_backfill_history(data)
        self._apply_speed_alerts(data)
        self._update_polling_interval(data)
        self._integration_status = {
            "last_update_status": "ok",
            "last_update_success": True,
            "last_update_error": None,
            "last_update_error_code": None,
            "last_update_started_at": started_at,
            "last_update_completed_at": time.time(),
            "last_successful_update_at": time.time(),
            "last_update_duration_seconds": round(time.time() - started_at, 3),
            "last_update_reason": update_reason,
            "update_interval_seconds": int(self.update_interval.total_seconds())
            if self.update_interval
            else None,
            "normal_update_interval_seconds": int(self._normal_update_interval.total_seconds()),
            "eco_update_interval_seconds": int(self._eco_update_interval.total_seconds()),
            "driving_update_interval_seconds": int(self._driving_update_interval.total_seconds()),
            "eco_polling_enabled": self._eco_polling_enabled,
            "polling_mode": self._polling_mode,
            "vehicle_count": len((data.get("vehicles") or {})),
        }
        await self._async_push_abrp(data)
        self._apply_lock_state_overrides(data)
        self._apply_remote_results(data)
        self._apply_abrp_results(data)
        self._apply_integration_status(data)
        _LOGGER.debug(
            "Leapmotor update completed: reason=%s vehicles=%s polling_mode=%s duration=%ss",
            update_reason,
            self._integration_status.get("vehicle_count"),
            self._polling_mode,
            self._integration_status.get("last_update_duration_seconds"),
        )
        return data

    @property
    def integration_status(self) -> dict[str, Any]:
        """Return the current integration-wide update status."""
        return dict(self._integration_status)

    async def async_manual_refresh(self) -> None:
        """Force an immediate manual refresh outside the normal polling cadence."""
        self._pending_update_reason = "manual"
        await self.async_request_refresh()

    def schedule_remote_followup_refresh(
        self,
        vin: str,
        *,
        delay_seconds: float = 4.0,
    ) -> None:
        """Schedule one coalesced refresh after remote-command state has settled."""
        previous_task = self._followup_refresh_tasks.pop(vin, None)
        if previous_task and not previous_task.done():
            previous_task.cancel()
        self._followup_refresh_tasks[vin] = self.hass.async_create_task(
            self._async_remote_followup_refresh(vin, delay_seconds)
        )

    @callback
    def _async_report_missing_certificates(self, missing: bool) -> None:
        """Show or clear the repair that offers to download the app certificates."""
        if missing == self._missing_certificates_reported:
            return
        issue_id = missing_certificates_issue_id(self.config_entry.entry_id)
        try:
            if missing:
                ir.async_create_issue(
                    self.hass,
                    DOMAIN,
                    issue_id,
                    is_fixable=True,
                    is_persistent=False,
                    severity=ir.IssueSeverity.ERROR,
                    translation_key="missing_app_cert",
                    translation_placeholders={"repository": CERT_REPOSITORY_URL},
                    data={"entry_id": self.config_entry.entry_id},
                )
            else:
                ir.async_delete_issue(self.hass, DOMAIN, issue_id)
        except Exception:  # noqa: BLE001 - a hint only, never break the update
            _LOGGER.debug("Could not update the missing-certificate repair", exc_info=True)
            return
        self._missing_certificates_reported = missing

    def cancel_scheduled_followup_refreshes(self) -> None:
        """Cancel pending delayed refreshes during unload."""
        for task in self._followup_refresh_tasks.values():
            if not task.done():
                task.cancel()
        self._followup_refresh_tasks.clear()

    def set_lock_state_override(
        self,
        vin: str,
        is_locked: bool,
        *,
        ttl_seconds: int = 120,
    ) -> None:
        """Temporarily prefer confirmed remote-control state over stale cloud status."""
        self._lock_state_overrides[vin] = (is_locked, time.time() + ttl_seconds)
        if self.data:
            data = dict(self.data)
            self._apply_single_lock_override(data, vin, is_locked)
            self.async_set_updated_data(data)

    async def _async_remote_followup_refresh(
        self,
        vin: str,
        delay_seconds: float,
    ) -> None:
        """Refresh shortly after a command because vehicle signals can lag."""
        try:
            await asyncio.sleep(delay_seconds)
            self._pending_update_reason = "remote_followup"
            await self.async_request_refresh()
        except asyncio.CancelledError:
            raise
        except Exception:
            _LOGGER.debug(
                "Leapmotor follow-up refresh failed for VIN %s",
                vin,
                exc_info=True,
            )
        finally:
            current_task = asyncio.current_task()
            if self._followup_refresh_tasks.get(vin) is current_task:
                self._followup_refresh_tasks.pop(vin, None)

    def record_remote_action(
        self,
        vin: str,
        action: str,
        *,
        success: bool,
        result: dict[str, Any] | None = None,
        error: str | None = None,
        cooldown: bool = True,
    ) -> None:
        """Store the last remote-control result for diagnostics and attributes.

        ``cooldown=False`` marks a failure that never reached the car, so the
        next command is not held back by the remote-action cooldown.
        """
        if success and "schedule" in str(action) and "charging" not in str(action):
            # A climate or prepare-car schedule was changed: read them back on the
            # next poll. (The charging schedule is read back by the client itself.)
            for kind in ("climate", "battery_heating", "prepare_car"):
                self.client.invalidate_extras(f"schedule_{kind}")
        remote_data = (result or {}).get("data") if isinstance(result, dict) else None
        info = {
            "action": action,
            "success": success,
            "status": "success" if success else "failed",
            "updated_at": time.time(),
            "api_code": (result or {}).get("code") if isinstance(result, dict) else None,
            "api_message": (result or {}).get("message") if isinstance(result, dict) else None,
            "remote_ctl_id": remote_data.get("remoteCtlId") if isinstance(remote_data, dict) else None,
            "error": error,
            "cooldown": cooldown,
        }
        self._last_remote_results[vin] = info
        if self.data:
            data = dict(self.data)
            self._apply_single_remote_result(data, vin, info)
            self.async_set_updated_data(data)

    def _apply_lock_state_overrides(self, data: dict[str, Any]) -> None:
        """Apply non-expired optimistic lock states to freshly fetched data."""
        now = time.time()
        expired = [
            vin for vin, (_, expires_at) in self._lock_state_overrides.items()
            if expires_at <= now
        ]
        for vin in expired:
            self._lock_state_overrides.pop(vin, None)

        for vin, (is_locked, _) in self._lock_state_overrides.items():
            self._apply_single_lock_override(data, vin, is_locked)

    def _apply_remote_results(self, data: dict[str, Any]) -> None:
        """Apply remembered remote-control results to freshly fetched data."""
        for vin, info in self._last_remote_results.items():
            self._apply_single_remote_result(data, vin, info)

    def _apply_abrp_results(self, data: dict[str, Any]) -> None:
        """Apply remembered ABRP telemetry results to freshly fetched data."""
        for vin, info in self._last_abrp_results.items():
            vehicle_data = (data.get("vehicles") or {}).get(vin)
            if vehicle_data:
                vehicle_data["abrp"] = dict(info)

    def _apply_integration_status(self, data: dict[str, Any]) -> None:
        """Expose the current update status inside the coordinator payload."""
        data["_integration"] = dict(self._integration_status)

    def _update_polling_interval(self, data: dict[str, Any]) -> None:
        """Poll faster while a car drives; slower only when every car is idle."""
        previous_mode = self._polling_mode
        if (
            self._driving_update_interval < self._normal_update_interval
            and _any_vehicle_driving(data)
        ):
            target_interval, mode = self._driving_update_interval, "driving"
        elif self._eco_polling_enabled and _all_vehicles_quiet(data):
            target_interval, mode = self._eco_update_interval, "eco"
        else:
            target_interval, mode = self._normal_update_interval, "normal"
        self.update_interval = target_interval
        self._polling_mode = mode
        if self._polling_mode != previous_mode:
            _LOGGER.debug(
                "Leapmotor polling mode changed from %s to %s (interval=%ss)",
                previous_mode,
                self._polling_mode,
                int(target_interval.total_seconds()),
            )

    def _apply_state_freshness(self, data: dict[str, Any]) -> None:
        """Mark critical states as stale when the cloud timestamp is too old."""
        for vehicle_data in (data.get("vehicles") or {}).values():
            status = vehicle_data.get("status") or {}
            location = vehicle_data.get("location") or {}
            age_seconds = _state_age_seconds(status.get("last_vehicle_timestamp"))
            is_stale = age_seconds is not None and age_seconds > DEFAULT_STATE_STALE_SECONDS

            status["lock_state_age_seconds"] = age_seconds
            status["lock_state_is_stale"] = is_stale
            if is_stale:
                status["lock_state_source"] = "cloud_stale"
                if status.get("is_locked") is False:
                    status["is_locked"] = None
            elif status.get("is_locked") is not None and status.get("lock_state_source") is None:
                status["lock_state_source"] = "cloud"

            status["vehicle_state_age_seconds"] = age_seconds
            status["vehicle_state_is_stale"] = is_stale
            if is_stale:
                status["stale_vehicle_state"] = status.get("vehicle_state")
                status["vehicle_state"] = None
                status["is_parked"] = None
                status["vehicle_state_source"] = "cloud_stale"

            location["location_age_seconds"] = age_seconds
            location["location_is_stale"] = is_stale
            if location.get("location_source") is None:
                location["location_source"] = "cloud_stale" if is_stale else "cloud"

    def _normalize_locations(self, data: dict[str, Any]) -> None:
        """Resolve API coordinates and retain authoritative signs per VIN."""
        home_latitude = _safe_float(getattr(self.hass.config, "latitude", None))
        home_longitude = _safe_float(getattr(self.hass.config, "longitude", None))
        signs_changed = False
        for vin, vehicle_data in (data.get("vehicles") or {}).items():
            location = vehicle_data.get("location") or {}
            location["raw_latitude"] = location.get("latitude")
            location["raw_longitude"] = location.get("longitude")

            signed_latitude = location.pop("_signed_latitude", None)
            signed_longitude = location.pop("_signed_longitude", None)
            unsigned_latitude = location.pop("_unsigned_latitude", None)
            unsigned_longitude = location.pop("_unsigned_longitude", None)
            raw_latitude = _safe_float(
                signed_latitude if signed_latitude is not None else unsigned_latitude
            )
            raw_longitude = _safe_float(
                signed_longitude if signed_longitude is not None else unsigned_longitude
            )

            vehicle_signs = self._location_signs.setdefault(vin, {})
            if _should_flip_southern_latitude(
                raw_latitude,
                raw_longitude,
                home_latitude,
                home_longitude,
            ) and "latitude" not in vehicle_signs:
                vehicle_signs["latitude"] = -1
                signs_changed = True

            if _should_flip_western_longitude(
                raw_latitude,
                raw_longitude,
                home_latitude,
                home_longitude,
            ) and "longitude" not in vehicle_signs:
                vehicle_signs["longitude"] = -1
                signs_changed = True

            latitude = self._resolve_location_axis(
                vin, "latitude", signed_latitude, unsigned_latitude
            )
            longitude = self._resolve_location_axis(
                vin, "longitude", signed_longitude, unsigned_longitude
            )
            if latitude.sign is not None and vehicle_signs.get("latitude") != latitude.sign:
                vehicle_signs["latitude"] = latitude.sign
                signs_changed = True
            if longitude.sign is not None and vehicle_signs.get("longitude") != longitude.sign:
                vehicle_signs["longitude"] = longitude.sign
                signs_changed = True

            location["latitude"] = latitude.value
            location["longitude"] = longitude.value
            location["latitude_corrected"] = (
                latitude.value is not None
                and raw_latitude is not None
                and latitude.value != raw_latitude
            )
            location["longitude_corrected"] = (
                longitude.value is not None
                and raw_longitude is not None
                and longitude.value != raw_longitude
            )
            location["latitude_correction_source"] = latitude.source
            location["longitude_correction_source"] = longitude.source

        if signs_changed:
            self._schedule_location_sign_save()

    def _resolve_location_axis(
        self,
        vin: str,
        axis: str,
        signed_value: object,
        unsigned_value: object,
    ) -> CoordinateResolution:
        """Resolve and track one coordinate axis for a vehicle."""
        pending_key = (vin, axis)
        result = resolve_coordinate(
            signed_value=signed_value,
            unsigned_value=unsigned_value,
            remembered_sign=self._location_signs.get(vin, {}).get(axis),
            pending_flip_count=self._location_sign_pending.get(pending_key, 0),
        )
        if result.pending_flip_count:
            self._location_sign_pending[pending_key] = result.pending_flip_count
        else:
            self._location_sign_pending.pop(pending_key, None)
        return result

    def _schedule_location_sign_save(self) -> None:
        """Persist changed signs without delaying a coordinator refresh."""
        if self._location_sign_save_task and not self._location_sign_save_task.done():
            return
        self._location_sign_save_task = self.hass.async_create_task(
            self._async_save_location_signs()
        )

    async def _async_save_location_signs(self) -> None:
        """Save again if signs changed while a storage write was in progress."""
        while True:
            snapshot = {
                vin: dict(signs) for vin, signs in self._location_signs.items()
            }
            await self._location_sign_store.async_save(snapshot)
            if snapshot == self._location_signs:
                return

    async def _async_push_abrp(self, data: dict[str, Any]) -> None:
        """Push vehicle telemetry to ABRP when configured."""
        api_key = DEFAULT_ABRP_API_KEY
        if not api_key.strip():
            return

        vehicles = data.get("vehicles") or {}
        for vin, vehicle_data in vehicles.items():
            enabled, token = abrp_config_for_vehicle(
                self.config_entry,
                vin,
                vehicle_count=len(vehicles),
            )
            if not enabled or not token:
                self._last_abrp_results[vin] = {
                    "enabled": enabled,
                    "status": "disabled" if not enabled else "missing_token",
                    "success": None,
                }
                continue
            telemetry = build_abrp_telemetry(vehicle_data)
            started_at = time.time()
            try:
                result = await self.hass.async_add_executor_job(
                    partial(
                        send_abrp_telemetry,
                        api_key=api_key,
                        token=token,
                        telemetry=telemetry,
                    )
                )
            except Exception as exc:  # noqa: BLE001
                self._last_abrp_results[vin] = {
                    "enabled": True,
                    "status": "error",
                    "success": False,
                    "updated_at": time.time(),
                    "duration_seconds": round(time.time() - started_at, 3),
                    "error": str(exc),
                    "telemetry_keys": sorted(telemetry),
                }
                _LOGGER.debug("Leapmotor ABRP telemetry push failed for %s: %s", vin, exc)
                continue

            self._last_abrp_results[vin] = {
                "enabled": True,
                "status": result.get("status", "ok"),
                "success": True,
                "updated_at": time.time(),
                "duration_seconds": round(time.time() - started_at, 3),
                "http_status": result.get("http_status"),
                "missing": result.get("missing"),
                "telemetry_keys": sorted(telemetry),
            }

    def _stabilize_vehicle_states(self, data: dict[str, Any]) -> None:
        """Keep the last valid parked/driving state across weak startup polls."""
        for vin, vehicle_data in (data.get("vehicles") or {}).items():
            status = vehicle_data.get("status") or {}
            vehicle_state = status.get("vehicle_state")
            if vehicle_state in {"parked", "driving"}:
                self._last_vehicle_states[vin] = vehicle_state
                continue
            last_vehicle_state = self._last_vehicle_states.get(vin)
            if last_vehicle_state:
                status["vehicle_state"] = last_vehicle_state
                status["vehicle_state_source"] = "cached_last_valid"
                status["is_parked"] = last_vehicle_state == "parked"

    @staticmethod
    def _apply_single_lock_override(
        data: dict[str, Any],
        vin: str,
        is_locked: bool,
    ) -> None:
        vehicle_data = (data.get("vehicles") or {}).get(vin)
        if not vehicle_data:
            return
        status = vehicle_data.setdefault("status", {})
        status["is_locked"] = is_locked
        status["lock_state_source"] = "remote_control_confirmed"

    @staticmethod
    def _apply_single_remote_result(
        data: dict[str, Any],
        vin: str,
        info: dict[str, Any],
    ) -> None:
        vehicle_data = (data.get("vehicles") or {}).get(vin)
        if not vehicle_data:
            return
        vehicle_data["remote_control"] = dict(info)

    @staticmethod
    def _classify_error(message: str) -> str:
        """Map raw update errors to a stable diagnostic code."""
        lowered = message.lower()
        if "missing local app certificate material" in lowered:
            return "missing_app_cert"
        if "account certificate" in lowered or "account_cert_error" in lowered:
            return "account_cert_error"
        if "no vehicle linked to this account" in lowered:
            return "no_vehicle"
        if "anmeldung fehlgeschlagen" in lowered or "login" in lowered and "failed" in lowered:
            return "invalid_auth"
        if "betriebspasswort" in lowered or "operatepassword" in lowered:
            return "invalid_operation_password"
        return "api_error"


def _state_age_seconds(raw_timestamp: Any) -> int | None:
    """Convert Leapmotor status timestamp into age in seconds."""
    if raw_timestamp is None:
        return None
    try:
        numeric = float(raw_timestamp)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(
                str(raw_timestamp).replace("Z", "+00:00")
            )
        except ValueError:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        event_ts = parsed.timestamp()
    else:
        if numeric <= 0:
            return None
        if numeric > 10_000_000_000:
            event_ts = numeric / 1000.0
        elif numeric > 1_000_000_000:
            event_ts = numeric
        else:
            return None
    age = int(time.time() - event_ts)
    return max(age, 0)


def _any_vehicle_driving(data: dict[str, Any]) -> bool:
    """Return true when any vehicle reports driving or a speed above zero."""
    for vehicle_data in (data.get("vehicles") or {}).values():
        status = vehicle_data.get("status") or {}
        if status.get("is_driving") is True:
            return True
        try:
            if float(status.get("speed_kmh") or 0) > 0:
                return True
        except (TypeError, ValueError):
            continue
    return False


def _all_vehicles_quiet(data: dict[str, Any]) -> bool:
    """Return true when every vehicle is safe for slower cloud polling."""
    vehicles = (data.get("vehicles") or {}).values()
    seen_vehicle = False
    for vehicle_data in vehicles:
        seen_vehicle = True
        status = vehicle_data.get("status") or {}
        charging = vehicle_data.get("charging") or {}
        if status.get("is_locked") is not True:
            return False
        if status.get("is_parked") is not True:
            return False
        if charging.get("is_charging") is True:
            return False
        if charging.get("is_plugged_in") is not False:
            return False
    return seen_vehicle


def _should_flip_southern_latitude(
    latitude: float | None,
    longitude: float | None,
    home_latitude: float | None,
    home_longitude: float | None,
) -> bool:
    """Return true when a positive API latitude is likely missing the southern sign."""
    if latitude is None or longitude is None or home_latitude is None or home_longitude is None:
        return False
    if latitude <= 0 or home_latitude >= 0:
        return False
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return False
    if not (-90 <= home_latitude <= 90 and -180 <= home_longitude <= 180):
        return False

    longitude_delta = _longitude_delta_degrees(longitude, home_longitude)
    if longitude_delta > 50:
        return False

    as_reported_distance = _coordinate_distance_score(latitude, longitude, home_latitude, home_longitude)
    flipped_distance = _coordinate_distance_score(-abs(latitude), longitude, home_latitude, home_longitude)
    return flipped_distance + 1 < as_reported_distance


def _should_flip_western_longitude(
    latitude: float | None,
    longitude: float | None,
    home_latitude: float | None,
    home_longitude: float | None,
) -> bool:
    """Return true when a positive API longitude is likely missing the western sign."""
    if latitude is None or longitude is None or home_latitude is None or home_longitude is None:
        return False
    if longitude <= 0 or home_longitude >= 0:
        return False
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return False
    if not (-90 <= home_latitude <= 90 and -180 <= home_longitude <= 180):
        return False

    as_reported_distance = _coordinate_distance_score(latitude, longitude, home_latitude, home_longitude)
    flipped_distance = _coordinate_distance_score(latitude, -abs(longitude), home_latitude, home_longitude)
    return flipped_distance * 2 < as_reported_distance


def _coordinate_distance_score(
    latitude: float,
    longitude: float,
    home_latitude: float,
    home_longitude: float,
) -> float:
    """Return a cheap distance score in degrees, sufficient for hemisphere guards."""
    longitude_delta = _longitude_delta_degrees(longitude, home_longitude)
    return (latitude - home_latitude) ** 2 + longitude_delta**2


def _longitude_delta_degrees(left: float, right: float) -> float:
    """Return the shortest absolute longitude delta in degrees."""
    delta = abs(left - right) % 360
    return min(delta, 360 - delta)


def _safe_float(value: Any) -> float | None:
    """Return value as float or None."""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
