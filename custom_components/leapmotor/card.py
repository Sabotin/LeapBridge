"""Serve and auto-load the bundled Leapmotor dashboard card.

The card lives in ``frontend/`` next to this module. It is exposed as a static
path and added to the Home Assistant frontend as an extra module, so users can
add ``type: custom:leapmotor-card`` without registering a Lovelace resource.
The card is purely cosmetic: any failure here is logged and never blocks the
vehicle integration from loading.
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers.start import async_at_started

_LOGGER = logging.getLogger(__name__)

CARD_URL_BASE = "/leapmotor_static"
CARD_FILENAME = "leapmotor-card.js"
FRONTEND_DIR = Path(__file__).parent / "frontend"
DATA_CARD = "leapmotor_card_registered"


def _card_version() -> str:
    """Return a cache-busting token derived from the card file."""
    try:
        return str(int((FRONTEND_DIR / CARD_FILENAME).stat().st_mtime))
    except OSError:
        return "0"


async def async_register_card(hass: HomeAssistant) -> None:
    """Register the card once per Home Assistant run."""
    if hass.data.get(DATA_CARD):
        return
    hass.data[DATA_CARD] = True

    async def _register(_hass: HomeAssistant | None = None) -> None:
        if getattr(hass, "http", None) is None or "frontend" not in hass.config.components:
            _LOGGER.debug("Frontend not loaded; the Leapmotor card is not registered")
            return
        try:
            from homeassistant.components.frontend import add_extra_js_url
            from homeassistant.components.http import StaticPathConfig

            version = await hass.async_add_executor_job(_card_version)
            await hass.http.async_register_static_paths(
                [StaticPathConfig(CARD_URL_BASE, str(FRONTEND_DIR), False)]
            )
            add_extra_js_url(hass, f"{CARD_URL_BASE}/{CARD_FILENAME}?v={version}")
        except Exception:  # noqa: BLE001 - cosmetic feature, never break setup
            _LOGGER.warning("Could not register the Leapmotor dashboard card", exc_info=True)
            return
        _LOGGER.debug("Registered Leapmotor dashboard card at %s", CARD_URL_BASE)

    if "frontend" in hass.config.components:
        await _register()
    else:
        async_at_started(hass, _register)
