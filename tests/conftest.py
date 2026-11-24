"""Pytest configuration for the custom_shopping_and_debt_list integration.

The pytest-homeassistant-custom-component harness discovers custom
integrations from its own ``testing_config/custom_components`` folder, and it
caches that list the first time a Home Assistant instance is created. We copy
our integration there at import time (before any fixture runs) so the harness
finds it.
"""

from __future__ import annotations

import copy
import pathlib
import shutil

import pytest

pytest_plugins = "pytest_homeassistant_custom_component"

_HERE = pathlib.Path(__file__).parent
_REPO_ROOT = _HERE.parent
_SOURCE = _REPO_ROOT / "custom_components" / "custom_shopping_and_debt_list"
_HARNESS_ROOT = (
    pathlib.Path(__import__("pytest_homeassistant_custom_component").__file__).parent
    / "testing_config"
)
_DOMAIN = "custom_shopping_and_debt_list"
_TARGET = _HARNESS_ROOT / "custom_components" / _DOMAIN


def _install() -> None:
    """Copy the integration into the harness custom_components folder."""
    if _TARGET.exists() or _TARGET.is_symlink():
        shutil.rmtree(_TARGET, ignore_errors=True)
    shutil.copytree(_SOURCE, _TARGET)


_install()


@pytest.fixture
def enable_custom_integrations(hass):
    """Ensure the harness re-scans custom components for every test."""
    from homeassistant import loader

    hass.data.pop(loader.DATA_CUSTOM_COMPONENTS, None)
    hass.data.pop(loader.DATA_CONFIG_FLOWS, None)
    yield


@pytest.fixture
def hass_config_dir(hass_tmp_config_dir) -> str:
    """Point the harness config dir at the repository root, where our custom
    components live, so the loader can find them."""
    return str(_REPO_ROOT)
