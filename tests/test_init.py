"""Tests for the custom_shopping_and_debt_list integration."""

from __future__ import annotations

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.custom_shopping_and_debt_list.const import DOMAIN


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Custom Shopping and Debt List", data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_config_flow_shows_form_and_creates_entry(hass: HomeAssistant) -> None:
    """The config flow shows a form and can create an entry."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    assert result["type"] == "form"
    assert result["step_id"] == "user"

    result2 = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"confirm": True}
    )
    assert result2["type"] == "create_entry"
    assert result2["title"] == "Custom Shopping and Debt List"


async def test_setup_creates_sensors(hass: HomeAssistant) -> None:
    """Setting up the entry creates the sensor entities."""
    await _setup(hass)

    registry = er.async_get(hass)
    assert registry.async_get("sensor.ndlong_shop_shopping_list")
    assert registry.async_get("sensor.ndlong_shop_total_debt")
    assert registry.async_get("sensor.ndlong_shop_debt_list")
    assert registry.async_get("sensor.ndlong_shop_debt_by_category")


async def test_add_and_toggle_shopping(hass: HomeAssistant) -> None:
    """Shopping items can be added and toggled through the services."""
    await _setup(hass)

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_add_shopping",
        {"name": "Beras", "qty": "5 kg", "cat": "Makanan"},
        blocking=True,
    )
    await hass.async_block_till_done()

    state = hass.states.get("sensor.ndlong_shop_shopping_list")
    assert state is not None
    assert "Beras" in state.state
    item = state.attributes["list"][0]
    assert item["name"] == "Beras"
    assert item["qty"] == "5 kg"

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_toggle_shopping",
        {"item_id": item["id"]},
        blocking=True,
    )
    await hass.async_block_till_done()

    state = hass.states.get("sensor.ndlong_shop_shopping_list")
    assert state.attributes["list"][0]["done"] is True


async def test_add_debt_updates_total(hass: HomeAssistant) -> None:
    """Debt entries update the total sensor."""
    await _setup(hass)

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_add_debt",
        {"kategori": "Listrik", "nominal": "350000", "catatan": "PLN"},
        blocking=True,
    )
    await hass.async_block_till_done()

    total = hass.states.get("sensor.ndlong_shop_total_debt")
    assert float(total.state) == 350000.0
    assert total.attributes["by_kategori"]["Listrik"] == 350000.0

    debt_list = hass.states.get("sensor.ndlong_shop_debt_list")
    assert debt_list.state == "1"
    assert debt_list.attributes["debt_list"][0]["kategori"] == "Listrik"


async def test_remove_and_clear(hass: HomeAssistant) -> None:
    """Removing and clearing works through the services."""
    await _setup(hass)

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_add_shopping",
        {"name": "Sabun"},
        blocking=True,
    )
    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_add_debt",
        {"kategori": "Internet", "nominal": "300000"},
        blocking=True,
    )
    await hass.async_block_till_done()

    shopping = hass.states.get("sensor.ndlong_shop_shopping_list")
    item_id = shopping.attributes["list"][0]["id"]

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_remove_shopping",
        {"item_id": item_id},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert hass.states.get("sensor.ndlong_shop_shopping_list").state == "kosong"

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_clear_debt",
        {},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.ndlong_shop_total_debt").state) == 0.0


async def test_data_persists_across_reload(hass: HomeAssistant) -> None:
    """Data survives an entry reload (stored in HA Store)."""
    entry = await _setup(hass)

    await hass.services.async_call(
        DOMAIN,
        "custom_shopping_and_debt_list_add_shopping",
        {"name": "Kopi"},
        blocking=True,
    )
    await hass.async_block_till_done()

    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()

    state = hass.states.get("sensor.ndlong_shop_shopping_list")
    assert state is not None
    assert "Kopi" in state.state


async def test_options_flow_opens(hass: HomeAssistant) -> None:
    """The options flow opens without error."""
    entry = await _setup(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] == "form"
    assert result["step_id"] == "init"


async def test_already_configured_aborts(hass: HomeAssistant) -> None:
    """A second config flow aborts."""
    await _setup(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    assert result["type"] == "abort"
    assert result["reason"] == "already_configured"
