"""The extra cloud reads: signing, request bodies, caching and failure isolation.

A fake cloud stands in for the transport; nothing is sent anywhere and all
data is synthetic. Signatures are checked against an independent copy of the
rule the official app uses (and leapmotor-api 0.6.0 implements): the header
fields, the VIN and the body parameters, sorted by key, concatenated and
signed with HMAC-SHA256.
"""
import hashlib
import hmac
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch
from urllib.parse import quote, urlencode

from test_status_path_fallback import api

VIN = "SYNTHETIC-VIN-123456"
BASE = "/carownerservice"
SOFTWARE = f"{BASE}/oversea/hotspot/fetch"
MESSAGES = f"{BASE}/oversea/message/v1/list"
UNREAD = f"{BASE}/oversea/message/v1/unread/count"
INVITES = f"{BASE}/oversea/sharecar/getsharemsg"
ANSWER = f"{BASE}/oversea/sharecar/setokmsg"
APPOINTMENT = f"{BASE}/oversea/vehicle/v1/app/remote/ctl/getAppointment"
DAILY = f"{BASE}/oversea/drivingRecord/v1/mileage/energy/detail"
CHARGING = f"{BASE}/charge/daily/detail/page"
VEHICLES = f"{BASE}/oversea/vehicle/v1/list"
#: The climate, battery-heating and prepare-car schedules, plus the charging
#: schedule, which is only read for a car whose status does not carry it.
SCHEDULE_READS = len(api.SCHEDULE_COMMANDS) + 1


def reference_signature(client, headers, *, vin=None, body_params=None):
    fields = {
        "acceptLanguage": client.language,
        "channel": "1",
        "deviceId": client.device_id,
        "deviceType": "1",
        "nonce": headers["nonce"],
        "source": "leapmotor",
        "timestamp": headers["timestamp"],
        "version": headers["version"],
    }
    if vin:
        fields["vin"] = vin
    fields.update(body_params or {})
    message = "".join(value for _, value in sorted(fields.items()))
    return hmac.new(client.sign_key, message.encode("utf-8"), hashlib.sha256).hexdigest()


class FakeCloud:
    """Answer by path; record every request."""

    def __init__(self):
        self.calls = []
        self.answers = {}
        self.fail = {}
        self.timeouts = {}

    def count(self, path):
        return sum(1 for item in self.calls if item[0] == path)

    def last(self, path):
        return [item for item in self.calls if item[0] == path][-1]

    def post(self, *, path, headers, data, cert, timeout=None):
        self.calls.append((path, dict(headers), data))
        self.timeouts.setdefault(path, set()).add(timeout)
        if path in self.fail:
            code, message = self.fail[path]
            return {"status_code": 200,
                    "body": json.dumps({"code": code, "result": code, "message": message})}
        answer = self.answers.get(path)
        if callable(answer):
            answer = answer(data)
        return {"status_code": 200,
                "body": json.dumps({"code": 0, "result": 0, "message": "ok", "data": answer})}


def make_client(cloud):
    directory = tempfile.TemporaryDirectory(prefix="leapmotor-reads-")
    cert = Path(directory.name) / "account.pem"
    cert.write_text("synthetic")
    client = api.LeapmotorApiClient(username="synthetic", password="synthetic")
    client.transport = cloud
    client.user_id = "synthetic-user"
    client.token = "synthetic-token"
    client.sign_ikm = client.sign_salt = client.sign_info = "synthetic"
    client.account_cert_file = client.account_key_file = str(cert)
    client._clear_account_cert_files = Mock()
    return client, directory


