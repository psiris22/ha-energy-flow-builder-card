const H = "energy-flow-builder-card-editor";
class R extends HTMLElement {
  constructor() {
    super(...arguments), this._entitySignature = "", this._openSections = /* @__PURE__ */ new Map(), this._history = [], this._future = [], this._root = this.attachShadow({ mode: "open" }), this._onNodeMoved = (t) => {
      const e = t.detail;
      if (!(e != null && e.id) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
      const o = { ...this.config().nodes ?? {} };
      o[e.id] && (o[e.id] = { ...o[e.id], x: e.x, y: e.y }, this.commit({ ...this.config(), nodes: o }));
    }, this._onLinePointMoved = (t) => {
      const e = t.detail;
      this.updateLinePoint(e, !1);
    }, this._onLinePointAdded = (t) => {
      const e = t.detail;
      this.updateLinePoint(e, !0);
    };
  }
  connectedCallback() {
    window.addEventListener("energy-flow-builder-node-moved", this._onNodeMoved), window.addEventListener("energy-flow-builder-line-point-moved", this._onLinePointMoved), window.addEventListener("energy-flow-builder-line-point-added", this._onLinePointAdded);
  }
  disconnectedCallback() {
    window.removeEventListener("energy-flow-builder-node-moved", this._onNodeMoved), window.removeEventListener("energy-flow-builder-line-point-moved", this._onLinePointMoved), window.removeEventListener("energy-flow-builder-line-point-added", this._onLinePointAdded);
  }
  setConfig(t) {
    this._config = structuredClone(t), this.render();
  }
  set hass(t) {
    this._hass = t;
    const e = Object.keys(t.states).sort().join("|");
    e !== this._entitySignature && (this._entitySignature = e, this.render());
  }
  render() {
    var a, i, n, r, s, d, u, h, g;
    if (!this._config) return;
    const t = this._config, e = Object.entries(t.nodes ?? {}), o = t.lines ?? [];
    this._root.innerHTML = `
      <style>${T}</style>
      <section>
        <div class="toolbar">
          <button class="icon" type="button" data-action="undo" ${this._history.length ? "" : "disabled"} title="Rückgängig">↶</button>
          <button class="icon" type="button" data-action="redo" ${this._future.length ? "" : "disabled"} title="Wiederholen">↷</button>
          <span></span>
          <button class="secondary compact" type="button" data-action="preset">PV-Vorlage</button>
          <button class="secondary compact" type="button" data-action="export">Export</button>
          <button class="secondary compact" type="button" data-action="import">Import</button>
          <input class="hidden-file" type="file" accept="application/json,.json" data-action="import-file">
        </div>
        <div class="intro">Wähle deine lokalen Entitäten und passe die Positionen an. Die Vorschau aktualisiert sich sofort.</div>
        <div class="section">
          <label>Überschrift <input data-path="title" value="${c(t.title ?? "")}" placeholder="Energiefluss"></label>
          <div class="row">
            <label>Hintergrundfarbe <input data-path="background.color" value="${c(((a = t.background) == null ? void 0 : a.color) ?? "")}" placeholder="#dbeafe"></label>
            <label>Koordinatenraum <input data-path="background.viewBox" value="${c(((i = t.background) == null ? void 0 : i.viewBox) ?? "0 0 1073 1466")}"></label>
          </div>
          <label>Hintergrundbild per Pfad <input data-path="background.image" value="${c(M((n = t.background) == null ? void 0 : n.image) ? "" : ((r = t.background) == null ? void 0 : r.image) ?? "")}" placeholder="/local/meine-grafik.png"></label>
          <label>Bild vom Computer auswählen <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-action="select-image"></label>
          <div class="file-note">Das Bild wird direkt in dieser Karten-Konfiguration gespeichert.</div>
          ${M((s = t.background) == null ? void 0 : s.image) ? '<button class="secondary" type="button" data-action="clear-image">Ausgewähltes Bild entfernen</button>' : ""}
          <label class="check"><input type="checkbox" data-path="background.showCoordinates" ${(d = t.background) != null && d.showCoordinates ? "checked" : ""}> Koordinatenraster und X/Y-Werte in der Vorschau zeigen</label>
          <div class="row"><label class="check"><input type="checkbox" data-path="background.snapToGrid" ${((u = t.background) == null ? void 0 : u.snapToGrid) ?? ((h = t.background) == null ? void 0 : h.showCoordinates) ? "checked" : ""}> Am Raster einrasten</label><label>Rasterabstand <input type="number" min="1" data-path="background.gridSize" value="${((g = t.background) == null ? void 0 : g.gridSize) ?? 25}"></label></div>
        </div>
        <div class="heading"><h3>Anzeigen</h3><button type="button" data-action="add-node">Anzeige hinzufügen</button></div>
        ${e.length ? e.map(([f, m]) => this.nodeForm(f, m)).join("") : "<p class=empty>Noch keine Anzeigen angelegt.</p>"}
        <div class="heading"><h3>Linien</h3><button type="button" data-action="add-line">Linie hinzufügen</button></div>
        ${o.length ? o.map((f, m) => this.lineForm(f, m)).join("") : "<p class=empty>Linien können später per SVG-Pfad ergänzt werden.</p>"}
        <datalist id="efb-entity-list">${this.entityOptions()}</datalist>
      </section>`, this.bind();
  }
  nodeForm(t, e) {
    var o, a, i, n, r;
    return `<details class="item" data-section="node:${c(t)}" ${this.sectionOpen(`node:${t}`, !0) ? "open" : ""}>
      <summary>${y(e.name ?? t)} <span>${y(e.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${c(t)}" data-key="name" value="${c(e.name ?? "")}"></label><label>Interne ID <input data-node-id="${c(t)}" value="${c(t)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", t, "entity", e.entity)}</label>
        <label>Zweite Entity (optional) ${this.entitySelect("node", t, "secondaryEntity", e.secondaryEntity, !0)}</label>
        <div class="row three"><label>X <input type="number" data-node="${c(t)}" data-key="x" value="${N(e.x)}"></label><label>Y <input type="number" data-node="${c(t)}" data-key="y" value="${N(e.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${c(t)}" data-key="decimals" value="${e.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${c(t)}" data-key="labelWidth" value="${e.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${c(t)}" data-key="labelHeight" value="${e.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <details class="subitem" data-section="node-style:${c(t)}" ${this.sectionOpen(`node-style:${t}`) ? "open" : ""}>
          <summary>Darstellung</summary>
          <div class="row"><label>Hintergrund <input data-node-style="${c(t)}" data-key="background" value="${c(((o = e.style) == null ? void 0 : o.background) ?? "")}" placeholder="#182432"></label><label>Rahmen <input data-node-style="${c(t)}" data-key="border" value="${c(((a = e.style) == null ? void 0 : a.border) ?? "")}" placeholder="#16a6d9"></label></div>
          <div class="row"><label>Titelfarbe <input data-node-style="${c(t)}" data-key="titleColor" value="${c(((i = e.style) == null ? void 0 : i.titleColor) ?? "")}" placeholder="Standard"></label><label>Wertfarbe <input data-node-style="${c(t)}" data-key="valueColor" value="${c(((n = e.style) == null ? void 0 : n.valueColor) ?? "")}" placeholder="Standard"></label></div>
          <label>Eckenradius <input type="number" min="0" data-node-style="${c(t)}" data-key="radius" value="${((r = e.style) == null ? void 0 : r.radius) ?? ""}" placeholder="16"></label>
        </details>
        <label class="check"><input type="checkbox" data-node="${c(t)}" data-key="hide" ${e.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-node" data-id="${c(t)}">Duplizieren</button><button class="danger" type="button" data-action="remove-node" data-id="${c(t)}">Anzeige entfernen</button></div>
      </div>
    </details>`;
  }
  lineForm(t, e) {
    var a;
    const o = Object.entries(this.config().nodes ?? {});
    return `<details class="item" data-section="line:${e}" ${this.sectionOpen(`line:${e}`) ? "open" : ""}>
      <summary>${y(t.id || `Linie ${e + 1}`)} <span>${y(t.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>ID <input data-line="${e}" data-key="id" value="${c(t.id)}"></label><label>Breite <input type="number" data-line="${e}" data-key="width" value="${t.width ?? ""}" placeholder="Standard"></label></div>
        <label>Steuernde Entity ${this.entitySelect("line", String(e), "entity", t.entity)}</label>
        <label class="check"><input type="checkbox" data-line="${e}" data-key="autoRoute" ${t.autoRoute ? "checked" : ""}> Automatisch zwischen zwei Anzeigen verbinden</label>
        <div class="row"><label>Von ${this.nodeSelect(e, "source", t.source, o)}</label><label>Nach ${this.nodeSelect(e, "target", t.target, o)}</label></div>
        <div class="row"><label>Startseite ${this.portSelect(e, "sourcePort", t.sourcePort)}</label><label>Zielseite ${this.portSelect(e, "targetPort", t.targetPort)}</label></div>
        ${t.autoRoute ? '<div class="file-note">Die Verbindung folgt den Boxen automatisch. Für einen eigenen Verlauf die automatische Verbindung ausschalten und Punkte bearbeiten.</div>' : `<label>SVG-Pfad <input data-line="${e}" data-key="path" value="${c(t.path ?? "")}" placeholder="M600 500 V1100"></label>`}
        ${(a = t.points) != null && a.length ? `<div class="file-note">${t.points.length} bearbeitbare Punkte: Punkte ziehen, Doppelklick auf die Linie für einen weiteren Punkt.</div>` : `<button class="secondary" type="button" data-action="make-points" data-index="${e}">Pfad mit Maus bearbeiten</button>`}
        <div class="row"><label>Farbe <input data-line="${e}" data-key="color" value="${c(t.color ?? "")}" placeholder="#16a6d9"></label><label>Strichmuster <input data-line="${e}" data-key="dashPattern" value="${c(t.dashPattern ?? "")}" placeholder="26 190"></label></div>
        <div class="row"><label>Schwelle <input type="number" data-line="${e}" data-key="activeAbove" value="${t.activeAbove ?? ""}" placeholder="Standard"></label><label>Animierte Punkte <input type="number" min="0" max="4" data-line="${e}" data-key="pulseCount" value="${t.pulseCount ?? ""}" placeholder="2"></label></div>
        <label class="check"><input type="checkbox" data-line="${e}" data-key="invert" ${t.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-line" data-index="${e}">Duplizieren</button><button class="danger" type="button" data-action="remove-line" data-index="${e}">Linie entfernen</button></div>
      </div>
    </details>`;
  }
  entitySelect(t, e, o, a, i = !1) {
    return `<input class="entity-search" type="search" list="efb-entity-list" ${t === "node" ? `data-node="${c(e)}"` : `data-line="${c(e)}"`} data-key="${o}" value="${c(a ?? "")}" placeholder="${i ? "Keine zweite Entity" : "Entität suchen..."}" autocomplete="off">`;
  }
  nodeSelect(t, e, o, a) {
    return `<select data-line="${t}" data-key="${e}"><option value="">Nicht gewählt</option>${a.map(([i, n]) => `<option value="${c(i)}" ${i === o ? "selected" : ""}>${y(n.name ?? i)} (${y(i)})</option>`).join("")}</select>`;
  }
  portSelect(t, e, o) {
    return `<select data-line="${t}" data-key="${e}">${["top", "right", "bottom", "left"].map((a) => `<option value="${a}" ${a === (o ?? (e === "sourcePort" ? "right" : "left")) ? "selected" : ""}>${{ top: "Oben", right: "Rechts", bottom: "Unten", left: "Links" }[a]}</option>`).join("")}</select>`;
  }
  sectionOpen(t, e = !1) {
    return this._openSections.get(t) ?? e;
  }
  entityOptions() {
    var t;
    return Object.entries(((t = this._hass) == null ? void 0 : t.states) ?? {}).filter(([, e]) => !!e).sort(([e, o], [a, i]) => {
      var n, r, s, d;
      return (((r = (n = o == null ? void 0 : o.attributes) == null ? void 0 : n.friendly_name) == null ? void 0 : r.toString()) ?? e).localeCompare(((d = (s = i == null ? void 0 : i.attributes) == null ? void 0 : s.friendly_name) == null ? void 0 : d.toString()) ?? a);
    }).map(([e, o]) => {
      var a, i;
      return `<option value="${c(e)}" label="${c(`${((i = (a = o == null ? void 0 : o.attributes) == null ? void 0 : a.friendly_name) == null ? void 0 : i.toString()) ?? e} (${e})`)}"></option>`;
    }).join("");
  }
  bind() {
    this._root.querySelectorAll("input[data-path], select[data-path]").forEach((t) => t.addEventListener("change", () => this.updatePath(t.dataset.path, t instanceof HTMLInputElement && t.type === "checkbox" ? t.checked : t.value))), this._root.querySelectorAll("[data-node][data-key]").forEach((t) => t.addEventListener("change", () => this.updateNode(t.dataset.node, t.dataset.key, t))), this._root.querySelectorAll("[data-node-style][data-key]").forEach((t) => t.addEventListener("change", () => this.updateNodeStyle(t.dataset.nodeStyle, t.dataset.key, t))), this._root.querySelectorAll("input[data-node-id]").forEach((t) => t.addEventListener("change", () => this.renameNode(t.dataset.nodeId, t.value))), this._root.querySelectorAll("[data-line][data-key]").forEach((t) => t.addEventListener("change", () => this.updateLine(Number(t.dataset.line), t.dataset.key, t))), this._root.querySelectorAll("button[data-action]").forEach((t) => t.addEventListener("click", () => this.action(t))), this._root.querySelectorAll('input[data-action="select-image"]').forEach((t) => t.addEventListener("change", () => this.selectImage(t))), this._root.querySelectorAll('input[data-action="import-file"]').forEach((t) => t.addEventListener("change", () => this.importConfig(t))), this._root.querySelectorAll("details[data-section]").forEach((t) => t.addEventListener("toggle", () => {
      const e = t.dataset.section;
      this._openSections.set(e, t.open);
    }));
  }
  action(t) {
    var o, a;
    const e = this.config();
    if (t.dataset.action === "add-node") {
      const i = { ...e.nodes ?? {} };
      let n = "anzeige", r = 2;
      for (; i[n]; ) n = `anzeige_${r++}`;
      i[n] = { x: 100, y: 100, name: "Neue Anzeige" }, this.commit({ ...e, nodes: i });
    }
    if (t.dataset.action === "remove-node" && t.dataset.id) {
      const i = { ...e.nodes ?? {} };
      delete i[t.dataset.id], this.commit({ ...e, nodes: i });
    }
    if (t.dataset.action === "duplicate-node" && t.dataset.id) {
      const i = { ...e.nodes ?? {} }, n = i[t.dataset.id];
      if (!n) return;
      let r = `${t.dataset.id}_kopie`, s = 2;
      for (; i[r]; ) r = `${t.dataset.id}_kopie_${s++}`;
      i[r] = { ...structuredClone(n), x: n.x + 25, y: n.y + 25, name: `${n.name ?? t.dataset.id} Kopie` }, this.commit({ ...e, nodes: i });
    }
    if (t.dataset.action === "add-line" && this.commit({ ...e, lines: [...e.lines ?? [], { id: `linie_${(((o = e.lines) == null ? void 0 : o.length) ?? 0) + 1}`, autoRoute: !0, sourcePort: "right", targetPort: "left" }] }), t.dataset.action === "remove-line" && this.commit({ ...e, lines: (e.lines ?? []).filter((i, n) => n !== Number(t.dataset.index)) }), t.dataset.action === "duplicate-line") {
      const i = [...e.lines ?? []], n = i[Number(t.dataset.index)];
      if (!n) return;
      let r = `${n.id}_kopie`, s = 2;
      for (; i.some((d) => d.id === r); ) r = `${n.id}_kopie_${s++}`;
      i.splice(Number(t.dataset.index) + 1, 0, { ...structuredClone(n), id: r }), this.commit({ ...e, lines: i });
    }
    if (t.dataset.action === "make-points") {
      const i = [...e.lines ?? []], n = Number(t.dataset.index), r = B(i[n].path ?? "");
      i[n] = { ...i[n], autoRoute: !1, points: r.length > 1 ? r : I(i[n], e.nodes ?? {}) }, this.commit({ ...e, lines: i });
    }
    t.dataset.action === "clear-image" && this.updatePath("background.image", ""), t.dataset.action === "undo" && this.undo(), t.dataset.action === "redo" && this.redo(), t.dataset.action === "export" && this.exportConfig(), t.dataset.action === "import" && ((a = this._root.querySelector('input[data-action="import-file"]')) == null || a.click()), t.dataset.action === "preset" && this.commit(D());
  }
  selectImage(t) {
    var a;
    const e = (a = t.files) == null ? void 0 : a[0];
    if (!e) return;
    const o = new FileReader();
    o.addEventListener("load", () => this.updatePath("background.image", String(o.result ?? ""))), o.readAsDataURL(e);
  }
  exportConfig() {
    const t = new Blob([JSON.stringify(this.config(), null, 2)], { type: "application/json" }), e = URL.createObjectURL(t), o = document.createElement("a");
    o.href = e, o.download = "energy-flow-builder-card.json", o.click(), URL.revokeObjectURL(e);
  }
  importConfig(t) {
    var a;
    const e = (a = t.files) == null ? void 0 : a[0];
    if (!e) return;
    const o = new FileReader();
    o.addEventListener("load", () => {
      try {
        const i = JSON.parse(String(o.result ?? ""));
        if (!i || typeof i != "object") throw new Error("Invalid configuration");
        this.commit({ ...i, type: "custom:energy-flow-builder-card" });
      } catch {
        window.alert("Die Datei enthält keine gültige Energy Flow Builder Konfiguration.");
      }
    }), o.readAsText(e);
  }
  updatePath(t, e) {
    const o = this.config(), [a, i] = t.split("."), n = a === "background" ? o.background ?? {} : {}, r = i === "gridSize" && e !== "" ? Number(e) : e || void 0;
    this.commit({ ...o, [a]: { ...n, [i]: r } });
  }
  updateNode(t, e, o) {
    const a = { ...this.config().nodes ?? {} }, i = o instanceof HTMLInputElement && o.type === "checkbox" ? o.checked : o.value;
    a[t] = { ...a[t], [e]: L(e) && i !== "" ? Number(i) : i || void 0 }, this.commit({ ...this.config(), nodes: a });
  }
  updateNodeStyle(t, e, o) {
    const a = { ...this.config().nodes ?? {} }, i = a[t];
    if (!i) return;
    const n = e === "radius" && o.value !== "" ? Number(o.value) : o.value || void 0;
    a[t] = { ...i, style: { ...i.style, [e]: n } }, this.commit({ ...this.config(), nodes: a });
  }
  renameNode(t, e) {
    var r;
    const o = e.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!o || o === t || (r = this.config().nodes) != null && r[o]) {
      this.render();
      return;
    }
    const a = { ...this.config().nodes ?? {} }, i = a[t];
    delete a[t], a[o] = i;
    const n = (this.config().lines ?? []).map((s) => ({ ...s, source: s.source === t ? o : s.source, target: s.target === t ? o : s.target }));
    this.commit({ ...this.config(), nodes: a, lines: n });
  }
  updateLine(t, e, o) {
    const a = this.config(), i = [...a.lines ?? []], n = o instanceof HTMLInputElement && o.type === "checkbox" ? o.checked : o.value;
    i[t] = { ...i[t], [e]: L(e) && n !== "" ? Number(n) : n || void 0 }, this.commit({ ...a, lines: i });
  }
  updateLinePoint(t, e) {
    if (!t.id || t.index === void 0 || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return;
    const o = this.config(), a = [...o.lines ?? []], i = a.findIndex((r) => r.id === t.id);
    if (i < 0) return;
    const n = [...a[i].points ?? []];
    e ? n.splice(t.index, 0, { x: t.x, y: t.y }) : n[t.index] = { x: t.x, y: t.y }, a[i] = { ...a[i], points: n }, this.commit({ ...o, lines: a });
  }
  undo() {
    const t = this._history.pop();
    !t || !this._config || (this._future.push(structuredClone(this._config)), this.commit(t, !1));
  }
  redo() {
    const t = this._future.pop();
    !t || !this._config || (this._history.push(structuredClone(this._config)), this.commit(t, !1));
  }
  config() {
    return this._config ?? { type: "custom:energy-flow-builder-card" };
  }
  commit(t, e = !0) {
    e && this._config && (this._history.push(structuredClone(this._config)), this._history.length > 30 && this._history.shift(), this._future = []), this._config = t, this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: t }, bubbles: !0, composed: !0 })), this.render();
  }
}
function L(l) {
  return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove", "pulseCount"].includes(l);
}
function N(l) {
  return l === void 0 ? "" : String(l);
}
function y(l) {
  return l.replace(/[&<>\"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[t] ?? t);
}
function c(l) {
  return y(l);
}
function M(l) {
  return !!(l != null && l.startsWith("data:image/"));
}
function B(l) {
  const t = l.match(/[MLHV]|-?(?:\d*\.\d+|\d+)/g) ?? [], e = [];
  let o = 0, a = "";
  for (; o < t.length; ) {
    /[MLHV]/.test(t[o]) && (a = t[o++]);
    const i = e[e.length - 1] ?? { x: 0, y: 0 };
    if ((a === "M" || a === "L") && o + 1 < t.length) e.push({ x: Number(t[o++]), y: Number(t[o++]) });
    else if (a === "H" && o < t.length) e.push({ x: Number(t[o++]), y: i.y });
    else if (a === "V" && o < t.length) e.push({ x: i.x, y: Number(t[o++]) });
    else break;
  }
  return e;
}
function D() {
  return {
    type: "custom:energy-flow-builder-card",
    title: "Energiefluss",
    background: { color: "#dbeafe", viewBox: "0 0 1073 1466", aspectRatio: "1073 / 1466", showCoordinates: !0, snapToGrid: !0, gridSize: 25 },
    nodes: {
      solar: { x: 385, y: 330, name: "Solar" },
      house: { x: 760, y: 520, name: "Haus" },
      battery: { x: 385, y: 1124, name: "Batterie" },
      wallbox: { x: 42, y: 1124, name: "Auto / Wallbox" },
      grid: { x: 760, y: 1248, name: "Netz" },
      heating: { x: 760, y: 900, name: "Heizung" }
    },
    lines: [
      { id: "solar_haus", source: "solar", target: "house", sourcePort: "right", targetPort: "left", autoRoute: !0 },
      { id: "solar_batterie", source: "solar", target: "battery", sourcePort: "bottom", targetPort: "top", autoRoute: !0 },
      { id: "netz_haus", source: "grid", target: "house", sourcePort: "top", targetPort: "bottom", autoRoute: !0 }
    ]
  };
}
function I(l, t) {
  const e = l.source ? t[l.source] : void 0, o = l.target ? t[l.target] : void 0;
  if (!e || !o) return [{ x: 100, y: 100 }, { x: 300, y: 100 }];
  const a = (s, d) => {
    const u = s.labelWidth ?? 210, h = s.labelHeight ?? 82;
    return d === "top" ? { x: s.x + u / 2, y: s.y } : d === "bottom" ? { x: s.x + u / 2, y: s.y + h } : d === "left" ? { x: s.x, y: s.y + h / 2 } : { x: s.x + u, y: s.y + h / 2 };
  }, i = a(e, l.sourcePort ?? "right"), n = a(o, l.targetPort ?? "left");
  return [l.sourcePort, l.targetPort].some((s) => s === "left" || s === "right") ? [i, { x: Math.round((i.x + n.x) / 2), y: i.y }, { x: Math.round((i.x + n.x) / 2), y: n.y }, n] : [i, { x: i.x, y: Math.round((i.y + n.y) / 2) }, { x: n.x, y: Math.round((i.y + n.y) / 2) }, n];
}
const T = `
  :host { display:block; color:var(--primary-text-color); }
  section { padding: 4px 0; }
  .toolbar { display:grid; grid-template-columns:auto auto 1fr auto auto auto; align-items:center; gap:6px; margin:0 0 12px; }
  .toolbar .icon { min-width:34px; padding:6px 8px; font-size:1.2rem; line-height:1; }
  .toolbar button:disabled { opacity:.42; cursor:not-allowed; }
  .compact { padding:6px 8px; font-size:.82rem; }
  .hidden-file { display:none; }
  .intro, .empty { color:var(--secondary-text-color); font-size:.92rem; line-height:1.45; }
  .section { padding: 12px 0; border-bottom:1px solid var(--divider-color); }
  .heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:18px 0 8px; }
  h3 { margin:0; font-size:1rem; }
  .item { border:1px solid var(--divider-color); border-radius:6px; margin:8px 0; overflow:hidden; }
  .subitem { border-top:1px solid var(--divider-color); margin-top:12px; }
  .subitem summary { padding:9px 0 4px; font-size:.86rem; }
  .subitem .row { padding-bottom:1px; }
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
  .entity-search { border-color: color-mix(in srgb, var(--primary-color) 36%, var(--divider-color)); }
  .file-note { color:var(--secondary-text-color); font-size:.78rem; margin-top:-4px; }
  button { border:0; border-radius:4px; padding:8px 10px; background:var(--primary-color); color:var(--text-primary-color); cursor:pointer; font:inherit; }
  button.secondary { background:transparent; color:var(--primary-color); padding-left:0; }
  button.danger { background:transparent; color:var(--error-color); padding-left:0; }
  .actions { display:flex; gap:18px; align-items:center; }
  @media (max-width: 420px) { .row, .three { grid-template-columns:1fr; gap:0; } }
`;
customElements.define(H, R);
const $ = "energy-flow-builder-card", A = "0 0 1000 1000", z = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};
class F extends HTMLElement {
  constructor() {
    super(...arguments), this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(t) {
    if (!t || t.type !== `custom:${$}`)
      throw new Error(`Expected type custom:${$}`);
    this._config = {
      ...t,
      defaults: { ...z, ...t.defaults ?? {} }
    }, this.render();
  }
  set hass(t) {
    this._hass = t, this.render();
  }
  getCardSize() {
    return 5;
  }
  static getConfigElement() {
    return document.createElement("energy-flow-builder-card-editor");
  }
  static getStubConfig() {
    return {
      type: `custom:${$}`,
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
    var i, n, r;
    if (!this._config) return;
    const t = this._config, e = ((i = t.background) == null ? void 0 : i.viewBox) ?? A, o = Object.entries(t.nodes ?? {}).filter(([, s]) => !s.hide), a = t.lines ?? [];
    this._root.innerHTML = `
      <style>${V}</style>
      <ha-card>
        ${t.title ? `<div class="card-title">${C(t.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(t)}">
          ${(n = t.background) != null && n.image ? `<img class="background" src="${p(t.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${p(e)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${a.map((s) => {
      var d;
      return this.renderLine(s, !!((d = t.background) != null && d.showCoordinates));
    }).join("")}
            ${(r = t.background) != null && r.showCoordinates ? this.renderCoordinateGrid(e) : ""}
            ${o.map(([s, d]) => {
      var u;
      return this.renderNode(s, d, !!((u = t.background) != null && u.showCoordinates));
    }).join("")}
          </svg>
        </div>
      </ha-card>
    `, this.bindNodeActions(), this.bindLineActions();
  }
  stageStyle(t) {
    var a, i;
    const e = (a = t.background) != null && a.color ? `background:${t.background.color};` : "", o = (i = t.background) != null && i.aspectRatio ? `aspect-ratio:${t.background.aspectRatio};` : "";
    return `${e}${o}`;
  }
  renderLine(t, e) {
    const o = this.defaults(), a = t.value ?? this.entityNumber(t.entity), i = t.invert ? -a : a, n = Math.abs(i), r = t.activeAbove ?? o.activeAbove, s = n > r;
    if (!s && t.hideWhenInactive) return "";
    const d = this.linePath(t, i);
    if (!d) return "";
    const u = G(t.id), h = t.width ?? o.lineWidth, g = t.duration ?? W(n, o.duration), f = t.color ?? o.lineColor, m = t.trackColor ?? o.trackColor, w = t.pulseColor ?? o.pulseColor, k = t.dashPattern ? `--dash-pattern:${p(t.dashPattern)};` : "", x = Math.max(0, Math.min(4, t.pulseCount ?? 2)), _ = i < 0 ? "reverse" : "normal", E = s ? "1" : ".38";
    return `
      <g class="flow-line ${s ? "is-active" : "is-idle"}" data-line-id="${p(t.id)}" style="--line-width:${h};--duration:${g}s;--direction:${_};--flow-opacity:${E};--line-color:${p(f)};--track-color:${p(m)};--pulse-color:${p(w)};${k}">
        <path id="${u}" data-flow-path class="flow-track" d="${p(d)}"></path>
        <path data-flow-path class="flow-main" d="${p(d)}"></path>
        ${s ? Array.from({ length: x }, (b, v) => `<circle class="flow-pulse ${v ? "secondary" : "primary"}" r="${Math.max(v ? 4 : 5, h * (v ? 1 : 1.3))}"><animateMotion dur="${g}s" begin="${g / Math.max(1, x) * v}s" repeatCount="indefinite" calcMode="paced"><mpath href="#${u}"></mpath></animateMotion></circle>`).join("") : ""}
        ${e ? (t.points ?? []).map((b, v) => `<circle class="line-handle" data-point-index="${v}" cx="${b.x}" cy="${b.y}" r="13"></circle>`).join("") : ""}
      </g>
    `;
  }
  linePath(t, e = 0) {
    var o, a, i, n;
    if (t.points && t.points.length > 1) return S(t.points);
    if (t.autoRoute && t.source && t.target) {
      const r = (a = (o = this._config) == null ? void 0 : o.nodes) == null ? void 0 : a[t.source], s = (n = (i = this._config) == null ? void 0 : i.nodes) == null ? void 0 : n[t.target];
      if (r && s) return q(r, s, this.defaults(), t.sourcePort, t.targetPort);
    }
    return e < 0 && t.pathNegative ? t.pathNegative : e >= 0 && t.pathPositive ? t.pathPositive : t.path;
  }
  renderCoordinateGrid(t) {
    const e = t.trim().split(/\s+/).map(Number), [, , o = 1e3, a = 1e3] = e, i = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(o * r)), n = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(a * r));
    return `<g class="coordinate-grid">${i.map((r) => `<path d="M${r} 0 V${a}"></path><text x="${r + 10}" y="28">${r}</text>`).join("")}${n.map((r) => `<path d="M0 ${r} H${o}"></path>${r ? `<text x="10" y="${r - 8}">${r}</text>` : ""}`).join("")}</g>`;
  }
  renderNode(t, e, o) {
    var f, m, w, k, x, _, E, b;
    const a = this.defaults(), i = this.entity(e.entity), n = this.formatEntity(i, e), r = e.secondaryEntity ? this.formatEntity(this.entity(e.secondaryEntity), { ...e, stateType: "raw" }) : "", s = e.name ?? ((m = (f = i == null ? void 0 : i.attributes) == null ? void 0 : f.friendly_name) == null ? void 0 : m.toString()) ?? t, d = e.labelWidth ?? a.labelWidth, u = e.labelHeight ?? a.labelHeight, h = Math.abs(this.entityNumber(e.entity)) > (e.activeAbove ?? a.activeAbove), g = [
      (w = e.style) != null && w.background ? `--node-background:${p(e.style.background)}` : "",
      (k = e.style) != null && k.border ? `--node-border:${p(e.style.border)}` : "",
      (x = e.style) != null && x.titleColor ? `--node-title:${p(e.style.titleColor)}` : "",
      (_ = e.style) != null && _.valueColor ? `--node-value:${p(e.style.valueColor)}` : ""
    ].filter(Boolean).join(";");
    return `
      <g class="flow-node ${h ? "is-active" : "is-idle"}" data-node-id="${p(t)}" data-entity="${p(e.entity ?? "")}" transform="translate(${e.x} ${e.y})" style="${g}">
        <rect class="node-box" width="${d}" height="${u}" rx="${((E = e.style) == null ? void 0 : E.radius) ?? 16}" ry="${((b = e.style) == null ? void 0 : b.radius) ?? 16}"></rect>
        <text class="node-title" x="18" y="32">${P(s)}</text>
        <text class="node-value" x="18" y="61">${P(n)}</text>
        ${r ? `<text class="node-secondary" x="${d - 18}" y="32">${P(r)}</text>` : ""}
        ${o ? `<text class="node-coordinates" x="0" y="${u + 21}">x ${e.x} · y ${e.y}</text>` : ""}
      </g>
    `;
  }
  bindNodeActions() {
    var a, i;
    const t = this._root.querySelector(".flow-svg");
    if (!t) return;
    const e = !!((i = (a = this._config) == null ? void 0 : a.background) != null && i.showCoordinates);
    this._root.querySelectorAll(".flow-node[data-node-id]").forEach((n) => {
      const r = n.dataset.entity;
      n.addEventListener("pointerdown", (s) => {
        var h, g;
        if (!e) return;
        const d = this.svgPoint(t, s), u = (g = (h = this._config) == null ? void 0 : h.nodes) == null ? void 0 : g[n.dataset.nodeId ?? ""];
        u && (this._drag = { id: n.dataset.nodeId ?? "", node: n, offsetX: d.x - u.x, offsetY: d.y - u.y, moved: !1 }, n.setPointerCapture(s.pointerId), s.preventDefault());
      }), n.addEventListener("pointermove", (s) => this.dragNode(t, s)), n.addEventListener("pointerup", (s) => {
        const d = this._drag;
        if (!(!d || d.node !== n))
          if (this._drag = void 0, d.moved) {
            const u = this.svgPoint(t, s), h = this.snapPoint({ x: u.x - d.offsetX, y: u.y - d.offsetY });
            this.publishNodePosition(d.id, h.x, h.y);
          } else r && this.openMoreInfo(r);
      }), n.addEventListener("click", (s) => {
        e ? s.preventDefault() : r && this.openMoreInfo(r);
      });
    });
  }
  dragNode(t, e) {
    const o = this._drag;
    if (!o) return;
    const a = this.svgPoint(t, e), i = this.snapPoint({ x: a.x - o.offsetX, y: a.y - o.offsetY }), n = i.x, r = i.y;
    o.moved = !0, o.node.setAttribute("transform", `translate(${n} ${r})`);
    const s = o.node.querySelector(".node-coordinates");
    s && (s.textContent = `x ${n} · y ${r}`);
  }
  bindLineActions() {
    var e, o;
    const t = this._root.querySelector(".flow-svg");
    !t || !((o = (e = this._config) == null ? void 0 : e.background) != null && o.showCoordinates) || this._root.querySelectorAll(".flow-line[data-line-id]").forEach((a) => {
      const i = a.dataset.lineId ?? "";
      a.querySelectorAll(".line-handle").forEach((n) => {
        n.addEventListener("pointerdown", (r) => {
          var u, h, g;
          const s = (h = (u = this._config) == null ? void 0 : u.lines) == null ? void 0 : h.find((f) => f.id === i), d = Number(n.dataset.pointIndex);
          (g = s == null ? void 0 : s.points) != null && g[d] && (this._lineDrag = { id: i, index: d, handle: n, group: a, points: s.points.map((f) => ({ ...f })) }, n.setPointerCapture(r.pointerId), r.preventDefault(), r.stopPropagation());
        }), n.addEventListener("pointermove", (r) => this.dragLinePoint(t, r)), n.addEventListener("pointerup", () => {
          const r = this._lineDrag;
          if (!r || r.handle !== n) return;
          this._lineDrag = void 0;
          const s = r.points[r.index];
          window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-moved", { detail: { id: r.id, index: r.index, x: s.x, y: s.y } }));
        });
      }), a.addEventListener("dblclick", (n) => {
        var d, u;
        const r = (u = (d = this._config) == null ? void 0 : d.lines) == null ? void 0 : u.find((h) => h.id === i);
        if (!(r != null && r.points) || r.points.length < 2) return;
        const s = this.snapPoint(this.svgPoint(t, n));
        window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-added", { detail: { id: i, index: O(r.points, s), x: s.x, y: s.y } })), n.preventDefault();
      });
    });
  }
  dragLinePoint(t, e) {
    const o = this._lineDrag;
    if (!o) return;
    const a = this.snapPoint(this.svgPoint(t, e));
    o.points[o.index] = a, o.handle.setAttribute("cx", String(o.points[o.index].x)), o.handle.setAttribute("cy", String(o.points[o.index].y));
    const i = S(o.points);
    o.group.querySelectorAll("[data-flow-path]").forEach((n) => n.setAttribute("d", i));
  }
  publishNodePosition(t, e, o) {
    window.dispatchEvent(new CustomEvent("energy-flow-builder-node-moved", {
      detail: { id: t, x: Math.round(e), y: Math.round(o) }
    }));
  }
  snapPoint(t) {
    var i;
    const e = (i = this._config) == null ? void 0 : i.background, o = Math.max(1, (e == null ? void 0 : e.gridSize) ?? 25), a = (e == null ? void 0 : e.snapToGrid) ?? !!(e != null && e.showCoordinates);
    return {
      x: a ? Math.round(t.x / o) * o : Math.round(t.x),
      y: a ? Math.round(t.y / o) * o : Math.round(t.y)
    };
  }
  svgPoint(t, e) {
    const [o = 0, a = 0, i = 1e3, n = 1e3] = (t.getAttribute("viewBox") ?? A).split(/\s+/).map(Number), r = t.getBoundingClientRect();
    return {
      x: o + (e.clientX - r.left) / r.width * i,
      y: a + (e.clientY - r.top) / r.height * n
    };
  }
  openMoreInfo(t) {
    const e = new CustomEvent("hass-more-info", {
      bubbles: !0,
      composed: !0,
      detail: { entityId: t }
    });
    this.dispatchEvent(e);
  }
  entity(t) {
    var e;
    return t ? (e = this._hass) == null ? void 0 : e.states[t] : void 0;
  }
  defaults() {
    var t;
    return { ...z, ...((t = this._config) == null ? void 0 : t.defaults) ?? {} };
  }
  entityNumber(t) {
    const e = this.entity(t), o = Number(e == null ? void 0 : e.state);
    return Number.isFinite(o) ? o : 0;
  }
  formatEntity(t, e) {
    var n, r;
    if (!t) return "unavailable";
    if (e.stateType === "raw") return t.state;
    const o = Number(t.state);
    if (!Number.isFinite(o)) return t.state;
    const a = e.decimals ?? (Math.abs(o) >= 100 ? 0 : 1), i = e.unit ?? ((r = (n = t.attributes) == null ? void 0 : n.unit_of_measurement) == null ? void 0 : r.toString()) ?? "";
    return `${o.toFixed(a)}${i ? ` ${i}` : ""}`;
  }
}
const V = `
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
    stroke-dasharray: var(--dash-pattern, 26 190);
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
    fill: var(--node-background, color-mix(in srgb, var(--card-background-color) 86%, transparent));
    stroke: var(--node-border, color-mix(in srgb, var(--primary-text-color) 14%, transparent));
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
    fill: var(--node-title, var(--secondary-text-color));
    font-size: 18px;
    font-weight: 700;
  }

  .node-value {
    fill: var(--node-value, var(--primary-text-color));
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
function W(l, t) {
  if (l <= 0) return t;
  const e = Math.max(100, Math.min(l, 8e3));
  return Number((6 - (e - 100) / 7900 * 4.4).toFixed(2));
}
function S(l) {
  return l.map((t, e) => `${e ? "L" : "M"}${t.x} ${t.y}`).join(" ");
}
function q(l, t, e, o, a) {
  const i = j(l, e, o ?? "right"), n = j(t, e, a ?? "left");
  if (o === "left" || o === "right" || a === "left" || a === "right") {
    const d = Math.round((i.x + n.x) / 2);
    return S([i, { x: d, y: i.y }, { x: d, y: n.y }, n]);
  }
  const s = Math.round((i.y + n.y) / 2);
  return S([i, { x: i.x, y: s }, { x: n.x, y: s }, n]);
}
function j(l, t, e) {
  const o = l.labelWidth ?? t.labelWidth, a = l.labelHeight ?? t.labelHeight;
  return e === "top" ? { x: l.x + o / 2, y: l.y } : e === "bottom" ? { x: l.x + o / 2, y: l.y + a } : e === "left" ? { x: l.x, y: l.y + a / 2 } : { x: l.x + o, y: l.y + a / 2 };
}
function O(l, t) {
  let e = 0, o = Number.POSITIVE_INFINITY;
  for (let a = 0; a < l.length - 1; a += 1) {
    const i = l[a], n = l[a + 1], r = (n.x - i.x) ** 2 + (n.y - i.y) ** 2 || 1, s = Math.max(0, Math.min(1, ((t.x - i.x) * (n.x - i.x) + (t.y - i.y) * (n.y - i.y)) / r)), d = i.x + s * (n.x - i.x), u = i.y + s * (n.y - i.y), h = (t.x - d) ** 2 + (t.y - u) ** 2;
    h < o && (o = h, e = a);
  }
  return e + 1;
}
function G(l) {
  return `efb-${l.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function C(l) {
  return l.replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[t] ?? t);
}
function p(l) {
  return C(l);
}
function P(l) {
  return C(l);
}
customElements.define($, F);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: $,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
