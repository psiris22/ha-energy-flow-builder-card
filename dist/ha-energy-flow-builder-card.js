const M = "energy-flow-builder-card-editor";
class S extends HTMLElement {
  constructor() {
    super(...arguments), this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(e) {
    this._config = structuredClone(e), this.render();
  }
  set hass(e) {
    this._hass = e, this.render();
  }
  render() {
    var o, i, r, n, u, c;
    if (!this._config) return;
    const e = this._config, t = Object.entries(e.nodes ?? {}), a = e.lines ?? [];
    this._root.innerHTML = `
      <style>${N}</style>
      <section>
        <div class="intro">Wähle deine lokalen Entitäten und passe die Positionen an. Die Vorschau aktualisiert sich sofort.</div>
        <div class="section">
          <label>Überschrift <input data-path="title" value="${d(e.title ?? "")}" placeholder="Energiefluss"></label>
          <div class="row">
            <label>Hintergrundfarbe <input data-path="background.color" value="${d(((o = e.background) == null ? void 0 : o.color) ?? "")}" placeholder="#dbeafe"></label>
            <label>Koordinatenraum <input data-path="background.viewBox" value="${d(((i = e.background) == null ? void 0 : i.viewBox) ?? "0 0 1073 1466")}"></label>
          </div>
          <label>Hintergrundbild per Pfad <input data-path="background.image" value="${d(_((r = e.background) == null ? void 0 : r.image) ? "" : ((n = e.background) == null ? void 0 : n.image) ?? "")}" placeholder="/local/meine-grafik.png"></label>
          <label>Bild vom Computer auswählen <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-action="select-image"></label>
          <div class="file-note">Das Bild wird direkt in dieser Karten-Konfiguration gespeichert.</div>
          ${_((u = e.background) == null ? void 0 : u.image) ? '<button class="secondary" type="button" data-action="clear-image">Ausgewähltes Bild entfernen</button>' : ""}
          <label class="check"><input type="checkbox" data-path="background.showCoordinates" ${(c = e.background) != null && c.showCoordinates ? "checked" : ""}> Koordinatenraster und X/Y-Werte in der Vorschau zeigen</label>
        </div>
        <div class="heading"><h3>Anzeigen</h3><button type="button" data-action="add-node">Anzeige hinzufügen</button></div>
        ${t.length ? t.map(([l, h]) => this.nodeForm(l, h)).join("") : "<p class=empty>Noch keine Anzeigen angelegt.</p>"}
        <div class="heading"><h3>Linien</h3><button type="button" data-action="add-line">Linie hinzufügen</button></div>
        ${a.length ? a.map((l, h) => this.lineForm(l, h)).join("") : "<p class=empty>Linien können später per SVG-Pfad ergänzt werden.</p>"}
      </section>`, this.bind();
  }
  nodeForm(e, t) {
    return `<details class="item" open>
      <summary>${f(t.name ?? e)} <span>${f(t.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${d(e)}" data-key="name" value="${d(t.name ?? "")}"></label><label>Interne ID <input data-node-id="${d(e)}" value="${d(e)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", e, "entity", t.entity)}</label>
        <label>Zweite Entity (optional) ${this.entitySelect("node", e, "secondaryEntity", t.secondaryEntity, !0)}</label>
        <div class="row three"><label>X <input type="number" data-node="${d(e)}" data-key="x" value="${E(t.x)}"></label><label>Y <input type="number" data-node="${d(e)}" data-key="y" value="${E(t.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${d(e)}" data-key="decimals" value="${t.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${d(e)}" data-key="labelWidth" value="${t.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${d(e)}" data-key="labelHeight" value="${t.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <label class="check"><input type="checkbox" data-node="${d(e)}" data-key="hide" ${t.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <button class="danger" type="button" data-action="remove-node" data-id="${d(e)}">Anzeige entfernen</button>
      </div>
    </details>`;
  }
  lineForm(e, t) {
    return `<details class="item">
      <summary>${f(e.id || `Linie ${t + 1}`)} <span>${f(e.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>ID <input data-line="${t}" data-key="id" value="${d(e.id)}"></label><label>Breite <input type="number" data-line="${t}" data-key="width" value="${e.width ?? ""}" placeholder="Standard"></label></div>
        <label>Steuernde Entity ${this.entitySelect("line", String(t), "entity", e.entity)}</label>
        <label>SVG-Pfad <input data-line="${t}" data-key="path" value="${d(e.path ?? "")}" placeholder="M600 500 V1100"></label>
        <div class="row"><label>Farbe <input data-line="${t}" data-key="color" value="${d(e.color ?? "")}" placeholder="#16a6d9"></label><label>Schwelle <input type="number" data-line="${t}" data-key="activeAbove" value="${e.activeAbove ?? ""}" placeholder="Standard"></label></div>
        <label class="check"><input type="checkbox" data-line="${t}" data-key="invert" ${e.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
        <button class="danger" type="button" data-action="remove-line" data-index="${t}">Linie entfernen</button>
      </div>
    </details>`;
  }
  entitySelect(e, t, a, o, i = !1) {
    var u;
    const r = Object.entries(((u = this._hass) == null ? void 0 : u.states) ?? {}).filter(([, c]) => !!c).sort(([c, l], [h, p]) => {
      var g, y, v, $;
      return (((y = (g = l == null ? void 0 : l.attributes) == null ? void 0 : g.friendly_name) == null ? void 0 : y.toString()) ?? c).localeCompare((($ = (v = p == null ? void 0 : p.attributes) == null ? void 0 : v.friendly_name) == null ? void 0 : $.toString()) ?? h);
    });
    return `<select ${e === "node" ? `data-node="${d(t)}"` : `data-line="${d(t)}"`} data-key="${a}"><option value="">${i ? "Keine zweite Entity" : "Entity auswählen"}</option>${r.map(([c, l]) => {
      var h, p;
      return `<option value="${d(c)}" ${c === o ? "selected" : ""}>${f(((p = (h = l == null ? void 0 : l.attributes) == null ? void 0 : h.friendly_name) == null ? void 0 : p.toString()) ?? c)} (${f(c)})</option>`;
    }).join("")}</select>`;
  }
  bind() {
    this._root.querySelectorAll("input[data-path], select[data-path]").forEach((e) => e.addEventListener("change", () => this.updatePath(e.dataset.path, e instanceof HTMLInputElement && e.type === "checkbox" ? e.checked : e.value))), this._root.querySelectorAll("[data-node][data-key]").forEach((e) => e.addEventListener("change", () => this.updateNode(e.dataset.node, e.dataset.key, e))), this._root.querySelectorAll("input[data-node-id]").forEach((e) => e.addEventListener("change", () => this.renameNode(e.dataset.nodeId, e.value))), this._root.querySelectorAll("[data-line][data-key]").forEach((e) => e.addEventListener("change", () => this.updateLine(Number(e.dataset.line), e.dataset.key, e))), this._root.querySelectorAll("button[data-action]").forEach((e) => e.addEventListener("click", () => this.action(e))), this._root.querySelectorAll('input[data-action="select-image"]').forEach((e) => e.addEventListener("change", () => this.selectImage(e)));
  }
  action(e) {
    var a;
    const t = this.config();
    if (e.dataset.action === "add-node") {
      const o = { ...t.nodes ?? {} };
      let i = "anzeige", r = 2;
      for (; o[i]; ) i = `anzeige_${r++}`;
      o[i] = { x: 100, y: 100, name: "Neue Anzeige" }, this.commit({ ...t, nodes: o });
    }
    if (e.dataset.action === "remove-node" && e.dataset.id) {
      const o = { ...t.nodes ?? {} };
      delete o[e.dataset.id], this.commit({ ...t, nodes: o });
    }
    e.dataset.action === "add-line" && this.commit({ ...t, lines: [...t.lines ?? [], { id: `linie_${(((a = t.lines) == null ? void 0 : a.length) ?? 0) + 1}`, path: "M100 100 H300" }] }), e.dataset.action === "remove-line" && this.commit({ ...t, lines: (t.lines ?? []).filter((o, i) => i !== Number(e.dataset.index)) }), e.dataset.action === "clear-image" && this.updatePath("background.image", "");
  }
  selectImage(e) {
    var o;
    const t = (o = e.files) == null ? void 0 : o[0];
    if (!t) return;
    const a = new FileReader();
    a.addEventListener("load", () => this.updatePath("background.image", String(a.result ?? ""))), a.readAsDataURL(t);
  }
  updatePath(e, t) {
    const a = this.config(), [o, i] = e.split("."), r = o === "background" ? a.background ?? {} : {};
    this.commit({ ...a, [o]: { ...r, [i]: t || void 0 } });
  }
  updateNode(e, t, a) {
    const o = { ...this.config().nodes ?? {} }, i = a instanceof HTMLInputElement && a.type === "checkbox" ? a.checked : a.value;
    o[e] = { ...o[e], [t]: k(t) && i !== "" ? Number(i) : i || void 0 }, this.commit({ ...this.config(), nodes: o });
  }
  renameNode(e, t) {
    var r;
    const a = t.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!a || a === e || (r = this.config().nodes) != null && r[a]) {
      this.render();
      return;
    }
    const o = { ...this.config().nodes ?? {} }, i = o[e];
    delete o[e], o[a] = i, this.commit({ ...this.config(), nodes: o });
  }
  updateLine(e, t, a) {
    const o = this.config(), i = [...o.lines ?? []], r = a instanceof HTMLInputElement && a.type === "checkbox" ? a.checked : a.value;
    i[e] = { ...i[e], [t]: k(t) && r !== "" ? Number(r) : r || void 0 }, this.commit({ ...o, lines: i });
  }
  config() {
    return this._config ?? { type: "custom:energy-flow-builder-card" };
  }
  commit(e) {
    this._config = e, this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e }, bubbles: !0, composed: !0 })), this.render();
  }
}
function k(s) {
  return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove"].includes(s);
}
function E(s) {
  return s === void 0 ? "" : String(s);
}
function f(s) {
  return s.replace(/[&<>\"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] ?? e);
}
function d(s) {
  return f(s);
}
function _(s) {
  return !!(s != null && s.startsWith("data:image/"));
}
const N = `
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
customElements.define(M, S);
const b = "energy-flow-builder-card", z = "0 0 1000 1000", C = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};
class A extends HTMLElement {
  constructor() {
    super(...arguments), this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(e) {
    if (!e || e.type !== `custom:${b}`)
      throw new Error(`Expected type custom:${b}`);
    this._config = {
      ...e,
      defaults: { ...C, ...e.defaults ?? {} }
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
    var i, r, n;
    if (!this._config) return;
    const e = this._config, t = ((i = e.background) == null ? void 0 : i.viewBox) ?? z, a = Object.entries(e.nodes ?? {}).filter(([, u]) => !u.hide), o = e.lines ?? [];
    this._root.innerHTML = `
      <style>${L}</style>
      <ha-card>
        ${e.title ? `<div class="card-title">${x(e.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(e)}">
          ${(r = e.background) != null && r.image ? `<img class="background" src="${m(e.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${m(t)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${o.map((u) => this.renderLine(u)).join("")}
            ${(n = e.background) != null && n.showCoordinates ? this.renderCoordinateGrid(t) : ""}
            ${a.map(([u, c]) => {
      var l;
      return this.renderNode(u, c, !!((l = e.background) != null && l.showCoordinates));
    }).join("")}
          </svg>
        </div>
      </ha-card>
    `, this.bindNodeActions();
  }
  stageStyle(e) {
    var o, i;
    const t = (o = e.background) != null && o.color ? `background:${e.background.color};` : "", a = (i = e.background) != null && i.aspectRatio ? `aspect-ratio:${e.background.aspectRatio};` : "";
    return `${t}${a}`;
  }
  renderLine(e) {
    const t = this.defaults(), a = e.value ?? this.entityNumber(e.entity), o = e.invert ? -a : a, i = Math.abs(o), r = e.activeAbove ?? t.activeAbove, n = i > r;
    if (!n && e.hideWhenInactive) return "";
    const u = o < 0 && e.pathNegative ? e.pathNegative : o >= 0 && e.pathPositive ? e.pathPositive : e.path;
    if (!u) return "";
    const c = B(e.id), l = e.width ?? t.lineWidth, h = e.duration ?? H(i, t.duration), p = e.color ?? t.lineColor, g = e.trackColor ?? t.trackColor, y = e.pulseColor ?? t.pulseColor, v = o < 0 ? "reverse" : "normal";
    return `
      <g class="flow-line ${n ? "is-active" : "is-idle"}" style="--line-width:${l};--duration:${h}s;--direction:${v};--flow-opacity:${n ? "1" : ".38"};--line-color:${m(p)};--track-color:${m(g)};--pulse-color:${m(y)}">
        <path id="${c}" class="flow-track" d="${m(u)}"></path>
        <path class="flow-main" d="${m(u)}"></path>
        ${n ? `
          <circle class="flow-pulse primary" r="${Math.max(5, l * 1.3)}">
            <animateMotion dur="${h}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${c}"></mpath>
            </animateMotion>
          </circle>
          <circle class="flow-pulse secondary" r="${Math.max(4, l)}">
            <animateMotion dur="${h}s" begin="${h / 2}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${c}"></mpath>
            </animateMotion>
          </circle>
        ` : ""}
      </g>
    `;
  }
  renderCoordinateGrid(e) {
    const t = e.trim().split(/\s+/).map(Number), [, , a = 1e3, o = 1e3] = t, i = [0, 0.25, 0.5, 0.75, 1].map((n) => Math.round(a * n)), r = [0, 0.25, 0.5, 0.75, 1].map((n) => Math.round(o * n));
    return `<g class="coordinate-grid">${i.map((n) => `<path d="M${n} 0 V${o}"></path><text x="${n + 10}" y="28">${n}</text>`).join("")}${r.map((n) => `<path d="M0 ${n} H${a}"></path>${n ? `<text x="10" y="${n - 8}">${n}</text>` : ""}`).join("")}</g>`;
  }
  renderNode(e, t, a) {
    var p, g;
    const o = this.defaults(), i = this.entity(t.entity), r = this.formatEntity(i, t), n = t.secondaryEntity ? this.formatEntity(this.entity(t.secondaryEntity), { ...t, stateType: "raw" }) : "", u = t.name ?? ((g = (p = i == null ? void 0 : i.attributes) == null ? void 0 : p.friendly_name) == null ? void 0 : g.toString()) ?? e, c = t.labelWidth ?? o.labelWidth, l = t.labelHeight ?? o.labelHeight;
    return `
      <g class="flow-node ${Math.abs(this.entityNumber(t.entity)) > (t.activeAbove ?? o.activeAbove) ? "is-active" : "is-idle"}" data-node-id="${m(e)}" data-entity="${m(t.entity ?? "")}" transform="translate(${t.x} ${t.y})">
        <rect class="node-box" width="${c}" height="${l}" rx="16" ry="16"></rect>
        <text class="node-title" x="18" y="32">${w(u)}</text>
        <text class="node-value" x="18" y="61">${w(r)}</text>
        ${n ? `<text class="node-secondary" x="${c - 18}" y="32">${w(n)}</text>` : ""}
        ${a ? `<text class="node-coordinates" x="0" y="${l + 21}">x ${t.x} · y ${t.y}</text>` : ""}
      </g>
    `;
  }
  bindNodeActions() {
    this._root.querySelectorAll(".flow-node[data-entity]").forEach((t) => {
      const a = t.dataset.entity;
      a && t.addEventListener("click", () => this.openMoreInfo(a));
    });
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
    return { ...C, ...((e = this._config) == null ? void 0 : e.defaults) ?? {} };
  }
  entityNumber(e) {
    const t = this.entity(e), a = Number(t == null ? void 0 : t.state);
    return Number.isFinite(a) ? a : 0;
  }
  formatEntity(e, t) {
    var r, n;
    if (!e) return "unavailable";
    if (t.stateType === "raw") return e.state;
    const a = Number(e.state);
    if (!Number.isFinite(a)) return e.state;
    const o = t.decimals ?? (Math.abs(a) >= 100 ? 0 : 1), i = t.unit ?? ((n = (r = e.attributes) == null ? void 0 : r.unit_of_measurement) == null ? void 0 : n.toString()) ?? "";
    return `${a.toFixed(o)}${i ? ` ${i}` : ""}`;
  }
}
const L = `
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
function H(s, e) {
  if (s <= 0) return e;
  const t = Math.max(100, Math.min(s, 8e3));
  return Number((6 - (t - 100) / 7900 * 4.4).toFixed(2));
}
function B(s) {
  return `efb-${s.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function x(s) {
  return s.replace(/[&<>"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] ?? e);
}
function m(s) {
  return x(s);
}
function w(s) {
  return x(s);
}
customElements.define(b, A);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: b,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
