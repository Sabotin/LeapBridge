"""Helpers for interpreting inconsistent vehicle status signals."""

from __future__ import annotations


def nonzero_state(raw: object) -> bool | None:
    """Return whether a numeric or boolean-like status value is non-zero."""
    if raw is None:
        return None
    if isinstance(raw, bool):
        return raw
    try:
        return float(raw) != 0
    except (TypeError, ValueError):
        normalized = str(raw).strip().lower()
        if normalized in {"true", "yes", "on"}:
            return True
        if normalized in {"false", "no", "off"}:
            return False
        return None


def steering_wheel_heating_state(raw: object, car_type: object = None) -> bool | None:
    """Return steering-wheel heating state from signal 1816.

    Signal 1816 carries the heating mode, verified on A10: 0 = off,
    1 = level 1, 2 = level 2, 3 = remote heating. Other models retain
    their existing value-2 mapping; unknown A10 modes remain unknown.
    """
    if raw is None or isinstance(raw, bool):
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError, OverflowError):
        return None
    if str(car_type or "").strip().upper() == "A10":
        if value not in {0, 1, 2, 3}:
            return None
        return value != 0
    if not (-float("inf") < value < float("inf")):
        return None
    return value == 2


def window_open_state(
    status_value: object,
    position_percent: object,
    *,
    use_position: bool,
) -> bool | None:
    """Return window state from its flag and, where reliable, position."""
    status_open = nonzero_state(status_value)
    position_open = nonzero_state(position_percent) if use_position else None
    if status_open is None and position_open is None:
        return None
    return bool(status_open or position_open)


def vehicle_precludes_charging(signals: dict[str, object]) -> bool:
    """Return whether motion or physical READY makes charging impossible."""
    gear = _safe_int(signals.get("1010"))
    speed = _safe_float(signals.get("1319"))
    vehicle_ready = nonzero_state(signals.get("1258"))
    return (
        gear in {1, 2, 3}
        or (speed is not None and speed > 0)
        or vehicle_ready is True
    )


def charge_connection_allows_charging(
    connection_status: object,
    legacy_plug_status: object,
) -> bool:
    """Reject explicit unplugged and drive-time cable states."""
    connection = _safe_int(connection_status)
    if connection is not None:
        # State 4 means connected but waiting for the configured schedule. It
        # does not prove charging, but real current may begin before the state
        # changes, so let the current/time checks make the final decision.
        return connection in {1, 2, 3, 4}
    legacy_plugged = nonzero_state(legacy_plug_status)
    return legacy_plugged is not False


# Below this the pack current of a parked car is also explained by its own
# consumers settling; the regular cable-state checks decide there.
STATIONARY_INFLOW_MIN_A = 3.0


def stationary_charge_inflow(signals: dict[str, object]) -> bool:
    """Return whether a standing vehicle in Park is taking charge into the pack.

    Negative pack current is energy flowing into the battery. A vehicle that
    stands still cannot regenerate, so a clear inflow can only come from a
    cable, whatever the charge-state code or the READY flag report. State 5
    is the vehicle's own "this inflow is regeneration" and stays excluded.
    """
    gear = _safe_int(signals.get("1010"))
    speed = _safe_float(signals.get("1319"))
    if gear in {1, 2, 3} or (speed is not None and speed > 0):
        return False
    if gear != 0 and speed != 0:
        # Standstill has to be reported, not assumed from missing data.
        return False
    if _safe_int(signals.get("1149")) == 5:
        return False
    current = _safe_float(signals.get("1178"))
    if current is None or not current <= -STATIONARY_INFLOW_MIN_A:
        return False
    remaining_minutes = _safe_int(signals.get("1200"))
    if remaining_minutes is not None and remaining_minutes > 0:
        return True
    voltage = _safe_float(signals.get("1177"))
    return voltage is not None and abs(current * voltage) / 1000.0 >= 1.0


def _safe_int(raw: object) -> int | None:
    """Return a status value as int or None."""
    if raw is None:
        return None
    try:
        return int(float(raw))
    except (TypeError, ValueError):
        return None


def _safe_float(raw: object) -> float | None:
    """Return a status value as float or None."""
    if raw is None:
        return None
    try:
        return float(raw)
    except (TypeError, ValueError):
        return None
