# Custom Shopping and Debt List

Custom Home Assistant integration: **shopping list** + **debt list** dengan total debt, Lovelace card, dan HA Store persistence.

## Fitur

| Fitur | Deskripsi |
|---|---|
| 🛒 | **Shopping List** | Tambah / hapus / centang / bersihkan item belanja |
| 📉 | **Debt List** | Kategori `listrik`, `internet`, `uang_makan`, `utang_teman`, `lainnya` + **total otomatis** |
| 🧠 | **Sensor** | `sensor.custom_shopping_and_debt_list_shopping_list` & `sensor.custom_shopping_and_debt_list_debt_total` |
| 🃏 | **Lovelace Card** | `custom:custom_shopping_and_debt_list` |
| 💾 | **Storage** | HA Store (DB HA) — backup & survival restart |

## Install

### Method 1: HACS (Direkomendasikan)

1. Buka **HACS** → **Integrations** → tiga titik (⋮) → **Custom repositories**
2. Masukkan URL: `https://github.com/gondlong/custom-shopping-and-debt-list`
3. Category: **Integration**
4. Search for **"Custom Shopping and Debt List"** in HACS and install it.
5. Restart Home Assistant.
6. Go to **Settings → Devices & Services → Add Integration** → search for **Custom Shopping and Debt List**.

### Method 2: Manual

1. Salin folder `custom_components/custom_shopping_and_debt_list/` ke folder konfigurasi HA:
   ```bash
   cp -r custom_components/custom_shopping_and_debt_list /config/custom_components/
   ```
2. Restart Home Assistant.
3. Go to **Settings → Devices & Services → Add Integration** → search for **Custom Shopping and Debt List**.

### Add the Lovelace Card

After the integration is set up, add the card to your dashboard:
1. Edit dashboard → three dots → **Manage dashboard** → **Add card**
2. Type `custom:custom_shopping_and_debt_list`

See `custom_components/custom_shopping_and_debt_list/README.md` for full detail.

## Files

```text
repository root
├── LICENSE
├── README.md
├── hacs.json
├── brand/
│   ├── icon.png
│   └── icon.svg
└── custom_components/
    └── custom_shopping_and_debt_list/
        ├── README.md
        ├── __init__.py
        ├── config_flow.py
        ├── const.py
        ├── custom_shopping_and_debt_list_card.js
        ├── manifest.json
        ├── options.py
        ├── sensor.py
        ├── services.py
        └── store.py
```