class SigningTests(unittest.TestCase):
    """Every new request is signed and encoded as the official app does it."""

    def setUp(self):
        self.cloud = FakeCloud()
        self.client, directory = make_client(self.cloud)
        self.addCleanup(directory.cleanup)
        self.addCleanup(self.client.close)
        self.vehicle = api.Vehicle(VIN, "synthetic-car", "C10", "Owner", False)

    def assert_signed(self, path, *, vin=None, body_params=None, body=None, content_type=None):
        _, headers, data = self.cloud.last(path)
        self.assertEqual(
            headers["sign"], reference_signature(self.client, headers, vin=vin, body_params=body_params)
        )
        self.assertEqual(headers["userId"], "synthetic-user")
        self.assertEqual(headers["token"], "synthetic-token")
        self.assertEqual(headers["Content-Type"],
                         content_type or "application/x-www-form-urlencoded")
        if body is not None:
            self.assertEqual(data, body)

    def test_software_info(self):
        self.cloud.answers[SOFTWARE] = {"currentVersion": {"generalVersion": "1.0"}}
        result = self.client.get_software_info(self.vehicle)
        self.assertEqual(result["data"]["currentVersion"]["generalVersion"], "1.0")
        self.assert_signed(SOFTWARE, vin=VIN, body=f"vin={quote(VIN, safe='')}")

    def test_message_list_asks_for_a_page(self):
        self.cloud.answers[UNREAD] = {"unread": 2}
        self.cloud.answers[MESSAGES] = {"list": [
            {"id": 5, "title": "Older", "sendTime": 1_780_000_000_000},
            {"id": 6, "title": "Newest", "sendTime": 1_780_000_900_000, "message": "Hello"},
        ]}
        result = self.client._fetch_account_notifications()
        size = str(api.INBOX_PAGE_SIZE)
        self.assert_signed(MESSAGES, body_params={"pageNo": "1", "pageSize": size},
                           body=f"pageNo=1&pageSize={size}")
        self.assertEqual(result["unread_count"], 2)
        self.assertEqual(result["last_message_title"], "Newest")
        self.assertEqual(result["last_message_time"], 1_780_000_900_000)
        self.assertEqual([m["title"] for m in result["messages"]], ["Newest", "Older"])

    def test_share_invitations_and_answer(self):
        self.cloud.answers[INVITES] = [
            {"shareUserid": "owner-77", "carCode": VIN, "carType": "C10", "nickName": "Owner"},
        ]
        invitations = self.client._get_share_invitations()
        self.assert_signed(INVITES, body="")
        self.assertEqual(invitations[0]["vin_tail"], VIN[-6:])

        result = self.client.answer_share_invitation(None, accept=True)
        params = {"shareUserId": "owner-77", "userId": "synthetic-user",
                  "carCode": VIN, "state": "yes"}
        self.assert_signed(ANSWER, body_params=params, body=urlencode(params))
        self.assertEqual(result, {"accepted": True, "car_type": "C10",
                                  "vin_tail": VIN[-6:], "code": 0})

        self.client.answer_share_invitation("123456", accept=False)
        params["state"] = "no"
        self.assert_signed(ANSWER, body_params=params, body=urlencode(params))

    def test_answer_needs_exactly_one_invitation(self):
        self.cloud.answers[INVITES] = []
        with self.assertRaisesRegex(api.LeapmotorApiError, "No matching"):
            self.client.answer_share_invitation(None, accept=True)
        self.cloud.answers[INVITES] = [
            {"shareUserid": "a", "carCode": "VIN-ONE-000001"},
            {"shareUserid": "b", "carCode": "VIN-TWO-000002"},
        ]
        with self.assertRaisesRegex(api.LeapmotorApiError, "Several"):
            self.client.answer_share_invitation(None, accept=True)
        with self.assertRaisesRegex(api.LeapmotorApiError, "No matching"):
            self.client.answer_share_invitation("999999", accept=True)
        self.assertEqual(self.cloud.count(ANSWER), 0, "nothing may be answered by guessing")
        self.client.answer_share_invitation("000002", accept=True)
        self.assertIn("carCode=VIN-TWO-000002", self.cloud.last(ANSWER)[2])

    def test_schedules(self):
        self.cloud.answers[APPOINTMENT] = json.dumps({"controls": [
            {"on": "1", "start_time": "2026-01-31 07:10:00", "days": [1, 2], "set_id": "a"},
        ]})
        for kind, cmd_id in api.SCHEDULE_COMMANDS.items():
            with self.subTest(kind=kind):
                controls = self.client._get_appointment_controls(VIN, cmd_id, kind)
                self.assertEqual(controls[0]["set_id"], "a")
                self.assert_signed(APPOINTMENT, vin=VIN, body_params={"cmdId": cmd_id},
                                   body=f"vin={quote(VIN, safe='')}&cmdId={cmd_id}")

    def test_schedule_answers_without_entries(self):
        for answer in (None, "", "not json", json.dumps({}), {"controls": None}, []):
            with self.subTest(answer=answer):
                self.cloud.answers[APPOINTMENT] = answer
                self.assertEqual(self.client._get_appointment_controls(VIN, "171", "x"), [])

    def test_daily_history_window(self):
        begin, end = 1_780_000_000_000, 1_787_000_000_000
        self.cloud.answers[DAILY] = {"detail": []}
        self.client.get_mileage_energy_history(self.vehicle, begin_ms=begin, end_ms=end)
        _, headers, data = self.cloud.last(DAILY)
        self.assertEqual(
            headers["sign"],
            reference_signature(self.client, headers, vin=VIN,
                                body_params={"begintime": str(begin), "endtime": str(end)}),
        )
        self.assertEqual(data, f"endtime={end}&begintime={begin}&vin={quote(VIN, safe='')}")

    def test_charging_history_pages(self):
        size = api.CHARGING_HISTORY_PAGE_SIZE

        def answer(data):
            page = json.loads(data)["pageNum"]
            count = size if page == 1 else 3
            return {"list": [{"chargeGunStartTs": 1_780_000_000_000 + page * 1000 + i}
                             for i in range(count)]}

        self.cloud.answers[CHARGING] = answer
        records = self.client.get_charging_history(self.vehicle)
        self.assertEqual(len(records), size + 3)
        self.assertEqual(self.cloud.count(CHARGING), 2)
        _, headers, data = self.cloud.last(CHARGING)
        sent = json.loads(data)
        self.assertEqual(list(sent), ["vin", "timeZone", "startTime", "endTime", "pageNum", "pageSize"])
        self.assertEqual(data, json.dumps(sent, separators=(",", ":")))
        params = {key: str(value) for key, value in sent.items()}
        self.assertEqual(headers["sign"],
                         reference_signature(self.client, headers, body_params=params))
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertEqual(sent["pageNum"], 2)
        self.assertEqual(sent["timeZone"], "GMT+00:00")

    def test_charging_history_stops_at_the_page_limit(self):
        size = api.CHARGING_HISTORY_PAGE_SIZE
        self.cloud.answers[CHARGING] = {"list": [{"chargeGunStartTs": 1} for _ in range(size)]}
        self.client.get_charging_history(self.vehicle)
        self.assertEqual(self.cloud.count(CHARGING), api.CHARGING_HISTORY_MAX_PAGES)


