"""What the car's own history says about tomorrow and about the long run.

None of this is ported; it is built for this integration on top of the trip
log, the charging sessions and the daily history the cloud keeps:

- habits: when the car usually leaves on each weekday, and how far it goes
- outlook: whether the battery is enough for the next day
- real range: range from your own consumption at the current temperature
- eco score: each trip against your own usual consumption and speed
- routes: the places you drive between most, with usual time and energy
- battery forecast: where the measured capacity is heading
- savings: fuel and CO2 against a combustion car
- journey: a year of driving per day, monthly totals and records
- achievements
- charging curve and a "charging slower than usual" check
- events: what just happened (trip finished, charging started, new message…)

Everything is derived from data that is already stored. Predictions are only
given when there is enough history for them, otherwise the value is None.

This module has no Home Assistant imports so it can be tested on its own.
"""

from __future__ import annotations

import math
from datetime import UTC, date, datetime, time as dt_time, timedelta, tzinfo
from statistics import median
from typing import Any

# --- Habits -------------------------------------------------------------------
#: Weeks of history a habit is learned from.
HABIT_WEEKS = 8
HABIT_BIN_MIN = 15
#: Departures within this many minutes are the same habit.
HABIT_WINDOW_MIN = 45
HABIT_MIN_SAMPLES = 3
#: A habit must happen on at least this share of that weekday.
HABIT_MIN_SHARE = 0.5
HABIT_MIN_TRIP_KM = 1.0
MAX_HABITS_PER_DAY = 4

# --- Outlook ------------------------------------------------------------------
#: Battery kept in reserve on top of what the day usually needs.
RESERVE_SOC = 15.0
LOW_SOC = 15.0
#: Before this hour "the next day" is still today.
OUTLOOK_SWITCH_HOUR = 4
MIN_DRIVE_PROBABILITY = 0.3

# --- Consumption --------------------------------------------------------------
TEMP_BANDS = (
    ("below_0", None, 0.0), ("0_10", 0.0, 10.0), ("10_20", 10.0, 20.0), ("above_20", 20.0, None),
)
MIN_STATS_TRIP_KM = 2.0
MIN_CONSUMPTION = 5.0
MAX_CONSUMPTION = 60.0
BAND_MIN_TRIPS = 3
BAND_MIN_KM = 30.0
RECENT_TRIPS = 40
RECENT_MIN_KM = 50.0

# --- Eco score ----------------------------------------------------------------
ECO_MIN_BASELINE_TRIPS = 5
ECO_EFFICIENCY_WEIGHT = 75
ECO_SPEED_WEIGHT = 25

# --- Routes -------------------------------------------------------------------
ROUTE_HISTORY = 300
PLACE_RADIUS_M = 300.0
ZONE_MARGIN_M = 50.0
ROUTE_MIN_TRIPS = 3
MAX_ROUTES = 6
MAX_PLACES = 8

# --- Battery forecast ---------------------------------------------------------
FORECAST_MIN_SAMPLES = 6
#: Half a year at least: over a shorter time the seasons (a cold battery holds
#: less) would read as wear.
FORECAST_MIN_SPAN_DAYS = 180
FORECAST_MAX_SAMPLES = 200

# --- Savings ------------------------------------------------------------------
DEFAULT_FUEL_L_100KM = 6.5
DEFAULT_GRID_CO2_G_KWH = 250.0
#: Tank-to-wheel CO2 of petrol, kg per litre.
FUEL_CO2_KG_L = 2.31

# --- Journey ------------------------------------------------------------------
CALENDAR_DAYS = 371
MAX_DAYS = 1500
EARTH_KM = 40075.0

# --- Charging -----------------------------------------------------------------
CURVE_BUCKET_SOC = 2.0
MAX_CURVES = 30
SLOW_CHARGE_RATIO = 0.7
SLOW_CHARGE_MIN_MINUTES = 10.0
SLOW_CHARGE_MAX_SOC = 85.0
SLOW_CHARGE_MIN_SESSIONS = 3

# --- Events -------------------------------------------------------------------
MAX_SEEN_MESSAGES = 80
MAX_MESSAGE_EVENTS = 3
EVENT_TYPES = (
    "trip_started", "trip_finished", "charging_started", "charging_finished",
    "charging_interrupted", "plugged_in", "unplugged", "battery_low",
    "new_message", "software_update_available", "achievement_unlocked",
)


def _num(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _iso(ts: float | None) -> str | None:
    if ts is None:
        return None
    try:
        return datetime.fromtimestamp(ts, tz=UTC).isoformat(timespec="seconds")
    except (ValueError, OverflowError, OSError):
        return None


def _local(ts: float, tz: tzinfo) -> datetime:
    return datetime.fromtimestamp(ts, tz=UTC).astimezone(tz)


def _ts_from_iso(value: Any) -> float | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.timestamp()


def _hhmm(minutes: float) -> str:
    total = int(round(minutes)) % 1440
    return f"{total // 60:02d}:{total % 60:02d}"


def _percentile(values: list[float], share: float) -> float:
    """Nearest-rank percentile of a non-empty list."""
    ordered = sorted(values)
    rank = max(1, math.ceil(share * len(ordered)))
    return ordered[rank - 1]


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(min(1.0, a)))


# --- Daily history ------------------------------------------------------------


def merge_days(extra: dict[str, Any], rows: list[dict[str, Any]] | None) -> int:
    """Store per-day distance and energy rows; return how many days changed."""
    days: dict[str, list[Any]] = extra.setdefault("days", {})
    changed = 0
    for row in rows or []:
        day = row.get("date")
        km = _num(row.get("km"))
        if not isinstance(day, str) or len(day) != 10 or km is None or km < 0:
            continue
        kwh = _num(row.get("kwh"))
        value = [round(km, 1), round(kwh, 2) if kwh is not None and kwh >= 0 else None]
        if days.get(day) != value:
            days[day] = value
            changed += 1
    if len(days) > MAX_DAYS:
        for old in sorted(days)[: len(days) - MAX_DAYS]:
            del days[old]
    return changed


def daily_distance(
    extra: dict[str, Any], trips: list[dict[str, Any]], tz: tzinfo
) -> dict[str, list[Any]]:
    """Distance and energy per local day: the cloud's days, else the trip log."""
    merged: dict[str, list[Any]] = {}
    for trip in trips:
        start = _num(trip.get("start"))
        if start is None:
            continue
        day = _local(start, tz).date().isoformat()
        row = merged.setdefault(day, [0.0, None])
        row[0] = round(row[0] + (_num(trip.get("distance_km")) or 0.0), 1)
        energy = _num(trip.get("energy_kwh"))
        if energy is not None:
            row[1] = round((row[1] or 0.0) + energy, 2)
    for day, value in (extra.get("days") or {}).items():
        if isinstance(value, list) and len(value) == 2 and _num(value[0]) is not None:
            merged[day] = [value[0], value[1]]
    return merged


def backfill_request(
    extra: dict[str, Any], *, today: date, chunk_days: int = 90, max_days: int = 365,
    max_attempts: int = 6,
) -> tuple[date, date] | None:
    """The next window of older days to ask the cloud for, or None when done.

    Goes back from the oldest known day in chunks until a chunk comes back
    without any driving, ``max_days`` is reached or the cloud keeps failing.
    """
    state: dict[str, Any] = extra.setdefault("backfill", {})
    if state.get("done"):
        return None
    if (state.get("attempts") or 0) >= max_attempts:
        state["done"] = True
        return None
    try:
        end = date.fromisoformat(state["next_end"]) if state.get("next_end") else today - timedelta(days=7)
    except (TypeError, ValueError):
        end = today - timedelta(days=7)
    limit = today - timedelta(days=max_days)
    if end <= limit:
        state["done"] = True
        return None
    start = max(limit, end - timedelta(days=chunk_days - 1))
    return start, end


