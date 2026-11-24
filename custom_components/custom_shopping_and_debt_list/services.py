"""Service handlers for custom_shopping_and_debt_list.

All services mutate the HA Store's data dict and immediately call
:meth:`~homeassistant.helpers.store.Store.async_save` so the change is
persisted before the service returns. Sensors are then refreshed so the
Lovelace card updates without a page reload.
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv

from .const import (
    DATA_DEBT,
    DATA_SHOPPING,
    DOMAIN,
    SERVICE_ADD_DEBT,
    SERVICE_ADD_SHOPPING,
    SERVICE_CLEAR_DEBT,
    SERVICE_CLEAR_SHOPPING,
    SERVICE_REMOVE_DEBT,
    SERVICE_REMOVE_SHOPPING,
    SERVICE_TOGGLE_SHOPPING,
)
from .store import (
    add_debt_entry,
    add_shopping_item,
    clear_debt,
    clear_shopping,
    remove_debt_entry,
    remove_shopping_item,
    toggle_shopping_item,
)

_LOGGER = logging.getLogger(__name__)


def _slot(hass: HomeAssistant) -> dict[str, Any] | None:
    """Return the integration data slot, or None if not set up."""
    slot = hass.data.get(DOMAIN)
    if not isinstance(slot, dict):
        return None
    return slot


def _store_and_data(hass: HomeAssistant) -> tuple[Any, dict[str, Any]] | None:
    """Return (store, data) or None if not set up yet."""
    slot = _slot(hass)
    if not slot:
        return None
    store = slot.get("store")
    data = slot.get("data")
    if store is None or not isinstance(data, dict):
        return None
    return store, data


async def _persist(hass: HomeAssistant, store: Any, data: dict[str, Any]) -> None:
    """Persist the store and refresh the sensors."""
    try:
        await store.async_save(data)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("custom_shopping_and_debt_list: failed to persist store")
    _refresh_entities(hass)


def _refresh_entities(hass: HomeAssistant) -> None:
    """Write the new state of every sensor entity."""
    slot = _slot(hass)
    if not slot:
        return
    for entity in slot.get("entities", []):
        try:
            entity.async_write_ha_state()
        except Exception:  # noqa: BLE001
            _LOGGER.debug("custom_shopping_and_debt_list: could not refresh entity")


# ---------------------------------------------------------------------
# Shopping
# ---------------------------------------------------------------------

async def async_service_add_shopping(call: ServiceCall) -> None:
    """Add an item to the shopping list."""
    data = call.data or {}
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    name = str(data.get("name") or "").strip()
    if not name:
        _LOGGER.warning("custom_shopping_and_debt_list_add_shopping: name empty - ignored")
        return
    add_shopping_item(
        cur,
        name=name,
        qty=str(data.get("qty") or ""),
        cat=str(data.get("cat") or "Kebutuhan"),
    )
    await _persist(call.hass, store, cur)
    _LOGGER.info("Added shopping item: %r", name)


async def async_service_remove_shopping(call: ServiceCall) -> None:
    """Remove an item from the shopping list."""
    data = call.data or {}
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    item_id = str(data.get("item_id") or data.get("id") or "").strip()
    if not item_id:
        _LOGGER.warning("custom_shopping_and_debt_list_remove_shopping: item_id missing")
        return
    if remove_shopping_item(cur, item_id):
        await _persist(call.hass, store, cur)
        _LOGGER.info("Removed shopping item: %s", item_id)


async def async_service_toggle_shopping(call: ServiceCall) -> None:
    """Toggle the done flag of a shopping item."""
    data = call.data or {}
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    item_id = str(data.get("item_id") or data.get("id") or "").strip()
    if not item_id:
        _LOGGER.warning("custom_shopping_and_debt_list_toggle_shopping: item_id missing")
        return
    if toggle_shopping_item(cur, item_id):
        await _persist(call.hass, store, cur)
        _LOGGER.info("Toggled shopping item: %s", item_id)


async def async_service_clear_shopping(call: ServiceCall) -> None:
    """Clear the shopping list."""
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    clear_shopping(cur)
    await _persist(call.hass, store, cur)
    _LOGGER.info("Cleared shopping list")


# ---------------------------------------------------------------------
# Debt
# ---------------------------------------------------------------------

async def async_service_add_debt(call: ServiceCall) -> None:
    """Add a debt entry."""
    data = call.data or {}
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    kategori = str(data.get("kategori") or "").strip()
    if not kategori:
        _LOGGER.warning("custom_shopping_and_debt_list_add_debt: kategori empty - ignored")
        return
    add_debt_entry(
        cur,
        kategori=kategori,
        nominal=str(data.get("nominal") or ""),
        catatan=str(data.get("catatan") or ""),
        due_date=str(data.get("due_date") or ""),
    )
    await _persist(call.hass, store, cur)
    _LOGGER.info("Added debt: %r %s", kategori, data.get("nominal"))


async def async_service_remove_debt(call: ServiceCall) -> None:
    """Remove a debt entry."""
    data = call.data or {}
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    entry_id = str(data.get("entry_id") or data.get("id") or "").strip()
    if not entry_id:
        _LOGGER.warning("custom_shopping_and_debt_list_remove_debt: entry_id missing")
        return
    if remove_debt_entry(cur, entry_id):
        await _persist(call.hass, store, cur)
        _LOGGER.info("Removed debt entry: %s", entry_id)


async def async_service_clear_debt(call: ServiceCall) -> None:
    """Clear the debt list."""
    store, cur = _store_and_data(call.hass)
    if cur is None:
        return
    clear_debt(cur)
    await _persist(call.hass, store, cur)
    _LOGGER.info("Cleared debt list")


# ---------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------

ADD_SHOPPING_SCHEMA = vol.Schema(
    {
        vol.Required("name"): cv.string,
        vol.Optional("qty"): cv.string,
        vol.Optional("cat"): cv.string,
    }
)

REMOVE_SHOPPING_SCHEMA = vol.Schema(
    {
        vol.Required("item_id"): cv.string,
    }
)

TOGGLE_SHOPPING_SCHEMA = vol.Schema(
    {
        vol.Required("item_id"): cv.string,
    }
)

CLEAR_SHOPPING_SCHEMA = vol.Schema({})

ADD_DEBT_SCHEMA = vol.Schema(
    {
        vol.Required("kategori"): cv.string,
        vol.Required("nominal"): cv.string,
        vol.Optional("catatan"): cv.string,
        vol.Optional("due_date"): cv.string,
    }
)

REMOVE_DEBT_SCHEMA = vol.Schema(
    {
        vol.Required("entry_id"): cv.string,
    }
)

CLEAR_DEBT_SCHEMA = vol.Schema({})


def register_services(hass: HomeAssistant) -> None:
    """Register every custom_shopping_and_debt_list service on the HA instance."""
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_SHOPPING, async_service_add_shopping,
        schema=ADD_SHOPPING_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_SHOPPING, async_service_remove_shopping,
        schema=REMOVE_SHOPPING_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_TOGGLE_SHOPPING, async_service_toggle_shopping,
        schema=TOGGLE_SHOPPING_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR_SHOPPING, async_service_clear_shopping,
        schema=CLEAR_SHOPPING_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_DEBT, async_service_add_debt,
        schema=ADD_DEBT_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_DEBT, async_service_remove_debt,
        schema=REMOVE_DEBT_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR_DEBT, async_service_clear_debt,
        schema=CLEAR_DEBT_SCHEMA,
    )
