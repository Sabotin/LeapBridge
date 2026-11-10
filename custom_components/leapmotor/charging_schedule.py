"""The car's charging schedule: reading it and building the command that sets it.

The schedule is one time window with weekdays, a repeat flag, an "auto
recharge" flag and the charge limit. It is set with remote command 190, the
same payload LeapConnect / leapmotor-api 0.6.0 (AGPL-3.0) send:

    {"chargeEnable":1,"chargesoc":80,"circulation":1,"cycles":"1,2,3,4,5",
     "endtime":"06:00","recharge":0,"starttime":"23:00"}

Weekdays are numbered 1 = Monday to 7 = Sunday. This module has no Home
Assistant imports.
"""

from __future__ import annotations

from datetime import time as dt_time
import json
import re
from typing import Any, Iterable

#: Index 0 is day number 1 (Monday).
DAY_NAMES: tuple[str, ...] = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
ALL_DAYS: tuple[int, ...] = (1, 2, 3, 4, 5, 6, 7)

_DAY_ALIASES = {
    **{name: number for number, name in enumerate(DAY_NAMES, start=1)},
    "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4,
    "friday": 5, "saturday": 6, "sunday": 7,
}
_TIME = re.compile(r"^\s*(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*$")


def normalize_time(value: Any) -> str:
    """Return a wall-clock time as ``HH:MM``. Raises ValueError when it is not one."""
    if isinstance(value, dt_time):
        return f"{value.hour:02d}:{value.minute:02d}"
    match = _TIME.match(str(value if value is not None else ""))
    if not match:
        raise ValueError(f"Not a time of day (use HH:MM): {value!r}")
    hour, minute = int(match.group(1)), int(match.group(2))
    if hour > 23 or minute > 59:
        raise ValueError(f"Not a time of day (use HH:MM): {value!r}")
    return f"{hour:02d}:{minute:02d}"


def parse_time(value: Any) -> dt_time | None:
    """Return the car's schedule time as a time object, or None when it has none."""
    try:
        hour, minute = normalize_time(value).split(":")
    except ValueError:
        return None
    return dt_time(int(hour), int(minute))


def normalize_days(value: Any) -> list[int]:
    """Return sorted weekday numbers (1 = Monday) from numbers or day names.

    Accepts a list or a comma-separated text. Raises ValueError for anything
    that is not a weekday, and for an empty selection.
    """
    if isinstance(value, str):
        items: list[Any] = [part for part in re.split(r"[,\s]+", value.strip()) if part]
    elif isinstance(value, (list, tuple, set, frozenset)):
        items = list(value)
    elif value is None:
        items = []
    else:
        items = [value]
    days: set[int] = set()
    for item in items:
        text = str(item).strip().lower()
        if text in _DAY_ALIASES:
            days.add(_DAY_ALIASES[text])
            continue
        try:
            number = int(text)
        except ValueError:
            number = 0
        if isinstance(item, bool) or not 1 <= number <= 7:
            raise ValueError(
                f"Not a weekday: {item!r}. Use mon to sun, or 1 (Monday) to 7 (Sunday)."
            )
        days.add(number)
    if not days:
        raise ValueError("Choose at least one weekday.")
    return sorted(days)


def format_cycles(days: Iterable[int]) -> str:
    """Return weekday numbers the way command 190 takes them: ``1,2,3``."""
    return ",".join(str(day) for day in sorted(set(days)))


def parse_cycles(value: Any) -> list[int] | None:
    """Return the weekday numbers of the car's ``cycles`` value, or None if unknown.

    The usual form lists day numbers ("1,2,3,4,5"). Seven 0/1 flags, one per
    day ("1,1,1,1,1,0,0"), are understood as well.
    """
    if value is None:
        return None
    if isinstance(value, (list, tuple)):
        parts = [str(item).strip() for item in value]
    else:
        parts = [part.strip() for part in str(value).split(",")]
    parts = [part for part in parts if part]
    if not parts or not all(part.isdigit() for part in parts):
        return None
    numbers = [int(part) for part in parts]
    if len(numbers) == 7 and set(numbers) <= {0, 1} and (0 in numbers or numbers.count(1) > 1):
        return [day for day, flag in zip(ALL_DAYS, numbers) if flag]
    if all(1 <= number <= 7 for number in numbers):
        return sorted(set(numbers))
    return None


