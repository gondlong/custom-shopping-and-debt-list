/** eslint-env browser */
/**
 * custom_shopping_and_debt_list Lovelace custom card.
 */

const DOMAIN = "custom_shopping_and_debt_list";

const DEFAULT_ENTITIES = [
  "sensor.ndlong_shop_shopping_list",
  "sensor.ndlong_shop_total_debt",
  "sensor.ndlong_shop_debt_list",
  "sensor.ndlong_shop_debt_by_category",
];

const DEFAULT_SHOPPING_CATS = [
  "Lainnya",
  "Kebutuhan",
  "Makanan",
  "Hiburan",
  "Kesehatan",
];

const DEFAULT_DEBT_CATS = [
  "Lainnya",
  "Pinjaman Online",
  "Pinjaman Bank",
  "Pinjaman Rekan",
  "Listrik",
  "Internet",
  "Kontrakan",
];

class NdlongShopCard extends HTMLElement {
  constructor() {
    super();
    this._title = "Daftar Belanja & Hutang";
    this._entityIds = [...DEFAULT_ENTITIES];
    this._hass = null;
    this._root = null;
    this._lastSignature = "";
    this._editShoppingId = null;
    this._editDebtId = null;
    this._listenersAttached = false;
    this._optimisticDone = new Map();
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
    this._title = config.title || "Daftar Belanja & Hutang";
    const entities = config.entities || [];
    const parsed = entities
      .map((e) => (typeof e === "string" ? e : e.entity_id))
      .filter(Boolean);
    if (parsed.length) {
      this._entityIds = parsed;
    }
    this._lastSignature = "";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!hass || !hass.states) return;

    const sig = this._entityIds
      .map((id) => {
        const st = hass.states[id];
        if (!st) return `${id}:none`;
        return `${id}:${st.state}:${JSON.stringify(st.attributes)}`;
      })
      .join("|");

    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      this._optimisticDone.clear();
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------

  _findEntity(suffix, fallbackIndex) {
    const found = this._entityIds.find((id) => id.endsWith(suffix));
    const targetId = found || this._entityIds[fallbackIndex] || "";
    if (!this._hass || !this._hass.states || !targetId) return null;
    return this._hass.states[targetId] || null;
  }

  _shopping() {
    const st = this._findEntity("shopping_list", 0);
    if (!st || !st.attributes) return [];
    const list = st.attributes.list || st.attributes.items || st.attributes.shopping_list;
    if (!Array.isArray(list)) return [];
    return list.map((it) => {
      const idStr = String(it.id);
      const done = this._optimisticDone.has(idStr)
        ? this._optimisticDone.get(idStr)
        : Boolean(it.done);
      return { ...it, done };
    });
  }

