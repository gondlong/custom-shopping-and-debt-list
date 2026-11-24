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

const CARD_STYLES = [
  ":host { display: block; font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); color: var(--primary-text-color, #e1e1e1); }",
  "ha-card { padding: 16px; box-sizing: border-box; }",
  "h2 { font-size: 18px; font-weight: 500; margin: 0 0 4px; color: var(--primary-text-color); }",
  ".sub { font-size: 12px; color: var(--secondary-text-color, #9e9e9e); margin-bottom: 14px; }",
  ".grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }",
  "@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }",
  ".panel { border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12)); border-radius: 10px; overflow: hidden; background: var(--card-background-color, transparent); display: flex; flex-direction: column; }",
  ".panel-title { font-weight: 600; font-size: 13px; padding: 10px 12px; background: var(--secondary-background-color, rgba(255, 255, 255, 0.04)); border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12)); display: flex; justify-content: space-between; align-items: center; gap: 8px; }",
  ".due-badge { font-size: 12px; font-weight: 600; color: var(--warning-color, #ffb74d); }",
  ".mini-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.15)); color: var(--primary-text-color, #fff); font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer; }",
  ".mini-btn:hover { background: rgba(255, 255, 255, 0.15); }",
  ".add-form { display: flex; gap: 6px; padding: 8px; flex-wrap: wrap; border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12)); align-items: center; }",
  ".add-form .in { flex: 1 1 85px; min-width: 0; padding: 6px 8px; border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.2)); border-radius: 6px; font-size: 13px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); }",
  ".inst-group { display: flex; align-items: center; gap: 4px; background: var(--card-background-color, #1c1c1c); border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.2)); border-radius: 6px; padding: 0 6px; }",
  ".inst-group span { font-size: 12px; color: var(--secondary-text-color, #9e9e9e); white-space: nowrap; }",
  ".inst-in { width: 34px; padding: 6px 2px; border: none; background: transparent; color: var(--primary-text-color, #fff); font-size: 13px; text-align: center; }",
  ".inst-in:focus { outline: none; }",
  ".add-form .btn { padding: 6px 12px; background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }",
  ".add-form .btn.cancel { background: var(--secondary-background-color, #444); color: var(--primary-text-color, #fff); }",
  ".add-form .btn:hover { opacity: 0.9; }",
  ".list { list-style: none; margin: 0; padding: 0; }",
  ".item, .debt { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08)); }",
  ".item.editing, .debt.editing { background: rgba(3, 169, 244, 0.12); }",
  ".item:last-child, .debt:last-child { border-bottom: none; }",
  ".chk-btn { width: 18px; height: 18px; flex: 0 0 18px; border-radius: 4px; border: 1.5px solid var(--secondary-text-color, #9e9e9e); background: transparent; color: #fff; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }",
  ".chk-btn.checked { background: var(--primary-color, #03a9f4); border-color: var(--primary-color, #03a9f4); }",
  ".name { flex: 1 1 auto; font-size: 14px; min-width: 0; word-break: break-word; cursor: pointer; }",
  ".name.done { text-decoration: line-through; opacity: 0.5; }",
  ".q { color: var(--secondary-text-color, #9e9e9e); font-size: 12px; white-space: nowrap; }",
  ".cat { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--secondary-background-color, rgba(255, 255, 255, 0.08)); color: var(--secondary-text-color, #bdbdbd); flex: 0 0 auto; }",
  ".inst-badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: rgba(3, 169, 244, 0.18); color: #4fc3f7; font-weight: 600; margin-left: 6px; white-space: nowrap; }",
  ".pay-btn { background: rgba(76, 175, 80, 0.16); border: 1px solid rgba(76, 175, 80, 0.4); color: #81c784; font-size: 11px; font-weight: 600; padding: 3px 7px; border-radius: 4px; cursor: pointer; white-space: nowrap; }",
  ".pay-btn:hover { background: rgba(76, 175, 80, 0.28); }",
  ".edit-btn, .del { background: none; border: none; cursor: pointer; font-size: 15px; line-height: 1; padding: 4px 6px; border-radius: 4px; }",
  ".edit-btn { color: var(--primary-color, #03a9f4); }",
  ".edit-btn:hover { background: rgba(3, 169, 244, 0.15); }",
  ".del { color: var(--error-color, #db4437); font-size: 17px; }",
  ".del:hover { background: rgba(219, 68, 55, 0.15); }",
  ".debt-main { flex: 1 1 auto; min-width: 0; }",
  ".debt-head { display: flex; justify-content: space-between; align-items: center; font-size: 14px; gap: 8px; }",
  ".debt-title-wrap { display: flex; align-items: center; flex-wrap: wrap; min-width: 0; }",
  ".nom { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }",
  ".note { font-size: 12px; color: var(--secondary-text-color, #9e9e9e); margin-top: 2px; }",
  ".note.urgent { color: var(--warning-color, #ffb74d); font-weight: 500; }",
  ".num { text-align: right; font-variant-numeric: tabular-nums; }",
  "table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--secondary-background-color, rgba(255, 255, 255, 0.02)); }",
  "td { padding: 6px 10px; border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12)); }",
  ".total-bar { display: flex; justify-content: space-between; align-items: center; padding: 11px 14px; background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); font-weight: 600; border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12)); }",
  ".total-bar h3 { margin: 0; font-size: 14px; font-weight: 600; }",
  ".empty { padding: 12px; font-size: 12px; color: var(--secondary-text-color, #9e9e9e); text-align: center; }",
].join("\n");
class NdlongShopCard extends HTMLElement {
  constructor() {
    super();
    this._title = "Daftar Belanja & Hutang";
    this._entityIds = [...DEFAULT_ENTITIES];
    this._hass = null;
    this._root = null;
    this._shellBuilt = false;
    this._lastSignature = "";
    this._lastShoppingCatsSig = "";
    this._lastDebtCatsSig = "";
    this._editShoppingId = null;
    this._editDebtId = null;
    this._listenersAttached = false;
    this._optimisticDone = new Map();
  }

