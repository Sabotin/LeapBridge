"""A sleeping car's reduced status keeps the last complete battery and cable state.

All data is synthetic; the reduced status has the shape a real T03 returned.
"""
import copy
import importlib
import unittest

from test_issue_regressions import SLEEPING_T03
from test_status_path_fallback import api

bm = importlib.import_module("custom_components.leapmotor.battery_memory")

VIN = "SYNTHETIC"
#: Awake, standing in Park at 43 %.
AWAKE = {**SLEEPING_T03, "soc": 43, "chargeRemainTime": 0, "batteryVoltage": 368.0}
PLUGGED_WAITING = {**AWAKE, "chargeState": 0, "dcInputFastCharge": 1, "batteryCurrent": 0.9}
CHARGING = {**AWAKE, "soc": 51, "chargeState": 1, "dcInputFastCharge": 0,
            "batteryCurrent": -8.0, "chargeRemainTime": 190}
UNPLUGGED = {**AWAKE, "chargeState": 0, "dcInputFastCharge": 0, "batteryCurrent": 0.0}


def poll(status):
    vehicle = api.Vehicle(VIN, None, "T03", None, False)
    return {VIN: api.normalize_vehicle(vehicle, {"data": dict(status)}, None)}


def view(vehicles):
    data = vehicles[VIN]
    return (data["status"]["battery_percent"], data["charging"]["is_plugged_in"],
            data["charging"]["connection_state"], data["charging"]["is_charging"])


class BatteryMemoryTests(unittest.TestCase):
    def setUp(self):
        self.memories = {}

    def take(self, status, seen_at=1000.0):
        vehicles = poll(status)
        self.changed = bm.update(self.memories, vehicles, seen_at)
        return vehicles

    def test_an_evening_plugged_in_and_waiting_for_the_schedule(self):
        """Plug in, the car falls asleep, wakes for a remote command, charges, sleeps again."""
        self.assertEqual(view(self.take(PLUGGED_WAITING)), (43, True, "plugged_in", False))
        asleep = self.take(SLEEPING_T03)
        self.assertEqual(view(asleep), (43, True, "plugged_in", False))
        self.assertEqual(asleep[VIN]["status"]["battery_percent_source"], bm.SOURCE)
        self.assertEqual(asleep[VIN]["charging"]["cable_state_source"], bm.SOURCE)
        self.assertEqual(asleep[VIN]["charging"]["cable_state_seen_at"], 1000)
        self.assertEqual(view(self.take(CHARGING, 2000.0)), (51, True, "charging", True))
        # Asleep again without a last "finished" status: the cable is in, nothing charges.
        self.assertEqual(view(self.take(SLEEPING_T03, 3000.0)), (51, True, "plugged_in", False))

    def test_an_unplugged_car_stays_unplugged_while_it_sleeps(self):
        self.assertEqual(view(self.take(UNPLUGGED)), (43, False, "unplugged", False))
        self.assertEqual(view(self.take(SLEEPING_T03)), (43, False, "unplugged", False))

    def test_without_a_complete_status_nothing_is_made_up(self):
        asleep = self.take(SLEEPING_T03)
        self.assertEqual(view(asleep), (None, None, None, False))
        self.assertNotIn("battery_percent_source", asleep[VIN]["status"])
        self.assertNotIn("cable_state_source", asleep[VIN]["charging"])
        self.assertEqual(self.memories, {})
        self.assertFalse(self.changed)

    def test_a_reduced_status_with_its_own_battery_level_keeps_it(self):
        self.take(PLUGGED_WAITING)
        asleep = self.take({**SLEEPING_T03, "soc": 44})
        self.assertEqual(view(asleep), (44, True, "plugged_in", False))
        self.assertNotIn("battery_percent_source", asleep[VIN]["status"])

    def test_a_car_that_drove_since_is_no_longer_plugged_in(self):
        for moved, expected in (
            ({"totalMileage": 7812}, (None, None, None)),
            # A gear or speed says "unplugged" by itself.
            ({"gearStatus": 3}, (None, False, "unplugged")),
            ({"speed": 30}, (None, False, "unplugged")),
        ):
            with self.subTest(moved=moved):
                self.memories = {}
                self.take(PLUGGED_WAITING)
                self.assertEqual(view(self.take({**SLEEPING_T03, **moved}))[:3], expected)
                self.assertEqual(self.memories, {})
                self.assertTrue(self.changed)

    def test_only_a_new_reading_is_worth_saving(self):
        self.take(PLUGGED_WAITING, 1000.0)
        self.assertTrue(self.changed)
        self.take(PLUGGED_WAITING, 1060.0)
        self.assertFalse(self.changed)
        self.assertEqual(self.memories[VIN]["seen_at"], 1060)
        self.take(SLEEPING_T03, 1120.0)
        self.assertFalse(self.changed)
        self.take(CHARGING, 1180.0)
        self.assertTrue(self.changed)

    def test_the_memory_says_what_the_cable_state_was_read_from(self):
        self.take(PLUGGED_WAITING)
        self.assertEqual(self.memories[VIN]["raw"], {
            "charge_state": 0, "connector_flag": 1, "current_a": 0.9, "voltage_v": 368.0,
            "remaining_minutes": 0, "ready": 0, "gear": 0})
        self.assertEqual(self.memories[VIN]["odometer_km"], 7810)

    def test_the_recent_changes_of_the_cable_reading_are_kept(self):
        for seen_at, status in ((1000.0, PLUGGED_WAITING), (1060.0, {**PLUGGED_WAITING, "batteryCurrent": 0.4}),
                                (1120.0, SLEEPING_T03), (1180.0, CHARGING), (1240.0, UNPLUGGED)):
            self.take(status, seen_at)
        trail = self.memories[VIN]["trail"]
        # The pack current alone and a reduced status add nothing.
        self.assertEqual(
            [(item["seen_at"], item["charge_state"], item["connector_flag"], item["is_plugged_in"],
              item["connection_state"]) for item in trail],
            [(1000, 0, 1, True, "plugged_in"), (1180, 1, 0, True, "charging"), (1240, 0, 0, False, "unplugged")])
        for step in range(20):
            self.take(UNPLUGGED if step % 2 else PLUGGED_WAITING, 2000.0 + step)
        self.assertEqual(len(self.memories[VIN]["trail"]), bm.TRAIL_LENGTH)

    def test_a_complete_status_is_never_changed(self):
        self.take(PLUGGED_WAITING)
        vehicles = poll(UNPLUGGED)
        before = copy.deepcopy(vehicles)
        bm.update(self.memories, vehicles, 2000.0)
        self.assertEqual(vehicles, before)

    def test_storage_survives_a_restart_and_malformed_files(self):
        self.take(PLUGGED_WAITING)
        restored = bm.from_storage(copy.deepcopy(self.memories))
        vehicles = poll(SLEEPING_T03)
        bm.update(restored, vehicles, 5000.0)
        self.assertEqual(view(vehicles), (43, True, "plugged_in", False))
        for junk in (None, [], "text", {VIN: "text"}, {VIN: None}):
            self.assertEqual(bm.from_storage(junk), {})
        # Other shapes of a poll never raise.
        for vehicles in (None, {}, {VIN: None}, {VIN: {}}, {VIN: {"status": None, "charging": None}}):
            self.assertFalse(bm.update({}, vehicles, 1.0))


if __name__ == "__main__":
    unittest.main()
