"""Normalise the extra read-only data the Leapmotor cloud offers.

Installed software and pending OTA updates, the message inbox, the charging
history, the daily mileage history, climate and preparation schedules, what
this account is allowed to do, and car-share invitations.

The endpoints and field names follow leapmotor-api 0.6.0 by Marco Mancino
(https://github.com/markoceri/leapmotor-api, AGPL-3.0), the client library
behind LeapConnect.

No Home Assistant or network imports: every function takes the decoded
``data`` of a cloud response and returns plain dicts and lists, so the module
can be tested on its own. Nothing here keeps a signed download link, an
e-mail address or a phone number.
"""

from __future__ import annotations

import math
from datetime import UTC, date, datetime, time as dt_time, timedelta
from typing import Any

MAX_MESSAGES = 30
MAX_MESSAGE_CHARS = 600
MAX_CHARGE_RECORDS = 200
MAX_NOTE_SECTIONS = 20
MAX_NOTE_CHARS = 1500
MAX_SCHEDULE_ENTRIES = 20

#: ``rightList`` codes of the international app (remote commands).
RIGHT_NAMES: dict[int, str] = {
    110: "lock",
    120: "find_car",
    130: "trunk",
    140: "hotspot",
    150: "autopark",
    160: "sunroof",
    161: "sunshade",
    170: "climate",
    171: "quick_climate",
    180: "send_destination",
    190: "battery_preheat",
    192: "unlock_charger",
    193: "start_stop_charging",
    220: "sentry_mode",
    230: "windows",
    240: "skylight",
    270: "music",
    280: "seat_adjust",
    290: "video",
    301: "seat_heat",
    320: "steering_wheel_heat",
    340: "charge_limit",
    350: "piloted_parking",
    360: "prepare_car",
    361: "prepare_car_schedule",
    370: "seat_ventilation",
    380: "fuel_heating",
    390: "software_download",
    391: "software_install",
    392: "software_install_schedule",
    410: "on3",
    430: "bluetooth_key_restart",
    440: "mirror_heat",
    460: "windshield_defrost",
    470: "rear_seats",
    480: "healthy_charging",
    510: "speed_limit",
}

#: ``moduleRights`` codes (the groups an owner can share).
MODULE_RIGHT_NAMES: dict[int, str] = {
    100: "basic",
    200: "vehicle_control",
    300: "location",
    400: "mileage_energy",
}

#: ``abilities`` codes (what the car's hardware and firmware support).
ABILITY_NAMES: dict[int, str] = {
    1: "base",
    2: "status_data",
    3: "trunk",
    4: "autopark",
    5: "gps",
    6: "climate",
    7: "battery_detail",
    8: "air_recirculation",
    9: "climate_schedule",
    10: "remote_lock",
    11: "find_car",
    12: "windows",
    14: "seat_heating",
    15: "steering_wheel_heat",
    16: "bluetooth_key",
    17: "quick_climate",
    18: "windshield_defrost",
    19: "rear_seat_heating",
    21: "front_seat_heating",
    25: "scheduled_charging",
    26: "weekly_charging",
    27: "tire_pressure",
    30: "location_sharing",
    31: "mileage_energy",
    34: "speed_limit",
    35: "charge_limit",
    36: "windows",
    38: "prepare_car",
    40: "fuel_heating",
    42: "driver_seat_ventilation",
    43: "passenger_seat_ventilation",
    48: "unlock_charger",
    49: "parking_photo",
    50: "sentry_mode",
    52: "send_destination",
    53: "bluetooth_key_restart",
}


def _float(value: Any) -> float | None:
    if value is None or isinstance(value, bool) or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _int(value: Any) -> int | None:
    number = _float(value)
    return int(number) if number is not None else None


