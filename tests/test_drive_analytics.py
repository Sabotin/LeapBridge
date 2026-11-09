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


if __name__ == "__main__":
    unittest.main()
