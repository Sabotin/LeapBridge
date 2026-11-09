"""Trip log, charging sessions and battery health for Leapmotor vehicles.

The analysis is ported from LeapConnect by Marco Mancino
(https://github.com/markoceri/leapconnect), licensed under the GNU Affero
General Public License v3.0:

- trip segmentation, merging and trip rows (``domain/trips/analysis.py``)
- charge-session detection (``domain/trips/analysis.py``)
- battery state-of-health estimate (``domain/telemetry/battery_health.py``)
- time-of-use charging cost (``domain/charging/costing.py``)
- trip similarity scoring (``domain/trips/analysis.py``)
- maintenance due/overdue engine (``domain/maintenance/engine.py``)

Additions that LeapConnect does not have: cost per trip and per 100 km, parked
battery drain, temperature-compensated slow-leak tire detection, a
charge-to-limit cost estimate, consumption by outside temperature, an
"attention needed" summary, and maintenance that works before any service is
logged (it assumes services were done on schedule).

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
#: Trips listed on the card's trips page (attributes are not recorded).
RECENT_TRIPS = 30
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
    def position(s: Snapshot):
        return [round(s.lat, 3), round(s.lon, 3)] if s.lat is not None and s.lon is not None else None

    return {
        "start": start.ts,
        "end": end.ts,
        "_sp": _first_valid(segment, position),
        "_ep": _first_valid(segment, position, reverse=True),
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


# --- Time-of-use pricing (LeapConnect costing.py) ----------------------------

TOU_SLOT_S = 900


def _local(ts: float, tz: tzinfo) -> datetime:
    return datetime.fromtimestamp(ts, tz=UTC).astimezone(tz)


def low_tariff_active(when: datetime, band: dict[str, Any] | None) -> bool:
    """Is a local wall-clock time inside the low-tariff window?"""
    if not band:
        return False
    if band.get("weekends") and when.weekday() >= 5:
        return True
    start, end = band.get("start_min"), band.get("end_min")
    if start is None or end is None or start == end:
        return False
    minutes = when.hour * 60 + when.minute
    if end <= start:  # overnight, e.g. 22:00-06:00
        return minutes >= start or minutes < end
    return start <= minutes < end


def tou_cost(
    energy_kwh: float | None,
    start_ts: float,
    end_ts: float,
    *,
    low_price: float,
    high_price: float,
    band: dict[str, Any],
    tz: tzinfo,
) -> float | None:
    """Split session energy over low/high tariff time in 15-minute slots."""
    if energy_kwh is None:
        return None
    total = end_ts - start_ts
    if total <= 0:
        price = low_price if low_tariff_active(_local(start_ts, tz), band) else high_price
        return round(energy_kwh * price, 2)
    low_seconds = 0.0
    current = start_ts
    while current < end_ts:
        slot_end = min(current + TOU_SLOT_S, end_ts)
        if low_tariff_active(_local(current, tz), band):
            low_seconds += slot_end - current
        current = slot_end
    share = low_seconds / total
    return round(energy_kwh * (share * low_price + (1 - share) * high_price), 2)


def _tou_enabled(prices: dict[str, Any]) -> bool:
    return bool(prices.get("home") and prices.get("home_low") and prices.get("low_band"))


def price_session(
    session: dict[str, Any], prices: dict[str, Any], tz: tzinfo
) -> tuple[float | None, float | None]:
    """Return (cost, effective price per kWh) for a finished session."""
    tier, energy = session.get("tier"), session.get("energy_kwh")
    price = prices.get(tier)
    if tier == TIER_HOME and _tou_enabled(prices):
        cost = tou_cost(
            energy, session["start"], session.get("end") or session["start"],
            low_price=prices["home_low"], high_price=prices["home"],
            band=prices["low_band"], tz=tz,
        )
        effective = round(cost / energy, 4) if cost is not None and energy else None
        return cost, effective
    return session_cost(energy, price), (price if price and price > 0 else None)


def next_low_tariff_start(now_ts: float, band: dict[str, Any] | None, tz: tzinfo) -> float | None:
    """First 15-minute slot from now that falls in the low tariff."""
    if not band:
        return None
    start = now_ts - now_ts % TOU_SLOT_S
    for step in range(1, 7 * 96 + 1):
        ts = start + step * TOU_SLOT_S
        if low_tariff_active(_local(ts, tz), band):
            return ts
    return None


# --- Speed alert --------------------------------------------------------------


def speed_alert(vehicle: dict[str, Any], threshold_kmh: float | None) -> dict[str, Any]:
    """Is the car faster than the user's alert speed or its own speed limit?

    The user's threshold wins; without one, the speed limit the car reports as
    switched on is used. Speed is sampled once per poll, so this catches
    sustained speeding, not short bursts.
    """
    status = vehicle.get("status") or {}
    diagnostics = vehicle.get("diagnostics") or {}
    speed = _num(status.get("speed_kmh"))
    source = None
    threshold = _num(threshold_kmh)
    if threshold is not None and threshold > 0:
        source = "setting"
    else:
        car_limit = _num(diagnostics.get("speed_limit_kmh"))
        threshold = None
        if diagnostics.get("speed_limit_enabled") is True and car_limit and car_limit > 0:
            threshold, source = car_limit, "vehicle"
    return {
        "speeding": bool(threshold is not None and speed is not None and speed > threshold),
        "speed_kmh": speed,
        "threshold_kmh": threshold,
        "threshold_source": source,
    }


# --- Trip comparison (LeapConnect similarity) ---------------------------------

SIMILAR_SCORE = 0.75
SIMILAR_MIN_MATCHES = 2
SIMILAR_HISTORY = 300


def _hour(ts: float, tz: tzinfo) -> float:
    local = _local(ts, tz)
    return local.hour + local.minute / 60


def trip_similarity(reference: dict[str, Any], candidate: dict[str, Any], tz: tzinfo) -> float:
    """Route 40 %, time of day 35 %, distance 25 % (LeapConnect weights)."""
    ref_km = reference.get("distance_km") or 0
    cand_km = candidate.get("distance_km") or 0
    distance = 0.0 if ref_km <= 0 else 1.0 - min(1.0, abs(cand_km - ref_km) / ref_km)
    hours = abs(_hour(reference["start"], tz) - _hour(candidate["start"], tz))
    hours = min(hours, 24 - hours)
    time_score = 1.0 - min(1.0, hours / 12.0)
    route = 0.5
    points = [reference.get("_sp"), reference.get("_ep"), candidate.get("_sp"), candidate.get("_ep")]
    if all(points):
        start_km = haversine_m(*points[0], *points[2]) / 1000
        end_km = haversine_m(*points[1], *points[3]) / 1000
        route = 1.0 - min(1.0, (start_km + end_km) / 2 / 30.0)
    return round(0.40 * route + 0.35 * time_score + 0.25 * distance, 4)


def compare_with_similar(
    trip: dict[str, Any], history: list[dict[str, Any]], tz: tzinfo
) -> dict[str, Any]:
    """How the trip's consumption compares with similar earlier trips."""
    own = trip.get("consumption_kwh_100km")
    matches = [
        t for t in history[-SIMILAR_HISTORY:]
        if t is not trip and t.get("start") != trip.get("start")
        and t.get("energy_kwh") is not None and (t.get("distance_km") or 0) > 0
        and trip_similarity(trip, t, tz) >= SIMILAR_SCORE
    ]
    result: dict[str, Any] = {"similar_trips": len(matches)}
    if own is None or len(matches) < SIMILAR_MIN_MATCHES:
        return result
    distance = sum(t["distance_km"] for t in matches)
    usual = sum(t["energy_kwh"] for t in matches) / distance * 100
    if usual > 0:
        result["usual_consumption_kwh_100km"] = round(usual, 1)
        result["vs_usual_pct"] = round((own - usual) / usual * 100, 1)
    return result


