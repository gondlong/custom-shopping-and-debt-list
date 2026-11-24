"""custom_shopping_and_debt_list integration.

Active custom integration providing a shopping list (add/remove/done/clear)
and a debt list (kategori listrik / internet / uang makan / utang teman /
"other", with a total debt) plus a Lovelace custom card.

Data is persisted in Home Assistant Store (HA database), so it is included in
HA backups and survives restarts and upgrades.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

try:  # HA >= 2026.4 moved Store to helpers.storage
    from homeassistant.helpers.storage import Store
except ImportError:  # pragma: no cover - older HA
    from homeassistant.helpers.store import Store  # type: ignore[no-redef]

from .const import DATA_DEBT, DATA_SHOPPING, DOMAIN
from .services import register_services

_LOGGER = logging.getLogger(__name__)

VERSION = 1
MIN_HA_VERSION = "2024.11.0"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up custom_shopping_and_debt_list from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # --- data store (persisted in HA Store) ---
    store = hass.data[DOMAIN].get("store")
    if store is None:
        store = Store(hass, VERSION, f"{DOMAIN}/data.json", atomic_writes=True)
        hass.data[DOMAIN]["store"] = store
    data = await store.async_load()
    if not isinstance(data, dict):
        data = {DATA_SHOPPING: [], DATA_DEBT: []}
        await store.async_save(data)
    data.setdefault(DATA_SHOPPING, [])
    data.setdefault(DATA_DEBT, [])
    hass.data[DOMAIN]["data"] = data
    hass.data[DOMAIN].setdefault("debt_categories", [])

    # --- services ---
    register_services(hass)

    # --- sensor platform ---
    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])

    _LOGGER.info("custom_shopping_and_debt_list setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, ["sensor"])
    if unloaded:
        hass.data.pop(DOMAIN, None)
    return unloaded