def _flag(value: Any) -> int | None:
    """Return 0 or 1 for the car's switch values, None for anything else."""
    if isinstance(value, bool):
        return int(value)
    try:
        number = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    return number if number in (0, 1) else None


def _percent(value: Any) -> int | None:
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        return None
    return number if 0 <= number <= 100 else None


def build_schedule_command(
    current: dict[str, Any] | None,
    *,
    start_time: Any = None,
    end_time: Any = None,
    days: Any = None,
    enabled: bool | None = None,
    charge_limit_percent: int | None = None,
    repeat_weekly: bool | None = None,
    auto_recharge: bool | None = None,
) -> str:
    """Return the content of command 190 for a new charging schedule.

    ``current`` is the car's present plan (keys ``isEnable``, ``percent``,
    ``circulation``, ``cycles``, ``endTime``, ``recharge``, ``beginTime``).
    Every value that is not given is kept from it, so changing only the start
    time does not touch the days or the charge limit. Raises ValueError when a
    needed value is neither given nor known.
    """
    current = current or {}

    def wanted_time(given: Any, key: str, label: str) -> str:
        if given is not None:
            return normalize_time(given)
        try:
            return normalize_time(current.get(key))
        except ValueError:
            raise ValueError(
                f"Give the {label} time: the car reports no charging schedule to keep it from."
            ) from None

    start = wanted_time(start_time, "beginTime", "start")
    end = wanted_time(end_time, "endTime", "end")

    if days is not None:
        cycles = format_cycles(normalize_days(days))
    else:
        # Kept exactly as the car reports it; every day when it reports nothing.
        cycles = str(current.get("cycles") or "").strip() or format_cycles(ALL_DAYS)

    if charge_limit_percent is not None:
        limit = _percent(charge_limit_percent)
        if limit is None or limit < 1:
            raise ValueError(f"Charge limit must be 1-100 %, got {charge_limit_percent!r}.")
    else:
        limit = _percent(current.get("percent"))
        if limit is None or limit < 1:
            raise ValueError(
                "Give the charge limit: the car reports no charge limit to keep."
            )

    def wanted_flag(given: bool | None, key: str, default: int) -> int:
        if given is not None:
            return int(bool(given))
        known = _flag(current.get(key))
        return default if known is None else known

    return json.dumps(
        {
            # A plan the car does not report stays switched off unless asked for.
            "chargeEnable": wanted_flag(enabled, "isEnable", 0),
            "chargesoc": limit,
            # LeapConnect's schedule dialog starts with weekly repetition on.
            "circulation": wanted_flag(repeat_weekly, "circulation", 1),
            "cycles": cycles,
            "endtime": end,
            "recharge": wanted_flag(auto_recharge, "recharge", 0),
            "starttime": start,
        },
        separators=(",", ":"),
    )


def schedule_view(charging: dict[str, Any] | None) -> dict[str, Any]:
    """The schedule as entities and the dashboard show it.

    Reads the normalised ``charging`` block of one vehicle. Unknown values are
    None; ``days`` is a list of weekday numbers (1 = Monday).
    """
    charging = charging or {}
    start = parse_time(charging.get("charging_planned_start"))
    end = parse_time(charging.get("charging_planned_end"))
    enabled = _flag(charging.get("charging_planned_enabled"))
    repeat = _flag(charging.get("charging_planned_circulation"))
    recharge = _flag(charging.get("charging_planned_recharge"))
    return {
        "enabled": None if enabled is None else bool(enabled),
        "start": None if start is None else start.strftime("%H:%M"),
        "end": None if end is None else end.strftime("%H:%M"),
        "days": parse_cycles(charging.get("charging_planned_cycles")),
        "repeat_weekly": None if repeat is None else bool(repeat),
        "auto_recharge": None if recharge is None else bool(recharge),
        "charge_limit_percent": _percent(charging.get("charge_limit_percent")),
    }


