/**
 * Custom Lovelace card for the Custom Shopping and Debt List integration.
 *
 * The card structure and forms are created only once. Home Assistant state
 * updates replace only the dynamic list content, so typing, focus, and form
 * values are not interrupted.
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
  :host {
    display: block;
  }

  .wrap {
    font-family: var(--paper-font-body1_-_font-family, inherit);
    color: var(--primary-text-color);
  }

  h2 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 500;
  }

  h3 {
    margin: 16px 0 4px;
    font-size: 14px;
    font-weight: 500;
    opacity: 0.8;
  }

  .muted {
    opacity: 0.6;
    font-size: 12px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li.item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 8px;
  }

  li.item + li.item {
    border-top: 1px solid var(--divider-color, #e0e0e0);
  }

  li.item.done .name {
    text-decoration: line-through;
    opacity: 0.5;
  }

  li.item .name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  li.item .qty {
    opacity: 0.7;
    font-size: 12px;
    white-space: nowrap;
  }

  li.item .cat {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--secondary-background-color, #eee);
    opacity: 0.8;
    white-space: nowrap;
  }

  button {
    cursor: pointer;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 6px;
  }

  button:hover {
    background: var(--secondary-background-color, #eee);
  }

  button.primary {
    background: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
    padding: 6px 12px;
  }

  button.cancel {
    background: var(--secondary-background-color, #eee);
    color: var(--primary-text-color);
    padding: 6px 12px;
  }

  form {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 8px;
  }

  input,
  select {
    font: inherit;
    color: inherit;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--divider-color, #ccc);
    background: var(--card-background-color, #fff);
  }

  input.grow {
    flex: 1;
    min-width: 90px;
  }

  input[type="checkbox"] {
    flex: 0 0 auto;
  }

  .total {
    font-size: 22px;
    font-weight: 600;
  }

  .cat-row {
    margin-bottom: 2px;
  }

  .card {
    background: var(--card-background-color, #fff);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    box-shadow: var(--ha-card-box-shadow, none);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }
`;

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
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
    this._lastSignature = "";
    this._editShoppingId = null;
    this._editDebtId = null;
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
      .map((entity) =>
        typeof entity === "string" ? entity : entity?.entity_id,
      )
      .filter(Boolean);

    this._entityIds = parsed.length ? parsed : [...DEFAULT_ENTITIES];
    this._lastSignature = "";

    if (this._root) {
      const heading = this._root.querySelector("[data-card-title]");
      if (heading) {
        heading.textContent =
          this._config.title || "Daftar Belanja & Hutang";
      }
    }

    this._scheduleRender();
  }

  set hass(hass) {
    this._hass = hass;
    if (!hass || !hass.states) return;

    const signature = this._entityIds
      .map((entityId) => {
        const state = hass.states[entityId];
        if (!state) return `${entityId}:none`;

        let attributes = "";
        try {
          attributes = JSON.stringify(state.attributes || {});
        } catch (_err) {
          attributes = "";
        }

        return `${entityId}:${state.state}:${attributes}`;
      })
      .join("|");

    if (signature === this._lastSignature) return;

    this._lastSignature = signature;
    this._scheduleRender();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
    }

    this._buildShell();
    this._attachListeners();
    this._scheduleRender();
  }

  disconnectedCallback() {
    this._renderQueued = false;
  }

  _scheduleRender() {
    if (this._renderQueued) return;

    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      this._renderData();
    });
  }

  _buildShell() {
    if (this._root.querySelector(".card")) return;

    const title = this._config.title || "Daftar Belanja & Hutang";

    this._root.innerHTML = `
      <style>${STYLES}</style>
      <div class="wrap card">
        <h2 data-card-title>${esc(title)}</h2>

        <h3>Belanja</h3>
        <div data-shopping-summary class="muted"></div>
        <ul data-shopping-list></ul>

        <form id="add-item-form">
          <input
            class="grow"
            name="name"
            placeholder="Nama barang"
            autocomplete="off"
            required
          >
          <input
            name="qty"
            placeholder="Jumlah"
            autocomplete="off"
            style="width:90px"
          >
          <select name="cat" data-shopping-category></select>
          <button type="submit" class="primary" data-shopping-submit>
            Tambah
          </button>
          <button
            type="button"
            class="cancel"
            data-action="cancel-edit-shopping"
            data-shopping-cancel
            hidden
          >
            Batal
          </button>
        </form>

        <div class="actions">
          <button
            type="button"
            data-action="clear-done-shopping"
            data-clear-done-shopping
            hidden
          >
            Hapus yang selesai
          </button>
          <button
            type="button"
            data-action="clear-shopping"
            data-clear-shopping
            hidden
          >
            Kosongkan daftar belanja
          </button>
        </div>

        <h3>Hutang</h3>
        <div class="total" data-debt-total>Rp 0</div>
        <div data-debt-categories></div>
        <ul data-debt-list></ul>

        <form id="add-debt-form">
          <select name="kategori" data-debt-category></select>
          <input
            name="nominal"
            placeholder="Nominal"
            inputmode="numeric"
            autocomplete="off"
            required
            style="width:110px"
          >
          <input
            class="grow"
            name="catatan"
            placeholder="Catatan"
            autocomplete="off"
          >
          <input
            name="due_date"
            type="date"
            style="width:140px"
          >
          <button type="submit" class="primary" data-debt-submit>
            Tambah
          </button>
          <button
            type="button"
            class="cancel"
            data-action="cancel-edit-debt"
            data-debt-cancel
            hidden
          >
            Batal
          </button>
        </form>

        <div class="actions">
          <button
            type="button"
            data-action="clear-debt"
            data-clear-debt
            hidden
          >
            Kosongkan daftar utang
          </button>
        </div>
      </div>
    `;
  }

  _entityState(suffix, fallbackIndex) {
    if (!this._hass || !this._hass.states) return null;

    const found = this._entityIds.find((entityId) =>
      entityId.endsWith(suffix),
    );
    const target = found || this._entityIds[fallbackIndex];

    if (!target) return null;
    return this._hass.states[target] || null;
  }

  _shopping() {
    const state = this._entityState("shopping_list", 0);
    if (!state || !state.attributes) return [];

    const list =
      state.attributes.list ||
      state.attributes.items ||
      state.attributes.shopping_list;

    return Array.isArray(list) ? list : [];
  }

  _debt() {
    const state = this._entityState("debt_list", 2);
    if (!state || !state.attributes) return [];

    const list =
      state.attributes.debt_list ||
      state.attributes.list ||
      state.attributes.entries;

    return Array.isArray(list) ? list : [];
  }

  _total() {
    const state =
      this._entityState("total_debt", 1) ||
      this._entityState("debt_total", 1);
    const total = state ? Number(state.state) : 0;

    return Number.isFinite(total) ? total : 0;
  }

  _byKategori() {
    const state =
      this._entityState("debt_by_category", 3) ||
      this._entityState("debt_by_kategori", 3);

    if (!state || !state.attributes) return {};

    const categories =
      state.attributes.by_kategori ||
      state.attributes.by_category ||
      state.attributes;

    if (!categories || typeof categories !== "object") return {};
    if (Array.isArray(categories)) return {};

    const cleaned = {};
    Object.keys(categories).forEach((key) => {
      if (
        key !== "friendly_name" &&
        key !== "icon" &&
        key !== "unit_of_measurement" &&
        typeof categories[key] === "number"
      ) {
        cleaned[key] = categories[key];
      }
    });

    return cleaned;
  }

  _shoppingCategories() {
    const categories = new Set(DEFAULT_SHOPPING_CATS);

    this._shopping().forEach((item) => {
      if (item?.cat) categories.add(item.cat);
    });

    return Array.from(categories);
  }

  _debtCategories() {
    const categories = new Set(DEFAULT_DEBT_CATS);

    Object.keys(this._byKategori()).forEach((key) => categories.add(key));

    this._debt().forEach((entry) => {
      if (entry?.kategori) categories.add(entry.kategori);
    });

    return Array.from(categories);
  }

  _renderData() {
    if (!this.isConnected || !this._root) return;

    const shopping = this._shopping();
    const debt = this._debt();
    const total = this._total();
    const byKategori = this._byKategori();
    const doneCount = shopping.filter((item) => Boolean(item?.done)).length;

    this._updateSelect(
      this._root.querySelector("[data-shopping-category]"),
      this._shoppingCategories(),
    );
    this._updateSelect(
      this._root.querySelector("[data-debt-category]"),
      this._debtCategories(),
    );

    const summary = this._root.querySelector("[data-shopping-summary]");
    if (summary) {
      summary.textContent = shopping.length
        ? `${shopping.length} item, ${doneCount} selesai`
        : "Belanja kosong.";
    }

    const shoppingList = this._root.querySelector(
      "[data-shopping-list]",
    );
    if (shoppingList) {
      shoppingList.innerHTML = shopping.length
        ? shopping.map((item) => this._shoppingRow(item)).join("")
        : "";
    }

    const debtList = this._root.querySelector("[data-debt-list]");
    if (debtList) {
      debtList.innerHTML = debt.length
        ? debt.map((entry) => this._debtRow(entry)).join("")
        : "";
    }

    const totalElement = this._root.querySelector("[data-debt-total]");
    if (totalElement) {
      totalElement.textContent = `Rp ${Math.round(total).toLocaleString(
        "id-ID",
      )}`;
    }

    const categoryElement = this._root.querySelector(
      "[data-debt-categories]",
    );
    if (categoryElement) {
      const categoryNames = Object.keys(byKategori);
      categoryElement.innerHTML = categoryNames.length
        ? categoryNames
            .map(
              (key) =>
                `<div class="cat-row"><span>${esc(key)}</span>: <b>Rp ${Number(
                  byKategori[key],
                ).toLocaleString("id-ID")}</b></div>`,
            )
            .join("")
        : '<div class="muted">Belum ada utang.</div>';
    }

    const clearDone = this._root.querySelector(
      "[data-clear-done-shopping]",
    );
    if (clearDone) clearDone.hidden = doneCount === 0;

    const clearShopping = this._root.querySelector(
      "[data-clear-shopping]",
    );
    if (clearShopping) clearShopping.hidden = shopping.length === 0;

    const clearDebt = this._root.querySelector("[data-clear-debt]");
    if (clearDebt) clearDebt.hidden = debt.length === 0;
  }

  _updateSelect(select, categories) {
    if (!select) return;

    const selected = select.value;
    const options = categories
      .map(
        (category) =>
          `<option value="${esc(category)}">${esc(category)}</option>`,
      )
      .join("");

    select.innerHTML = options;

    if (categories.includes(selected)) {
      select.value = selected;
    }
  }

  _shoppingRow(item) {
    const id = esc(item?.id);
    const done = Boolean(item?.done);

    return `
      <li class="item ${done ? "done" : ""}">
        <input
          type="checkbox"
          data-action="toggle"
          data-id="${id}"
          ${done ? "checked" : ""}
          aria-label="Tandai selesai"
        >
        <span class="name">${esc(item?.name)}</span>
        <span class="qty">${esc(item?.qty)}</span>
        <span class="cat">${esc(item?.cat)}</span>
        <button
          type="button"
          data-action="edit-shopping"
          data-id="${id}"
          title="Edit"
        >
          &#9998;
        </button>
        <button
          type="button"
          data-action="remove-shopping"
          data-id="${id}"
          title="Hapus"
        >
          &#215;
        </button>
      </li>
    `;
  }

  _debtRow(entry) {
    const id = esc(entry?.id);
    const due = entry?.due_date
      ? ` · jatuh tempo ${esc(String(entry.due_date).split("T")[0])}`
      : "";
    const note = entry?.catatan ? ` (${esc(entry.catatan)})` : "";

    return `
      <li class="item">
        <span class="name">
          ${esc(entry?.kategori)}${note}${due}
        </span>
        <span class="qty">
          Rp ${Number(entry?.nominal || 0).toLocaleString("id-ID")}
        </span>
        <button
          type="button"
          data-action="edit-debt"
          data-id="${id}"
          title="Edit"
        >
          &#9998;
        </button>
        <button
          type="button"
          data-action="remove-debt"
          data-id="${id}"
          title="Hapus"
        >
          &#215;
        </button>
      </li>
    `;
  }

  _attachListeners() {
    if (this._listenersAttached || !this._root) return;

    this._listenersAttached = true;

    this._root.addEventListener("click", (event) => {
      const target = event.target;
      if (!target?.closest) return;

      const element = target.closest("[data-action]");
      if (!element) return;

      event.preventDefault();

      const action = element.dataset.action;
      const id = element.dataset.id || "";

      if (action === "toggle" && id) {
        this._call("custom_shopping_and_debt_list_toggle_shopping", {
          item_id: id,
        });
      } else if (action === "remove-shopping" && id) {
        this._call("custom_shopping_and_debt_list_remove_shopping", {
          item_id: id,
        });
      } else if (action === "remove-debt" && id) {
        this._call("custom_shopping_and_debt_list_remove_debt", {
          entry_id: id,
        });
      } else if (action === "clear-shopping") {
        this._call("custom_shopping_and_debt_list_clear_shopping", {});
      } else if (action === "clear-debt") {
        this._call("custom_shopping_and_debt_list_clear_debt", {});
      } else if (action === "clear-done-shopping") {
        this._clearDoneShopping();
      } else if (action === "edit-shopping") {
        this._startShoppingEdit(id);
      } else if (action === "cancel-edit-shopping") {
        this._cancelShoppingEdit();
      } else if (action === "edit-debt") {
        this._startDebtEdit(id);
      } else if (action === "cancel-edit-debt") {
        this._cancelDebtEdit();
      }
    });

    this._root.addEventListener("submit", (event) => {
      const form = event.target;
      if (!form?.id) return;

      event.preventDefault();

      if (form.id === "add-item-form") {
        this._submitShopping(form);
      } else if (form.id === "add-debt-form") {
        this._submitDebt(form);
      }
    });
  }

  async _submitShopping(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    if (!name) return;

    const qty = String(formData.get("qty") || "").trim();
    const category =
      String(formData.get("cat") || "Kebutuhan").trim() || "Kebutuhan";

    if (this._editShoppingId) {
      const oldId = String(this._editShoppingId);
      this._editShoppingId = null;

      await this._call(
        "custom_shopping_and_debt_list_remove_shopping",
        { item_id: oldId },
      );
    }

    await this._call("custom_shopping_and_debt_list_add_shopping", {
      name,
      qty,
      cat: category,
    });

    form.reset();
    this._setShoppingEditMode(false);
    this._lastSignature = "";
  }

  async _submitDebt(form) {
    const formData = new FormData(form);
    const kategori = String(formData.get("kategori") || "").trim();
    const nominal = String(formData.get("nominal") || "")
      .replace(/[^\d.-]/g, "")
      .trim();

    if (!kategori || !nominal) return;

    const catatan = String(formData.get("catatan") || "").trim();
    const dueDate = String(formData.get("due_date") || "").trim();

    if (this._editDebtId) {
      const oldId = String(this._editDebtId);
      this._editDebtId = null;

      await this._call("custom_shopping_and_debt_list_remove_debt", {
        entry_id: oldId,
      });
    }

    await this._call("custom_shopping_and_debt_list_add_debt", {
      kategori,
      nominal,
      catatan,
      due_date: dueDate,
    });

    form.reset();
    this._setDebtEditMode(false);
    this._lastSignature = "";
  }

  async _clearDoneShopping() {
    const doneItems = this._shopping().filter((item) => item?.done);

    for (const item of doneItems) {
      await this._call("custom_shopping_and_debt_list_remove_shopping", {
        item_id: String(item.id),
      });
    }

    this._lastSignature = "";
  }

  _startShoppingEdit(id) {
    const item = this._shopping().find(
      (entry) => String(entry.id) === String(id),
    );
    if (!item) return;

    this._editShoppingId = item.id;

    const form = this._root.querySelector("#add-item-form");
    if (!form) return;

    form.elements.name.value = item.name || "";
    form.elements.qty.value = item.qty || "";

    const category = form.elements.cat;
    if (category) category.value = item.cat || "Kebutuhan";

    this._setShoppingEditMode(true);
    form.elements.name.focus();
  }

  _cancelShoppingEdit() {
    this._editShoppingId = null;

    const form = this._root.querySelector("#add-item-form");
    if (form) form.reset();

    this._setShoppingEditMode(false);
  }

  _setShoppingEditMode(editing) {
    const submit = this._root.querySelector("[data-shopping-submit]");
    const cancel = this._root.querySelector("[data-shopping-cancel]");

    if (submit) submit.textContent = editing ? "Simpan" : "Tambah";
    if (cancel) cancel.hidden = !editing;
  }

  _startDebtEdit(id) {
    const entry = this._debt().find(
      (item) => String(item.id) === String(id),
    );
    if (!entry) return;

    this._editDebtId = entry.id;

    const form = this._root.querySelector("#add-debt-form");
    if (!form) return;

    const category = form.elements.kategori;
    if (category) category.value = entry.kategori || "Lainnya";

    form.elements.nominal.value = String(entry.nominal || "");
    form.elements.catatan.value = entry.catatan || "";
    form.elements.due_date.value = entry.due_date
      ? String(entry.due_date).split("T")[0]
      : "";

    this._setDebtEditMode(true);
    form.elements.nominal.focus();
  }

  _cancelDebtEdit() {
    this._editDebtId = null;

    const form = this._root.querySelector("#add-debt-form");
    if (form) form.reset();

    this._setDebtEditMode(false);
  }

  _setDebtEditMode(editing) {
    const submit = this._root.querySelector("[data-debt-submit]");
    const cancel = this._root.querySelector("[data-debt-cancel]");

    if (submit) submit.textContent = editing ? "Simpan" : "Tambah";
    if (cancel) cancel.hidden = !editing;
  }

  async _call(service, data) {
    if (!this._hass) return;

    try {
      await this._hass.callService(DOMAIN, service, data);
    } catch (error) {
      console.error(
        `custom-shopping-and-debt-list: ${service} failed`,
        error,
      );
    }
  }
}

if (!customElements.get("custom-shopping-and-debt-list")) {
  customElements.define(
    "custom-shopping-and-debt-list",
    NdlongShopCard,
  );
}

window.customCards = window.customCards || [];

if (
  !window.customCards.some(
    (card) => card.type === "custom-shopping-and-debt-list",
  )
) {
  window.customCards.push({
    type: "custom-shopping-and-debt-list",
    name: "Daftar Belanja & Utang",
    description:
      "Kartu daftar belanja dan hutang untuk Custom Shopping and Debt List.",
    preview: true,
  });
}
