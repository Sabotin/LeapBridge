"""Tests for inconsistent model-specific status signals."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest

MODULE_PATH = (
    Path(__file__).parents[1]
    / "custom_components"
    / "leapmotor"
    / "signal_helpers.py"
)
SPEC = importlib.util.spec_from_file_location("leapmotor_signal_helpers", MODULE_PATH)
assert SPEC and SPEC.loader
signals = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = signals
SPEC.loader.exec_module(signals)


class WindowOpenStateTests(unittest.TestCase):
    """Cover T03 position fallback without changing other models."""

    def test_t03_open_position_overrides_dead_closed_flag(self) -> None:
        self.assertIs(
            signals.window_open_state(0, 20, use_position=True),
            True,
        )

    def test_t03_zero_position_and_flag_are_closed(self) -> None:
        self.assertIs(
            signals.window_open_state(0, 0, use_position=True),
            False,
        )

    def test_other_models_ignore_untrusted_position(self) -> None:
        self.assertIs(
            signals.window_open_state(0, 50, use_position=False),
            False,
        )

    def test_nonbinary_status_is_open(self) -> None:
        self.assertIs(
            signals.window_open_state(2, None, use_position=False),
            True,
        )

    def test_missing_status_and_position_are_unknown(self) -> None:
        self.assertIs(
            signals.window_open_state(None, None, use_position=True),
            None,
        )

    def test_decimal_zero_string_is_closed(self) -> None:
        self.assertIs(signals.nonzero_state("0.0"), False)


class SteeringWheelHeatingStateTests(unittest.TestCase):
    """Cover A10 steering-wheel heating modes from signal 1816."""

    def test_level_and_remote_modes_are_on(self) -> None:
        self.assertIs(signals.steering_wheel_heating_state(1, "A10"), True)
        self.assertIs(signals.steering_wheel_heating_state(2, "A10"), True)
        self.assertIs(signals.steering_wheel_heating_state("3", " a10 "), True)

    def test_other_models_keep_existing_mapping(self):
        for model in ("C10", "B10", "T03", None):
            for value in (0, 1, 2, 3):
                self.assertIs(signals.steering_wheel_heating_state(value, model), value == 2)

    def test_unknown_a10_modes_are_not_guessed(self):
        for value in (-1, 4, 255, "bad", "NaN", "inf", 1.5, True, None):
            self.assertIsNone(signals.steering_wheel_heating_state(value, "A10"))

    def test_zero_is_off(self) -> None:
        self.assertIs(signals.steering_wheel_heating_state(0), False)

    def test_missing_value_is_unknown(self) -> None:
        self.assertIsNone(signals.steering_wheel_heating_state(None))


class ChargingPlausibilityTests(unittest.TestCase):
    """Cover the B10 READY/unplugged phantom-charge sequence."""

    def test_physical_ready_precludes_charging_in_park(self) -> None:
        self.assertIs(
            signals.vehicle_precludes_charging(
                {"1010": 0, "1319": 0, "1258": 1}
            ),
            True,
        )

    def test_parked_vehicle_with_ready_off_can_charge(self) -> None:
        self.assertIs(
            signals.vehicle_precludes_charging(
                {"1010": 0, "1319": 0, "1258": 0}
            ),
            False,
        )

    def test_explicit_unplugged_state_rejects_charging(self) -> None:
        self.assertIs(signals.charge_connection_allows_charging(0, 1), False)

    def test_deferred_state_keeps_connection_plausible(self) -> None:
        self.assertIs(signals.charge_connection_allows_charging(4, 1), True)

    def test_drive_time_state_rejects_charging(self) -> None:
        self.assertIs(signals.charge_connection_allows_charging(5, 1), False)

    def test_connected_states_allow_charging_checks(self) -> None:
        for state in (1, 2, 3):
            with self.subTest(state=state):
                self.assertIs(
                    signals.charge_connection_allows_charging(state, 0),
                    True,
                )

    def test_legacy_explicit_unplugged_state_rejects_charging(self) -> None:
        self.assertIs(signals.charge_connection_allows_charging(None, 0), False)

    def test_missing_connection_state_keeps_legacy_current_fallback(self) -> None:
        self.assertIs(signals.charge_connection_allows_charging(None, None), True)


class StationaryChargeInflowTests(unittest.TestCase):
    """Measured inflow into a standing vehicle in Park is a cable charge."""

    PARKED = {"1010": 0, "1319": 0, "1177": 340}

    def inflow(self, **overrides: object) -> bool:
        return signals.stationary_charge_inflow({**self.PARKED, **overrides})

    def test_inflow_counts_whatever_state_code_or_ready_flag_say(self) -> None:
        for extra in ({}, {"1149": 0}, {"1149": 6}, {"1258": 1}, {"1149": 0, "1258": 1}):
            with self.subTest(extra=extra):
                self.assertIs(self.inflow(**{"1178": -6.5, **extra}), True)

    def test_remaining_time_confirms_inflow_without_voltage(self) -> None:
        self.assertIs(self.inflow(**{"1178": -6.5, "1177": None, "1200": 95}), True)
        self.assertIs(self.inflow(**{"1178": -6.5, "1177": None, "1200": 0}), False)

    def test_discharge_and_weak_inflow_do_not_count(self) -> None:
        for current in (5, 0, -2.9, None, "bad", float("nan")):
            with self.subTest(current=current):
                self.assertIs(self.inflow(**{"1178": current, "1200": 95}), False)

    def test_inflow_below_one_kilowatt_needs_remaining_time(self) -> None:
        self.assertIs(self.inflow(**{"1178": -3, "1177": 300}), False)
        self.assertIs(self.inflow(**{"1178": -3, "1177": 300, "1200": 40}), True)

    def test_gear_or_motion_makes_inflow_regeneration(self) -> None:
        for extra in ({"1010": 1}, {"1010": 2}, {"1010": 3}, {"1319": 12}, {"1149": 5}):
            with self.subTest(extra=extra):
                self.assertIs(self.inflow(**{"1178": -40, "1200": 95, **extra}), False)

    def test_standstill_must_be_reported(self) -> None:
        charging = {"1178": -6.5, "1177": 340}
        self.assertIs(signals.stationary_charge_inflow(charging), False)
        self.assertIs(signals.stationary_charge_inflow({**charging, "1010": 16777215}), False)
        self.assertIs(signals.stationary_charge_inflow({**charging, "1319": 0}), True)
        self.assertIs(
            signals.stationary_charge_inflow({**charging, "1010": 16777215, "1319": 0}), True
        )


if __name__ == "__main__":
    unittest.main()
