"""Tests for the insights engine (habits, outlook, range, routes, journey…).

All data is synthetic.
"""

from __future__ import annotations

import importlib.util
import json
from datetime import date, datetime, timedelta
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from zoneinfo import ZoneInfo

MODULE_PATH = Path(__file__).parents[1] / "custom_components" / "leapmotor" / "insights.py"
SPEC = importlib.util.spec_from_file_location("leapmotor_insights", MODULE_PATH)
assert SPEC and SPEC.loader
ins = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = ins
SPEC.loader.exec_module(ins)

TZ = ZoneInfo("Europe/Ljubljana")
HOME = [46.057, 14.506]
WORK = [46.105, 14.624]
SHOP = [46.021, 14.538]
ZONES = [
    {"name": "Home", "lat": 46.0569, "lon": 14.5058, "radius": 100.0, "home": True},
    {"name": "Work", "lat": 46.105, "lon": 14.624, "radius": 150.0},
]
#: Monday 9 November 2026, 20:00 local.
NOW = datetime(2026, 11, 9, 20, 0, tzinfo=TZ)
TODAY = NOW.date()


def ts(day: date, hour: int, minute: int = 0) -> float:
    return datetime(day.year, day.month, day.day, hour, minute, tzinfo=TZ).timestamp()


def trip(day: date, hour: int, minute: int, *, km=23.0, cons=16.0, temp=8.0, sp=HOME, ep=WORK,
         duration=30.0, top=90.0):
    start = ts(day, hour, minute)
    energy = None if cons is None else round(km * cons / 100, 3)
    return {
        "start": start, "end": start + duration * 60, "_sp": sp, "_ep": ep,
        "distance_km": km, "duration_min": duration, "energy_kwh": energy,
        "consumption_kwh_100km": cons, "avg_speed_kmh": round(km / (duration / 60), 1),
        "max_speed_kmh": top, "start_soc": 70.0, "end_soc": 62.0, "outdoor_temp_c": temp,
    }


def commute(weeks: int = 8, *, until: date = TODAY, jitter: bool = True) -> list[dict]:
    """Weekday commutes: out around 07:20, back around 16:10."""
    trips = []
    first = until - timedelta(days=weeks * 7)
    day = first
    while day < until:
        if day.weekday() < 5:
            # A few minutes early or late, different from week to week.
            week = (day - first).days // 7
            shift = (-6, 6, -2, 2)[(week + day.weekday()) % 4] if jitter else 0
            trips.append(trip(day, 7, 20 + shift))
            trips.append(trip(day, 16, 10 + shift, sp=WORK, ep=HOME))
        day += timedelta(days=1)
    return trips


def vehicle(*, soc=70.0, energy=40.0, car_range=300, plugged=False, charging=False, limit=90,
            temp=8.0, power=0.0, driving=False, reliability="reported", fully_charged=None):
    return {
        "status": {"battery_percent": round(soc), "battery_percent_precise": soc,
                   "remaining_range_km": car_range, "odometer_km": 18450, "is_driving": driving},
        "charging": {"is_plugged_in": plugged or charging, "is_charging": charging,
                     "charge_limit_percent": limit, "charging_power_kw": power,
                     "charge_limit_reliability": reliability},
        "diagnostics": {"available_energy_kwh": energy, "outdoor_temp_c": temp,
                        "fully_charged": fully_charged},
        "history": {"average_consumption_6w_kwh_100km": 15.8, "total_mileage_km": 18450,
                    "total_energy_kwh": 2900.0, "delivery_days": 410},
    }


class DailyHistoryTests(unittest.TestCase):
    def test_merge_counts_changes_and_skips_bad_rows(self) -> None:
        extra: dict = {}
        rows = [{"date": "2026-11-08", "km": 42.04, "kwh": 6.4},
                {"date": "2026-11-09", "km": 0, "kwh": None},
                {"date": "bad", "km": 3}, {"date": "2026-11-07", "km": -1},
                {"date": "2026-11-06", "km": None}]
        self.assertEqual(ins.merge_days(extra, rows), 2)
        self.assertEqual(extra["days"], {"2026-11-08": [42.0, 6.4], "2026-11-09": [0.0, None]})
        self.assertEqual(ins.merge_days(extra, rows), 0)
        self.assertEqual(ins.merge_days(extra, [{"date": "2026-11-09", "km": 12.3, "kwh": 2}]), 1)
        self.assertEqual(ins.merge_days(extra, None), 0)

    def test_old_days_are_dropped_past_the_limit(self) -> None:
        extra: dict = {}
        start = date(2020, 1, 1)
        rows = [{"date": (start + timedelta(days=i)).isoformat(), "km": 1} for i in range(ins.MAX_DAYS + 40)]
        ins.merge_days(extra, rows)
        self.assertEqual(len(extra["days"]), ins.MAX_DAYS)
        self.assertEqual(min(extra["days"]), (start + timedelta(days=40)).isoformat())

    def test_cloud_days_win_over_the_trip_log(self) -> None:
        trips = [trip(date(2026, 11, 5), 7, 20), trip(date(2026, 11, 5), 16, 10),
                 trip(date(2026, 11, 6), 23, 50, km=10.0)]
        extra = {"days": {"2026-11-05": [51.0, 8.2]}}
        days = ins.daily_distance(extra, trips, TZ)
        self.assertEqual(days["2026-11-05"], [51.0, 8.2])
        self.assertEqual(days["2026-11-06"][0], 10.0)
        self.assertAlmostEqual(days["2026-11-06"][1], 1.6)

    def test_backfill_walks_back_until_nothing_was_driven(self) -> None:
        extra: dict = {}
        window = ins.backfill_request(extra, today=TODAY)
        self.assertEqual(window, (date(2026, 8, 5), date(2026, 11, 2)))
        ins.backfill_result(extra, window, [{"date": "2026-09-01", "km": 30, "kwh": 5}])
        self.assertEqual(extra["days"]["2026-09-01"], [30.0, 5.0])
        second = ins.backfill_request(extra, today=TODAY)
        self.assertEqual(second, (date(2026, 5, 7), date(2026, 8, 4)))
        ins.backfill_result(extra, second, [{"date": "2026-06-01", "km": 0, "kwh": None}])
        self.assertIsNone(ins.backfill_request(extra, today=TODAY))
        self.assertTrue(extra["backfill"]["done"])

    def test_backfill_stops_at_a_year_and_gives_up_on_failures(self) -> None:
        extra: dict = {}
        windows = []
        while (window := ins.backfill_request(extra, today=TODAY)) is not None:
            windows.append(window)
            ins.backfill_result(extra, window, [{"date": window[0].isoformat(), "km": 5}])
        self.assertEqual(len(windows), 4)
        self.assertEqual(windows[-1][0], TODAY - timedelta(days=365))
        self.assertTrue(all(a[0] == b[1] + timedelta(days=1) for a, b in zip(windows, windows[1:])))

        failing: dict = {}
        attempts = 0
        while (window := ins.backfill_request(failing, today=TODAY)) is not None:
            attempts += 1
            ins.backfill_result(failing, window, None)
        self.assertEqual(attempts, 6)
        self.assertNotIn("days", failing)
        # A success in between resets the failure count.
        mixed: dict = {}
        window = ins.backfill_request(mixed, today=TODAY)
        ins.backfill_result(mixed, window, None)
        ins.backfill_result(mixed, window, [{"date": "2026-09-01", "km": 30}])
        self.assertEqual(mixed["backfill"]["attempts"], 0)


