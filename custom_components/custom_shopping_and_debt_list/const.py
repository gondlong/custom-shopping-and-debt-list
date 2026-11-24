"""Constant values for the custom_shopping_and_debt_list integration."""

DOMAIN = "custom_shopping_and_debt_list"

# Data keys stored in the HA Store
DATA_SHOPPING = "shopping"
DATA_DEBT = "debt"

# Default shopping categories
DEFAULT_SHOPPING_CATS = [
    "Lainnya",
    "Kebutuhan",
    "Makanan",
    "Hiburan",
    "Kesehatan",
]

# Default debt categories.
# "other" is a special key that opens manual entry in the UI.
DEFAULT_DEBT_CATS = [
    {"key": "lainnya", "label": "Lainnya"},
    {"key": "pinjol", "label": "Pinjaman Online"},
    {"key": "pinbank", "label": "Pinjaman Bank"},
    {"key": "pinkan", "label": "Pinjaman Rekan"},
    {"key": "listrik", "label": "Listrik"},
    {"key": "internet", "label": "Internet"},
    {"key": "kontrakan", "label": "Kontrakan"},
]

# Sensor entity IDs (set on first load by __init__.py)
SENSOR_SHOPPING_LIST = "sensor.custom_shopping_and_debt_list_shopping_list"
SENSOR_DEBT_TOTAL = "sensor.custom_shopping_and_debt_list_debt_total"
SENSOR_DEBT_BY_KATEGORI = "sensor.custom_shopping_and_debt_list_debt_by_kategori"

# Service names
SERVICE_ADD_SHOPPING = "custom_shopping_and_debt_list_add_shopping"
SERVICE_REMOVE_SHOPPING = "custom_shopping_and_debt_list_remove_shopping"
SERVICE_TOGGLE_SHOPPING = "custom_shopping_and_debt_list_toggle_shopping"
SERVICE_CLEAR_SHOPPING = "custom_shopping_and_debt_list_clear_shopping"
SERVICE_ADD_DEBT = "custom_shopping_and_debt_list_add_debt"
SERVICE_REMOVE_DEBT = "custom_shopping_and_debt_list_remove_debt"
SERVICE_CLEAR_DEBT = "custom_shopping_and_debt_list_clear_debt"