# --- Driving cost (not in LeapConnect) ----------------------------------------

PRICE_WINDOW_DAYS = 30


def average_price_per_kwh(
    sessions: list[dict[str, Any]], now_ts: float, prices: dict[str, Any]
) -> float | None:
    """Average price paid per kWh over the last 30 days, else the home price."""
    since = now_ts - PRICE_WINDOW_DAYS * 86400
    priced = [
        s for s in sessions
        if s.get("cost") is not None and s.get("energy_kwh") and s["start"] >= since
    ]
    energy = sum(s["energy_kwh"] for s in priced)
    if energy > 0:
        return round(sum(s["cost"] for s in priced) / energy, 4)
    home = prices.get("home")
    return float(home) if home and home > 0 else None


# --- Parked drain (not in LeapConnect as a value) -----------------------------

MIN_DRAIN_HOURS = 6.0
MIN_DRAIN_STRETCH_H = 1.0


def parked_drain(snapshots: list[Snapshot]) -> dict[str, Any] | None:
    """Energy lost per day while parked and not charging (incl. preheat/climate)."""
    stretches: list[list[Snapshot]] = []
    current: list[Snapshot] = []
    for snapshot in snapshots:
        idle = (
            snapshot.is_charging is not True
            and not is_moving(snapshot)
            and _positive(snapshot.energy_kwh) is not None
        )
        if idle:
            current.append(snapshot)
        elif current:
            stretches.append(current)
            current = []
    if current:
        stretches.append(current)
    hours = kwh = soc = 0.0
    for stretch in stretches:
        span = (stretch[-1].ts - stretch[0].ts) / 3600
        if span < MIN_DRAIN_STRETCH_H:
            continue
        hours += span
        kwh += max(0.0, stretch[0].energy_kwh - stretch[-1].energy_kwh)
        if stretch[0].soc is not None and stretch[-1].soc is not None:
            soc += max(0.0, stretch[0].soc - stretch[-1].soc)
    if hours < MIN_DRAIN_HOURS:
        return None
    return {
        "kwh_per_day": round(kwh / hours * 24, 2),
        "pct_per_day": round(soc / hours * 24, 1),
        "hours_observed": round(hours, 1),
    }


