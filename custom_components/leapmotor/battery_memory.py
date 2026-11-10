"""The battery level and cable state while the car's battery electronics sleep.

A sleeping car (seen on the T03) answers with a reduced status: the fields of
the battery electronics (charge state, pack current and voltage, connector
flag, remaining charge time) are missing and the battery level can read 0.
The official app shows that as it is: 0 % and no cable.

Nothing about the battery or the cable is measured while those electronics
sleep, so what the last complete status said is kept until the next complete
status, or until the car has moved. Plugging in and charging both wake the
electronics; a cable taken out of a sleeping car is noticed when the car is
next switched on.

This module has no Home Assistant imports.
"""

from __future__ import annotations

from typing import Any

SOURCE = "last_complete_status"

#: Charging keys kept from the last complete status, where the reduced one has none.
_CHARGING_KEYS = ("is_plugged_in", "dc_cable_connected")
#: How many changes of the cable reading are kept for the diagnostics download.
TRAIL_LENGTH = 8
#: A new entry of the trail when one of these changes; the pack current alone does not count.
_TRAIL_RAW = ("charge_state", "connector_flag", "ready", "gear")


def _number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def is_reduced(vehicle_data: dict[str, Any]) -> bool:
    """Return whether this status came without the battery electronics' fields."""
    return (vehicle_data.get("charging") or {}).get("battery_data_reported") is False


def remember(vehicle_data: dict[str, Any], seen_at: float) -> dict[str, Any] | None:
    """Return what a complete status says, to be kept; None for a reduced status."""
    charging = vehicle_data.get("charging") or {}
    if charging.get("battery_data_reported") is not True:
        return None
    status = vehicle_data.get("status") or {}
    diagnostics = vehicle_data.get("diagnostics") or {}
    return {
        "battery_percent": status.get("battery_percent"),
        "battery_percent_precise": status.get("battery_percent_precise"),
        "is_plugged_in": charging.get("is_plugged_in"),
        "connection_state": charging.get("connection_state"),
        "dc_cable_connected": charging.get("dc_cable_connected"),
        "odometer_km": status.get("odometer_km"),
        "vehicle_timestamp": status.get("last_vehicle_timestamp"),
        "seen_at": int(seen_at),
        # What the cable state was read from, for the diagnostics download.
        "raw": {
            "charge_state": diagnostics.get("raw_signal_1149"),
            "connector_flag": diagnostics.get("raw_signal_1197"),
            "current_a": charging.get("charging_current_a"),
            "voltage_v": charging.get("charging_voltage_v"),
            "remaining_minutes": charging.get("remaining_charge_minutes"),
            "ready": diagnostics.get("raw_signal_1258"),
            "gear": diagnostics.get("raw_signal_1010"),
        },
    }


def _trail_entry(memory: dict[str, Any]) -> dict[str, Any]:
    return {
        "seen_at": memory.get("seen_at"),
        "is_plugged_in": memory.get("is_plugged_in"),
        "connection_state": memory.get("connection_state"),
        **(memory.get("raw") or {}),
    }


def _with_trail(complete: dict[str, Any], previous: dict[str, Any] | None) -> dict[str, Any]:
    """Carry over the recent changes of the cable reading and add this one if it is new."""
    trail = [dict(item) for item in (previous or {}).get("trail") or [] if isinstance(item, dict)]
    entry = _trail_entry(complete)
    keys = ("is_plugged_in", "connection_state", *_TRAIL_RAW)
    if not trail or any(trail[-1].get(key) != entry.get(key) for key in keys):
        trail.append(entry)
    return {**complete, "trail": trail[-TRAIL_LENGTH:]}


def has_moved(vehicle_data: dict[str, Any], memory: dict[str, Any]) -> bool:
    """Return whether the car drove since the remembered status."""
    status = vehicle_data.get("status") or {}
    if status.get("is_driving") is True or status.get("gear") in {"R", "N", "D"}:
        return True
    speed = _number(status.get("speed_kmh"))
    if speed is not None and speed > 0:
        return True
    before = _number(memory.get("odometer_km"))
    now = _number(status.get("odometer_km"))
    return before is not None and now is not None and abs(now - before) >= 1


def restore(vehicle_data: dict[str, Any], memory: dict[str, Any] | None) -> bool:
    """Fill a reduced status from the last complete one. Returns whether anything was filled.

    Only values the reduced status leaves unknown are filled. A charge that
    was running cannot be running while the electronics sleep: the cable is
    then in without charging.
    """
    if not memory or not is_reduced(vehicle_data) or has_moved(vehicle_data, memory):
        return False
    status = vehicle_data.get("status")
    charging = vehicle_data.get("charging")
    if not isinstance(status, dict) or not isinstance(charging, dict):
        return False
    filled = False
    for key in ("battery_percent", "battery_percent_precise"):
        if status.get(key) is None and memory.get(key) is not None:
            status[key] = memory[key]
            status["battery_percent_source"] = SOURCE
            filled = True
    cable = False
    for key in _CHARGING_KEYS:
        if charging.get(key) is None and memory.get(key) is not None:
            charging[key] = memory[key]
            cable = True
    if charging.get("connection_state") is None and memory.get("connection_state") is not None:
        state = memory["connection_state"]
        charging["connection_state"] = "plugged_in" if state == "charging" else state
        cable = True
    if cable:
        charging["cable_state_source"] = SOURCE
        charging["cable_state_seen_at"] = memory.get("seen_at")
    return filled or cable


def update(
    memories: dict[str, dict[str, Any]],
    vehicles: dict[str, Any] | None,
    seen_at: float,
) -> bool:
    """Take one poll: remember complete statuses, fill reduced ones.

    ``memories`` (per VIN) is changed in place. Returns whether it holds
    something new worth saving; the time of a status alone is not.
    """
    changed = False
    for vin, vehicle_data in (vehicles or {}).items():
        if not isinstance(vehicle_data, dict):
            continue
        complete = remember(vehicle_data, seen_at)
        if complete is not None:
            previous = memories.get(vin) or {}
            complete = _with_trail(complete, previous)
            if {**previous, "seen_at": 0} != {**complete, "seen_at": 0}:
                changed = True
            memories[vin] = complete
            continue
        memory = memories.get(vin)
        if memory and has_moved(vehicle_data, memory):
            # It drove since: what the last complete status said is over.
            del memories[vin]
            changed = True
            continue
        restore(vehicle_data, memory)
    return changed


def from_storage(stored: Any) -> dict[str, dict[str, Any]]:
    """Return the remembered statuses of a storage file, dropping anything malformed."""
    if not isinstance(stored, dict):
        return {}
    return {
        str(vin): dict(memory)
        for vin, memory in stored.items()
        if isinstance(memory, dict)
    }


__all__ = ["SOURCE", "from_storage", "has_moved", "is_reduced", "remember", "restore", "update"]
