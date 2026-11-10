"""Validate every blueprint with Home Assistant's own automation validator and render the templates."""
import asyncio
import sys
import tempfile
from datetime import timedelta
from pathlib import Path

from homeassistant.components.automation import config as automation_config
from homeassistant.components.blueprint import models
from homeassistant import loader
from homeassistant.core import HomeAssistant
from homeassistant.helpers import template as template_helper
from homeassistant.util import dt as dt_util, yaml as yaml_util

ROOT = Path(sys.argv[1])
INPUTS = {
    "smart_precondition.yaml": {
        "departure_sensor": "sensor.c10_next_departure", "climate_button": "button.c10_precondition_cabin",
        "battery_sensor": "sensor.c10_battery", "outdoor_sensor": "sensor.c10_outdoor_temperature",
        "driving_sensor": "binary_sensor.c10_is_driving"},
    "smart_charge_reminder.yaml": {"recommended_sensor": "binary_sensor.c10_charge_recommended", "notify_device": "abc"},
    "car_event_notification.yaml": {"activity_event": "event.c10_activity", "notify_device": "abc"},
    "slow_charging_alert.yaml": {"slow_sensor": "binary_sensor.c10_slow_charging", "notify_device": "abc"},
}


def text(value):
    return value if isinstance(value, str) else value.template


def first(config, *keys):
    for key in keys:
        if key in config:
            return config[key]
    raise KeyError(keys)


async def main():
    with tempfile.TemporaryDirectory() as config_dir:
        hass = HomeAssistant(config_dir)
        hass.config.time_zone = "Europe/Ljubljana"
        loader.async_setup(hass)
        ok = True

        def render(source, **variables):
            return template_helper.Template(source, hass).async_render(variables, parse_result=False).strip()

        for path in sorted(ROOT.glob("*.yaml")):
            data = yaml_util.load_yaml(str(path))
            blueprint = models.Blueprint(data, expected_domain="automation", path=path.name,
                                         schema=automation_config.AUTOMATION_BLUEPRINT_SCHEMA)
            if path.name not in INPUTS:
                print("loaded     ", path.name)
                continue
            inputs = models.BlueprintInputs(
                blueprint, {"use_blueprint": {"path": path.name, "input": INPUTS[path.name]}})
            inputs.validate()
            config = inputs.async_substitute()
            triggers = first(config, "trigger", "triggers")
            conditions = config.get("condition") or config.get("conditions") or []
            actions = first(config, "action", "actions")
            now = dt_util.utcnow()
            hass.states.async_set("sensor.c10_next_departure", (now + timedelta(minutes=10)).isoformat(),
                                  {"confidence": 0.88})
            hass.states.async_set("sensor.c10_outdoor_temperature", "2.5")
            hass.states.async_set("binary_sensor.c10_charge_recommended", "on",
                                  {"reason": "low_for_next_day", "soc": 22.4, "needed_soc": 41.6,
                                   "expected_km": 58.0})
            hass.states.async_set("binary_sensor.c10_slow_charging", "on", {"now_kw": 3.6, "usual_kw": 10.8})

            if path.name == "smart_precondition.yaml":
                trig = text(triggers[0]["value_template"])
                v = {"departure_sensor": "sensor.c10_next_departure", "lead_minutes": 15}
                assert render(trig, **v) == "True", render(trig, **v)
                hass.states.async_set("sensor.c10_next_departure", (now + timedelta(minutes=40)).isoformat())
                assert render(trig, **v) == "False"
                hass.states.async_set("sensor.c10_next_departure", (now - timedelta(minutes=1)).isoformat())
                assert render(trig, **v) == "False", "a departure in the past must not trigger"
                for bad in ("unknown", "unavailable", ""):
                    hass.states.async_set("sensor.c10_next_departure", bad)
                    assert render(trig, **v) == "False", bad
                hass.states.async_set("sensor.c10_next_departure", (now + timedelta(minutes=10)).isoformat(),
                                      {"confidence": 0.88})
                templated = [c for c in conditions if c.get("condition") == "template"]
                c0 = text(templated[0]["value_template"])
                assert render(c0, departure_sensor="sensor.c10_next_departure", min_confidence=60) == "True"
                assert render(c0, departure_sensor="sensor.c10_next_departure", min_confidence=95) == "False"
                c1 = text(templated[1]["value_template"])
                for temp, want in (("2.5", "True"), ("18", "False"), ("31", "True"), ("unknown", "False")):
                    hass.states.async_set("sensor.c10_outdoor_temperature", temp)
                    got = render(c1, outdoor_sensor="sensor.c10_outdoor_temperature", heat_below=8, cool_above=27)
                    assert got == want, (temp, got)
            if path.name == "smart_charge_reminder.yaml":
                msg = text(actions[0]["message"])
                out = " ".join(render(msg, recommended_sensor="binary_sensor.c10_charge_recommended").split())
                assert "22 %" in out and "58 km" in out and "42 %" in out, out
                print("   ", out)
                hass.states.async_set("binary_sensor.c10_charge_recommended", "on",
                                      {"reason": "low_battery", "soc": 9.0})
                out = " ".join(render(msg, recommended_sensor="binary_sensor.c10_charge_recommended").split())
                assert "9 %" in out and "None" not in out, out
                cond = text(conditions[1]["value_template"])
                assert render(cond, trackers=[]) == "True"
                hass.states.async_set("device_tracker.c10_location", "not_home")
                assert render(cond, trackers=["device_tracker.c10_location"]) == "False"
                hass.states.async_set("device_tracker.c10_location", "home")
                assert render(cond, trackers=["device_tracker.c10_location"]) == "True"
            if path.name == "car_event_notification.yaml":
                title, msg = text(actions[0]["title"]), text(actions[0]["message"])
                cases = {
                    "trip_finished": {"distance_km": 23.4, "duration_min": 31.0, "from": "Home", "to": "Work",
                                      "consumption_kwh_100km": 15.8, "cost": 0.74, "eco_score": 82},
                    "charging_finished": {"energy_kwh": 12.8, "end_soc": 89.5, "cost": 2.3},
                    "charging_interrupted": {"energy_kwh": 5.0, "end_soc": 55.0, "charge_limit": 90},
                    "charging_started": {"soc": 44, "power_kw": 10.8},
                    "battery_low": {"soc": 12, "range_km": 41.0},
                    "new_message": {"title": "Door open", "message": "Rear left door"},
                    "software_update_available": {"latest_version": "1.04.01", "installed_version": "1.03.12"},
                    "achievement_unlocked": {"achievement": "long_trip", "level": 2},
                    "plugged_in": {"soc": 44}, "unplugged": {}, "trip_started": {"soc": 70},
                    # Sparse events must still read well.
                    "trip_finished ": {},
                }
                for kind, attrs in cases.items():
                    kind = kind.strip()
                    t = render(title, kind=kind, a=attrs)
                    m = " ".join(render(msg, kind=kind, a=attrs).split())
                    assert t and m and "Undefined" not in m and "None" not in m, (kind, t, m)
                    print(f"    {kind:26s} | {t} | {m}")
            if path.name == "slow_charging_alert.yaml":
                out = " ".join(render(text(actions[0]["message"]),
                                      slow_sensor="binary_sensor.c10_slow_charging").split())
                assert "3.6 kW" in out and "10.8 kW" in out, out
            print("checked    ", path.name)
        await hass.async_stop(force=True)
        assert ok
        print("ALL BLUEPRINTS OK")


asyncio.run(main())
