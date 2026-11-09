"""Pick the maintenance schedule for a vehicle from the bundled packs.

The packs come from LeapConnect's community repository
(https://github.com/markoceri/leapconnect-maintenance-packs, MIT licence) and
are bundled in ``maintenance_packs.json``. No Home Assistant imports.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

CATALOG_PATH = Path(__file__).with_name("maintenance_packs.json")
COMMON_PACK = "common-consumables"
SEVERE_PACKS = {"C10": "c10-severe-use", "T03": "t03-city-use"}
GENERIC_MODEL = "C10"


def load_catalog(path: Path = CATALOG_PATH) -> dict[str, Any]:
    """Read the bundled catalog (call from an executor in Home Assistant)."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"packs": {}}
    return data if isinstance(data.get("packs"), dict) else {"packs": {}}


def model_key(car_type: Any, is_reev: bool) -> str:
    base = str(car_type or "").strip().upper()
    return f"{base}_REEV" if is_reev and base == "C10" else base


def items_for_vehicle(
    catalog: dict[str, Any], car_type: Any, *, is_reev: bool = False, severe_use: bool = False
) -> tuple[str, list[dict[str, Any]]]:
    """Return (schedule name, items) for a model.

    Uses the official factory pack for the exact model (C10 and C10 REEV
    differ), plus common consumables. Models without an official pack get the
    generic C10 EV schedule. ``severe_use`` overlays the model's severe/city
    pack where one exists; same service types take the shorter intervals.
    """
    packs = catalog.get("packs") or {}
    key = model_key(car_type, is_reev)
    official = packs.get(f"official-{key.lower()}")
    schedule = key
    if official is None:
        official = packs.get(f"official-{GENERIC_MODEL.lower()}")
        schedule = f"{key or 'unknown'} (generic EV schedule)"
    by_type: dict[str, dict[str, Any]] = {}
    for pack in (official, packs.get(COMMON_PACK)):
        for item in (pack or {}).get("items") or []:
            by_type.setdefault(item["service_type"], dict(item))
    if severe_use:
        severe = packs.get(SEVERE_PACKS.get(key.split("_")[0], ""))
        for item in (severe or {}).get("items") or []:
            by_type[item["service_type"]] = dict(item)
        if severe:
            schedule = f"{schedule} + {severe.get('name')}"
    return schedule, list(by_type.values())
