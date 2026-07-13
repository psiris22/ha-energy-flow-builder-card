const I = "energy-flow-builder-card-editor";
class D extends HTMLElement {
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
    var n, i, a, r, s, u, c, h, p;
    if (!this._config) return;
    const t = this._config, e = Object.entries(t.nodes ?? {}), o = t.lines ?? [];
    this._root.innerHTML = `
      <style>${O}</style>
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
          <label>Überschrift <input data-path="title" value="${d(t.title ?? "")}" placeholder="Energiefluss"></label>
          <div class="row">
            <label>Hintergrundfarbe <input data-path="background.color" value="${d(((n = t.background) == null ? void 0 : n.color) ?? "")}" placeholder="#dbeafe"></label>
            <label>Koordinatenraum <input data-path="background.viewBox" value="${d(((i = t.background) == null ? void 0 : i.viewBox) ?? "0 0 1073 1466")}"></label>
          </div>
          <label>Hintergrundbild per Pfad <input data-path="background.image" value="${d(z((a = t.background) == null ? void 0 : a.image) ? "" : ((r = t.background) == null ? void 0 : r.image) ?? "")}" placeholder="/local/meine-grafik.png"></label>
          <label>Bild vom Computer auswählen <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-action="select-image"></label>
          <div class="file-note">Das Bild wird direkt in dieser Karten-Konfiguration gespeichert.</div>
          ${z((s = t.background) == null ? void 0 : s.image) ? '<button class="secondary" type="button" data-action="clear-image">Ausgewähltes Bild entfernen</button>' : ""}
          <label class="check"><input type="checkbox" data-path="background.showCoordinates" ${(u = t.background) != null && u.showCoordinates ? "checked" : ""}> Koordinatenraster und X/Y-Werte in der Vorschau zeigen</label>
          <div class="row"><label class="check"><input type="checkbox" data-path="background.snapToGrid" ${((c = t.background) == null ? void 0 : c.snapToGrid) ?? ((h = t.background) == null ? void 0 : h.showCoordinates) ? "checked" : ""}> Am Raster einrasten</label><label>Rasterabstand <input type="number" min="1" data-path="background.gridSize" value="${((p = t.background) == null ? void 0 : p.gridSize) ?? 25}"></label></div>
        </div>
        <div class="heading"><h3>Anzeigen</h3><button type="button" data-action="add-node">Anzeige hinzufügen</button></div>
        ${e.length ? e.map(([g, b]) => this.nodeForm(g, b)).join("") : "<p class=empty>Noch keine Anzeigen angelegt.</p>"}
        <div class="heading"><h3>Linien</h3><button type="button" data-action="add-line">Linie hinzufügen</button></div>
        ${o.length ? o.map((g, b) => this.lineForm(g, b)).join("") : "<p class=empty>Linien können später per SVG-Pfad ergänzt werden.</p>"}
        <datalist id="efb-entity-list">${this.entityOptions()}</datalist>
      </section>`, this.bind();
  }
  nodeForm(t, e) {
    var o, n, i, a, r;
    return `<details class="item" data-section="node:${d(t)}" ${this.sectionOpen(`node:${t}`, !0) ? "open" : ""}>
      <summary>${m(e.name ?? t)} <span>${m(e.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${d(t)}" data-key="name" value="${d(e.name ?? "")}"></label><label>Interne ID <input data-node-id="${d(t)}" value="${d(t)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", t, "entity", e.entity)}</label>
        <label>Zweite Entity / Batterie-SoC (optional) ${this.entitySelect("node", t, "secondaryEntity", e.secondaryEntity, !0)}</label>
        <div class="row three"><label>X <input type="number" data-node="${d(t)}" data-key="x" value="${A(e.x)}"></label><label>Y <input type="number" data-node="${d(t)}" data-key="y" value="${A(e.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${d(t)}" data-key="decimals" value="${e.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${d(t)}" data-key="labelWidth" value="${e.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${d(t)}" data-key="labelHeight" value="${e.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <label>Linienanschluss ${this.nodePortSelect(t, e.connectionPort)}</label>
        <details class="subitem" data-section="node-style:${d(t)}" ${this.sectionOpen(`node-style:${t}`) ? "open" : ""}>
          <summary>Darstellung</summary>
          <div class="row"><label>Hintergrund <input data-node-style="${d(t)}" data-key="background" value="${d(((o = e.style) == null ? void 0 : o.background) ?? "")}" placeholder="#182432"></label><label>Rahmen <input data-node-style="${d(t)}" data-key="border" value="${d(((n = e.style) == null ? void 0 : n.border) ?? "")}" placeholder="#16a6d9"></label></div>
          <div class="row"><label>Titelfarbe <input data-node-style="${d(t)}" data-key="titleColor" value="${d(((i = e.style) == null ? void 0 : i.titleColor) ?? "")}" placeholder="Standard"></label><label>Wertfarbe <input data-node-style="${d(t)}" data-key="valueColor" value="${d(((a = e.style) == null ? void 0 : a.valueColor) ?? "")}" placeholder="Standard"></label></div>
          <label>Eckenradius <input type="number" min="0" data-node-style="${d(t)}" data-key="radius" value="${((r = e.style) == null ? void 0 : r.radius) ?? ""}" placeholder="16"></label>
        </details>
        <label class="check"><input type="checkbox" data-node="${d(t)}" data-key="hide" ${e.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-node" data-id="${d(t)}">Duplizieren</button><button class="danger" type="button" data-action="remove-node" data-id="${d(t)}">Anzeige entfernen</button></div>
      </div>
    </details>`;
  }
  lineForm(t, e) {
    var n;
    const o = Object.entries(this.config().nodes ?? {});
    return `<details class="item" data-section="line:${e}" ${this.sectionOpen(`line:${e}`) ? "open" : ""}>
      <summary>${m(t.id || `Linie ${e + 1}`)} <span>${m(t.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>ID <input data-line="${e}" data-key="id" value="${d(t.id)}"></label><label>Breite <input type="number" data-line="${e}" data-key="width" value="${t.width ?? ""}" placeholder="Standard"></label></div>
        <label>Steuernde Entity ${this.lineEntitySelect(e, t.entity)}</label>
        <label class="check"><input type="checkbox" data-line="${e}" data-key="autoRoute" ${t.autoRoute ? "checked" : ""}> Automatisch zwischen zwei Anzeigen verbinden</label>
        <div class="row"><label>Von ${this.nodeSelect(e, "source", t.source, o)}</label><label>Nach ${this.nodeSelect(e, "target", t.target, o)}</label></div>
        <div class="row"><label>Startanschluss ${this.portSelect(e, "sourcePort", t.sourcePort)}</label><label>Zielanschluss ${this.portSelect(e, "targetPort", t.targetPort)}</label></div>
        ${t.autoRoute ? '<div class="file-note">Die Verbindung folgt den Boxen automatisch. Für einen eigenen Verlauf die automatische Verbindung ausschalten und Punkte bearbeiten.</div>' : `<label>SVG-Pfad <input data-line="${e}" data-key="path" value="${d(t.path ?? "")}" placeholder="M600 500 V1100"></label>`}
        ${(n = t.points) != null && n.length ? `<div class="file-note">${t.points.length} bearbeitbare Punkte: Punkte ziehen, Doppelklick auf die Linie für einen weiteren Punkt.</div>` : `<button class="secondary" type="button" data-action="make-points" data-index="${e}">Pfad mit Maus bearbeiten</button>`}
        <div class="row"><label>Farbe <input data-line="${e}" data-key="color" value="${d(t.color ?? "")}" placeholder="#16a6d9"></label><label>Strichmuster <input data-line="${e}" data-key="dashPattern" value="${d(t.dashPattern ?? "")}" placeholder="26 190"></label></div>
        <div class="row"><label>Schwelle <input type="number" data-line="${e}" data-key="activeAbove" value="${t.activeAbove ?? ""}" placeholder="Standard"></label><label>Animierte Punkte <input type="number" min="0" max="4" data-line="${e}" data-key="pulseCount" value="${t.pulseCount ?? ""}" placeholder="2"></label></div>
        <label class="check"><input type="checkbox" data-line="${e}" data-key="invert" ${t.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-line" data-index="${e}">Duplizieren</button><button class="danger" type="button" data-action="remove-line" data-index="${e}">Linie entfernen</button></div>
      </div>
    </details>`;
  }
  entitySelect(t, e, o, n, i = !1) {
    return `<input class="entity-search" type="search" list="efb-entity-list" ${t === "node" ? `data-node="${d(e)}"` : `data-line="${d(e)}"`} data-key="${o}" value="${d(n ?? "")}" placeholder="${i ? "Keine zweite Entity" : "Entität suchen..."}" autocomplete="off">`;
  }
  lineEntitySelect(t, e) {
    const o = this.nodeEntityIds(), n = e && !o.includes(e) ? [e, ...o] : o;
    return `<select data-line="${t}" data-key="entity"><option value="">Keine Entity</option>${n.map((i) => `<option value="${d(i)}" ${i === e ? "selected" : ""}>${m(this.entityLabel(i))} (${m(i)})</option>`).join("")}</select>`;
  }
  nodeSelect(t, e, o, n) {
    return `<select data-line="${t}" data-key="${e}"><option value="">Nicht gewählt</option>${n.map(([i, a]) => `<option value="${d(i)}" ${i === o ? "selected" : ""}>${m(a.name ?? i)} (${m(i)})</option>`).join("")}</select>`;
  }
  portSelect(t, e, o) {
    return `<select data-line="${t}" data-key="${e}"><option value="" ${o ? "" : "selected"}>Box-Einstellung</option>${this.portOptions(o)}</select>`;
  }
  nodePortSelect(t, e) {
    return `<select data-node="${d(t)}" data-key="connectionPort">${this.portOptions(e ?? "bottom")}</select>`;
  }
  portOptions(t) {
    return ["top", "right", "bottom", "left"].map((e) => `<option value="${e}" ${e === t ? "selected" : ""}>${{ top: "Oben mittig", right: "Rechts mittig", bottom: "Unten mittig", left: "Links mittig" }[e]}</option>`).join("");
  }
  sectionOpen(t, e = !1) {
    return this._openSections.get(t) ?? e;
  }
  entityOptions() {
    var t;
    return Object.entries(((t = this._hass) == null ? void 0 : t.states) ?? {}).filter(([, e]) => !!e).sort(([e, o], [n, i]) => {
      var a, r, s, u;
      return (((r = (a = o == null ? void 0 : o.attributes) == null ? void 0 : a.friendly_name) == null ? void 0 : r.toString()) ?? e).localeCompare(((u = (s = i == null ? void 0 : i.attributes) == null ? void 0 : s.friendly_name) == null ? void 0 : u.toString()) ?? n);
    }).map(([e, o]) => {
      var n, i;
      return `<option value="${d(e)}" label="${d(`${((i = (n = o == null ? void 0 : o.attributes) == null ? void 0 : n.friendly_name) == null ? void 0 : i.toString()) ?? e} (${e})`)}"></option>`;
    }).join("");
  }
  nodeEntityIds() {
    const t = /* @__PURE__ */ new Set();
    return Object.values(this.config().nodes ?? {}).forEach((e) => {
      e.entity && t.add(e.entity), e.secondaryEntity && t.add(e.secondaryEntity);
    }), [...t].sort((e, o) => this.entityLabel(e).localeCompare(this.entityLabel(o)));
  }
  entityLabel(t) {
    var e, o, n, i;
    return ((i = (n = (o = (e = this._hass) == null ? void 0 : e.states[t]) == null ? void 0 : o.attributes) == null ? void 0 : n.friendly_name) == null ? void 0 : i.toString()) ?? t;
  }
  bind() {
    this._root.querySelectorAll("input[data-path], select[data-path]").forEach((t) => t.addEventListener("change", () => this.updatePath(t.dataset.path, t instanceof HTMLInputElement && t.type === "checkbox" ? t.checked : t.value))), this._root.querySelectorAll("[data-node][data-key]").forEach((t) => t.addEventListener("change", () => this.updateNode(t.dataset.node, t.dataset.key, t))), this._root.querySelectorAll("[data-node-style][data-key]").forEach((t) => t.addEventListener("change", () => this.updateNodeStyle(t.dataset.nodeStyle, t.dataset.key, t))), this._root.querySelectorAll("input[data-node-id]").forEach((t) => t.addEventListener("change", () => this.renameNode(t.dataset.nodeId, t.value))), this._root.querySelectorAll("[data-line][data-key]").forEach((t) => t.addEventListener("change", () => this.updateLine(Number(t.dataset.line), t.dataset.key, t))), this._root.querySelectorAll("button[data-action]").forEach((t) => t.addEventListener("click", () => this.action(t))), this._root.querySelectorAll('input[data-action="select-image"]').forEach((t) => t.addEventListener("change", () => this.selectImage(t))), this._root.querySelectorAll('input[data-action="import-file"]').forEach((t) => t.addEventListener("change", () => this.importConfig(t))), this._root.querySelectorAll("details[data-section]").forEach((t) => t.addEventListener("toggle", () => {
      const e = t.dataset.section;
      this._openSections.set(e, t.open);
    }));
  }
  action(t) {
    var o, n;
    const e = this.config();
    if (t.dataset.action === "add-node") {
      const i = { ...e.nodes ?? {} };
      let a = "anzeige", r = 2;
      for (; i[a]; ) a = `anzeige_${r++}`;
      i[a] = { x: 100, y: 100, name: "Neue Anzeige" }, this.commit({ ...e, nodes: i });
    }
    if (t.dataset.action === "remove-node" && t.dataset.id) {
      const i = { ...e.nodes ?? {} };
      delete i[t.dataset.id], this.commit({ ...e, nodes: i });
    }
    if (t.dataset.action === "duplicate-node" && t.dataset.id) {
      const i = { ...e.nodes ?? {} }, a = i[t.dataset.id];
      if (!a) return;
      let r = `${t.dataset.id}_kopie`, s = 2;
      for (; i[r]; ) r = `${t.dataset.id}_kopie_${s++}`;
      i[r] = { ...structuredClone(a), x: a.x + 25, y: a.y + 25, name: `${a.name ?? t.dataset.id} Kopie` }, this.commit({ ...e, nodes: i });
    }
    if (t.dataset.action === "add-line" && this.commit({ ...e, lines: [...e.lines ?? [], { id: `linie_${(((o = e.lines) == null ? void 0 : o.length) ?? 0) + 1}`, autoRoute: !0 }] }), t.dataset.action === "remove-line" && this.commit({ ...e, lines: (e.lines ?? []).filter((i, a) => a !== Number(t.dataset.index)) }), t.dataset.action === "duplicate-line") {
      const i = [...e.lines ?? []], a = i[Number(t.dataset.index)];
      if (!a) return;
      let r = `${a.id}_kopie`, s = 2;
      for (; i.some((u) => u.id === r); ) r = `${a.id}_kopie_${s++}`;
      i.splice(Number(t.dataset.index) + 1, 0, { ...structuredClone(a), id: r }), this.commit({ ...e, lines: i });
    }
    if (t.dataset.action === "make-points") {
      const i = [...e.lines ?? []], a = Number(t.dataset.index), r = B(i[a].path ?? "");
      i[a] = { ...i[a], autoRoute: !1, points: r.length > 1 ? r : F(i[a], e.nodes ?? {}) }, this.commit({ ...e, lines: i });
    }
    t.dataset.action === "clear-image" && this.updatePath("background.image", ""), t.dataset.action === "undo" && this.undo(), t.dataset.action === "redo" && this.redo(), t.dataset.action === "export" && this.exportConfig(), t.dataset.action === "import" && ((n = this._root.querySelector('input[data-action="import-file"]')) == null || n.click()), t.dataset.action === "preset" && this.commit(T());
  }
  selectImage(t) {
    var n;
    const e = (n = t.files) == null ? void 0 : n[0];
    if (!e) return;
    const o = new FileReader();
    o.addEventListener("load", () => this.updatePath("background.image", String(o.result ?? ""))), o.readAsDataURL(e);
  }
  exportConfig() {
    const t = new Blob([JSON.stringify(this.config(), null, 2)], { type: "application/json" }), e = URL.createObjectURL(t), o = document.createElement("a");
    o.href = e, o.download = "energy-flow-builder-card.json", o.click(), URL.revokeObjectURL(e);
  }
  importConfig(t) {
    var n;
    const e = (n = t.files) == null ? void 0 : n[0];
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
    const o = this.config(), [n, i] = t.split("."), a = n === "background" ? o.background ?? {} : {}, r = i === "gridSize" && e !== "" ? Number(e) : e || void 0;
    this.commit({ ...o, [n]: { ...a, [i]: r } });
  }
  updateNode(t, e, o) {
    const n = { ...this.config().nodes ?? {} }, i = o instanceof HTMLInputElement && o.type === "checkbox" ? o.checked : o.value;
    n[t] = { ...n[t], [e]: M(e) && i !== "" ? Number(i) : i || void 0 }, this.commit({ ...this.config(), nodes: n });
  }
  updateNodeStyle(t, e, o) {
    const n = { ...this.config().nodes ?? {} }, i = n[t];
    if (!i) return;
    const a = e === "radius" && o.value !== "" ? Number(o.value) : o.value || void 0;
    n[t] = { ...i, style: { ...i.style, [e]: a } }, this.commit({ ...this.config(), nodes: n });
  }
  renameNode(t, e) {
    var r;
    const o = e.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!o || o === t || (r = this.config().nodes) != null && r[o]) {
      this.render();
      return;
    }
    const n = { ...this.config().nodes ?? {} }, i = n[t];
    delete n[t], n[o] = i;
    const a = (this.config().lines ?? []).map((s) => ({ ...s, source: s.source === t ? o : s.source, target: s.target === t ? o : s.target }));
    this.commit({ ...this.config(), nodes: n, lines: a });
  }
  updateLine(t, e, o) {
    const n = this.config(), i = [...n.lines ?? []], a = o instanceof HTMLInputElement && o.type === "checkbox" ? o.checked : o.value;
    i[t] = { ...i[t], [e]: M(e) && a !== "" ? Number(a) : a || void 0 }, this.commit({ ...n, lines: i });
  }
  updateLinePoint(t, e) {
    if (!t.id || t.index === void 0 || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return;
    const o = this.config(), n = [...o.lines ?? []], i = n.findIndex((r) => r.id === t.id);
    if (i < 0) return;
    const a = [...n[i].points ?? []];
    e ? a.splice(t.index, 0, { x: t.x, y: t.y }) : a[t.index] = { x: t.x, y: t.y }, n[i] = { ...n[i], points: a }, this.commit({ ...o, lines: n });
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
function M(l) {
  return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove", "pulseCount"].includes(l);
}
function A(l) {
  return l === void 0 ? "" : String(l);
}
function m(l) {
  return l.replace(/[&<>\"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[t] ?? t);
}
function d(l) {
  return m(l);
}
function z(l) {
  return !!(l != null && l.startsWith("data:image/"));
}
function B(l) {
  const t = l.match(/[MLHV]|-?(?:\d*\.\d+|\d+)/g) ?? [], e = [];
  let o = 0, n = "";
  for (; o < t.length; ) {
    /[MLHV]/.test(t[o]) && (n = t[o++]);
    const i = e[e.length - 1] ?? { x: 0, y: 0 };
    if ((n === "M" || n === "L") && o + 1 < t.length) e.push({ x: Number(t[o++]), y: Number(t[o++]) });
    else if (n === "H" && o < t.length) e.push({ x: Number(t[o++]), y: i.y });
    else if (n === "V" && o < t.length) e.push({ x: i.x, y: Number(t[o++]) });
    else break;
  }
  return e;
}
function T() {
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
      { id: "solar_haus", source: "solar", target: "house", autoRoute: !0 },
      { id: "solar_batterie", source: "solar", target: "battery", autoRoute: !0 },
      { id: "netz_haus", source: "grid", target: "house", autoRoute: !0 }
    ]
  };
}
function F(l, t) {
  const e = l.source ? t[l.source] : void 0, o = l.target ? t[l.target] : void 0;
  if (!e || !o) return [{ x: 100, y: 100 }, { x: 300, y: 100 }];
  const n = (c, h) => {
    const p = c.labelWidth ?? 210, g = c.labelHeight ?? 82;
    return h === "top" ? { x: c.x + p / 2, y: c.y } : h === "bottom" ? { x: c.x + p / 2, y: c.y + g } : h === "left" ? { x: c.x, y: c.y + g / 2 } : { x: c.x + p, y: c.y + g / 2 };
  }, i = l.sourcePort ?? e.connectionPort ?? "bottom", a = l.targetPort ?? o.connectionPort ?? "bottom", r = n(e, i), s = n(o, a);
  return [i, a].some((c) => c === "left" || c === "right") ? [r, { x: Math.round((r.x + s.x) / 2), y: r.y }, { x: Math.round((r.x + s.x) / 2), y: s.y }, s] : [r, { x: r.x, y: Math.round((r.y + s.y) / 2) }, { x: s.x, y: Math.round((r.y + s.y) / 2) }, s];
}
const O = `
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
customElements.define(I, D);
const $ = "energy-flow-builder-card", j = "0 0 1000 1000", R = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};
class V extends HTMLElement {
  constructor() {
    super(...arguments), this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(t) {
    if (!t || t.type !== `custom:${$}`)
      throw new Error(`Expected type custom:${$}`);
    this._config = {
      ...t,
      defaults: { ...R, ...t.defaults ?? {} }
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
    var a, r, s;
    if (!this._config) return;
    const t = this._config, e = ((a = t.background) == null ? void 0 : a.viewBox) ?? j, o = Object.entries(t.nodes ?? {}).filter(([, u]) => !u.hide), n = t.lines ?? [], i = !!((r = t.background) != null && r.showCoordinates && this.isEditorPreview());
    this._root.innerHTML = `
      <style>${W}</style>
      <ha-card>
        ${t.title ? `<div class="card-title">${L(t.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(t)}">
          ${(s = t.background) != null && s.image ? `<img class="background" src="${f(t.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${f(e)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${n.map((u) => this.renderLine(u, i)).join("")}
            ${i ? this.renderCoordinateGrid(e) : ""}
            ${o.map(([u, c]) => this.renderNode(u, c, i)).join("")}
          </svg>
        </div>
      </ha-card>
    `, this.bindNodeActions(), this.bindLineActions();
  }
  stageStyle(t) {
    var n, i;
    const e = (n = t.background) != null && n.color ? `background:${t.background.color};` : "", o = (i = t.background) != null && i.aspectRatio ? `aspect-ratio:${t.background.aspectRatio};` : "";
    return `${e}${o}`;
  }
  renderLine(t, e) {
    const o = this.defaults(), n = t.value ?? this.entityNumber(t.entity), i = t.invert ? -n : n, a = Math.abs(i), r = t.activeAbove ?? o.activeAbove, s = a > r;
    if (!s && t.hideWhenInactive) return "";
    const u = this.linePath(t, i);
    if (!u) return "";
    const c = K(t.id), h = t.width ?? o.lineWidth, p = t.duration ?? q(a, o.duration), g = t.color ?? o.lineColor, b = t.trackColor ?? o.trackColor, S = t.pulseColor ?? o.pulseColor, w = t.dashPattern ? `--dash-pattern:${f(t.dashPattern)};` : "", x = Math.max(0, Math.min(4, t.pulseCount ?? 2)), k = i < 0 ? "reverse" : "normal", _ = s ? "1" : ".38";
    return `
      <g class="flow-line ${s ? "is-active" : "is-idle"}" data-line-id="${f(t.id)}" style="--line-width:${h};--duration:${p}s;--direction:${k};--flow-opacity:${_};--line-color:${f(g)};--track-color:${f(b)};--pulse-color:${f(S)};${w}">
        <path id="${c}" data-flow-path class="flow-track" d="${f(u)}"></path>
        <path data-flow-path class="flow-main" d="${f(u)}"></path>
        ${s ? Array.from({ length: x }, (v, y) => `<circle class="flow-pulse ${y ? "secondary" : "primary"}" r="${Math.max(y ? 4 : 5, h * (y ? 1 : 1.3))}"><animateMotion dur="${p}s" begin="${p / Math.max(1, x) * y}s" repeatCount="indefinite" calcMode="paced"><mpath href="#${c}"></mpath></animateMotion></circle>`).join("") : ""}
        ${e ? (t.points ?? []).map((v, y) => `<circle class="line-handle" data-point-index="${y}" cx="${v.x}" cy="${v.y}" r="13"></circle>`).join("") : ""}
      </g>
    `;
  }
  linePath(t, e = 0) {
    var o, n, i, a;
    if (t.points && t.points.length > 1) return E(t.points);
    if (t.autoRoute && t.source && t.target) {
      const r = (n = (o = this._config) == null ? void 0 : o.nodes) == null ? void 0 : n[t.source], s = (a = (i = this._config) == null ? void 0 : i.nodes) == null ? void 0 : a[t.target];
      if (r && s) return G(r, s, this.defaults(), t.sourcePort ?? r.connectionPort, t.targetPort ?? s.connectionPort);
    }
    return e < 0 && t.pathNegative ? t.pathNegative : e >= 0 && t.pathPositive ? t.pathPositive : t.path;
  }
  renderCoordinateGrid(t) {
    const e = t.trim().split(/\s+/).map(Number), [, , o = 1e3, n = 1e3] = e, i = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(o * r)), a = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(n * r));
    return `<g class="coordinate-grid">${i.map((r) => `<path d="M${r} 0 V${n}"></path><text x="${r + 10}" y="28">${r}</text>`).join("")}${a.map((r) => `<path d="M0 ${r} H${o}"></path>${r ? `<text x="10" y="${r - 8}">${r}</text>` : ""}`).join("")}</g>`;
  }
  renderNode(t, e, o) {
    var w, x, k, _, v, y, N, C;
    const n = this.defaults(), i = this.entity(e.entity), a = this.formatEntity(i, e), r = e.secondaryEntity ? this.formatEntity(this.entity(e.secondaryEntity), { ...e, unit: void 0, stateType: "power" }) : "", s = e.name ?? ((x = (w = i == null ? void 0 : i.attributes) == null ? void 0 : w.friendly_name) == null ? void 0 : x.toString()) ?? t, u = e.labelWidth ?? n.labelWidth, c = e.labelHeight ?? n.labelHeight, h = Math.abs(this.entityNumber(e.entity)) > (e.activeAbove ?? n.activeAbove), p = r ? 26 : 32, g = r ? 54 : 61, b = Math.max(42, c - 10), S = [
      (k = e.style) != null && k.background ? `--node-background:${f(e.style.background)}` : "",
      (_ = e.style) != null && _.border ? `--node-border:${f(e.style.border)}` : "",
      (v = e.style) != null && v.titleColor ? `--node-title:${f(e.style.titleColor)}` : "",
      (y = e.style) != null && y.valueColor ? `--node-value:${f(e.style.valueColor)}` : ""
    ].filter(Boolean).join(";");
    return `
      <g class="flow-node ${h ? "is-active" : "is-idle"} ${o ? "is-editing" : ""}" data-node-id="${f(t)}" data-entity="${f(e.entity ?? "")}" transform="translate(${e.x} ${e.y})" style="${S}">
        <rect class="node-box" width="${u}" height="${c}" rx="${((N = e.style) == null ? void 0 : N.radius) ?? 16}" ry="${((C = e.style) == null ? void 0 : C.radius) ?? 16}"></rect>
        <text class="node-title" x="18" y="${p}">${P(s)}</text>
        <text class="node-value" x="18" y="${g}">${P(a)}</text>
        ${r ? `<text class="node-secondary" x="${u - 18}" y="${b}">${P(r)}</text>` : ""}
        ${o ? `<text class="node-coordinates" x="0" y="${c + 21}">x ${e.x} · y ${e.y}</text>` : ""}
      </g>
    `;
  }
  bindNodeActions() {
    var n, i;
    const t = this._root.querySelector(".flow-svg");
    if (!t) return;
    const e = !!((i = (n = this._config) == null ? void 0 : n.background) != null && i.showCoordinates && this.isEditorPreview());
    this._root.querySelectorAll(".flow-node[data-node-id]").forEach((a) => {
      const r = a.dataset.entity;
      a.addEventListener("pointerdown", (s) => {
        var h, p;
        if (!e) return;
        const u = this.svgPoint(t, s), c = (p = (h = this._config) == null ? void 0 : h.nodes) == null ? void 0 : p[a.dataset.nodeId ?? ""];
        c && (this._drag = { id: a.dataset.nodeId ?? "", node: a, pointerId: s.pointerId, offsetX: u.x - c.x, offsetY: u.y - c.y, moved: !1 }, t.setPointerCapture(s.pointerId), s.preventDefault());
      }), a.addEventListener("click", (s) => {
        e ? s.preventDefault() : r && this.openMoreInfo(r);
      });
    }), t.addEventListener("pointermove", (a) => this.dragNode(t, a)), t.addEventListener("pointerup", (a) => this.finishNodeDrag(t, a)), t.addEventListener("pointercancel", (a) => this.finishNodeDrag(t, a));
  }
  dragNode(t, e) {
    const o = this._drag;
    if (!o || o.pointerId !== e.pointerId) return;
    const n = this.svgPoint(t, e), i = this.snapPoint({ x: n.x - o.offsetX, y: n.y - o.offsetY }), a = i.x, r = i.y;
    o.moved = !0, o.node.setAttribute("transform", `translate(${a} ${r})`);
    const s = o.node.querySelector(".node-coordinates");
    s && (s.textContent = `x ${a} · y ${r}`);
  }
  finishNodeDrag(t, e) {
    const o = this._drag;
    if (!o || o.pointerId !== e.pointerId || (this._drag = void 0, !o.moved)) return;
    const n = this.svgPoint(t, e), i = this.snapPoint({ x: n.x - o.offsetX, y: n.y - o.offsetY });
    this.publishNodePosition(o.id, i.x, i.y);
  }
  bindLineActions() {
    var e, o;
    const t = this._root.querySelector(".flow-svg");
    !t || !((o = (e = this._config) == null ? void 0 : e.background) != null && o.showCoordinates) || !this.isEditorPreview() || this._root.querySelectorAll(".flow-line[data-line-id]").forEach((n) => {
      const i = n.dataset.lineId ?? "";
      n.querySelectorAll(".line-handle").forEach((a) => {
        a.addEventListener("pointerdown", (r) => {
          var c, h, p;
          const s = (h = (c = this._config) == null ? void 0 : c.lines) == null ? void 0 : h.find((g) => g.id === i), u = Number(a.dataset.pointIndex);
          (p = s == null ? void 0 : s.points) != null && p[u] && (this._lineDrag = { id: i, index: u, handle: a, group: n, points: s.points.map((g) => ({ ...g })) }, a.setPointerCapture(r.pointerId), r.preventDefault(), r.stopPropagation());
        }), a.addEventListener("pointermove", (r) => this.dragLinePoint(t, r)), a.addEventListener("pointerup", () => {
          const r = this._lineDrag;
          if (!r || r.handle !== a) return;
          this._lineDrag = void 0;
          const s = r.points[r.index];
          window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-moved", { detail: { id: r.id, index: r.index, x: s.x, y: s.y } }));
        });
      }), n.addEventListener("dblclick", (a) => {
        var u, c;
        const r = (c = (u = this._config) == null ? void 0 : u.lines) == null ? void 0 : c.find((h) => h.id === i);
        if (!(r != null && r.points) || r.points.length < 2) return;
        const s = this.snapPoint(this.svgPoint(t, a));
        window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-added", { detail: { id: i, index: Y(r.points, s), x: s.x, y: s.y } })), a.preventDefault();
      });
    });
  }
  dragLinePoint(t, e) {
    const o = this._lineDrag;
    if (!o) return;
    const n = this.snapPoint(this.svgPoint(t, e));
    o.points[o.index] = n, o.handle.setAttribute("cx", String(o.points[o.index].x)), o.handle.setAttribute("cy", String(o.points[o.index].y));
    const i = E(o.points);
    o.group.querySelectorAll("[data-flow-path]").forEach((a) => a.setAttribute("d", i));
  }
  publishNodePosition(t, e, o) {
    window.dispatchEvent(new CustomEvent("energy-flow-builder-node-moved", {
      detail: { id: t, x: Math.round(e), y: Math.round(o) }
    }));
  }
  snapPoint(t) {
    var i;
    const e = (i = this._config) == null ? void 0 : i.background, o = Math.max(1, (e == null ? void 0 : e.gridSize) ?? 25), n = (e == null ? void 0 : e.snapToGrid) ?? !!(e != null && e.showCoordinates);
    return {
      x: n ? Math.round(t.x / o) * o : Math.round(t.x),
      y: n ? Math.round(t.y / o) * o : Math.round(t.y)
    };
  }
  isEditorPreview() {
    let t = this;
    for (; t; ) {
      if (t instanceof HTMLElement && t.localName === "hui-card-preview") return !0;
      if (t.parentNode) {
        t = t.parentNode;
        continue;
      }
      const e = t.getRootNode();
      t = e instanceof ShadowRoot ? e.host : null;
    }
    return !1;
  }
  svgPoint(t, e) {
    const [o = 0, n = 0, i = 1e3, a = 1e3] = (t.getAttribute("viewBox") ?? j).split(/\s+/).map(Number), r = t.getBoundingClientRect();
    return {
      x: o + (e.clientX - r.left) / r.width * i,
      y: n + (e.clientY - r.top) / r.height * a
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
    return { ...R, ...((t = this._config) == null ? void 0 : t.defaults) ?? {} };
  }
  entityNumber(t) {
    const e = this.entity(t), o = Number(e == null ? void 0 : e.state);
    return Number.isFinite(o) ? o : 0;
  }
  formatEntity(t, e) {
    var a, r;
    if (!t) return "unavailable";
    if (e.stateType === "raw") return t.state;
    const o = Number(t.state);
    if (!Number.isFinite(o)) return t.state;
    const n = e.decimals ?? (Math.abs(o) >= 100 ? 0 : 1), i = e.unit ?? ((r = (a = t.attributes) == null ? void 0 : a.unit_of_measurement) == null ? void 0 : r.toString()) ?? "";
    return `${o.toFixed(n)}${i ? ` ${i}` : ""}`;
  }
}
const W = `
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

  .flow-node.is-editing {
    cursor: grab;
    touch-action: none;
  }

  .flow-node.is-editing:active {
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
function q(l, t) {
  if (l <= 0) return t;
  const e = Math.max(100, Math.min(l, 8e3));
  return Number((6 - (e - 100) / 7900 * 4.4).toFixed(2));
}
function E(l) {
  return l.map((t, e) => `${e ? "L" : "M"}${t.x} ${t.y}`).join(" ");
}
function G(l, t, e, o, n) {
  const i = H(l, e, o ?? "bottom"), a = H(t, e, n ?? "bottom");
  if (o === "left" || o === "right" || n === "left" || n === "right") {
    const u = Math.round((i.x + a.x) / 2);
    return E([i, { x: u, y: i.y }, { x: u, y: a.y }, a]);
  }
  const s = Math.round((i.y + a.y) / 2);
  return E([i, { x: i.x, y: s }, { x: a.x, y: s }, a]);
}
function H(l, t, e) {
  const o = l.labelWidth ?? t.labelWidth, n = l.labelHeight ?? t.labelHeight;
  return e === "top" ? { x: l.x + o / 2, y: l.y } : e === "bottom" ? { x: l.x + o / 2, y: l.y + n } : e === "left" ? { x: l.x, y: l.y + n / 2 } : { x: l.x + o, y: l.y + n / 2 };
}
function Y(l, t) {
  let e = 0, o = Number.POSITIVE_INFINITY;
  for (let n = 0; n < l.length - 1; n += 1) {
    const i = l[n], a = l[n + 1], r = (a.x - i.x) ** 2 + (a.y - i.y) ** 2 || 1, s = Math.max(0, Math.min(1, ((t.x - i.x) * (a.x - i.x) + (t.y - i.y) * (a.y - i.y)) / r)), u = i.x + s * (a.x - i.x), c = i.y + s * (a.y - i.y), h = (t.x - u) ** 2 + (t.y - c) ** 2;
    h < o && (o = h, e = n);
  }
  return e + 1;
}
function K(l) {
  return `efb-${l.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function L(l) {
  return l.replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[t] ?? t);
}
function f(l) {
  return L(l);
}
function P(l) {
  return L(l);
}
customElements.define($, V);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: $,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
