"""Charge now on a car without a start command: the schedule is off for one charge."""

from __future__ import annotations

import importlib
import json
import unittest
from unittest.mock import Mock, patch

from test_status_path_fallback import api

cs = importlib.import_module("custom_components.leapmotor.charging_schedule")
cn = importlib.import_module("custom_components.leapmotor.charge_now")
mh = importlib.import_module("custom_components.leapmotor.model_helpers")

VIN = "SYNTHETIC"
#: What the cloud kept from an old command, while the car's screen says 23:00 and 80 %.
CLOUD = {"chargeEnable": 1, "chargesoc": 90, "starttime": "23:55", "endtime": "09:37",
         "cycles": "1,2,3,4,5,6,7", "circulation": 1, "recharge": 0}
T03_RIGHTS = "110,120,130,160,161,170,171,180,190,220,230,340,460"


class ModelTests(unittest.TestCase):
    def test_only_a_t03_without_the_right_has_no_start_command(self):
        cases = (
            ("T03", T03_RIGHTS, False), (" t03 ", None, False), ("T03", "", False),
            ("T03", T03_RIGHTS + ",193", True), ("T03", ["110", 193], True),
            ("C10", None, True), ("B10", "110,120", True), (None, None, True),
        )
        for car_type, rights, expected in cases:
            with self.subTest(car_type=car_type, rights=rights):
                self.assertIs(mh.remote_charge_toggle_supported(car_type, rights), expected)


class PayloadTests(unittest.TestCase):
    def test_the_cars_start_time_and_limit_replace_the_clouds_copy(self):
        merged = cs.with_car_values(CLOUD, {"start": "23:00", "limit": 80})
        self.assertEqual((merged["starttime"], merged["chargesoc"]), ("23:00", 80))
        self.assertEqual(merged["endtime"], "09:37")
        self.assertEqual(CLOUD["starttime"], "23:55")  # not changed in place
        for car in (None, {}, {"start": None, "limit": None}, {"start": "soon", "limit": 0}):
            self.assertEqual(cs.with_car_values(CLOUD, car), CLOUD)
        self.assertEqual(cs.with_car_values(None, {"start": "7:05:00"}), {"starttime": "07:05"})

    def test_the_switch_changes_nothing_but_the_switch(self):
        off = json.loads(cs.schedule_switch_command(CLOUD, enabled=False))
        self.assertEqual(off, {**CLOUD, "chargeEnable": 0})
        self.assertEqual(json.loads(cs.schedule_switch_command(off, enabled=True)), CLOUD)

    def test_a_start_time_only_plan_gets_the_leapconnect_defaults(self):
        plan = {"chargeEnable": 1, "chargesoc": 100, "circulation": 0, "starttime": "20:16"}
        self.assertEqual(json.loads(cs.schedule_switch_command(plan, enabled=False)), {
            "chargeEnable": 0, "chargesoc": 100, "circulation": 0, "cycles": "1,2,3,4,5,6,7",
            "endtime": "08:00", "recharge": 0, "starttime": "20:16"})

    def test_an_unknown_limit_is_not_guessed(self):
        for plan in (None, {}, {"chargeEnable": 1, "starttime": "23:00"}):
            with self.subTest(plan=plan), self.assertRaisesRegex(ValueError, "charge limit"):
                cs.schedule_switch_command(plan, enabled=False)

    def test_enabled_reads_the_clouds_flag(self):
        for value, expected in ((1, True), ("1", True), (True, True), (0, False), (None, False)):
            self.assertIs(cs.is_enabled({"chargeEnable": value}), expected)
        self.assertIs(cs.is_enabled(None), False)