# --- Tire pressure (not in LeapConnect) ---------------------------------------

TIRE_KEYS = (
    "tire_pressure_front_left_bar", "tire_pressure_front_right_bar",
    "tire_pressure_rear_left_bar", "tire_pressure_rear_right_bar",
)
TIRE_NAMES = ("front_left", "front_right", "rear_left", "rear_right")
TIRE_LOW_BAR = 1.9
TIRE_IMBALANCE_BAR = 0.3
TIRE_DROP_BAR = 0.2
TIRE_HISTORY_DAYS = 30


def tire_values(vehicle: dict[str, Any]) -> list[float | None]:
    diagnostics = vehicle.get("diagnostics") or {}
    return [_positive(_num(diagnostics.get(key))) for key in TIRE_KEYS]


def tire_status(
    current: list[float | None], history: dict[str, list[float | None]], today: str
) -> dict[str, Any] | None:
    """Low, uneven or steadily dropping tires.

    "Dropping" compares each tire's fall against the 7-day median with the
    average fall of the other three, so a cold morning (all tires lower) does
    not trigger it but one slowly leaking tire does.
    """
    if any(v is None for v in current):
        return None
    reasons: list[str] = []
    for index, value in enumerate(current):
        others = [v for i, v in enumerate(current) if i != index]
        if value < TIRE_LOW_BAR:
            reasons.append(f"{TIRE_NAMES[index]}_low")
        elif sum(others) / 3 - value >= TIRE_IMBALANCE_BAR:
            reasons.append(f"{TIRE_NAMES[index]}_uneven")
    past = [row for day, row in sorted(history.items()) if day < today][-7:]
    past = [row for row in past if isinstance(row, list) and len(row) == 4 and all(v for v in row)]
    if len(past) >= 3:
        baseline = [median(row[i] for row in past) for i in range(4)]
        drops = [baseline[i] - current[i] for i in range(4)]
        for index in range(4):
            others = [d for i, d in enumerate(drops) if i != index]
            if drops[index] - sum(others) / 3 >= TIRE_DROP_BAR:
                reason = f"{TIRE_NAMES[index]}_dropping"
                if not any(r.startswith(TIRE_NAMES[index]) for r in reasons):
                    reasons.append(reason)
    return {
        "warning": bool(reasons),
        "reasons": reasons,
        **{name: current[i] for i, name in enumerate(TIRE_NAMES)},
    }


