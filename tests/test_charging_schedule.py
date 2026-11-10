"""The charging schedule: parsing, the command 190 payload and the client method."""

from __future__ import annotations

from datetime import time
import importlib
import json
import unittest
from unittest.mock import Mock, patch

from test_status_path_fallback import api

cs = importlib.import_module("custom_components.leapmotor.charging_schedule")

VIN = "SYNTHETIC"
STATUS_PLAN = {"isEnable": 1, "percent": 90, "beginTime": "23:00", "endTime": "06:00",
               "cycles": "1,3,5", "circulation": 1, "recharge": 1}


class ParsingTests(unittest.TestCase):
    def test_times(self):
        for value, expected in (("7:05", "07:05"), ("23:00:00", "23:00"), (" 00:00 ", "00:00"),
                                (time(6, 30), "06:30"), ("06:30:15.500", "06:30")):
            self.assertEqual(cs.normalize_time(value), expected)
        for value in ("24:00", "12:60", "noon", "", None, "7", "07-30"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                cs.normalize_time(value)
        self.assertEqual(cs.parse_time("23:15"), time(23, 15))
        self.assertIsNone(cs.parse_time(None))

    def test_days_from_names_and_numbers(self):
        cases = (
            (["mon", "Wed", "FRIDAY"], [1, 3, 5]),
            ([7, 1, "3", 3], [1, 3, 7]),
            ("sat, sun", [6, 7]),
            ("1,2,3,4,5", [1, 2, 3, 4, 5]),
            (5, [5]),
        )
        for value, expected in cases:
            self.assertEqual(cs.normalize_days(value), expected)
        for value in ([], "", [0], [8], ["someday"], [True], None, ["1.5"]):
            with self.subTest(value=value), self.assertRaises(ValueError):
                cs.normalize_days(value)

    def test_cycles_in_both_forms(self):
        cases = (
            ("1,2,3,4,5", [1, 2, 3, 4, 5]),
            ("7,1", [1, 7]),
            ("1,2,3,4,5,6,7", [1, 2, 3, 4, 5, 6, 7]),
            ("1,1,1,1,1,0,0", [1, 2, 3, 4, 5]),
            ("1,1,1,1,1,1,1", [1, 2, 3, 4, 5, 6, 7]),
            ("0,0,0,0,0,0,1", [7]),
            ("1", [1]),
            ([2, 4], [2, 4]),
        )
        for value, expected in cases:
            self.assertEqual(cs.parse_cycles(value), expected, value)
        for value in (None, "", "weekly", "0", "8", "1,x"):
            self.assertIsNone(cs.parse_cycles(value), value)

    def test_view_for_entities_and_dashboard(self):
        view = cs.schedule_view({
            "charging_planned_enabled": 1, "charging_planned_start": "23:00",
            "charging_planned_end": "06:00:00", "charging_planned_cycles": "1,2,3,4,5",
            "charging_planned_circulation": "1", "charging_planned_recharge": 0,
            "charge_limit_percent": 80,
        })
        self.assertEqual(view, {
            "enabled": True, "start": "23:00", "end": "06:00", "days": [1, 2, 3, 4, 5],
            "repeat_weekly": True, "auto_recharge": False, "charge_limit_percent": 80,
        })
        self.assertEqual(set(cs.schedule_view(None).values()), {None})

    def test_cloud_schedule_only_fills_gaps(self):
        charging = {"charging_planned_enabled": None, "charging_planned_start": None,
                    "charge_limit_percent": 95}
        cloud = {"chargeEnable": "1", "chargesoc": 80, "starttime": "23:00"}
        self.assertTrue(cs.apply_cloud_schedule(charging, cloud))
        self.assertEqual(charging, {
            "charging_planned_enabled": 1, "charging_planned_start": "23:00",
            "charge_limit_percent": 95, "charging_plan_source": "cloud_schedule"})
        for nothing in (None, {}, [], "text", {"controls": []}):
            block = {"charging_planned_enabled": None}
            self.assertFalse(cs.apply_cloud_schedule(block, nothing))
            self.assertEqual(block, {"charging_planned_enabled": None})

    def test_the_cars_own_start_time_replaces_a_different_cloud_copy(self):
        cloud = {"charging_planned_enabled": 1, "charging_planned_start": "23:55",
                 "charging_planned_end": "09:37", "charging_planned_cycles": "1,2,3,4,5,6,7",
                 "charging_planned_circulation": 0, "charging_planned_recharge": 0,
                 "charge_limit_percent": 80, "charging_plan_source": "cloud_schedule"}
        charging = dict(cloud)
        self.assertTrue(cs.apply_vehicle_start(charging, "23:00"))
        # The cloud's plan is not the one the car runs: its window and days go too.
        self.assertEqual(charging, {
            "charging_planned_enabled": 1, "charging_planned_start": "23:00",
            "charging_planned_end": None, "charging_planned_cycles": None,
            "charging_planned_circulation": None, "charging_planned_recharge": None,
            "charge_limit_percent": 80, "charging_plan_source": "vehicle_start"})
        self.assertEqual(cs.schedule_view(charging)["start"], "23:00")
        # The same time in another spelling is the same plan: nothing is touched.
        for same in ("23:55", "23:55:00", time(23, 55)):
            charging = dict(cloud)
            self.assertFalse(cs.apply_vehicle_start(charging, same))
            self.assertEqual(charging, cloud)

    def test_the_cars_start_time_fills_a_cloud_plan_without_one(self):
        charging = {"charging_planned_enabled": 0, "charging_planned_start": None,
                    "charging_planned_end": "06:00"}
        self.assertTrue(cs.apply_vehicle_start(charging, "22:30"))
        self.assertEqual(charging, {
            "charging_planned_enabled": 0, "charging_planned_start": "22:30",
            "charging_planned_end": "06:00", "charging_plan_source": "vehicle_start"})

    def test_a_start_time_alone_is_no_schedule(self):
        for enabled in (None, ""):
            charging = {"charging_planned_enabled": enabled, "charging_planned_start": None}
            self.assertFalse(cs.apply_vehicle_start(charging, "00:00"))
            self.assertIsNone(charging["charging_planned_start"])
        for nothing in (None, "", "soon", "25:00", 2300):
            charging = {"charging_planned_enabled": 1, "charging_planned_start": "23:55"}
            self.assertFalse(cs.apply_vehicle_start(charging, nothing))
            self.assertEqual(charging["charging_planned_start"], "23:55")


class PayloadTests(unittest.TestCase):
    def build(self, current=None, **kwargs):
        return cs.build_schedule_command(current, **kwargs)

    def test_full_schedule_matches_leapconnect(self):
        """Byte-identical to leapmotor-api 0.6.0 ``RemoteActionCtlChargePlan``."""
        content = self.build(
            start_time="23:00", end_time=time(7, 0), days=["mon", "tue", "wed", "thu", "fri"],
            enabled=True, charge_limit_percent=80, repeat_weekly=True, auto_recharge=False)
        self.assertEqual(
            content,
            '{"chargeEnable":1,"chargesoc":80,"circulation":1,"cycles":"1,2,3,4,5",'
            '"endtime":"07:00","recharge":0,"starttime":"23:00"}')

    def test_values_not_given_are_kept(self):
        plan = api._normalize_charge_plan(STATUS_PLAN)
        self.assertEqual(json.loads(self.build(plan, start_time="22:30")), {
            "chargeEnable": 1, "chargesoc": 90, "circulation": 1, "cycles": "1,3,5",
            "endtime": "06:00", "recharge": 1, "starttime": "22:30"})
        self.assertEqual(json.loads(self.build(plan, enabled=False, days=[6, 7],
                                               charge_limit_percent=70, auto_recharge=False,
                                               repeat_weekly=False)), {
            "chargeEnable": 0, "chargesoc": 70, "circulation": 0, "cycles": "6,7",
            "endtime": "06:00", "recharge": 0, "starttime": "23:00"})

    def test_the_cars_own_cycles_text_is_passed_through(self):
        plan = api._normalize_charge_plan({**STATUS_PLAN, "cycles": "1,1,1,1,1,0,0"})
        self.assertEqual(json.loads(self.build(plan, end_time="05:00"))["cycles"], "1,1,1,1,1,0,0")

    def test_defaults_for_a_car_without_a_schedule(self):
        content = json.loads(self.build({}, start_time="01:00", end_time="05:00",
                                        charge_limit_percent=80))
        self.assertEqual(content, {
            "chargeEnable": 0, "chargesoc": 80, "circulation": 1, "cycles": "1,2,3,4,5,6,7",
            "endtime": "05:00", "recharge": 0, "starttime": "01:00"})

    def test_missing_values_are_refused_with_a_reason(self):
        cases = (
            ({}, {"start_time": "01:00", "charge_limit_percent": 80}, "end time"),
            ({}, {"end_time": "01:00", "charge_limit_percent": 80}, "start time"),
            ({}, {"start_time": "01:00", "end_time": "02:00"}, "charge limit"),
            ({}, {"start_time": "25:00", "end_time": "02:00", "charge_limit_percent": 80},
             "Not a time of day"),
            ({}, {"start_time": "01:00", "end_time": "02:00", "charge_limit_percent": 0},
             "1-100"),
            ({}, {"start_time": "01:00", "end_time": "02:00", "charge_limit_percent": 101},
             "1-100"),
            ({}, {"start_time": "01:00", "end_time": "02:00", "charge_limit_percent": 80,
                  "days": []}, "at least one weekday"),
        )
        for current, kwargs, message in cases:
            with self.subTest(message=message), self.assertRaisesRegex(ValueError, message):
                self.build(current, **kwargs)


class ClientTests(unittest.TestCase):
    def setUp(self):
        self.client = api.LeapmotorApiClient(username="synthetic", password="synthetic")
        self.addCleanup(self.client.close)
        self.vehicle = api.Vehicle(VIN, None, "C10", None, False)
        self.client._find_vehicle_by_vin = Mock(return_value=self.vehicle)
        self.client.get_vehicle_status = Mock(
            return_value={"data": {"config": {"3": dict(STATUS_PLAN)}}})
        self.client.get_charge_schedule = Mock(return_value={})
        self.client._remote_control_raw = Mock(return_value={"code": 0})
        self.client.invalidate_extras = Mock()
        wait = patch.object(api.time, "sleep")
        self.sleep = wait.start()
        self.addCleanup(wait.stop)

    def sent(self):
        kwargs = self.client._remote_control_raw.call_args.kwargs
        self.assertEqual((kwargs["cmd_id"], kwargs["action_label"], kwargs["vin"]),
                         ("190", "set_charging_schedule", VIN))
        return json.loads(kwargs["cmd_content"])

    def test_a_complete_schedule_is_sent_without_reading_anything(self):
        self.client.set_charging_schedule(
            VIN, start_time="23:00", end_time="07:00", days=[1, 2, 3, 4, 5], enabled=True,
            charge_limit_percent=80, repeat_weekly=True, auto_recharge=False)
        self.assertEqual(self.sent(), {
            "chargeEnable": 1, "chargesoc": 80, "circulation": 1, "cycles": "1,2,3,4,5",
            "endtime": "07:00", "recharge": 0, "starttime": "23:00"})
        self.client.get_vehicle_status.assert_not_called()
        self.client.get_charge_schedule.assert_not_called()
        self.client.invalidate_extras.assert_called_once_with("charging_schedule")

    def test_a_partial_change_keeps_the_status_plan(self):
        self.client.set_charging_schedule(VIN, end_time="05:30")
        self.assertEqual(self.sent(), {
            "chargeEnable": 1, "chargesoc": 90, "circulation": 1, "cycles": "1,3,5",
            "endtime": "05:30", "recharge": 1, "starttime": "23:00"})
        self.client.get_charge_schedule.assert_not_called()

    def test_an_incomplete_status_plan_is_completed_from_the_cloud(self):
        self.client.get_vehicle_status.return_value = {
            "data": {"config": {"3": {"isEnable": 0, "percent": 85}}}}
        self.client.get_charge_schedule.return_value = {
            "chargeEnable": 1, "chargesoc": 60, "starttime": "01:00", "endtime": "04:00",
            "cycles": "2,4", "circulation": 0, "recharge": 1}
        self.client.set_charging_schedule(VIN, enabled=True)
        self.assertEqual(self.sent(), {
            "chargeEnable": 1, "chargesoc": 85, "circulation": 0, "cycles": "2,4",
            "endtime": "04:00", "recharge": 1, "starttime": "01:00"})

    def test_t03_uses_the_cloud_schedule_and_never_the_status(self):
        self.vehicle.car_type = " t03 "
        self.client.get_charge_schedule.return_value = {
            "chargeEnable": 1, "chargesoc": 90, "starttime": "23:00", "endtime": "06:30",
            "cycles": "1,2,3,4,5", "circulation": 1, "recharge": 0}
        self.client.set_charging_schedule(VIN, start_time="22:00", days=["sat", "sun"])
        self.assertEqual(self.sent(), {
            "chargeEnable": 1, "chargesoc": 90, "circulation": 1, "cycles": "6,7",
            "endtime": "06:30", "recharge": 0, "starttime": "22:00"})
        self.client.get_vehicle_status.assert_not_called()

    def test_t03_limit_range_and_one_repeat_when_unconfirmed(self):
        self.vehicle.car_type = "T03"
        with self.assertRaisesRegex(api.LeapmotorApiError, "50-100"):
            self.client.set_charging_schedule(VIN, start_time="1:00", end_time="2:00",
                                              charge_limit_percent=40)
        self.client._remote_control_raw.assert_not_called()
        unconfirmed = api.LeapmotorRemoteCommandUnconfirmedError("no result yet")
        self.client._remote_control_raw.side_effect = [unconfirmed, {"code": 0}]
        self.client.set_charging_schedule(VIN, start_time="1:00", end_time="2:00",
                                          charge_limit_percent=80)
        self.assertEqual(self.client._remote_control_raw.call_count, 2)
        self.client._remote_control_raw.side_effect = [unconfirmed, unconfirmed]
        with self.assertRaises(api.LeapmotorRemoteCommandUnconfirmedError):
            self.client.set_charging_schedule(VIN, start_time="1:00", end_time="2:00",
                                              charge_limit_percent=80)

    def test_other_models_are_not_sent_twice(self):
        self.client._remote_control_raw.side_effect = api.LeapmotorRemoteCommandUnconfirmedError("x")
        with self.assertRaises(api.LeapmotorRemoteCommandUnconfirmedError):
            self.client.set_charging_schedule(VIN, start_time="1:00")
        self.assertEqual(self.client._remote_control_raw.call_count, 1)
        self.client.invalidate_extras.assert_not_called()

    def test_an_unknown_schedule_is_refused_before_any_command(self):
        self.client.get_vehicle_status.return_value = {"data": {}}
        with self.assertRaisesRegex(api.LeapmotorApiError, "end time"):
            self.client.set_charging_schedule(VIN, start_time="01:00")
        self.client._remote_control_raw.assert_not_called()

    def test_status_carries_the_recharge_flag(self):
        data = api.normalize_vehicle(
            self.vehicle, {"data": {"config": {"3": dict(STATUS_PLAN)}}}, None)
        self.assertEqual(cs.schedule_view(data["charging"]), {
            "enabled": True, "start": "23:00", "end": "06:00", "days": [1, 3, 5],
            "repeat_weekly": True, "auto_recharge": True, "charge_limit_percent": 90})


if __name__ == "__main__":
    unittest.main()