def _text(value: Any, limit: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def epoch_seconds(value: Any) -> float | None:
    """Seconds since the epoch from a cloud timestamp in s or ms."""
    number = _float(value)
    if number is None or number <= 0:
        return None
    if number > 10_000_000_000:
        number /= 1000.0
    return number


def iso_utc(seconds: float | None) -> str | None:
    """ISO 8601 in UTC, or None for a missing or impossible time."""
    if seconds is None:
        return None
    try:
        return datetime.fromtimestamp(seconds, tz=UTC).isoformat(timespec="seconds")
    except (ValueError, OverflowError, OSError):
        return None


# --- Software (OTA) -----------------------------------------------------------


def _release_notes(version: dict[str, Any]) -> dict[str, list[dict[str, str | None]]]:
    notes: dict[str, list[dict[str, str | None]]] = {}
    for entry in version.get("logJsonMultiLang") or []:
        if not isinstance(entry, dict):
            continue
        language = _text(entry.get("language"), 16)
        if not language:
            continue
        sections = [
            {
                "title": _text(item.get("title"), 200),
                "content": _text(item.get("content"), MAX_NOTE_CHARS),
            }
            for item in (entry.get("data") or [])[:MAX_NOTE_SECTIONS]
            if isinstance(item, dict)
        ]
        sections = [s for s in sections if s["title"] or s["content"]]
        if sections:
            notes[language] = sections
    return notes


def pick_release_notes(
    notes: dict[str, list[dict[str, str | None]]], language: str | None
) -> tuple[str | None, list[dict[str, str | None]]]:
    """Release notes as the official app picks them.

    The exact language code first, then the same language for another
    country, then English, then whatever is there.
    """
    if not notes:
        return None, []
    wanted = (language or "en").replace("_", "-")
    for code in notes:
        if code.lower() == wanted.lower():
            return code, notes[code]
    for prefix in (wanted.split("-")[0].lower(), "en"):
        for code in notes:
            if code.split("-")[0].lower() == prefix:
                return code, notes[code]
    code = next(iter(notes))
    return code, notes[code]


def normalize_software_info(data: Any, language: str | None = None) -> dict[str, Any]:
    """Installed version and the update waiting to be installed, if any."""
    data = data if isinstance(data, dict) else {}
    current = data.get("currentVersion") if isinstance(data.get("currentVersion"), dict) else {}
    new = data.get("newVersion") if isinstance(data.get("newVersion"), dict) else {}
    installed = _text(current.get("generalVersion"), 60)
    latest = _text(new.get("generalVersion"), 60)
    update_available = bool(latest) and latest != installed
    packages = [p for p in (new.get("updateItemList") or []) if isinstance(p, dict)]
    size = sum(_float(p.get("fileSize")) or 0.0 for p in packages)
    source = new if update_available else current
    notes_language, notes = pick_release_notes(_release_notes(source), language)
    return {
        "available": bool(installed or latest),
        "reason": None if (installed or latest) else "no_data",
        "installed_version": installed,
        "installed_at": iso_utc(epoch_seconds(current.get("time"))),
        "update_available": update_available,
        "latest_version": latest if update_available else installed,
        "update_state": _int(new.get("state")) if update_available else None,
        "update_size_mb": round(size / 1_048_576, 1) if update_available and size else None,
        "update_packages": len(packages) if update_available else 0,
        "release_notes": notes,
        "release_notes_language": notes_language,
        "release_notes_for": "latest" if update_available else "installed",
    }


def software_unavailable(reason: str) -> dict[str, Any]:
    """Placeholder when the cloud does not give this account the software info."""
    return {
        "available": False,
        "reason": reason,
        "installed_version": None,
        "installed_at": None,
        "update_available": False,
        "latest_version": None,
        "update_state": None,
        "update_size_mb": None,
        "update_packages": 0,
        "release_notes": [],
        "release_notes_language": None,
        "release_notes_for": "installed",
    }


def release_notes_markdown(software: dict[str, Any] | None) -> str | None:
    """Release notes as Markdown for Home Assistant's update dialog."""
    sections = (software or {}).get("release_notes") or []
    parts: list[str] = []
    for section in sections:
        title, content = section.get("title"), section.get("content")
        if title:
            parts.append(f"### {title}")
        if content:
            parts.append(str(content))
    return "\n\n".join(parts) or None


# --- Messages -----------------------------------------------------------------


def normalize_messages(items: Any, *, limit: int = MAX_MESSAGES) -> list[dict[str, Any]]:
    """The inbox, newest first. Links are left out."""
    if isinstance(items, dict):
        items = items.get("list") or items.get("records") or items.get("rows")
    if not isinstance(items, list):
        return []
    messages: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        seconds = epoch_seconds(item.get("sendTime"))
        title = _text(item.get("title"), 200)
        body = _text(item.get("message"), MAX_MESSAGE_CHARS)
        if not title and not body:
            continue
        read = item.get("readFlag")
        messages.append(
            {
                "id": str(item["id"]) if item.get("id") is not None else None,
                "title": title,
                "message": body,
                "time": iso_utc(seconds),
                "ts": seconds,
                "read": None if read is None else str(read) == "1",
                "type": _int(item.get("msgType")),
                "vin": _text(item.get("vin"), 40),
            }
        )
    messages.sort(key=lambda m: m["ts"] or 0, reverse=True)
    return messages[:limit]


def messages_for_vin(messages: list[dict[str, Any]], vin: str) -> list[dict[str, Any]]:
    """Messages about one car plus the ones that name no car; the VIN is dropped."""
    return [
        {k: v for k, v in message.items() if k != "vin"}
        for message in messages
        if not message.get("vin") or message.get("vin") == vin
    ]


def message_key(message: dict[str, Any]) -> str:
    """Stable identity of a message for 'have I seen this one' checks."""
    if message.get("id"):
        return f"id:{message['id']}"
    return f"t:{message.get('ts')}:{message.get('title')}"


# --- Charging history ---------------------------------------------------------


def _coordinate(value: Any, limit: float) -> float | None:
    number = _float(value)
    if number is None or number == 0 or abs(number) > limit:
        return None
    return round(number, 5)


def normalize_charge_records(items: Any, *, limit: int = MAX_CHARGE_RECORDS) -> list[dict[str, Any]]:
    """Charging sessions the cloud recorded, newest first.

    The cloud keeps them whether or not Home Assistant was running, so they
    also cover the time before the integration was installed.
    """
    if isinstance(items, dict):
        items = items.get("list")
    if not isinstance(items, list):
        return []
    records: list[dict[str, Any]] = []
    seen: set[tuple[float, float | None]] = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        start = epoch_seconds(item.get("chargeGunStartTs"))
        end = epoch_seconds(item.get("chargeGunEndTs"))
        if start is None:
            continue
        if end is not None and end < start:
            end = None
        key = (start, end)
        if key in seen:
            continue
        seen.add(key)
        energy = _float(item.get("chargeInEnergy"))
        if energy is not None and energy < 0:
            energy = None
        duration_h = (end - start) / 3600 if end is not None else None
        raw_type = str(item.get("chargeType") or "").strip()
        lat = _coordinate(item.get("chargeStartLatitude"), 90)
        lon = _coordinate(item.get("chargeStartLongitude"), 180)
        if lat is None or lon is None:
            lat = lon = None
        records.append(
            {
                "start": iso_utc(start),
                "end": iso_utc(end),
                "start_ts": start,
                "end_ts": end,
                "duration_min": round(duration_h * 60, 1) if duration_h is not None else None,
                "energy_kwh": round(energy, 2) if energy is not None else None,
                "type": {"1": "ac", "2": "dc"}.get(raw_type),
                "avg_power_kw": (
                    round(energy / duration_h, 1)
                    if energy is not None and duration_h and duration_h >= 0.05
                    else None
                ),
                "lat": lat,
                "lon": lon,
            }
        )
    records.sort(key=lambda r: r["start_ts"], reverse=True)
    return records[:limit]


# --- Daily mileage and energy -------------------------------------------------


def daily_rows(detail: Any) -> list[dict[str, Any]]:
    """Reduce normalised daily detail rows to date, km, kWh and odometer.

    ``detail`` is the ``daily_detail`` list of
    ``history_helpers.summarize_mileage_energy_detail``, which already applies
    the per-model unit rules (the T03 reports Wh; the B10's daily energy is
    not trustworthy and is left out).
    """
    days: dict[str, dict[str, Any]] = {}
    for row in detail if isinstance(detail, list) else []:
        if not isinstance(row, dict):
            continue
        day = str(row.get("date") or "")[:10]
        km = _float(row.get("mileage_km"))
        if len(day) != 10 or day[4] != "-" or day[7] != "-" or km is None or km < 0:
            continue
        try:
            datetime.strptime(day, "%Y-%m-%d")
        except ValueError:
            continue
        kwh = _float(row.get("energy_kwh"))
        if kwh is not None and kwh < 0:
            kwh = None
        days[day] = {
            "date": day,
            "km": round(km, 1),
            "kwh": round(kwh, 2) if kwh is not None else None,
            "odometer_km": _float(row.get("odometer_km")),
        }
    return [days[day] for day in sorted(days)]


# --- Schedules ----------------------------------------------------------------

_CLIMATE_MODES = {"hot": "heat", "cold": "cool", "nohotcold": "fan"}


def _schedule_days(value: Any) -> list[int]:
    """App weekdays, 0 = Sunday … 6 = Saturday."""
    if isinstance(value, str):
        value = [part for part in value.replace(";", ",").split(",") if part.strip()]
    days: list[int] = []
    for item in value if isinstance(value, list) else []:
        day = _int(item)
        if day is not None and 0 <= day <= 6 and day not in days:
            days.append(day)
    return sorted(days)


def _schedule_time(value: Any) -> str | None:
    """'HH:MM' from the app's '2026-01-31 07:10:00' or '07:10'."""
    text = _text(value, 40)
    if not text:
        return None
    part = text.split(" ")[-1].split("T")[-1]
    pieces = part.split(":")
    if len(pieces) < 2:
        return None
    hours, minutes = _int(pieces[0]), _int(pieces[1])
    if hours is None or minutes is None or not (0 <= hours < 24 and 0 <= minutes < 60):
        return None
    return f"{hours:02d}:{minutes:02d}"


def _schedule_date(value: Any) -> str | None:
    """'YYYY-MM-DD' from the app's '2026-01-31 07:10:00', or None for a bare time."""
    text = _text(value, 40)
    if not text or len(text) < 10:
        return None
    try:
        return date.fromisoformat(text[:10]).isoformat()
    except ValueError:
        return None


def _enabled(*values: Any) -> bool | None:
    for value in values:
        if isinstance(value, bool):
            return value
        if value is not None and str(value).strip() in {"0", "1"}:
            return str(value).strip() == "1"
    return None


def normalize_schedule(controls: Any, kind: str) -> list[dict[str, Any]]:
    """Schedule entries of one kind: 'climate', 'battery_heating' or 'prepare_car'."""
    if isinstance(controls, dict):
        controls = controls.get("controls")
    entries: list[dict[str, Any]] = []
    for item in (controls if isinstance(controls, list) else [])[:MAX_SCHEDULE_ENTRIES]:
        if not isinstance(item, dict):
            continue
        entry: dict[str, Any] = {
            "kind": kind,
            "enabled": _enabled(item.get("on"), item.get("enable")),
            "time": _schedule_time(item.get("start_time")),
            "date": _schedule_date(item.get("start_time")),
            "days": _schedule_days(item.get("days")),
            "id": _text(item.get("set_id"), 80),
        }
        if kind == "climate":
            entry["mode"] = _CLIMATE_MODES.get(str(item.get("mode") or ""), None)
            entry["temperature"] = _int(item.get("temperature"))
            entry["fan_speed"] = _int(item.get("windlevel"))
        elif kind == "prepare_car":
            entry["name"] = _text(item.get("name"), 80)
        entries.append(entry)
    entries.sort(key=lambda e: (e["time"] or "99:99", e["id"] or ""))
    return entries


def next_schedule_run(
    entries: list[dict[str, Any]], now: datetime
) -> dict[str, Any] | None:
    """The next time an enabled entry runs, in ``now``'s timezone.

    An entry without days runs once: on its own date when the cloud gives
    one (it is skipped once that has passed), else at its next start time.
    """
    best: tuple[datetime, dict[str, Any]] | None = None
    for entry in entries or []:
        if entry.get("enabled") is False or not entry.get("time"):
            continue
        hours, minutes = (int(part) for part in entry["time"].split(":"))
        days = entry.get("days") or []
        if not days and entry.get("date"):
            try:
                once = datetime.combine(
                    date.fromisoformat(entry["date"]), dt_time(hours, minutes), tzinfo=now.tzinfo
                )
            except (TypeError, ValueError):
                once = None
            if once is not None:
                if once > now and (best is None or once < best[0]):
                    best = (once, entry)
                continue
        for offset in range(8):
            day = now.date() + timedelta(days=offset)
            # Python: Monday = 0. App: Sunday = 0.
            if days and (day.weekday() + 1) % 7 not in days:
                continue
            candidate = datetime.combine(day, dt_time(hours, minutes), tzinfo=now.tzinfo)
            if candidate <= now:
                continue
            if best is None or candidate < best[0]:
                best = (candidate, entry)
            break
    if best is None:
        return None
    return {
        "at": best[0].isoformat(timespec="seconds"),
        "kind": best[1].get("kind"),
        "time": best[1].get("time"),
        "id": best[1].get("id"),
    }


# --- Permissions --------------------------------------------------------------


def _codes(value: Any) -> list[int]:
    if isinstance(value, str):
        value = value.replace(";", ",").split(",")
    codes: list[int] = []
    for item in value if isinstance(value, (list, tuple)) else []:
        code = _int(item)
        if code is not None and code not in codes:
            codes.append(code)
    return sorted(codes)


def decode_permissions(vehicle: dict[str, Any]) -> dict[str, Any]:
    """What this account may do with the car, as readable names.

    ``rights`` is the list the cloud checks before it accepts a remote
    command; for a shared car it is what the owner granted.
    """
    rights = _codes(vehicle.get("rights"))
    modules = _codes(vehicle.get("module_rights"))
    abilities = _codes(vehicle.get("abilities"))
    return {
        "shared": bool(vehicle.get("is_shared")),
        "rights_known": bool(rights),
        "rights": [RIGHT_NAMES.get(code, f"right_{code}") for code in rights],
        "right_codes": rights,
        "modules": [MODULE_RIGHT_NAMES.get(code, f"module_{code}") for code in modules],
        "abilities": sorted({ABILITY_NAMES.get(code, f"ability_{code}") for code in abilities}),
        "ability_codes": abilities,
    }


# --- Share invitations --------------------------------------------------------


def normalize_share_invitations(items: Any) -> list[dict[str, Any]]:
    """Car-share invitations waiting for this account.

    The owner's e-mail address and phone number are never kept. ``_owner_id``
    and ``_vin`` are needed to answer an invitation and stay out of entity
    attributes and diagnostics.
    """
    invitations: list[dict[str, Any]] = []
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        owner_id = _text(item.get("shareUserid"), 80)
        vin = _text(item.get("carCode"), 40)
        if not owner_id or not vin:
            continue
        invitations.append(
            {
                "car_type": _text(item.get("carType"), 20),
                "car_name": _text(item.get("carAlias"), 80),
                "owner": _text(item.get("nickName"), 80),
                "vin_tail": vin[-6:],
                "shared_at": iso_utc(epoch_seconds(item.get("shareTime"))),
                "expires_at": iso_utc(epoch_seconds(item.get("expireTime"))),
                "_owner_id": owner_id,
                "_vin": vin,
            }
        )
    return invitations


def public_invitation(invitation: dict[str, Any]) -> dict[str, Any]:
    """An invitation without the fields needed to answer it."""
    return {k: v for k, v in invitation.items() if not k.startswith("_")}


__all__ = [
    "ABILITY_NAMES",
    "MODULE_RIGHT_NAMES",
    "RIGHT_NAMES",
    "daily_rows",
    "decode_permissions",
    "epoch_seconds",
    "iso_utc",
    "message_key",
    "messages_for_vin",
    "next_schedule_run",
    "normalize_charge_records",
    "normalize_messages",
    "normalize_schedule",
    "normalize_share_invitations",
    "normalize_software_info",
    "pick_release_notes",
    "public_invitation",
    "release_notes_markdown",
    "software_unavailable",
]