# --- Charge to limit (not in LeapConnect) -------------------------------------


def charge_plan(
    vehicle: dict[str, Any],
    snapshot: Snapshot,
    capacity_kwh: float | None,
    prices: dict[str, Any],
    now_ts: float,
    tz: tzinfo,
) -> dict[str, Any] | None:
    """Energy and home cost to reach the charge limit, now vs. low tariff."""
    soc = snapshot.soc
    limit = _num((vehicle.get("charging") or {}).get("charge_limit_percent"))
    if soc is None or limit is None:
        return None
    if not capacity_kwh and snapshot.energy_kwh and soc > 5:
        capacity_kwh = snapshot.energy_kwh / soc * 100
    if not capacity_kwh:
        return None
    energy = max(0.0, (limit - soc) / 100 * capacity_kwh)
    plan: dict[str, Any] = {
        "energy_kwh": round(energy, 1),
        "capacity_kwh": round(capacity_kwh, 1),
        "soc": round(soc, 1),
        "limit": limit,
    }
    high = prices.get("home")
    if _tou_enabled(prices):
        band, low = prices["low_band"], prices["home_low"]
        active = low_tariff_active(_local(now_ts, tz), band)
        plan["low_tariff_now"] = active
        plan["cost_now"] = round(energy * (low if active else high), 2)
        plan["cost_low_tariff"] = round(energy * low, 2)
        plan["saving"] = round(plan["cost_now"] - plan["cost_low_tariff"], 2)
        if not active:
            nxt = next_low_tariff_start(now_ts, band, tz)
            plan["next_low_tariff"] = _iso(nxt)
    elif high:
        plan["cost_now"] = round(energy * high, 2)
    return plan


# --- Consumption by temperature (not in LeapConnect) --------------------------

TEMP_BANDS = (
    ("below_0", None, 0.0), ("0_10", 0.0, 10.0), ("10_20", 10.0, 20.0), ("above_20", 20.0, None),
)
MIN_TRIP_KM_FOR_STATS = 2.0


def efficiency_by_temperature(trips: list[dict[str, Any]]) -> list[dict[str, Any]]:
    totals = {name: [0, 0.0, 0.0] for name, _, _ in TEMP_BANDS}
    for trip in trips:
        temp, energy, km = trip.get("outdoor_temp_c"), trip.get("energy_kwh"), trip.get("distance_km") or 0
        if temp is None or energy is None or km < MIN_TRIP_KM_FOR_STATS:
            continue
        for name, low, high in TEMP_BANDS:
            if (low is None or temp >= low) and (high is None or temp < high):
                totals[name][0] += 1
                totals[name][1] += energy
                totals[name][2] += km
                break
    return [
        {"band": name, "trips": n, "consumption_kwh_100km": round(e / km * 100, 1)}
        for name, (n, e, km) in totals.items() if n >= 2 and km > 0
    ]


# --- Attention needed (not in LeapConnect) ------------------------------------

DOOR_KEYS = ("driver_door_open", "passenger_door_open", "rear_left_door_open", "rear_right_door_open")
WINDOW_KEYS = ("front_left_window_open", "front_right_window_open", "rear_left_window_open", "rear_right_window_open")


def attention(vehicle: dict[str, Any], tires: dict[str, Any] | None) -> dict[str, Any]:
    status = vehicle.get("status") or {}
    diagnostics = vehicle.get("diagnostics") or {}
    parked = status.get("is_parked") is True or status.get("vehicle_state") == "parked"
    reasons: list[str] = []
    if parked and status.get("is_locked") is False:
        reasons.append("unlocked")
    if any(diagnostics.get(key) is True for key in DOOR_KEYS):
        reasons.append("door_open")
    if any(diagnostics.get(key) is True for key in WINDOW_KEYS):
        reasons.append("window_open")
    if diagnostics.get("trunk_open") is True:
        reasons.append("trunk_open")
    if parked and diagnostics.get("skylight_open") is True:
        reasons.append("sunroof_open")
    if tires and tires.get("warning"):
        reasons.append("tire_pressure")
    return {"needed": bool(reasons), "reasons": reasons}