def backfill_result(
    extra: dict[str, Any], window: tuple[date, date], rows: list[dict[str, Any]] | None
) -> None:
    """Record the outcome of one backfill window."""
    state: dict[str, Any] = extra.setdefault("backfill", {})
    if rows is None:
        state["attempts"] = (state.get("attempts") or 0) + 1
        return
    state["attempts"] = 0
    merge_days(extra, rows)
    state["next_end"] = (window[0] - timedelta(days=1)).isoformat()
    if not any((_num(row.get("km")) or 0) > 0 for row in rows):
        # Nothing was driven in this window: this is before the car was used.
        state["done"] = True


# --- Habits -------------------------------------------------------------------


def _habit_span_start(
    trips: list[dict[str, Any]], days: dict[str, list[Any]], today: date, tz: tzinfo
) -> date:
    earliest = today - timedelta(days=HABIT_WEEKS * 7)
    known: list[date] = []
    starts = [_num(t.get("start")) for t in trips]
    starts = [s for s in starts if s is not None]
    if starts:
        known.append(_local(min(starts), tz).date())
    if days:
        try:
            known.append(date.fromisoformat(min(days)))
        except ValueError:
            pass
    if not known:
        return today
    return max(earliest, min(known))


def learn_habits(
    trips: list[dict[str, Any]],
    days: dict[str, list[Any]],
    *,
    now_ts: float,
    tz: tzinfo,
    ongoing_start: float | None = None,
) -> dict[str, Any]:
    """Usual departure times and distances per weekday (Monday = 0).

    ``ongoing_start`` is the start of a trip that is under way: a departure
    the car has already left for is not predicted again.
    """
    today = _local(now_ts, tz).date()
    span_start = _habit_span_start(trips, days, today, tz)
    occurrences = [0] * 7
    cursor = span_start
    while cursor < today:
        occurrences[cursor.weekday()] += 1
        cursor += timedelta(days=1)
    # Departure times come from the trip log only, which can be younger than
    # the cloud's daily history: their share is counted over its own days.
    trip_span_start = _habit_span_start(trips, {}, today, tz)
    trip_occurrences = [0] * 7
    cursor = max(span_start, trip_span_start)
    while cursor < today:
        trip_occurrences[cursor.weekday()] += 1
        cursor += timedelta(days=1)

    departures: list[list[tuple[date, int, float]]] = [[] for _ in range(7)]
    considered = 0
    for trip in trips:
        start = _num(trip.get("start"))
        km = _num(trip.get("distance_km")) or 0.0
        if start is None or km < HABIT_MIN_TRIP_KM:
            continue
        local = _local(start, tz)
        if not span_start <= local.date() < today:
            continue
        considered += 1
        departures[local.weekday()].append((local.date(), local.hour * 60 + local.minute, km))

    weekdays: list[dict[str, Any]] = []
    for weekday in range(7):
        seen = occurrences[weekday]
        trip_seen = trip_occurrences[weekday]
        habits: list[dict[str, Any]] = []
        remaining = list(departures[weekday])
        while trip_seen >= HABIT_MIN_SAMPLES and remaining and len(habits) < MAX_HABITS_PER_DAY:
            best_start, best_dates = 0, set()
            for start_min in range(0, 1440, HABIT_BIN_MIN):
                dates = {d for d, m, _ in remaining if start_min <= m < start_min + HABIT_WINDOW_MIN}
                if len(dates) > len(best_dates):
                    best_start, best_dates = start_min, dates
            share = len(best_dates) / trip_seen
            if len(best_dates) < HABIT_MIN_SAMPLES or share < HABIT_MIN_SHARE:
                break
            inside = [
                item for item in remaining
                if best_start <= item[1] < best_start + HABIT_WINDOW_MIN
            ]
            first: dict[date, tuple[int, float]] = {}
            for day, minutes, km in sorted(inside):
                first.setdefault(day, (minutes, km))
            times = [minutes for minutes, _ in first.values()]
            typical = median(times)
            habits.append(
                {
                    "minutes": int(round(typical)),
                    "time": _hhmm(typical),
                    "confidence": round(min(1.0, share), 2),
                    "samples": len(first),
                    "spread_min": max(times) - min(times),
                    "typical_km": round(median(km for _, km in first.values()), 1),
                }
            )
            remaining = [item for item in remaining if item not in inside]
        habits.sort(key=lambda h: h["minutes"])

        day_values = []
        cursor = span_start
        while cursor < today:
            if cursor.weekday() == weekday and cursor.isoformat() in days:
                km = _num(days[cursor.isoformat()][0])
                if km is not None:
                    day_values.append(km)
            cursor += timedelta(days=1)
        # Days the cloud did not report count as days without driving.
        zeros = max(0, seen - len(day_values))
        driving = [km for km in day_values if km >= 1.0]
        total_days = len(day_values) + zeros
        weekdays.append(
            {
                "weekday": weekday,
                "days_seen": seen,
                "drive_probability": round(len(driving) / total_days, 2) if total_days else None,
                "typical_km": round(median(driving), 1) if driving else None,
                "high_km": round(_percentile(driving, 0.8), 1) if driving else None,
                "departures": habits,
            }
        )

    return {
        "weeks": HABIT_WEEKS,
        "since": span_start.isoformat(),
        "trips_considered": considered,
        "weekdays": weekdays,
        "next_departure": _next_departure(
            weekdays, trips, now_ts=now_ts, tz=tz, ongoing_start=ongoing_start
        ),
    }