#: Normalised ``charging`` keys and the cloud schedule (getAppointment 190) fields
#: they are completed from.
_CLOUD_FIELDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("charging_planned_enabled", ("chargeEnable", "charge_enable", "isEnable")),
    ("charging_planned_start", ("starttime", "start_time", "beginTime")),
    ("charging_planned_end", ("endtime", "end_time", "endTime")),
    ("charging_planned_cycles", ("cycles",)),
    ("charging_planned_circulation", ("circulation",)),
    ("charging_planned_recharge", ("recharge",)),
    ("charge_limit_percent", ("chargesoc", "charge_soc", "percent")),
)


def apply_cloud_schedule(
    charging: dict[str, Any],
    schedule: Any,
    *,
    replace: bool = False,
    source: str = "cloud_schedule",
) -> bool:
    """Complete the ``charging`` block from the cloud's charging schedule.

    Some cars (T03) do not carry the schedule in their status. Only values the
    status left empty are filled in; nothing it reported is replaced. Returns
    whether anything was added.

    ``replace=True`` is for the plan of a command the car has just confirmed:
    it counts until the status, which lags behind, shows it too.
    """
    if not isinstance(schedule, dict) or not schedule:
        return False
    filled = False
    for key, names in _CLOUD_FIELDS:
        if not replace and charging.get(key) not in (None, ""):
            continue
        value = next(
            (schedule[name] for name in names if schedule.get(name) not in (None, "")), None
        )
        if key == "charging_planned_enabled":
            value = _flag(value)
        if value is None:
            continue
        charging[key] = value
        filled = True
    if filled:
        charging["charging_plan_source"] = source
    return filled


#: What only the cloud's schedule says about a plan; the start time and the
#: on/off state are left out.
_CLOUD_ONLY_KEYS = (
    "charging_planned_end",
    "charging_planned_cycles",
    "charging_planned_circulation",
    "charging_planned_recharge",
)


def apply_vehicle_start(charging: dict[str, Any], vehicle_start: Any) -> bool:
    """Show the start time the car itself reports instead of the cloud's copy.

    A T03 reports the start time set on its own screen (its schedule is a
    switch and a start time) but not whether the schedule is on, so the time
    is only shown once the cloud's schedule has supplied that. The cloud keeps
    the plan of the last command it was sent and does not follow a change made
    in the car. When its start time differs from the car's, it is not the plan
    the car runs: its end time and weekdays are then not shown as the car's.
    Returns whether anything changed.
    """
    start = parse_time(vehicle_start)
    if start is None or charging.get("charging_planned_enabled") in (None, ""):
        return False
    shown = charging.get("charging_planned_start")
    if parse_time(shown) == start:
        return False
    charging["charging_planned_start"] = start.strftime("%H:%M")
    if shown not in (None, ""):
        for key in _CLOUD_ONLY_KEYS:
            charging[key] = None
    charging["charging_plan_source"] = "vehicle_start"
    return True


#: Without these the schedule of a car is not known from its status alone.
PLAN_KEYS = (
    "charging_planned_enabled",
    "charging_planned_start",
    "charging_planned_end",
    "charging_planned_cycles",
)


def plan_is_reported(charging: dict[str, Any] | None) -> bool:
    """Return whether the status already carries the whole schedule."""
    charging = charging or {}
    return all(charging.get(key) not in (None, "") for key in PLAN_KEYS)


__all__ = [
    "ALL_DAYS",
    "DAY_NAMES",
    "apply_cloud_schedule",
    "apply_vehicle_start",
    "plan_is_reported",
    "build_schedule_command",
    "format_cycles",
    "normalize_days",
    "normalize_time",
    "parse_cycles",
    "parse_time",
    "schedule_view",
]