class ClientTests(unittest.TestCase):
    def setUp(self):
        self.client = api.LeapmotorApiClient(username="synthetic", password="synthetic")
        self.addCleanup(self.client.close)
        self.vehicle = api.Vehicle(VIN, None, "T03", None, True, rights=T03_RIGHTS)
        self.client._find_vehicle_by_vin = Mock(return_value=self.vehicle)
        self.client.get_charge_schedule = Mock(return_value=dict(CLOUD))
        self.client._remote_control_raw = Mock(return_value={"code": 0})
        self.client._remote_control = Mock(return_value={"code": 0})
        self.client.invalidate_extras = Mock()
        self.client._car_plan_values[VIN] = {"start": "23:00", "limit": 80}
        wait = patch.object(api.time, "sleep")
        wait.start()
        self.addCleanup(wait.stop)

    def sent(self, index=-1):
        kwargs = self.client._remote_control_raw.call_args_list[index].kwargs
        self.assertEqual((kwargs["cmd_id"], kwargs["vin"]), ("190", VIN))
        return kwargs["action_label"], json.loads(kwargs["cmd_content"])

    def test_t03_charge_now_switches_the_schedule_off_with_the_cars_own_values(self):
        self.client.start_charging(VIN)
        self.client._remote_control.assert_not_called()  # no command 193
        self.assertEqual(self.sent(), ("charge_now", {
            "chargeEnable": 0, "chargesoc": 80, "circulation": 1, "cycles": "1,2,3,4,5,6,7",
            "endtime": "09:37", "recharge": 0, "starttime": "23:00"}))
        pause = self.client.paused_schedules[VIN]
        self.assertEqual(pause["plan"], {**CLOUD, "chargeEnable": 1, "chargesoc": 80,
                                         "starttime": "23:00"})
        self.assertIsInstance(pause["since"], int)

    def test_the_schedule_goes_back_on_as_it_was(self):
        self.client.start_charging(VIN)
        # The limit was changed on the car's screen during the charge.
        self.client._car_plan_values[VIN] = {
            "start": "23:00", "limit": 70, "seen_at": api.time.monotonic() + 3600}
        self.client.resume_charging_schedule(VIN)
        self.assertEqual(self.sent(), ("resume_charging_schedule", {
            "chargeEnable": 1, "chargesoc": 70, "circulation": 1, "cycles": "1,2,3,4,5,6,7",
            "endtime": "09:37", "recharge": 0, "starttime": "23:00"}))
        self.assertEqual(self.client.paused_schedules, {})
        with self.assertRaisesRegex(api.LeapmotorApiError, "No charging schedule"):
            self.client.resume_charging_schedule(VIN)

    def test_an_unconfirmed_charge_now_is_sent_twice_and_still_remembered(self):
        unconfirmed = api.LeapmotorRemoteCommandUnconfirmedError("no result yet")
        self.client._remote_control_raw.side_effect = [unconfirmed, unconfirmed]
        with self.assertRaises(api.LeapmotorRemoteCommandUnconfirmedError):
            self.client.start_charging(VIN)
        self.assertEqual(self.client._remote_control_raw.call_count, 2)
        self.assertIn(VIN, self.client.paused_schedules)

    def test_what_the_car_said_before_the_last_command_does_not_count(self):
        self.client.start_charging(VIN)
        # Still the status from before the command (the car sleeps): not used.
        self.client._car_plan_values[VIN] = {
            "start": "21:00", "limit": 60, "seen_at": api.time.monotonic()}
        self.client.resume_charging_schedule(VIN)
        content = self.sent()[1]
        self.assertEqual((content["starttime"], content["chargesoc"]), ("23:00", 80))

    def test_a_new_limit_during_the_charge_keeps_the_pause_and_goes_back_on_with_it(self):
        self.client.start_charging(VIN)
        self.client.set_charge_limit(VIN, 70)
        label, content = self.sent()
        self.assertEqual((label, content["chargeEnable"], content["chargesoc"]),
                         ("set_charge_limit", 0, 70))
        self.assertEqual(self.client.paused_schedules[VIN]["plan"]["chargesoc"], 70)
        self.client.resume_charging_schedule(VIN)
        label, content = self.sent()
        self.assertEqual((label, content["chargeEnable"], content["chargesoc"], content["starttime"]),
                         ("resume_charging_schedule", 1, 70, "23:00"))

    def test_a_failed_resume_keeps_the_pause(self):
        self.client.start_charging(VIN)
        self.client._remote_control_raw.side_effect = api.LeapmotorApiError("offline")
        with self.assertRaises(api.LeapmotorApiError):
            self.client.resume_charging_schedule(VIN)
        self.assertIn(VIN, self.client.paused_schedules)

    def test_a_schedule_that_is_off_is_sent_but_not_remembered(self):
        self.client.get_charge_schedule.return_value = {**CLOUD, "chargeEnable": 0}
        self.client.start_charging(VIN)
        self.assertEqual(self.sent()[1]["chargeEnable"], 0)
        self.assertEqual(self.client.paused_schedules, {})

    def test_a_second_press_keeps_the_first_pause(self):
        self.client.start_charging(VIN)
        first = dict(self.client.paused_schedules[VIN])
        self.client.start_charging(VIN)  # builds on the plan just sent: off
        self.assertEqual(self.client.paused_schedules[VIN], first)

    def test_setting_the_schedule_by_hand_ends_the_pause(self):
        self.client.start_charging(VIN)
        self.client.set_charging_schedule(VIN, start_time="22:00")
        self.assertEqual(self.client.paused_schedules, {})
        label, content = self.sent()
        self.assertEqual((label, content["starttime"], content["chargeEnable"]),
                         ("set_charging_schedule", "22:00", 0))

    def test_no_schedule_and_no_limit_is_refused_before_any_command(self):
        self.client.get_charge_schedule.return_value = {}
        self.client._car_plan_values.clear()
        with self.assertRaisesRegex(api.LeapmotorApiError, "charge limit"):
            self.client.start_charging(VIN)
        self.client._remote_control_raw.assert_not_called()

    def test_t03_cannot_be_stopped_and_says_so(self):
        with self.assertRaisesRegex(api.LeapmotorApiError, "no remote command to stop"):
            self.client.stop_charging(VIN)
        self.client._remote_control.assert_not_called()
        self.client._remote_control_raw.assert_not_called()

    def test_cars_with_the_command_still_get_193(self):
        for car_type, rights in (("C10", None), ("B10", "110"), ("T03", T03_RIGHTS + ",193")):
            self.vehicle.car_type, self.vehicle.rights = car_type, rights
            self.client._remote_control.reset_mock()
            self.client.start_charging(VIN)
            self.client.stop_charging(VIN)
            self.assertEqual(
                [call.kwargs for call in self.client._remote_control.call_args_list],
                [{"vin": VIN, "action": "charging_start"}, {"vin": VIN, "action": "charging_stop"}])
        self.client._remote_control_raw.assert_not_called()
        self.assertEqual(self.client.paused_schedules, {})

    def test_t03_charge_limit_keeps_the_start_time_set_in_the_car(self):
        self.client.set_charge_limit(VIN, 70)
        self.assertEqual(self.sent(), ("set_charge_limit", {
            "chargeEnable": 1, "chargesoc": 70, "circulation": 1, "cycles": "1,2,3,4,5,6,7",
            "endtime": "09:37", "recharge": 0, "starttime": "23:00"}))

    def test_the_cars_values_are_only_taken_from_a_complete_status(self):
        self.client._car_plan_values.clear()
        data = {"charging": {"battery_data_reported": False},
                "diagnostics": {"charging_plan_start_raw": "00:00",
                                "charge_limit_named_status_raw": 0}}
        self.client._remember_car_plan_values(self.vehicle, data)
        self.assertEqual(self.client._car_plan_values, {})
        data["charging"]["battery_data_reported"] = True
        data["diagnostics"].update(charging_plan_start_raw="23:00", charge_limit_named_status_raw=80)
        self.client._remember_car_plan_values(self.vehicle, data)
        seen = self.client._car_plan_values[VIN]
        self.assertEqual((seen["start"], seen["limit"]), ("23:00", 80))
        self.assertIsInstance(seen["seen_at"], float)