# --- Maintenance (LeapConnect engine) -----------------------------------------

DUE_SOON_KM = 2000
DUE_SOON_DAYS = 60
_PRIORITY_ORDER = {"urgent": 0, "important": 1, "routine": 2}
_STATUS_ORDER = {"overdue": 0, "due_soon": 1, "ok": 2}


def maintenance_status(
    items: list[dict[str, Any]],
    done: dict[str, dict[str, Any]],
    current_km: float | None,
    now_ts: float,
    first_seen_ts: float,
) -> dict[str, Any]:
    """Due/overdue state for each service item, most urgent first.

    LeapConnect needs a logged service before it can compute a due point.
    Here an unlogged item assumes the service was done on schedule: the last
    multiple of its km interval, and the date tracking started.
    """
    rows: list[dict[str, Any]] = []
    for item in items:
        service = item.get("service_type")
        interval_km = item.get("interval_km")
        interval_months = item.get("interval_months")
        if not service or (not interval_km and not interval_months):
            continue
        log = done.get(service) or {}
        if log:
            last_km, last_ts, baseline = log.get("km"), log.get("ts"), "logged"
        else:
            last_km = (
                (current_km // interval_km) * interval_km
                if interval_km and current_km is not None else None
            )
            last_ts, baseline = first_seen_ts, "assumed"
        due_km = last_km + interval_km if interval_km and last_km is not None else None
        due_ts = last_ts + interval_months * 30 * 86400 if interval_months and last_ts else None
        remaining_km = round(due_km - current_km) if due_km is not None and current_km is not None else None
        remaining_days = int((due_ts - now_ts) // 86400) if due_ts is not None else None
        km_over = remaining_km is not None and remaining_km <= 0
        time_over = remaining_days is not None and remaining_days <= 0
        km_soon = remaining_km is not None and 0 < remaining_km <= DUE_SOON_KM
        time_soon = remaining_days is not None and 0 < remaining_days <= DUE_SOON_DAYS
        mode = item.get("trigger_mode") or "or"
        if mode == "km":
            overdue, soon = km_over, km_soon
        elif mode == "time":
            overdue, soon = time_over, time_soon
        elif mode == "and":
            overdue = km_over and time_over
            soon = (km_over or km_soon) and (time_over or time_soon) and not overdue
        else:
            overdue = km_over or time_over
            soon = (km_soon or time_soon) and not overdue
        rows.append({
            "service_type": service,
            "label": item.get("label") or service,
            "category": item.get("category") or "other",
            "priority": item.get("priority") or "routine",
            "status": "overdue" if overdue else "due_soon" if soon else "ok",
            "due_km": round(due_km) if due_km is not None else None,
            "due_date": _local(due_ts, UTC).date().isoformat() if due_ts is not None else None,
            "remaining_km": remaining_km,
            "remaining_days": remaining_days,
            "baseline": baseline,
            "interval_km": interval_km,
            "interval_months": interval_months,
        })

    def urgency(row: dict[str, Any]) -> tuple:
        nearest = [
            v for v in (
                row["remaining_km"] / DUE_SOON_KM if row["remaining_km"] is not None else None,
                row["remaining_days"] / DUE_SOON_DAYS if row["remaining_days"] is not None else None,
            ) if v is not None
        ]
        return (_STATUS_ORDER[row["status"]], min(nearest) if nearest else 999,
                _PRIORITY_ORDER.get(row["priority"], 9))

    rows.sort(key=urgency)
    return {
        "next": rows[0] if rows else None,
        "items": rows,
        "overdue": sum(1 for r in rows if r["status"] == "overdue"),
        "due_soon": sum(1 for r in rows if r["status"] == "due_soon"),
    }


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
            "tires": {
                str(day): row for day, row in (raw.get("tires") or {}).items()
                if isinstance(row, list) and len(row) == 4
            },
            "maintenance": {
                "first_seen": _num((raw.get("maintenance") or {}).get("first_seen")),
                "done": {
                    str(k): v for k, v in ((raw.get("maintenance") or {}).get("done") or {}).items()
                    if isinstance(v, dict)
                },
            },
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
                    "tires": state["tires"],
                    "maintenance": state["maintenance"],
                }
                for vin, state in self._vins.items()
            }
        }

    def _state(self, vin: str) -> dict[str, Any]:
        return self._vins.setdefault(vin, self._load_vin({}))

    def log_maintenance(
        self, vin: str, service_type: str, *, km: float | None, ts: float
    ) -> None:
        """Record a completed service; it becomes the new baseline."""
        state = self._state(vin)
        state["maintenance"]["done"][service_type] = {
            "km": round(km) if km is not None else None,
            "ts": ts,
        }

    def reset_maintenance(self, vin: str, service_type: str) -> bool:
        """Forget a logged service so the schedule assumption applies again."""
        return self._state(vin)["maintenance"]["done"].pop(service_type, None) is not None

    def update(
        self,
        vin: str,
        vehicle: dict[str, Any],
        *,
        now_ts: float,
        tz: tzinfo,
        home: tuple[float, float, float] | None = None,
        prices: dict[str, Any] | None = None,
        reference_kwh: float | None = None,
        maintenance_items: list[dict[str, Any]] | None = None,
        maintenance_schedule: str | None = None,
    ) -> dict[str, Any]:
        """Add one poll and return the summary for this vehicle."""
        state = self._state(vin)
        if state["maintenance"].get("first_seen") is None:
            state["maintenance"]["first_seen"] = now_ts
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
                session["tier"] = session_tier(session, home)
                session.pop("_position", None)
                cost, price = price_session(session, prices, tz)
                session.update(price_kwh=price, cost=cost)
                state["sessions"].append(session)
                state["last_session_end"] = session["end"]
        state["sessions"] = state["sessions"][-MAX_SESSIONS:]
        if ongoing_session is not None:
            ongoing_session["tier"] = session_tier(ongoing_session, home)

        summary = self._summary(state, now_ts, tz, ongoing_trip, ongoing_session, reference_kwh)

        # Tires: one reading per day for leak detection.
        today = _local_day(now_ts, tz).isoformat()
        tires_now = tire_values(vehicle)
        if all(v is not None for v in tires_now):
            state["tires"][today] = tires_now
            for old in sorted(state["tires"])[:-TIRE_HISTORY_DAYS]:
                del state["tires"][old]
        tires = tire_status(tires_now, state["tires"], today)

        # Costs per trip and per 100 km.
        avg_price = average_price_per_kwh(state["sessions"], now_ts, prices)
        summary["avg_price_kwh"] = avg_price
        if avg_price is not None:
            for key in ("today", "month"):
                energy = summary[key].get("energy_kwh")
                summary[key]["cost"] = round(energy * avg_price, 2) if energy is not None else None
            month = summary["month"]
            if month.get("energy_kwh") and month.get("distance_km"):
                month["cost_per_100km"] = round(
                    month["energy_kwh"] / month["distance_km"] * 100 * avg_price, 2
                )
        if state["trips"]:
            last = state["trips"][-1]
            extra = compare_with_similar(last, state["trips"][:-1], tz)
            if avg_price is not None and last.get("energy_kwh") is not None:
                extra["cost"] = round(last["energy_kwh"] * avg_price, 2)
            summary["last_trip"].update(extra)

        capacity = (summary.get("battery_health") or {}).get("capacity_kwh") or reference_kwh
        summary.update(
            parked_drain=parked_drain(buffer),
            tires=tires,
            charge_plan=charge_plan(vehicle, snapshot, capacity, prices, now_ts, tz),
            efficiency_by_temperature=efficiency_by_temperature(state["trips"]),
            attention=attention(vehicle, tires),
        )
        if maintenance_items:
            maintenance = maintenance_status(
                maintenance_items,
                state["maintenance"]["done"],
                _positive(snapshot.odometer_km),
                now_ts,
                state["maintenance"]["first_seen"],
            )
            maintenance["schedule"] = maintenance_schedule
            summary["maintenance"] = maintenance
        return summary

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
            "recent_trips": [_public(t) for t in reversed(trips[-RECENT_TRIPS:])],
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
