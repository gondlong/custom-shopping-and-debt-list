# Custom Shopping and Debt List — Custom Home Assistant Integration

Custom integration pasif yang menyediakan:

| Fitur | Deskripsi |
|---|---|
| 🛒 **Shopping List** | Tambah / hapus / centang / bersihkan item belanja, lewat dashboard |
| 📉 **Debt List** | Daftar hutang dengan kategori: `listrik`, `internet`, `uang_makan`, `utang_teman`, `lainnya`, plus **total otomatis** |
| 🧠 **Sensor** | Sensor `sensor.custom_shopping_and_debt_list_shopping_list` (summary) & `sensor.custom_shopping_and_debt_list_debt_total` (number) |
| 🃏 **Lovelace Card** | Card custom `custom:custom_shopping_and_debt_list` yang tampil di dashboard / sidebar |
| 💾 **Storage** | Data disimpan di **Home Assistant Store** (DB HA), ikut backup & survival restart |

---

## 📁 File Penyusun

```text
custom_shopping_and_debt_list/
├── __init__.py              # async_setup (active integration, sensor + services)
├── config_flow.py           # Config flow (username/password, optional)
├── options.py               # Options flow (add category, reset, clear)
├── manifest.json            # Integration manifest
├── const.py                 # Konstanta (domain, service, sensor)
├── store.py                 # Data layer (HA Store + helper)
├── services.py              # Service handlers
├── sensor.py                # Sensor entity (shopping list, total debt, kategori)
├── custom_shopping_and_debt_list_card.js  # Lovelace custom card
└── README.md                # Dokumentasi integrasi
```

```text
Repository Root
├── LICENSE
├── README.md
├── hacs.json
├── brand/
│   ├── icon.png
│   └── icon.svg
└── custom_components/
    └── custom_shopping_and_debt_list/
        └── ... (same as above)
```

---

## 🚀 Cara Pasang

### Metode 1: HACS (Direkomendasikan)

1. Buka **HACS** → **Integrations** → tiga titik (⋮) → **Custom repositories**
2. Tambahkan repositori:
   - URL: `https://github.com/gondlong/custom-shopping-and-debt-list`
   - Category: **Integration**
3. Cari **\"Custom Shopping and Debt List\"** di HACS → **Install**
4. **Restart Home Assistant**
5. Buka **Settings → Devices & Services → Add Integration** → cari **Custom Shopping and Debt List**

### Metode 2: Manual

1. Salin folder `custom_components/custom_shopping_and_debt_list/` ke folder konfigurasi HA:
   ```bash
   cp -r /path/ke/proyek/custom_components/custom_shopping_and_debt_list /config/custom_components/
   ```
2. Restart Home Assistant.

### Konfigurasikan

Buka **Settings → Devices & Services → Add Integration** → cari **Custom Shopping and Debt List**

---

## 🃏 Lovelace Card

```yaml
type: custom:custom_shopping_and_debt_list
title: Belanja & Utang
entities:
  - sensor.custom_shopping_and_debt_list_shopping_list
  - sensor.custom_shopping_and_debt_list_debt_total
  - sensor.custom_shopping_and_debt_list_debt_list
```

## 🔧 Service (untuk Automation / Script)

Bisa dipanggil lewat **Developer Tools → Services** atau automation:

| Service | Parameters | Keterangan |
|---|---|---|
| `custom_shopping_and_debt_list.add_shopping` | `name`, `qty?`, `cat?` | Tambah item belanja |
| `custom_shopping_and_debt_list.remove_shopping` | `item_id` | Hapus item belanja |
| `custom_shopping_and_debt_list.toggle_shopping` | `item_id` | Centang / batal |
| `custom_shopping_and_debt_list.clear_shopping` | (none) | Kosongkan daftar |
| `custom_shopping_and_debt_list.add_debt` | `kategori`, `nominal`, `catatan?` | Tambah utang |
| `custom_shopping_and_debt_list.remove_debt` | `entry_id` | Hapus utang |
| `custom_shopping_and_debt_list.clear_debt` | (none) | Kosongkan utang |

### Contoh Automation (Telegram → tambah utang)

```yaml
action:
  service: custom_shopping_and_debt_list.add_debt
  data:
    kategori: listrik
    nominal: 150000
    catatan: Februari 2026
```

---

## 📐 Data Model

**Shopping List** (`shopping[]`)
```json
{
  "id": "a1b2c3d4e5f6",
  "name": "susu",
  "qty": "2",
  "cat": "Kebutuhan",
  "done": false,
  "created": "2026-11-23T10:00:00Z"
}
```

**Debt List** (`debt[]`)
```json
{
  "id": "f6e5d4c3b2a1",
  "kategori": "listrik",
  "nominal": 150000,
  "catatan": "Februari",
  "created": "2026-11-23T10:00:00Z"
}
```

---

## 📜 Lisensi

Free to use, modify, and distribute. Hanya ingat: timbangkan & jalankan sesuai kebutuhan kamu. Report issues di mana ditemukan.
