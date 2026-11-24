# Custom Shopping and Debt List — Home Assistant Integration

A custom Home Assistant integration for managing your **Shopping List** and **Debt & Installment List**, bundled with an interactive, auto-registered 2-column **Lovelace Custom Card**.

| Feature | Description |
|---|---|
| 🛒 **Shopping List** | Add, edit, check off, remove, and clear completed items directly from your dashboard |
| 📉 **Debt & Installments** | Track debts with due dates and installment progress (`x/y`), automatically sorted by the **nearest due date** |
| ⏰ **Due Date Alerts** | Displays a summary of debts due within **≤ 5 days** + a one-click **✓ Pay Installment** button |
| 🧠 **4 Automatic Sensors** | Provides sensors for shopping list, total overall debt, debt list, and debt breakdown by category |
| 🃏 **Lovelace Card** | Custom 2-column card `custom:custom-shopping-and-debt-list` automatically registered as a Lovelace resource |
| 💾 **Persistent Storage** | Data is stored in **Home Assistant Store** (`.storage`), surviving restarts and included in HA backups |

---

## 📁 File Structure

```text
Repository Root/
├── LICENSE
├── README.md
├── hacs.json
├── pytest.ini
├── brand/
│   ├── icon.png
│   └── icon.svg
├── tests/
│   ├── conftest.py
│   ├── test_check.py
│   ├── test_debug.py
│   └── test_init.py
└── custom_components/
    └── custom_shopping_and_debt_list/
        ├── __init__.py              # Integration setup, sensors, services, & Lovelace card registration
        ├── config_flow.py           # UI initial configuration flow
        ├── options.py               # Integration options flow
        ├── manifest.json            # Integration metadata & version
        ├── const.py                 # Domain, sensor, and service constants
        ├── store.py                 # Data persistence layer using Home Assistant Store
        ├── services.py              # Service call handlers
        ├── services.yaml            # Service definitions for Developer Tools
        ├── sensor.py                # Sensor entities (shopping list, total debt, debt list, categories)
        ├── lovelace.py              # Auto-copies card to /config/www & registers Lovelace resource
        ├── custom_shopping_and_debt_list_card.js
        ├── assets/
        │   └── custom_shopping_and_debt_list_card.js
        ├── strings.json
        └── translations/
            ├── en.json
            └── id.json
```

---

## 🚀 Installation

### Method 1: Home Assistant Marketplace (Recommended)

> **Note:** Starting with Home Assistant 2026.11, HACS is built directly into Home Assistant as **Marketplace** (`Settings → Marketplace`).

1. Open **Settings → Marketplace** in your Home Assistant instance.
2. Go to **Custom repositories** (or select **Add from link** in the menu — requires a connected GitHub account via device sign-in).
3. Enter the repository URL:
   - **URL:** `https://github.com/gondlong/custom-shopping-and-debt-list`
   - **Category:** `Integration`
4. Open **Custom Shopping and Debt List** from the Marketplace list and click **Download / Install**.
5. **Restart Home Assistant** when prompted.
6. Go to **Settings → Devices & Services → Add Integration** → search for **Custom Shopping and Debt List** and complete the setup.

### Method 2: Manual Installation

1. Copy the `custom_components/custom_shopping_and_debt_list/` folder into your Home Assistant configuration directory:
   ```bash
   cp -r custom_components/custom_shopping_and_debt_list /config/custom_components/
   ```
2. **Restart Home Assistant** (the `.js` card asset will be automatically copied to `/config/www/` and registered in Lovelace Resources).
3. Add the integration via **Settings → Devices & Services → Add Integration**.

---

## 🃏 Lovelace Card

Once the integration is added, the **Belanja & Utang** card will automatically appear in the dashboard card picker (**Add Card**). You can also add it manually via YAML:

```yaml
type: custom:custom-shopping-and-debt-list
title: Shopping & Debt List
entities:
  - sensor.shopping_debt_shopping_list
  - sensor.shopping_debt_total_debt
  - sensor.shopping_debt_debt_list
  - sensor.shopping_debt_debt_by_category
```

*(Adjust the `entity_id` values above to match the entities created under your integration device).*

### Key Card Features
- **Automatic Sorting:** Debt entries are automatically sorted by the nearest due date.
- **Priority Indicator ($\le 5$ Days):** The top-right header of the Debt panel calculates the total amount due from today through the next 5 days.
- **Installment Tracking (`x/y`):** Fill in the optional installment fields (e.g., `1 / 3`). Clicking **✓ Bayar** on a debt row automatically increments the installment to `2/3` and advances the due date by 1 month (or removes the entry once the final installment is paid).

---

## 🔧 Services (Automations & Scripts)

All actions can be called via **Developer Tools → Actions (Services)** or inside Automations:

| Service | Parameters | Description |
|---|---|---|
| `custom_shopping_and_debt_list.add_shopping` | `name`, `qty?`, `cat?` | Add an item to the shopping list |
| `custom_shopping_and_debt_list.remove_shopping` | `item_id` | Remove a shopping item by ID |
| `custom_shopping_and_debt_list.toggle_shopping` | `item_id` | Toggle an item's completed status |
| `custom_shopping_and_debt_list.clear_shopping` | *(none)* | Clear all items from the shopping list |
| `custom_shopping_and_debt_list.add_debt` | `kategori`, `nominal`, `catatan?`, `due_date?` | Add a new debt entry |
| `custom_shopping_and_debt_list.remove_debt` | `entry_id` | Remove a debt entry by ID |
| `custom_shopping_and_debt_list.clear_debt` | *(none)* | Clear all debt entries |

### Automation Example (Adding a Debt Entry)

```yaml
action: custom_shopping_and_debt_list.add_debt
data:
  kategori: Electricity
  nominal: 150000
  catatan: "[cicilan:1/3] Monthly bill"
  due_date: "2026-11-30"
```

---

## 📐 Data Model (HA Store)

**Shopping Item**
```json
{
  "id": "a1b2c3d4e5f6",
  "name": "Milk",
  "qty": "1 box",
  "cat": "Groceries",
  "done": false,
  "created": "2026-11-24T10:00:00Z"
}
```

**Debt Entry**
```json
{
  "id": "f6e5d4c3b2a1",
  "kategori": "Online Loan",
  "nominal": 500000,
  "catatan": "[cicilan:1/3] Phone installment",
  "due_date": "2026-12-01",
  "created": "2026-11-24T10:00:00Z"
}
```

---

## 📜 License

Free to use, modify, and distribute under the terms of the [LICENSE](LICENSE) file. Feel free to open an Issue in this repository if you encounter any bugs or have suggestions.