def _next_departure(
    weekdays: list[dict[str, Any]],
    trips: list[dict[str, Any]],
    *,
    now_ts: float,
    tz: tzinfo,
    ongoing_start: float | None = None,
) -> dict[str, Any] | None:
    now = _local(now_ts, tz)
    recent = [s for s in (_num(t.get("start")) for t in trips[-20:]) if s is not None]
    if ongoing_start is not None:
        recent.append(ongoing_start)
    for offset in range(8):
        day = now.date() + timedelta(days=offset)
        for habit in weekdays[day.weekday()]["departures"]:
            at = datetime.combine(
                day, dt_time(habit["minutes"] // 60, habit["minutes"] % 60), tzinfo=tz
            )
            at_ts = at.timestamp()
            if at_ts <= now_ts:
                continue
            # Already left for this one (a little early): it is done for today.
            if any(at_ts - HABIT_WINDOW_MIN * 60 <= start <= now_ts for start in recent):
                continue
            return {
                "at": at.astimezone(UTC).isoformat(timespec="seconds"),
                "weekday": day.weekday(),
                "time": habit["time"],
                "confidence": habit["confidence"],
                "samples": habit["samples"],
                "typical_km": habit["typical_km"],
                "in_minutes": int(round((at_ts - now_ts) / 60)),
            }
    return None


# --- Consumption --------------------------------------------------------------


def temperature_band(temp_c: float | None) -> str | None:
    if temp_c is None:
        return None
    for name, low, high in TEMP_BANDS:
        if (low is None or temp_c >= low) and (high is None or temp_c < high):
            return name
    return None


def _usable_trips(trips: list[dict[str, Any]]) -> list[dict[str, Any]]:
    usable = []
    for trip in trips:
        km = _num(trip.get("distance_km")) or 0.0
        energy = _num(trip.get("energy_kwh"))
        if km < MIN_STATS_TRIP_KM or energy is None or energy <= 0:
            continue
        if not MIN_CONSUMPTION <= energy / km * 100 <= MAX_CONSUMPTION:
            continue
        usable.append(trip)
    return usable


def personal_consumption(
    trips: list[dict[str, Any]], temp_c: float | None, six_week: float | None
) -> dict[str, Any] | None:
    """Your own kWh/100 km: at this temperature, else recent, else the cloud's 6 weeks."""
    usable = _usable_trips(trips[-ROUTE_HISTORY:])
    band = temperature_band(temp_c)
    if band is not None:
        chosen = [t for t in usable if temperature_band(_num(t.get("outdoor_temp_c"))) == band]
        km = sum(t["distance_km"] for t in chosen)
        if len(chosen) >= BAND_MIN_TRIPS and km >= BAND_MIN_KM:
            return {
                "kwh_100km": round(sum(t["energy_kwh"] for t in chosen) / km * 100, 1),
                "basis": "temperature",
                "band": band,
                "trips": len(chosen),
            }
    recent = usable[-RECENT_TRIPS:]
    km = sum(t["distance_km"] for t in recent)
    if km >= RECENT_MIN_KM:
        return {
            "kwh_100km": round(sum(t["energy_kwh"] for t in recent) / km * 100, 1),
            "basis": "recent",
            "band": None,
            "trips": len(recent),
        }
    cloud = _num(six_week)
    if cloud is not None and MIN_CONSUMPTION <= cloud <= MAX_CONSUMPTION:
        return {"kwh_100km": round(cloud, 1), "basis": "six_week", "band": None, "trips": 0}
    return None


def real_range(
    vehicle: dict[str, Any], consumption: dict[str, Any] | None, capacity_kwh: float | None
) -> dict[str, Any] | None:
    """Range from the energy in the battery and your own consumption."""
    if consumption is None:
        return None
    status = vehicle.get("status") or {}
    diagnostics = vehicle.get("diagnostics") or {}
    energy = _num(diagnostics.get("available_energy_kwh"))
    soc = _num(status.get("battery_percent_precise"))
    if soc is None:
        soc = _num(status.get("battery_percent"))
    if (energy is None or energy <= 0) and soc is not None and capacity_kwh:
        energy = soc / 100 * capacity_kwh
    if energy is None or energy <= 0:
        return None
    km = energy / consumption["kwh_100km"] * 100
    car = _num(status.get("remaining_range_km"))
    limit = _num((vehicle.get("charging") or {}).get("charge_limit_percent"))
    full = capacity_kwh / consumption["kwh_100km"] * 100 if capacity_kwh else None
    return {
        "km": round(km),
        "car_km": round(car) if car is not None else None,
        "delta_pct": round((km - car) / car * 100) if car else None,
        "full_km": round(full) if full is not None else None,
        "at_limit_km": (
            round(full * limit / 100) if full is not None and limit and 0 < limit <= 100 else None
        ),
        "energy_kwh": round(energy, 1),
        "consumption_kwh_100km": consumption["kwh_100km"],
        "basis": consumption["basis"],
        "band": consumption["band"],
    }


# --- Outlook ------------------------------------------------------------------


def outlook(
    habits: dict[str, Any],
    vehicle: dict[str, Any],
    consumption: dict[str, Any] | None,
    capacity_kwh: float | None,
    *,
    now_ts: float,
    tz: tzinfo,
) -> dict[str, Any]:
    """Is the battery enough for the next day's usual driving?"""
    now = _local(now_ts, tz)
    day = now.date() if now.hour < OUTLOOK_SWITCH_HOUR else now.date() + timedelta(days=1)
    pattern = habits["weekdays"][day.weekday()]
    status = vehicle.get("status") or {}
    charging = vehicle.get("charging") or {}
    soc = _num(status.get("battery_percent_precise"))
    if soc is None:
        soc = _num(status.get("battery_percent"))
    limit = _num(charging.get("charge_limit_percent"))
    plugged = charging.get("is_plugged_in") is True or charging.get("is_charging") is True

    probability = pattern["drive_probability"]
    expected = pattern["high_km"] if probability and probability >= MIN_DRIVE_PROBABILITY else None
    expected_kwh = needed_soc = None
    if expected is not None and consumption is not None:
        expected_kwh = round(expected * consumption["kwh_100km"] / 100, 1)
        if capacity_kwh:
            needed_soc = min(100.0, round(expected_kwh / capacity_kwh * 100 + RESERVE_SOC, 1))

    if soc is None:
        recommended, reason = None, "unknown"
    elif plugged:
        recommended, reason = False, "plugged_in"
    elif soc < LOW_SOC:
        recommended, reason = True, "low_battery"
    elif needed_soc is not None and soc < needed_soc:
        recommended, reason = True, "low_for_next_day"
    elif needed_soc is None:
        recommended, reason = False, "no_pattern"
    else:
        recommended, reason = False, "enough"

    departure = None
    for habit in pattern["departures"]:
        at = datetime.combine(day, dt_time(habit["minutes"] // 60, habit["minutes"] % 60), tzinfo=tz)
        if at.timestamp() > now_ts:
            departure = {
                "at": at.astimezone(UTC).isoformat(timespec="seconds"),
                "time": habit["time"],
                "confidence": habit["confidence"],
            }
            break
    return {
        "day": day.isoformat(),
        "weekday": day.weekday(),
        "is_today": day == now.date(),
        "drive_probability": probability,
        "typical_km": pattern["typical_km"],
        "expected_km": expected,
        "expected_kwh": expected_kwh,
        "needed_soc": needed_soc,
        "reserve_soc": RESERVE_SOC,
        "soc": round(soc, 1) if soc is not None else None,
        "charge_limit": limit,
        "plugged_in": plugged,
        "enough": None if needed_soc is None or soc is None else soc >= needed_soc,
        "limit_ok": None if needed_soc is None or limit is None else limit >= needed_soc,
        "charge_recommended": recommended,
        "reason": reason,
        "departure": departure,
    }


# --- Eco score ----------------------------------------------------------------


def eco_score(
    trip: dict[str, Any], history: list[dict[str, Any]], speed_limit_kmh: float | None
) -> dict[str, Any] | None:
    """0–100 for one trip: your own usual consumption (75 %) and speed (25 %).

    Needs five earlier trips to compare with; otherwise there is no score.
    """
    km = _num(trip.get("distance_km")) or 0.0
    own = _num(trip.get("consumption_kwh_100km"))
    if km < MIN_STATS_TRIP_KM or own is None or own <= 0:
        return None
    usable = [t for t in _usable_trips(history[-ROUTE_HISTORY:]) if t is not trip]
    band = temperature_band(_num(trip.get("outdoor_temp_c")))
    same = [t for t in usable if temperature_band(_num(t.get("outdoor_temp_c"))) == band]
    pool = same if band is not None and len(same) >= ECO_MIN_BASELINE_TRIPS else usable
    if len(pool) < ECO_MIN_BASELINE_TRIPS:
        return None
    baseline = median(t["energy_kwh"] / t["distance_km"] * 100 for t in pool)
    ratio = own / baseline
    efficiency = min(1.0, max(0.0, (1.4 - ratio) / 0.6))
    top = _num(trip.get("max_speed_kmh")) or 0.0
    limit = _num(speed_limit_kmh)
    if limit and limit > 0:
        speed = min(1.0, max(0.0, 1.0 - max(0.0, top - limit) / limit / 0.2))
    else:
        speed = min(1.0, max(0.0, (150.0 - top) / 40.0))
    return {
        "score": int(round(ECO_EFFICIENCY_WEIGHT * efficiency + ECO_SPEED_WEIGHT * speed)),
        "efficiency": round(efficiency, 2),
        "speed": round(speed, 2),
        "baseline_kwh_100km": round(baseline, 1),
        "vs_baseline_pct": round((ratio - 1) * 100),
    }


def score_trips(
    trips: list[dict[str, Any]], speed_limit_kmh: float | None, *, limit: int = 60
) -> dict[str, Any]:
    """Give each recent trip its score once (it is kept with the trip)."""
    recent = trips[-limit:]
    for index, trip in enumerate(recent):
        if "eco_score" in trip:
            continue
        position = len(trips) - len(recent) + index
        result = eco_score(trip, trips[:position], speed_limit_kmh)
        if result is not None:
            trip["eco_score"] = result["score"]
            trip["eco_vs_usual_pct"] = result["vs_baseline_pct"]
    scored = [t["eco_score"] for t in trips[-30:] if t.get("eco_score") is not None]
    last = trips[-1] if trips else None
    previous = [t["eco_score"] for t in trips[-60:-30] if t.get("eco_score") is not None]
    return {
        "last": last.get("eco_score") if last else None,
        "last_vs_usual_pct": last.get("eco_vs_usual_pct") if last else None,
        "average": round(sum(scored) / len(scored)) if scored else None,
        "trips": len(scored),
        "previous_average": round(sum(previous) / len(previous)) if previous else None,
        "best": max(scored) if scored else None,
    }


# --- Routes -------------------------------------------------------------------


def _resolve_places(
    trips: list[dict[str, Any]], zones: list[dict[str, Any]]
) -> tuple[dict[int, tuple[str, str]], dict[str, dict[str, Any]]]:
    """Give every trip its (from, to) place ids; describe the places."""
    places: dict[str, dict[str, Any]] = {}
    clusters: list[dict[str, Any]] = []

    def place_of(point: Any, arrival: bool) -> str | None:
        if not isinstance(point, (list, tuple)) or len(point) != 2:
            return None
        lat, lon = _num(point[0]), _num(point[1])
        if lat is None or lon is None:
            return None
        best: tuple[float, dict[str, Any]] | None = None
        for zone in zones:
            distance = haversine_m(lat, lon, zone["lat"], zone["lon"])
            if distance <= zone["radius"] + ZONE_MARGIN_M and (best is None or distance < best[0]):
                best = (distance, zone)
        if best is not None:
            zone = best[1]
            key = f"zone:{zone['name']}"
            entry = places.setdefault(
                key,
                {"id": key, "name": zone["name"], "home": bool(zone.get("home")), "zone": True,
                 "lat": round(zone["lat"], 4), "lon": round(zone["lon"], 4), "visits": 0},
            )
            entry["visits"] += int(arrival)
            return key
        for cluster in clusters:
            if haversine_m(lat, lon, cluster["lat"], cluster["lon"]) <= PLACE_RADIUS_M:
                cluster["visits"] += int(arrival)
                return cluster["id"]
        cluster = {"id": f"place:{len(clusters) + 1}", "name": None, "home": False, "zone": False,
                   "lat": round(lat, 3), "lon": round(lon, 3), "visits": int(arrival)}
        clusters.append(cluster)
        return cluster["id"]

    ends: dict[int, tuple[str, str]] = {}
    for index, trip in enumerate(trips):
        start = place_of(trip.get("_sp"), False)
        end = place_of(trip.get("_ep"), True)
        if start and end:
            ends[index] = (start, end)
    for cluster in clusters:
        places[cluster["id"]] = cluster
    return ends, places


def frequent_routes(
    trips: list[dict[str, Any]],
    zones: list[dict[str, Any]] | None,
    *,
    avg_price: float | None,
    tz: tzinfo,
) -> dict[str, Any]:
    """The routes driven most often, with their usual time, energy and cost."""
    history = trips[-ROUTE_HISTORY:]
    ends, places = _resolve_places(history, zones or [])
    groups: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for index, (start, end) in ends.items():
        if start != end:
            groups.setdefault((start, end), []).append(history[index])

    # Unnamed places get a stable number by how often they are visited.
    unnamed = sorted(
        (p for p in places.values() if not p["zone"]), key=lambda p: (-p["visits"], p["id"])
    )
    for rank, place in enumerate(unnamed, start=1):
        place["rank"] = rank

    def describe(place_id: str) -> dict[str, Any]:
        place = places[place_id]
        return {k: place.get(k) for k in ("id", "name", "home", "zone", "lat", "lon", "rank")}

    routes: list[dict[str, Any]] = []
    for (start, end), items in groups.items():
        if len(items) < ROUTE_MIN_TRIPS:
            continue
        durations = [d for d in (_num(t.get("duration_min")) for t in items) if d is not None]
        usable = _usable_trips(items)
        km = sum(t["distance_km"] for t in usable)
        energy = sum(t["energy_kwh"] for t in usable)
        consumption = round(energy / km * 100, 1) if km > 0 else None
        usual_energy = energy / len(usable) if usable else None
        minutes = [
            _local(t["start"], tz).hour * 60 + _local(t["start"], tz).minute for t in items
        ]
        routes.append(
            {
                "from": describe(start),
                "to": describe(end),
                "trips": len(items),
                "distance_km": round(median(t["distance_km"] for t in items), 1),
                "duration_min": round(median(durations), 1) if durations else None,
                "best_duration_min": round(min(durations), 1) if durations else None,
                "consumption_kwh_100km": consumption,
                "best_consumption_kwh_100km": (
                    round(min(t["energy_kwh"] / t["distance_km"] * 100 for t in usable), 1)
                    if usable else None
                ),
                "energy_kwh": round(usual_energy, 2) if usual_energy is not None else None,
                "cost": (
                    round(usual_energy * avg_price, 2)
                    if usual_energy is not None and avg_price else None
                ),
                "usual_departure": _hhmm(median(minutes)),
                "last": _iso(max(t["start"] for t in items)),
            }
        )
    routes.sort(key=lambda r: (-r["trips"], r["from"]["id"], r["to"]["id"]))
    top_places = sorted(places.values(), key=lambda p: (-p["visits"], p["id"]))[:MAX_PLACES]
    return {
        "routes": routes[:MAX_ROUTES],
        "places": [
            {k: p.get(k) for k in ("id", "name", "home", "zone", "lat", "lon", "rank", "visits")}
            for p in top_places if p["visits"] >= ROUTE_MIN_TRIPS
        ],
        "place_count": sum(1 for p in places.values() if p["visits"] >= 2),
        "trips_considered": len(ends),
    }


def usable_zones(zones: Any) -> list[dict[str, Any]]:
    """Zones with a name, a position and a radius; anything else is dropped."""
    result: list[dict[str, Any]] = []
    for zone in zones if isinstance(zones, list) else []:
        if not isinstance(zone, dict) or not zone.get("name"):
            continue
        lat, lon, radius = _num(zone.get("lat")), _num(zone.get("lon")), _num(zone.get("radius"))
        if lat is None or lon is None or radius is None or radius <= 0:
            continue
        result.append({"name": str(zone["name"]), "lat": lat, "lon": lon, "radius": radius,
                       "home": bool(zone.get("home"))})
    return result


def trip_place_names(
    trip: dict[str, Any], zones: list[dict[str, Any]] | None
) -> tuple[str | None, str | None]:
    """Zone names of a trip's start and end, when they are inside a zone."""
    names: list[str | None] = []
    for point in (trip.get("_sp"), trip.get("_ep")):
        name = None
        if isinstance(point, (list, tuple)) and len(point) == 2:
            lat, lon = _num(point[0]), _num(point[1])
            best = None
            for zone in zones or []:
                if lat is None or lon is None:
                    break
                distance = haversine_m(lat, lon, zone["lat"], zone["lon"])
                if distance <= zone["radius"] + ZONE_MARGIN_M and (best is None or distance < best[0]):
                    best = (distance, zone["name"])
            name = best[1] if best else None
        names.append(name)
    return names[0], names[1]


# --- Battery forecast ---------------------------------------------------------


def battery_forecast(
    full_charge: dict[str, float], reference_kwh: float | None, *, today: date
) -> dict[str, Any] | None:
    """Where the measured capacity is heading (robust trend over full charges)."""
    points: list[tuple[int, float]] = []
    for day, kwh in sorted(full_charge.items())[-FORECAST_MAX_SAMPLES:]:
        value = _num(kwh)
        try:
            ordinal = date.fromisoformat(day).toordinal()
        except (TypeError, ValueError):
            continue
        if value is not None and value > 0:
            points.append((ordinal, value))
    reference = _num(reference_kwh)
    if len(points) < FORECAST_MIN_SAMPLES or not reference or reference <= 0:
        return None
    span = points[-1][0] - points[0][0]
    if span < FORECAST_MIN_SPAN_DAYS:
        return None
    slopes = [
        (b[1] - a[1]) / (b[0] - a[0])
        for i, a in enumerate(points) for b in points[i + 1:] if b[0] != a[0]
    ]
    if not slopes:
        return None
    slope = median(slopes)  # kWh per day (Theil–Sen)
    level = median(kwh - slope * (ordinal - points[-1][0]) for ordinal, kwh in points)
    soh_now = level / reference * 100
    per_year = slope * 365 / reference * 100
    result: dict[str, Any] = {
        "trend_pct_per_year": round(per_year, 2),
        "soh_pct": round(soh_now, 1),
        "soh_in_1_year": round(min(100.0, soh_now + per_year), 1),
        "samples": len(points),
        "span_days": span,
        "confidence": (
            "high" if len(points) >= 30 and span >= 365
            else "medium" if len(points) >= 12 and span >= 120
            else "low"
        ),
        "stable": per_year >= -0.2,
        "reaches_90": None,
        "reaches_80": None,
    }
    if per_year < -0.2:
        for target in (90, 80):
            if soh_now <= target:
                continue
            days = (soh_now - target) / (-per_year) * 365
            if days <= 30 * 365:
                reached = today + timedelta(days=round(days))
                result[f"reaches_{target}"] = reached.strftime("%Y-%m")
    return result


# --- Savings ------------------------------------------------------------------


def savings(
    *,
    month_km: float | None,
    month_kwh: float | None,
    month_cost: float | None,
    lifetime_km: float | None,
    lifetime_kwh: float | None,
    avg_price: float | None,
    fuel_price: float | None,
    fuel_l_100km: float | None,
    grid_co2_g_kwh: float | None,
) -> dict[str, Any]:
    """Fuel, money and CO2 against a combustion car driving the same distance.

    Money is only given when a fuel price is configured; litres and CO2 use
    the configured (or default) comparison consumption and grid intensity.
    """
    litres_100 = fuel_l_100km if fuel_l_100km and fuel_l_100km > 0 else DEFAULT_FUEL_L_100KM
    grid = grid_co2_g_kwh if grid_co2_g_kwh is not None and grid_co2_g_kwh >= 0 else DEFAULT_GRID_CO2_G_KWH
    price = fuel_price if fuel_price and fuel_price > 0 else None

    def block(km: float | None, kwh: float | None, ev_cost: float | None) -> dict[str, Any] | None:
        if km is None or km <= 0:
            return None
        litres = km * litres_100 / 100
        if ev_cost is None and kwh is not None and avg_price:
            ev_cost = kwh * avg_price
        # Round first, so the three amounts shown always add up.
        fuel_cost = round(litres * price, 2) if price else None
        ev_cost = round(ev_cost, 2) if ev_cost is not None else None
        return {
            "km": round(km, 1),
            "fuel_litres": round(litres, 1),
            "fuel_cost": fuel_cost,
            "ev_cost": ev_cost,
            "saved": (
                round(fuel_cost - ev_cost, 2)
                if fuel_cost is not None and ev_cost is not None else None
            ),
            "co2_saved_kg": (
                round(litres * FUEL_CO2_KG_L - kwh * grid / 1000, 1) if kwh is not None else None
            ),
        }

    return {
        "month": block(month_km, month_kwh, month_cost),
        "lifetime": block(lifetime_km, lifetime_kwh, None),
        "assumptions": {
            "fuel_l_100km": litres_100,
            "fuel_price": price,
            "grid_co2_g_kwh": grid,
            "fuel_co2_kg_l": FUEL_CO2_KG_L,
        },
    }


# --- Lifetime counters --------------------------------------------------------


def update_lifetime(
    extra: dict[str, Any],
    trips: list[dict[str, Any]],
    sessions: list[dict[str, Any]],
    *,
    prices: dict[str, Any] | None,
    tz: tzinfo,
) -> dict[str, Any]:
    """Counters and records that outlive the 500-trip log."""
    life: dict[str, Any] = extra.setdefault("lifetime", {})
    seen_trip = _num(life.get("last_trip_end")) or 0.0
    for trip in trips:
        end = _num(trip.get("end")) or 0.0
        if end <= seen_trip:
            continue
        km = _num(trip.get("distance_km")) or 0.0
        energy = _num(trip.get("energy_kwh"))
        day = _local(_num(trip.get("start")) or end, tz).date().isoformat()
        life["trips"] = (life.get("trips") or 0) + 1
        life["trip_km"] = round((life.get("trip_km") or 0.0) + km, 1)
        if energy is not None:
            life["trip_kwh"] = round((life.get("trip_kwh") or 0.0) + energy, 2)
        if km > ((life.get("longest_trip") or {}).get("km") or 0):
            life["longest_trip"] = {"km": round(km, 1), "date": day}
        top = _num(trip.get("max_speed_kmh"))
        if top and top > ((life.get("top_speed") or {}).get("kmh") or 0):
            life["top_speed"] = {"kmh": round(top), "date": day}
        cons = _num(trip.get("consumption_kwh_100km"))
        if cons and km >= 10 and MIN_CONSUMPTION <= cons <= MAX_CONSUMPTION:
            best = (life.get("most_efficient_trip") or {}).get("kwh_100km")
            if best is None or cons < best:
                life["most_efficient_trip"] = {"kwh_100km": cons, "km": round(km, 1), "date": day}
        temp = _num(trip.get("outdoor_temp_c"))
        if temp is not None and km >= MIN_STATS_TRIP_KM:
            coldest = life.get("coldest_drive_c")
            life["coldest_drive_c"] = temp if coldest is None else min(coldest, temp)
        seen_trip = max(seen_trip, end)
    life["last_trip_end"] = seen_trip

    band = (prices or {}).get("low_band")
    seen_session = _num(life.get("last_session_end")) or 0.0
    for session in sessions:
        end = _num(session.get("end")) or 0.0
        if end <= seen_session:
            continue
        energy = _num(session.get("energy_kwh"))
        day = _local(_num(session.get("start")) or end, tz).date().isoformat()
        life["sessions"] = (life.get("sessions") or 0) + 1
        if energy is not None:
            life["session_kwh"] = round((life.get("session_kwh") or 0.0) + energy, 2)
            if energy > ((life.get("biggest_charge") or {}).get("kwh") or 0):
                life["biggest_charge"] = {"kwh": round(energy, 1), "date": day}
        peak = _num(session.get("peak_power_kw"))
        if peak and peak > ((life.get("fastest_charge") or {}).get("kw") or 0):
            life["fastest_charge"] = {"kw": round(peak, 1), "date": day}
        if session.get("tier") == "home":
            life["home_sessions"] = (life.get("home_sessions") or 0) + 1
            if band and _in_low_tariff(_local(_num(session.get("start")) or end, tz), band):
                life["low_tariff_sessions"] = (life.get("low_tariff_sessions") or 0) + 1
        seen_session = max(seen_session, end)
    life["last_session_end"] = seen_session
    return life


def _in_low_tariff(when: datetime, band: dict[str, Any]) -> bool:
    if band.get("weekends") and when.weekday() >= 5:
        return True
    start, end = band.get("start_min"), band.get("end_min")
    if start is None or end is None or start == end:
        return False
    minutes = when.hour * 60 + when.minute
    if end <= start:
        return minutes >= start or minutes < end
    return start <= minutes < end


# --- Journey ------------------------------------------------------------------


def journey(
    days: dict[str, list[Any]],
    life: dict[str, Any],
    vehicle: dict[str, Any],
    *,
    today: date,
) -> dict[str, Any]:
    """A year of driving per day, monthly totals, lifetime totals and records."""
    known: dict[date, tuple[float, float | None]] = {}
    for day, value in days.items():
        try:
            parsed = date.fromisoformat(day)
        except (TypeError, ValueError):
            continue
        km = _num(value[0]) if isinstance(value, list) and value else None
        if km is None or parsed > today:
            continue
        known[parsed] = (km, _num(value[1]) if len(value) > 1 else None)

    start = today - timedelta(days=CALENDAR_DAYS - 1)
    # Start the calendar on a Monday so the weeks line up.
    start -= timedelta(days=start.weekday())
    calendar: list[int] = []
    cursor = start
    while cursor <= today:
        entry = known.get(cursor)
        calendar.append(-1 if entry is None else int(round(entry[0])))
        cursor += timedelta(days=1)

    months: list[dict[str, Any]] = []
    year, month = today.year, today.month
    for _ in range(12):
        chosen = [(d, v) for d, v in known.items() if d.year == year and d.month == month]
        energy = [v[1] for _, v in chosen if v[1] is not None]
        months.append(
            {
                "month": f"{year:04d}-{month:02d}",
                "km": round(sum(v[0] for _, v in chosen), 1),
                "kwh": round(sum(energy), 1) if energy else None,
                "driving_days": sum(1 for _, v in chosen if v[0] >= 1),
                "days": len(chosen),
            }
        )
        month -= 1
        if month == 0:
            year, month = year - 1, 12
    months.reverse()

    driving = sorted(d for d, v in known.items() if v[0] >= 1)
    best_streak = current_streak = run = 0
    previous: date | None = None
    for day in driving:
        run = run + 1 if previous is not None and (day - previous).days == 1 else 1
        best_streak = max(best_streak, run)
        previous = day
    if driving and (today - driving[-1]).days <= 1:
        current_streak = run
    longest = max(known.items(), key=lambda item: item[1][0], default=None)
    busiest = max((m for m in months if m["km"] > 0), key=lambda m: m["km"], default=None)

    this_year = [(d, v) for d, v in known.items() if d.year == today.year]
    year_km = sum(v[0] for _, v in this_year)
    year_energy = [v[1] for _, v in this_year if v[1] is not None]
    day_of_year = today.timetuple().tm_yday
    days_in_year = 366 if (today.year % 4 == 0 and (today.year % 100 or today.year % 400 == 0)) else 365
    # The rest of the year at the pace of the days that are known this year
    # (the history may begin later than 1 January).
    projected_km = None
    if this_year and year_km > 0:
        known_span = (today - min(d for d, _ in this_year)).days + 1
        if known_span >= 14:
            projected_km = round(year_km + year_km / known_span * (days_in_year - day_of_year))
    tracked_km = sum(v[0] for v in known.values())
    tracked_energy = [v[1] for v in known.values() if v[1] is not None]
    history = vehicle.get("history") or {}
    status = vehicle.get("status") or {}
    odometer = _num(history.get("total_mileage_km")) or _num(status.get("odometer_km"))
    delivery_days = _num(history.get("delivery_days"))
    return {
        "calendar": {"start": start.isoformat(), "km": calendar},
        "months": months,
        "totals": {
            "tracked_km": round(tracked_km, 1),
            "tracked_kwh": round(sum(tracked_energy), 1) if tracked_energy else None,
            "driving_days": len(driving),
            "days": len(known),
            "since": min(known).isoformat() if known else None,
            "odometer_km": round(odometer) if odometer is not None else None,
            "lifetime_energy_kwh": _num(history.get("total_energy_kwh")),
            "delivery_days": int(delivery_days) if delivery_days is not None else None,
            "km_per_day": (
                round(odometer / delivery_days, 1)
                if odometer is not None and delivery_days and delivery_days > 0 else None
            ),
            "earth_laps": round(odometer / EARTH_KM, 2) if odometer is not None else None,
            "trips": life.get("trips"),
            "charging_sessions": life.get("sessions"),
            "charged_kwh": life.get("session_kwh"),
        },
        "year": {
            "year": today.year,
            "km": round(year_km, 1),
            "kwh": round(sum(year_energy), 1) if year_energy else None,
            "projected_km": projected_km,
        },
        "records": {
            "longest_day": (
                {"date": longest[0].isoformat(), "km": round(longest[1][0], 1)}
                if longest and longest[1][0] > 0 else None
            ),
            "busiest_month": (
                {"month": busiest["month"], "km": busiest["km"]} if busiest else None
            ),
            "best_streak_days": best_streak or None,
            "current_streak_days": current_streak or None,
            "longest_trip": life.get("longest_trip"),
            "most_efficient_trip": life.get("most_efficient_trip"),
            "top_speed": life.get("top_speed"),
            "biggest_charge": life.get("biggest_charge"),
            "fastest_charge": life.get("fastest_charge"),
            "coldest_drive_c": life.get("coldest_drive_c"),
        },
    }


# --- Achievements -------------------------------------------------------------

#: id -> (bronze, silver, gold); a higher value is better unless noted.
ACHIEVEMENT_TIERS: dict[str, tuple[float, float, float]] = {
    "distance": (1_000, 10_000, 50_000),
    "long_day": (150, 300, 500),
    "long_trip": (50, 150, 300),
    "eco_driver": (60, 75, 90),
    "streak": (5, 10, 20),
    "explorer": (3, 8, 20),
    "frost": (0, -5, -10),  # lower is better
    "full_cycles": (10, 50, 200),
    "low_tariff": (5, 25, 100),
    "co2": (100, 1_000, 5_000),
    "anniversary": (30, 180, 365),
}
_LOWER_IS_BETTER = {"frost"}
BADGE_QUIET_SECONDS = 24 * 3600


def achievements(
    extra: dict[str, Any],
    *,
    journey_data: dict[str, Any],
    eco: dict[str, Any],
    places: int,
    savings_data: dict[str, Any],
    capacity_kwh: float | None,
    now_ts: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Badges with three levels each; returns (all badges, newly reached)."""
    totals, records = journey_data["totals"], journey_data["records"]
    life_co2 = (savings_data.get("lifetime") or {}).get("co2_saved_kg")
    charged = totals.get("charged_kwh") or 0.0
    values: dict[str, float | None] = {
        "distance": totals.get("odometer_km") or totals.get("tracked_km"),
        "long_day": (records.get("longest_day") or {}).get("km"),
        "long_trip": (records.get("longest_trip") or {}).get("km"),
        "eco_driver": eco.get("average") if (eco.get("trips") or 0) >= 10 else None,
        "streak": records.get("best_streak_days"),
        "explorer": places or None,
        "frost": records.get("coldest_drive_c"),
        "full_cycles": round(charged / capacity_kwh, 1) if capacity_kwh and charged else None,
        "low_tariff": (extra.get("lifetime") or {}).get("low_tariff_sessions"),
        "co2": life_co2 if life_co2 and life_co2 > 0 else None,
        "anniversary": totals.get("delivery_days") or totals.get("days"),
    }
    stored: dict[str, Any] = extra.setdefault("badges", {})
    first_run = not extra.get("badges_seeded")
    if first_run:
        extra["badges_since"] = now_ts
    # Levels found while the older history is still being read back are not
    # news: stay quiet until that is done (or a day has passed).
    since = _num(extra.get("badges_since"))
    backfilling = (
        not (extra.get("backfill") or {}).get("done")
        and since is not None and now_ts - since < BADGE_QUIET_SECONDS
    )
    quiet = first_run or backfilling
    badges: list[dict[str, Any]] = []
    unlocked: list[dict[str, Any]] = []
    for badge_id, tiers in ACHIEVEMENT_TIERS.items():
        value = values.get(badge_id)
        lower = badge_id in _LOWER_IS_BETTER
        level = 0
        if value is not None:
            level = sum(1 for tier in tiers if (value <= tier if lower else value >= tier))
        target = tiers[level] if level < 3 else None
        progress = 1.0
        if target is not None:
            if value is None:
                progress = 0.0
            elif lower:
                base = tiers[level - 1] if level else 10.0
                progress = min(1.0, max(0.0, (base - value) / (base - target))) if base != target else 0.0
            else:
                base = tiers[level - 1] if level else 0.0
                progress = min(1.0, max(0.0, (value - base) / (target - base)))
        record = stored.get(badge_id) if isinstance(stored.get(badge_id), dict) else {}
        previous = int(record.get("level") or 0)
        if level > previous:
            record = {"level": level, "at": _iso(now_ts)}
            stored[badge_id] = record
            if not quiet:
                unlocked.append({"id": badge_id, "level": level, "value": value})
        badges.append(
            {
                "id": badge_id,
                "level": max(level, previous),
                "value": value,
                "next": target,
                "progress": round(progress, 2),
                "reached_at": record.get("at") if max(level, previous) else None,
            }
        )
    extra["badges_seeded"] = True
    return badges, unlocked


# --- Charging curve -----------------------------------------------------------


def session_curve(buffer: list[Any], start_ts: float, end_ts: float | None) -> list[list[float]]:
    """Charging power by state of charge for one session: [[soc, kW], …]."""
    buckets: dict[float, list[float]] = {}
    for snapshot in buffer:
        ts = getattr(snapshot, "ts", None)
        if ts is None or ts < start_ts or (end_ts is not None and ts > end_ts):
            continue
        soc = _num(getattr(snapshot, "soc", None))
        power = _num(getattr(snapshot, "charge_power_kw", None))
        if soc is None or power is None or power <= 0 or getattr(snapshot, "is_charging", None) is not True:
            continue
        key = math.floor(soc / CURVE_BUCKET_SOC) * CURVE_BUCKET_SOC
        buckets.setdefault(key, []).append(power)
    return [[soc, round(sum(v) / len(v), 1)] for soc, v in sorted(buckets.items())]


def charging_curves(
    extra: dict[str, Any],
    buffer: list[Any],
    sessions: list[dict[str, Any]],
    ongoing: dict[str, Any] | None,
) -> dict[str, Any]:
    """The live curve, the last finished one and what is usual for that kind."""
    store: dict[str, Any] = extra.setdefault("curves", {})
    for session in sessions[-5:]:
        start, end = _num(session.get("start")), _num(session.get("end"))
        if start is None or end is None:
            continue
        key = str(int(start))
        if key in store:
            continue
        points = session_curve(buffer, start, end)
        if len(points) >= 2:
            store[key] = {
                "points": points,
                "dc": bool(session.get("dc")),
                "tier": session.get("tier"),
                "end": end,
            }
    for old in sorted(store, key=lambda k: int(k))[:-MAX_CURVES]:
        del store[old]

    current = None
    if ongoing is not None and _num(ongoing.get("start")) is not None:
        points = session_curve(buffer, ongoing["start"], None)
        current = {"points": points, "dc": bool(ongoing.get("dc")), "start": _iso(ongoing["start"])}
    last_key = max(store, key=lambda k: int(k), default=None)
    last = None
    if last_key is not None:
        item = store[last_key]
        last = {"points": item["points"], "dc": item["dc"], "start": _iso(float(last_key)),
                "end": _iso(item.get("end"))}
    kind = (current or last or {}).get("dc")
    usual: list[list[float]] = []
    if kind is not None:
        pooled: dict[float, list[float]] = {}
        for key, item in store.items():
            if item["dc"] != kind or (current is None and key == last_key):
                continue
            for soc, power in item["points"]:
                pooled.setdefault(soc, []).append(power)
        usual = [[soc, round(median(v), 1)] for soc, v in sorted(pooled.items()) if len(v) >= 2]
    return {"current": current, "last": last, "usual": usual, "sessions": len(store)}


def charge_health(
    vehicle: dict[str, Any], sessions: list[dict[str, Any]], ongoing: dict[str, Any] | None
) -> dict[str, Any]:
    """Is an AC session clearly slower than the usual one at this kind of place?"""
    tier = (ongoing or {}).get("tier")
    result: dict[str, Any] = {"slow": False, "now_kw": None, "usual_kw": None, "tier": tier, "samples": 0}
    if ongoing is None or ongoing.get("dc"):
        return result
    peaks = [
        p for p in (
            _num(s.get("peak_power_kw")) for s in sessions[-30:]
            if s.get("tier") == tier and not s.get("dc")
        ) if p and p > 0
    ][-10:]
    result["samples"] = len(peaks)
    if len(peaks) < SLOW_CHARGE_MIN_SESSIONS:
        return result
    usual = median(peaks)
    charging = vehicle.get("charging") or {}
    status = vehicle.get("status") or {}
    now_kw = _num(charging.get("charging_power_kw"))
    soc = _num(status.get("battery_percent_precise"))
    if soc is None:
        soc = _num(status.get("battery_percent"))
    result.update(usual_kw=round(usual, 1), now_kw=round(now_kw, 1) if now_kw is not None else None)
    duration = _num(ongoing.get("duration_min")) or 0.0
    if (
        now_kw is not None and now_kw > 0 and usual >= 2.0
        and duration >= SLOW_CHARGE_MIN_MINUTES
        and (soc is None or soc < SLOW_CHARGE_MAX_SOC)
        and now_kw < usual * SLOW_CHARGE_RATIO
    ):
        result["slow"] = True
    return result


# --- Events -------------------------------------------------------------------


def detect_events(
    extra: dict[str, Any],
    *,
    vehicle: dict[str, Any],
    last_trip: dict[str, Any] | None,
    last_session: dict[str, Any] | None,
    messages: list[dict[str, Any]] | None,
    software: dict[str, Any] | None,
    unlocked: list[dict[str, Any]] | None,
    now_ts: float,
    trip_cost: float | None = None,
) -> list[dict[str, Any]]:
    """What changed since the previous poll. The first run only sets the baseline.

    A charging session counts as interrupted when it ended below the charge
    limit with the cable still in. That is only said when the car reports the
    limit reliably (not on the T03) and does not report a completed charge.
    """
    status = vehicle.get("status") or {}
    charging = vehicle.get("charging") or {}
    diagnostics = vehicle.get("diagnostics") or {}
    soc = _num(status.get("battery_percent"))
    limit = _num(charging.get("charge_limit_percent"))
    if charging.get("charge_limit_reliability") == "unverified":
        limit = None
    seen_keys = [
        f"id:{m['id']}" if m.get("id") else f"t:{m.get('ts')}:{m.get('title')}"
        for m in messages or []
    ]
    now_flags = {
        "driving": status.get("is_driving") is True,
        "charging": charging.get("is_charging") is True,
        "plugged": charging.get("is_plugged_in") is True or charging.get("is_charging") is True,
        "trip_end": _num((last_trip or {}).get("end")),
        "session_end": _num((last_session or {}).get("end")),
        "low": soc is not None and soc < LOW_SOC,
        "software": (software or {}).get("latest_version") if (software or {}).get("update_available") else None,
    }
    previous = extra.get("flags")
    events: list[dict[str, Any]] = []
    at = _iso(now_ts)

    def add(kind: str, **data: Any) -> None:
        events.append({"type": kind, "at": at, **{k: v for k, v in data.items() if v is not None}})

    if isinstance(previous, dict):
        if now_flags["driving"] and not previous.get("driving"):
            add("trip_started", soc=soc, odometer_km=_num(status.get("odometer_km")))
        if now_flags["trip_end"] and now_flags["trip_end"] != previous.get("trip_end") and last_trip:
            add(
                "trip_finished",
                distance_km=last_trip.get("distance_km"),
                duration_min=last_trip.get("duration_min"),
                energy_kwh=last_trip.get("energy_kwh"),
                consumption_kwh_100km=last_trip.get("consumption_kwh_100km"),
                avg_speed_kmh=last_trip.get("avg_speed_kmh"),
                max_speed_kmh=last_trip.get("max_speed_kmh"),
                start_soc=last_trip.get("start_soc"),
                end_soc=last_trip.get("end_soc"),
                eco_score=last_trip.get("eco_score"),
                cost=trip_cost,
                start=_iso(_num(last_trip.get("start"))),
                end=_iso(_num(last_trip.get("end"))),
            )
        if now_flags["plugged"] and not previous.get("plugged"):
            add("plugged_in", soc=soc)
        if now_flags["charging"] and not previous.get("charging"):
            add("charging_started", soc=soc, power_kw=_num(charging.get("charging_power_kw")),
                charge_limit=limit)
        if (
            now_flags["session_end"] and now_flags["session_end"] != previous.get("session_end")
            and last_session
        ):
            end_soc = _num(last_session.get("end_soc"))
            reached = (
                None if end_soc is None or limit is None else bool(end_soc >= limit - 3)
            )
            payload = {
                "energy_kwh": last_session.get("energy_kwh"),
                "duration_min": last_session.get("duration_min"),
                "start_soc": last_session.get("start_soc"),
                "end_soc": end_soc,
                "peak_power_kw": last_session.get("peak_power_kw"),
                "tier": last_session.get("tier"),
                "cost": last_session.get("cost"),
                "charge_limit": limit,
            }
            add("charging_finished", reached_limit=reached, **payload)
            if (
                reached is False and now_flags["plugged"]
                and diagnostics.get("fully_charged") is not True
            ):
                add("charging_interrupted", **payload)
        if previous.get("plugged") and not now_flags["plugged"]:
            add("unplugged", soc=soc)
        if now_flags["low"] and not previous.get("low") and not now_flags["charging"]:
            add("battery_low", soc=soc, range_km=_num(status.get("remaining_range_km")))
        if now_flags["software"] and now_flags["software"] != previous.get("software"):
            add("software_update_available",
                installed_version=(software or {}).get("installed_version"),
                latest_version=now_flags["software"])
        known = set(previous.get("messages") or [])
        fresh = [
            (key, message) for key, message in zip(seen_keys, messages or [], strict=False)
            if key not in known
        ]
        for _, message in list(reversed(fresh))[-MAX_MESSAGE_EVENTS:]:
            add("new_message", title=message.get("title"), message=message.get("message"),
                message_type=message.get("type"), sent=message.get("time"))
        for badge in unlocked or []:
            add("achievement_unlocked", achievement=badge["id"], level=badge["level"])

    remembered = list((previous or {}).get("messages") or []) if isinstance(previous, dict) else []
    for key in seen_keys:
        if key not in remembered:
            remembered.append(key)
    now_flags["messages"] = remembered[-MAX_SEEN_MESSAGES:]
    counter = int((previous or {}).get("seq") or 0) if isinstance(previous, dict) else 0
    for event in events:
        counter += 1
        event["id"] = counter
    now_flags["seq"] = counter
    extra["flags"] = now_flags
    return events


# --- Everything together ------------------------------------------------------


def compute(
    *,
    trips: list[dict[str, Any]],
    sessions: list[dict[str, Any]],
    buffer: list[Any],
    full_charge: dict[str, float],
    summary: dict[str, Any],
    vehicle: dict[str, Any],
    extra: dict[str, Any],
    now_ts: float,
    tz: tzinfo,
    zones: list[dict[str, Any]] | None = None,
    prices: dict[str, Any] | None = None,
    reference_kwh: float | None = None,
    speed_limit_kmh: float | None = None,
    fuel: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """All insights for one car. ``extra`` is the persisted state, updated in place."""
    fuel = fuel or {}
    zones = usable_zones(zones)
    today = _local(now_ts, tz).date()
    history = vehicle.get("history") or {}
    diagnostics = vehicle.get("diagnostics") or {}
    merge_days(
        extra,
        [
            {"date": str(row.get("date") or "")[:10], "km": row.get("mileage_km"),
             "kwh": row.get("energy_kwh")}
            for row in history.get("last_7_days_detail") or [] if isinstance(row, dict)
        ],
    )
    days = daily_distance(extra, trips, tz)
    avg_price = _num(summary.get("avg_price_kwh"))
    health = summary.get("battery_health") or {}
    # Usable capacity: measured at full charges, else the configured one,
    # else estimated from the energy and state of charge right now.
    capacity_kwh = _num(health.get("capacity_kwh")) or _num(reference_kwh)
    soc = _num((vehicle.get("status") or {}).get("battery_percent"))
    energy_now = _num(diagnostics.get("available_energy_kwh"))
    if not capacity_kwh and energy_now and soc and soc >= 20:
        capacity_kwh = energy_now / soc * 100

    ongoing_trip = summary.get("current_trip") or {}
    habits = learn_habits(
        trips, days, now_ts=now_ts, tz=tz, ongoing_start=_ts_from_iso(ongoing_trip.get("start"))
    )
    consumption = personal_consumption(
        trips, _num(diagnostics.get("outdoor_temp_c")),
        _num(history.get("average_consumption_6w_kwh_100km")),
    )
    eco = score_trips(trips, speed_limit_kmh)
    routes = frequent_routes(trips, zones, avg_price=avg_price, tz=tz)
    life = update_lifetime(extra, trips, sessions, prices=prices, tz=tz)
    journey_data = journey(days, life, vehicle, today=today)
    month = summary.get("month") or {}
    totals = journey_data["totals"]
    status = vehicle.get("status") or {}
    # A range extender burns fuel itself: a comparison with a petrol car would be wrong.
    burns_fuel = status.get("fuel_level_percent") is not None or status.get("fuel_range_km") is not None
    lifetime_km = _num(totals.get("odometer_km"))
    lifetime_kwh = _num(totals.get("lifetime_energy_kwh"))
    # The cloud's lifetime energy has no unit rule per model: use it only when
    # it gives a consumption a car can have.
    if not (
        lifetime_km and lifetime_kwh
        and MIN_CONSUMPTION <= lifetime_kwh / lifetime_km * 100 <= MAX_CONSUMPTION
    ):
        lifetime_kwh = None
    savings_data = savings(
        month_km=None if burns_fuel else _num(month.get("distance_km")),
        month_kwh=_num(month.get("energy_kwh")),
        month_cost=_num(month.get("cost")),
        lifetime_km=None if burns_fuel else lifetime_km,
        lifetime_kwh=lifetime_kwh,
        avg_price=avg_price,
        fuel_price=_num(fuel.get("price")),
        fuel_l_100km=_num(fuel.get("l_100km")),
        grid_co2_g_kwh=_num(fuel.get("grid_co2_g_kwh")),
    )
    badges, unlocked = achievements(
        extra,
        journey_data=journey_data,
        eco=eco,
        places=routes["place_count"],
        savings_data=savings_data,
        capacity_kwh=capacity_kwh,
        now_ts=now_ts,
    )
    ongoing = None
    current_session = summary.get("current_session")
    if isinstance(current_session, dict) and _ts_from_iso(current_session.get("start")) is not None:
        ongoing = {**current_session, "start": _ts_from_iso(current_session.get("start"))}
    last_trip = trips[-1] if trips else None
    events = detect_events(
        extra,
        vehicle=vehicle,
        last_trip=last_trip,
        last_session=sessions[-1] if sessions else None,
        messages=(vehicle.get("inbox") or {}).get("messages"),
        software=vehicle.get("software"),
        unlocked=unlocked,
        now_ts=now_ts,
        trip_cost=_num((summary.get("last_trip") or {}).get("cost")),
    )
    if last_trip is not None:
        start_name, end_name = trip_place_names(last_trip, zones)
        for event in events:
            if event["type"] == "trip_finished":
                if start_name:
                    event["from"] = start_name
                if end_name:
                    event["to"] = end_name
    return {
        "habits": habits,
        "outlook": outlook(habits, vehicle, consumption, capacity_kwh, now_ts=now_ts, tz=tz),
        "real_range": real_range(vehicle, consumption, capacity_kwh),
        "eco": eco,
        "routes": routes,
        "battery_forecast": battery_forecast(
            full_charge, _num(health.get("reference_kwh")), today=today
        ),
        "savings": savings_data,
        "journey": journey_data,
        "achievements": badges,
        "charge_curve": charging_curves(extra, buffer, sessions, ongoing),
        "charge_health": charge_health(vehicle, sessions, ongoing),
        "events": events,
    }


__all__ = [
    "ACHIEVEMENT_TIERS",
    "EVENT_TYPES",
    "achievements",
    "backfill_request",
    "backfill_result",
    "battery_forecast",
    "charge_health",
    "charging_curves",
    "compute",
    "daily_distance",
    "detect_events",
    "eco_score",
    "frequent_routes",
    "journey",
    "learn_habits",
    "merge_days",
    "outlook",
    "personal_consumption",
    "real_range",
    "savings",
    "score_trips",
    "session_curve",
    "temperature_band",
    "trip_place_names",
    "update_lifetime",
    "usable_zones",
]
