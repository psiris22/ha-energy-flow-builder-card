const P = "energy-flow-builder-card-editor";
class z extends HTMLElement {
  constructor() {
    super(...arguments), this._entitySignature = "", this._root = this.attachShadow({ mode: "open" }), this._onNodeMoved = (e) => {
      const t = e.detail;
      if (!(t != null && t.id) || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return;
      const i = { ...this.config().nodes ?? {} };
      i[t.id] && (i[t.id] = { ...i[t.id], x: t.x, y: t.y }, this.commit({ ...this.config(), nodes: i }));
    }, this._onLinePointMoved = (e) => {
      const t = e.detail;
      this.updateLinePoint(t, !1);
    }, this._onLinePointAdded = (e) => {
      const t = e.detail;
      this.updateLinePoint(t, !0);
    };
  }
  connectedCallback() {
    window.addEventListener("energy-flow-builder-node-moved", this._onNodeMoved), window.addEventListener("energy-flow-builder-line-point-moved", this._onLinePointMoved), window.addEventListener("energy-flow-builder-line-point-added", this._onLinePointAdded);
  }
  disconnectedCallback() {
    window.removeEventListener("energy-flow-builder-node-moved", this._onNodeMoved), window.removeEventListener("energy-flow-builder-line-point-moved", this._onLinePointMoved), window.removeEventListener("energy-flow-builder-line-point-added", this._onLinePointAdded);
  }
  setConfig(e) {
    this._config = structuredClone(e), this.render();
  }
  set hass(e) {
    this._hass = e;
    const t = Object.keys(e.states).sort().join("|");
    t !== this._entitySignature && (this._entitySignature = t, this.render());
  }
  render() {
    var n, o, a, r, s, d;
    if (!this._config) return;
    const e = this._config, t = Object.entries(e.nodes ?? {}), i = e.lines ?? [];
    this._root.innerHTML = `
      <style>${H}</style>
      <section>
        <div class="intro">Wähle deine lokalen Entitäten und passe die Positionen an. Die Vorschau aktualisiert sich sofort.</div>
        <div class="section">
          <label>Überschrift <input data-path="title" value="${h(e.title ?? "")}" placeholder="Energiefluss"></label>
          <div class="row">
            <label>Hintergrundfarbe <input data-path="background.color" value="${h(((n = e.background) == null ? void 0 : n.color) ?? "")}" placeholder="#dbeafe"></label>
            <label>Koordinatenraum <input data-path="background.viewBox" value="${h(((o = e.background) == null ? void 0 : o.viewBox) ?? "0 0 1073 1466")}"></label>
          </div>
          <label>Hintergrundbild per Pfad <input data-path="background.image" value="${h(L((a = e.background) == null ? void 0 : a.image) ? "" : ((r = e.background) == null ? void 0 : r.image) ?? "")}" placeholder="/local/meine-grafik.png"></label>
          <label>Bild vom Computer auswählen <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-action="select-image"></label>
          <div class="file-note">Das Bild wird direkt in dieser Karten-Konfiguration gespeichert.</div>
          ${L((s = e.background) == null ? void 0 : s.image) ? '<button class="secondary" type="button" data-action="clear-image">Ausgewähltes Bild entfernen</button>' : ""}
          <label class="check"><input type="checkbox" data-path="background.showCoordinates" ${(d = e.background) != null && d.showCoordinates ? "checked" : ""}> Koordinatenraster und X/Y-Werte in der Vorschau zeigen</label>
        </div>
        <div class="heading"><h3>Anzeigen</h3><button type="button" data-action="add-node">Anzeige hinzufügen</button></div>
        ${t.length ? t.map(([l, u]) => this.nodeForm(l, u)).join("") : "<p class=empty>Noch keine Anzeigen angelegt.</p>"}
        <div class="heading"><h3>Linien</h3><button type="button" data-action="add-line">Linie hinzufügen</button></div>
        ${i.length ? i.map((l, u) => this.lineForm(l, u)).join("") : "<p class=empty>Linien können später per SVG-Pfad ergänzt werden.</p>"}
      </section>`, this.bind();
  }
  nodeForm(e, t) {
    return `<details class="item" open>
      <summary>${m(t.name ?? e)} <span>${m(t.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${h(e)}" data-key="name" value="${h(t.name ?? "")}"></label><label>Interne ID <input data-node-id="${h(e)}" value="${h(e)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", e, "entity", t.entity)}</label>
        <label>Zweite Entity (optional) ${this.entitySelect("node", e, "secondaryEntity", t.secondaryEntity, !0)}</label>
        <div class="row three"><label>X <input type="number" data-node="${h(e)}" data-key="x" value="${_(t.x)}"></label><label>Y <input type="number" data-node="${h(e)}" data-key="y" value="${_(t.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${h(e)}" data-key="decimals" value="${t.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${h(e)}" data-key="labelWidth" value="${t.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${h(e)}" data-key="labelHeight" value="${t.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <label class="check"><input type="checkbox" data-node="${h(e)}" data-key="hide" ${t.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <button class="danger" type="button" data-action="remove-node" data-id="${h(e)}">Anzeige entfernen</button>
      </div>
    </details>`;
  }
  lineForm(e, t) {
    var i;
    return `<details class="item">
      <summary>${m(e.id || `Linie ${t + 1}`)} <span>${m(e.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>ID <input data-line="${t}" data-key="id" value="${h(e.id)}"></label><label>Breite <input type="number" data-line="${t}" data-key="width" value="${e.width ?? ""}" placeholder="Standard"></label></div>
        <label>Steuernde Entity ${this.entitySelect("line", String(t), "entity", e.entity)}</label>
        <label>SVG-Pfad <input data-line="${t}" data-key="path" value="${h(e.path ?? "")}" placeholder="M600 500 V1100"></label>
        ${(i = e.points) != null && i.length ? `<div class="file-note">${e.points.length} bearbeitbare Punkte: Punkte ziehen, Doppelklick auf die Linie für einen weiteren Punkt.</div>` : `<button class="secondary" type="button" data-action="make-points" data-index="${t}">Pfad mit Maus bearbeiten</button>`}
        <div class="row"><label>Farbe <input data-line="${t}" data-key="color" value="${h(e.color ?? "")}" placeholder="#16a6d9"></label><label>Schwelle <input type="number" data-line="${t}" data-key="activeAbove" value="${e.activeAbove ?? ""}" placeholder="Standard"></label></div>
        <label class="check"><input type="checkbox" data-line="${t}" data-key="invert" ${e.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
        <button class="danger" type="button" data-action="remove-line" data-index="${t}">Linie entfernen</button>
      </div>
    </details>`;
  }
  entitySelect(e, t, i, n, o = !1) {
    var s;
    const a = Object.entries(((s = this._hass) == null ? void 0 : s.states) ?? {}).filter(([, d]) => !!d).sort(([d, l], [u, p]) => {
      var g, y, v, x;
      return (((y = (g = l == null ? void 0 : l.attributes) == null ? void 0 : g.friendly_name) == null ? void 0 : y.toString()) ?? d).localeCompare(((x = (v = p == null ? void 0 : p.attributes) == null ? void 0 : v.friendly_name) == null ? void 0 : x.toString()) ?? u);
    });
    return `<select ${e === "node" ? `data-node="${h(t)}"` : `data-line="${h(t)}"`} data-key="${i}"><option value="">${o ? "Keine zweite Entity" : "Entity auswählen"}</option>${a.map(([d, l]) => {
      var u, p;
      return `<option value="${h(d)}" ${d === n ? "selected" : ""}>${m(((p = (u = l == null ? void 0 : l.attributes) == null ? void 0 : u.friendly_name) == null ? void 0 : p.toString()) ?? d)} (${m(d)})</option>`;
    }).join("")}</select>`;
  }
  bind() {
    this._root.querySelectorAll("input[data-path], select[data-path]").forEach((e) => e.addEventListener("change", () => this.updatePath(e.dataset.path, e instanceof HTMLInputElement && e.type === "checkbox" ? e.checked : e.value))), this._root.querySelectorAll("[data-node][data-key]").forEach((e) => e.addEventListener("change", () => this.updateNode(e.dataset.node, e.dataset.key, e))), this._root.querySelectorAll("input[data-node-id]").forEach((e) => e.addEventListener("change", () => this.renameNode(e.dataset.nodeId, e.value))), this._root.querySelectorAll("[data-line][data-key]").forEach((e) => e.addEventListener("change", () => this.updateLine(Number(e.dataset.line), e.dataset.key, e))), this._root.querySelectorAll("button[data-action]").forEach((e) => e.addEventListener("click", () => this.action(e))), this._root.querySelectorAll('input[data-action="select-image"]').forEach((e) => e.addEventListener("change", () => this.selectImage(e)));
  }
  action(e) {
    var i;
    const t = this.config();
    if (e.dataset.action === "add-node") {
      const n = { ...t.nodes ?? {} };
      let o = "anzeige", a = 2;
      for (; n[o]; ) o = `anzeige_${a++}`;
      n[o] = { x: 100, y: 100, name: "Neue Anzeige" }, this.commit({ ...t, nodes: n });
    }
    if (e.dataset.action === "remove-node" && e.dataset.id) {
      const n = { ...t.nodes ?? {} };
      delete n[e.dataset.id], this.commit({ ...t, nodes: n });
    }
    if (e.dataset.action === "add-line" && this.commit({ ...t, lines: [...t.lines ?? [], { id: `linie_${(((i = t.lines) == null ? void 0 : i.length) ?? 0) + 1}`, path: "M100 100 H300" }] }), e.dataset.action === "remove-line" && this.commit({ ...t, lines: (t.lines ?? []).filter((n, o) => o !== Number(e.dataset.index)) }), e.dataset.action === "make-points") {
      const n = [...t.lines ?? []], o = Number(e.dataset.index);
      n[o] = { ...n[o], points: I(n[o].path ?? "") }, this.commit({ ...t, lines: n });
    }
    e.dataset.action === "clear-image" && this.updatePath("background.image", "");
  }
  selectImage(e) {
    var n;
    const t = (n = e.files) == null ? void 0 : n[0];
    if (!t) return;
    const i = new FileReader();
    i.addEventListener("load", () => this.updatePath("background.image", String(i.result ?? ""))), i.readAsDataURL(t);
  }
  updatePath(e, t) {
    const i = this.config(), [n, o] = e.split("."), a = n === "background" ? i.background ?? {} : {};
    this.commit({ ...i, [n]: { ...a, [o]: t || void 0 } });
  }
  updateNode(e, t, i) {
    const n = { ...this.config().nodes ?? {} }, o = i instanceof HTMLInputElement && i.type === "checkbox" ? i.checked : i.value;
    n[e] = { ...n[e], [t]: E(t) && o !== "" ? Number(o) : o || void 0 }, this.commit({ ...this.config(), nodes: n });
  }
  renameNode(e, t) {
    var a;
    const i = t.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!i || i === e || (a = this.config().nodes) != null && a[i]) {
      this.render();
      return;
    }
    const n = { ...this.config().nodes ?? {} }, o = n[e];
    delete n[e], n[i] = o, this.commit({ ...this.config(), nodes: n });
  }
  updateLine(e, t, i) {
    const n = this.config(), o = [...n.lines ?? []], a = i instanceof HTMLInputElement && i.type === "checkbox" ? i.checked : i.value;
    o[e] = { ...o[e], [t]: E(t) && a !== "" ? Number(a) : a || void 0 }, this.commit({ ...n, lines: o });
  }
  updateLinePoint(e, t) {
    if (!e.id || e.index === void 0 || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
    const i = this.config(), n = [...i.lines ?? []], o = n.findIndex((r) => r.id === e.id);
    if (o < 0) return;
    const a = [...n[o].points ?? []];
    t ? a.splice(e.index, 0, { x: e.x, y: e.y }) : a[e.index] = { x: e.x, y: e.y }, n[o] = { ...n[o], points: a }, this.commit({ ...i, lines: n });
  }
  config() {
    return this._config ?? { type: "custom:energy-flow-builder-card" };
  }
  commit(e) {
    this._config = e, this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e }, bubbles: !0, composed: !0 })), this.render();
  }
}
function E(c) {
  return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove"].includes(c);
}
function _(c) {
  return c === void 0 ? "" : String(c);
}
function m(c) {
  return c.replace(/[&<>\"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] ?? e);
}
function h(c) {
  return m(c);
}
function L(c) {
  return !!(c != null && c.startsWith("data:image/"));
}
function I(c) {
  const e = c.match(/[MLHV]|-?(?:\d*\.\d+|\d+)/g) ?? [], t = [];
  let i = 0, n = "";
  for (; i < e.length; ) {
    /[MLHV]/.test(e[i]) && (n = e[i++]);
    const o = t[t.length - 1] ?? { x: 0, y: 0 };
    if ((n === "M" || n === "L") && i + 1 < e.length) t.push({ x: Number(e[i++]), y: Number(e[i++]) });
    else if (n === "H" && i < e.length) t.push({ x: Number(e[i++]), y: o.y });
    else if (n === "V" && i < e.length) t.push({ x: o.x, y: Number(e[i++]) });
    else break;
  }
  return t;
}
const H = `
  :host { display:block; color:var(--primary-text-color); }
  section { padding: 4px 0; }
  .intro, .empty { color:var(--secondary-text-color); font-size:.92rem; line-height:1.45; }
  .section { padding: 12px 0; border-bottom:1px solid var(--divider-color); }
  .heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:18px 0 8px; }
  h3 { margin:0; font-size:1rem; }
  .item { border:1px solid var(--divider-color); border-radius:6px; margin:8px 0; overflow:hidden; }
  summary { padding:11px 12px; cursor:pointer; font-weight:600; }
  summary span { display:block; color:var(--secondary-text-color); font-size:.78rem; font-weight:400; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .content { padding:0 12px 12px; }
  label { display:block; font-size:.82rem; color:var(--secondary-text-color); margin:10px 0; }
  input, select { display:block; box-sizing:border-box; width:100%; border:1px solid var(--divider-color); border-radius:4px; background:var(--card-background-color); color:var(--primary-text-color); padding:9px; margin-top:4px; font:inherit; }
  select { max-width:100%; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .three { grid-template-columns:1fr 1fr 1fr; }
  .check { display:flex; align-items:center; gap:8px; color:var(--primary-text-color); }
  .check input { width:auto; margin:0; }
  .file-input { padding:7px; }
  .file-note { color:var(--secondary-text-color); font-size:.78rem; margin-top:-4px; }
  button { border:0; border-radius:4px; padding:8px 10px; background:var(--primary-color); color:var(--text-primary-color); cursor:pointer; font:inherit; }
  button.secondary { background:transparent; color:var(--primary-color); padding-left:0; }
  button.danger { background:transparent; color:var(--error-color); padding-left:0; }
  @media (max-width: 420px) { .row, .three { grid-template-columns:1fr; gap:0; } }
`;
customElements.define(P, z);
const b = "energy-flow-builder-card", M = "0 0 1000 1000", N = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};
class B extends HTMLElement {
  constructor() {
    super(...arguments), this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(e) {
    if (!e || e.type !== `custom:${b}`)
      throw new Error(`Expected type custom:${b}`);
    this._config = {
      ...e,
      defaults: { ...N, ...e.defaults ?? {} }
    }, this.render();
  }
  set hass(e) {
    this._hass = e, this.render();
  }
  getCardSize() {
    return 5;
  }
  static getConfigElement() {
    return document.createElement("energy-flow-builder-card-editor");
  }
  static getStubConfig() {
    return {
      type: `custom:${b}`,
      title: "Energiefluss",
      background: { color: "#dbeafe", viewBox: "0 0 1073 1466", aspectRatio: "1073 / 1466" },
      nodes: {
        solar: { x: 385, y: 330, name: "Solar" },
        house: { x: 760, y: 520, name: "Haus" },
        battery: { x: 385, y: 1124, name: "Batterie" },
        wallbox: { x: 42, y: 1124, name: "Auto / Wallbox" },
        grid: { x: 760, y: 1248, name: "Netz" },
        heating: { x: 760, y: 900, name: "Heizung" }
      },
      lines: []
    };
  }
  render() {
    var o, a, r;
    if (!this._config) return;
    const e = this._config, t = ((o = e.background) == null ? void 0 : o.viewBox) ?? M, i = Object.entries(e.nodes ?? {}).filter(([, s]) => !s.hide), n = e.lines ?? [];
    this._root.innerHTML = `
      <style>${D}</style>
      <ha-card>
        ${e.title ? `<div class="card-title">${$(e.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(e)}">
          ${(a = e.background) != null && a.image ? `<img class="background" src="${f(e.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${f(t)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${n.map((s) => {
      var d;
      return this.renderLine(s, !!((d = e.background) != null && d.showCoordinates));
    }).join("")}
            ${(r = e.background) != null && r.showCoordinates ? this.renderCoordinateGrid(t) : ""}
            ${i.map(([s, d]) => {
      var l;
      return this.renderNode(s, d, !!((l = e.background) != null && l.showCoordinates));
    }).join("")}
          </svg>
        </div>
      </ha-card>
    `, this.bindNodeActions(), this.bindLineActions();
  }
  stageStyle(e) {
    var n, o;
    const t = (n = e.background) != null && n.color ? `background:${e.background.color};` : "", i = (o = e.background) != null && o.aspectRatio ? `aspect-ratio:${e.background.aspectRatio};` : "";
    return `${t}${i}`;
  }
  renderLine(e, t) {
    const i = this.defaults(), n = e.value ?? this.entityNumber(e.entity), o = e.invert ? -n : n, a = Math.abs(o), r = e.activeAbove ?? i.activeAbove, s = a > r;
    if (!s && e.hideWhenInactive) return "";
    const d = this.linePath(e, o);
    if (!d) return "";
    const l = j(e.id), u = e.width ?? i.lineWidth, p = e.duration ?? F(a, i.duration), g = e.color ?? i.lineColor, y = e.trackColor ?? i.trackColor, v = e.pulseColor ?? i.pulseColor, x = o < 0 ? "reverse" : "normal", C = s ? "1" : ".38";
    return `
      <g class="flow-line ${s ? "is-active" : "is-idle"}" data-line-id="${f(e.id)}" style="--line-width:${u};--duration:${p}s;--direction:${x};--flow-opacity:${C};--line-color:${f(g)};--track-color:${f(y)};--pulse-color:${f(v)}">
        <path id="${l}" data-flow-path class="flow-track" d="${f(d)}"></path>
        <path data-flow-path class="flow-main" d="${f(d)}"></path>
        ${s ? `
          <circle class="flow-pulse primary" r="${Math.max(5, u * 1.3)}">
            <animateMotion dur="${p}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${l}"></mpath>
            </animateMotion>
          </circle>
          <circle class="flow-pulse secondary" r="${Math.max(4, u)}">
            <animateMotion dur="${p}s" begin="${p / 2}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${l}"></mpath>
            </animateMotion>
          </circle>
        ` : ""}
        ${t ? (e.points ?? []).map((k, A) => `<circle class="line-handle" data-point-index="${A}" cx="${k.x}" cy="${k.y}" r="13"></circle>`).join("") : ""}
      </g>
    `;
  }
  linePath(e, t = 0) {
    return e.points && e.points.length > 1 ? S(e.points) : t < 0 && e.pathNegative ? e.pathNegative : t >= 0 && e.pathPositive ? e.pathPositive : e.path;
  }
  renderCoordinateGrid(e) {
    const t = e.trim().split(/\s+/).map(Number), [, , i = 1e3, n = 1e3] = t, o = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(i * r)), a = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(n * r));
    return `<g class="coordinate-grid">${o.map((r) => `<path d="M${r} 0 V${n}"></path><text x="${r + 10}" y="28">${r}</text>`).join("")}${a.map((r) => `<path d="M0 ${r} H${i}"></path>${r ? `<text x="10" y="${r - 8}">${r}</text>` : ""}`).join("")}</g>`;
  }
  renderNode(e, t, i) {
    var p, g;
    const n = this.defaults(), o = this.entity(t.entity), a = this.formatEntity(o, t), r = t.secondaryEntity ? this.formatEntity(this.entity(t.secondaryEntity), { ...t, stateType: "raw" }) : "", s = t.name ?? ((g = (p = o == null ? void 0 : o.attributes) == null ? void 0 : p.friendly_name) == null ? void 0 : g.toString()) ?? e, d = t.labelWidth ?? n.labelWidth, l = t.labelHeight ?? n.labelHeight;
    return `
      <g class="flow-node ${Math.abs(this.entityNumber(t.entity)) > (t.activeAbove ?? n.activeAbove) ? "is-active" : "is-idle"}" data-node-id="${f(e)}" data-entity="${f(t.entity ?? "")}" transform="translate(${t.x} ${t.y})">
        <rect class="node-box" width="${d}" height="${l}" rx="16" ry="16"></rect>
        <text class="node-title" x="18" y="32">${w(s)}</text>
        <text class="node-value" x="18" y="61">${w(a)}</text>
        ${r ? `<text class="node-secondary" x="${d - 18}" y="32">${w(r)}</text>` : ""}
        ${i ? `<text class="node-coordinates" x="0" y="${l + 21}">x ${t.x} · y ${t.y}</text>` : ""}
      </g>
    `;
  }
  bindNodeActions() {
    var n, o;
    const e = this._root.querySelector(".flow-svg");
    if (!e) return;
    const t = !!((o = (n = this._config) == null ? void 0 : n.background) != null && o.showCoordinates);
    this._root.querySelectorAll(".flow-node[data-node-id]").forEach((a) => {
      const r = a.dataset.entity;
      a.addEventListener("pointerdown", (s) => {
        var u, p;
        if (!t) return;
        const d = this.svgPoint(e, s), l = (p = (u = this._config) == null ? void 0 : u.nodes) == null ? void 0 : p[a.dataset.nodeId ?? ""];
        l && (this._drag = { id: a.dataset.nodeId ?? "", node: a, offsetX: d.x - l.x, offsetY: d.y - l.y, moved: !1 }, a.setPointerCapture(s.pointerId), s.preventDefault());
      }), a.addEventListener("pointermove", (s) => this.dragNode(e, s)), a.addEventListener("pointerup", (s) => {
        const d = this._drag;
        if (!(!d || d.node !== a))
          if (this._drag = void 0, d.moved) {
            const l = this.svgPoint(e, s);
            this.publishNodePosition(d.id, l.x - d.offsetX, l.y - d.offsetY);
          } else r && this.openMoreInfo(r);
      }), a.addEventListener("click", (s) => {
        t ? s.preventDefault() : r && this.openMoreInfo(r);
      });
    });
  }
  dragNode(e, t) {
    const i = this._drag;
    if (!i) return;
    const n = this.svgPoint(e, t), o = Math.round(n.x - i.offsetX), a = Math.round(n.y - i.offsetY);
    i.moved = !0, i.node.setAttribute("transform", `translate(${o} ${a})`);
    const r = i.node.querySelector(".node-coordinates");
    r && (r.textContent = `x ${o} · y ${a}`);
  }
  bindLineActions() {
    var t, i;
    const e = this._root.querySelector(".flow-svg");
    !e || !((i = (t = this._config) == null ? void 0 : t.background) != null && i.showCoordinates) || this._root.querySelectorAll(".flow-line[data-line-id]").forEach((n) => {
      const o = n.dataset.lineId ?? "";
      n.querySelectorAll(".line-handle").forEach((a) => {
        a.addEventListener("pointerdown", (r) => {
          var l, u, p;
          const s = (u = (l = this._config) == null ? void 0 : l.lines) == null ? void 0 : u.find((g) => g.id === o), d = Number(a.dataset.pointIndex);
          (p = s == null ? void 0 : s.points) != null && p[d] && (this._lineDrag = { id: o, index: d, handle: a, group: n, points: s.points.map((g) => ({ ...g })) }, a.setPointerCapture(r.pointerId), r.preventDefault(), r.stopPropagation());
        }), a.addEventListener("pointermove", (r) => this.dragLinePoint(e, r)), a.addEventListener("pointerup", () => {
          const r = this._lineDrag;
          if (!r || r.handle !== a) return;
          this._lineDrag = void 0;
          const s = r.points[r.index];
          window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-moved", { detail: { id: r.id, index: r.index, x: s.x, y: s.y } }));
        });
      }), n.addEventListener("dblclick", (a) => {
        var d, l;
        const r = (l = (d = this._config) == null ? void 0 : d.lines) == null ? void 0 : l.find((u) => u.id === o);
        if (!(r != null && r.points) || r.points.length < 2) return;
        const s = this.svgPoint(e, a);
        window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-added", { detail: { id: o, index: T(r.points, s), x: Math.round(s.x), y: Math.round(s.y) } })), a.preventDefault();
      });
    });
  }
  dragLinePoint(e, t) {
    const i = this._lineDrag;
    if (!i) return;
    const n = this.svgPoint(e, t);
    i.points[i.index] = { x: Math.round(n.x), y: Math.round(n.y) }, i.handle.setAttribute("cx", String(i.points[i.index].x)), i.handle.setAttribute("cy", String(i.points[i.index].y));
    const o = S(i.points);
    i.group.querySelectorAll("[data-flow-path]").forEach((a) => a.setAttribute("d", o));
  }
  publishNodePosition(e, t, i) {
    window.dispatchEvent(new CustomEvent("energy-flow-builder-node-moved", {
      detail: { id: e, x: Math.round(t), y: Math.round(i) }
    }));
  }
  svgPoint(e, t) {
    const [i = 0, n = 0, o = 1e3, a = 1e3] = (e.getAttribute("viewBox") ?? M).split(/\s+/).map(Number), r = e.getBoundingClientRect();
    return {
      x: i + (t.clientX - r.left) / r.width * o,
      y: n + (t.clientY - r.top) / r.height * a
    };
  }
  openMoreInfo(e) {
    const t = new CustomEvent("hass-more-info", {
      bubbles: !0,
      composed: !0,
      detail: { entityId: e }
    });
    this.dispatchEvent(t);
  }
  entity(e) {
    var t;
    return e ? (t = this._hass) == null ? void 0 : t.states[e] : void 0;
  }
  defaults() {
    var e;
    return { ...N, ...((e = this._config) == null ? void 0 : e.defaults) ?? {} };
  }
  entityNumber(e) {
    const t = this.entity(e), i = Number(t == null ? void 0 : t.state);
    return Number.isFinite(i) ? i : 0;
  }
  formatEntity(e, t) {
    var a, r;
    if (!e) return "unavailable";
    if (t.stateType === "raw") return e.state;
    const i = Number(e.state);
    if (!Number.isFinite(i)) return e.state;
    const n = t.decimals ?? (Math.abs(i) >= 100 ? 0 : 1), o = t.unit ?? ((r = (a = e.attributes) == null ? void 0 : a.unit_of_measurement) == null ? void 0 : r.toString()) ?? "";
    return `${i.toFixed(n)}${o ? ` ${o}` : ""}`;
  }
}
const D = `
  :host {
    display: block;
  }

  ha-card {
    overflow: hidden;
  }

  .card-title {
    padding: 16px 16px 0;
    font-size: 1.08rem;
    font-weight: 700;
    color: var(--primary-text-color);
  }

  .stage {
    position: relative;
    width: 100%;
    min-height: 360px;
    aspect-ratio: 1 / 1;
    background: var(--card-background-color);
    isolation: isolate;
  }

  .background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .flow-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .flow-track,
  .flow-main {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .flow-track {
    stroke: var(--track-color);
    stroke-width: calc(var(--line-width) * 1px);
  }

  .flow-main {
    stroke: var(--line-color);
    stroke-width: calc(var(--line-width) * 1px);
    opacity: var(--flow-opacity);
    stroke-dasharray: 26 190;
    animation: efb-flow var(--duration) linear infinite;
    animation-direction: var(--direction);
    filter: url(#efb-glow);
  }

  .flow-line.is-idle .flow-main {
    animation: none;
    stroke-dasharray: none;
  }

  .flow-pulse {
    fill: var(--pulse-color);
    opacity: .95;
    filter: url(#efb-glow);
  }

  .flow-pulse.secondary {
    opacity: .68;
  }

  .coordinate-grid path {
    stroke: rgba(22, 166, 217, .38);
    stroke-width: 1;
    stroke-dasharray: 6 9;
    vector-effect: non-scaling-stroke;
  }

  .coordinate-grid text,
  .node-coordinates {
    fill: #056b90;
    font-size: 16px;
    font-weight: 700;
    paint-order: stroke;
    stroke: rgba(255, 255, 255, .88);
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .node-box {
    fill: color-mix(in srgb, var(--card-background-color) 86%, transparent);
    stroke: color-mix(in srgb, var(--primary-text-color) 14%, transparent);
    stroke-width: 1.5;
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, .18));
  }

  .flow-node {
    cursor: pointer;
  }

  .coordinate-grid ~ .flow-node {
    cursor: grab;
    touch-action: none;
  }

  .coordinate-grid ~ .flow-node:active {
    cursor: grabbing;
  }

  .line-handle {
    fill: #ffffff;
    stroke: #16a6d9;
    stroke-width: 5;
    cursor: grab;
    vector-effect: non-scaling-stroke;
    touch-action: none;
  }

  .line-handle:active {
    cursor: grabbing;
  }

  .flow-node.is-idle {
    opacity: .78;
  }

  .node-title {
    fill: var(--secondary-text-color);
    font-size: 18px;
    font-weight: 700;
  }

  .node-value {
    fill: var(--primary-text-color);
    font-size: 24px;
    font-weight: 800;
  }

  .node-secondary {
    fill: var(--secondary-text-color);
    font-size: 16px;
    text-anchor: end;
    font-weight: 700;
  }

  @keyframes efb-flow {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -216; }
  }
`;
function F(c, e) {
  if (c <= 0) return e;
  const t = Math.max(100, Math.min(c, 8e3));
  return Number((6 - (t - 100) / 7900 * 4.4).toFixed(2));
}
function S(c) {
  return c.map((e, t) => `${t ? "L" : "M"}${e.x} ${e.y}`).join(" ");
}
function T(c, e) {
  let t = 0, i = Number.POSITIVE_INFINITY;
  for (let n = 0; n < c.length - 1; n += 1) {
    const o = c[n], a = c[n + 1], r = (a.x - o.x) ** 2 + (a.y - o.y) ** 2 || 1, s = Math.max(0, Math.min(1, ((e.x - o.x) * (a.x - o.x) + (e.y - o.y) * (a.y - o.y)) / r)), d = o.x + s * (a.x - o.x), l = o.y + s * (a.y - o.y), u = (e.x - d) ** 2 + (e.y - l) ** 2;
    u < i && (i = u, t = n);
  }
  return t + 1;
}
function j(c) {
  return `efb-${c.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function $(c) {
  return c.replace(/[&<>"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] ?? e);
}
function f(c) {
  return $(c);
}
function w(c) {
  return $(c);
}
customElements.define(b, B);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: b,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