class TransportTests(unittest.TestCase):
    """The time limit of a request: only when asked for, and a hang is an API error."""

    def setUp(self):
        self.transport = api.CurlTransport("https://cloud.invalid")
        self.module = sys.modules[api.CurlTransport.__module__]
        self.seen = {}

    def run_curl(self, **kwargs):
        def fake_run(cmd, **options):
            self.seen.update(cmd=cmd, options=options)
            return types.SimpleNamespace(returncode=0, stderr="")

        with patch.object(self.module.subprocess, "run", fake_run):
            return self.transport.post(path="/x", headers={"a": "b"}, data="k=v",
                                       cert=("cert.pem", "key.pem"), **kwargs)

    def test_without_a_limit_the_request_is_sent_as_before(self):
        self.run_curl()
        self.assertNotIn("--max-time", self.seen["cmd"])
        self.assertNotIn("--connect-timeout", self.seen["cmd"])
        self.assertIsNone(self.seen["options"]["timeout"])
        self.assertEqual(self.seen["cmd"][-2:], ["--data", "k=v"])

    def test_a_limit_reaches_curl_and_the_process(self):
        self.run_curl(timeout=20)
        cmd = self.seen["cmd"]
        self.assertEqual(cmd[cmd.index("--max-time") + 1], "20")
        self.assertEqual(cmd[cmd.index("--connect-timeout") + 1], "10")
        self.assertEqual(self.seen["options"]["timeout"], 25)

    def test_a_hanging_request_becomes_an_api_error(self):
        def hang(cmd, **options):
            raise subprocess.TimeoutExpired(cmd, options["timeout"])

        with patch.object(self.module.subprocess, "run", hang):
            with self.assertRaises(api.LeapmotorApiError):
                self.transport.post(path="/x", headers={}, data="", cert=("c", "k"), timeout=3)


