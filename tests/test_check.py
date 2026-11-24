"""Quick check of custom_components resolution."""

from __future__ import annotations

import pathlib

from homeassistant import loader
from homeassistant.core import HomeAssistant


async def test_check(hass: HomeAssistant) -> None:
    """Print custom_components resolution."""
    import custom_components

    print("module file:", custom_components.__file__)
    print("path:", list(custom_components.__path__))
    repo = pathlib.Path(custom_components.__path__[0]) / "custom_shopping_and_debt_list"
    print("repo integration dir exists:", repo.exists())
    cache = hass.data.get(loader.DATA_CUSTOM_COMPONENTS)
    print("cache:", cache)