class HabitTests(unittest.TestCase):
    def habits(self, trips, now=NOW, **kwargs):
        days = ins.daily_distance({}, trips, TZ)
        return ins.learn_habits(trips, days, now_ts=now.timestamp(), tz=TZ, **kwargs)

    def test_weekday_commute_is_learned(self) -> None:
        habits = self.habits(commute())
        monday = habits["weekdays"][0]
        self.assertEqual(monday["days_seen"], 8)
        self.assertEqual([d["time"] for d in monday["departures"]], ["07:20", "16:10"])
        self.assertEqual(monday["departures"][0]["confidence"], 1.0)
        self.assertEqual(monday["departures"][0]["samples"], 8)
        self.assertEqual(monday["departures"][0]["spread_min"], 12)
        self.assertEqual(monday["departures"][0]["typical_km"], 23.0)
        self.assertEqual(monday["typical_km"], 46.0)
        self.assertEqual(monday["drive_probability"], 1.0)
        saturday = habits["weekdays"][5]
        self.assertEqual(saturday["departures"], [])
        self.assertEqual(saturday["drive_probability"], 0.0)
        self.assertIsNone(saturday["typical_km"])

    def test_next_departure_is_tomorrow_morning(self) -> None:
        nxt = self.habits(commute())["next_departure"]
        self.assertEqual(nxt["at"], "2026-11-10T06:20:00+00:00")  # 07:20 local
        self.assertEqual(nxt["weekday"], 1)
        self.assertEqual(nxt["time"], "07:20")
        self.assertEqual(nxt["in_minutes"], 680)
        self.assertEqual(nxt["confidence"], 1.0)

    def test_friday_evening_points_to_monday(self) -> None:
        friday = datetime(2026, 11, 13, 20, 0, tzinfo=TZ)
        nxt = self.habits(commute(until=friday.date() + timedelta(days=1)), now=friday)["next_departure"]
        self.assertEqual(nxt["at"], "2026-11-16T06:20:00+00:00")

    def test_a_departure_already_left_for_is_not_predicted_again(self) -> None:
        tuesday = datetime(2026, 11, 10, 7, 5, tzinfo=TZ)
        trips = commute(until=tuesday.date())
        waiting = self.habits(trips, now=tuesday)["next_departure"]
        self.assertEqual(waiting["time"], "07:20")
        self.assertEqual(waiting["in_minutes"], 15)
        driving = self.habits(trips, now=tuesday, ongoing_start=ts(tuesday.date(), 7, 0))
        self.assertEqual(driving["next_departure"]["time"], "16:10")
        finished = trips + [trip(tuesday.date(), 6, 50, duration=10)]
        self.assertEqual(self.habits(finished, now=tuesday)["next_departure"]["time"], "16:10")

    def test_wall_clock_time_is_kept_across_the_end_of_summer_time(self) -> None:
        # Clocks go back on Sunday 25 October 2026.
        saturday = datetime(2026, 10, 24, 12, 0, tzinfo=TZ)
        nxt = self.habits(commute(until=saturday.date(), jitter=False), now=saturday)["next_departure"]
        self.assertEqual(nxt["at"], "2026-10-26T06:20:00+00:00")
        before = datetime(2026, 10, 22, 20, 0, tzinfo=TZ)
        nxt = self.habits(commute(until=before.date(), jitter=False), now=before)["next_departure"]
        self.assertEqual(nxt["at"], "2026-10-23T05:20:00+00:00")

    def test_irregular_times_are_not_a_habit(self) -> None:
        trips = []
        day = TODAY - timedelta(days=56)
        hours = [5, 9, 13, 17, 21, 7, 11, 15]
        for week in range(8):
            trips.append(trip(day + timedelta(days=week * 7), hours[week], 0))
        habits = self.habits(trips)
        self.assertEqual(habits["weekdays"][0]["departures"], [])
        self.assertIsNone(habits["next_departure"])

    def test_too_little_history_or_too_rare_gives_no_habit(self) -> None:
        self.assertIsNone(self.habits(commute(weeks=2))["next_departure"])
        self.assertIsNone(self.habits([])["next_departure"])
        # Only 3 of 8 Mondays.
        monday = TODAY - timedelta(days=56)
        trips = [trip(monday, 12, 0, km=5)] + [trip(monday + timedelta(days=7 * w), 7, 20) for w in (2, 5, 7)]
        habits = self.habits(trips)
        self.assertEqual(habits["weekdays"][0]["days_seen"], 8)
        self.assertEqual(habits["weekdays"][0]["departures"], [])

    def test_a_young_trip_log_is_not_diluted_by_older_cloud_days(self) -> None:
        # Three weeks of trips, but the cloud's daily history covers eight weeks.
        trips = commute(weeks=3, jitter=False)
        days = {(TODAY - timedelta(days=offset)).isoformat(): [46.0 if (TODAY - timedelta(days=offset)).weekday() < 5 else 0.0, 7.0]
                for offset in range(1, 57)}
        habits = ins.learn_habits(trips, days, now_ts=NOW.timestamp(), tz=TZ)
        monday = habits["weekdays"][0]
        self.assertEqual(monday["days_seen"], 8)
        self.assertEqual([d["time"] for d in monday["departures"]], ["07:20", "16:10"])
        self.assertEqual(monday["departures"][0]["samples"], 3)
        self.assertEqual(monday["departures"][0]["confidence"], 1.0)
        # The distance pattern still uses all eight weeks.
        self.assertEqual(monday["typical_km"], 46.0)
        self.assertEqual(habits["next_departure"]["time"], "07:20")

    def test_short_hops_do_not_count(self) -> None:
        trips = [trip(TODAY - timedelta(days=7 * w), 7, 20, km=0.4) for w in range(1, 9)]
        self.assertEqual(self.habits(trips)["weekdays"][0]["departures"], [])

    def test_history_older_than_eight_weeks_is_ignored(self) -> None:
        old = [trip(TODAY - timedelta(days=7 * w), 7, 20) for w in range(9, 20)]
        habits = self.habits(old)
        self.assertEqual(habits["trips_considered"], 0)
        self.assertEqual(habits["since"], (TODAY - timedelta(days=56)).isoformat())