class ExtrasTests(unittest.TestCase):
    """Throttling and failure isolation of the extra reads during a poll."""

    def setUp(self):
        self.cloud = FakeCloud()
        self.client, directory = make_client(self.cloud)
        self.addCleanup(directory.cleanup)
        self.addCleanup(self.client.close)
        self.owner = api.Vehicle(VIN, "synthetic-car", "C10", "Owner", False,
                                 rights="110,170", abilities=["50"], module_rights="100")
        self.client.get_vehicle_list = Mock(return_value=[self.owner])
        self.client.get_vehicle_status = Mock(return_value={"data": {"signal": {"1204": 60}}})
        self.client._fetch_optional_read = Mock(return_value=None)
        self.cloud.answers[UNREAD] = {"unread": 1}
        self.cloud.answers[MESSAGES] = {"list": [
            {"id": 1, "title": "For this car", "sendTime": 1_780_000_000_000, "vin": VIN},
            {"id": 2, "title": "Other car", "sendTime": 1_780_000_100_000, "vin": "OTHER"},
        ]}
        self.cloud.answers[SOFTWARE] = {"currentVersion": {"generalVersion": "1.03.12"},
                                        "newVersion": {"generalVersion": "1.04.01"}}
        self.cloud.answers[CHARGING] = {"list": [
            {"chargeGunStartTs": 1_780_000_000_000, "chargeGunEndTs": 1_780_003_600_000,
             "chargeType": "1", "chargeInEnergy": 11},
        ]}
        self.cloud.answers[APPOINTMENT] = json.dumps({"controls": [
            {"on": "1", "start_time": "07:10", "days": [1], "set_id": "a"},
        ]})
        self.cloud.answers[INVITES] = []

    def poll(self):
        return self.client._fetch_authenticated_data()

    def test_poll_carries_the_extras(self):
        data = self.poll()
        car = data["vehicles"][VIN]
        self.assertTrue(car["software"]["update_available"])
        self.assertEqual(car["software"]["latest_version"], "1.04.01")
        self.assertEqual(car["cloud_charging"]["sessions"][0]["energy_kwh"], 11.0)
        self.assertEqual(set(car["schedules"]), {"climate", "battery_heating", "prepare_car"})
        self.assertEqual(car["schedules"]["climate"][0]["time"], "07:10")
        self.assertEqual(car["permissions"]["rights"], ["lock", "climate"])
        self.assertEqual([m["title"] for m in car["inbox"]["messages"]], ["For this car"])
        self.assertEqual(car["inbox"]["unread_count"], 1)
        self.assertEqual(car["notifications"]["unread_count"], 1)
        self.assertNotIn("messages", car["notifications"])
        self.assertEqual(data["share_invitations"], [])

    def test_slow_reads_are_not_repeated_on_every_poll(self):
        for _ in range(5):
            self.poll()
        self.assertEqual(self.cloud.count(SOFTWARE), 1)
        self.assertEqual(self.cloud.count(CHARGING), 1)
        self.assertEqual(self.cloud.count(APPOINTMENT), SCHEDULE_READS)
        self.assertEqual(self.cloud.count(INVITES), 1)
        self.assertEqual(self.cloud.count(MESSAGES), 5)
        self.client.invalidate_extras("schedule_climate")
        self.poll()
        self.assertEqual(self.cloud.count(APPOINTMENT), SCHEDULE_READS + 1)
        self.assertEqual(self.cloud.count(SOFTWARE), 1)
        self.client.invalidate_extras()
        self.poll()
        self.assertEqual(self.cloud.count(SOFTWARE), 2)

    def test_failures_never_break_a_poll_and_keep_the_last_value(self):
        self.poll()
        for path in (SOFTWARE, CHARGING, APPOINTMENT, INVITES, MESSAGES, UNREAD):
            self.cloud.fail[path] = (500, "Service unavailable")
        self.client.invalidate_extras()
        car = self.poll()["vehicles"][VIN]
        self.assertEqual(car["status"]["battery_percent"], 60)
        self.assertEqual(car["software"], api.software_unavailable("unavailable"))
        self.assertIsNone(car["cloud_charging"]["sessions"])
        self.assertIsNone(car["schedules"]["climate"])
        self.assertEqual(car["inbox"]["messages"], [])

        # A value read once survives a later failure.
        self.cloud.fail.clear()
        self.client.invalidate_extras()
        self.poll()
        self.cloud.fail[SOFTWARE] = (500, "Service unavailable")
        self.client._extras[("software", VIN)] = (0.0, self.client._extras[("software", VIN)][1])
        car = self.poll()["vehicles"][VIN]
        self.assertEqual(car["software"]["latest_version"], "1.04.01")

    def test_unexpected_answers_never_break_a_poll(self):
        self.cloud.answers[SOFTWARE] = ["not", "an", "object"]
        self.cloud.answers[CHARGING] = "nonsense"
        self.cloud.answers[APPOINTMENT] = 12
        self.cloud.answers[INVITES] = "nonsense"
        self.cloud.answers[MESSAGES] = "nonsense"
        with self.assertNoLogs("custom_components.leapmotor.api", level="ERROR"):
            car = self.poll()["vehicles"][VIN]
        self.assertEqual(car["status"]["battery_percent"], 60)
        self.assertFalse(car["software"]["update_available"])
        self.assertEqual(car["inbox"]["messages"], [])
        self.assertEqual(car["schedules"]["climate"], [])

    def test_no_permission_is_remembered_for_a_day(self):
        self.cloud.fail[SOFTWARE] = (40, "No such permission")
        self.cloud.fail[APPOINTMENT] = (40, "No such permission")
        for _ in range(4):
            car = self.poll()["vehicles"][VIN]
        self.assertEqual(car["software"]["reason"], "no_permission")
        self.assertIsNone(car["schedules"]["prepare_car"])
        self.assertEqual(self.cloud.count(SOFTWARE), 1)
        self.assertEqual(self.cloud.count(APPOINTMENT), SCHEDULE_READS)
        due, _ = self.client._extras[("software", VIN)]
        self.assertGreater(due - api.time.monotonic(), api.EXTRA_DENIED_SECONDS - 60)

    def appointment_commands(self):
        return [data.rsplit("cmdId=", 1)[1] for path, _, data in self.cloud.calls
                if path == APPOINTMENT]

    def test_a_status_with_the_charging_plan_needs_no_extra_read(self):
        plan = {"isEnable": 1, "percent": 80, "beginTime": "23:00", "endTime": "06:00",
                "cycles": "1,2,3,4,5", "circulation": 1, "recharge": 0}
        self.client.get_vehicle_status.return_value = {
            "data": {"signal": {"1204": 60}, "config": {"3": plan}}}
        charging = self.poll()["vehicles"][VIN]["charging"]
        self.assertNotIn("190", self.appointment_commands())
        self.assertEqual(self.cloud.count(APPOINTMENT), len(api.SCHEDULE_COMMANDS))
        self.assertEqual((charging["charging_planned_start"], charging["charging_planned_recharge"]),
                         ("23:00", 0))
        self.assertNotIn("charging_plan_source", charging)

    def test_a_status_without_the_plan_is_completed_from_the_cloud_schedule(self):
        self.owner.car_type = "T03"
        self.client.get_vehicle_status.return_value = {"data": {
            "signal": {"1204": 60}, "chargesocSetting": 95, "chargeTimeSetting": "00:00"}}
        schedule = {"chargeEnable": 1, "chargesoc": 80, "starttime": "23:00", "endtime": "06:30",
                    "cycles": "1,2,3,4,5", "circulation": 1, "recharge": 0}
        self.cloud.answers[APPOINTMENT] = (
            lambda data: json.dumps(schedule if data.endswith("cmdId=190") else {"controls": []}))
        for _ in range(3):
            charging = self.poll()["vehicles"][VIN]["charging"]
        self.assertEqual(self.appointment_commands().count("190"), 1)
        self.assertEqual(
            [charging[key] for key in ("charging_planned_enabled", "charging_planned_start",
                                       "charging_planned_end", "charging_planned_cycles",
                                       "charging_planned_circulation", "charging_planned_recharge")],
            [1, "23:00", "06:30", "1,2,3,4,5", 1, 0])
        self.assertEqual(charging["charging_plan_source"], "cloud_schedule")
        # What the status reported is never replaced.
        self.assertEqual(charging["charge_limit_percent"], 95)

    def test_a_schedule_change_is_shown_at_once_and_read_back_later(self):
        self.poll()
        self.client._remote_control_raw = Mock(return_value={"code": 0})
        self.client._find_vehicle_by_vin = Mock(return_value=self.owner)
        self.client.set_charging_schedule(
            VIN, start_time="22:00", end_time="05:00", days=[1], enabled=True,
            charge_limit_percent=80, repeat_weekly=True, auto_recharge=False)
        # The confirmed plan is shown at once, although the status has not caught
        # up, and nothing needs to be asked while it is.
        charging = self.poll()["vehicles"][VIN]["charging"]
        self.assertEqual(
            [charging[key] for key in ("charging_planned_enabled", "charging_planned_start",
                                       "charging_planned_end", "charging_planned_cycles",
                                       "charge_limit_percent", "charging_plan_source")],
            [1, "22:00", "05:00", "1", 80, "last_command"])
        self.assertEqual(self.appointment_commands().count("190"), 1)
        # Later the car's own data counts again; the cloud schedule is read anew.
        with patch.object(api.time, "monotonic",
                          return_value=api.time.monotonic() + api.SENT_CHARGE_PLAN_SECONDS + 1):
            charging = self.poll()["vehicles"][VIN]["charging"]
        self.assertIsNone(charging["charging_planned_start"])
        self.assertEqual(self.appointment_commands().count("190"), 2)

    def test_only_the_optional_reads_carry_a_time_limit(self):
        self.poll()
        limit = api.OPTIONAL_READ_TIMEOUT_SECONDS
        for path in (SOFTWARE, CHARGING, APPOINTMENT, INVITES):
            self.assertEqual(self.cloud.timeouts[path], {limit}, path)
        # What every poll already read is sent exactly as before.
        for path in (UNREAD, MESSAGES):
            self.assertEqual(self.cloud.timeouts[path], {None}, path)
        self.assertIsNone(self.client._request_timeout)
        self.assertIsNone(self.client._extras_deadline)

    def test_a_failing_optional_read_does_not_leave_the_time_limit_behind(self):
        self.cloud.fail[SOFTWARE] = (500, "Service unavailable")
        self.cloud.answers[CHARGING] = "nonsense"
        with self.assertLogs("custom_components.leapmotor.api", level="WARNING") as logs:
            self.poll()
        self.assertEqual(len(logs.records), 1)
        self.assertIsNone(self.client._request_timeout)
        self.assertIsNone(self.client._extras_deadline)
        # The same odd answer is not reported again and again.
        self.client.invalidate_extras()
        with self.assertNoLogs("custom_components.leapmotor.api", level="WARNING"):
            self.poll()

    def test_every_status_is_read_before_any_optional_data(self):
        second = api.Vehicle("SYNTHETIC-VIN-654321", "synthetic-car-2", "B10", "Owner", False)
        order = []
        self.client.get_vehicle_list = Mock(return_value=[self.owner, second])
        self.client.get_vehicle_status = Mock(
            side_effect=lambda car: order.append("status") or {"data": {"signal": {"1204": 60}}})
        post = self.cloud.post

        def recording(**kwargs):
            if kwargs["path"] in (SOFTWARE, CHARGING, APPOINTMENT, INVITES):
                order.append("optional")
            return post(**kwargs)

        self.cloud.post = recording
        data = self.poll()
        self.assertEqual(order[:2], ["status", "status"])
        self.assertNotIn("status", order[2:])
        self.assertIn("optional", order[2:])
        self.assertEqual(set(data["vehicles"]), {VIN, "SYNTHETIC-VIN-654321"})
        for car in data["vehicles"].values():
            self.assertIn("software", car)
            self.assertIn("schedules", car)

    def test_a_poll_spends_limited_time_on_optional_reads(self):
        budget = api.EXTRAS_BUDGET_SECONDS
        self.addCleanup(setattr, api, "EXTRAS_BUDGET_SECONDS", budget)
        api.EXTRAS_BUDGET_SECONDS = -1  # the time is already used up
        car = self.poll()["vehicles"][VIN]
        self.assertEqual(car["status"]["battery_percent"], 60)
        for path in (SOFTWARE, CHARGING, APPOINTMENT, INVITES):
            self.assertEqual(self.cloud.count(path), 0, path)
        self.assertEqual(car["software"], api.software_unavailable("unavailable"))
        self.assertIsNone(car["cloud_charging"]["sessions"])
        # Nothing was marked as failed: the next poll asks straight away.
        api.EXTRAS_BUDGET_SECONDS = budget
        car = self.poll()["vehicles"][VIN]
        self.assertEqual(car["software"]["latest_version"], "1.04.01")
        self.assertEqual(self.cloud.count(SOFTWARE), 1)

    def test_a_json_answer_that_is_not_an_object_is_an_api_error(self):
        for body in ("[1, 2]", '"text"', "12", "null"):
            with self.assertRaises(api.LeapmotorApiError, msg=body):
                self.client._parse_api_body(200, body, "software info")

    def test_unread_count_survives_a_failed_message_list(self):
        self.cloud.fail[MESSAGES] = (500, "Service unavailable")
        result = self.client._fetch_account_notifications()
        self.assertEqual(result["unread_count"], 1)
        self.assertEqual(result["messages"], [])
        self.assertIsNone(result["last_message_title"])
        self.cloud.fail[UNREAD] = (500, "Service unavailable")
        self.assertIsNone(self.client._fetch_account_notifications()["unread_count"])

    def test_shared_cars_never_ask_for_the_software_version(self):
        shared = api.Vehicle(VIN, "synthetic-car", "T03", "Owner", True)
        self.client.get_vehicle_list = Mock(return_value=[shared])
        car = self.poll()["vehicles"][VIN]
        self.assertEqual(self.cloud.count(SOFTWARE), 0)
        self.assertEqual(car["software"]["reason"], "shared_account")
        self.assertTrue(car["permissions"]["shared"])

    def test_pending_invitation_is_public_in_data_and_private_on_the_client(self):
        self.cloud.answers[INVITES] = [
            {"shareUserid": "owner-77", "carCode": "INVITED-VIN-777777", "carType": "B10",
             "nickName": "Owner", "email": "owner" + chr(64) + "example.invalid"},
        ]
        data = self.poll()
        self.assertEqual(data["share_invitations"],
                         [{"car_type": "B10", "car_name": None, "owner": "Owner",
                           "vin_tail": "777777", "shared_at": None, "expires_at": None}])
        encoded = json.dumps(data, default=str)
        self.assertNotIn("INVITED-VIN-777777", encoded)
        self.assertNotIn("owner-77", encoded)
        self.assertNotIn("example.invalid", encoded)
        self.assertEqual(self.client.share_invitations[0]["_vin"], "INVITED-VIN-777777")


