"""Data store for custom_shopping_and_debt_list backed by Home Assistant Store.

Data lives in Home Assistant's database and is persisted automatically, so it
is restored on upgrade and included in HA backups. The store object is
attached to :attr:`homeassistant.core.Hass.data["custom_shopping_and_debt_list"]` by
:meth:`homeassistant.config_entries.ConfigEntry.setup`.

All mutation helpers in this module work on the *same* dict object that is
stored in the store, therefore a single :meth:`~Store.async_save` persists any
number of changes.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from homeassistant.core import HomeAssistant

from .const import (
    DATA_DEBT,
    DATA_SHOPPING,
    SENSOR_DEBT_TOTAL,
    SENSOR_SHOPPING_LIST,
)

_LOGGER = logging.getLogger(__name__)

DEFAULT_DATA: dict[str, list[dict[str, Any]]] = {
    DATA_SHOPPING: [],
    DATA_DEBT: [],
}

SENSOR_MAP = {
    DATA_SHOPPING: SENSOR_SHOPPING_LIST,  # set in __init__.py
    DATA_DEBT: SENSOR_DEBT_TOTAL,
}

def _default_data() -> dict[str, list[dict[str, Any]]]:
    return {k: list(v) for k, v in DEFAULT_DATA.items()}


# ---------------------------------------------------------------- helpers

def _as_list(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [i for i in value if isinstance(i, dict)]
    _LOGGER.warning(
        "custom_shopping_and_debt_list: stored %s has type %s, resetting to empty list",
        DATA_SHOPPING,
        type(value).__name__,
    )
    return []


# ---------------------------------------------------------------- read

def read_shopping(data: dict[str, Any]) -> list[dict[str, Any]]:
    return _as_list(data.get(DATA_SHOPPING))


def read_debt(data: dict[str, Any]) -> list[dict[str, Any]]:
    return _as_list(data.get(DATA_DEBT))


# ---------------------------------------------------------------- mutate

def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _now_iso() -> str:
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def add_shopping_item(
    data: dict[str, Any], *, name: str, qty: str = "", cat: str = "Kebutuhan"
) -> dict[str, Any]:
    item = {
        "id": _new_id(),
        "name": str(name).strip(),
        "qty": str(qty).strip(),
        "cat": str(cat).strip() or "Kebutuhan",
        "done": False,
        "created": _now_iso(),
    }
    data[DATA_SHOPPING].append(item)
    return item


def remove_shopping_item(data: dict[str, Any], item_id: str) -> bool:
    before = len(data[DATA_SHOPPING])
    data[DATA_SHOPPING] = [i for i in data[DATA_SHOPPING] if i.get("id") != item_id]
    return len(data[DATA_SHOPPING]) != before


def toggle_shopping_item(data: dict[str, Any], item_id: str) -> bool:
    for i in data[DATA_SHOPPING]:
        if i.get("id") == item_id:
            i["done"] = not i.get("done", False)
            return True
    return False


def clear_shopping(data: dict[str, Any]) -> None:
    data[DATA_SHOPPING] = []


# ---------------------------------------------------------------- debt

def add_debt_entry(
    data: dict[str, Any],
    *,
    kategori: str,
    nominal: str,
    catatan: str = "",
    due_date: str = "",
) -> dict[str, Any]:
    try:
        amount = float(str(nominal).replace(",", "").strip())
    except ValueError:
        amount = 0.0
    entry = {
        "id": _new_id(),
        "kategori": str(kategori).strip() or "Lainnya",
        "nominal": amount,
        "catatan": str(catatan).strip(),
        "due_date": str(due_date).strip() or "",
        "created": _now_iso(),
    }
    data[DATA_DEBT].append(entry)
    return entry


def remove_debt_entry(data: dict[str, Any], entry_id: str) -> bool:
    before = len(data[DATA_DEBT])
    data[DATA_DEBT] = [e for e in data[DATA_DEBT] if e.get("id") != entry_id]
    return len(data[DATA_DEBT]) != before


def clear_debt(data: dict[str, Any]) -> None:
    data[DATA_DEBT] = []


# ---------------------------------------------------------------- derived

def shopping_total(data: dict[str, Any]) -> int:
    return len(read_shopping(data))


def debt_total(data: dict[str, Any]) -> float:
    return round(sum(e.get("nominal", 0.0) for e in read_debt(data)), 2)


def debt_by_kategori(data: dict[str, Any]) -> dict[str, float]:
    out: dict[str, float] = {}
    for e in read_debt(data):
        k = e.get("kategori") or "Lainnya"
        out[k] = round(out.get(k, 0.0) + e.get("nominal", 0.0), 2)
    return out