class ConsumptionTests(unittest.TestCase):
    def test_temperature_band_first(self) -> None:
        trips = ([trip(TODAY - timedelta(days=i + 1), 8, 0, cons=20.0, temp=-3.0) for i in range(4)]
                 + [trip(TODAY - timedelta(days=i + 10), 8, 0, cons=14.0, temp=22.0) for i in range(6)])
        cold = ins.personal_consumption(trips, -5.0, 15.8)
        self.assertEqual((cold["kwh_100km"], cold["basis"], cold["band"]), (20.0, "temperature", "below_0"))
        warm = ins.personal_consumption(trips, 25.0, 15.8)
        self.assertEqual((warm["kwh_100km"], warm["band"]), (14.0, "above_20"))
        # No trips at 5 °C: the recent average.
        mild = ins.personal_consumption(trips, 5.0, 15.8)
        self.assertEqual(mild["basis"], "recent")
        self.assertEqual(mild["kwh_100km"], 16.4)

    def test_falls_back_to_the_cloud_average_then_to_nothing(self) -> None:
        few = [trip(TODAY - timedelta(days=1), 8, 0, km=5.0)]
        self.assertEqual(ins.personal_consumption(few, 8.0, 15.8),
                         {"kwh_100km": 15.8, "basis": "six_week", "band": None, "trips": 0})
        self.assertIsNone(ins.personal_consumption(few, 8.0, None))
        self.assertIsNone(ins.personal_consumption([], None, 400))

    def test_impossible_trips_are_ignored(self) -> None:
        trips = [trip(TODAY - timedelta(days=i + 1), 8, 0, cons=16.0) for i in range(5)]
        trips += [trip(TODAY - timedelta(days=9), 8, 0, cons=250.0),
                  trip(TODAY - timedelta(days=10), 8, 0, cons=1.0),
                  trip(TODAY - timedelta(days=11), 8, 0, cons=None)]
        self.assertEqual(ins.personal_consumption(trips, None, None)["kwh_100km"], 16.0)

    def test_real_range(self) -> None:
        consumption = {"kwh_100km": 16.0, "basis": "temperature", "band": "0_10"}
        result = ins.real_range(vehicle(energy=40.0, car_range=300), consumption, None)
        self.assertEqual(result["km"], 250)
        self.assertEqual(result["car_km"], 300)
        self.assertEqual(result["delta_pct"], -17)
        self.assertEqual(result["basis"], "temperature")
        # Without the energy reading: state of charge times capacity.
        result = ins.real_range(vehicle(energy=None, soc=50.0), consumption, 64.0)
        self.assertEqual(result["km"], 200)
        self.assertIsNone(ins.real_range(vehicle(energy=None), consumption, None))
        self.assertIsNone(ins.real_range(vehicle(), None, 64.0))


class OutlookTests(unittest.TestCase):
    def outlook(self, car, now=NOW, trips=None, capacity=64.0):
        trips = commute() if trips is None else trips
        days = ins.daily_distance({}, trips, TZ)
        habits = ins.learn_habits(trips, days, now_ts=now.timestamp(), tz=TZ)
        consumption = ins.personal_consumption(trips, 8.0, None)
        return ins.outlook(habits, car, consumption, capacity, now_ts=now.timestamp(), tz=TZ)

    def test_enough_for_tomorrow(self) -> None:
        result = self.outlook(vehicle(soc=70.0))
        self.assertEqual(result["day"], "2026-11-10")
        self.assertFalse(result["is_today"])
        self.assertEqual(result["expected_km"], 46.0)
        self.assertEqual(result["expected_kwh"], 7.4)
        self.assertEqual(result["needed_soc"], 26.6)
        self.assertTrue(result["enough"])
        self.assertTrue(result["limit_ok"])
        self.assertIs(result["charge_recommended"], False)
        self.assertEqual(result["reason"], "enough")
        self.assertEqual(result["departure"]["time"], "07:20")

    def test_reasons(self) -> None:
        self.assertEqual(self.outlook(vehicle(soc=22.0))["reason"], "low_for_next_day")
        self.assertIs(self.outlook(vehicle(soc=22.0))["charge_recommended"], True)
        self.assertEqual(self.outlook(vehicle(soc=9.0))["reason"], "low_battery")
        plugged = self.outlook(vehicle(soc=9.0, plugged=True, limit=20))
        self.assertEqual(plugged["reason"], "plugged_in")
        self.assertIs(plugged["charge_recommended"], False)
        self.assertIs(plugged["limit_ok"], False)
        none = self.outlook(vehicle(soc=50.0), trips=[])
        self.assertEqual(none["reason"], "no_pattern")
        self.assertIsNone(none["expected_km"])
        self.assertIsNone(none["enough"])
        unknown = self.outlook({"status": {}, "charging": {}})
        self.assertEqual(unknown["reason"], "unknown")
        self.assertIsNone(unknown["charge_recommended"])

    def test_weekend_needs_nothing_and_night_means_today(self) -> None:
        friday = datetime(2026, 11, 13, 20, 0, tzinfo=TZ)
        result = self.outlook(vehicle(soc=30.0), now=friday,
                              trips=commute(until=friday.date() + timedelta(days=1)))
        self.assertEqual(result["weekday"], 5)
        self.assertIsNone(result["expected_km"])
        self.assertEqual(result["reason"], "no_pattern")
        night = datetime(2026, 11, 10, 2, 30, tzinfo=TZ)
        result = self.outlook(vehicle(soc=70.0), now=night, trips=commute(until=night.date()))
        self.assertEqual(result["day"], "2026-11-10")
        self.assertTrue(result["is_today"])


class EcoScoreTests(unittest.TestCase):
    def history(self, n=8, cons=16.0, temp=8.0):
        return [trip(TODAY - timedelta(days=i + 2), 8, 0, cons=cons, temp=temp) for i in range(n)]

    def test_needs_five_trips_to_compare_with(self) -> None:
        candidate = trip(TODAY - timedelta(days=1), 8, 0)
        self.assertIsNone(ins.eco_score(candidate, self.history(4), None))
        self.assertIsNotNone(ins.eco_score(candidate, self.history(5), None))
        self.assertIsNone(ins.eco_score(trip(TODAY, 8, 0, km=1.0), self.history(), None))
        self.assertIsNone(ins.eco_score(trip(TODAY, 8, 0, cons=None), self.history(), None))

    def test_usual_good_and_wasteful_trips(self) -> None:
        history = self.history()
        usual = ins.eco_score(trip(TODAY, 8, 0, cons=16.0), history, None)
        self.assertEqual(usual["score"], 75)
        self.assertEqual(usual["vs_baseline_pct"], 0)
        good = ins.eco_score(trip(TODAY, 8, 0, cons=12.8), history, None)
        self.assertEqual(good["score"], 100)
        bad = ins.eco_score(trip(TODAY, 8, 0, cons=22.4, top=150.0), history, None)
        self.assertEqual(bad["score"], 0)

    def test_speed_against_the_alert_speed(self) -> None:
        history = self.history()
        calm = ins.eco_score(trip(TODAY, 8, 0, top=128.0), history, 130)
        fast = ins.eco_score(trip(TODAY, 8, 0, top=143.0), history, 130)
        faster = ins.eco_score(trip(TODAY, 8, 0, top=160.0), history, 130)
        self.assertEqual(calm["speed"], 1.0)
        self.assertEqual(fast["speed"], 0.5)
        self.assertEqual(faster["speed"], 0.0)
        self.assertGreater(calm["score"], fast["score"])

    def test_same_temperature_trips_are_the_baseline(self) -> None:
        history = self.history(6, cons=20.0, temp=-4.0) + self.history(6, cons=14.0, temp=24.0)
        winter = ins.eco_score(trip(TODAY, 8, 0, cons=20.0, temp=-2.0), history, None)
        self.assertEqual(winter["baseline_kwh_100km"], 20.0)
        self.assertEqual(winter["score"], 75)

    def test_score_is_given_once_and_kept(self) -> None:
        trips = self.history(8)[::-1] + [trip(TODAY, 8, 0, cons=12.8)]
        summary = ins.score_trips(trips, None)
        self.assertEqual(trips[-1]["eco_score"], 100)
        self.assertEqual(summary["last"], 100)
        self.assertEqual(summary["last_vs_usual_pct"], -20)
        self.assertNotIn("eco_score", trips[0])  # nothing to compare the first ones with
        self.assertEqual(summary["trips"], 4)
        trips[-1]["eco_score"] = 55
        self.assertEqual(ins.score_trips(trips, None)["last"], 55)
        self.assertEqual(ins.score_trips([], None)["last"], None)