class DailyHistoryTests(unittest.TestCase):
    def setUp(self):
        self.cloud = FakeCloud()
        self.client, directory = make_client(self.cloud)
        self.addCleanup(directory.cleanup)
        self.addCleanup(self.client.close)
        self.cloud.answers[VEHICLES] = {"bindcars": [{"vin": VIN, "carType": "T03"}]}

    def test_rows_use_the_model_unit_rules(self):
        # 23 September 2026 in the client's history timezone; the T03 reports Wh.
        self.cloud.answers[DAILY] = {"detail": [
            {"xDay": 1_790_146_800_000, "day": "x", "accumulatedMileage": 13,
             "accumulatedEnergyConsume": 1250, "currentMileage": 5000},
        ]}
        rows = self.client.fetch_daily_history(VIN, begin_ms=1, end_ms=2)
        self.assertEqual(rows, [{"date": "2026-09-23", "km": 13.0, "kwh": 1.25,
                                 "odometer_km": 5000.0}])

    def test_never_raises(self):
        self.cloud.fail[DAILY] = (500, "Service unavailable")
        self.assertIsNone(self.client.fetch_daily_history(VIN, begin_ms=1, end_ms=2))
        self.cloud.fail.clear()
        self.cloud.answers[DAILY] = "nonsense"
        self.assertIsNone(self.client.fetch_daily_history(VIN, begin_ms=1, end_ms=2))
        self.cloud.answers[DAILY] = {"detail": "nonsense"}
        self.assertEqual(self.client.fetch_daily_history(VIN, begin_ms=1, end_ms=2), [])
        self.assertIsNone(self.client.fetch_daily_history("UNKNOWN", begin_ms=1, end_ms=2))
        self.cloud.fail[VEHICLES] = (401, "Token is invalid")
        self.assertIsNone(self.client.fetch_daily_history(VIN, begin_ms=1, end_ms=2))
        self.client.token = None
        calls = len(self.cloud.calls)
        self.assertIsNone(self.client.fetch_daily_history(VIN, begin_ms=1, end_ms=2))
        self.assertEqual(len(self.cloud.calls), calls, "no request without a session")


if __name__ == "__main__":
    unittest.main()
