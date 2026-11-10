"""Tests for the normalisers of the extra cloud data (all data synthetic)."""

from __future__ import annotations

import importlib.util
from datetime import datetime
from pathlib import Path
import sys
import unittest
from zoneinfo import ZoneInfo

MODULE_PATH = (
    Path(__file__).parents[1] / "custom_components" / "leapmotor" / "cloud_extras.py"
)
SPEC = importlib.util.spec_from_file_location("leapmotor_cloud_extras", MODULE_PATH)
assert SPEC and SPEC.loader
ce = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = ce
SPEC.loader.exec_module(ce)

TZ = ZoneInfo("Europe/Ljubljana")


class SoftwareTests(unittest.TestCase):
    CURRENT = {
        "generalVersion": "1.03.12",
        "time": 1_780_000_000_000,
        "logJsonMultiLang": [
            {"language": "it-IT", "data": [{"title": "Novità", "content": "Testo"}]},
            {"language": "en-US", "data": [{"title": "What's new", "content": "Text"}]},
        ],
    }

    def test_up_to_date_car(self) -> None:
        info = ce.normalize_software_info({"currentVersion": self.CURRENT}, "en")
        self.assertTrue(info["available"])
        self.assertEqual(info["installed_version"], "1.03.12")
        self.assertEqual(info["latest_version"], "1.03.12")
        self.assertFalse(info["update_available"])
        self.assertEqual(info["release_notes_for"], "installed")
        self.assertEqual(info["release_notes"][0]["title"], "What's new")
        self.assertEqual(info["installed_at"], "2026-05-28T20:26:40+00:00")
        self.assertEqual(info["update_packages"], 0)
        self.assertIsNone(info["update_size_mb"])

    def test_pending_update_never_exposes_download_links(self) -> None:
        new = {
            "generalVersion": "1.04.01",
            "state": 1,
            "requestVersionId": 77,
            "logJsonMultiLang": [{"language": "en-US", "data": [{"title": "New", "content": "Faster"}]}],
            "updateItemList": [
                {"fileSize": "1048576", "downloadURL": "https://cdn.invalid/a.encrypt?Signature=secret"},
                {"fileSize": 2_097_152, "downloadURL": "https://cdn.invalid/b.encrypt?Signature=secret"},
            ],
        }
        info = ce.normalize_software_info({"currentVersion": self.CURRENT, "newVersion": new}, "sl")
        self.assertTrue(info["update_available"])
        self.assertEqual(info["latest_version"], "1.04.01")
        self.assertEqual(info["update_packages"], 2)
        self.assertEqual(info["update_size_mb"], 3.0)
        self.assertEqual(info["update_state"], 1)
        self.assertEqual(info["release_notes_for"], "latest")
        self.assertEqual(info["release_notes_language"], "en-US")
        self.assertNotIn("secret", repr(info))
        self.assertNotIn("cdn.invalid", repr(info))
        self.assertEqual(ce.release_notes_markdown(info), "### New\n\nFaster")

    def test_same_version_offered_again_is_not_an_update(self) -> None:
        info = ce.normalize_software_info(
            {"currentVersion": self.CURRENT, "newVersion": {"generalVersion": "1.03.12"}}
        )
        self.assertFalse(info["update_available"])

    def test_release_note_language_follows_the_app(self) -> None:
        notes = {"it-IT": [{"title": "a"}], "en-US": [{"title": "b"}], "de-DE": [{"title": "c"}]}
        self.assertEqual(ce.pick_release_notes(notes, "it-IT")[0], "it-IT")
        self.assertEqual(ce.pick_release_notes(notes, "de")[0], "de-DE")
        self.assertEqual(ce.pick_release_notes(notes, "sl")[0], "en-US")
        self.assertEqual(ce.pick_release_notes({"fr-FR": [{"title": "x"}]}, "sl")[0], "fr-FR")
        self.assertEqual(ce.pick_release_notes({}, "sl"), (None, []))

    def test_garbage_in_gives_an_unavailable_placeholder(self) -> None:
        for raw in (None, [], "x", {"currentVersion": "broken", "newVersion": 3}):
            with self.subTest(raw=raw):
                info = ce.normalize_software_info(raw)
                self.assertFalse(info["available"])
                self.assertFalse(info["update_available"])
                self.assertEqual(info["release_notes"], [])
        placeholder = ce.software_unavailable("shared_account")
        self.assertEqual(set(placeholder), set(ce.normalize_software_info({})))
        self.assertEqual(placeholder["reason"], "shared_account")
        self.assertIsNone(ce.release_notes_markdown(placeholder))


