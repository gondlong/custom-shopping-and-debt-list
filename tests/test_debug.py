"""Debug the custom component discovery."""

from __future__ import annotations

import logging
import sys

from homeassistant import loader
from homeassistant.core import HomeAssistant

LOG = logging.getLogger("homeassistant.loader")


async def test_debug(hass: HomeAssistant) -> None:
    """Print discovery info."""
    import custom_components

    print("custom_components module file:", custom_components.__file__)
    print("config_dir:", __import__("homeassistant").config.config_dir)
    print("sys.path in test:", sys.path[:3])

    real = loader._get_custom_components

    def patched(*args, **kwargs):
        print("patched _get_custom_components called, sys.path:", sys.path[:2])
        try:
            r = real(*args, **kwargs)
            print("loader returned:", r)
            return r
        except Exception as e:  # noqa: BLE001
            print("loader RAISED:", repr(e))
            import traceback

            traceback.print_exc()
            raise

    loader._get_custom_components = patched
    try:
        hass.data.pop(loader.DATA_CUSTOM_COMPONENTS, None)
        comps = await loader.async_get_custom_components(hass)
    finally:
        loader._get_custom_components = real
    print("comps:", comps)
