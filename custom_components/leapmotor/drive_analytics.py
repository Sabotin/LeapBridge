"""Trip log, charging sessions and battery health for Leapmotor vehicles.

The analysis is ported from LeapConnect by Marco Mancino
(https://github.com/markoceri/leapconnect), licensed under the GNU Affero
General Public License v3.0:

- trip segmentation, merging and trip rows (``domain/trips/analysis.py``)
- charge-session detection (``domain/trips/analysis.py``)
- battery state-of-health estimate (``domain/telemetry/battery_health.py``)

It is adapted to this integration's polled data: snapshots are built from the
normalized vehicle dict on every poll, kept in a rolling buffer, and finished
trips and charging sessions are persisted. Regenerated energy is not
estimated because the polling interval (minutes) is far coarser than regen
bursts (seconds). Trip and session coordinates are not stored.

This module has no Home Assistant imports so it can be tested on its own.
"""

from __future__ import annotations

import bisect
import math
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta, tzinfo
from statistics import median
from typing import Any

# --- Trip rules (LeapConnect) -------------------------------------------------
#: Two moving segments closer than this, without an explicit park, are one trip.
MERGE_GAP_S = 300
#: Trips shorter than this are noise.
MIN_TRIP_KM = 0.2

# --- Battery health (LeapConnect) --------------------------------------------
HEALTH_WINDOW = 7
HEALTH_MIN_SAMPLES = 3
MIN_REFERENCE_KWH = 10.0
MAX_REFERENCE_KWH = 200.0
#: A reading counts as a full charge from this state of charge.
FULL_SOC = 99.5

# --- Retention ----------------------------------------------------------------
BUFFER_SECONDS = 36 * 3600
MAX_TRIPS = 500
MAX_SESSIONS = 500
MAX_FULL_CHARGE_DAYS = 400
RECENT_ITEMS = 10
#: Vehicle timestamps further off than this are replaced by the poll time.
MAX_VEHICLE_TS_AGE = 7 * 86400
MAX_VEHICLE_TS_AHEAD = 300

# --- Charging tiers -----------------------------------------------------------
TIER_HOME = "home"
TIER_PUBLIC_AC = "public_ac"
TIER_PUBLIC_DC = "public_dc"
#: Above any AC wallbox: a session this powerful was DC.
DC_POWER_THRESHOLD_KW = 22.5
#: Extra tolerance on the home zone radius for GPS jitter.
HOME_RADIUS_MARGIN_M = 50.0

STORAGE_VERSION = 1

_FIELDS = (
    "ts", "soc", "energy_kwh", "odometer_km", "speed_kmh", "is_parked",
    "is_charging", "is_dc", "charge_power_kw", "outdoor_temp_c", "lat", "lon",
)


@dataclass(frozen=True, slots=True)
class Snapshot:
    """One poll of the values the analysis needs."""

    ts: float
    soc: float | None = None
    energy_kwh: float | None = None
    odometer_km: float | None = None
    speed_kmh: float | None = None
    is_parked: bool | None = None
    is_charging: bool | None = None
    is_dc: bool | None = None
    charge_power_kw: float | None = None
    outdoor_temp_c: float | None = None
    lat: float | None = None
    lon: float | None = None


def snapshot_to_row(snapshot: Snapshot) -> list[Any]:
    """Compact list form for storage."""
    return [getattr(snapshot, name) for name in _FIELDS]


def snapshot_from_row(row: Any) -> Snapshot | None:
    """Rebuild a snapshot from storage; ignore malformed rows."""
    if not isinstance(row, (list, tuple)) or len(row) != len(_FIELDS):
        return None
    values = dict(zip(_FIELDS, row, strict=True))
    ts = _num(values.pop("ts"))
    if ts is None:
        return None
    return Snapshot(ts=ts, **values)


