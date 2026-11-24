"""Install the Lovelace card and register it as a dashboard resource.

The card JavaScript ships with the integration package. During setup it is
copied into the Home Assistant ``www`` folder (served as ``/local/<file>``)
and registered as a Lovelace dashboard resource so users do not have to add
it manually after an install or an update.

The resource URL carries the integration version, so a browser that cached the
old file transparently loads the new one after an upgrade.

All filesystem access is performed in Home Assistant's executor to avoid
blocking the event loop.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.core import HomeAssistant

try:  # HA >= 2026.4 moved Store to helpers.storage
    from homeassistant.helpers.storage import Store
except ImportError:  # pragma: no cover - older HA
    from homeassistant.helpers.store import Store  # type: ignore[no-redef]

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

CARD_FILENAME = "custom_shopping_and_debt_list_card.js"
CARD_URL_PATH = f"/local/{CARD_FILENAME}"
ASSET_DIR = Path(__file__).parent / "assets"
MANIFEST_PATH = Path(__file__).parent / "manifest.json"


def _read_manifest_version() -> str:
    """Read and parse the integration version from the manifest."""
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        _LOGGER.warning(
            "custom_shopping_and_debt_list: could not read integration version"
        )
        return "0"
    return str(manifest.get("version", "0"))


async def integration_version(hass: HomeAssistant) -> str:
    """Return the version declared in manifest.json without blocking."""
    return await hass.async_add_executor_job(_read_manifest_version)


def card_url(version: str) -> str:
    """Return the versioned URL of the installed card."""
    return f"{CARD_URL_PATH}?v={version}"


def _install_card_file(source: Path, target: Path) -> bool:
    """Copy the card source to the target path without blocking the loop."""
    if not source.is_file():
        _LOGGER.warning(
            "custom_shopping_and_debt_list: card asset %s is missing", source
        )
        return False

    try:
        content = source.read_text(encoding="utf-8")
    except OSError:
        _LOGGER.exception("custom_shopping_and_debt_list: cannot read card asset")
        return False

    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        current = target.read_text(encoding="utf-8") if target.is_file() else None
        if current != content:
            target.write_text(content, encoding="utf-8")
            _LOGGER.info(
                "custom_shopping_and_debt_list: installed card %s", target
            )
    except OSError:
        _LOGGER.exception("custom_shopping_and_debt_list: cannot write card file")
        return False

    return True


async def async_install_card(hass: HomeAssistant) -> bool:
    """Copy the card into www/ and register it as a dashboard resource.

    Returns True when the card file was made available.
    """
    source = ASSET_DIR / CARD_FILENAME
    target = Path(hass.config.path("www")) / CARD_FILENAME

    installed = await hass.async_add_executor_job(
        _install_card_file,
        source,
        target,
    )
    if not installed:
        return False

    version = await integration_version(hass)
    await _async_register_resource(hass, card_url(version))
    return True


async def _async_register_resource(hass: HomeAssistant, url: str) -> None:
    """Register the card URL in the Lovelace dashboard resource lists."""
    for key in await _async_lovelace_storage_keys(hass):
        await _async_register_in_store(hass, key, url)


def _find_lovelace_storage_keys(storage_dir: Path) -> list[str]:
    """Return the Lovelace storage keys without blocking the event loop."""
    keys = ["lovelace"]
    if storage_dir.is_dir():
        for path in sorted(storage_dir.glob("lovelace.*")):
            if path.is_file():
                keys.append(path.name)
    return keys


async def _async_lovelace_storage_keys(hass: HomeAssistant) -> list[str]:
    """Return the default dashboard plus any existing extra dashboards."""
    storage_dir = Path(hass.config.path(".storage"))
    return await hass.async_add_executor_job(
        _find_lovelace_storage_keys,
        storage_dir,
    )


async def _async_register_in_store(
    hass: HomeAssistant, key: str, url: str
) -> None:
    """Add/update the resource entry inside one Lovelace storage file."""
    store = Store(hass, 1, key)
    try:
        data = await store.async_load()
    except Exception:  # noqa: BLE001
        _LOGGER.exception(
            "custom_shopping_and_debt_list: cannot read lovelace storage %s", key
        )
        return

    if not isinstance(data, dict):
        data = {}

    if key != "lovelace" and "config" not in data:
        # Not a dashboard file - leave it untouched.
        return

    resources = data.get("resources")
    if not isinstance(resources, list):
        resources = []

    changed = False
    for resource in resources:
        if not isinstance(resource, dict):
            continue
        existing = str(resource.get("url", ""))
        if existing.split("?")[0] == CARD_URL_PATH:
            if existing != url or resource.get("type") != "module":
                resource["url"] = url
                resource["type"] = "module"
                changed = True
            break
    else:
        resources.append({"url": url, "type": "module"})
        changed = True

    if not changed:
        return

    data["resources"] = resources
    try:
        await store.async_save(data)
    except Exception:  # noqa: BLE001
        _LOGGER.exception(
            "custom_shopping_and_debt_list: cannot save lovelace storage %s", key
        )
