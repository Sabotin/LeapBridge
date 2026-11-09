"""Serve the bundled Leapmotor dashboard and add it to the sidebar.

The card lives in ``frontend/`` next to this module. It is exposed as a static
path and added to the Home Assistant frontend as an extra module, so users can
add ``type: custom:leapmotor-card`` without registering a Lovelace resource.
A "Leapmotor" sidebar panel showing the full dashboard is added as well
(plug and play); it can be switched off in the integration options.

This is purely cosmetic: any failure here is logged and never blocks the
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
PANEL_URL_PATH = "leapmotor"
PANEL_ELEMENT = "leapmotor-panel"
PANEL_TITLE = "Leapmotor"
PANEL_ICON = "mdi:car-electric"

DATA_CARD = "leapmotor_card_registered"
DATA_CARD_URL = "leapmotor_card_url"
DATA_PANEL = "leapmotor_panel_registered"
DATA_WANT_PANEL = "leapmotor_panel_wanted"


def _card_version() -> str:
    """Return a cache-busting token derived from the card file."""
    try:
        return str(int((FRONTEND_DIR / CARD_FILENAME).stat().st_mtime))
    except OSError:
        return "0"


def _frontend_ready(hass: HomeAssistant) -> bool:
    return getattr(hass, "http", None) is not None and "frontend" in hass.config.components


async def async_setup_frontend(hass: HomeAssistant, *, show_panel: bool = True) -> None:
    """Register the card once, then add or remove the sidebar panel."""
    hass.data[DATA_WANT_PANEL] = show_panel
    if hass.data.get(DATA_CARD):
        await _async_sync_panel(hass)
        return
    hass.data[DATA_CARD] = True

    async def _register(_hass: HomeAssistant | None = None) -> None:
        if not _frontend_ready(hass):
            _LOGGER.debug("Frontend not loaded; the Leapmotor dashboard is not registered")
            return
        try:
            from homeassistant.components.frontend import add_extra_js_url
            from homeassistant.components.http import StaticPathConfig

            version = await hass.async_add_executor_job(_card_version)
            url = f"{CARD_URL_BASE}/{CARD_FILENAME}?v={version}"
            await hass.http.async_register_static_paths(
                [StaticPathConfig(CARD_URL_BASE, str(FRONTEND_DIR), False)]
            )
            add_extra_js_url(hass, url)
            hass.data[DATA_CARD_URL] = url
        except Exception:  # noqa: BLE001 - cosmetic feature, never break setup
            _LOGGER.warning("Could not register the Leapmotor dashboard card", exc_info=True)
            return
        _LOGGER.debug("Registered Leapmotor dashboard card at %s", CARD_URL_BASE)
        await _async_sync_panel(hass)

    if "frontend" in hass.config.components:
        await _register()
    else:
        async_at_started(hass, _register)


# Kept for callers of the previous name.
async def async_register_card(hass: HomeAssistant) -> None:
    await async_setup_frontend(hass)


async def async_remove_panel(hass: HomeAssistant) -> None:
    """Remove the sidebar panel (last config entry unloaded)."""
    hass.data[DATA_WANT_PANEL] = False
    await _async_sync_panel(hass)


async def _async_sync_panel(hass: HomeAssistant) -> None:
    """Make the sidebar panel match the wanted state."""
    url = hass.data.get(DATA_CARD_URL)
    if not url or not _frontend_ready(hass):
        return
    wanted = bool(hass.data.get(DATA_WANT_PANEL))
    registered = bool(hass.data.get(DATA_PANEL))
    try:
        if wanted and not registered:
            from homeassistant.components import panel_custom

            await panel_custom.async_register_panel(
                hass,
                frontend_url_path=PANEL_URL_PATH,
                webcomponent_name=PANEL_ELEMENT,
                sidebar_title=PANEL_TITLE,
                sidebar_icon=PANEL_ICON,
                module_url=url,
                embed_iframe=False,
                require_admin=False,
                config={},
            )
            hass.data[DATA_PANEL] = True
        elif not wanted and registered:
            from homeassistant.components.frontend import async_remove_panel as remove

            remove(hass, PANEL_URL_PATH)
            hass.data[DATA_PANEL] = False
    except Exception:  # noqa: BLE001 - cosmetic feature, never break setup
        _LOGGER.warning("Could not update the Leapmotor sidebar panel", exc_info=True)