  _total() {
    const st = this._findEntity("total_debt", 1) || this._findEntity("debt_total", 1);
    const n = st ? Number(st.state) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  _debtList() {
    const st = this._findEntity("debt_list", 2);
    if (!st || !st.attributes) return [];
    const list = st.attributes.debt_list || st.attributes.list || st.attributes.entries;
    return Array.isArray(list) ? list : [];
  }

  _byKategori() {
    const st = this._findEntity("debt_by_category", 3) || this._findEntity("debt_by_kategori", 3);
    if (!st || !st.attributes) return {};
    const cats = st.attributes.by_kategori || st.attributes.by_category || st.attributes;
    if (cats && typeof cats === "object" && !Array.isArray(cats)) {
      const cleaned = {};
      Object.keys(cats).forEach((k) => {
        if (
          k !== "friendly_name" &&
          k !== "icon" &&
          k !== "unit_of_measurement" &&
          typeof cats[k] === "number"
        ) {
          cleaned[k] = cats[k];
        }
      });
      return cleaned;
    }
    return {};
  }

  _shoppingCategories() {
    const seen = new Set(DEFAULT_SHOPPING_CATS);
    this._shopping().forEach((it) => {
      if (it.cat) seen.add(it.cat);
    });
    return Array.from(seen);
  }

  _debtCategories() {
    const seen = new Set(DEFAULT_DEBT_CATS);
    Object.keys(this._byKategori()).forEach((k) => seen.add(k));
    return Array.from(seen);
  }

  // ------------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------------

  _render() {
    const root = this._root || (this._root = this.attachShadow({ mode: "open" }));
    this._setupListeners();

    const shopping = this._shopping();
    const cats = this._byKategori();
    const debtList = this._debtList();
    const total = this._total();

    const shoppingItems = shopping
      .map(
        (it) => `
        <li class="item ${this._editShoppingId === it.id ? "editing" : ""}" data-id="${esc(it.id)}">
          <button type="button" class="chk-btn ${it.done ? "checked" : ""}" data-action="toggle-shopping" data-id="${esc(it.id)}" title="Tandai selesai">
            ${it.done ? "&#10003;" : ""}
          </button>
          <span class="name ${it.done ? "done" : ""}" data-action="toggle-shopping" data-id="${esc(it.id)}">${esc(it.name)}</span>
          ${it.qty ? `<span class="q">&times; ${esc(it.qty)}</span>` : ""}
          <span class="cat">${esc(it.cat || "")}</span>
          <button type="button" class="edit-btn" title="Edit" data-action="edit-shopping" data-id="${esc(it.id)}">&#9998;</button>
          <button type="button" class="del" title="Hapus" data-action="del-shopping" data-id="${esc(it.id)}">&times;</button>
        </li>`
      )
      .join("");

    const debtItems = debtList
      .map(
        (d) => `
      <li class="debt ${this._editDebtId === d.id ? "editing" : ""}" data-id="${esc(d.id)}">
        <div class="debt-main">
          <div class="debt-head">
            <strong>${esc(d.kategori || "Lainnya")}</strong>
            <span class="nom">Rp ${(Number(d.nominal) || 0).toLocaleString("id-ID")}</span>
          </div>
          ${
            d.catatan || d.due_date
              ? `<div class="note">${esc(d.catatan || "")} ${
                  d.due_date ? `(${esc(String(d.due_date).split("T"))})` : ""
                }</div>`
              : ""
          }
        </div>
        <button type="button" class="edit-btn" title="Edit" data-action="edit-debt" data-id="${esc(d.id)}">&#9998;</button>
        <button type="button" class="del" title="Hapus" data-action="del-debt" data-id="${esc(d.id)}">&times;</button>
      </li>`
      )
      .join("");

    const totalRows = Object.keys(cats)
      .map(
        (k) =>
          `<tr><td>${esc(k)}</td><td class="num">Rp ${(Number(cats[k]) || 0).toLocaleString("id-ID")}</td></tr>`
      )
      .join("");

    const totalLabel = `Rp ${Math.round(total).toLocaleString("id-ID")}`;

    const shoppingCatOptions = this._shoppingCategories()
      .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
      .join("");

    const debtCatOptions = this._debtCategories()
      .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
      .join("");

    const doneCount = shopping.filter((it) => it.done).length;

    root.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
          color: var(--primary-text-color, #e1e1e1);
        }
        ha-card {
          padding: 16px;
          box-sizing: border-box;
        }
        h2 {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 4px;
          color: var(--primary-text-color);
        }
        .sub {
          font-size: 12px;
          color: var(--secondary-text-color, #9e9e9e);
          margin-bottom: 14px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 720px) {
          .grid { grid-template-columns: 1fr; }
        }
        .panel {
          border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
          border-radius: 10px;
          overflow: hidden;
          background: var(--card-background-color, transparent);
        }
        .panel-title {
          font-weight: 600;
          font-size: 13px;
          padding: 10px 12px;
          background: var(--secondary-background-color, rgba(255, 255, 255, 0.04));
          border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .mini-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.15));
          color: var(--primary-text-color, #fff);
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .mini-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .add-form {
          display: flex;
          gap: 6px;
          padding: 8px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        }
        .add-form .in {
          flex: 1 1 85px;
          min-width: 0;
          padding: 6px 8px;
          border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.2));
          border-radius: 6px;
          font-size: 13px;
          background: var(--card-background-color, #1c1c1c);
          color: var(--primary-text-color, #fff);
        }
        .add-form .btn {
          padding: 6px 12px;
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
        }
        .add-form .btn.cancel {
          background: var(--secondary-background-color, #444);
          color: var(--primary-text-color, #fff);
        }
        .add-form .btn:hover {
          opacity: 0.9;
        }
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .item, .debt {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08));
        }
        .item.editing, .debt.editing {
          background: rgba(3, 169, 244, 0.12);
        }
        .item:last-child, .debt:last-child {
          border-bottom: none;
        }
        .chk-btn {
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          border-radius: 4px;
          border: 1.5px solid var(--secondary-text-color, #9e9e9e);
          background: transparent;
          color: #fff;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
        }
        .chk-btn.checked {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
        }
        .name {
          flex: 1 1 auto;
          font-size: 14px;
          min-width: 0;
          word-break: break-word;
          cursor: pointer;
        }
        .name.done {
          text-decoration: line-through;
          opacity: 0.5;
        }
        .q {
          color: var(--secondary-text-color, #9e9e9e);
          font-size: 12px;
          white-space: nowrap;
        }
        .cat {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--secondary-background-color, rgba(255, 255, 255, 0.08));
          color: var(--secondary-text-color, #bdbdbd);
          flex: 0 0 auto;
        }
        .edit-btn, .del {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 15px;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 4px;
        }
        .edit-btn {
          color: var(--primary-color, #03a9f4);
        }
        .edit-btn:hover {
          background: rgba(3, 169, 244, 0.15);
        }
        .del {
          color: var(--error-color, #db4437);
          font-size: 17px;
        }
        .del:hover {
          background: rgba(219, 68, 55, 0.15);
        }
        .debt-main {
          flex: 1 1 auto;
          min-width: 0;
        }
        .debt-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          gap: 8px;
        }
        .nom {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .note {
          font-size: 12px;
          color: var(--secondary-text-color, #9e9e9e);
          margin-top: 2px;
        }
        .num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          background: var(--secondary-background-color, rgba(255, 255, 255, 0.02));
        }
        td {
          padding: 6px 10px;
          border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        }
        .total-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          border-radius: 10px;
          margin-top: 12px;
          font-weight: 600;
        }
        .total-bar h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .empty {
          padding: 12px;
          font-size: 12px;
          color: var(--secondary-text-color, #9e9e9e);
          text-align: center;
        }
      </style>

      <ha-card>
        <h2>${esc(this._title)}</h2>
        <div class="sub">Belanja &amp; hutang &middot; simpan di HA Store</div>

        <div class="grid">
          <div class="panel">
            <div class="panel-title">
              <span>Shopping List (${shopping.length} item)</span>
              ${doneCount > 0 ? `<button type="button" class="mini-btn" data-action="clear-done">Hapus Selesai (${doneCount})</button>` : ""}
            </div>
            <div class="add-form">
              <input id="name-add" class="in" placeholder="Nama item" />
              <input id="qty-add" class="in" placeholder="Qty (opsional)" />
              <select id="cat-shopping" class="in">${shoppingCatOptions}</select>
              <button type="button" id="btn-submit-shopping" data-action="add-shopping" class="btn">+ Tambah</button>
              <button type="button" id="btn-cancel-shopping" data-action="cancel-edit-shopping" class="btn cancel" style="display:none;">Batal</button>
            </div>
            <ul class="list">
              ${shoppingItems || '<li class="empty">Kosong &middot; tambah item di atas</li>'}
            </ul>
          </div>

          <div class="panel">
            <div class="panel-title">
              <span>Utang</span>
              <span>Total: ${esc(totalLabel)}</span>
            </div>
            <div class="add-form">
              <select id="cat-debt" class="in">${debtCatOptions}</select>
              <input id="amount-add" class="in" placeholder="Nominal" inputmode="numeric" />
              <input id="note-add" class="in" placeholder="Catatan (opsional)" />
              <input id="due-add" class="in" type="date" title="Jatuh tempo" />
              <button type="button" id="btn-submit-debt" data-action="add-debt" class="btn">+ Tambah</button>
              <button type="button" id="btn-cancel-debt" data-action="cancel-edit-debt" class="btn cancel" style="display:none;">Batal</button>
            </div>
            <ul class="list">
              ${debtItems || '<li class="empty">Belum ada utang &middot; tambah di atas</li>'}
            </ul>
            ${totalRows ? `<table>${totalRows}</table>` : ""}
          </div>
        </div>

        <div class="total-bar">
          <h3>Total Utang</h3>
          <span>${esc(totalLabel)}</span>
        </div>
      </ha-card>`;
  }

  // ------------------------------------------------------------------------
  // Event Delegation
  // ------------------------------------------------------------------------

  _setupListeners() {
    const root = this._root;
    if (!root || this._listenersAttached) return;
    this._listenersAttached = true;

    root.addEventListener("click", async (ev) => {
      const el = ev.target.closest("[data-action]");
      if (!el) return;

      ev.preventDefault();
      ev.stopPropagation();
      const action = el.dataset.action;
      const id = String(el.dataset.id || "");

      if (action === "toggle-shopping" && id) {
        const current = this._shopping().find((it) => String(it.id) === id);
        const nextDone = current ? !current.done : true;
        this._optimisticDone.set(id, nextDone);
        this._render();
        await this._call("custom_shopping_and_debt_list_toggle_shopping", {
          item_id: id,
        });
        this._lastSignature = "";
      } else if (action === "add-shopping") {
        const name = this._val("name-add");
        if (!name) return;
        const qty = this._val("qty-add");
        const cat = this._val("cat-shopping") || "Kebutuhan";

        if (this._editShoppingId) {
          const oldId = this._editShoppingId;
          this._editShoppingId = null;
          await this._call("custom_shopping_and_debt_list_remove_shopping", {
            item_id: String(oldId),
          });
        }
        await this._call("custom_shopping_and_debt_list_add_shopping", {
          name,
          qty,
          cat,
        });
        this._lastSignature = "";
      } else if (action === "edit-shopping") {
        const item = this._shopping().find((it) => String(it.id) === id);
        if (!item) return;
        this._editShoppingId = item.id;
        this._setVal("name-add", item.name || "");
        this._setVal("qty-add", item.qty || "");
        this._setVal("cat-shopping", item.cat || "Kebutuhan");
        const btnSub = root.querySelector("#btn-submit-shopping");
        const btnCan = root.querySelector("#btn-cancel-shopping");
        if (btnSub) btnSub.textContent = "Simpan";
        if (btnCan) btnCan.style.display = "inline-block";
        root.querySelector("#name-add")?.focus();
      } else if (action === "cancel-edit-shopping") {
        this._editShoppingId = null;
        this._setVal("name-add", "");
        this._setVal("qty-add", "");
        const btnSub = root.querySelector("#btn-submit-shopping");
        const btnCan = root.querySelector("#btn-cancel-shopping");
        if (btnSub) btnSub.textContent = "+ Tambah";
        if (btnCan) btnCan.style.display = "none";
      } else if (action === "clear-done") {
        const doneItems = this._shopping().filter((it) => it.done);
        for (const it of doneItems) {
          await this._call("custom_shopping_and_debt_list_remove_shopping", {
            item_id: String(it.id),
          });
        }
        this._lastSignature = "";
      } else if (action === "add-debt") {
        const kategori = this._val("cat-debt");
        const nominalRaw = this._val("amount-add").replace(/[^\d.-]/g, "");
        if (!kategori || !nominalRaw) return;
        const catatan = this._val("note-add");
        const due_date = this._val("due-add");

        if (this._editDebtId) {
          const oldId = this._editDebtId;
          this._editDebtId = null;
          await this._call("custom_shopping_and_debt_list_remove_debt", {
            entry_id: String(oldId),
          });
        }
        await this._call("custom_shopping_and_debt_list_add_debt", {
          kategori,
          nominal: String(nominalRaw),
          catatan,
          due_date,
        });
        this._lastSignature = "";
      } else if (action === "edit-debt") {
        const debt = this._debtList().find((d) => String(d.id) === id);
        if (!debt) return;
        this._editDebtId = debt.id;
        this._setVal("cat-debt", debt.kategori || "Kategori");
        this._setVal("amount-add", String(debt.nominal || ""));
        this._setVal("note-add", debt.catatan || "");
        this._setVal("due-add", debt.due_date ? String(debt.due_date).split("T") : "");
        const btnSub = root.querySelector("#btn-submit-debt");
        const btnCan = root.querySelector("#btn-cancel-debt");
        if (btnSub) btnSub.textContent = "Simpan";
        if (btnCan) btnCan.style.display = "inline-block";
        root.querySelector("#amount-add")?.focus();
      } else if (action === "cancel-edit-debt") {
        this._editDebtId = null;
        this._setVal("amount-add", "");
        this._setVal("note-add", "");
        this._setVal("due-add", "");
        const btnSub = root.querySelector("#btn-submit-debt");
        const btnCan = root.querySelector("#btn-cancel-debt");
        if (btnSub) btnSub.textContent = "+ Tambah";
        if (btnCan) btnCan.style.display = "none";
      } else if (action === "del-shopping") {
        await this._call("custom_shopping_and_debt_list_remove_shopping", {
          item_id: id,
        });
        this._lastSignature = "";
      } else if (action === "del-debt") {
        await this._call("custom_shopping_and_debt_list_remove_debt", {
          entry_id: id,
        });
        this._lastSignature = "";
      }
    });
  }

  _val(id) {
    const root = this._root;
    if (!root) return "";
    const el = root.querySelector("#" + id);
    return el ? String(el.value || "").trim() : "";
  }

  _setVal(id, value) {
    const root = this._root;
    if (!root) return;
    const el = root.querySelector("#" + id);
    if (el) el.value = value;
  }

  // ------------------------------------------------------------------------
  // Services
  // ------------------------------------------------------------------------

  async _call(service, data) {
    if (!this._hass) return;
    try {
      await this._hass.callService(DOMAIN, service, data);
    } catch (e) {
      console.warn("custom-shopping-and-debt-list: call failed", service, e);
    }
  }

  // ------------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------------

  connectedCallback() {
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
    }
    this._setupListeners();
    this._render();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
}

// ---------------------------------------------------------------------------
// Register element
// ---------------------------------------------------------------------------

if (!customElements.get("custom-shopping-and-debt-list")) {
  customElements.define("custom-shopping-and-debt-list", NdlongShopCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:custom-shopping-and-debt-list",
  name: "Belanja & Utang",
  description: "Shopping list + debt list with running total",
  preview: false,
});

console.info(
  "%c BELANJA & UTANG CARD %c v1.3 ",
  "color: white; background: #03a9f4; font-weight: bold;",
  "color: #03a9f4; background: white; font-weight: bold;"
);
