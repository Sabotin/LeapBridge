"""Offline HA regressions for diagnostics, entity defaults and service boundaries.

Run separately from unit tests: python tools/ha_issue_runtime.py -v
CI runs it against homeassistant 2025.3.0 (minimum) and the latest release;
all vehicle data is synthetic.
"""
import asyncio
from copy import deepcopy
import json
from pathlib import Path
import shutil
import sys
import tempfile
import types
import unittest
from unittest.mock import AsyncMock, Mock, patch

from homeassistant import auth, config_entries, loader
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import area_registry, device_registry, entity_registry, frame
from homeassistant.setup import async_setup_component

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

    async def test_t03_controls_absent_and_service_rejected(self):
        entry = await self.load_entry()
        registry = entity_registry.async_get(self.hass)
        self.assertIsNone(registry.async_get_entity_id("number", "leapmotor", f"{VIN}_charge_limit_setting"))
        self.assertIsNone(registry.async_get_entity_id("switch", "leapmotor", f"{VIN}_charging_schedule"))
        limit_id = registry.async_get_entity_id("sensor", "leapmotor", f"{VIN}_charge_limit_percent")
        self.assertEqual(self.hass.states.get(limit_id).state, "95")
        with self.assertRaisesRegex(HomeAssistantError, "not supported.*T03"):
            await self.hass.services.async_call("leapmotor", "set_charge_limit",
                {"vin": VIN, "charge_limit_percent": 80}, blocking=True)
        self.client.get_vehicle_status.assert_not_called()
        self.client._remote_control_raw.assert_not_called()

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
        with patch("custom_components.leapmotor.config_flow.validate_input", new=AsyncMock(return_value={})):
            result = await self.hass.config_entries.flow.async_configure(flow_id, {"password": "replacement"})
        self.assertEqual(result["reason"], "reconfigure_successful")
        await self.hass.async_block_till_done()
        self.assertEqual(entry.data["password"], "replacement")
        self.assertEqual(entry.state, config_entries.ConfigEntryState.LOADED)

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


if __name__ == "__main__":
    unittest.main()
