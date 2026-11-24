"""Options flow for custom_shopping_and_debt_list.

Allows the user to:
  * Add a custom "other" debt category not in the default set.
  * Reset / clear the shopping and debt lists.
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import DATA_DEBT, DATA_SHOPPING, DOMAIN

_LOGGER = logging.getLogger(__name__)

ACTION_SELECT = "action"

OPTION_SCHEMA = vol.Schema(
    {
        vol.Required(ACTION_SELECT, default="clear_shopping"): vol.In(
            ["add_category", "clear_shopping", "clear_debt", "reset_all"]
        ),
        vol.Optional("kategori", default=""): str,
    }
)


class NdlongShopOptionsFlow(config_entries.OptionsFlow):
    """Handle options for custom_shopping_and_debt_list."""

    def __init__(self) -> None:
        """Options flow does not need constructor arguments in modern HA."""

    @property
    def _data(self) -> dict[str, Any]:
        """Return the live store data dict."""
        store = self.hass.data.get(DOMAIN, {})
        if isinstance(store, dict):
            data = store.get("data")
            if isinstance(data, dict):
                return data
        return {}

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        """Show the options form."""
        if user_input is not None:
            action = user_input.get(ACTION_SELECT)
            message = ""
            if action == "add_category":
                message = self._add_category(user_input.get("kategori", ""))
            elif action == "reset_all":
                self._reset_all()
                message = "Semua data dihapus."
            elif action == "clear_debt":
                self._clear_debt()
                message = "Debt list dikosongkan."
            elif action == "clear_shopping":
                self._clear_shopping()
                message = "Shopping list dikosongkan."

            return self.async_show_form(
                step_id="init",
                data_schema=OPTION_SCHEMA,
                description_placeholders={"msg": message},
            )

        return self.async_show_form(
            step_id="init",
            data_schema=OPTION_SCHEMA,
            description_placeholders={"msg": ""},
        )

    async def async_step_add_category(
        self, user_input: dict[str, Any] | None = None
    ):
        """Add a custom debt category."""
        if user_input is not None:
            kategori = str(user_input.get("kategori", "")).strip()
            message = self._add_category(kategori)
            return self.async_show_form(
                step_id="init",
                data_schema=OPTION_SCHEMA,
                description_placeholders={"msg": message},
            )

        return self.async_show_form(
            step_id="add_category",
            data_schema=vol.Schema({vol.Required("kategori", default=""): str}),
            description_placeholders={"msg": ""},
        )

    # ------------------------------------------------------------------
    def _add_category(self, kategori: str) -> str:
        """Register a custom debt category (stored in the integration data)."""
        name = str(kategori or "").strip()
        if not name:
            return "Kategori kosong - tidak ada perubahan."
        slot = self.hass.data.get(DOMAIN, {})
        cats = slot.get("debt_categories")
        if not isinstance(cats, list):
            cats = []
        if name not in cats:
            cats.append(name)
            slot["debt_categories"] = cats
        return f"Kategori '{name}' ditambahkan."

    def _reset_all(self) -> None:
        """Clear both lists."""
        self._clear_shopping()
        self._clear_debt()

    def _clear_debt(self) -> None:
        """Clear the debt list."""
        data = self._data
        if isinstance(data.get(DATA_DEBT), list):
            data[DATA_DEBT] = []

    def _clear_shopping(self) -> None:
        """Clear the shopping list."""
        data = self._data
        if isinstance(data.get(DATA_SHOPPING), list):
            data[DATA_SHOPPING] = []

    @callback
    def _async_save(self) -> None:
        """Persist the store after an options change."""
        slot = self.hass.data.get(DOMAIN, {})
        store = slot.get("store")
        data = slot.get("data")
        if store is None or not isinstance(data, dict):
            return
        self.hass.async_create_task(store.async_save(data))
