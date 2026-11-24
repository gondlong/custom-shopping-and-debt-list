"""Sensors for custom_shopping_and_debt_list.

Entities:
  * sensor.custom_shopping_and_debt_list_shopping_list  -> text summary of the shopping list
  * sensor.custom_shopping_and_debt_list_debt_total     -> number, the total debt amount
  * sensor.custom_shopping_and_debt_list_debt_list      -> count of debt entries (list in attributes)
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN
from .store import debt_by_kategori, debt_total, read_debt, read_shopping

_LOGGER = logging.getLogger(__name__)


def _data(hass: HomeAssistant) -> dict[str, Any]:
    """Return the live store data dict."""
    slot = hass.data.get(DOMAIN, {})
    if isinstance(slot, dict):
        data = slot.get("data")
        if isinstance(data, dict):
            return data
    return {}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the sensors from a config entry."""
    entities = [
        SensorShoppingList(hass),
        SensorDebtTotal(hass),
        SensorDebtList(hass),
        SensorDebtByKategori(hass),
    ]
    # Keep a reference so services can refresh the state after a change.
    slot = hass.data.setdefault(DOMAIN, {})
    slot["entities"] = entities
    async_add_entities(entities)


# ------------------------------------------------------------------ summary

class SensorShoppingList(SensorEntity, RestoreEntity):
    """Sensor that summarises the shopping list."""

    _attr_has_entity_name = False
    _attr_name = "Ndlong Shop - Shopping List"
    _attr_unique_id = "custom_shopping_and_debt_list_shopping_list"
    _attr_icon = "mdi:shopping-cart"

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    @property
    def state(self) -> str:
        """Return the shopping list as a readable string."""
        items = read_shopping(_data(self.hass))
        if not items:
            return "kosong"
        parts = []
        for it in items:
            qty = f" x{it.get('qty')}" if it.get("qty") else ""
            done = " ✅" if it.get("done") else ""
            parts.append(f"{it.get('name')}{qty}{done}")
        return " | ".join(parts)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the raw list as attributes."""
        items = read_shopping(_data(self.hass))
        return {
            "count": len(items),
            "item_ids": [it.get("id") for it in items],
            "list": [dict(it) for it in items],
        }


# ------------------------------------------------------------------ total

class SensorDebtTotal(SensorEntity, RestoreEntity):
    """Sensor that holds the total debt."""

    _attr_has_entity_name = False
    _attr_name = "Ndlong Shop - Total Debt"
    _attr_unique_id = "custom_shopping_and_debt_list_debt_total"
    _attr_icon = "mdi:account-cash"

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    @property
    def state(self) -> float:
        """Return the total debt amount."""
        return debt_total(_data(self.hass))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the per-category breakdown."""
        return {"by_kategori": debt_by_kategori(_data(self.hass))}


# ------------------------------------------------------------------ list

class SensorDebtList(SensorEntity, RestoreEntity):
    """Expose the full debt list with due dates.

    state:        count of debt entries
    attributes:   debt_list (raw entries), by_kategori (totals per category)
    """

    _attr_has_entity_name = False
    _attr_name = "Ndlong Shop - Debt List"
    _attr_unique_id = "custom_shopping_and_debt_list_debt_list"
    _attr_icon = "mdi:account-cash-multiple"

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    @property
    def state(self) -> int:
        """Return the number of debt entries."""
        return len(read_debt(_data(self.hass)))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the raw debt entries."""
        return {
            "debt_list": read_debt(_data(self.hass)),
            "by_kategori": debt_by_kategori(_data(self.hass)),
        }


# ------------------------------------------------------------------ per-category

class SensorDebtByKategori(SensorEntity, RestoreEntity):
    """Sensor: debt broken down by category (JSON)."""

    _attr_has_entity_name = False
    _attr_name = "Ndlong Shop - Debt by Category"
    _attr_unique_id = "custom_shopping_and_debt_list_debt_by_kategori"
    _attr_icon = "mdi:pie-chart"

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    @property
    def state(self) -> str:
        """Return the breakdown as a JSON string."""
        import json

        return json.dumps(debt_by_kategori(_data(self.hass)), ensure_ascii=False)