class RouteTests(unittest.TestCase):
    def test_frequent_routes_with_names_and_cost(self) -> None:
        trips = commute(weeks=2, jitter=False)
        trips += [trip(TODAY - timedelta(days=d), 18, 0, km=6.0, sp=HOME, ep=SHOP, duration=12)
                  for d in (1, 3, 5)]
        trips.append(trip(TODAY - timedelta(days=2), 19, 0, sp=HOME, ep=HOME))  # a loop
        trips.append(trip(TODAY - timedelta(days=2), 20, 0, sp=None, ep=WORK))  # no position
        result = ins.frequent_routes(trips, ZONES, avg_price=0.2, tz=TZ)
        routes = result["routes"]
        self.assertEqual([(r["from"]["name"], r["to"]["name"], r["trips"]) for r in routes],
                         [("Home", "Work", 10), ("Work", "Home", 10), ("Home", None, 3)])
        first = routes[0]
        self.assertTrue(first["from"]["home"])
        self.assertEqual(first["distance_km"], 23.0)
        self.assertEqual(first["duration_min"], 30.0)
        self.assertEqual(first["consumption_kwh_100km"], 16.0)
        self.assertEqual(first["energy_kwh"], 3.68)
        self.assertEqual(first["cost"], 0.74)
        self.assertEqual(first["usual_departure"], "07:20")
        shop = routes[2]["to"]
        self.assertFalse(shop["zone"])
        self.assertEqual(shop["rank"], 1)
        self.assertEqual((shop["lat"], shop["lon"]), (46.021, 14.538))
        self.assertEqual(result["place_count"], 3)
        self.assertEqual({p["name"] for p in result["places"]}, {"Home", "Work", None})

    def test_rare_routes_and_missing_zones(self) -> None:
        trips = [trip(TODAY - timedelta(days=d), 8, 0) for d in (1, 2)]
        self.assertEqual(ins.frequent_routes(trips, None, avg_price=None, tz=TZ)["routes"], [])
        trips.append(trip(TODAY - timedelta(days=3), 8, 0))
        route = ins.frequent_routes(trips, [], avg_price=None, tz=TZ)["routes"][0]
        self.assertIsNone(route["from"]["name"])
        self.assertIsNone(route["cost"])

    def test_zone_names_of_one_trip(self) -> None:
        self.assertEqual(ins.trip_place_names(trip(TODAY, 8, 0), ZONES), ("Home", "Work"))
        self.assertEqual(ins.trip_place_names(trip(TODAY, 8, 0, ep=SHOP), ZONES), ("Home", None))
        self.assertEqual(ins.trip_place_names({"_sp": None, "_ep": "x"}, ZONES), (None, None))

    def test_unusable_zones_are_dropped(self) -> None:
        zones = ins.usable_zones([
            ZONES[0], {"name": "", "lat": 1, "lon": 1, "radius": 5},
            {"name": "NoRadius", "lat": 1, "lon": 1, "radius": 0},
            {"name": "Text", "lat": "x", "lon": 1, "radius": 5}, "broken",
        ])
        self.assertEqual([z["name"] for z in zones], ["Home"])
        self.assertEqual(ins.usable_zones(None), [])


