"""Offline HA regressions for diagnostics, entity defaults and service boundaries.

Run separately from unit tests: python tools/ha_issue_runtime.py -v
CI runs it against homeassistant 2025.3.0 (minimum) and the latest release;
all vehicle data is synthetic.
"""
import asyncio
from copy import deepcopy
from datetime import datetime, timedelta
import json
from pathlib import Path
import shutil
import sys
import tempfile
import types
import unittest
from zoneinfo import ZoneInfo
from unittest.mock import AsyncMock, Mock, patch

from homeassistant import auth, config_entries, loader
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import area_registry, device_registry, entity_registry, frame
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util

ROOT = Path(__file__).resolve().parents[1]
VIN = "SYNTHETIC-VIN-123456"


class IssueRuntimeTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="leapmotor-issues-")
        self.addCleanup(self.directory.cleanup)
        target = Path(self.directory.name) / "custom_components" / "leapmotor"
        shutil.copytree(ROOT / "custom_components/leapmotor", target,
                        ignore=shutil.ignore_patterns("__pycache__"))
        package = types.ModuleType("custom_components")
        package.__path__ = [str(target.parent)]
        for name in list(sys.modules):
            if name == "custom_components" or name.startswith("custom_components."):
                del sys.modules[name]
        sys.modules["custom_components"] = package
        self.hass = HomeAssistant(self.directory.name)
        self.hass.config.skip_pip = True
        loader.async_setup(self.hass)
        self.hass.config_entries = config_entries.ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        # Newer Home Assistant releases set these helpers up before loading registries.
        for helper in (frame, device_registry):
            if hasattr(helper, "async_setup"):
                helper.async_setup(self.hass)
        await asyncio.gather(area_registry.async_load(self.hass),
                             device_registry.async_load(self.hass),
                             entity_registry.async_load(self.hass))
        self.hass.auth = await auth.auth_manager_from_config(self.hass, [], [])
        await async_setup_component(self.hass, "persistent_notification", {})
        # No cloud/network access is needed by this regression suite.
        self.network = patch("socket.socket.connect", side_effect=AssertionError("Unexpected network access"))
        self.network.start()
        self.addCleanup(self.network.stop)
        from custom_components.leapmotor import api
        self.api = api
        self.client = api.LeapmotorApiClient(username="synthetic", password="synthetic")
        self.addCleanup(self.client.close)
        self.client._remote_control_raw = Mock(return_value={"code": 0})
        self.client._find_vehicle_by_vin = Mock(return_value=api.Vehicle(VIN, None, "T03", "Private Owner", False))
        self.client.get_vehicle_status = Mock()
        self.client.last_api_results = {"remote_control": {"remote_ctl_id": "private-remote-session"}}
        self.client.user_id = "private-user-123456"
        self.client.fetch_data = Mock()
        self.factory = patch("custom_components.leapmotor.LeapmotorApiClient", return_value=self.client)
        self.factory.start()
        self.addCleanup(self.factory.stop)

    async def asyncTearDown(self):
        await self.hass.async_stop(force=True)

    async def load_entry(self, model="T03"):
        vehicle = self.api.Vehicle(VIN, "private-car-123456", model, "Private Owner", False)
        self.client._find_vehicle_by_vin.return_value = vehicle
        result = self.api.normalize_vehicle(vehicle, {"data": {
            "signal": {"1204": 75, "1939": 0, **({"1816": 0} if model == "A10" else {})}, "ptcState": 2,
            "chargesocSetting": 95, "chargeTimeSetting": "00:00"}}, None)
        result["diagnostics"].update(available_energy_kwh=36.13, climate_air_direction=0)
        self.client.fetch_data.return_value = {"vehicles": {VIN: result}}
        entry = config_entries.ConfigEntry(
            domain="leapmotor", title="Private Account Title", version=1, minor_version=1,
            data={"username": "synthetic", "password": "private-password", "device_id": "synthetic",
                  "operation_password": "1234"}, options={}, unique_id="synthetic",
            source="user", discovery_keys=types.MappingProxyType({}), subentries_data=None,
        )
        await self.hass.config_entries.async_add(entry)
        await self.hass.async_block_till_done()
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)
        return entry

    def watch_reloads(self):
        """Count entry reloads and collect Home Assistant's "stops working" reports."""
        import logging

        manager = self.hass.config_entries
        original = manager.async_reload
        seen = {"reloads": 0, "reports": []}

        async def counted(entry_id):
            seen["reloads"] += 1
            return await original(entry_id)

        class Collector(logging.Handler):
            def emit(self, record):
                text = record.getMessage()
                if "should use it for scheduling a reload" in text or "will stop working" in text:
                    seen["reports"].append(text)

        handler = Collector()
        logging.getLogger().addHandler(handler)
        self.addCleanup(logging.getLogger().removeHandler, handler)
        # Home Assistant reports each call site once per process; forget earlier reports.
        for name in ("_REPORTED_INTEGRATIONS", "_REPORTED_CUSTOM_INTEGRATIONS"):
            reported = getattr(frame, name, None)
            if hasattr(reported, "clear"):
                reported.clear()
        patcher = patch.object(manager, "async_reload", side_effect=counted)
        patcher.start()
        self.addCleanup(patcher.stop)
        return seen

    def assert_private_values_absent(self, result):
        encoded = json.dumps(result)
        for value in (VIN, "Private Owner", "Private Account Title", "private-remote-session",
                      "private-password", "private-car-123456", "private-user-123456"):
            self.assertNotIn(value, encoded)
        self.assertIn("***123456", encoded)

    async def test_both_diagnostics_exports_redact_nested_values_without_mutation(self):
        entry = await self.load_entry()
        from custom_components.leapmotor.diagnostics import async_get_config_entry_diagnostics
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        nested = {"items": [{"VIN": VIN, "nickname": "Private Owner",
                             "remoteCtlId": "private-remote-session"}]}
        coordinator.data["vehicles"][VIN]["history"]["nested"] = nested
        coordinator.client.last_api_results["nested"] = nested
        before = deepcopy(coordinator.data)
        result = await async_get_config_entry_diagnostics(self.hass, entry)
        self.assert_private_values_absent(result)
        self.assertEqual(result["entry"]["vehicle_subentries"][0]["title"], "**REDACTED**")
        self.assertEqual(result["entry"]["vehicle_subentries"][0]["data"]["vin"], "***123456")
        await self.hass.services.async_call("leapmotor", "export_diagnostics",
                                          {"filename": "issue-regression.json"}, blocking=True)
        exported = json.loads((Path(self.directory.name) / "leapmotor/issue-regression.json").read_text())
        self.assert_private_values_absent(exported)
        self.assertEqual(coordinator.data, before)

    async def test_t03_charge_limit_like_leapconnect_and_no_schedule_switch(self):
        entry = await self.load_entry()
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        registry = entity_registry.async_get(self.hass)
        self.assertIsNone(registry.async_get_entity_id("switch", "leapmotor", f"{VIN}_charging_schedule"))
        limit_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_charge_limit_percent")
        self.assertEqual(self.hass.states.get(limit_id).state, "95")
        number_id = registry.async_get_entity_id("number", "leapmotor", f"{VIN}_charge_limit_setting")
        number = self.hass.states.get(number_id)
        self.assertEqual((number.attributes["min"], number.attributes["max"], number.attributes["step"]), (50, 100, 5))
        self.client.get_charge_schedule = Mock(return_value={"chargeEnable": 1, "starttime": "23:00"})
        expected = ('{"chargeEnable":1,"chargesoc":80,"circulation":0,"cycles":"1,2,3,4,5,6,7",'
                    '"endtime":"08:00","recharge":0,"starttime":"23:00"}')
        await self.hass.services.async_call("leapmotor", "set_charge_limit",
            {"vin": VIN, "charge_limit_percent": 80}, blocking=True)
        kwargs = self.client._remote_control_raw.call_args.kwargs
        self.assertEqual((kwargs["cmd_id"], kwargs["cmd_content"]), ("190", expected))
        coordinator._last_remote_results.clear()
        await self.hass.services.async_call("number", "set_value",
            {"entity_id": number_id, "value": 80}, blocking=True)
        self.assertEqual(self.client._remote_control_raw.call_args.kwargs["cmd_content"], expected)
        self.client.get_vehicle_status.assert_not_called()
        with self.assertRaisesRegex(HomeAssistantError, "50-100"):
            await self.hass.services.async_call("leapmotor", "set_charge_limit",
                {"vin": VIN, "charge_limit_percent": 40}, blocking=True)
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_other_models_keep_controls(self):
        await self.load_entry("B10")
        registry = entity_registry.async_get(self.hass)
        self.assertIsNotNone(registry.async_get_entity_id("number", "leapmotor", f"{VIN}_charge_limit_setting"))
        self.assertIsNotNone(registry.async_get_entity_id("switch", "leapmotor", f"{VIN}_charging_schedule"))

    async def test_a10_heating_state_reaches_switch_and_binary_sensor(self):
        entry = await self.load_entry("A10")
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        registry = entity_registry.async_get(self.hass)
        vehicle = self.api.Vehicle(VIN, None, "A10", None, False)
        for value, expected in ((3, "on"), (0, "off"), (1, "on"), (2, "on"), (255, "unknown")):
            data = self.api.normalize_vehicle(vehicle, {"data": {"signal": {"1816": value}}}, None)
            self.client.fetch_data.return_value = {"vehicles": {VIN: data}}
            await coordinator.async_refresh()
            await self.hass.async_block_till_done()
            for domain, key in (("switch", "steering_wheel_heat"), ("binary_sensor", "steering_wheel_heating")):
                entity_id = registry.async_get_entity_id(domain, "leapmotor", f"{VIN}_{key}")
                self.assertIsNotNone(entity_id)
                self.assertEqual(self.hass.states.get(entity_id).state, expected)

    async def test_b10_unreliable_energy_reaches_entities_with_raw_detail(self):
        entry = await self.load_entry("B10")
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        registry = entity_registry.async_get(self.hass)
        vehicle = self.api.Vehicle(VIN, None, "B10", None, False)
        data = self.api.normalize_vehicle(vehicle, {"data": {}}, None, mileage_json={"data": {
            "totalAccumulatedMileage": 17,
            "detail": [{"accumulatedMileage": 17, "accumulatedEnergyConsume": 0}]}})
        self.client.fetch_data.return_value = {"vehicles": {VIN: data}}
        await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        for key, expected in (("last_7_days_energy_kwh", "unknown"), ("last_7_days_mileage_km", "17")):
            entity_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_{key}")
            state = self.hass.states.get(entity_id)
            self.assertEqual(state.state, expected)
            self.assertEqual(state.attributes["energy_unavailable_reason"], "unreliable_source")
            self.assertTrue(state.attributes["energy_complete"])
            self.assertEqual(state.attributes["energy_scope"], "unconfirmed")
            self.assertEqual(state.attributes["daily_detail"][0]["energy_raw"], 0)

    async def test_t03_wallbox_pause_reaches_evcc_and_cable_entities(self):
        entry = await self.load_entry()
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        registry = entity_registry.async_get(self.hass)
        vehicle = self.api.Vehicle(VIN, None, "T03", None, False)
        for signals, expected in (
            ({"1149": 2, "1178": -8, "1197": 0, "1200": 120}, ("C", "on", "off")),
            ({"1149": 0, "1178": 0, "1197": 1, "1200": 0}, ("B", "on", "unknown")),
            ({"1149": 2, "1178": -8, "1197": 0, "1200": 60}, ("C", "on", "off")),
            ({"1149": 0, "1178": 0, "1197": 0, "1200": 0}, ("A", "off", "off")),
        ):
            data = self.api.normalize_vehicle(vehicle, {"data": {"signal": signals}}, None)
            self.client.fetch_data.return_value = {"vehicles": {VIN: data}}
            await coordinator.async_refresh()
            await self.hass.async_block_till_done()
            for domain, key, state in zip(
                ("sensor", "binary_sensor", "binary_sensor"),
                ("evcc_status", "is_plugged_in", "dc_cable_connected"), expected,
            ):
                entity_id = registry.async_get_entity_id(domain, "leapmotor", f"{VIN}_{key}")
                self.assertEqual(self.hass.states.get(entity_id).state, state)

    async def test_rejected_credentials_start_reauth_and_preserve_entry_on_success(self):
        entry = await self.load_entry()
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        before_data, before_options = dict(entry.data), dict(entry.options)
        before_subentries = dict(entry.subentries)
        self.client.fetch_data.side_effect = self.api.LeapmotorAuthError("Leapmotor login failed: Incorrect account or password")
        await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        self.assertFalse(coordinator.last_update_success)
        self.assertEqual(coordinator.integration_status["last_update_error_code"], "invalid_auth")
        flows = self.hass.config_entries.flow.async_progress()
        self.assertEqual(len(flows), 1)
        flow_id = flows[0]["flow_id"]
        self.assertEqual(flows[0]["step_id"], "reauth_confirm")
        with patch("custom_components.leapmotor.config_flow.validate_input",
                   side_effect=self.api.LeapmotorAuthError("incorrect password")):
            failed = await self.hass.config_entries.flow.async_configure(flow_id, {"password": "bad"})
        self.assertEqual(failed["errors"], {"base": "invalid_auth"})
        self.assertEqual(dict(entry.data), before_data)
        self.client.fetch_data.side_effect = None
        seen = self.watch_reloads()
        with patch("custom_components.leapmotor.config_flow.validate_input", new=AsyncMock(return_value={})) as validate:
            result = await self.hass.config_entries.flow.async_configure(flow_id, {"password": "replacement"})
        self.assertEqual(result["reason"], "reauth_successful")
        await self.hass.async_block_till_done()
        self.assertEqual(dict(entry.data), {**before_data, "password": "replacement"})
        self.assertEqual(dict(entry.options), before_options)
        self.assertEqual(dict(entry.subentries), before_subentries)
        self.assertEqual(validate.call_args.args[1]["username"], before_data["username"])
        self.assertEqual(validate.call_args.args[1]["device_id"], before_data["device_id"])
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)
        # Exactly one reload, and nothing Home Assistant is about to stop accepting.
        self.assertEqual(seen["reloads"], 1)
        self.assertEqual(seen["reports"], [])

    async def test_reauth_with_the_same_password_still_reloads_once(self):
        entry = await self.load_entry()
        seen = self.watch_reloads()
        result = await self.hass.config_entries.flow.async_init(
            "leapmotor", context={"source": "reauth", "entry_id": entry.entry_id}, data=dict(entry.data))
        self.assertEqual(result["step_id"], "reauth_confirm")
        with patch("custom_components.leapmotor.config_flow.validate_input", new=AsyncMock(return_value={})):
            result = await self.hass.config_entries.flow.async_configure(
                result["flow_id"], {"password": "private-password"})
        self.assertEqual(result["reason"], "reauth_successful")
        await self.hass.async_block_till_done()
        self.assertEqual(entry.data["password"], "private-password")
        self.assertEqual(seen["reloads"], 1)
        self.assertEqual(seen["reports"], [])
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)

    async def test_reauth_recovers_an_entry_whose_setup_failed_on_the_password(self):
        # Wrong password at start: setup fails before the update listener exists.
        vehicle = self.api.Vehicle(VIN, "private-car-123456", "T03", "Private Owner", False)
        self.client._find_vehicle_by_vin.return_value = vehicle
        good = {"vehicles": {VIN: self.api.normalize_vehicle(vehicle, {"data": {
            "signal": {"1204": 75, "1939": 0}, "ptcState": 2, "chargesocSetting": 95,
            "chargeTimeSetting": "00:00"}}, None)}}
        self.client.fetch_data.side_effect = self.api.LeapmotorAuthError("Leapmotor login failed: Incorrect account or password")
        entry = config_entries.ConfigEntry(
            domain="leapmotor", title="Private Account Title", version=1, minor_version=1,
            data={"username": "synthetic", "password": "wrong", "device_id": "synthetic",
                  "operation_password": "1234"}, options={}, unique_id="synthetic",
            source="user", discovery_keys=types.MappingProxyType({}), subentries_data=None,
        )
        await self.hass.config_entries.async_add(entry)
        await self.hass.async_block_till_done()
        self.assertEqual(entry.state, config_entries.ConfigEntryState.SETUP_ERROR)
        self.assertEqual(entry.update_listeners, [])
        flows = self.hass.config_entries.flow.async_progress()
        self.assertEqual([flow["step_id"] for flow in flows], ["reauth_confirm"])
        self.client.fetch_data.side_effect = None
        self.client.fetch_data.return_value = good
        seen = self.watch_reloads()
        with patch("custom_components.leapmotor.config_flow.validate_input", new=AsyncMock(return_value={})):
            result = await self.hass.config_entries.flow.async_configure(
                flows[0]["flow_id"], {"password": "replacement"})
        self.assertEqual(result["reason"], "reauth_successful")
        await self.hass.async_block_till_done()
        self.assertEqual(entry.data["password"], "replacement")
        self.assertEqual(seen["reloads"], 1)
        self.assertEqual(seen["reports"], [])
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)

    async def test_certificate_and_transient_failures_do_not_start_password_reauth(self):
        entry = await self.load_entry()
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        for error in (self.api.LeapmotorMissingAppCertError("missing app certificate"),
                      self.api.LeapmotorAccountCertError("account certificate failed"),
                      self.api.LeapmotorApiError("service unavailable")):
            with self.subTest(error=type(error).__name__):
                self.client.fetch_data.side_effect = error
                await coordinator.async_refresh()
                await self.hass.async_block_till_done()
                self.assertFalse(coordinator.last_update_success)
                self.assertEqual(self.hass.config_entries.flow.async_progress(), [])

    async def test_account_reconfigure_updates_password_and_rejects_certificate_failure(self):
        entry = await self.load_entry()
        result = await self.hass.config_entries.flow.async_init(
            "leapmotor", context={"source": "reconfigure", "entry_id": entry.entry_id})
        self.assertEqual(result["step_id"], "reconfigure")
        flow_id = result["flow_id"]
        for error, expected in ((self.api.LeapmotorMissingAppCertError("missing"), "missing_app_cert"),
                                (self.api.LeapmotorAccountCertError("bad certificate"), "account_cert_error"),
                                (self.api.LeapmotorApiError("offline"), "api_refresh_failed")):
            with patch("custom_components.leapmotor.config_flow.validate_input", side_effect=error):
                result = await self.hass.config_entries.flow.async_configure(flow_id, {"password": "replacement"})
            self.assertEqual(result["errors"], {"base": expected})
            self.assertEqual(entry.data["password"], "private-password")
        seen = self.watch_reloads()
        with patch("custom_components.leapmotor.config_flow.validate_input", new=AsyncMock(return_value={})):
            result = await self.hass.config_entries.flow.async_configure(flow_id, {"password": "replacement"})
        self.assertEqual(result["reason"], "reconfigure_successful")
        await self.hass.async_block_till_done()
        self.assertEqual(entry.data["password"], "replacement")
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)
        self.assertEqual(seen["reloads"], 1)
        self.assertEqual(seen["reports"], [])

    async def test_sensor_classes_raw_defaults_and_user_override_survive_reload(self):
        entry = await self.load_entry()
        from homeassistant.components.sensor.const import DEVICE_CLASS_STATE_CLASSES, SensorDeviceClass, SensorStateClass
        self.assertIn(SensorStateClass.MEASUREMENT, DEVICE_CLASS_STATE_CLASSES[SensorDeviceClass.ENERGY_STORAGE])
        registry = entity_registry.async_get(self.hass)
        energy_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_available_energy_kwh")
        energy = self.hass.states.get(energy_id)
        self.assertEqual(energy.state, "36.13")
        self.assertEqual(energy.attributes["device_class"], "energy_storage")
        self.assertEqual(energy.attributes["state_class"], "measurement")
        for suffix in ("ptc_state", "climate_air_direction"):
            entity_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_{suffix}")
            self.assertEqual(registry.async_get(entity_id).disabled_by, entity_registry.RegistryEntryDisabler.INTEGRATION)
            self.assertIsNone(self.hass.states.get(entity_id))
        ptc_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_ptc_state")
        registry.async_update_entity(ptc_id, disabled_by=None)
        await self.hass.config_entries.async_reload(entry.entry_id)
        await self.hass.async_block_till_done()
        self.assertIsNone(registry.async_get(ptc_id).disabled_by)
        self.assertEqual(self.hass.states.get(ptc_id).state, "2")
        mode_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_ac_operation_mode")
        mode = self.hass.states.get(mode_id)
        self.assertEqual(mode.state, "auto")
        self.assertEqual(mode.attributes["device_class"], "enum")
        self.assertEqual(mode.attributes["options"], ["auto", "manual"])

    async def test_trip_log_and_cost_sensors_follow_polls(self):
        import copy
        import time

        self.hass.config.currency = "EUR"
        entry = await self.load_entry(model="C10")
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        base = self.client.fetch_data.return_value
        start = time.time() - 12 * 60

        def poll(minute, *, odo, speed, parked, kwh):
            data = copy.deepcopy(base)
            vehicle = data["vehicles"][VIN]
            vehicle["status"].update(
                odometer_km=odo, speed_kmh=speed, is_parked=parked,
                vehicle_state="parked" if parked else "driving",
                last_vehicle_timestamp=int((start + minute * 60) * 1000),
            )
            vehicle["diagnostics"]["available_energy_kwh"] = kwh
            return data

        polls = [poll(0, odo=1000, speed=0, parked=True, kwh=40.0)]
        polls += [poll(i, odo=1000 + i, speed=50, parked=False, kwh=40.0 - 0.15 * i) for i in range(1, 11)]
        polls.append(poll(11, odo=1010, speed=0, parked=True, kwh=38.5))
        for data in polls:
            self.client.fetch_data.return_value = data
            await coordinator.async_refresh()
            await self.hass.async_block_till_done()

        registry = entity_registry.async_get(self.hass)

        def state(suffix):
            entity_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_{suffix}")
            self.assertIsNotNone(entity_id, suffix)
            return self.hass.states.get(entity_id)

        distance = state("last_trip_distance_km")
        self.assertEqual(float(distance.state), 10.0)
        self.assertEqual(distance.attributes["energy_kwh"], 1.5)
        self.assertEqual(float(state("last_trip_consumption_kwh_100km").state), 15.0)
        self.assertEqual(float(state("trips_today_distance_km").state), 10.0)
        self.assertEqual(state("charging_cost_month").attributes["unit_of_measurement"], "EUR")
        self.assertEqual(state("charging_cost_month").attributes["state_class"], "total")
        self.assertIn(state("battery_health_percent").state, ("unknown",))

        # The trip survives a reload through the stored analytics.
        await self.hass.config_entries.async_reload(entry.entry_id)
        await self.hass.async_block_till_done()
        self.assertEqual(float(state("last_trip_distance_km").state), 10.0)

    async def test_stage_two_three_entities_services_and_payloads(self):
        import copy

        from custom_components.leapmotor.leap_api.remote import REMOTE_ACTION_SPECS

        # Payloads ported from leapmotor-api must stay byte-identical.
        expected = {
            "sentry_mode_on": ("220", '{"value":"1"}'), "sentry_mode_off": ("220", '{"value":"0"}'),
            "charging_start": ("193", '{"value":"start"}'), "charging_stop": ("193", '{"value":"stop"}'),
            "healthy_charging_on": ("480", '{"value":"1"}'), "healthy_charging_off": ("480", '{"value":"0"}'),
            "sunroof_open": ("300", '{"value":"open"}'), "sunroof_close": ("300", '{"value":"close"}'),
        }
        for action, (cmd_id, content) in expected.items():
            self.assertEqual((REMOTE_ACTION_SPECS[action].cmd_id, REMOTE_ACTION_SPECS[action].cmd_content), (cmd_id, content))

        self.hass.config.currency = "EUR"
        entry = await self.load_entry(model="C10")
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        data = copy.deepcopy(self.client.fetch_data.return_value)
        vehicle = data["vehicles"][VIN]
        vehicle["status"]["odometer_km"] = 18450
        vehicle["diagnostics"].update(sentinel_mode=False, healthy_charging_enabled=True, skylight_open=False)
        self.client.fetch_data.return_value = data
        await self.hass.config_entries.async_reload(entry.entry_id)
        await self.hass.async_block_till_done()
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        registry = entity_registry.async_get(self.hass)

        def entity(domain, suffix):
            entity_id = registry.async_get_entity_id(domain, "leapmotor", f"{VIN}_{suffix}")
            self.assertIsNotNone(entity_id, f"{domain}.{suffix}")
            return entity_id

        nxt = self.hass.states.get(entity("sensor", "next_maintenance"))
        self.assertEqual(nxt.attributes["schedule"], "C10")
        self.assertGreater(len(nxt.attributes["items"]), 10)
        self.assertIn(self.hass.states.get(entity("binary_sensor", "maintenance_due")).state, ("on", "off"))
        self.assertEqual(self.hass.states.get(entity("binary_sensor", "attention_needed")).state, "off")
        self.assertEqual(self.hass.states.get(entity("sensor", "driving_cost_month")).attributes["unit_of_measurement"], "EUR")
        entity("sensor", "energy_to_charge_limit_kwh")
        entity("binary_sensor", "tire_pressure_warning")
        entity("button", "sunroof_open")

        # Logging a service moves its due point to now + interval.
        await self.hass.services.async_call(
            "leapmotor", "log_maintenance", {"service_type": "tire_rotation", "vin": VIN}, blocking=True
        )
        await self.hass.async_block_till_done()
        items = {i["service_type"]: i for i in self.hass.states.get(entity("sensor", "next_maintenance")).attributes["items"]}
        self.assertEqual(items["tire_rotation"]["baseline"], "logged")
        self.assertEqual(items["tire_rotation"]["remaining_km"], 10000)
        await self.hass.services.async_call(
            "leapmotor", "reset_maintenance", {"service_type": "tire_rotation", "vin": VIN}, blocking=True
        )
        await self.hass.async_block_till_done()
        items = {i["service_type"]: i for i in self.hass.states.get(entity("sensor", "next_maintenance")).attributes["items"]}
        self.assertEqual(items["tire_rotation"]["baseline"], "assumed")

        # Sentry switch and start-charging service send the ported payloads.
        # Only login and certificate files are stubbed; action lookup and
        # payload building run for real.
        self.client.token = "synthetic-token"
        self.client._ensure_account_cert_files = Mock()
        self.client._remote_control_raw.reset_mock()
        await self.hass.services.async_call(
            "switch", "turn_on", {"entity_id": entity("switch", "sentry_mode")}, blocking=True
        )
        kwargs = self.client._remote_control_raw.call_args.kwargs
        self.assertEqual((kwargs["cmd_id"], kwargs["cmd_content"]), ("220", '{"value":"1"}'))
        coordinator._last_remote_results.clear()  # skip the remote-action cooldown
        self.client._remote_control_raw.reset_mock()
        await self.hass.services.async_call("leapmotor", "charging_start", {"vin": VIN}, blocking=True)
        kwargs = self.client._remote_control_raw.call_args.kwargs
        self.assertEqual((kwargs["cmd_id"], kwargs["cmd_content"]), ("193", '{"value":"start"}'))

        # Cabin preheat: preset 22 °C, fan 7, recirculation only (cmd 170).
        coordinator._last_remote_results.clear()
        self.client._remote_control_raw.reset_mock()
        preheat = entity("button", "preheat_cabin")
        self.assertEqual(self.hass.states.get(preheat).attributes["fan_speed"], 7)
        await self.hass.services.async_call("button", "press", {"entity_id": preheat}, blocking=True)
        kwargs = self.client._remote_control_raw.call_args.kwargs
        self.assertEqual(kwargs["cmd_id"], "170")
        self.assertEqual(json.loads(kwargs["cmd_content"]), {
            "circle": "in", "mode": "hot", "operate": "manual", "position": "all",
            "temperature": "22", "windlevel": "7", "wshld": "1",
        })
        coordinator._last_remote_results.clear()
        await self.hass.services.async_call(
            "leapmotor", "preheat_cabin", {"vin": VIN, "temperature": 25}, blocking=True
        )
        self.assertEqual(json.loads(self.client._remote_control_raw.call_args.kwargs["cmd_content"])["temperature"], "25")

        # Pre-cool: A/C, lowest temperature, full fan (cmd 170, mode cold).
        coordinator._last_remote_results.clear()
        await self.hass.services.async_call(
            "button", "press", {"entity_id": entity("button", "precool_cabin")}, blocking=True
        )
        body = json.loads(self.client._remote_control_raw.call_args.kwargs["cmd_content"])
        self.assertEqual((body["mode"], body["temperature"], body["windlevel"], body["circle"]), ("cold", "18", "7", "in"))

        # Auto pre-condition follows the outside temperature.
        for outside, mode in ((28.0, "cold"), (5.0, "hot")):
            coordinator.data["vehicles"][VIN]["diagnostics"]["outdoor_temp_c"] = outside
            coordinator._last_remote_results.clear()
            await self.hass.services.async_call(
                "button", "press", {"entity_id": entity("button", "precondition_cabin")}, blocking=True
            )
            body = json.loads(self.client._remote_control_raw.call_args.kwargs["cmd_content"])
            self.assertEqual(body["mode"], mode, outside)

        # New vehicles and the setup form default to the factory PIN 0000.
        from custom_components.leapmotor import config_flow
        def default_of(schema, key):
            return next(k.default() for k in schema.schema if str(k) == key)
        self.assertEqual(default_of(config_flow._vehicle_settings_schema({}), "operation_password"), "0000")
        self.assertEqual(default_of(config_flow._vehicle_settings_schema({"operation_password": ""}), "operation_password"), "")
        self.assertEqual(default_of(config_flow.STEP_USER_DATA_SCHEMA, "operation_password"), "0000")

    async def test_preheat_recovers_expired_session_without_sending_twice(self):
        """Reported on a T03: 'remote control result failed: Token is invalid'."""
        import base64

        from homeassistant.helpers import translation

        entry = await self.load_entry()
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        preheat = entity_registry.async_get(self.hass).async_get_entity_id(
            "button", "leapmotor", f"{VIN}_preheat_cabin"
        )

        def token(serial):
            payload = base64.urlsafe_b64encode(
                json.dumps({"user_name": f"synthetic,user,device-{serial},x"}).encode()
            ).decode().rstrip("=")
            return f"header.{payload}.{'s' * 64}{serial}"

        cloud = {"token": token(1), "refreshes": 0, "reject": {}, "calls": []}

        def post(*, path, headers, data, cert):
            endpoint = path.rsplit("/", 1)[-1]
            cloud["calls"].append(endpoint)
            if endpoint == "refresh":
                cloud["refreshes"] += 1
                cloud["token"] = token(1 + cloud["refreshes"])
                body = {"code": 0, "data": {"token": cloud["token"]}}
            elif endpoint == "verify" and cloud["reject"].get("network"):
                raise self.api.LeapmotorApiError("curl: (28) Connection timed out")
            elif cloud["reject"].get(endpoint) or headers.get("token") != cloud["token"]:
                cloud["reject"][endpoint] = max(0, cloud["reject"].get(endpoint, 0) - 1)
                body = {"code": 401, "message": "Token is invalid"}
            elif endpoint == "ctl":
                body = {"code": 0, "data": {"remoteCtlId": "synthetic-ctl", "queryInterval": 250}}
            else:
                body = {"code": 0, "data": 1}
            return {"status_code": 200, "body": json.dumps(body)}

        cert = Path(self.directory.name) / "synthetic-account.pem"
        cert.write_text("synthetic")
        client = self.client
        del client._remote_control_raw  # run the real command flow
        client.transport = Mock(post=Mock(side_effect=post))
        client._clear_account_cert_files = Mock()
        client.user_id, client.token, client.refresh_token = "synthetic-user", cloud["token"], "synthetic-refresh"
        client.sign_ikm = client.sign_salt = client.sign_info = "synthetic"
        client.account_cert_file = client.account_key_file = str(cert)

        async def press():
            await self.hass.services.async_call("button", "press", {"entity_id": preheat}, blocking=True)

        # The token expires between the accepted command and the result query.
        coordinator._last_remote_results.clear()
        cloud["reject"]["query"] = 1
        await press()
        self.assertEqual(cloud["calls"].count("ctl"), 1)
        self.assertEqual(cloud["refreshes"], 1)
        self.assertTrue(coordinator.data["vehicles"][VIN]["remote_control"]["success"])

        # Rejected again after renewing: reported as sent but unconfirmed, no resend,
        # and the cooldown holds back a second press.
        coordinator._last_remote_results.clear()
        cloud["reject"]["query"] = 2
        with self.assertRaises(HomeAssistantError) as caught:
            await press()
        self.assertEqual(caught.exception.translation_key, "remote_unconfirmed")
        self.assertEqual(caught.exception.translation_placeholders["error"],
                         "Leapmotor remote control result failed: Token is invalid")
        self.assertIn("did not confirm", coordinator.data["vehicles"][VIN]["remote_control"]["error"])
        self.assertEqual(cloud["calls"].count("ctl"), 2)
        with self.assertRaises(HomeAssistantError) as caught:
            await press()
        self.assertEqual(caught.exception.translation_key, "remote_cooldown")
        self.assertEqual(cloud["calls"].count("ctl"), 2)

        # A failure before anything was sent does not start the cooldown.
        coordinator._last_remote_results.clear()
        cloud["reject"]["network"] = True
        with self.assertRaises(HomeAssistantError):
            await press()
        self.assertEqual(coordinator.remote_action_cooldown_remaining(VIN), 0)
        cloud["reject"]["network"] = False
        await press()
        self.assertEqual(cloud["calls"].count("ctl"), 3)

        # The new messages exist in Slovenian.
        strings = await translation.async_get_translations(self.hass, "sl", "exceptions", ["leapmotor"])
        for key in ("remote_unconfirmed", "remote_cooldown", "session_rejected"):
            self.assertIn(f"component.leapmotor.exceptions.{key}.message", strings)
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_speeding_sensor_and_faster_polling_while_driving(self):
        from datetime import timedelta

        entry = await self.load_entry()
        registry = entity_registry.async_get(self.hass)
        speeding = registry.async_get_entity_id("binary_sensor", "leapmotor", f"{VIN}_speeding")
        self.assertEqual(self.hass.states.get(speeding).state, "off")

        def driving(speed, *, limit_on=True):
            data = deepcopy(self.client.fetch_data.return_value)
            vehicle = data["vehicles"][VIN]
            vehicle["status"].update(speed_kmh=speed, is_driving=speed > 0, is_parked=speed == 0,
                                     vehicle_state="driving" if speed else "parked")
            vehicle["diagnostics"].update(speed_limit_kmh=120, speed_limit_enabled=limit_on)
            self.client.fetch_data.return_value = data

        async def poll():
            coordinator = self.hass.data["leapmotor"][entry.entry_id]
            await coordinator.async_refresh()
            await self.hass.async_block_till_done()
            return coordinator

        # The car's own limit applies when it is switched on; polling speeds up.
        driving(128)
        coordinator = await poll()
        state = self.hass.states.get(speeding)
        self.assertEqual(state.state, "on")
        self.assertEqual((state.attributes["threshold_kmh"], state.attributes["threshold_source"]), (120, "vehicle"))
        self.assertEqual((coordinator.update_interval, coordinator._polling_mode), (timedelta(minutes=1), "driving"))

        # A speed alert in the vehicle settings wins over the car's limit.
        subentry = next(iter(entry.subentries.values()))
        self.hass.config_entries.async_update_subentry(entry, subentry, data={**subentry.data, "speed_alert_kmh": 130})
        await self.hass.async_block_till_done()
        coordinator = await poll()
        state = self.hass.states.get(speeding)
        self.assertEqual((state.state, state.attributes["threshold_kmh"], state.attributes["threshold_source"]), ("off", 130, "setting"))

        # Parked again: back to the normal interval.
        driving(0)
        coordinator = await poll()
        self.assertEqual((coordinator.update_interval, coordinator._polling_mode), (timedelta(minutes=5), "normal"))

        # The options and vehicle settings offer the new fields.
        result = await self.hass.config_entries.options.async_init(entry.entry_id)
        self.assertIn("driving_scan_interval", [str(key) for key in result["data_schema"].schema])
        from custom_components.leapmotor import config_flow
        self.assertIn("speed_alert_kmh", [str(key) for key in config_flow._vehicle_settings_schema({}).schema])
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_sidebar_panel_follows_option(self):
        from homeassistant.components import frontend, panel_custom

        from custom_components.leapmotor import card

        self.hass.http = Mock(async_register_static_paths=AsyncMock())
        self.hass.config.components.add("frontend")
        with patch.object(frontend, "add_extra_js_url") as add_js, \
                patch.object(panel_custom, "async_register_panel", new=AsyncMock()) as register, \
                patch.object(frontend, "async_remove_panel") as remove:
            await card.async_setup_frontend(self.hass, show_panel=True)
            add_js.assert_called_once()
            kwargs = register.call_args.kwargs
            self.assertEqual(kwargs["frontend_url_path"], "leapmotor")
            self.assertEqual(kwargs["webcomponent_name"], "leapmotor-panel")
            self.assertEqual(kwargs["module_url"], add_js.call_args.args[1])
            self.assertFalse(kwargs["require_admin"])
            await card.async_setup_frontend(self.hass, show_panel=True)  # no duplicate
            self.assertEqual(register.call_count, 1)
            await card.async_setup_frontend(self.hass, show_panel=False)
            remove.assert_called_once_with(self.hass, "leapmotor")
            await card.async_setup_frontend(self.hass, show_panel=True)
            self.assertEqual(register.call_count, 2)
            await card.async_remove_panel(self.hass)
            self.assertEqual(remove.call_count, 2)
            self.hass.http.async_register_static_paths.assert_awaited_once()

    # ------------------------------------------------------------------
    # Insights and the extra cloud data
    # ------------------------------------------------------------------

    def extras(self, *, update=True):
        """Synthetic software, inbox, charging history, schedules and permissions."""
        from custom_components.leapmotor import cloud_extras as ce

        software = ce.normalize_software_info({
            "currentVersion": {"generalVersion": "1.03.12", "time": 1_780_000_000_000,
                               "logJsonMultiLang": [{"language": "en-US", "data": [
                                   {"title": "Installed", "content": "Old notes"}]}]},
            **({"newVersion": {"generalVersion": "1.04.01", "state": 1,
                               "updateItemList": [{"fileSize": 2_097_152,
                                                   "downloadURL": "https://cdn.invalid/x?Signature=private-link"}],
                               "logJsonMultiLang": [{"language": "en-US", "data": [
                                   {"title": "What is new", "content": "Faster charging screen"}]}]}}
               if update else {}),
        }, "en")
        return {
            "software": software,
            "notifications": {"unread_count": 1, "last_message_title": "Charging complete",
                              "last_message_time": 1_780_000_000_000},
            "inbox": {"unread_count": 1, "messages": ce.messages_for_vin(ce.normalize_messages([
                {"id": 7, "title": "Charging complete", "message": "Private message text",
                 "sendTime": 1_780_000_000_000, "readFlag": 0, "msgType": 3, "vin": VIN},
            ]), VIN)},
            "cloud_charging": {"window_days": 60, "sessions": ce.normalize_charge_records([
                {"chargeGunStartTs": 1_780_000_000_000, "chargeGunEndTs": 1_780_007_200_000,
                 "chargeType": "1", "chargeInEnergy": "21.6",
                 "chargeStartLatitude": "32.87336", "chargeStartLongitude": "-117.22743"},
                {"chargeGunStartTs": 1_780_100_000_000, "chargeGunEndTs": 1_780_101_800_000,
                 "chargeType": "2", "chargeInEnergy": 30,
                 "chargeStartLatitude": "33.5", "chargeStartLongitude": "-117.9"},
            ])},
            "schedules": {"climate": ce.normalize_schedule([
                {"on": "1", "start_time": "2026-01-31 07:10:00", "days": [0, 1, 2, 3, 4, 5, 6],
                 "set_id": "ios_a", "mode": "hot", "temperature": "22", "windlevel": "7"},
            ], "climate"), "battery_heating": None, "prepare_car": []},
            "permissions": ce.decode_permissions({"rights": "110,170,193", "module_rights": "100,200",
                                                  "abilities": ["50"], "is_shared": False}),
        }

    async def load_entry_with_extras(self, model="C10", *, update=True, options=None):
        vehicle = self.api.Vehicle(VIN, "private-car-123456", model, "Private Owner", False)
        self.client._find_vehicle_by_vin.return_value = vehicle
        result = self.api.normalize_vehicle(vehicle, {"data": {
            "signal": {"1204": 70, "1318": 18450, "1319": 0, "3260": 300, "sts": 0},
            "dumpEnergy": 40000, "outdoorTemp": 8, "chargesocSetting": 90}}, None)
        result["status"].update(is_driving=False, is_parked=True, vehicle_state="parked")
        result["history"]["average_consumption_6w_kwh_100km"] = 15.8
        result.update(self.extras(update=update))
        self.client.fetch_data.return_value = {"vehicles": {VIN: result}, "share_invitations": []}
        entry = config_entries.ConfigEntry(
            domain="leapmotor", title="Private Account Title", version=1, minor_version=1,
            data={"username": "synthetic", "password": "private-password", "device_id": "synthetic",
                  "operation_password": "1234"}, options=options or {}, unique_id="synthetic",
            source="user", discovery_keys=types.MappingProxyType({}), subentries_data=None,
        )
        await self.hass.config_entries.async_add(entry)
        await self.hass.async_block_till_done()
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)
        return entry

    def state_of(self, domain, key):
        registry = entity_registry.async_get(self.hass)
        entity_id = registry.async_get_entity_id(domain, "leapmotor", f"{VIN}_{key}")
        self.assertIsNotNone(entity_id, f"{domain} {key} was not created")
        return self.hass.states.get(entity_id)

    async def test_cloud_extras_reach_entities(self):
        # Home at the synthetic charging position, so the first session is "home".
        self.hass.config.latitude, self.hass.config.longitude = 32.87336, -117.22743
        entry = await self.load_entry_with_extras(options={"price_home_kwh": 0.2, "price_public_dc_kwh": 0.6})
        update = self.state_of("update", "vehicle_software")
        self.assertEqual(update.state, "on")
        self.assertEqual((update.attributes["installed_version"], update.attributes["latest_version"]),
                         ("1.03.12", "1.04.01"))
        self.assertEqual(update.attributes["release_summary"], "What is new")
        self.assertEqual(update.attributes["update_size_mb"], 2.0)
        self.assertNotIn("private-link", json.dumps(dict(update.attributes), default=str))
        from homeassistant.helpers import entity_component  # noqa: F401
        entity = self.hass.data["entity_components"]["update"].get_entity(update.entity_id) \
            if "entity_components" in self.hass.data else None
        if entity is not None:
            self.assertEqual(await entity.async_release_notes(), "### What is new\n\nFaster charging screen")

        self.assertEqual(self.state_of("sensor", "software_version").state, "1.03.12")
        inbox = self.state_of("sensor", "unread_message_count")
        self.assertEqual(inbox.state, "1")
        self.assertEqual(inbox.attributes["messages"][0]["title"], "Charging complete")
        self.assertNotIn("vin", inbox.attributes["messages"][0])

        sessions = self.state_of("sensor", "cloud_charging_sessions")
        self.assertEqual(sessions.state, "2")
        dc, ac = sessions.attributes["cloud_sessions"]
        self.assertEqual((ac["tier"], ac["cost"], ac["type"]), ("home", 4.32, "ac"))
        self.assertEqual((dc["tier"], dc["cost"], dc["type"]), ("public_dc", 18.0, "dc"))
        month = sessions.attributes["month"]
        self.assertEqual(set(month), {"sessions", "energy_kwh", "cost", "home_energy_kwh", "public_energy_kwh"})
        # Labelling the same data again (the analysis also runs between polls,
        # e.g. after a service is logged) gives the same result.
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        await coordinator.async_refresh()  # the Home zone exists by now
        await self.hass.async_block_till_done()
        before = deepcopy(coordinator.data["vehicles"][VIN]["cloud_charging"])
        self.assertEqual([item["place"] for item in before["sessions"]], [None, "Home"])
        await self.hass.services.async_call("leapmotor", "log_maintenance",
                                            {"vin": VIN, "service_type": "tire_rotation"}, blocking=True)
        await self.hass.async_block_till_done()
        self.maxDiff = None
        self.assertEqual(coordinator.data["vehicles"][VIN]["cloud_charging"], before)
        await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        again = self.state_of("sensor", "cloud_charging_sessions").attributes["cloud_sessions"]
        self.assertEqual(again[1]["lon"], -117.2274)
        self.assertEqual(again[1]["cost"], 4.32)

        schedule = self.state_of("sensor", "next_scheduled_preconditioning")
        self.assertNotIn(schedule.state, ("unknown", "unavailable"))
        self.assertEqual(schedule.attributes["schedules"]["climate"][0]["time"], "07:10")
        permissions = self.state_of("sensor", "remote_permissions")
        self.assertEqual(permissions.state, "3")
        self.assertEqual(permissions.attributes["rights"], ["lock", "climate", "start_stop_charging"])
        # Values that need history are simply unknown, never an error.
        for key in ("real_range_km", "next_departure", "eco_score", "frequent_routes", "achievements",
                    "distance_this_year", "charging_curve", "battery_capacity_trend"):
            self.assertIsNotNone(self.state_of("sensor", key))
        self.assertEqual(self.state_of("sensor", "real_range_km").state, "253")  # 40 kWh at 15.8 kWh/100 km
        # The yearly total restarts at local midnight on 1 January, with
        # January's own UTC offset (not the offset of the current month).
        year_reset = self.state_of("sensor", "distance_this_year").attributes.get("last_reset")
        self.assertIsNotNone(year_reset)
        local_zone = ZoneInfo(self.hass.config.time_zone)
        self.assertEqual(
            datetime.fromisoformat(year_reset),
            datetime(dt_util.now().year, 1, 1, tzinfo=local_zone),
        )
        # In a zone with summer time, a reading taken in July still gives
        # midnight in winter time.
        from custom_components.leapmotor import sensor as sensor_module
        description = next(d for d in sensor_module.SENSOR_DESCRIPTIONS if d.key == "distance_this_year")
        summer = Mock(entity_description=description, vehicle_data={
            "analytics": {"period": {"month_start": "2026-07-01T00:00:00+02:00"}}})
        ljubljana = ZoneInfo("Europe/Ljubljana")
        with patch.object(dt_util, "DEFAULT_TIME_ZONE", ljubljana):
            reset = sensor_module.LeapmotorSensor.last_reset.fget(summer)
        self.assertEqual(reset.isoformat(), "2026-01-01T00:00:00+01:00")
        self.assertEqual(self.state_of("binary_sensor", "charge_recommended").state, "off")
        self.assertEqual(self.state_of("binary_sensor", "slow_charging").state, "off")

        # Diagnostics never carry message text, positions or download links.
        from custom_components.leapmotor.diagnostics import async_get_config_entry_diagnostics
        encoded = json.dumps(await async_get_config_entry_diagnostics(self.hass, entry), default=str)
        for private in ("Private message text", "32.87336", "117.22743", "private-link"):
            self.assertNotIn(private, encoded)
        self.assertEqual(json.loads(encoded)["vehicles"]["***123456"]["extras"]["software"]["latest_version"],
                         "1.04.01")
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_vehicle_picture_is_served_from_the_saved_copy_at_once(self):
        import io
        import threading
        import zipfile

        def package(image: bytes) -> bytes:
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w") as archive:
                archive.writestr("android/xxhdpi/carpic_for_tripsum.png", image)
            return buffer.getvalue()

        original = self.api.normalize_vehicle

        def with_picture(*args, **kwargs):
            result = original(*args, **kwargs)
            result["media"] = {**(result.get("media") or {}), "car_picture_key": "private-picture-key",
                               "car_picture_key_present": True}
            return result

        with patch.object(self.api, "normalize_vehicle", side_effect=with_picture):
            await self.load_entry()
        registry = entity_registry.async_get(self.hass)
        entity_id = registry.async_get_entity_id("image", "leapmotor", f"{VIN}_vehicle_picture_pkg")
        self.assertIsNotNone(entity_id)
        state = self.hass.states.get(entity_id)
        # The dashboard can tell that the picture is unchanged, without the key itself.
        self.assertRegex(state.attributes["picture_id"], r"^[0-9a-f]{12}$")
        self.assertNotIn("private-picture-key", json.dumps(dict(state.attributes), default=str))
        entity = self.hass.data["entity_components"]["image"].get_entity(entity_id)

        # Nothing saved and the cloud does not answer: no picture, as before.
        self.client.download_car_picture_package = Mock(side_effect=RuntimeError("offline"))
        self.assertIsNone(await entity.async_image())
        entity._download_retry_after = 0.0
        entity._cache_refresh_attempted = False

        # A saved copy is returned without waiting for the download.
        cache_path = entity._cache_path("private-picture-key")
        cache_path.write_bytes(b"saved-picture")
        release = threading.Event()

        def slow_download(picture_key):
            release.wait(10)
            return package(b"new-picture")

        self.client.download_car_picture_package = Mock(side_effect=slow_download)
        before = entity.image_last_updated
        self.assertEqual(await asyncio.wait_for(entity.async_image(), 2), b"saved-picture")
        self.assertFalse(release.is_set())
        # The refresh finishes behind it and a changed picture is announced.
        release.set()
        await self.hass.async_block_till_done(wait_background_tasks=True)
        self.client.download_car_picture_package.assert_called_once_with(picture_key="private-picture-key")
        self.assertEqual(await entity.async_image(), b"new-picture")
        self.assertGreater(entity.image_last_updated, before)
        self.assertEqual(cache_path.read_bytes(), b"new-picture")
        # It is refreshed once, not with every request.
        await entity.async_image()
        await self.hass.async_block_till_done(wait_background_tasks=True)
        self.client.download_car_picture_package.assert_called_once()

        # A failed refresh keeps the saved copy.
        entity._cached_image = None
        entity._cache_refresh_attempted = False
        self.client.download_car_picture_package = Mock(side_effect=RuntimeError("offline"))
        self.assertEqual(await entity.async_image(), b"new-picture")
        await self.hass.async_block_till_done(wait_background_tasks=True)
        self.assertEqual(await entity.async_image(), b"new-picture")
        self.client.download_car_picture_package.assert_called_once()
        self.hass.data["leapmotor"][next(iter(self.hass.data["leapmotor"]))].cancel_scheduled_followup_refreshes()

    async def test_shared_car_gets_no_software_entities(self):
        vehicle = self.api.Vehicle(VIN, "private-car-123456", "T03", "Private Owner", True)
        self.client._find_vehicle_by_vin.return_value = vehicle
        from custom_components.leapmotor import cloud_extras as ce
        result = self.api.normalize_vehicle(vehicle, {"data": {"signal": {"1204": 75}}}, None)
        result["software"] = ce.software_unavailable("shared_account")
        self.client.fetch_data.return_value = {"vehicles": {VIN: result}}
        entry = config_entries.ConfigEntry(
            domain="leapmotor", title="t", version=1, minor_version=1,
            data={"username": "synthetic", "password": "x", "device_id": "synthetic"}, options={},
            unique_id="synthetic", source="user", discovery_keys=types.MappingProxyType({}),
            subentries_data=None,
        )
        await self.hass.config_entries.async_add(entry)
        await self.hass.async_block_till_done()
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)
        registry = entity_registry.async_get(self.hass)
        self.assertIsNone(registry.async_get_entity_id("update", "leapmotor", f"{VIN}_vehicle_software"))
        self.assertIsNone(registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_software_version"))
        self.assertIsNotNone(registry.async_get_entity_id("event", "leapmotor", f"{VIN}_activity"))

    async def test_trip_events_reach_the_event_entity_and_the_bus(self):
        import time as real_time

        entry = await self.load_entry_with_extras(update=False)
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        from homeassistant.core import callback

        fired = []

        @callback
        def remember(event):
            fired.append(dict(event.data))

        self.hass.bus.async_listen("leapmotor_event", remember)
        clock = {"now": real_time.time()}
        odometer = {"km": 18450.0, "kwh": 40.0}

        async def poll(*, speed=0.0, minutes=1.0, plugged=False, charging=False, software=None, messages=None):
            clock["now"] += minutes * 60
            data = deepcopy(self.client.fetch_data.return_value)
            vehicle = data["vehicles"][VIN]
            if speed:
                odometer["km"] += speed * minutes / 60
                odometer["kwh"] -= speed * minutes / 60 * 0.16
            vehicle["status"].update(
                speed_kmh=speed, is_driving=speed > 0, is_parked=speed == 0,
                vehicle_state="driving" if speed else "parked", odometer_km=odometer["km"],
                last_vehicle_timestamp=int(clock["now"] * 1000))
            vehicle["diagnostics"]["available_energy_kwh"] = odometer["kwh"]
            vehicle["charging"].update(is_plugged_in=plugged or charging, is_charging=charging)
            if software is not None:
                vehicle["software"] = software
            if messages is not None:
                vehicle["inbox"] = {"unread_count": len(messages), "messages": messages}
            self.client.fetch_data.return_value = data
            with patch("custom_components.leapmotor.coordinator.time.time", return_value=clock["now"]):
                await coordinator.async_refresh()
            await self.hass.async_block_till_done()

        await poll()
        self.assertEqual(fired, [], "the first polls only set the baseline")
        for _ in range(10):
            await poll(speed=60)
        self.assertEqual([e["type"] for e in fired], ["trip_started"])
        await poll()
        await poll()
        kinds = [e["type"] for e in fired]
        self.assertEqual(kinds, ["trip_started", "trip_finished"])
        finished = fired[-1]
        self.assertEqual(finished["vin"], VIN)
        self.assertAlmostEqual(finished["distance_km"], 10.0, delta=0.2)
        self.assertGreater(finished["energy_kwh"], 1.0)
        event = self.state_of("event", "activity")
        self.assertEqual(event.attributes["event_type"], "trip_finished")
        self.assertAlmostEqual(event.attributes["distance_km"], 10.0, delta=0.2)
        self.assertNotIn(event.state, ("unknown", "unavailable"))

        # The trip is in the log, with the parked-since time and a lifetime counter.
        last_trip = self.state_of("sensor", "last_trip_distance_km")
        self.assertAlmostEqual(float(last_trip.state), 10.0, delta=0.2)
        self.assertNotIn(self.state_of("sensor", "parked_since").state, ("unknown", "unavailable"))
        self.assertEqual(self.state_of("sensor", "lifetime_trips").state, "1")

        # Plugging in, a new message and a software update each fire once.
        from custom_components.leapmotor import cloud_extras as ce
        pending = ce.normalize_software_info({"currentVersion": {"generalVersion": "1.03.12"},
                                              "newVersion": {"generalVersion": "1.05.00"}}, "en")
        message = [{"id": "99", "title": "Door open", "message": "Rear left", "ts": clock["now"],
                    "time": "t", "type": 1, "read": False}]
        await poll(plugged=True, software=pending, messages=message)
        self.assertEqual([e["type"] for e in fired[2:]],
                         ["plugged_in", "software_update_available", "new_message"])
        await poll(plugged=True, software=pending, messages=message)
        self.assertEqual(len(fired), 5)
        self.assertEqual([e["id"] for e in fired], [1, 2, 3, 4, 5])
        self.assertEqual(self.state_of("event", "activity").attributes["event_type"], "new_message")
        self.assertEqual(self.state_of("update", "vehicle_software").attributes["latest_version"], "1.05.00")

        # The log can be exported through a service.
        response = await self.hass.services.async_call(
            "leapmotor", "get_trips", {"vin": VIN}, blocking=True, return_response=True)
        self.assertEqual(response["count"], 1)
        trip = response["trips"][0]
        self.assertAlmostEqual(trip["distance_km"], 10.0, delta=0.2)
        self.assertTrue(trip["start"].endswith("+00:00"))
        self.assertFalse([key for key in trip if key.startswith("_")])
        sessions = await self.hass.services.async_call(
            "leapmotor", "get_charging_sessions", {"vin": VIN}, blocking=True, return_response=True)
        self.assertEqual(sessions["count"], 0)
        self.assertEqual(len(sessions["cloud_sessions"]), 2)

        # The insights state is saved with the trip log and survives a reload.
        stored = coordinator._analytics.as_storage()["vins"][VIN]
        json.dumps(stored)
        self.assertEqual(stored["extra"]["lifetime"]["trips"], 1)
        self.assertEqual(stored["extra"]["flags"]["seq"], 5)
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_daily_history_is_backfilled_after_the_first_refresh(self):
        self.client.fetch_daily_history = Mock(return_value=[
            {"date": "2026-01-15", "km": 80.0, "kwh": 12.0, "odometer_km": None}])
        entry = await self.load_entry_with_extras(update=False)
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        self.client.fetch_daily_history.assert_not_called()  # setup is never slowed down
        await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        self.client.fetch_daily_history.assert_called_once()
        args, kwargs = self.client.fetch_daily_history.call_args
        self.assertEqual(args, (VIN,))
        self.assertLess(kwargs["begin_ms"], kwargs["end_ms"])
        self.assertEqual(round((kwargs["end_ms"] - kwargs["begin_ms"]) / 86_400_000), 90)
        extra = coordinator._analytics.extra(VIN)
        self.assertEqual(extra["days"]["2026-01-15"], [80.0, 12.0])
        # A failing cloud never breaks the poll and is given up on after a few tries.
        self.client.fetch_daily_history = Mock(return_value=None)
        for _ in range(8):
            await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        self.assertTrue(coordinator.last_update_success)
        self.assertEqual(self.client.fetch_daily_history.call_count, 6)
        self.assertTrue(extra["backfill"]["done"])
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_refresh_cloud_data_service_and_schedule_change_invalidate_the_cache(self):
        entry = await self.load_entry_with_extras(update=False)
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        self.client.invalidate_extras = Mock()
        calls = self.client.fetch_data.call_count
        await self.hass.services.async_call("leapmotor", "refresh_cloud_data", {}, blocking=True)
        await self.hass.async_block_till_done()
        self.client.invalidate_extras.assert_called_once_with()
        self.assertGreater(self.client.fetch_data.call_count, calls)
        self.client.invalidate_extras.reset_mock()
        coordinator.record_remote_action(VIN, "set_climate_schedule", success=True)
        self.assertEqual([call.args[0] for call in self.client.invalidate_extras.call_args_list],
                         ["schedule_climate", "schedule_battery_heating", "schedule_prepare_car"])
        self.client.invalidate_extras.reset_mock()
        coordinator.record_remote_action(VIN, "lock", success=True)
        coordinator.record_remote_action(VIN, "set_climate_schedule", success=False)
        self.client.invalidate_extras.assert_not_called()
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_share_invitation_is_offered_as_a_repair_and_as_services(self):
        from homeassistant.helpers import issue_registry

        entry = await self.load_entry_with_extras(update=False)
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        registry = issue_registry.async_get(self.hass)
        self.assertFalse([key for key in registry.issues if key[0] == "leapmotor"])
        invitation = {"car_type": "B10", "car_name": "Family car", "owner": "Owner",
                      "vin_tail": "777777", "shared_at": None, "expires_at": None}
        data = deepcopy(self.client.fetch_data.return_value)
        data["share_invitations"] = [invitation]
        self.client.fetch_data.return_value = data
        await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        issue_id = f"share_invitation_{entry.entry_id}_777777"
        issue = registry.async_get_issue("leapmotor", issue_id)
        self.assertIsNotNone(issue)
        self.assertTrue(issue.is_fixable)
        self.assertEqual(issue.translation_placeholders,
                         {"owner": "Owner", "car": "Family car", "vin_tail": "777777"})

        from custom_components.leapmotor import repairs
        self.client.answer_share_invitation = Mock(return_value={"accepted": True})
        flow = await repairs.async_create_fix_flow(self.hass, issue_id, issue.data)
        flow.hass = self.hass
        form = await flow.async_step_init()
        self.assertEqual((form["type"].value, form["step_id"]), ("form", "confirm"))
        self.client.answer_share_invitation.assert_not_called()  # nothing before confirming
        from custom_components.leapmotor import coordinator as coordinator_module
        # The entry is loaded again a few seconds later, when the cloud lists
        # the car; the wait itself is skipped here.
        self.assertGreater(coordinator_module.SHARE_RELOAD_DELAY_SECONDS, 0)
        with patch.object(self.hass.config_entries, "async_reload", new=AsyncMock()) as reload, \
                patch.object(coordinator_module, "SHARE_RELOAD_DELAY_SECONDS", 0):
            done = await flow.async_step_confirm({})
            await self.hass.async_block_till_done()
        self.assertEqual(done["type"].value, "create_entry")
        self.client.answer_share_invitation.assert_called_once_with("777777", accept=True)
        reload.assert_awaited_once_with(entry.entry_id)
        # With the real delay nothing is reloaded at once.
        with patch.object(self.hass.config_entries, "async_reload", new=AsyncMock()) as reload, \
                patch.object(coordinator_module, "async_call_later") as later:
            coordinator_module.async_reload_after_share_accept(self.hass, entry.entry_id)
            await self.hass.async_block_till_done()
            reload.assert_not_awaited()
            (_hass, delay, fire), _kwargs = later.call_args
            self.assertEqual(delay, coordinator_module.SHARE_RELOAD_DELAY_SECONDS)
            fire(None)
            await self.hass.async_block_till_done()
            reload.assert_awaited_once_with(entry.entry_id)
        # Accepting through the service waits the same way.
        self.client.answer_share_invitation = Mock(return_value={"accepted": True})
        with patch.object(self.hass.config_entries, "async_reload", new=AsyncMock()) as reload, \
                patch.object(coordinator_module, "SHARE_RELOAD_DELAY_SECONDS", 0):
            await self.hass.services.async_call("leapmotor", "accept_share_invitation",
                                                {"vin_tail": "777777"}, blocking=True)
            await self.hass.async_block_till_done()
        reload.assert_awaited_once_with(entry.entry_id)

        # Declining through the service; a failure is reported, not swallowed.
        self.client.answer_share_invitation = Mock(return_value={"accepted": False})
        await self.hass.services.async_call("leapmotor", "decline_share_invitation",
                                            {"vin_tail": "777777"}, blocking=True)
        self.client.answer_share_invitation.assert_called_once_with("777777", accept=False)
        self.client.answer_share_invitation = Mock(side_effect=self.api.LeapmotorApiError("refused"))
        with self.assertRaisesRegex(HomeAssistantError, "refused"):
            await self.hass.services.async_call("leapmotor", "accept_share_invitation", {}, blocking=True)

        # Once the invitation is gone, so is the repair.
        data = deepcopy(self.client.fetch_data.return_value)
        data["share_invitations"] = []
        self.client.fetch_data.return_value = data
        await coordinator.async_refresh()
        await self.hass.async_block_till_done()
        self.assertIsNone(registry.async_get_issue("leapmotor", issue_id))
        # No poll has seen an invitation: the cloud is still asked, because an
        # invitation may be newer than the last poll.
        self.client.answer_share_invitation = Mock(
            side_effect=self.api.LeapmotorApiError("No matching car-share invitation is waiting."))
        with self.assertRaisesRegex(HomeAssistantError, "No matching"):
            await self.hass.services.async_call("leapmotor", "accept_share_invitation", {}, blocking=True)
        self.client.answer_share_invitation.assert_called_once_with(None, accept=True)
        self.client.answer_share_invitation = Mock(return_value={"accepted": True})
        with patch.object(self.hass.config_entries, "async_reload", new=AsyncMock()) as reload, \
                patch.object(coordinator_module, "SHARE_RELOAD_DELAY_SECONDS", 0):
            answer = await self.hass.services.async_call(
                "leapmotor", "accept_share_invitation", {"vin_tail": "888888"},
                blocking=True, return_response=True)
            await self.hass.async_block_till_done()
        self.assertEqual(answer, {"accepted": True})
        self.client.answer_share_invitation.assert_called_once_with("888888", accept=True)
        reload.assert_awaited_once_with(entry.entry_id)
        coordinator.cancel_scheduled_followup_refreshes()

    async def test_setup_offers_to_accept_a_shared_car(self):
        from custom_components.leapmotor import config_flow

        invitation = {"car_type": "C10", "car_name": None, "owner": "Owner", "vin_tail": "123456",
                      "shared_at": None, "expires_at": None}
        vehicle = self.api.Vehicle(VIN, None, "C10", None, True)
        car = self.api.normalize_vehicle(vehicle, {"data": {"signal": {"1204": 70}}}, None)
        state = {"accepted": False}
        answers = []

        def fetch():
            if state["accepted"]:
                return {"vehicles": {VIN: car}, "share_invitations": []}
            return {"vehicles": {}, "share_invitations": [invitation]}

        def answer(vin_tail, *, accept):
            answers.append((vin_tail, accept))
            state["accepted"] = accept
            return {"accepted": accept}

        self.client.fetch_data = Mock(side_effect=fetch)
        self.client.answer_share_invitation = Mock(side_effect=answer)
        user_input = {"username": "Second" + chr(64) + "example.invalid", "password": "secret",
                      "operation_password": "0000", "scan_interval": 5, "eco_polling_enabled": False,
                      "eco_scan_interval": 15, "abrp_enabled": False, "abrp_token": ""}
        with patch.object(config_flow, "LeapmotorApiClient", return_value=self.client), \
                patch.object(config_flow, "has_app_certificate_material", return_value=True), \
                patch.object(config_flow, "save_app_certificate_material"), \
                patch.object(config_flow, "SHARE_ACCEPT_WAIT_SECONDS", 0), \
                patch.object(self.client, "close"), \
                patch("custom_components.leapmotor.async_setup_entry", new=AsyncMock(return_value=True)):
            result = await self.hass.config_entries.flow.async_init("leapmotor", context={"source": "user"})
            self.assertEqual((result["type"].value, result["step_id"]), ("form", "account"))
            result = await self.hass.config_entries.flow.async_configure(result["flow_id"], user_input)
            self.assertEqual((result["type"].value, result["step_id"]), ("form", "share_invitation"))
            self.assertEqual(result["description_placeholders"],
                             {"owner": "Owner", "car": "C10", "vin_tail": "123456"})
            self.assertEqual(answers, [], "nothing is accepted before the user confirms")
            result = await self.hass.config_entries.flow.async_configure(result["flow_id"], {})
            await self.hass.async_block_till_done()
        self.assertEqual(result["type"].value, "create_entry")
        self.assertEqual(answers, [("123456", True)])
        self.assertEqual(result["data"]["username"], user_input["username"])

    async def test_setup_without_car_or_invitation_still_says_no_vehicle(self):
        from custom_components.leapmotor import config_flow

        self.client.fetch_data = Mock(return_value={"vehicles": {}, "share_invitations": []})
        self.client.answer_share_invitation = Mock()
        user_input = {"username": "nobody", "password": "secret", "operation_password": "0000",
                      "scan_interval": 5, "eco_polling_enabled": False, "eco_scan_interval": 15,
                      "abrp_enabled": False, "abrp_token": ""}
        with patch.object(config_flow, "LeapmotorApiClient", return_value=self.client), \
                patch.object(config_flow, "has_app_certificate_material", return_value=True), \
                patch.object(config_flow, "save_app_certificate_material"), \
                patch.object(self.client, "close"):
            result = await self.hass.config_entries.flow.async_init("leapmotor", context={"source": "user"})
            result = await self.hass.config_entries.flow.async_configure(result["flow_id"], user_input)
        self.assertEqual((result["type"].value, result["step_id"]), ("form", "account"))
        self.assertEqual(result["errors"], {"base": "no_vehicle"})
        self.client.answer_share_invitation.assert_not_called()

    async def test_new_entities_have_names_in_english_slovenian_and_german(self):
        from homeassistant.helpers import translation

        from custom_components.leapmotor import insights
        from custom_components.leapmotor.binary_sensor import BINARY_SENSOR_DESCRIPTIONS
        from custom_components.leapmotor.sensor import SENSOR_DESCRIPTIONS

        await self.load_entry_with_extras(update=False)
        for language in ("en", "sl", "de"):
            strings = await translation.async_get_translations(self.hass, language, "entity", ["leapmotor"])
            new = ("real_range_km", "next_departure", "eco_score", "frequent_routes", "achievements",
                   "distance_this_year", "charging_curve", "software_version", "cloud_charging_sessions",
                   "next_scheduled_preconditioning", "remote_permissions", "parked_since")
            for key in new:
                self.assertIn(f"component.leapmotor.entity.sensor.{key}.name", strings, language)
            for key in ("charge_recommended", "slow_charging", "next_day_range_sufficient"):
                self.assertIn(f"component.leapmotor.entity.binary_sensor.{key}.name", strings, language)
            self.assertIn("component.leapmotor.entity.update.vehicle_software.name", strings)
            for kind in insights.EVENT_TYPES:
                self.assertIn(
                    f"component.leapmotor.entity.event.activity.state_attributes.event_type.state.{kind}",
                    strings, language)
        english = await translation.async_get_translations(self.hass, "en", "entity", ["leapmotor"])
        for description in SENSOR_DESCRIPTIONS:
            self.assertIn(f"component.leapmotor.entity.sensor.{description.translation_key}.name", english)
        for description in BINARY_SENSOR_DESCRIPTIONS:
            self.assertIn(
                f"component.leapmotor.entity.binary_sensor.{description.translation_key}.name", english)
        services = await translation.async_get_translations(self.hass, "sl", "services", ["leapmotor"])
        for name in ("get_trips", "get_charging_sessions", "refresh_cloud_data",
                     "accept_share_invitation", "decline_share_invitation"):
            self.assertIn(f"component.leapmotor.services.{name}.name", services)
            self.assertTrue(self.hass.services.has_service("leapmotor", name))

    async def test_options_offer_the_fuel_comparison_and_feed_the_savings(self):
        entry = await self.load_entry_with_extras(update=False, options={"fuel_price_l": 1.5})
        result = await self.hass.config_entries.options.async_init(entry.entry_id)
        fields = [str(key) for key in result["data_schema"].schema]
        for key in ("fuel_price_l", "fuel_l_100km", "grid_co2_g_kwh"):
            self.assertIn(key, fields)
        coordinator = self.hass.data["leapmotor"][entry.entry_id]
        self.assertEqual(coordinator._fuel_comparison()["price"], 1.5)
        savings = coordinator.data["vehicles"][VIN]["analytics"]["savings"]
        self.assertEqual(savings["assumptions"]["fuel_price"], 1.5)
        self.assertEqual(savings["assumptions"]["fuel_l_100km"], 6.5)
        # Lifetime: 18450 km on the odometer, no lifetime energy from the cloud here.
        self.assertEqual(savings["lifetime"]["fuel_litres"], 1199.2)
        self.assertEqual(self.state_of("sensor", "fuel_avoided_total_l").state, "1199.2")
        coordinator.cancel_scheduled_followup_refreshes()


if __name__ == "__main__":
    unittest.main()
