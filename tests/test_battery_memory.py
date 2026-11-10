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
#: What an unplugged T03 reports, and one that waits for its schedule with the cable in.
NO_SIGN = {**AWAKE, "chargeState": 0, "dcInputFastCharge": 0, "batteryCurrent": 0.0}
UNPLUGGED = NO_SIGN
#: The first status after plugging in on a real car: 2.6 A into the pack, car off.
JUST_PLUGGED = {**NO_SIGN, "batteryCurrent": -2.6}
DRIVING = {**NO_SIGN, "gearStatus": 3, "speed": 42, "bcmKeyPositionOn3": True,
           "batteryCurrent": 31.0, "totalMileage": 7811}


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

    def test_a_t03_waiting_for_its_schedule_stays_plugged_in(self):
        """A real evening: 2.6 A at plug-in, then a status like an unplugged car's until 23:00."""
        self.assertEqual(view(self.take(JUST_PLUGGED, 1000.0)), (43, True, "plugged_in", False))
        waiting = self.take(NO_SIGN, 1060.0)
        self.assertEqual(view(waiting), (43, True, "plugged_in", False))
        self.assertEqual(waiting[VIN]["charging"]["cable_state_source"], bm.CABLE_SEEN)
        self.assertEqual(waiting[VIN]["charging"]["cable_state_seen_at"], 1000)
        self.assertEqual(self.memories[VIN]["cable_seen"],
                         {"since": 1000, "evidence": "inflow", "evidence_at": 1000})
        # Woken by a remote command (reduced status), then awake again: still in.
        self.assertEqual(view(self.take(SLEEPING_T03, 1120.0)), (43, True, "plugged_in", False))
        self.assertEqual(view(self.take(NO_SIGN, 1180.0)), (43, True, "plugged_in", False))
        self.assertEqual(view(self.take(CHARGING, 2000.0)), (51, True, "charging", True))
        # The charge has ended and the status shows no cable again.
        self.assertEqual(view(self.take({**NO_SIGN, "soc": 80}, 9000.0)), (80, True, "plugged_in", False))
        # Only a drive takes the cable out.
        self.assertEqual(view(self.take({**DRIVING, "soc": 79}, 9500.0)), (79, False, "unplugged", False))
        self.assertIsNone(self.memories[VIN]["cable_seen"])
        parked = self.take({**NO_SIGN, "soc": 70, "totalMileage": 7840}, 9900.0)
        self.assertEqual(view(parked), (70, False, "unplugged", False))
        self.assertNotIn("cable_state_source", parked[VIN]["charging"])

    def test_a_drive_that_was_not_seen_still_takes_the_cable_out(self):
        self.take(JUST_PLUGGED)
        self.assertEqual(view(self.take({**NO_SIGN, "totalMileage": 7830}))[1:3], (False, "unplugged"))
        self.assertIsNone(self.memories[VIN]["cable_seen"])

    def test_the_cable_is_found_in_a_memory_written_before_it_was_held(self):
        """The memory of 0.7.9 on a real car: one trail entry with the inflow at plug-in."""
        legacy = {VIN: {
            "battery_percent": 43, "battery_percent_precise": None, "is_plugged_in": False,
            "connection_state": "unplugged", "dc_cable_connected": False, "odometer_km": 7810,
            "vehicle_timestamp": 1794346463349, "seen_at": 1794346495,
            "raw": {"charge_state": 0, "connector_flag": 0, "current_a": 0.0, "voltage_v": 368.3,
                    "remaining_minutes": 0, "ready": 0, "gear": 0},
            "trail": [{"seen_at": 1794346388, "is_plugged_in": False, "connection_state": "unplugged",
                       "charge_state": 0, "connector_flag": 0, "current_a": -2.6, "voltage_v": 368.2,
                       "remaining_minutes": 0, "ready": 0, "gear": 0}]}}
        for status in (NO_SIGN, SLEEPING_T03):
            with self.subTest(reduced=status is SLEEPING_T03):
                self.memories = bm.from_storage(copy.deepcopy(legacy))
                vehicles = self.take(status, 1794347000.0)
                self.assertEqual(view(vehicles), (43, True, "plugged_in", False))
                self.assertEqual(vehicles[VIN]["charging"]["cable_state_seen_at"], 1794346388)
                self.assertTrue(self.changed)
        # A gear after the inflow means it drove: nothing is held.
        legacy[VIN]["trail"].append({**legacy[VIN]["trail"][0], "seen_at": 1794346400,
                                     "current_a": 20.0, "gear": 3})
        self.memories = bm.from_storage(copy.deepcopy(legacy))
        self.assertEqual(view(self.take(NO_SIGN, 1794347000.0))[1:3], (False, "unplugged"))

    def test_other_models_are_never_held(self):
        memories = {}
        for status, expected in (({"1149": 2, "1178": -8, "1200": 60}, True), ({"1149": 0, "1178": 0}, False)):
            vehicle = api.Vehicle(VIN, None, "C10", None, False)
            vehicles = {VIN: api.normalize_vehicle(
                vehicle, {"data": {"signal": {"1010": 0, "1319": 0, "1204": 60, **status}}}, None)}
            bm.update(memories, vehicles, 1000.0)
            self.assertIs(vehicles[VIN]["charging"]["is_plugged_in"], expected)
        self.assertIsNone(memories[VIN]["cable_seen"])

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
            "remaining_minutes": 0, "ready": 0, "gear": 0, "cable_evidence": "connector_flag"})
        self.assertEqual(self.memories[VIN]["odometer_km"], 7810)

    def test_the_recent_changes_of_the_cable_reading_are_kept(self):
        for seen_at, status in ((1000.0, PLUGGED_WAITING), (1060.0, {**PLUGGED_WAITING, "batteryCurrent": 0.4}),
                                (1120.0, SLEEPING_T03), (1180.0, CHARGING), (1240.0, NO_SIGN)):
            self.take(status, seen_at)
        trail = self.memories[VIN]["trail"]
        # The pack current alone and a reduced status add nothing.
        self.assertEqual(
            [(item["seen_at"], item["charge_state"], item["connector_flag"], item["is_plugged_in"],
              item["connection_state"]) for item in trail],
            [(1000, 0, 1, True, "plugged_in"), (1180, 1, 0, True, "charging"), (1240, 0, 0, True, "plugged_in")])
        for step in range(20):
            self.take(DRIVING if step % 2 else PLUGGED_WAITING, 2000.0 + step)
        self.assertEqual(len(self.memories[VIN]["trail"]), bm.TRAIL_LENGTH)

    def test_a_complete_status_only_ever_gets_the_held_cable(self):
        self.take(UNPLUGGED)
        for status in (UNPLUGGED, PLUGGED_WAITING, CHARGING, DRIVING):
            vehicles = poll(status)
            before = copy.deepcopy(vehicles)
            bm.update(self.memories, vehicles, 2000.0)
            self.assertEqual(vehicles, before)
        self.take(JUST_PLUGGED)
        vehicles = poll(NO_SIGN)
        before = copy.deepcopy(vehicles)
        bm.update(self.memories, vehicles, 3000.0)
        changed = {key for key in vehicles[VIN]["charging"]
                   if vehicles[VIN]["charging"][key] != before[VIN]["charging"].get(key, ...)}
        self.assertEqual(changed, {"is_plugged_in", "connection_state", "cable_state_source",
                                   "cable_state_seen_at"})
        self.assertEqual(vehicles[VIN]["status"], before[VIN]["status"])

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