class MessageTests(unittest.TestCase):
    def test_newest_first_without_links(self) -> None:
        raw = {"list": [
            {"id": 1, "title": "Old", "message": "a", "sendTime": 1_780_000_000_000, "readFlag": 1,
             "msgType": 2, "vin": "VIN-A", "url": "https://x.invalid/?token=secret"},
            {"id": 2, "title": "New", "message": "b", "sendTime": 1_780_000_600_000, "readFlag": 0},
            {"id": 3, "title": " ", "message": None},
            "broken",
        ]}
        messages = ce.normalize_messages(raw)
        self.assertEqual([m["id"] for m in messages], ["2", "1"])
        self.assertIs(messages[0]["read"], False)
        self.assertIs(messages[1]["read"], True)
        self.assertEqual(messages[1]["type"], 2)
        self.assertNotIn("secret", repr(messages))
        self.assertEqual(messages[0]["time"], "2026-05-28T20:36:40+00:00")

    def test_long_text_is_cut_and_the_list_is_limited(self) -> None:
        raw = [{"id": i, "title": "t", "message": "x" * 5000, "sendTime": 1_780_000_000 + i}
               for i in range(80)]
        messages = ce.normalize_messages(raw)
        self.assertEqual(len(messages), ce.MAX_MESSAGES)
        self.assertEqual(messages[0]["id"], "79")
        self.assertLessEqual(len(messages[0]["message"]), ce.MAX_MESSAGE_CHARS)

    def test_messages_for_one_car_drop_the_vin(self) -> None:
        messages = ce.normalize_messages([
            {"id": 1, "title": "mine", "sendTime": 3, "vin": "VIN-A"},
            {"id": 2, "title": "other", "sendTime": 2, "vin": "VIN-B"},
            {"id": 3, "title": "account", "sendTime": 1},
        ])
        mine = ce.messages_for_vin(messages, "VIN-A")
        self.assertEqual([m["title"] for m in mine], ["mine", "account"])
        self.assertTrue(all("vin" not in m for m in mine))

    def test_message_key_is_stable(self) -> None:
        self.assertEqual(ce.message_key({"id": "9", "ts": 1}), "id:9")
        self.assertEqual(ce.message_key({"id": None, "ts": 5.0, "title": "x"}), "t:5.0:x")

    def test_garbage_gives_an_empty_inbox(self) -> None:
        for raw in (None, "x", 4, {"list": "broken"}, [None, 3]):
            self.assertEqual(ce.normalize_messages(raw), [])


class ChargeRecordTests(unittest.TestCase):
    def test_sessions_are_normalised_and_deduplicated(self) -> None:
        raw = {"list": [
            {"chargeGunStartTs": 1_780_000_000_000, "chargeGunEndTs": 1_780_007_200_000,
             "chargeType": "1", "chargeInEnergy": "21.6",
             "chargeStartLatitude": "46.05690", "chargeStartLongitude": "14.50580", "zone": "x"},
            {"chargeGunStartTs": 1_780_000_000_000, "chargeGunEndTs": 1_780_007_200_000,
             "chargeType": "1", "chargeInEnergy": "21.6"},
            {"chargeGunStartTs": 1_780_100_000_000, "chargeGunEndTs": 1_780_101_800_000,
             "chargeType": 2, "chargeInEnergy": 30},
            {"chargeGunEndTs": 5},
        ]}
        records = ce.normalize_charge_records(raw)
        self.assertEqual(len(records), 2)
        dc, ac = records
        self.assertEqual(dc["type"], "dc")
        self.assertEqual(dc["duration_min"], 30.0)
        self.assertEqual(dc["avg_power_kw"], 60.0)
        self.assertIsNone(dc["lat"])
        self.assertEqual(ac["type"], "ac")
        self.assertEqual(ac["energy_kwh"], 21.6)
        self.assertEqual(ac["avg_power_kw"], 10.8)
        self.assertEqual((ac["lat"], ac["lon"]), (46.0569, 14.5058))
        self.assertEqual(ac["start"], "2026-05-28T20:26:40+00:00")

    def test_odd_values_do_not_invent_data(self) -> None:
        records = ce.normalize_charge_records([
            {"chargeGunStartTs": 2_000_000_000, "chargeGunEndTs": 1_000_000_000,
             "chargeInEnergy": -4, "chargeType": "9",
             "chargeStartLatitude": 0, "chargeStartLongitude": 14.5},
        ])
        self.assertEqual(len(records), 1)
        record = records[0]
        self.assertIsNone(record["end"])
        self.assertIsNone(record["duration_min"])
        self.assertIsNone(record["energy_kwh"])
        self.assertIsNone(record["type"])
        self.assertIsNone(record["avg_power_kw"])
        self.assertIsNone(record["lat"])
        self.assertIsNone(record["lon"])
        self.assertEqual(ce.normalize_charge_records(None), [])


