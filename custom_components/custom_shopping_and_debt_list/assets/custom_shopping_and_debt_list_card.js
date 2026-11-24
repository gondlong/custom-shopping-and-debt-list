/**
 * Custom Lovelace card for the Custom Shopping and Debt List integration.
 *
 * The file is copied into the Home Assistant "www" folder by the
 * integration and registered automatically as a Lovelace dashboard resource.
 *
 * Card type: custom:custom-shopping-and-debt-list
 */

const DOMAIN = "custom_shopping_and_debt_list";

const DEFAULT_ENTITIES = [
  "sensor.ndlong_shop_shopping_list",
  "sensor.ndlong_shop_total_debt",
  "sensor.ndlong_shop_debt_list",
  "sensor.ndlong_shop_debt_by_category",
];

const DEFAULT_SHOPPING_CATS = [
  "Kebutuhan",
  "Makanan",
  "Hiburan",
  "Kesehatan",
  "Lainnya",
];

const DEFAULT_DEBT_CATS = [
  "Listrik",
  "Internet",
  "Uang Makan",
  "Utang Teman",
  "Pinjaman Online",
  "Lainnya",
];

const STYLES = `
  :host { display: block; }
  .wrap {
    font-family: var(--paper-font-body1_-_font-family, inherit);
    color: var(--primary-text-color);
  }
  h2 { margin: 0 0 8px 0; font-size: 18px; font-weight: 500; }
  h3 { margin: 16px 0 4px 0; font-size: 14px; font-weight: 500; opacity: .8; }
  .muted { opacity: .6; font-size: 12px; }
  ul { list-style: none; margin: 0; padding: 0; }
  li.item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 8px;
  }
  li.item + li.item { border-top: 1px solid var(--divider-color, #e0e0e0); }
  li.item.done .name { text-decoration: line-through; opacity: .5; }
  li.item .name { flex: 1; }
  li.item .qty { opacity: .7; font-size: 12px; }
  li.item .cat {
    font-size: 11px; padding: 1px 6px; border-radius: 10px;
    background: var(--secondary-background-color, #eee); opacity: .8;
  }
  button {
    cursor: pointer; border: none; background: transparent;
    color: inherit; font-size: 14px; padding: 2px 6px; border-radius: 6px;
  }
  button:hover { background: var(--secondary-background-color, #eee); }
  form {
    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
    margin-top: 8px;
  }
  input, select {
    font: inherit; color: inherit; padding: 6px 8px; border-radius: 8px;
    border: 1px solid var(--divider-color, #ccc);
    background: var(--card-background-color, #fff);
  }
  input.grow { flex: 1; min-width: 90px; }
  .total { font-size: 22px; font-weight: 600; }
  .cat-row { margin-bottom: 2px; }
  .card {
    background: var(--card-background-color, #fff);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    box-shadow: var(--ha-card-box-shadow, none);
  }
`;

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[ch],
  );
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class NdlongShopCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._entityIds = [...DEFAULT_ENTITIES];
    this._hass = null;
    this._root = null;
    this._listenersAttached = false;
    this._renderQueued = false;
    this._newItem = { name: "", qty: "", cat: "" };
    this._newDebt = { kategori: "", nominal: "", catatan: "", due_date: "" };
  }

  getCardType() {
    return "custom:custom-shopping-and-debt-list";
  }

  getConfigElement() {
    return null;
  }

  getStubConfig() {
    return {
      entities: [...DEFAULT_ENTITIES],
      title: "Daftar Belanja & Hutang",
    };
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    const entities = Array.isArray(this._config.entities)
      ? this._config.entities
      : [];
    const parsed = entities
      .map((e) => (typeof e === "string" ? e : e.entity_id))
      .filter(Boolean);
    this._entityIds = parsed.length ? parsed : [...DEFAULT_ENTITIES];
    this._scheduleRender();
  }

  set hass(hass) {
    this._hass = hass;
    this._scheduleRender();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
    }
    this._attachListeners();
    this._scheduleRender();
  }

  disconnectedCallback() {
    this._renderQueued = false;
  }

  // ------------------------------------------------------------------ data

  _entityState(suffix, fallbackIndex) {
    if (!this._hass || !this._hass.states) return null;
    const found = this._entityIds.find((id) => id.endsWith(suffix));
    const target = found || this._entityIds[fallbackIndex];
    if (!target) return null;
    return this._hass.states[target] || null;
  }

  _shopping() {
    const st = this._entityState("shopping_list", 0);
    if (!st || !st.attributes) return [];
    const list = st.attributes.list || [];
    return Array.isArray(list) ? list : [];
  }

  _debt() {
    const st = this._entityState("debt_list", 2);
    if (!st || !st.attributes) return [];
    const list = st.attributes.debt_list || [];
    return Array.isArray(list) ? list : [];
  }

  _total() {
    const st = this._entityState("total_debt", 1);
    const n = st ? Number(st.state) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  _byKategori() {
    const st = this._entityState("debt_by_category", 3);
    if (!st || !st.attributes) return {};
    const cats = st.attributes.by_kategori || {};
    return typeof cats === "object" && !Array.isArray(cats) ? cats : {};
  }

  _shoppingCats() {
    const seen = new Set(DEFAULT_SHOPPING_CATS);
    this._shopping().forEach((it) => {
      if (it && it.cat) seen.add(it.cat);
    });
    return Array.from(seen);
  }

  _debtCats() {
    const seen = new Set(DEFAULT_DEBT_CATS);
    Object.keys(this._byKategori()).forEach((k) => seen.add(k));
    this._debt().forEach((e) => {
      if (e && e.kategori) seen.add(e.kategori);
    });
    return Array.from(seen);
  }

  // -------------------------------------------------------------- rendering

  _scheduleRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      this._render();
    });
  }

  _render() {
    if (!this.isConnected) return;
    const root = this._root || (this._root = this.attachShadow({ mode: "open" }));
    const shopping = this._shopping();
    const debt = this._debt();
    const total = this._total();
    const byKategori = this._byKategori();
    const title = this._config.title || "Daftar Belanja & Hutang";

    root.innerHTML = `
      <style>${STYLES}</style>
      <div class="wrap card">
        <h2>${esc(title)}</h2>

        <h3>Belanja</h3>
        ${
          shopping.length
            ? `<ul>${shopping.map((it) => this._shoppingRow(it)).join("")}</ul>`
            : `<div class="muted">Belanja kosong.</div>`
        }
        <form id="add-item-form">
          <input class="grow" name="name" placeholder="Nama barang" required>
          <input name="qty" placeholder="Jumlah" style="width:90px">
          <select name="cat">
            ${this._shoppingCats()
              .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
              .join("")}
          </select>
          <button type="submit">Tambah</button>
        </form>
        ${
          shopping.length
            ? `<div><button data-action="clear-shopping">Kosongkan daftar belanja</button></div>`
            : ""
        }

        <h3>Hutang</h3>
        <div class="total">Rp ${Number(total).toLocaleString("id-ID")}</div>
        ${
          Object.keys(byKategori).length
            ? Object.keys(byKategori)
                .map(
                  (k) =>
                    `<div class="cat-row"><span>${esc(k)}</span>: <b>Rp ${Number(
                      byKategori[k],
                    ).toLocaleString("id-ID")}</b></div>`,
                )
                .join("")
            : `<div class="muted">Belum ada utang.</div>`
        }
        ${
          debt.length
            ? `<ul>${debt.map((e) => this._debtRow(e)).join("")}</ul>`
            : ""
        }
        <form id="add-debt-form">
          <select name="kategori">
            ${this._debtCats()
              .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
              .join("")}
          </select>
          <input name="nominal" placeholder="Nominal" required style="width:100px">
          <input class="grow" name="catatan" placeholder="Catatan">
          <input name="due_date" type="date" style="width:140px">
          <button type="submit">Tambah</button>
        </form>
        ${
          debt.length
            ? `<div><button data-action="clear-debt">Kosongkan daftar utang</button></div>`
            : ""
        }
      </div>
    `;
    this._attachListeners();
  }

  _shoppingRow(it) {
    const id = esc(it && it.id);
    const done = it && it.done;
    return `
      <li class="item ${done ? "done" : ""}">
        <input type="checkbox" data-action="toggle" data-id="${id}" ${
          done ? "checked" : ""
        }>
        <span class="name">${esc(it && it.name)}</span>
        <span class="qty">${esc(it && it.qty)}</span>
        <span class="cat">${esc(it && it.cat)}</span>
        <button data-action="remove-shopping" data-id="${id}">✕</button>
      </li>
    `;
  }

  _debtRow(e) {
    const id = esc(e && e.id);
    const due = e && e.due_date ? ` · jatuh tempo ${esc(e.due_date)}` : "";
    const note = e && e.catatan ? ` (${esc(e.catatan)})` : "";
    return `
      <li class="item">
        <span class="name">${esc(e && e.kategori)}${note}${due}</span>
        <span class="qty">Rp ${Number((e && e.nominal) || 0).toLocaleString("id-ID")}</span>
        <button data-action="remove-debt" data-id="${id}">✕</button>
      </li>
    `;
  }

  // -------------------------------------------------------------- handlers

  _attachListeners() {
    const root = this._root;
    if (!root) return;

    if (!this._listenersAttached) {
      this._listenersAttached = true;

      root.addEventListener("click", (ev) => {
        const el = ev.target.closest("[data-action]");
        if (!el) return;
        ev.preventDefault();
        const action = el.getAttribute("data-action");
        const id = el.getAttribute("data-id");
        if (action === "toggle") {
          this._call("custom_shopping_and_debt_list_toggle_shopping", {
            item_id: id,
          });
        } else if (action === "remove-shopping") {
          this._call("custom_shopping_and_debt_list_remove_shopping", {
            item_id: id,
          });
        } else if (action === "remove-debt") {
          this._call("custom_shopping_and_debt_list_remove_debt", {
            entry_id: id,
          });
        } else if (action === "clear-shopping") {
          this._call("custom_shopping_and_debt_list_clear_shopping", {});
        } else if (action === "clear-debt") {
          this._call("custom_shopping_and_debt_list_clear_debt", {});
        }
      });

      root.addEventListener("submit", (ev) => {
        const form = ev.target;
        if (!form || !form.id) return;
        ev.preventDefault();

        if (form.id === "add-item-form") {
          const fd = new FormData(form);
          const name = String(fd.get("name") || "").trim();
          if (!name) return;
          this._call("custom_shopping_and_debt_list_add_shopping", {
            name,
            qty: String(fd.get("qty") || "").trim(),
            cat: String(fd.get("cat") || "Kebutuhan").trim(),
          });
          form.reset();
        } else if (form.id === "add-debt-form") {
          const fd = new FormData(form);
          const kategori = String(fd.get("kategori") || "").trim();
          const nominal = String(fd.get("nominal") || "").trim();
          if (!kategori || !nominal) return;
          this._call("custom_shopping_and_debt_list_add_debt", {
            kategori,
            nominal,
            catatan: String(fd.get("catatan") || "").trim(),
            due_date: String(fd.get("due_date") || "").trim(),
          });
          form.reset();
        }
      });
    }
  }

  async _call(service, data) {
    if (!this._hass) return;
    try {
      await this._hass.callService(DOMAIN, service, data);
    } catch (err) {
      console.error(`custom-shopping-and-debt-list: ${service} failed`, err);
    }
  }
}

if (!customElements.get("custom-shopping-and-debt-list")) {
  customElements.define("custom-shopping-and-debt-list", NdlongShopCard);
}

window.customCards = window.customCards || [];
if (
  !window.customCards.some((card) => card.type === "custom-shopping-and-debt-list")
) {
  window.customCards.push({
    type: "custom-shopping-and-debt-list",
    name: "Daftar Belanja & Hutang",
    description: "Kartu daftar belanja dan hutang untuk Custom Shopping and Debt List.",
    preview: true,
  });
}
