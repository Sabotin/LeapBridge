"""Tests for the trip log, charging sessions and battery health port."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest
from datetime import datetime
from zoneinfo import ZoneInfo

MODULE_PATH = (
    Path(__file__).parents[1] / "custom_components" / "leapmotor" / "drive_analytics.py"
)
SPEC = importlib.util.spec_from_file_location("leapmotor_drive_analytics", MODULE_PATH)
assert SPEC and SPEC.loader
da = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = da
SPEC.loader.exec_module(da)

TZ = ZoneInfo("Europe/Ljubljana")
HOME = (46.0569, 14.5058, 100.0)
T0 = datetime(2026, 11, 9, 7, 0, tzinfo=TZ).timestamp()
MIN = 60.0


def vehicle(ts, *, soc=60.0, kwh=40.0, odo=10000.0, speed=0.0, parked=True,
            charging=False, power=0.0, dc=False, lat=46.0569, lon=14.5058):
    return {
        "status": {
            "last_vehicle_timestamp": int(ts * 1000),
            "battery_percent": round(soc), "battery_percent_precise": soc,
            "odometer_km": odo, "speed_kmh": speed, "is_parked": parked,
        },
        "charging": {"is_charging": charging, "charging_power_kw": power,
                     "dc_cable_connected": dc},
        "diagnostics": {"available_energy_kwh": kwh, "outdoor_temp_c": 8.0},
        "location": {"latitude": lat, "longitude": lon},
    }


class TripTests(unittest.TestCase):
    def feed(self, engine, polls, vin="VIN1", **kwargs):
        summary = None
        for ts, v in polls:
            summary = engine.update(vin, v, now_ts=ts, tz=TZ, home=HOME, **kwargs)
        return summary

    def test_drive_becomes_one_trip_after_parking(self) -> None:
        polls = [(T0, vehicle(T0))]
        odo, kwh, soc = 10000.0, 40.0, 60.0
        for i in range(1, 21):  # 20 minutes of driving, 1 km/min
            odo += 1.0; kwh -= 0.16; soc -= 0.25
            polls.append((T0 + i * MIN, vehicle(T0 + i * MIN, soc=soc, kwh=kwh, odo=odo,
                                                speed=60, parked=False)))
        end = T0 + 21 * MIN
        polls.append((end, vehicle(end, soc=soc, kwh=kwh, odo=odo)))
        polls.append((end + MIN, vehicle(end + MIN, soc=soc, kwh=kwh, odo=odo)))
        s = self.feed(da.DriveAnalytics(), polls)
        trip = s["last_trip"]
        self.assertIsNotNone(trip)
        self.assertAlmostEqual(trip["distance_km"], 20.0)
        self.assertAlmostEqual(trip["energy_kwh"], 3.2, places=2)
        self.assertAlmostEqual(trip["consumption_kwh_100km"], 16.0)
        self.assertAlmostEqual(trip["duration_min"], 21.0)
        self.assertEqual(s["today"]["trips"], 1)
        self.assertIsNone(s["current_trip"])

    def test_short_stop_merges_but_park_splits(self) -> None:
        def leg(start, odo):
            out = []
            for i in range(1, 6):
                out.append((start + i * MIN, vehicle(start + i * MIN, odo=odo + i, speed=50, parked=False)))
            return out, odo + 5

        # traffic light: speed 0 but not parked, 2 minutes -> one trip
        polls = [(T0, vehicle(T0))]
        a, odo = leg(T0, 10000.0)
        polls += a
        polls.append((T0 + 6 * MIN, vehicle(T0 + 6 * MIN, odo=odo, speed=0, parked=None)))
        b, odo = leg(T0 + 7 * MIN, odo)
        polls += b
        end = T0 + 13 * MIN
        polls.append((end, vehicle(end, odo=odo)))
        polls.append((end + MIN, vehicle(end + MIN, odo=odo)))
        s = self.feed(da.DriveAnalytics(), polls)
        self.assertEqual(s["today"]["trips"], 1)
        self.assertAlmostEqual(s["last_trip"]["distance_km"], 10.0)

        # explicit park in between -> two trips
        polls = [(T0, vehicle(T0))]
        a, odo = leg(T0, 10000.0)
        polls += a
        polls.append((T0 + 6 * MIN, vehicle(T0 + 6 * MIN, odo=odo)))
        polls.append((T0 + 7 * MIN, vehicle(T0 + 7 * MIN, odo=odo)))
        b, odo = leg(T0 + 7 * MIN, odo)
        polls += b
        end = T0 + 13 * MIN
        polls.append((end, vehicle(end, odo=odo)))
        polls.append((end + MIN, vehicle(end + MIN, odo=odo)))
        s = self.feed(da.DriveAnalytics(), polls)
        self.assertEqual(s["today"]["trips"], 2)

    def test_trip_waits_for_merge_window_then_finalizes(self) -> None:
        engine = da.DriveAnalytics()
        polls = [(T0, vehicle(T0))]
        for i in range(1, 6):
            polls.append((T0 + i * MIN, vehicle(T0 + i * MIN, odo=10000 + i, speed=40, parked=False)))
        end = T0 + 6 * MIN
        polls.append((end, vehicle(end, odo=10005, parked=None)))  # stopped, not in P
        s = self.feed(engine, polls)
        self.assertIsNone(s["last_trip"])  # could still be a traffic light
        # same stale vehicle snapshot polled again after the merge window
        s = engine.update("VIN1", vehicle(end, odo=10005, parked=None), now_ts=end + 6 * MIN,
                          tz=TZ, home=HOME)
        self.assertIsNotNone(s["last_trip"])

    def test_parking_finalizes_trip_immediately(self) -> None:
        polls = [(T0, vehicle(T0))]
        for i in range(1, 6):
            polls.append((T0 + i * MIN, vehicle(T0 + i * MIN, odo=10000 + i, speed=40, parked=False)))
        polls.append((T0 + 6 * MIN, vehicle(T0 + 6 * MIN, odo=10005)))  # in P
        s = self.feed(da.DriveAnalytics(), polls)
        self.assertIsNotNone(s["last_trip"])

    def test_ongoing_trip_is_not_finalized(self) -> None:
        polls = [(T0, vehicle(T0))]
        for i in range(1, 6):
            polls.append((T0 + i * MIN, vehicle(T0 + i * MIN, odo=10000 + i, speed=40, parked=False)))
        s = self.feed(da.DriveAnalytics(), polls)
        self.assertIsNone(s["last_trip"])
        self.assertIsNotNone(s["current_trip"])
        self.assertAlmostEqual(s["current_trip"]["distance_km"], 5.0)

    def test_zero_odometer_glitch_is_ignored(self) -> None:
        polls = [(T0, vehicle(T0))]
        for i in range(1, 6):
            odo = 0 if i == 3 else 10000 + i
            polls.append((T0 + i * MIN, vehicle(T0 + i * MIN, odo=odo, speed=40, parked=False)))
        polls.append((T0 + 6 * MIN, vehicle(T0 + 6 * MIN, odo=10005)))
        polls.append((T0 + 7 * MIN, vehicle(T0 + 7 * MIN, odo=10005)))
        s = self.feed(da.DriveAnalytics(), polls)
        self.assertAlmostEqual(s["last_trip"]["distance_km"], 5.0)

    def test_trip_is_stored_once_across_polls_and_restart(self) -> None:
        engine = da.DriveAnalytics()
        polls = [(T0, vehicle(T0))]
        for i in range(1, 6):
            polls.append((T0 + i * MIN, vehicle(T0 + i * MIN, odo=10000 + i, speed=40, parked=False)))
        polls.append((T0 + 6 * MIN, vehicle(T0 + 6 * MIN, odo=10005)))
        self.feed(engine, polls)
        for i in range(7, 20):  # keep polling while parked
            self.feed(engine, [(T0 + i * MIN, vehicle(T0 + i * MIN, odo=10005))])
        restored = da.DriveAnalytics(engine.as_storage())
        s = self.feed(restored, [(T0 + 21 * MIN, vehicle(T0 + 21 * MIN, odo=10005))])
        self.assertEqual(s["today"]["trips"], 1)
        self.assertEqual(len(s["recent_trips"]), 1)


class ChargingTests(unittest.TestCase):
    def charge(self, *, lat=46.0569, lon=14.5058, power=11.0, dc=False, prices=None):
        engine = da.DriveAnalytics()
        polls = [(T0, vehicle(T0, soc=40, kwh=27, lat=lat, lon=lon))]
        kwh, soc = 27.0, 40.0
        for i in range(1, 13):  # 12 polls, 5 min apart
            kwh += power / 12; soc += power / 12 / 0.69
            ts = T0 + i * 5 * MIN
            polls.append((ts, vehicle(ts, soc=soc, kwh=kwh, charging=True, power=power,
                                      dc=dc, lat=lat, lon=lon)))
        ts = T0 + 13 * 5 * MIN
        polls.append((ts, vehicle(ts, soc=soc, kwh=kwh, charging=False, lat=lat, lon=lon)))
        summary = None
        for ts, v in polls:
            summary = engine.update("VIN1", v, now_ts=ts, tz=TZ, home=HOME, prices=prices)
        return summary

    def test_home_session_is_priced_with_home_tariff(self) -> None:
        s = self.charge(prices={"home": 0.20, "public_ac": 0.45, "public_dc": 0.69})
        session = s["last_session"]
        self.assertEqual(session["tier"], "home")
        self.assertAlmostEqual(session["energy_kwh"], 10.08, places=2)
        self.assertAlmostEqual(session["cost"], 2.02, places=2)
        self.assertEqual(session["peak_power_kw"], 11.0)
        self.assertEqual(s["month_charging"]["sessions"], 1)
        self.assertAlmostEqual(s["month_charging"]["cost"], 2.02, places=2)
        self.assertAlmostEqual(s["month_charging"]["home_energy_kwh"], 10.08, places=2)

    def test_away_fast_session_is_public_dc(self) -> None:
        s = self.charge(lat=46.2, lon=14.9, power=80.0, prices={"public_dc": 0.69})
        self.assertEqual(s["last_session"]["tier"], "public_dc")
        self.assertAlmostEqual(s["last_session"]["cost"], round(s["last_session"]["energy_kwh"] * 0.69, 2))

    def test_away_ac_session_and_unknown_price(self) -> None:
        s = self.charge(lat=46.2, lon=14.9, power=7.0)
        self.assertEqual(s["last_session"]["tier"], "public_ac")
        self.assertIsNone(s["last_session"]["cost"])
        self.assertIsNone(s["month_charging"]["cost"])

    def test_dc_flag_wins_even_at_low_power(self) -> None:
        s = self.charge(lat=46.2, lon=14.9, power=15.0, dc=True)
        self.assertEqual(s["last_session"]["tier"], "public_dc")


class BatteryHealthTests(unittest.TestCase):
    def test_needs_three_full_charge_days(self) -> None:
        self.assertIsNone(da.estimate_battery_health({"2026-11-01": 67.0, "2026-11-02": 67.1}))

    def test_observed_reference_and_user_reference(self) -> None:
        samples = {f"2026-10-{d:02d}": 67.0 for d in range(1, 11)}
        samples.update({f"2026-10-{d:02d}": 65.0 for d in range(11, 21)})
        observed = da.estimate_battery_health(samples)
        self.assertEqual(observed["reference_source"], "observed")
        self.assertAlmostEqual(observed["reference_kwh"], 67.0)
        self.assertAlmostEqual(observed["soh_pct"], round(65 / 67 * 100, 1))
        user = da.estimate_battery_health(samples, reference_kwh=69.9)
        self.assertEqual(user["reference_source"], "user")
        self.assertAlmostEqual(user["soh_pct"], round(65 / 69.9 * 100, 1))
        # implausible reference falls back to observed
        self.assertEqual(da.estimate_battery_health(samples, reference_kwh=5)["reference_source"], "observed")

    def test_engine_records_daily_full_charge_peak(self) -> None:
        engine = da.DriveAnalytics()
        for day in range(3):
            base = T0 + day * 86400
            for i, kwh in enumerate((66.8, 67.2, 67.0)):
                ts = base + i * MIN
                s = engine.update("VIN1", vehicle(ts, soc=100.0, kwh=kwh), now_ts=ts, tz=TZ)
        self.assertEqual(s["battery_health"]["samples"], 3)
        self.assertAlmostEqual(s["battery_health"]["capacity_kwh"], 67.2)


class SnapshotTests(unittest.TestCase):
    def test_stale_or_future_vehicle_time_uses_poll_time(self) -> None:
        now = T0
        v = vehicle(now + 3600)
        self.assertEqual(da.snapshot_from_vehicle(v, now).ts, now)
        v = vehicle(now - 30 * 86400)
        self.assertEqual(da.snapshot_from_vehicle(v, now).ts, now)
        v = vehicle(now - 120)
        self.assertEqual(da.snapshot_from_vehicle(v, now).ts, now - 120)

    def test_repeated_vehicle_time_is_not_buffered_twice(self) -> None:
        engine = da.DriveAnalytics()
        v = vehicle(T0)
        engine.update("VIN1", v, now_ts=T0, tz=TZ)
        engine.update("VIN1", v, now_ts=T0 + 300, tz=TZ)
        self.assertEqual(len(engine.as_storage()["vins"]["VIN1"]["buffer"]), 1)

    def test_late_snapshot_is_inserted_in_time_order(self) -> None:
        engine = da.DriveAnalytics()
        no_ts = vehicle(T0)
        no_ts["status"].pop("last_vehicle_timestamp")
        engine.update("VIN1", no_ts, now_ts=T0 + 600, tz=TZ)  # falls back to poll time
        engine.update("VIN1", vehicle(T0 + 60), now_ts=T0 + 660, tz=TZ)
        engine.update("VIN1", vehicle(T0 + 120), now_ts=T0 + 720, tz=TZ)
        stamps = [row[0] for row in engine.as_storage()["vins"]["VIN1"]["buffer"]]
        self.assertEqual(stamps, sorted(stamps))
        self.assertEqual(len(stamps), 3)

    def test_storage_round_trip_drops_malformed_rows(self) -> None:
        stored = {"vins": {"VIN1": {"buffer": [[1, 2], "x"], "trips": ["bad", {"start": 1.0, "end": 2.0, "distance_km": 1.0}]}}}
        engine = da.DriveAnalytics(stored)
        state = engine.as_storage()["vins"]["VIN1"]
        self.assertEqual(state["buffer"], [])
        self.assertEqual(len(state["trips"]), 1)



# --- Stage 2 and extras -------------------------------------------------------

def at(day, hour, minute=0):
    return datetime(2026, 11, day, hour, minute, tzinfo=TZ).timestamp()


BAND = {"start_min": 22 * 60, "end_min": 6 * 60, "weekends": True}
TOU = {"home": 0.25, "home_low": 0.12, "low_band": BAND}


class TimeOfUseTests(unittest.TestCase):
    def test_night_session_uses_low_price(self) -> None:  # Mon 10 Nov 2026
        cost = da.tou_cost(10, at(10, 22), at(11, 2), low_price=0.12, high_price=0.25, band=BAND, tz=TZ)
        self.assertAlmostEqual(cost, 1.2)

    def test_session_across_boundary_is_split(self) -> None:
        cost = da.tou_cost(10, at(10, 21), at(10, 23), low_price=0.12, high_price=0.25, band=BAND, tz=TZ)
        self.assertAlmostEqual(cost, round(10 * (0.5 * 0.12 + 0.5 * 0.25), 2))

    def test_weekend_is_low_all_day(self) -> None:  # Sat 14 Nov 2026
        cost = da.tou_cost(10, at(14, 12), at(14, 14), low_price=0.12, high_price=0.25, band=BAND, tz=TZ)
        self.assertAlmostEqual(cost, 1.2)

    def test_home_session_priced_by_tou_public_flat(self) -> None:
        home = {"tier": "home", "energy_kwh": 10, "start": at(10, 22), "end": at(11, 2)}
        self.assertEqual(da.price_session(home, TOU, TZ), (1.2, 0.12))
        public = {"tier": "public_ac", "energy_kwh": 10, "start": at(10, 12), "end": at(10, 13)}
        self.assertEqual(da.price_session(public, {**TOU, "public_ac": 0.45}, TZ), (4.5, 0.45))

    def test_next_low_tariff_start(self) -> None:
        nxt = da.next_low_tariff_start(at(10, 12, 7), BAND, TZ)
        self.assertEqual(nxt, at(10, 22))


class TripComparisonTests(unittest.TestCase):
    def trip(self, day, km, kwh, hour=7, sp=(46.05, 14.50), ep=(46.08, 14.62)):
        return {"start": at(day, hour), "end": at(day, hour) + 1800, "distance_km": km,
                "energy_kwh": kwh, "consumption_kwh_100km": round(kwh / km * 100, 1),
                "_sp": list(sp), "_ep": list(ep)}

    def test_identical_trips_score_one(self) -> None:
        a = self.trip(2, 20, 3)
        self.assertAlmostEqual(da.trip_similarity(a, dict(a), TZ), 1.0)

    def test_different_route_and_time_is_not_similar(self) -> None:
        a = self.trip(2, 20, 3)
        b = self.trip(3, 60, 9, hour=19, sp=(45.5, 13.7), ep=(45.9, 13.6))
        self.assertLess(da.trip_similarity(a, b, TZ), da.SIMILAR_SCORE)

    def test_compare_with_usual_commute(self) -> None:
        history = [self.trip(d, 20, 3.2) for d in (2, 3, 4)]
        today = self.trip(5, 20, 2.8)
        result = da.compare_with_similar(today, history, TZ)
        self.assertEqual(result["similar_trips"], 3)
        self.assertAlmostEqual(result["usual_consumption_kwh_100km"], 16.0)
        self.assertAlmostEqual(result["vs_usual_pct"], -12.5)


class CostDrainTireTests(unittest.TestCase):
    def test_average_price_from_sessions_or_home_price(self) -> None:
        now = at(20, 12)
        sessions = [{"start": at(10, 22), "energy_kwh": 10, "cost": 1.2},
                    {"start": at(15, 12), "energy_kwh": 10, "cost": 6.9}]
        self.assertAlmostEqual(da.average_price_per_kwh(sessions, now, {}), 0.405)
        self.assertEqual(da.average_price_per_kwh([], now, {"home": 0.2}), 0.2)
        self.assertIsNone(da.average_price_per_kwh([], now, {}))

    def test_parked_drain_per_day(self) -> None:
        snaps = [da.Snapshot(ts=T0 + h * 3600, soc=60 - h * 0.1, energy_kwh=40 - h * 0.05,
                             speed_kmh=0, is_parked=True, is_charging=False) for h in range(11)]
        drain = da.parked_drain(snaps)
        self.assertAlmostEqual(drain["kwh_per_day"], 1.2)
        self.assertAlmostEqual(drain["pct_per_day"], 2.4)
        self.assertIsNone(da.parked_drain(snaps[:4]))  # only 3 h observed

    def test_tire_low_and_uneven(self) -> None:
        self.assertEqual(da.tire_status([2.5, 2.5, 1.8, 2.5], {}, "2026-11-09")["reasons"], ["rear_left_low"])
        self.assertEqual(da.tire_status([2.5, 2.5, 2.1, 2.5], {}, "2026-11-09")["reasons"], ["rear_left_uneven"])
        self.assertFalse(da.tire_status([2.5, 2.5, 2.4, 2.4], {}, "2026-11-09")["warning"])

    def test_slow_leak_detected_but_cold_morning_ignored(self) -> None:
        history = {f"2026-11-0{d}": [2.5, 2.5, 2.5, 2.5] for d in range(1, 8)}
        cold = da.tire_status([2.3, 2.3, 2.3, 2.3], history, "2026-11-09")
        self.assertFalse(cold["warning"])
        leak = da.tire_status([2.5, 2.5, 2.27, 2.5], history, "2026-11-09")
        self.assertEqual(leak["reasons"], ["rear_left_dropping"])


class ChargePlanAttentionTests(unittest.TestCase):
    def test_charge_plan_now_vs_low_tariff(self) -> None:
        v = vehicle(at(10, 12), soc=50, kwh=30)
        v["charging"]["charge_limit_percent"] = 80
        snap = da.snapshot_from_vehicle(v, at(10, 12))
        plan = da.charge_plan(v, snap, 60.0, TOU, at(10, 12), TZ)
        self.assertAlmostEqual(plan["energy_kwh"], 18.0)
        self.assertFalse(plan["low_tariff_now"])
        self.assertAlmostEqual(plan["cost_now"], 4.5)
        self.assertAlmostEqual(plan["cost_low_tariff"], 2.16)
        self.assertAlmostEqual(plan["saving"], 2.34)
        self.assertTrue(plan["next_low_tariff"].startswith("2026-11-10T21:00"))  # 22:00 local

    def test_charge_plan_estimates_capacity_from_energy(self) -> None:
        v = vehicle(at(10, 12), soc=50, kwh=34)
        v["charging"]["charge_limit_percent"] = 100
        plan = da.charge_plan(v, da.snapshot_from_vehicle(v, at(10, 12)), None, {"home": 0.2}, at(10, 12), TZ)
        self.assertAlmostEqual(plan["capacity_kwh"], 68.0)
        self.assertAlmostEqual(plan["cost_now"], 6.8)

    def test_attention_reasons(self) -> None:
        v = vehicle(T0)
        v["status"]["is_locked"] = False
        v["diagnostics"]["driver_door_open"] = True
        result = da.attention(v, {"warning": True})
        self.assertEqual(result["reasons"], ["unlocked", "door_open", "tire_pressure"])
        self.assertFalse(da.attention(vehicle(T0) | {"status": {"is_locked": True, "is_parked": True}}, None)["needed"])

    def test_efficiency_by_temperature(self) -> None:
        trips = [{"outdoor_temp_c": -3, "energy_kwh": 4, "distance_km": 20}] * 2 + \
                [{"outdoor_temp_c": 15, "energy_kwh": 3, "distance_km": 20}] * 3
        bands = {b["band"]: b for b in da.efficiency_by_temperature(trips)}
        self.assertAlmostEqual(bands["below_0"]["consumption_kwh_100km"], 20.0)
        self.assertAlmostEqual(bands["10_20"]["consumption_kwh_100km"], 15.0)
        self.assertNotIn("above_20", bands)


class MaintenanceTests(unittest.TestCase):
    ITEMS = [
        {"service_type": "inspection", "label": "Inspection", "interval_km": 20000, "interval_months": 12, "trigger_mode": "or"},
        {"service_type": "tire_rotation", "label": "Tire rotation", "interval_km": 10000, "interval_months": None, "trigger_mode": "km"},
        {"service_type": "wipers", "label": "Wipers", "interval_km": None, "interval_months": 12, "trigger_mode": "time"},
    ]

    def test_assumed_schedule_without_logged_services(self) -> None:
        now = at(9, 12)
        result = da.maintenance_status(self.ITEMS, {}, 18450, now, now)
        rows = {r["service_type"]: r for r in result["items"]}
        self.assertEqual(rows["inspection"]["remaining_km"], 1550)
        self.assertEqual(rows["inspection"]["status"], "due_soon")
        self.assertEqual(rows["tire_rotation"]["remaining_km"], 1550)
        self.assertEqual(rows["wipers"]["status"], "ok")
        self.assertEqual(rows["wipers"]["baseline"], "assumed")
        self.assertEqual(result["due_soon"], 2)

    def test_logged_service_resets_and_overdue(self) -> None:
        now = at(9, 12)
        done = {"inspection": {"km": 18000, "ts": now - 400 * 86400}}
        result = da.maintenance_status(self.ITEMS, done, 18450, now, now)
        first = result["next"]
        self.assertEqual(first["service_type"], "inspection")
        self.assertEqual(first["status"], "overdue")  # 13+ months
        self.assertEqual(first["baseline"], "logged")

    def test_engine_logs_maintenance_and_persists(self) -> None:
        engine = da.DriveAnalytics()
        engine.update("VIN1", vehicle(T0, odo=18450), now_ts=T0, tz=TZ, maintenance_items=self.ITEMS)
        engine.log_maintenance("VIN1", "tire_rotation", km=18450, ts=T0)
        restored = da.DriveAnalytics(engine.as_storage())
        s = restored.update("VIN1", vehicle(T0 + 60, odo=18450), now_ts=T0 + 60, tz=TZ, maintenance_items=self.ITEMS)
        rows = {r["service_type"]: r for r in s["maintenance"]["items"]}
        self.assertEqual(rows["tire_rotation"]["remaining_km"], 10000)
        self.assertTrue(restored.reset_maintenance("VIN1", "tire_rotation"))


CATALOG_PATH = MODULE_PATH.with_name("maintenance_catalog.py")
CSPEC = importlib.util.spec_from_file_location("leapmotor_maintenance_catalog", CATALOG_PATH)
mc = importlib.util.module_from_spec(CSPEC)
CSPEC.loader.exec_module(mc)


class CatalogTests(unittest.TestCase):
    def test_models_and_fallback(self) -> None:
        catalog = mc.load_catalog()
        name, items = mc.items_for_vehicle(catalog, "C10", is_reev=True)
        self.assertEqual(name, "C10_REEV")
        self.assertIn("engine_oil_replace", {i["service_type"] for i in items})
        name, items = mc.items_for_vehicle(catalog, "C10")
        self.assertNotIn("engine_oil_replace", {i["service_type"] for i in items})
        self.assertIn("wiper_blades_replace", {i["service_type"] for i in items})
        name, _ = mc.items_for_vehicle(catalog, "A10")
        self.assertIn("generic", name)

    def test_severe_use_shortens_intervals(self) -> None:
        catalog = mc.load_catalog()
        _, normal = mc.items_for_vehicle(catalog, "C10")
        _, severe = mc.items_for_vehicle(catalog, "C10", severe_use=True)
        get = lambda items: next(i for i in items if i["service_type"] == "cabin_filter_replace")["interval_km"]
        self.assertLess(get(severe), get(normal))


if __name__ == "__main__":
    unittest.main()