class DailyRowTests(unittest.TestCase):
    def test_rows_are_reduced_and_sorted(self) -> None:
        rows = ce.daily_rows([
            {"date": "2026-11-09", "mileage_km": 42.04, "energy_kwh": 6.4, "odometer_km": 18000},
            {"date": "2026-11-08", "mileage_km": 0, "energy_kwh": None},
            {"date": "2026-11-09", "mileage_km": 43, "energy_kwh": 6.5},
            {"date": "not-a-date", "mileage_km": 3},
            {"date": "2026-13-40", "mileage_km": 3},
            {"date": "2026-11-07", "mileage_km": -1},
            {"date": "2026-11-06", "mileage_km": None},
            "broken",
        ])
        self.assertEqual([r["date"] for r in rows], ["2026-11-08", "2026-11-09"])
        self.assertEqual(rows[1]["km"], 43.0)
        self.assertEqual(rows[1]["kwh"], 6.5)
        self.assertIsNone(rows[0]["kwh"])
        self.assertEqual(ce.daily_rows(None), [])


class ScheduleTests(unittest.TestCase):
    def test_climate_schedule_entries(self) -> None:
        entries = ce.normalize_schedule({"controls": [
            {"mode": "hot", "temperature": "22", "windlevel": "7", "days": [1, 2, 3, 4, 5],
             "on": "1", "start_time": "2026-01-31 07:10:00", "set_id": "ios_abc"},
            {"mode": "cold", "temperature": "18", "days": "0,6", "on": "0",
             "start_time": "16:45", "set_id": "ios_def"},
            {"start_time": "25:99"},
        ]}, "climate")
        self.assertEqual([e["time"] for e in entries], ["07:10", "16:45", None])
        first = entries[0]
        self.assertEqual(first["mode"], "heat")
        self.assertEqual(first["temperature"], 22)
        self.assertEqual(first["fan_speed"], 7)
        self.assertTrue(first["enabled"])
        self.assertEqual(first["days"], [1, 2, 3, 4, 5])
        self.assertFalse(entries[1]["enabled"])
        self.assertEqual(entries[1]["days"], [0, 6])
        self.assertEqual(ce.normalize_schedule(None, "climate"), [])
        self.assertEqual(ce.normalize_schedule("x", "climate"), [])

    def test_prepare_car_uses_the_enable_flag(self) -> None:
        entries = ce.normalize_schedule([
            {"name": "Work", "enable": True, "start_time": "2026-01-31 06:50:00", "days": [1]},
        ], "prepare_car")
        self.assertTrue(entries[0]["enabled"])
        self.assertEqual(entries[0]["name"], "Work")

    def test_next_run_respects_days_and_enabled(self) -> None:
        entries = ce.normalize_schedule([
            {"on": "1", "start_time": "07:10", "days": [1, 2, 3, 4, 5], "set_id": "a"},  # Mon-Fri
            {"on": "0", "start_time": "05:00", "days": [], "set_id": "off"},
        ], "climate")
        # Monday 9 November 2026, 08:00 local: today's 07:10 has passed.
        now = datetime(2026, 11, 9, 8, 0, tzinfo=TZ)
        self.assertEqual(ce.next_schedule_run(entries, now)["at"], "2026-11-10T07:10:00+01:00")
        # Friday evening: the next weekday run is Monday.
        friday = datetime(2026, 11, 13, 20, 0, tzinfo=TZ)
        self.assertEqual(ce.next_schedule_run(entries, friday)["at"], "2026-11-16T07:10:00+01:00")
        # Before the time on a matching day: today.
        early = datetime(2026, 11, 9, 6, 0, tzinfo=TZ)
        self.assertEqual(ce.next_schedule_run(entries, early)["at"], "2026-11-09T07:10:00+01:00")

    def test_next_run_without_days_and_across_summer_time(self) -> None:
        once = ce.normalize_schedule([{"on": "1", "start_time": "06:30", "set_id": "x"}], "climate")
        # The clocks go forward on 29 March 2026 in Europe.
        now = datetime(2026, 3, 28, 12, 0, tzinfo=TZ)
        self.assertEqual(ce.next_schedule_run(once, now)["at"], "2026-03-29T06:30:00+02:00")
        self.assertIsNone(ce.next_schedule_run([], now))
        # A one-off with a date runs on that date, not at the next such time.
        tz = now.tzinfo
        evening = datetime(2026, 11, 10, 20, 0, tzinfo=tz)
        dated = ce.normalize_schedule(
            [{"on": "1", "start_time": "2026-11-20 07:10:00", "days": [], "set_id": "d"}], "climate")
        self.assertEqual(dated[0]["date"], "2026-11-20")
        self.assertEqual(dated[0]["time"], "07:10")
        self.assertEqual(ce.next_schedule_run(dated, evening)["at"], "2026-11-20T07:10:00+01:00")
        # Once its date has passed it never runs again, even if the cloud still lists it as on.
        past = ce.normalize_schedule(
            [{"on": "1", "start_time": "2026-10-01 07:10:00", "set_id": "p"}], "climate")
        self.assertIsNone(ce.next_schedule_run(past, evening))
        # A weekly entry ignores the date it was created with.
        weekly = ce.normalize_schedule(
            [{"on": "1", "start_time": "2026-10-01 07:10:00", "days": [3], "set_id": "w"}], "climate")
        self.assertEqual(ce.next_schedule_run(weekly, evening)["at"], "2026-11-11T07:10:00+01:00")
        self.assertEqual(ce.next_schedule_run(dated + weekly + past, evening)["id"], "w")
        self.assertIsNone(ce.normalize_schedule([{"start_time": "07:10"}], "climate")[0]["date"])
        self.assertIsNone(ce.normalize_schedule([{"start_time": "2026-13-45 07:10:00"}], "climate")[0]["date"])
        self.assertIsNone(ce.next_schedule_run([{"enabled": False, "time": "06:30"}], now))