  getCardType() { return "custom:custom-shopping-and-debt-list"; }
  getConfigElement() { return null; }
  getStubConfig() {
    return { entities: [...DEFAULT_ENTITIES], title: "Daftar Belanja & Hutang" };
  }

  setConfig(config) {
    this._title = (config && config.title) || "Daftar Belanja & Hutang";
    const entities = (config && config.entities) || [];
    const parsed = entities.map((e) => (typeof e === "string" ? e : e && e.entity_id)).filter(Boolean);
    if (parsed.length) this._entityIds = parsed;
    this._lastSignature = "";
    if (this._root) {
      const titleEl = this._root.querySelector("#card-title");
      if (titleEl) titleEl.textContent = this._title;
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!hass || !hass.states) return;
    const sig = this._entityIds
      .map((id) => {
        const st = hass.states[id];
        return st ? id + ":" + st.state + ":" + JSON.stringify(st.attributes) : id + ":none";
      })
      .join("|");
    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      this._optimisticDone.clear();
      this._render();
    }
  }

  get hass() { return this._hass; }

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
      const done = this._optimisticDone.has(idStr) ? this._optimisticDone.get(idStr) : Boolean(it.done);
      return Object.assign({}, it, { done: done });
    });
  }

  _total() {
    const st = this._findEntity("total_debt", 1) || this._findEntity("debt_total", 1);
    const n = st ? Number(st.state) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  _parseDueDate(dueStr) {
    if (!dueStr) return null;
    const clean = String(dueStr).split("T").trim();
    const parts = clean.split("-");
    if (parts.length !== 3) return null;
    const year = Number(parts);
    const month = Number(parts) - 1;
    const day = Number(parts);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(year, month, day);
  }

  _addOneMonth(dueStr) {
    const d = this._parseDueDate(dueStr);
    if (!d) return "";
    const targetMonth = d.getMonth() + 1;
    const next = new Date(d.getFullYear(), targetMonth, d.getDate());
    // Tangani akhir bulan (misal 31 Jan -> 28 Feb)
    if (next.getMonth() !== targetMonth % 12) {
      next.setDate(0);
    }
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  _parseNoteAndInstallment(rawCatatan) {
    const text = String(rawCatatan || "");
    const match = text.match(/\[cicilan:(\d+)\/(\d+)\]/i);
    if (!match) {
      return { cleanNote: text.trim(), cur: null, total: null };
    }
    const cleanNote = text.replace(match, "").trim();
    return {
      cleanNote: cleanNote,
      cur: Number(match),
      total: Number(match),
    };
  }

  _formatNoteWithInstallment(cleanNote, cur, total) {
    const base = String(cleanNote || "").trim();
    const c = Number(cur);
    const t = Number(total);
    if (Number.isFinite(c) && Number.isFinite(t) && c > 0 && t > 0) {
      const tag = "[cicilan:" + c + "/" + t + "]";
      return base ? tag + " " + base : tag;
    }
    return base;
  }

  _debtList() {
    const st = this._findEntity("debt_list", 2);
    if (!st || !st.attributes) return [];
    const list = st.attributes.debt_list || st.attributes.list || st.attributes.entries;
    if (!Array.isArray(list)) return [];

    return list.slice().sort((a, b) => {
      const da = this._parseDueDate(a && a.due_date);
      const db = this._parseDueDate(b && b.due_date);
      if (da && db) return da.getTime() - db.getTime();
      if (da && !db) return -1;
      if (!da && db) return 1;
      return 0;
    });
  }

  _upcoming5DaysTotal(sortedDebtList) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limit = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    return sortedDebtList.reduce((sum, d) => {
      const due = this._parseDueDate(d && d.due_date);
      if (!due) return sum;
      if (due.getTime() <= limit.getTime()) {
        return sum + (Number(d.nominal) || 0);
      }
      return sum;
    }, 0);
  }

  _byKategori() {
    const st = this._findEntity("debt_by_category", 3) || this._findEntity("debt_by_kategori", 3);
    if (!st || !st.attributes) return {};
    const cats = st.attributes.by_kategori || st.attributes.by_category || st.attributes;
    if (cats && typeof cats === "object" && !Array.isArray(cats)) {
      const cleaned = {};
      Object.keys(cats).forEach((k) => {
        if (k !== "friendly_name" && k !== "icon" && k !== "unit_of_measurement" && typeof cats[k] === "number") {
          cleaned[k] = cats[k];
        }
      });
      return cleaned;
    }
    return {};
  }

  _shoppingCategories() {
    const seen = new Set(DEFAULT_SHOPPING_CATS);
    this._shopping().forEach((it) => { if (it.cat) seen.add(it.cat); });
    return Array.from(seen);
  }

  _debtCategories() {
    const seen = new Set(DEFAULT_DEBT_CATS);
    Object.keys(this._byKategori()).forEach((k) => seen.add(k));
    return Array.from(seen);
  }

  _buildShell() {
    if (this._shellBuilt && this._root) return;
    const root = this._root || (this._root = this.attachShadow({ mode: "open" }));
    this._shellBuilt = true;
    root.innerHTML = [
      "<style>" + CARD_STYLES + "</style>",
      "<ha-card>",
      '  <h2 id="card-title">' + esc(this._title) + "</h2>",
      '  <div class="sub">Belanja &amp; hutang &middot; simpan di HA Store</div>',
      '  <div class="grid">',
      '    <div class="panel">',
      '      <div class="panel-title">',
      '        <span id="shopping-count">Shopping List (0 item)</span>',
      '        <button type="button" id="btn-clear-done" class="mini-btn" data-action="clear-done" style="display:none;">Hapus Selesai (0)</button>',
      "      </div>",
      '      <div class="add-form">',
      '        <input id="name-add" class="in" placeholder="Nama item" autocomplete="off" />',
      '        <input id="qty-add" class="in" placeholder="Qty (opsional)" autocomplete="off" />',
      '        <select id="cat-shopping" class="in"></select>',
      '        <button type="button" id="btn-submit-shopping" data-action="add-shopping" class="btn">+ Tambah</button>',
      '        <button type="button" id="btn-cancel-shopping" data-action="cancel-edit-shopping" class="btn cancel" style="display:none;">Batal</button>',
      "      </div>",
      '      <ul id="shopping-list-ul" class="list"></ul>',
      "    </div>",
      '    <div class="panel">',
      '      <div class="panel-title">',
      "        <span>Utang</span>",
      '        <span id="debt-panel-total" class="due-badge">Jatuh Tempo &le;5 Hari: Rp 0</span>',
      "      </div>",
      '      <div class="add-form">',
      '        <select id="cat-debt" class="in"></select>',
      '        <input id="amount-add" class="in" placeholder="Nominal" inputmode="numeric" autocomplete="off" />',
      '        <input id="note-add" class="in" placeholder="Catatan (opsional)" autocomplete="off" />',
      '        <div class="inst-group" title="Opsional: Cicilan ke berapa / total cicilan">',
      "          <span>Cicilan</span>",
      '          <input id="inst-cur" class="inst-in" placeholder="1" inputmode="numeric" autocomplete="off" />',
      "          <span>/</span>",
      '          <input id="inst-tot" class="inst-in" placeholder="3" inputmode="numeric" autocomplete="off" />',
      "        </div>",
      '        <input id="due-add" class="in" type="date" title="Jatuh tempo" />',
      '        <button type="button" id="btn-submit-debt" data-action="add-debt" class="btn">+ Tambah</button>',
      '        <button type="button" id="btn-cancel-debt" data-action="cancel-edit-debt" class="btn cancel" style="display:none;">Batal</button>',
      "      </div>",
      '      <ul id="debt-list-ul" class="list"></ul>',
      '      <table id="debt-cat-table"></table>',
      '      <div class="total-bar">',
      "        <h3>Total Utang</h3>",
      '        <span id="debt-bar-total">Rp 0</span>',
      "      </div>",
      "    </div>",
      "  </div>",
      "</ha-card>",
    ].join("\n");
    this._setupListeners();
  }
  _updateSelectOptions(selectEl, categories, lastSigProp) {
    if (!selectEl) return;
    const sig = categories.join("|");
    if (this[lastSigProp] === sig && selectEl.options.length > 0) return;
    const currentVal = selectEl.value;
    this[lastSigProp] = sig;
    selectEl.innerHTML = categories.map((c) => '<option value="' + esc(c) + '">' + esc(c) + "</option>").join("");
    if (currentVal && categories.includes(currentVal)) selectEl.value = currentVal;
  }

  _render() {
    this._buildShell();
    const root = this._root;
    if (!root) return;

    const shopping = this._shopping();
    const cats = this._byKategori();
    const debtList = this._debtList();
    const total = this._total();
    const upcomingTotal = this._upcoming5DaysTotal(debtList);

    const totalLabel = "Rp " + Math.round(total).toLocaleString("id-ID");
    const upcomingLabel = "Rp " + Math.round(upcomingTotal).toLocaleString("id-ID");
    const doneCount = shopping.filter((it) => it.done).length;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limit5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    this._updateSelectOptions(root.querySelector("#cat-shopping"), this._shoppingCategories(), "_lastShoppingCatsSig");
    this._updateSelectOptions(root.querySelector("#cat-debt"), this._debtCategories(), "_lastDebtCatsSig");

    const countEl = root.querySelector("#shopping-count");
    if (countEl) countEl.textContent = "Shopping List (" + shopping.length + " item)";

    const clearDoneBtn = root.querySelector("#btn-clear-done");
    if (clearDoneBtn) {
      clearDoneBtn.style.display = doneCount > 0 ? "inline-block" : "none";
      if (doneCount > 0) clearDoneBtn.textContent = "Hapus Selesai (" + doneCount + ")";
    }

    const shoppingUl = root.querySelector("#shopping-list-ul");
    if (shoppingUl) {
      shoppingUl.innerHTML = shopping.length
        ? shopping.map((it) => {
            const isEdit = String(this._editShoppingId) === String(it.id) ? "editing" : "";
            const chkClass = it.done ? "checked" : "";
            const chkMark = it.done ? "&#10003;" : "";
            const doneClass = it.done ? "done" : "";
            const qtyHtml = it.qty ? '<span class="q">&times; ' + esc(it.qty) + "</span>" : "";
            const idEsc = esc(it.id);
            return '<li class="item ' + isEdit + '" data-id="' + idEsc + '">' +
              '<button type="button" class="chk-btn ' + chkClass + '" data-action="toggle-shopping" data-id="' + idEsc + '" title="Tandai selesai">' + chkMark + "</button>" +
              '<span class="name ' + doneClass + '" data-action="toggle-shopping" data-id="' + idEsc + '">' + esc(it.name) + "</span>" +
              qtyHtml +
              '<span class="cat">' + esc(it.cat || "") + "</span>" +
              '<button type="button" class="edit-btn" title="Edit" data-action="edit-shopping" data-id="' + idEsc + '">&#9998;</button>' +
              '<button type="button" class="del" title="Hapus" data-action="del-shopping" data-id="' + idEsc + '">&times;</button>' +
              "</li>";
          }).join("")
        : '<li class="empty">Kosong &middot; tambah item di atas</li>';
    }

    const debtUl = root.querySelector("#debt-list-ul");
    if (debtUl) {
      debtUl.innerHTML = debtList.length
        ? debtList.map((d) => {
            const isEdit = String(this._editDebtId) === String(d.id) ? "editing" : "";
            const idEsc = esc(d.id);
            const parsedNote = this._parseNoteAndInstallment(d.catatan);
            const hasInst = parsedNote.cur !== null && parsedNote.total !== null;
            const instBadge = hasInst
              ? '<span class="inst-badge">Cicilan ' + parsedNote.cur + "/" + parsedNote.total + "</span>"
              : "";
            const payBtn = hasInst
              ? '<button type="button" class="pay-btn" title="Tandai cicilan ini dibayar (+1 &amp; majukan tanggal 1 bulan)" data-action="pay-installment" data-id="' + idEsc + '">&#10003; Bayar</button>'
              : "";

            const dueText = d.due_date ? String(d.due_date).split("T") : "";
            const dueObj = this._parseDueDate(d.due_date);
            const isUrgent = dueObj && dueObj.getTime() <= limit5Days.getTime();
            const hasNote = parsedNote.cleanNote || dueText;
            const subNote = hasNote
              ? '<div class="note ' + (isUrgent ? "urgent" : "") + '">' + esc(parsedNote.cleanNote || "") + (dueText ? " (" + esc(dueText) + ")" : "") + "</div>"
              : "";

            return '<li class="debt ' + isEdit + '" data-id="' + idEsc + '">' +
              '<div class="debt-main"><div class="debt-head">' +
              '<div class="debt-title-wrap"><strong>' + esc(d.kategori || "Lainnya") + "</strong>" + instBadge + "</div>" +
              '<span class="nom">Rp ' + (Number(d.nominal) || 0).toLocaleString("id-ID") + "</span></div>" + subNote + "</div>" +
              payBtn +
              '<button type="button" class="edit-btn" title="Edit" data-action="edit-debt" data-id="' + idEsc + '">&#9998;</button>' +
              '<button type="button" class="del" title="Hapus" data-action="del-debt" data-id="' + idEsc + '">&times;</button>' +
              "</li>";
          }).join("")
        : '<li class="empty">Belum ada utang &middot; tambah di atas</li>';
    }

    const catTable = root.querySelector("#debt-cat-table");
    if (catTable) {
      catTable.innerHTML = Object.keys(cats)
        .map((k) => "<tr><td>" + esc(k) + '</td><td class="num">Rp ' + (Number(cats[k]) || 0).toLocaleString("id-ID") + "</td></tr>")
        .join("");
    }

    const panelTotalEl = root.querySelector("#debt-panel-total");
    if (panelTotalEl) panelTotalEl.textContent = "Jatuh Tempo <=5 Hari: " + upcomingLabel;

    const barTotalEl = root.querySelector("#debt-bar-total");
    if (barTotalEl) barTotalEl.textContent = totalLabel;
  }
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
        this._optimisticDone.set(id, current ? !current.done : true);
        this._render();
        await this._call("custom_shopping_and_debt_list_toggle_shopping", { item_id: id });
        this._lastSignature = "";
      } else if (action === "add-shopping") {
        const name = this._val("name-add");
        if (!name) return;
        const qty = this._val("qty-add");
        const cat = this._val("cat-shopping") || "Kebutuhan";
        if (this._editShoppingId) {
          const oldId = this._editShoppingId;
          this._editShoppingId = null;
          await this._call("custom_shopping_and_debt_list_remove_shopping", { item_id: String(oldId) });
        }
        await this._call("custom_shopping_and_debt_list_add_shopping", { name: name, qty: qty, cat: cat });
        this._setVal("name-add", "");
        this._setVal("qty-add", "");
        root.querySelector("#btn-submit-shopping").textContent = "+ Tambah";
        root.querySelector("#btn-cancel-shopping").style.display = "none";
        this._lastSignature = "";
      } else if (action === "edit-shopping") {
        const item = this._shopping().find((it) => String(it.id) === id);
        if (!item) return;
        this._editShoppingId = item.id;
        this._setVal("name-add", item.name || "");
        this._setVal("qty-add", item.qty || "");
        this._setVal("cat-shopping", item.cat || "Kebutuhan");
        root.querySelector("#btn-submit-shopping").textContent = "Simpan";
        root.querySelector("#btn-cancel-shopping").style.display = "inline-block";
        this._render();
        root.querySelector("#name-add")?.focus();
      } else if (action === "cancel-edit-shopping") {
        this._editShoppingId = null;
        this._setVal("name-add", "");
        this._setVal("qty-add", "");
        root.querySelector("#btn-submit-shopping").textContent = "+ Tambah";
        root.querySelector("#btn-cancel-shopping").style.display = "none";
        this._render();
      } else if (action === "clear-done") {
        for (const it of this._shopping().filter((i) => i.done)) {
          await this._call("custom_shopping_and_debt_list_remove_shopping", { item_id: String(it.id) });
        }
        this._lastSignature = "";
      } else if (action === "add-debt") {
        const kategori = this._val("cat-debt");
        const nominalRaw = this._val("amount-add").replace(/[^\d.-]/g, "");
        if (!kategori || !nominalRaw) return;
        const cleanNote = this._val("note-add");
        const instCur = this._val("inst-cur").replace(/[^\d]/g, "");
        const instTot = this._val("inst-tot").replace(/[^\d]/g, "");
        const catatan = this._formatNoteWithInstallment(cleanNote, instCur, instTot);
        const due_date = this._val("due-add");

        if (this._editDebtId) {
          const oldId = this._editDebtId;
          this._editDebtId = null;
          await this._call("custom_shopping_and_debt_list_remove_debt", { entry_id: String(oldId) });
        }
        await this._call("custom_shopping_and_debt_list_add_debt", {
          kategori: kategori, nominal: String(nominalRaw), catatan: catatan, due_date: due_date,
        });
        this._clearDebtForm();
        this._lastSignature = "";
      } else if (action === "pay-installment") {
        const debt = this._debtList().find((d) => String(d.id) === id);
        if (!debt) return;
        const parsed = this._parseNoteAndInstallment(debt.catatan);
        if (parsed.cur === null || parsed.total === null) return;

        // Jika sudah cicilan terakhir (misal 3/3), hapus utang karena sudah lunas
        if (parsed.cur >= parsed.total) {
          await this._call("custom_shopping_and_debt_list_remove_debt", { entry_id: String(debt.id) });
          this._lastSignature = "";
          return;
        }

        const nextCur = parsed.cur + 1;
        const nextNote = this._formatNoteWithInstallment(parsed.cleanNote, nextCur, parsed.total);
        const nextDue = debt.due_date ? this._addOneMonth(debt.due_date) : "";

        await this._call("custom_shopping_and_debt_list_remove_debt", { entry_id: String(debt.id) });
        await this._call("custom_shopping_and_debt_list_add_debt", {
          kategori: debt.kategori || "Lainnya",
          nominal: String(debt.nominal || 0),
          catatan: nextNote,
          due_date: nextDue,
        });
        this._lastSignature = "";
      } else if (action === "edit-debt") {
        const debt = this._debtList().find((d) => String(d.id) === id);
        if (!debt) return;
        this._editDebtId = debt.id;
        const parsed = this._parseNoteAndInstallment(debt.catatan);
        this._setVal("cat-debt", debt.kategori || "Lainnya");
        this._setVal("amount-add", String(debt.nominal || ""));
        this._setVal("note-add", parsed.cleanNote);
        this._setVal("inst-cur", parsed.cur !== null ? String(parsed.cur) : "");
        this._setVal("inst-tot", parsed.total !== null ? String(parsed.total) : "");
        this._setVal("due-add", debt.due_date ? String(debt.due_date).split("T") : "");
        root.querySelector("#btn-submit-debt").textContent = "Simpan";
        root.querySelector("#btn-cancel-debt").style.display = "inline-block";
        this._render();
        root.querySelector("#amount-add")?.focus();
      } else if (action === "cancel-edit-debt") {
        this._editDebtId = null;
        this._clearDebtForm();
        this._render();
      } else if (action === "del-shopping") {
        await this._call("custom_shopping_and_debt_list_remove_shopping", { item_id: id });
        this._lastSignature = "";
      } else if (action === "del-debt") {
        await this._call("custom_shopping_and_debt_list_remove_debt", { entry_id: id });
        this._lastSignature = "";
      }
    });
  }

  _clearDebtForm() {
    this._setVal("amount-add", "");
    this._setVal("note-add", "");
    this._setVal("inst-cur", "");
    this._setVal("inst-tot", "");
    this._setVal("due-add", "");
    const btnSub = this._root && this._root.querySelector("#btn-submit-debt");
    const btnCan = this._root && this._root.querySelector("#btn-cancel-debt");
    if (btnSub) btnSub.textContent = "+ Tambah";
    if (btnCan) btnCan.style.display = "none";
  }

  _val(id) {
    const el = this._root && this._root.querySelector("#" + id);
    return el ? String(el.value || "").trim() : "";
  }

  _setVal(id, value) {
    const el = this._root && this._root.querySelector("#" + id);
    if (el) el.value = value;
  }

  async _call(service, data) {
    if (!this._hass) return;
    try { await this._hass.callService(DOMAIN, service, data); }
    catch (e) { console.warn("custom-shopping-and-debt-list: call failed", service, e); }
  }

  connectedCallback() { this._render(); }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

if (!customElements.get("custom-shopping-and-debt-list")) {
  customElements.define("custom-shopping-and-debt-list", NdlongShopCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "custom-shopping-and-debt-list")) {
  window.customCards.push({
    type: "custom:custom-shopping-and-debt-list",
    name: "Belanja & Utang",
    description: "Shopping list + debt list with running total",
    preview: false,
  });
}

console.info("%c BELANJA & UTANG CARD %c v1.5 ", "color: white; background: #03a9f4; font-weight: bold;", "color: #03a9f4; background: white; font-weight: bold;");