def status(*, charging=False, reported=True, gear="P", odometer=1000.0, speed=0):
    return {
        "charging": {"is_charging": charging, "battery_data_reported": reported},
        "status": {"gear": gear, "odometer_km": odometer, "speed_kmh": speed, "is_driving": False},
    }


class ResumeTests(unittest.TestCase):
    def setUp(self):
        self.pause = {"since": 1000, "plan": dict(CLOUD)}

    def test_nothing_happens_before_the_charge_starts(self):
        self.assertIsNone(cn.observe(self.pause, status(), 1060))
        self.assertEqual(self.pause["odometer_km"], 1000.0)
        self.assertNotIn("charge_seen", self.pause)

    def test_the_schedule_is_due_once_the_charge_has_been_over_for_a_while(self):
        self.assertIsNone(cn.observe(self.pause, status(charging=True), 1100))
        self.assertIsNone(cn.observe(self.pause, status(charging=True), 5000))
        self.assertIsNone(cn.observe(self.pause, status(), 9000))  # just ended
        self.assertIsNone(cn.observe(self.pause, status(), 9000 + cn.CHARGE_END_SETTLE_SECONDS - 1))
        self.assertEqual(cn.observe(self.pause, status(), 9000 + cn.CHARGE_END_SETTLE_SECONDS),
                         cn.REASON_CHARGE_ENDED)

    def test_a_charge_that_picks_up_again_is_not_over(self):
        cn.observe(self.pause, status(charging=True), 1100)
        cn.observe(self.pause, status(), 2000)
        self.assertIsNone(cn.observe(self.pause, status(charging=True), 2100))
        # The pause counts from the first status without a charge after that.
        self.assertIsNone(cn.observe(self.pause, status(), 2300))
        self.assertIsNone(cn.observe(self.pause, status(), 2000 + cn.CHARGE_END_SETTLE_SECONDS))
        self.assertEqual(cn.observe(self.pause, status(), 2300 + cn.CHARGE_END_SETTLE_SECONDS),
                         cn.REASON_CHARGE_ENDED)

    def test_a_car_asleep_after_the_charge_counts_as_not_charging(self):
        cn.observe(self.pause, status(charging=True), 1100)
        self.assertIsNone(cn.observe(self.pause, status(reported=False), 9000))
        self.assertEqual(cn.observe(self.pause, status(reported=False), 9400), cn.REASON_CHARGE_ENDED)

    def test_a_reduced_status_never_counts_as_charging(self):
        cn.observe(self.pause, status(charging=True, reported=False), 1100)
        self.assertNotIn("charge_seen", self.pause)

    def test_driving_brings_the_schedule_back(self):
        cn.observe(self.pause, status(), 1060)
        for moved in (status(gear="D"), status(speed=12), status(odometer=1003.0)):
            self.assertEqual(cn.observe(self.pause, moved, 2000), cn.REASON_DROVE)
        self.assertIsNone(cn.observe(self.pause, status(odometer=1000.4), 2000))

    def test_without_charge_or_drive_it_comes_back_after_a_long_time(self):
        self.assertIsNone(cn.observe(self.pause, status(), 1000 + cn.MAX_PAUSE_SECONDS - 1))
        self.assertEqual(cn.observe(self.pause, status(), 1000 + cn.MAX_PAUSE_SECONDS),
                         cn.REASON_TIMEOUT)

    def test_failed_attempts_wait_and_end(self):
        self.assertTrue(cn.may_try(self.pause, 0))
        for attempt in range(1, cn.RESUME_MAX_ATTEMPTS):
            self.assertTrue(cn.failed(self.pause, "offline", 5000))
            self.assertEqual(self.pause["attempts"], attempt)
        self.assertFalse(cn.may_try(self.pause, 5000 + cn.RESUME_RETRY_SECONDS - 1))
        self.assertTrue(cn.may_try(self.pause, 5000 + cn.RESUME_RETRY_SECONDS))
        self.assertFalse(cn.failed(self.pause, "offline", 6000))
        self.assertEqual(self.pause["last_error"], "offline")

    def test_the_charging_block_says_whether_the_schedule_is_paused(self):
        data = status()
        cn.apply(data, self.pause)
        self.assertEqual((data["charging"]["charging_schedule_paused"],
                          data["charging"]["charging_schedule_paused_since"]), (True, 1000))
        cn.apply(data, None)
        self.assertEqual((data["charging"]["charging_schedule_paused"],
                          data["charging"]["charging_schedule_paused_since"]), (False, None))

    def test_storage_drops_what_is_not_a_pause(self):
        stored = {"A": {"since": 1, "plan": {"chargeEnable": 1}}, "B": {"since": 2}, "C": "x"}
        self.assertEqual(cn.from_storage(stored), {"A": stored["A"]})
        self.assertEqual(cn.from_storage(None), {})


if __name__ == "__main__":
    unittest.main()
