"""Config flow for custom_shopping_and_debt_list.

The integration is passive (no device discovery). The flow simply creates an
entry so the integration is "turned on". The actual data (shopping list,
debt list) is managed through services and sensors described in this package.
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_SCHEMA = vol.Schema(
    {
        vol.Required("confirm", default=True): bool,
    }
)


async def async_get_options_flow(
    config_entry: config_entries.ConfigEntry,
) -> config_entries.OptionsFlow:
    """Return the options flow handler."""
    # Imported here to avoid a circular import at module load time.
    from .options import NdlongShopOptionsFlow

    return NdlongShopOptionsFlow()


class ShoppingAndDebtConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for custom_shopping_and_debt_list."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        """Show the on/off form."""
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")

        if user_input is not None:
            return self.async_create_entry(
                title="Custom Shopping and Debt List",
                data={},
            )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_SCHEMA,
            description_placeholders={
                "name": "Custom Shopping and Debt List",
                "note": (
                    "Klik Submit untuk mengaktifkan integrasi. "
                    "Data disimpan di HA Store (ikut backup)."
                ),
            },
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        """Return the options flow handler (legacy class-level hook)."""
        from .options import NdlongShopOptionsFlow

        return NdlongShopOptionsFlow()