def _num(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _bool(value: Any) -> bool | None:
    return value if isinstance(value, bool) else None


def _positive(value: float | None) -> float | None:
    """Partial payloads report 0 for odometer/SOC/energy; never use them."""
    return value if value is not None and value > 0 else None


def _vehicle_ts(value: Any, now_ts: float) -> float:
    ts = _num(value)
    if ts is None or ts <= 0:
        return now_ts
    if ts > 10_000_000_000:
        ts /= 1000.0
    if ts > now_ts + MAX_VEHICLE_TS_AHEAD or ts < now_ts - MAX_VEHICLE_TS_AGE:
        return now_ts
    return ts


def snapshot_from_vehicle(vehicle: dict[str, Any], now_ts: float) -> Snapshot:
    """Build a snapshot from one vehicle in the coordinator data."""
    status = vehicle.get("status") or {}
    charging = vehicle.get("charging") or {}
    diagnostics = vehicle.get("diagnostics") or {}
    location = vehicle.get("location") or {}
    soc = _num(status.get("battery_percent_precise"))
    if soc is None:
        soc = _num(status.get("battery_percent"))
    lat = _num(location.get("latitude"))
    lon = _num(location.get("longitude"))
    if lat is None or lon is None or (lat == 0 and lon == 0):
        lat = lon = None
    return Snapshot(
        ts=_vehicle_ts(status.get("last_vehicle_timestamp"), now_ts),
        soc=soc,
        energy_kwh=_num(diagnostics.get("available_energy_kwh")),
        odometer_km=_num(status.get("odometer_km")),
        speed_kmh=_num(status.get("speed_kmh")),
        is_parked=_bool(status.get("is_parked")),
        is_charging=_bool(charging.get("is_charging")),
        is_dc=_bool(charging.get("dc_cable_connected")),
        charge_power_kw=_num(charging.get("charging_power_kw")),
        outdoor_temp_c=_num(diagnostics.get("outdoor_temp_c")),
        lat=lat,
        lon=lon,
    )


# --- Trips --------------------------------------------------------------------


def is_moving(snapshot: Snapshot) -> bool:
    """LeapConnect: moving when speed > 0 or explicitly not parked."""
    return (snapshot.speed_kmh or 0) > 0 or snapshot.is_parked is False


def _first_valid(segment: list[Snapshot], getter, *, reverse: bool = False):
    for snapshot in reversed(segment) if reverse else segment:
        if (value := getter(snapshot)) is not None:
            return value
    return None


def raw_segments(snapshots: list[Snapshot]) -> list[list[Snapshot]]:
    """Contiguous moving windows, each with the poll before and after it."""
    segments: list[list[Snapshot]] = []
    current: list[Snapshot] = []
    for index, snapshot in enumerate(snapshots):
        if is_moving(snapshot):
            if not current:
                current = [snapshots[index - 1] if index > 0 else snapshot]
            current.append(snapshot)
        elif current:
            current.append(snapshot)
            segments.append(current)
            current = []
    if current:
        segments.append(current)
    return segments


def _parked_between(snapshots: list[Snapshot], start_ts: float, end_ts: float) -> bool:
    """Was the car explicitly parked from the end of one segment to the next?

    LeapConnect checks polls strictly inside the gap, which suits its
    seconds-level polling. At minute-level polling the parked readings are the
    segment boundaries themselves, so they count too.
    """
    return any(start_ts <= s.ts <= end_ts and s.is_parked is True for s in snapshots)


def merge_segments(
    segments: list[list[Snapshot]], snapshots: list[Snapshot]
) -> list[list[Snapshot]]:
    """Merge segments with a short gap and no explicit park in between."""
    if not segments:
        return []
    merged = [list(segments[0])]
    for segment in segments[1:]:
        last = merged[-1]
        gap = segment[0].ts - last[-1].ts
        if gap <= MERGE_GAP_S and not _parked_between(snapshots, last[-1].ts, segment[0].ts):
            merged[-1].extend(segment[1:] if len(segment) > 1 else segment)
        else:
            merged.append(list(segment))
    return merged


def build_trip(segment: list[Snapshot]) -> dict[str, Any] | None:
    """Trip summary for a merged segment, or None if it is too short."""
    if len(segment) < 2:
        return None
    start, end = segment[0], segment[-1]
    duration_h = (end.ts - start.ts) / 3600.0
    if duration_h <= 0:
        return None
    start_km = _first_valid(segment, lambda s: _positive(s.odometer_km))
    end_km = _first_valid(segment, lambda s: _positive(s.odometer_km), reverse=True)
    if start_km is None or end_km is None:
        return None
    distance = max(0.0, end_km - start_km)
    if distance < MIN_TRIP_KM:
        return None
    start_kwh = _first_valid(segment, lambda s: _positive(s.energy_kwh))
    end_kwh = _first_valid(segment, lambda s: _positive(s.energy_kwh), reverse=True)
    energy = None
    if start_kwh is not None and end_kwh is not None:
        # Net use; a downhill trip can recover more than it used.
        energy = round(max(0.0, start_kwh - end_kwh), 2)
    return {
        "start": start.ts,
        "end": end.ts,
        "distance_km": round(distance, 2),
        "duration_min": round(duration_h * 60, 1),
        "energy_kwh": energy,
        "consumption_kwh_100km": (
            round(energy / distance * 100, 1) if energy is not None and distance > 0 else None
        ),
        "avg_speed_kmh": round(distance / duration_h, 1),
        "max_speed_kmh": max((s.speed_kmh or 0) for s in segment),
        "start_soc": _first_valid(segment, lambda s: _positive(s.soc)),
        "end_soc": _first_valid(segment, lambda s: _positive(s.soc), reverse=True),
        "outdoor_temp_c": start.outdoor_temp_c,
    }


def detect_trips(
    snapshots: list[Snapshot], now_ts: float
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """Return (finished trips, ongoing trip).

    A closed trip is final once a later segment exists, the car is explicitly
    parked, or the merge window has passed. Before that (stopped but not in P,
    e.g. at a traffic light) the next movement could still extend it.
    """
    merged = merge_segments(raw_segments(snapshots), snapshots)
    finished: list[dict[str, Any]] = []
    ongoing: dict[str, Any] | None = None
    for index, segment in enumerate(merged):
        trip = build_trip(segment)
        closed = not is_moving(segment[-1])
        if not closed:
            if trip is None and len(segment) >= 2:
                trip = {"start": segment[0].ts, "end": segment[-1].ts, "distance_km": 0.0}
            ongoing = trip
            continue
        if trip is None:
            continue
        end_ts = segment[-1].ts
        final = (
            index < len(merged) - 1
            or segment[-1].is_parked is True
            or any(s.ts > end_ts and s.is_parked is True for s in snapshots)
            or now_ts - end_ts > MERGE_GAP_S
        )
        if final:
            finished.append(trip)
        else:
            ongoing = trip
    return finished, ongoing


# --- Charging sessions --------------------------------------------------------


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def _session_summary(
    snapshots: list[Snapshot], *, open_ended: bool
) -> dict[str, Any]:
    start, end = snapshots[0], snapshots[-1]
    start_kwh = _first_valid(snapshots, lambda s: _positive(s.energy_kwh))
    end_kwh = _first_valid(snapshots, lambda s: _positive(s.energy_kwh), reverse=True)
    energy = (
        round(max(0.0, end_kwh - start_kwh), 2)
        if start_kwh is not None and end_kwh is not None
        else None
    )
    powers = [s.charge_power_kw for s in snapshots if s.charge_power_kw is not None]
    peak = round(max(powers), 1) if powers else None
    dc = any(s.is_dc is True for s in snapshots) or (
        peak is not None and peak > DC_POWER_THRESHOLD_KW
    )
    position = _first_valid(
        snapshots, lambda s: (s.lat, s.lon) if s.lat is not None and s.lon is not None else None
    )
    return {
        "start": start.ts,
        "end": None if open_ended else end.ts,
        "duration_min": round((end.ts - start.ts) / 60, 1),
        "energy_kwh": energy,
        "start_soc": _first_valid(snapshots, lambda s: _positive(s.soc)),
        "end_soc": _first_valid(snapshots, lambda s: _positive(s.soc), reverse=True),
        "peak_power_kw": peak,
        "dc": dc,
        "_position": position,
    }


def detect_charge_sessions(
    snapshots: list[Snapshot],
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """Return (finished sessions, ongoing session) from charging flags."""
    finished: list[dict[str, Any]] = []
    current: list[Snapshot] = []
    for snapshot in snapshots:
        if snapshot.is_charging is True:
            current.append(snapshot)
        elif snapshot.is_charging is False and current:
            finished.append(_session_summary(current, open_ended=False))
            current = []
    ongoing = _session_summary(current, open_ended=True) if current else None
    return finished, ongoing


def session_tier(
    session: dict[str, Any], home: tuple[float, float, float] | None
) -> str:
    """Home when the session started at home, otherwise public AC or DC."""
    position = session.get("_position")
    if home is not None and position is not None:
        lat, lon, radius = home
        if haversine_m(position[0], position[1], lat, lon) <= radius + HOME_RADIUS_MARGIN_M:
            return TIER_HOME
    return TIER_PUBLIC_DC if session.get("dc") else TIER_PUBLIC_AC


def session_cost(energy_kwh: float | None, price_kwh: float | None) -> float | None:
    """Flat per-tier cost; unknown when the price or energy is not set."""
    if energy_kwh is None or price_kwh is None or price_kwh <= 0:
        return None
    return round(energy_kwh * price_kwh, 2)


# --- Battery health (LeapConnect) ---------------------------------------------


def is_valid_reference(kwh: float | None) -> bool:
    return kwh is not None and MIN_REFERENCE_KWH <= kwh <= MAX_REFERENCE_KWH


def estimate_battery_health(
    samples: dict[str, float], reference_kwh: float | None = None
) -> dict[str, Any] | None:
    """SOH from per-day full-charge energy readings, or None if too few.

    The remaining energy the BMS reports at 100 % is a proxy for usable
    capacity. Each day contributes its highest full-charge reading; the series
    is smoothed with a rolling median. Without a reference capacity, SOH is
    relative to the best capacity observed since recording started.
    """
    days = sorted((day, kwh) for day, kwh in samples.items() if kwh and kwh > 0)
    if len(days) < HEALTH_MIN_SAMPLES:
        return None
    values = [kwh for _, kwh in days]
    smoothed = [
        median(values[max(0, i - HEALTH_WINDOW + 1): i + 1]) for i in range(len(values))
    ]
    if is_valid_reference(reference_kwh):
        reference, source = float(reference_kwh), "user"
    else:
        reference, source = max(smoothed[HEALTH_WINDOW - 1:] or smoothed), "observed"
    capacity = smoothed[-1]
    return {
        "soh_pct": round(capacity / reference * 100, 1),
        "capacity_kwh": round(capacity, 2),
        "reference_kwh": round(reference, 2),
        "reference_source": source,
        "samples": len(days),
        "last_full_charge": days[-1][0],
    }


# --- Engine -------------------------------------------------------------------


def _local_day(ts: float, tz: tzinfo) -> date:
    return datetime.fromtimestamp(ts, tz=UTC).astimezone(tz).date()


def period_starts(now_ts: float, tz: tzinfo) -> tuple[datetime, datetime]:
    """Local midnight today and the first of this month, timezone-aware."""
    now = datetime.fromtimestamp(now_ts, tz=UTC).astimezone(tz)
    day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return day, day.replace(day=1)


def _iso(ts: float | None) -> str | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=UTC).isoformat(timespec="seconds")


def _public(record: dict[str, Any] | None) -> dict[str, Any] | None:
    """Record for attributes: ISO times, no private keys."""
    if record is None:
        return None
    out = {k: v for k, v in record.items() if not k.startswith("_")}
    for key in ("start", "end"):
        if key in out:
            out[key] = _iso(out[key])
    return out


class DriveAnalytics:
    """Per-VIN rolling buffer plus persisted trips, sessions and full charges."""

    def __init__(self, stored: dict[str, Any] | None = None) -> None:
        self._vins: dict[str, dict[str, Any]] = {}
        vins = (stored or {}).get("vins") if isinstance(stored, dict) else None
        for vin, raw in (vins or {}).items():
            if isinstance(raw, dict):
                self._vins[str(vin)] = self._load_vin(raw)

    @staticmethod
    def _load_vin(raw: dict[str, Any]) -> dict[str, Any]:
        buffer = [s for row in raw.get("buffer") or [] if (s := snapshot_from_row(row))]
        return {
            "buffer": sorted(buffer, key=lambda s: s.ts),
            "trips": [t for t in raw.get("trips") or [] if isinstance(t, dict)],
            "sessions": [s for s in raw.get("sessions") or [] if isinstance(s, dict)],
            "full_charge": {
                str(day): float(kwh)
                for day, kwh in (raw.get("full_charge") or {}).items()
                if _num(kwh) is not None
            },
            "last_trip_end": _num(raw.get("last_trip_end")) or 0.0,
            "last_session_end": _num(raw.get("last_session_end")) or 0.0,
        }

    def as_storage(self) -> dict[str, Any]:
        return {
            "vins": {
                vin: {
                    "buffer": [snapshot_to_row(s) for s in state["buffer"]],
                    "trips": state["trips"],
                    "sessions": state["sessions"],
                    "full_charge": state["full_charge"],
                    "last_trip_end": state["last_trip_end"],
                    "last_session_end": state["last_session_end"],
                }
                for vin, state in self._vins.items()
            }
        }

    def _state(self, vin: str) -> dict[str, Any]:
        return self._vins.setdefault(vin, self._load_vin({}))

    def update(
        self,
        vin: str,
        vehicle: dict[str, Any],
        *,
        now_ts: float,
        tz: tzinfo,
        home: tuple[float, float, float] | None = None,
        prices: dict[str, float] | None = None,
        reference_kwh: float | None = None,
    ) -> dict[str, Any]:
        """Add one poll and return the summary for this vehicle."""
        state = self._state(vin)
        snapshot = snapshot_from_vehicle(vehicle, now_ts)
        buffer: list[Snapshot] = state["buffer"]
        # Keep the buffer ordered by vehicle time. A repeated cloud snapshot has
        # the same timestamp and is skipped; a late one (e.g. after a poll that
        # had to fall back to the poll time) is inserted in place.
        index = bisect.bisect_left(buffer, snapshot.ts, key=lambda s: s.ts)
        duplicate = any(
            abs(buffer[i].ts - snapshot.ts) < 0.5
            for i in (index - 1, index)
            if 0 <= i < len(buffer)
        )
        if not duplicate:
            buffer.insert(index, snapshot)
        cutoff = now_ts - BUFFER_SECONDS
        state["buffer"] = buffer = [s for s in buffer if s.ts >= cutoff]

        # Full charges for battery health.
        if snapshot.soc is not None and snapshot.soc >= FULL_SOC and _positive(snapshot.energy_kwh):
            day = _local_day(snapshot.ts, tz).isoformat()
            full = state["full_charge"]
            full[day] = max(full.get(day, 0.0), float(snapshot.energy_kwh))
            if len(full) > MAX_FULL_CHARGE_DAYS:
                for old in sorted(full)[: len(full) - MAX_FULL_CHARGE_DAYS]:
                    del full[old]

        # Trips.
        trips, ongoing_trip = detect_trips(buffer, now_ts)
        for trip in trips:
            if trip["start"] >= state["last_trip_end"]:
                state["trips"].append(trip)
                state["last_trip_end"] = trip["end"]
        state["trips"] = state["trips"][-MAX_TRIPS:]

        # Charging sessions.
        prices = prices or {}
        sessions, ongoing_session = detect_charge_sessions(buffer)
        for session in sessions:
            if session["start"] > state["last_session_end"]:
                tier = session_tier(session, home)
                price = prices.get(tier)
                session.pop("_position", None)
                session.update(
                    tier=tier,
                    price_kwh=price if price and price > 0 else None,
                    cost=session_cost(session["energy_kwh"], price),
                )
                state["sessions"].append(session)
                state["last_session_end"] = session["end"]
        state["sessions"] = state["sessions"][-MAX_SESSIONS:]
        if ongoing_session is not None:
            ongoing_session["tier"] = session_tier(ongoing_session, home)

        return self._summary(state, now_ts, tz, ongoing_trip, ongoing_session, reference_kwh)

    @staticmethod
    def _summary(
        state: dict[str, Any],
        now_ts: float,
        tz: tzinfo,
        ongoing_trip: dict[str, Any] | None,
        ongoing_session: dict[str, Any] | None,
        reference_kwh: float | None,
    ) -> dict[str, Any]:
        day_start, month_start = period_starts(now_ts, tz)
        day_ts, month_ts = day_start.timestamp(), month_start.timestamp()
        trips, sessions = state["trips"], state["sessions"]

        def trip_totals(since: float) -> dict[str, Any]:
            chosen = [t for t in trips if t["start"] >= since]
            energy = [t["energy_kwh"] for t in chosen if t.get("energy_kwh") is not None]
            return {
                "trips": len(chosen),
                "distance_km": round(sum(t["distance_km"] for t in chosen), 1),
                "duration_min": round(sum(t.get("duration_min") or 0 for t in chosen), 1),
                "energy_kwh": round(sum(energy), 2) if energy else None,
            }

        month_sessions = [s for s in sessions if s["start"] >= month_ts]
        costs = [s["cost"] for s in month_sessions if s.get("cost") is not None]
        energies = [s["energy_kwh"] for s in month_sessions if s.get("energy_kwh") is not None]

        def tier_energy(*tiers: str) -> float:
            return round(sum(
                s["energy_kwh"] for s in month_sessions
                if s.get("tier") in tiers and s.get("energy_kwh") is not None
            ), 2)

        return {
            "last_trip": _public(trips[-1]) if trips else None,
            "current_trip": _public(ongoing_trip),
            "recent_trips": [_public(t) for t in reversed(trips[-RECENT_ITEMS:])],
            "today": trip_totals(day_ts),
            "month": trip_totals(month_ts),
            "last_session": _public(sessions[-1]) if sessions else None,
            "current_session": _public(ongoing_session),
            "recent_sessions": [_public(s) for s in reversed(sessions[-RECENT_ITEMS:])],
            "month_charging": {
                "sessions": len(month_sessions),
                "energy_kwh": round(sum(energies), 2),
                "cost": round(sum(costs), 2) if costs else None,
                "home_energy_kwh": tier_energy(TIER_HOME),
                "public_energy_kwh": tier_energy(TIER_PUBLIC_AC, TIER_PUBLIC_DC),
            },
            "battery_health": estimate_battery_health(state["full_charge"], reference_kwh),
            "period": {"day_start": day_start.isoformat(), "month_start": month_start.isoformat()},
        }


__all__ = [
    "DriveAnalytics",
    "STORAGE_VERSION",
    "Snapshot",
    "TIER_HOME",
    "TIER_PUBLIC_AC",
    "TIER_PUBLIC_DC",
    "build_trip",
    "detect_charge_sessions",
    "detect_trips",
    "estimate_battery_health",
    "merge_segments",
    "period_starts",
    "raw_segments",
    "session_cost",
    "session_tier",
    "snapshot_from_vehicle",
]