class ForecastTests(unittest.TestCase):
    def samples(self, days=400, per_year=-2.0, reference=64.0, step=10):
        start = TODAY - timedelta(days=days)
        data = {}
        for offset in range(0, days + 1, step):
            soh = 100 + per_year * offset / 365
            wobble = 0.15 if (offset // step) % 2 else -0.15
            data[(start + timedelta(days=offset)).isoformat()] = reference * soh / 100 + wobble
        return data

    def test_trend_and_dates(self) -> None:
        data = self.samples()
        data[(TODAY - timedelta(days=95)).isoformat()] = 40.0  # one bad reading
        result = ins.battery_forecast(data, 64.0, today=TODAY)
        self.assertAlmostEqual(result["trend_pct_per_year"], -2.0, delta=0.25)
        self.assertAlmostEqual(result["soh_pct"], 97.8, delta=0.5)
        self.assertEqual(result["confidence"], "high")
        self.assertFalse(result["stable"])
        self.assertEqual(result["reaches_90"][:4], "2030")
        self.assertEqual(result["reaches_80"][:4], "2035")

    def test_stable_battery_has_no_dates(self) -> None:
        result = ins.battery_forecast(self.samples(per_year=0.0), 64.0, today=TODAY)
        self.assertTrue(result["stable"])
        self.assertIsNone(result["reaches_90"])
        self.assertLessEqual(result["soh_in_1_year"], 100.0)

    def test_not_enough_data(self) -> None:
        self.assertIsNone(ins.battery_forecast({}, 64.0, today=TODAY))
        self.assertIsNone(ins.battery_forecast(self.samples(days=40), 64.0, today=TODAY))
        # Less than half a year: a winter would read as wear.
        self.assertIsNone(ins.battery_forecast(self.samples(days=170, per_year=-12.0), 64.0, today=TODAY))
        self.assertIsNotNone(ins.battery_forecast(self.samples(days=190), 64.0, today=TODAY))
        self.assertIsNone(ins.battery_forecast(self.samples(step=100), 64.0, today=TODAY))
        self.assertIsNone(ins.battery_forecast(self.samples(), None, today=TODAY))
        self.assertIsNone(ins.battery_forecast({"bad": 3, "2026-01-01": "x"}, 64.0, today=TODAY))


class SavingsTests(unittest.TestCase):
    ARGS = dict(month_km=1000.0, month_kwh=160.0, month_cost=32.0, lifetime_km=18450.0,
                lifetime_kwh=2900.0, avg_price=0.2)

    def test_with_a_fuel_price(self) -> None:
        result = ins.savings(**self.ARGS, fuel_price=1.5, fuel_l_100km=6.5, grid_co2_g_kwh=250)
        month = result["month"]
        self.assertEqual(month["fuel_litres"], 65.0)
        self.assertEqual(month["fuel_cost"], 97.5)
        self.assertEqual(month["ev_cost"], 32.0)
        self.assertEqual(month["saved"], 65.5)
        self.assertEqual(month["co2_saved_kg"], 110.2)
        life = result["lifetime"]
        self.assertEqual(life["ev_cost"], 580.0)
        self.assertEqual(life["saved"], 1218.88)

    def test_without_a_fuel_price_there_is_no_money(self) -> None:
        result = ins.savings(**self.ARGS, fuel_price=None, fuel_l_100km=None, grid_co2_g_kwh=None)
        self.assertIsNone(result["month"]["fuel_cost"])
        self.assertIsNone(result["month"]["saved"])
        self.assertEqual(result["month"]["fuel_litres"], 65.0)
        self.assertEqual(result["assumptions"]["fuel_l_100km"], 6.5)
        self.assertEqual(result["assumptions"]["grid_co2_g_kwh"], 250.0)
        self.assertIsNone(result["assumptions"]["fuel_price"])

    def test_no_distance_no_block(self) -> None:
        result = ins.savings(month_km=0, month_kwh=None, month_cost=None, lifetime_km=None,
                             lifetime_kwh=None, avg_price=None, fuel_price=1.5,
                             fuel_l_100km=6.5, grid_co2_g_kwh=250)
        self.assertIsNone(result["month"])
        self.assertIsNone(result["lifetime"])


class LifetimeTests(unittest.TestCase):
    def test_counters_grow_once_and_survive_a_rotating_trip_log(self) -> None:
        extra: dict = {}
        first = [trip(TODAY - timedelta(days=9), 8, 0, km=120.0, cons=13.0, top=132.0, temp=-6.0),
                 trip(TODAY - timedelta(days=8), 8, 0, km=20.0, cons=18.0)]
        sessions = [{"start": ts(TODAY - timedelta(days=8), 23), "end": ts(TODAY - timedelta(days=7), 3),
                     "energy_kwh": 30.0, "peak_power_kw": 10.8, "tier": "home"}]
        prices = {"low_band": {"start_min": 22 * 60, "end_min": 6 * 60, "weekends": False}}
        life = ins.update_lifetime(extra, first, sessions, prices=prices, tz=TZ)
        self.assertEqual((life["trips"], life["trip_km"]), (2, 140.0))
        self.assertEqual(life["longest_trip"]["km"], 120.0)
        self.assertEqual(life["top_speed"]["kmh"], 132)
        self.assertEqual(life["most_efficient_trip"]["kwh_100km"], 13.0)
        self.assertEqual(life["coldest_drive_c"], -6.0)
        self.assertEqual((life["sessions"], life["home_sessions"], life["low_tariff_sessions"]), (1, 1, 1))
        self.assertEqual(life["biggest_charge"]["kwh"], 30.0)
        again = ins.update_lifetime(extra, first, sessions, prices=prices, tz=TZ)
        self.assertEqual((again["trips"], again["sessions"]), (2, 1))
        # The oldest trip rotated out of the log; a new one arrived.
        rotated = [first[1], trip(TODAY - timedelta(days=1), 8, 0, km=5.0)]
        life = ins.update_lifetime(extra, rotated, sessions, prices=None, tz=TZ)
        self.assertEqual((life["trips"], life["trip_km"]), (3, 145.0))
        self.assertEqual(life["longest_trip"]["km"], 120.0)


class JourneyTests(unittest.TestCase):
    def days(self):
        days = {}
        for offset in range(0, 420):
            day = TODAY - timedelta(days=offset)
            km = 0.0 if day.weekday() >= 5 else 46.0
            days[day.isoformat()] = [km, round(km * 0.16, 2) or None]
        days[(TODAY - timedelta(days=30)).isoformat()] = [412.0, 70.0]
        return days

    def test_calendar_months_and_records(self) -> None:
        life = {"trips": 300, "sessions": 40, "session_kwh": 900.0,
                "longest_trip": {"km": 210.0, "date": "2026-10-10"}}
        result = ins.journey(self.days(), life, vehicle(), today=TODAY)
        calendar = result["calendar"]
        start = date.fromisoformat(calendar["start"])
        self.assertEqual(start.weekday(), 0)
        self.assertEqual(start + timedelta(days=len(calendar["km"]) - 1), TODAY)
        self.assertGreaterEqual(len(calendar["km"]), ins.CALENDAR_DAYS)
        self.assertEqual(calendar["km"][-1], 46)
        self.assertEqual(calendar["km"][-2], 0)  # Sunday
        self.assertEqual(len(result["months"]), 12)
        self.assertEqual(result["months"][-1]["month"], "2026-11")
        self.assertEqual(result["months"][0]["month"], "2025-12")
        october = result["months"][-2]
        self.assertEqual(october["month"], "2026-10")
        self.assertEqual(october["days"], 31)
        records = result["records"]
        self.assertEqual(records["longest_day"], {"date": "2026-10-10", "km": 412.0})
        self.assertEqual(records["busiest_month"]["month"], "2026-10")
        self.assertEqual(records["best_streak_days"], 6)
        self.assertEqual(records["current_streak_days"], 1)
        self.assertEqual(records["longest_trip"]["km"], 210.0)
        totals = result["totals"]
        self.assertEqual(totals["odometer_km"], 18450)
        self.assertEqual(totals["km_per_day"], 45.0)
        self.assertEqual(totals["earth_laps"], 0.46)
        self.assertEqual(totals["trips"], 300)
        self.assertEqual(result["year"]["year"], 2026)
        self.assertGreater(result["year"]["projected_km"], result["year"]["km"])

    def test_projection_uses_the_days_that_are_known(self) -> None:
        # History begins 70 days ago, not on 1 January.
        days = {(TODAY - timedelta(days=offset)).isoformat(): [30.0, 5.0] for offset in range(70)}
        year = ins.journey(days, {}, vehicle(), today=TODAY)["year"]
        self.assertEqual(year["km"], 2100.0)
        left = (date(2026, 12, 31) - TODAY).days
        self.assertEqual(year["projected_km"], 2100 + 30 * left)
        # Less than two weeks of history: no projection yet.
        few = {(TODAY - timedelta(days=offset)).isoformat(): [30.0, 5.0] for offset in range(10)}
        self.assertIsNone(ins.journey(few, {}, vehicle(), today=TODAY)["year"]["projected_km"])

    def test_empty_history(self) -> None:
        result = ins.journey({}, {}, {}, today=TODAY)
        self.assertTrue(all(v == -1 for v in result["calendar"]["km"]))
        self.assertIsNone(result["records"]["longest_day"])
        self.assertIsNone(result["totals"]["since"])
        self.assertIsNone(result["year"]["projected_km"])
        self.assertEqual(result["totals"]["tracked_km"], 0)

    def test_future_and_broken_days_are_ignored(self) -> None:
        days = {(TODAY + timedelta(days=3)).isoformat(): [500.0, 1.0], "broken": [1, 2],
                TODAY.isoformat(): ["x", None]}
        result = ins.journey(days, {}, {}, today=TODAY)
        self.assertEqual(result["totals"]["days"], 0)


class AchievementTests(unittest.TestCase):
    def run_badges(self, extra, *, odometer=18450, longest_day=412.0, coldest=-6.0, eco_avg=82,
                   eco_trips=20, places=4, charged=900.0):
        journey_data = {
            "totals": {"odometer_km": odometer, "tracked_km": 5000, "charged_kwh": charged,
                       "delivery_days": 410, "days": 100},
            "records": {"longest_day": {"km": longest_day}, "longest_trip": {"km": 60.0},
                        "best_streak_days": 6, "coldest_drive_c": coldest},
        }
        savings_data = {"lifetime": {"co2_saved_kg": 1900.0}}
        return ins.achievements(extra, journey_data=journey_data,
                                eco={"average": eco_avg, "trips": eco_trips}, places=places,
                                savings_data=savings_data, capacity_kwh=64.0,
                                now_ts=NOW.timestamp())

    def test_levels_and_progress(self) -> None:
        badges, unlocked = self.run_badges({})
        by_id = {b["id"]: b for b in badges}
        self.assertEqual(set(by_id), set(ins.ACHIEVEMENT_TIERS))
        self.assertEqual(unlocked, [], "the first run only records what is already reached")
        self.assertEqual(by_id["distance"]["level"], 2)
        self.assertEqual(by_id["distance"]["next"], 50_000)
        self.assertAlmostEqual(by_id["distance"]["progress"], 0.21, places=2)
        self.assertEqual(by_id["long_day"]["level"], 2)
        self.assertEqual(by_id["frost"]["level"], 2)
        self.assertEqual(by_id["frost"]["next"], -10)
        self.assertAlmostEqual(by_id["frost"]["progress"], 0.2, places=2)
        self.assertEqual(by_id["eco_driver"]["level"], 2)
        self.assertEqual(by_id["full_cycles"]["value"], 14.1)
        self.assertEqual(by_id["anniversary"]["level"], 3)
        self.assertIsNone(by_id["anniversary"]["next"])
        self.assertEqual(by_id["anniversary"]["progress"], 1.0)
        self.assertEqual(by_id["low_tariff"]["level"], 0)
        self.assertEqual(by_id["low_tariff"]["progress"], 0.0)
        self.assertIsNone(by_id["low_tariff"]["reached_at"])
        self.assertIsNotNone(by_id["distance"]["reached_at"])

    def test_levels_found_while_old_history_arrives_are_not_news(self) -> None:
        extra: dict = {}
        self.run_badges(extra)
        # The cloud's older days are still being read back: a longer "longest day" is old driving.
        badges, unlocked = self.run_badges(extra, odometer=50_100, coldest=-11.0)
        self.assertEqual(unlocked, [])
        self.assertEqual({b["id"]: b["level"] for b in badges}["distance"], 3)
        # Once that is done, a new level is reported.
        extra["backfill"] = {"done": True}
        _, unlocked = self.run_badges(extra, odometer=50_100, coldest=-11.0, eco_avg=95)
        self.assertEqual([(u["id"], u["level"]) for u in unlocked], [("eco_driver", 3)])

    def test_the_quiet_time_ends_after_a_day_even_without_the_old_history(self) -> None:
        extra: dict = {}
        self.run_badges(extra)
        extra["badges_since"] = NOW.timestamp() - ins.BADGE_QUIET_SECONDS - 60
        _, unlocked = self.run_badges(extra, odometer=50_100)
        self.assertEqual([(u["id"], u["level"]) for u in unlocked], [("distance", 3)])

    def test_a_new_level_is_reported_once_and_never_lost(self) -> None:
        extra: dict = {"backfill": {"done": True}}
        self.run_badges(extra)
        _, unlocked = self.run_badges(extra, odometer=50_100, coldest=-11.0)
        self.assertEqual({(u["id"], u["level"]) for u in unlocked}, {("distance", 3), ("frost", 3)})
        _, unlocked = self.run_badges(extra, odometer=50_200, coldest=-11.0)
        self.assertEqual(unlocked, [])
        # A value that drops (e.g. the eco average) keeps the level once reached.
        badges, unlocked = self.run_badges(extra, odometer=50_200, coldest=-11.0, eco_avg=40)
        self.assertEqual({b["id"]: b["level"] for b in badges}["eco_driver"], 2)
        self.assertEqual(unlocked, [])

    def test_eco_badge_needs_ten_scored_trips(self) -> None:
        badges, _ = self.run_badges({}, eco_trips=4)
        self.assertEqual({b["id"]: b["level"] for b in badges}["eco_driver"], 0)


def snap(t, soc, power, charging=True):
    return SimpleNamespace(ts=t, soc=soc, charge_power_kw=power, is_charging=charging)


class ChargingCurveTests(unittest.TestCase):
    def test_curve_by_state_of_charge(self) -> None:
        buffer = [snap(100, 20.2, 50.0), snap(160, 21.0, 54.0), snap(220, 22.4, 60.0),
                  snap(280, 22.9, 0.0), snap(340, 24.1, 58.0, charging=False),
                  snap(400, None, 40.0), snap(999, 80.0, 20.0)]
        self.assertEqual(ins.session_curve(buffer, 100, 500), [[20.0, 52.0], [22.0, 60.0]])
        self.assertEqual(ins.session_curve([], 100, 500), [])

    def test_finished_sessions_are_kept_and_compared(self) -> None:
        extra: dict = {}
        sessions = []
        buffer = []
        for index in range(3):
            start = 1000.0 * (index + 1)
            for step in range(6):
                buffer.append(snap(start + step * 60, 40 + step * 2, 10.0 + index))
            sessions.append({"start": start, "end": start + 300, "dc": False, "tier": "home"})
        result = ins.charging_curves(extra, buffer, sessions, None)
        self.assertEqual(result["sessions"], 3)
        self.assertEqual(result["last"]["points"][0], [40.0, 12.0])
        self.assertEqual(result["usual"][0], [40.0, 10.5])  # the two earlier ones
        self.assertIsNone(result["current"])
        ongoing = {"start": 9000.0, "dc": False}
        buffer.append(snap(9000.0, 40.5, 7.0))
        buffer.append(snap(9060.0, 41.0, 7.4))
        result = ins.charging_curves(extra, buffer, sessions, ongoing)
        self.assertEqual(result["current"]["points"], [[40.0, 7.2]])
        self.assertEqual(result["usual"][0], [40.0, 11.0])
        json.dumps(extra)

    def test_only_the_last_curves_are_kept(self) -> None:
        extra: dict = {}
        for index in range(ins.MAX_CURVES + 5):
            start = 1000.0 * (index + 1)
            buffer = [snap(start, 40, 10.0), snap(start + 60, 44, 10.0)]
            ins.charging_curves(extra, buffer, [{"start": start, "end": start + 100, "dc": False}], None)
        self.assertEqual(len(extra["curves"]), ins.MAX_CURVES)
        self.assertEqual(min(int(k) for k in extra["curves"]), 6000)

    def test_slow_charging(self) -> None:
        sessions = [{"tier": "home", "dc": False, "peak_power_kw": 10.8} for _ in range(4)]
        ongoing = {"tier": "home", "dc": False, "duration_min": 20.0}
        slow = ins.charge_health(vehicle(charging=True, power=3.6, soc=40.0), sessions, ongoing)
        self.assertTrue(slow["slow"])
        self.assertEqual((slow["now_kw"], slow["usual_kw"], slow["samples"]), (3.6, 10.8, 4))
        ok = ins.charge_health(vehicle(charging=True, power=10.4, soc=40.0), sessions, ongoing)
        self.assertFalse(ok["slow"])
        cases = {
            "tapering near full": (vehicle(charging=True, power=3.6, soc=92.0), sessions, ongoing),
            "just started": (vehicle(charging=True, power=3.6, soc=40.0), sessions,
                             {**ongoing, "duration_min": 4.0}),
            "fast charger": (vehicle(charging=True, power=3.6, soc=40.0), sessions, {**ongoing, "dc": True}),
            "other place": (vehicle(charging=True, power=3.6, soc=40.0), sessions,
                            {**ongoing, "tier": "public_ac"}),
            "too few sessions": (vehicle(charging=True, power=3.6, soc=40.0), sessions[:2], ongoing),
            "not charging": (vehicle(), sessions, None),
            "no power reading": (vehicle(charging=True, power=0.0, soc=40.0), sessions, ongoing),
        }
        for name, args in cases.items():
            with self.subTest(name):
                self.assertFalse(ins.charge_health(*args)["slow"])


class EventTests(unittest.TestCase):
    def events(self, extra, car, **kwargs):
        defaults = dict(vehicle=car, last_trip=None, last_session=None, messages=None,
                        software=None, unlocked=None, now_ts=NOW.timestamp())
        defaults.update(kwargs)
        return ins.detect_events(extra, **defaults)

    def types(self, events):
        return [e["type"] for e in events]

    def test_first_run_only_sets_the_baseline(self) -> None:
        extra: dict = {}
        last = trip(TODAY, 8, 0)
        messages = [{"id": "1", "title": "Hello", "ts": 5.0}]
        self.assertEqual(self.events(extra, vehicle(driving=True, charging=True), last_trip=last,
                                     messages=messages, software={"update_available": True,
                                                                  "latest_version": "2"}), [])
        self.assertEqual(self.events(extra, vehicle(driving=True, charging=True), last_trip=last,
                                     messages=messages, software={"update_available": True,
                                                                  "latest_version": "2"}), [])

    def test_trip_start_and_finish(self) -> None:
        extra: dict = {}
        self.events(extra, vehicle())
        started = self.events(extra, vehicle(driving=True))
        self.assertEqual(self.types(started), ["trip_started"])
        self.assertEqual(started[0]["soc"], 70)
        self.assertEqual(self.events(extra, vehicle(driving=True)), [])
        last = {**trip(TODAY, 19, 0), "eco_score": 81}
        finished = self.events(extra, vehicle(), last_trip=last, trip_cost=0.74)
        self.assertEqual(self.types(finished), ["trip_finished"])
        event = finished[0]
        self.assertEqual((event["distance_km"], event["eco_score"], event["cost"]), (23.0, 81, 0.74))
        self.assertEqual(event["start"], "2026-11-09T18:00:00+00:00")
        self.assertEqual(self.events(extra, vehicle(), last_trip=last), [])

    def test_charging_cycle(self) -> None:
        extra: dict = {}
        self.events(extra, vehicle())
        self.assertEqual(self.types(self.events(extra, vehicle(plugged=True))), ["plugged_in"])
        started = self.events(extra, vehicle(charging=True, power=10.8))
        self.assertEqual(self.types(started), ["charging_started"])
        self.assertEqual(started[0]["power_kw"], 10.8)
        session = {"start": 1.0, "end": 2.0, "energy_kwh": 12.8, "duration_min": 74.0,
                   "start_soc": 70.0, "end_soc": 89.5, "peak_power_kw": 10.8, "tier": "home",
                   "cost": 2.3}
        done = self.events(extra, vehicle(plugged=True, soc=89.5), last_session=session)
        self.assertEqual(self.types(done), ["charging_finished"])
        self.assertIs(done[0]["reached_limit"], True)
        self.assertEqual(done[0]["cost"], 2.3)
        self.assertEqual(self.types(self.events(extra, vehicle(soc=89.5), last_session=session)),
                         ["unplugged"])

    def test_interrupted_charging(self) -> None:
        def run(car, end_soc=55.0):
            extra: dict = {}
            self.events(extra, vehicle(charging=True))
            session = {"start": 1.0, "end": 2.0, "energy_kwh": 5.0, "end_soc": end_soc}
            return self.types(self.events(extra, car, last_session=session))

        self.assertEqual(run(vehicle(plugged=True, soc=55.0)),
                         ["charging_finished", "charging_interrupted"])
        # Unplugged by the driver: finished, not interrupted.
        self.assertEqual(run(vehicle(soc=55.0)), ["charging_finished", "unplugged"])
        # The car says the charge is complete.
        self.assertEqual(run(vehicle(plugged=True, soc=55.0, fully_charged=True)), ["charging_finished"])
        # T03: the reported limit is not reliable, so nothing is called interrupted.
        self.assertEqual(run(vehicle(plugged=True, soc=55.0, reliability="unverified")),
                         ["charging_finished"])
        self.assertEqual(run(vehicle(plugged=True, soc=88.0), end_soc=88.0), ["charging_finished"])

    def test_messages_fire_once_oldest_first_and_at_most_three(self) -> None:
        extra: dict = {}
        old = [{"id": "1", "title": "Old", "ts": 1.0}]
        self.events(extra, vehicle(), messages=old)
        inbox = [{"id": str(i), "title": f"M{i}", "message": "x", "type": 2, "ts": float(i),
                  "time": "t"} for i in (6, 5, 4, 3, 2)] + old
        fired = self.events(extra, vehicle(), messages=inbox)
        self.assertEqual([e["title"] for e in fired], ["M4", "M5", "M6"])
        self.assertEqual(fired[0]["message_type"], 2)
        self.assertEqual(self.events(extra, vehicle(), messages=inbox), [])
        self.assertEqual(self.events(extra, vehicle(), messages=[]), [])
        self.assertEqual(self.events(extra, vehicle(), messages=inbox), [])
        unnamed = [{"id": None, "title": "No id", "ts": 9.0}] + inbox
        self.assertEqual([e["title"] for e in self.events(extra, vehicle(), messages=unnamed)], ["No id"])

    def test_software_low_battery_and_achievements(self) -> None:
        extra: dict = {}
        self.events(extra, vehicle(soc=40.0))
        pending = {"update_available": True, "latest_version": "1.04.01", "installed_version": "1.03.12"}
        fired = self.events(extra, vehicle(soc=40.0), software=pending)
        self.assertEqual(self.types(fired), ["software_update_available"])
        self.assertEqual(fired[0]["latest_version"], "1.04.01")
        self.assertEqual(self.events(extra, vehicle(soc=40.0), software=pending), [])
        low = self.events(extra, vehicle(soc=12.0), software=pending)
        self.assertEqual(self.types(low), ["battery_low"])
        self.assertEqual(self.events(extra, vehicle(soc=11.0), software=pending), [])
        self.assertEqual(self.events(extra, vehicle(soc=14.0, charging=True), software=pending)[0]["type"],
                         "plugged_in")
        badge = self.events(extra, vehicle(soc=40.0), software=pending,
                            unlocked=[{"id": "distance", "level": 2}])
        self.assertIn("achievement_unlocked", self.types(badge))

    def test_event_ids_always_increase(self) -> None:
        extra: dict = {}
        self.events(extra, vehicle())
        first = self.events(extra, vehicle(plugged=True))
        second = self.events(extra, vehicle(charging=True))
        third = self.events(extra, vehicle())
        ids = [e["id"] for e in first + second + third]
        self.assertEqual(ids, sorted(set(ids)))
        self.assertEqual(ids[0], 1)
        self.assertTrue(all(e["type"] in ins.EVENT_TYPES for e in first + second + third))
        json.dumps(extra)


class ComputeTests(unittest.TestCase):
    def test_everything_together_is_serialisable(self) -> None:
        trips = commute()
        extra: dict = {}
        summary = {"avg_price_kwh": 0.2, "month": {"distance_km": 230.0, "energy_kwh": 36.8, "cost": 7.36},
                   "battery_health": {"capacity_kwh": 64.0, "reference_kwh": 66.0},
                   "last_trip": {"cost": 0.74}, "current_trip": None, "current_session": None}
        car = vehicle()
        car["history"]["last_7_days_detail"] = [
            {"date": (TODAY - timedelta(days=i)).isoformat(), "mileage_km": 46.0, "energy_kwh": 7.4}
            for i in range(7)
        ]
        result = ins.compute(trips=trips, sessions=[], buffer=[], full_charge={}, summary=summary,
                             vehicle=car, extra=extra, now_ts=NOW.timestamp(), tz=TZ, zones=ZONES,
                             prices={}, speed_limit_kmh=130, fuel={"price": 1.5})
        self.assertEqual(set(result), {
            "habits", "outlook", "real_range", "eco", "routes", "battery_forecast", "savings",
            "journey", "achievements", "charge_curve", "charge_health", "events"})
        self.assertEqual(result["habits"]["next_departure"]["time"], "07:20")
        self.assertEqual(result["outlook"]["reason"], "enough")
        self.assertEqual(result["real_range"]["km"], 250)
        self.assertEqual(result["routes"]["routes"][0]["from"]["name"], "Home")
        self.assertEqual(result["events"], [])
        month = result["savings"]["month"]
        self.assertEqual(month["saved"], round(month["fuel_cost"] - month["ev_cost"], 2))
        self.assertEqual((month["fuel_cost"], month["ev_cost"], month["saved"]), (22.42, 7.36, 15.06))
        self.assertEqual(result["journey"]["calendar"]["km"][-1], 46)
        self.assertIsNotNone(trips[-1].get("eco_score"))
        json.dumps(result)
        json.dumps(extra)
        # The second poll reports a finished trip with its place names.
        trips.append({**trip(TODAY, 19, 0, sp=WORK, ep=HOME)})
        again = ins.compute(trips=trips, sessions=[], buffer=[], full_charge={}, summary=summary,
                            vehicle=car, extra=extra, now_ts=NOW.timestamp() + 60, tz=TZ, zones=ZONES)
        finished = [e for e in again["events"] if e["type"] == "trip_finished"]
        self.assertEqual(len(finished), 1)
        self.assertEqual((finished[0]["from"], finished[0]["to"]), ("Work", "Home"))
        self.assertEqual(finished[0]["cost"], 0.74)

    def run_compute(self, car):
        summary = {"avg_price_kwh": 0.2, "month": {"distance_km": 230.0, "energy_kwh": 36.8, "cost": 7.36}}
        return ins.compute(trips=[], sessions=[], buffer=[], full_charge={}, summary=summary,
                           vehicle=car, extra={}, now_ts=NOW.timestamp(), tz=TZ, fuel={"price": 1.5})

    def test_an_unbelievable_lifetime_energy_is_not_used(self) -> None:
        normal = self.run_compute(vehicle())["savings"]["lifetime"]
        self.assertEqual(normal["ev_cost"], 580.0)
        self.assertGreater(normal["co2_saved_kg"], 0)
        # The same total in Wh (as some models report daily energy) would give absurd figures.
        car = vehicle()
        car["history"]["total_energy_kwh"] = 2_900_000.0
        life = self.run_compute(car)["savings"]["lifetime"]
        self.assertEqual(life["fuel_litres"], normal["fuel_litres"])
        self.assertIsNone(life["ev_cost"])
        self.assertIsNone(life["saved"])
        self.assertIsNone(life["co2_saved_kg"])

    def test_a_range_extender_is_not_compared_with_a_petrol_car(self) -> None:
        car = vehicle()
        car["status"]["fuel_level_percent"] = 62
        savings = self.run_compute(car)["savings"]
        self.assertIsNone(savings["month"])
        self.assertIsNone(savings["lifetime"])
        result = self.run_compute(car)
        co2 = {b["id"]: b for b in result["achievements"]}["co2"]
        self.assertEqual(co2["level"], 0)

    def test_nothing_known_yet(self) -> None:
        extra: dict = {}
        result = ins.compute(trips=[], sessions=[], buffer=[], full_charge={}, summary={},
                             vehicle={}, extra=extra, now_ts=NOW.timestamp(), tz=TZ)
        self.assertIsNone(result["habits"]["next_departure"])
        self.assertIsNone(result["real_range"])
        self.assertIsNone(result["battery_forecast"])
        self.assertEqual(result["routes"]["routes"], [])
        self.assertEqual(result["outlook"]["reason"], "unknown")
        self.assertEqual(result["events"], [])
        self.assertFalse(result["charge_health"]["slow"])
        json.dumps(result)

    def test_live_session_comes_from_the_summary(self) -> None:
        start = NOW.timestamp() - 1800
        buffer = [snap(start + i * 60, 40 + i * 0.5, 3.5) for i in range(30)]
        sessions = [{"start": 1.0 + i, "end": 2.0 + i, "tier": "home", "dc": False,
                     "peak_power_kw": 10.8} for i in range(4)]
        summary = {"current_session": {"start": datetime.fromtimestamp(start, TZ).isoformat(),
                                       "duration_min": 30.0, "dc": False, "tier": "home"}}
        result = ins.compute(trips=[], sessions=sessions, buffer=buffer, full_charge={},
                             summary=summary, vehicle=vehicle(charging=True, power=3.5, soc=55.0),
                             extra={}, now_ts=NOW.timestamp(), tz=TZ)
        self.assertTrue(result["charge_health"]["slow"])
        self.assertGreater(len(result["charge_curve"]["current"]["points"]), 3)


if __name__ == "__main__":
    unittest.main()