class PermissionTests(unittest.TestCase):
    def test_codes_become_names(self) -> None:
        result = ce.decode_permissions({
            "rights": "110,120,170,193,999", "module_rights": "100,200",
            "abilities": ["12", "36", "50", "777"], "is_shared": True,
        })
        self.assertTrue(result["shared"])
        self.assertTrue(result["rights_known"])
        self.assertEqual(result["rights"], ["lock", "find_car", "climate", "start_stop_charging", "right_999"])
        self.assertEqual(result["modules"], ["basic", "vehicle_control"])
        self.assertEqual(result["abilities"], ["ability_777", "sentry_mode", "windows"])

    def test_missing_lists(self) -> None:
        result = ce.decode_permissions({})
        self.assertFalse(result["rights_known"])
        self.assertEqual(result["rights"], [])
        self.assertEqual(result["abilities"], [])
        self.assertFalse(result["shared"])


class ShareInvitationTests(unittest.TestCase):
    def test_personal_details_are_dropped(self) -> None:
        invitations = ce.normalize_share_invitations([
            {"msgid": 1, "shareUserid": 4711, "carCode": "LFZ000000SYNTH1234", "carType": "C10",
             "carAlias": "Family car", "nickName": "Owner", "email": "owner" + chr(64) + "example.invalid",
             "mobileNumber": "+38640000000", "shareTime": 1_780_000_000_000},
            {"carCode": "NO-OWNER"},
            "broken",
        ])
        self.assertEqual(len(invitations), 1)
        invitation = invitations[0]
        self.assertEqual(invitation["vin_tail"], "TH1234")
        self.assertEqual(invitation["_owner_id"], "4711")
        self.assertNotIn("example.invalid", repr(invitation))
        self.assertNotIn("38640000000", repr(invitation))
        public = ce.public_invitation(invitation)
        self.assertNotIn("LFZ000000SYNTH1234", repr(public))
        self.assertNotIn("4711", repr(public))
        self.assertEqual(public["car_name"], "Family car")
        self.assertEqual(ce.normalize_share_invitations(None), [])


class TimeTests(unittest.TestCase):
    def test_epoch_in_seconds_or_milliseconds(self) -> None:
        self.assertEqual(ce.epoch_seconds(1_780_000_000_000), 1_780_000_000.0)
        self.assertEqual(ce.epoch_seconds("1780000000"), 1_780_000_000.0)
        for bad in (None, "", 0, -5, "x", True, float("nan")):
            self.assertIsNone(ce.epoch_seconds(bad))
        self.assertIsNone(ce.iso_utc(None))
        self.assertIsNone(ce.iso_utc(1e30))


if __name__ == "__main__":
    unittest.main()
