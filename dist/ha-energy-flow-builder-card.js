const F = "energy-flow-builder-card-editor";
class O extends HTMLElement {
  constructor() {
    super(...arguments), this._entitySignature = "", this._openSections = /* @__PURE__ */ new Map(), this._history = [], this._future = [], this._root = this.attachShadow({ mode: "open" }), this._onNodeMoved = (e) => {
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
    var o, a, n, r, s, u, c, h, p;
    if (!this._config) return;
    const e = this._config, t = Object.entries(e.nodes ?? {}), i = e.lines ?? [];
    this._root.innerHTML = `
      <style>${G}</style>
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
          <label>Überschrift <input data-path="title" value="${d(e.title ?? "")}" placeholder="Energiefluss"></label>
          <div class="row">
            <label>Hintergrundfarbe <input data-path="background.color" value="${d(((o = e.background) == null ? void 0 : o.color) ?? "")}" placeholder="#dbeafe"></label>
            <label>Koordinatenraum <input data-path="background.viewBox" value="${d(((a = e.background) == null ? void 0 : a.viewBox) ?? "0 0 1073 1466")}"></label>
          </div>
          <label>Hintergrundbild per Pfad <input data-path="background.image" value="${d(j((n = e.background) == null ? void 0 : n.image) ? "" : ((r = e.background) == null ? void 0 : r.image) ?? "")}" placeholder="/local/meine-grafik.png"></label>
          <label>Bild vom Computer auswählen <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-action="select-image"></label>
          <div class="file-note">Das Bild wird direkt in dieser Karten-Konfiguration gespeichert.</div>
          ${j((s = e.background) == null ? void 0 : s.image) ? '<button class="secondary" type="button" data-action="clear-image">Ausgewähltes Bild entfernen</button>' : ""}
          <label class="check"><input type="checkbox" data-path="background.showCoordinates" ${(u = e.background) != null && u.showCoordinates ? "checked" : ""}> Koordinatenraster und X/Y-Werte in der Vorschau zeigen</label>
          <div class="row"><label class="check"><input type="checkbox" data-path="background.snapToGrid" ${((c = e.background) == null ? void 0 : c.snapToGrid) ?? ((h = e.background) == null ? void 0 : h.showCoordinates) ? "checked" : ""}> Am Raster einrasten</label><label>Rasterabstand <input type="number" min="1" data-path="background.gridSize" value="${((p = e.background) == null ? void 0 : p.gridSize) ?? 25}"></label></div>
        </div>
        <div class="heading"><h3>Anzeigen</h3><button type="button" data-action="add-node">Anzeige hinzufügen</button></div>
        ${t.length ? t.map(([y, b]) => this.nodeForm(y, b)).join("") : "<p class=empty>Noch keine Anzeigen angelegt.</p>"}
        <div class="heading"><h3>Linien</h3><button type="button" data-action="add-line">Linie hinzufügen</button></div>
        ${i.length ? i.map((y, b) => this.lineForm(y, b)).join("") : "<p class=empty>Linien können später per SVG-Pfad ergänzt werden.</p>"}
        <datalist id="efb-entity-list">${this.entityOptions()}</datalist>
      </section>`, this.bind();
  }
  nodeForm(e, t) {
    var i, o, a, n, r, s, u, c;
    return `<details class="item" data-section="node:${d(e)}" ${this.sectionOpen(`node:${e}`, !0) ? "open" : ""}>
      <summary>${f(t.name ?? e)} <span>${f(t.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${d(e)}" data-key="name" value="${d(t.name ?? "")}"></label><label>Interne ID <input data-node-id="${d(e)}" value="${d(e)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", e, "entity", t.entity)}</label>
        ${this.entityStateInfo(t.entity)}
        <label>Zweite Entity / Batterie-SoC (optional) ${this.entitySelect("node", e, "secondaryEntity", t.secondaryEntity, !0)}</label>
        ${t.secondaryEntity ? this.entityStateInfo(t.secondaryEntity) : ""}
        <div class="row three"><label>X <input type="number" data-node="${d(e)}" data-key="x" value="${H(t.x)}"></label><label>Y <input type="number" data-node="${d(e)}" data-key="y" value="${H(t.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${d(e)}" data-key="decimals" value="${t.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${d(e)}" data-key="labelWidth" value="${t.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${d(e)}" data-key="labelHeight" value="${t.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <label>Linienanschluss ${this.nodePortSelect(e, t.connectionPort)}</label>
        <details class="subitem" data-section="node-style:${d(e)}" ${this.sectionOpen(`node-style:${e}`) ? "open" : ""}>
          <summary>Darstellung</summary>
          <div class="row"><label>Hintergrund <input data-node-style="${d(e)}" data-key="background" value="${d(((i = t.style) == null ? void 0 : i.background) ?? "")}" placeholder="#182432"></label><label>Rahmen <input data-node-style="${d(e)}" data-key="border" value="${d(((o = t.style) == null ? void 0 : o.border) ?? "")}" placeholder="#16a6d9"></label></div>
          <div class="row"><label>Titelfarbe <input data-node-style="${d(e)}" data-key="titleColor" value="${d(((a = t.style) == null ? void 0 : a.titleColor) ?? "")}" placeholder="Standard"></label><label>Wertfarbe <input data-node-style="${d(e)}" data-key="valueColor" value="${d(((n = t.style) == null ? void 0 : n.valueColor) ?? "")}" placeholder="Standard"></label></div>
          <div class="row three"><label>Titelgröße <input type="number" min="8" max="72" data-node-style="${d(e)}" data-key="titleSize" value="${((r = t.style) == null ? void 0 : r.titleSize) ?? ""}" placeholder="18"></label><label>Wertgröße <input type="number" min="8" max="96" data-node-style="${d(e)}" data-key="valueSize" value="${((s = t.style) == null ? void 0 : s.valueSize) ?? ""}" placeholder="24"></label><label>Zusatzwertgröße <input type="number" min="8" max="72" data-node-style="${d(e)}" data-key="secondarySize" value="${((u = t.style) == null ? void 0 : u.secondarySize) ?? ""}" placeholder="16"></label></div>
          <label>Eckenradius <input type="number" min="0" data-node-style="${d(e)}" data-key="radius" value="${((c = t.style) == null ? void 0 : c.radius) ?? ""}" placeholder="16"></label>
        </details>
        <label class="check"><input type="checkbox" data-node="${d(e)}" data-key="hide" ${t.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-node" data-id="${d(e)}">Duplizieren</button><button class="danger" type="button" data-action="remove-node" data-id="${d(e)}">Anzeige entfernen</button></div>
      </div>
    </details>`;
  }
  lineForm(e, t) {
    var o;
    const i = Object.entries(this.config().nodes ?? {});
    return `<details class="item" data-section="line:${t}" ${this.sectionOpen(`line:${t}`) ? "open" : ""}>
      <summary>${f(e.id || `Linie ${t + 1}`)} <span>${f(e.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <label>ID <input data-line="${t}" data-key="id" value="${d(e.id)}"></label>
        <label>Steuernde Entity ${this.lineEntitySelect(t, e.entity)}</label>
        <label class="check"><input type="checkbox" data-line="${t}" data-key="autoRoute" ${e.autoRoute ? "checked" : ""}> Automatisch zwischen zwei Anzeigen verbinden</label>
        <div class="row"><label>Von ${this.nodeSelect(t, "source", e.source, i)}</label><label>Nach ${this.nodeSelect(t, "target", e.target, i)}</label></div>
        <div class="row"><label>Startanschluss ${this.portSelect(t, "sourcePort", e.sourcePort)}</label><label>Zielanschluss ${this.portSelect(t, "targetPort", e.targetPort)}</label></div>
        ${e.autoRoute ? '<div class="file-note">Die Verbindung folgt den Boxen automatisch. Für einen eigenen Verlauf die automatische Verbindung ausschalten und Punkte bearbeiten.</div>' : `<label>SVG-Pfad <input data-line="${t}" data-key="path" value="${d(e.path ?? "")}" placeholder="M600 500 V1100"></label>`}
        ${(o = e.points) != null && o.length ? `<div class="file-note">${e.points.length} bearbeitbare Punkte: Punkte ziehen, Doppelklick auf die Linie für einen weiteren Punkt.</div>` : `<button class="secondary" type="button" data-action="make-points" data-index="${t}">Pfad mit Maus bearbeiten</button>`}
        <details class="subitem" data-section="line-design:${t}" ${this.sectionOpen(`line-design:${t}`) ? "open" : ""}>
          <summary>Richtung und Design</summary>
          <div class="row"><label>Richtung ${this.lineDirectionSelect(t, e.direction)}</label><label>Linienart ${this.lineStyleSelect(t, e.lineStyle)}</label></div>
          <div class="row"><label>Breite <input type="number" min="1" data-line="${t}" data-key="width" value="${e.width ?? ""}" placeholder="Standard"></label><label>Tempo (Sekunden) <input type="number" min=".2" step=".1" data-line="${t}" data-key="duration" value="${e.duration ?? ""}" placeholder="Automatisch"></label></div>
          <div class="row"><label>Linienfarbe <input data-line="${t}" data-key="color" value="${d(e.color ?? "")}" placeholder="#16a6d9"></label><label>Hintergrundlinie <input data-line="${t}" data-key="trackColor" value="${d(e.trackColor ?? "")}" placeholder="rgba(22, 166, 217, .26)"></label></div>
          <div class="row"><label>Punktfarbe <input data-line="${t}" data-key="pulseColor" value="${d(e.pulseColor ?? "")}" placeholder="#ffffff"></label><label>Animierte Punkte <input type="number" min="0" max="4" data-line="${t}" data-key="pulseCount" value="${e.pulseCount ?? ""}" placeholder="2"></label></div>
          <div class="row"><label>Strichmuster <input data-line="${t}" data-key="dashPattern" value="${d(e.dashPattern ?? "")}" placeholder="Je nach Linienart"></label><label>Deckkraft (0.1 - 1) <input type="number" min=".1" max="1" step=".1" data-line="${t}" data-key="opacity" value="${e.opacity ?? ""}" placeholder="1"></label></div>
          <div class="row"><label>Aktiv ab <input type="number" data-line="${t}" data-key="activeAbove" value="${e.activeAbove ?? ""}" placeholder="Standard"></label><span></span></div>
          <label class="check"><input type="checkbox" data-line="${t}" data-key="animate" ${e.animate !== !1 ? "checked" : ""}> Animation aktivieren</label>
          <label class="check"><input type="checkbox" data-line="${t}" data-key="invert" ${e.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
          <label class="check"><input type="checkbox" data-line="${t}" data-key="hideWhenInactive" ${e.hideWhenInactive ? "checked" : ""}> Bei Inaktivität ausblenden</label>
        </details>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-line" data-index="${t}">Duplizieren</button><button class="danger" type="button" data-action="remove-line" data-index="${t}">Linie entfernen</button></div>
      </div>
    </details>`;
  }
  entitySelect(e, t, i, o, a = !1) {
    return `<input class="entity-search" type="search" list="efb-entity-list" ${e === "node" ? `data-node="${d(t)}"` : `data-line="${d(t)}"`} data-key="${i}" value="${d(o ?? "")}" placeholder="${a ? "Keine zweite Entity" : "Entität suchen..."}" autocomplete="off">`;
  }
  lineEntitySelect(e, t) {
    const i = this.nodeEntityIds(), o = t && !i.includes(t) ? [t, ...i] : i;
    return `<select data-line="${e}" data-key="entity"><option value="">Keine Entity</option>${o.map((a) => `<option value="${d(a)}" ${a === t ? "selected" : ""}>${f(this.entityLabel(a))} (${f(a)})</option>`).join("")}</select>`;
  }
  nodeSelect(e, t, i, o) {
    return `<select data-line="${e}" data-key="${t}"><option value="">Nicht gewählt</option>${o.map(([a, n]) => `<option value="${d(a)}" ${a === i ? "selected" : ""}>${f(n.name ?? a)} (${f(a)})</option>`).join("")}</select>`;
  }
  portSelect(e, t, i) {
    return `<select data-line="${e}" data-key="${t}"><option value="" ${i ? "" : "selected"}>Box-Einstellung</option>${this.portOptions(i)}</select>`;
  }
  lineDirectionSelect(e, t) {
    const i = t ?? "auto";
    return `<select data-line="${e}" data-key="direction"><option value="auto" ${i === "auto" ? "selected" : ""}>Automatisch nach Vorzeichen</option><option value="forward" ${i === "forward" ? "selected" : ""}>Von Start zu Ziel</option><option value="reverse" ${i === "reverse" ? "selected" : ""}>Von Ziel zu Start</option></select>`;
  }
  lineStyleSelect(e, t) {
    const i = t ?? "flow";
    return `<select data-line="${e}" data-key="lineStyle"><option value="flow" ${i === "flow" ? "selected" : ""}>Fließend</option><option value="solid" ${i === "solid" ? "selected" : ""}>Durchgezogen</option><option value="dashed" ${i === "dashed" ? "selected" : ""}>Gestrichelt</option><option value="dotted" ${i === "dotted" ? "selected" : ""}>Gepunktet</option></select>`;
  }
  nodePortSelect(e, t) {
    return `<select data-node="${d(e)}" data-key="connectionPort">${this.portOptions(t ?? "bottom")}</select>`;
  }
  portOptions(e) {
    return ["top", "right", "bottom", "left"].map((t) => `<option value="${t}" ${t === e ? "selected" : ""}>${{ top: "Oben mittig", right: "Rechts mittig", bottom: "Unten mittig", left: "Links mittig" }[t]}</option>`).join("");
  }
  sectionOpen(e, t = !1) {
    return this._openSections.get(e) ?? t;
  }
  entityOptions() {
    var e;
    return Object.entries(((e = this._hass) == null ? void 0 : e.states) ?? {}).filter(([, t]) => !!t).sort(([t, i], [o, a]) => {
      var n, r, s, u;
      return (((r = (n = i == null ? void 0 : i.attributes) == null ? void 0 : n.friendly_name) == null ? void 0 : r.toString()) ?? t).localeCompare(((u = (s = a == null ? void 0 : a.attributes) == null ? void 0 : s.friendly_name) == null ? void 0 : u.toString()) ?? o);
    }).map(([t, i]) => {
      var o, a;
      return `<option value="${d(t)}" label="${d(`${((a = (o = i == null ? void 0 : i.attributes) == null ? void 0 : o.friendly_name) == null ? void 0 : a.toString()) ?? t} (${t})`)}"></option>`;
    }).join("");
  }
  nodeEntityIds() {
    const e = /* @__PURE__ */ new Set();
    return Object.values(this.config().nodes ?? {}).forEach((t) => {
      t.entity && e.add(t.entity), t.secondaryEntity && e.add(t.secondaryEntity);
    }), [...e].sort((t, i) => this.entityLabel(t).localeCompare(this.entityLabel(i)));
  }
  entityLabel(e) {
    var t, i, o, a;
    return ((a = (o = (i = (t = this._hass) == null ? void 0 : t.states[L(e)]) == null ? void 0 : i.attributes) == null ? void 0 : o.friendly_name) == null ? void 0 : a.toString()) ?? e;
  }
  entityStateInfo(e) {
    var a, n, r;
    if (!e) return "";
    const t = (a = this._hass) == null ? void 0 : a.states[L(e)];
    if (!t) return '<div class="entity-status unavailable">Entity wird von Home Assistant aktuell nicht geliefert.</div>';
    const i = ((r = (n = t.attributes) == null ? void 0 : n.unit_of_measurement) == null ? void 0 : r.toString()) ?? "";
    return `<div class="entity-status ${["unknown", "unavailable"].includes(t.state) ? "unavailable" : ""}">Aktueller HA-Status: ${f(t.state)}${i ? ` ${f(i)}` : ""}</div>`;
  }
  bind() {
    this._root.querySelectorAll("input[data-path], select[data-path]").forEach((e) => e.addEventListener("change", () => this.updatePath(e.dataset.path, e instanceof HTMLInputElement && e.type === "checkbox" ? e.checked : e.value))), this._root.querySelectorAll("[data-node][data-key]").forEach((e) => e.addEventListener("change", () => this.updateNode(e.dataset.node, e.dataset.key, e))), this._root.querySelectorAll("[data-node-style][data-key]").forEach((e) => e.addEventListener("change", () => this.updateNodeStyle(e.dataset.nodeStyle, e.dataset.key, e))), this._root.querySelectorAll("input[data-node-id]").forEach((e) => e.addEventListener("change", () => this.renameNode(e.dataset.nodeId, e.value))), this._root.querySelectorAll("[data-line][data-key]").forEach((e) => e.addEventListener("change", () => this.updateLine(Number(e.dataset.line), e.dataset.key, e))), this._root.querySelectorAll("button[data-action]").forEach((e) => e.addEventListener("click", () => this.action(e))), this._root.querySelectorAll('input[data-action="select-image"]').forEach((e) => e.addEventListener("change", () => this.selectImage(e))), this._root.querySelectorAll('input[data-action="import-file"]').forEach((e) => e.addEventListener("change", () => this.importConfig(e))), this._root.querySelectorAll("details[data-section]").forEach((e) => e.addEventListener("toggle", () => {
      const t = e.dataset.section;
      this._openSections.set(t, e.open);
    }));
  }
  action(e) {
    var i, o;
    const t = this.config();
    if (e.dataset.action === "add-node") {
      const a = { ...t.nodes ?? {} };
      let n = "anzeige", r = 2;
      for (; a[n]; ) n = `anzeige_${r++}`;
      a[n] = { x: 100, y: 100, name: "Neue Anzeige" }, this.commit({ ...t, nodes: a });
    }
    if (e.dataset.action === "remove-node" && e.dataset.id) {
      const a = { ...t.nodes ?? {} };
      delete a[e.dataset.id], this.commit({ ...t, nodes: a });
    }
    if (e.dataset.action === "duplicate-node" && e.dataset.id) {
      const a = { ...t.nodes ?? {} }, n = a[e.dataset.id];
      if (!n) return;
      let r = `${e.dataset.id}_kopie`, s = 2;
      for (; a[r]; ) r = `${e.dataset.id}_kopie_${s++}`;
      a[r] = { ...structuredClone(n), x: n.x + 25, y: n.y + 25, name: `${n.name ?? e.dataset.id} Kopie` }, this.commit({ ...t, nodes: a });
    }
    if (e.dataset.action === "add-line" && this.commit({ ...t, lines: [...t.lines ?? [], { id: `linie_${(((i = t.lines) == null ? void 0 : i.length) ?? 0) + 1}`, autoRoute: !0 }] }), e.dataset.action === "remove-line" && this.commit({ ...t, lines: (t.lines ?? []).filter((a, n) => n !== Number(e.dataset.index)) }), e.dataset.action === "duplicate-line") {
      const a = [...t.lines ?? []], n = a[Number(e.dataset.index)];
      if (!n) return;
      let r = `${n.id}_kopie`, s = 2;
      for (; a.some((u) => u.id === r); ) r = `${n.id}_kopie_${s++}`;
      a.splice(Number(e.dataset.index) + 1, 0, { ...structuredClone(n), id: r }), this.commit({ ...t, lines: a });
    }
    if (e.dataset.action === "make-points") {
      const a = [...t.lines ?? []], n = Number(e.dataset.index), r = V(a[n].path ?? "");
      a[n] = { ...a[n], autoRoute: !1, points: r.length > 1 ? r : q(a[n], t.nodes ?? {}) }, this.commit({ ...t, lines: a });
    }
    e.dataset.action === "clear-image" && this.updatePath("background.image", ""), e.dataset.action === "undo" && this.undo(), e.dataset.action === "redo" && this.redo(), e.dataset.action === "export" && this.exportConfig(), e.dataset.action === "import" && ((o = this._root.querySelector('input[data-action="import-file"]')) == null || o.click()), e.dataset.action === "preset" && this.commit(W());
  }
  selectImage(e) {
    var o;
    const t = (o = e.files) == null ? void 0 : o[0];
    if (!t) return;
    const i = new FileReader();
    i.addEventListener("load", () => this.updatePath("background.image", String(i.result ?? ""))), i.readAsDataURL(t);
  }
  exportConfig() {
    const e = new Blob([JSON.stringify(this.config(), null, 2)], { type: "application/json" }), t = URL.createObjectURL(e), i = document.createElement("a");
    i.href = t, i.download = "energy-flow-builder-card.json", i.click(), URL.revokeObjectURL(t);
  }
  importConfig(e) {
    var o;
    const t = (o = e.files) == null ? void 0 : o[0];
    if (!t) return;
    const i = new FileReader();
    i.addEventListener("load", () => {
      try {
        const a = JSON.parse(String(i.result ?? ""));
        if (!a || typeof a != "object") throw new Error("Invalid configuration");
        this.commit({ ...a, type: "custom:energy-flow-builder-card" });
      } catch {
        window.alert("Die Datei enthält keine gültige Energy Flow Builder Konfiguration.");
      }
    }), i.readAsText(t);
  }
  updatePath(e, t) {
    const i = this.config(), [o, a] = e.split("."), n = o === "background" ? i.background ?? {} : {}, r = a === "gridSize" && t !== "" ? Number(t) : t || void 0;
    this.commit({ ...i, [o]: { ...n, [a]: r } });
  }
  updateNode(e, t, i) {
    const o = { ...this.config().nodes ?? {} }, a = i instanceof HTMLInputElement && i.type === "checkbox" ? i.checked : i.value, n = (t === "entity" || t === "secondaryEntity") && typeof a == "string" ? L(a) : a;
    o[e] = { ...o[e], [t]: I(t) && n !== "" ? Number(n) : n || void 0 }, this.commit({ ...this.config(), nodes: o });
  }
  updateNodeStyle(e, t, i) {
    const o = { ...this.config().nodes ?? {} }, a = o[e];
    if (!a) return;
    const r = ["radius", "titleSize", "valueSize", "secondarySize"].includes(t) && i.value !== "" ? Number(i.value) : i.value || void 0;
    o[e] = { ...a, style: { ...a.style, [t]: r } }, this.commit({ ...this.config(), nodes: o });
  }
  renameNode(e, t) {
    var r;
    const i = t.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!i || i === e || (r = this.config().nodes) != null && r[i]) {
      this.render();
      return;
    }
    const o = { ...this.config().nodes ?? {} }, a = o[e];
    delete o[e], o[i] = a;
    const n = (this.config().lines ?? []).map((s) => ({ ...s, source: s.source === e ? i : s.source, target: s.target === e ? i : s.target }));
    this.commit({ ...this.config(), nodes: o, lines: n });
  }
  updateLine(e, t, i) {
    const o = this.config(), a = [...o.lines ?? []], n = i instanceof HTMLInputElement && i.type === "checkbox" ? i.checked : i.value;
    a[e] = { ...a[e], [t]: I(t) && n !== "" ? Number(n) : n || void 0 }, this.commit({ ...o, lines: a });
  }
  updateLinePoint(e, t) {
    if (!e.id || e.index === void 0 || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
    const i = this.config(), o = [...i.lines ?? []], a = o.findIndex((r) => r.id === e.id);
    if (a < 0) return;
    const n = [...o[a].points ?? []];
    t ? n.splice(e.index, 0, { x: e.x, y: e.y }) : n[e.index] = { x: e.x, y: e.y }, o[a] = { ...o[a], points: n }, this.commit({ ...i, lines: o });
  }
  undo() {
    const e = this._history.pop();
    !e || !this._config || (this._future.push(structuredClone(this._config)), this.commit(e, !1));
  }
  redo() {
    const e = this._future.pop();
    !e || !this._config || (this._history.push(structuredClone(this._config)), this.commit(e, !1));
  }
  config() {
    return this._config ?? { type: "custom:energy-flow-builder-card" };
  }
  commit(e, t = !0) {
    t && this._config && (this._history.push(structuredClone(this._config)), this._history.length > 30 && this._history.shift(), this._future = []), this._config = e, this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e }, bubbles: !0, composed: !0 })), this.render();
  }
}
function I(l) {
  return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove", "pulseCount", "duration", "opacity"].includes(l);
}
function H(l) {
  return l === void 0 ? "" : String(l);
}
function f(l) {
  return l.replace(/[&<>\"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] ?? e);
}
function d(l) {
  return f(l);
}
function L(l) {
  return l.replace(/\u200B/g, "").trim();
}
function j(l) {
  return !!(l != null && l.startsWith("data:image/"));
}
function V(l) {
  const e = l.match(/[MLHV]|-?(?:\d*\.\d+|\d+)/g) ?? [], t = [];
  let i = 0, o = "";
  for (; i < e.length; ) {
    /[MLHV]/.test(e[i]) && (o = e[i++]);
    const a = t[t.length - 1] ?? { x: 0, y: 0 };
    if ((o === "M" || o === "L") && i + 1 < e.length) t.push({ x: Number(e[i++]), y: Number(e[i++]) });
    else if (o === "H" && i < e.length) t.push({ x: Number(e[i++]), y: a.y });
    else if (o === "V" && i < e.length) t.push({ x: a.x, y: Number(e[i++]) });
    else break;
  }
  return t;
}
function W() {
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
function q(l, e) {
  const t = l.source ? e[l.source] : void 0, i = l.target ? e[l.target] : void 0;
  if (!t || !i) return [{ x: 100, y: 100 }, { x: 300, y: 100 }];
  const o = (c, h) => {
    const p = c.labelWidth ?? 210, y = c.labelHeight ?? 82;
    return h === "top" ? { x: c.x + p / 2, y: c.y } : h === "bottom" ? { x: c.x + p / 2, y: c.y + y } : h === "left" ? { x: c.x, y: c.y + y / 2 } : { x: c.x + p, y: c.y + y / 2 };
  }, a = l.sourcePort ?? t.connectionPort ?? "bottom", n = l.targetPort ?? i.connectionPort ?? "bottom", r = o(t, a), s = o(i, n);
  return [a, n].some((c) => c === "left" || c === "right") ? [r, { x: Math.round((r.x + s.x) / 2), y: r.y }, { x: Math.round((r.x + s.x) / 2), y: s.y }, s] : [r, { x: r.x, y: Math.round((r.y + s.y) / 2) }, { x: s.x, y: Math.round((r.y + s.y) / 2) }, s];
}
const G = `
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
  .entity-status { color:var(--secondary-text-color); font-size:.78rem; margin:-5px 0 8px; }
  .entity-status.unavailable { color:var(--error-color); }
  .file-note { color:var(--secondary-text-color); font-size:.78rem; margin-top:-4px; }
  button { border:0; border-radius:4px; padding:8px 10px; background:var(--primary-color); color:var(--text-primary-color); cursor:pointer; font:inherit; }
  button.secondary { background:transparent; color:var(--primary-color); padding-left:0; }
  button.danger { background:transparent; color:var(--error-color); padding-left:0; }
  .actions { display:flex; gap:18px; align-items:center; }
  @media (max-width: 420px) { .row, .three { grid-template-columns:1fr; gap:0; } }
`;
customElements.define(F, O);
const k = "energy-flow-builder-card", B = "0 0 1000 1000", R = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};
class Y extends HTMLElement {
  constructor() {
    super(...arguments), this._editMode = !1, this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(e) {
    if (!e || e.type !== `custom:${k}`)
      throw new Error(`Expected type custom:${k}`);
    this._config = {
      ...e,
      defaults: { ...R, ...e.defaults ?? {} }
    }, this.render();
  }
  set hass(e) {
    this._hass = e, this.render();
  }
  set editMode(e) {
    this._editMode = e, this.render();
  }
  getCardSize() {
    return 5;
  }
  static getConfigElement() {
    return document.createElement("energy-flow-builder-card-editor");
  }
  static getStubConfig() {
    return {
      type: `custom:${k}`,
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
    var n, r, s;
    if (!this._config) return;
    const e = this._config, t = ((n = e.background) == null ? void 0 : n.viewBox) ?? B, i = Object.entries(e.nodes ?? {}).filter(([, u]) => !u.hide), o = e.lines ?? [], a = !!((r = e.background) != null && r.showCoordinates && this._editMode);
    this._root.innerHTML = `
      <style>${K}</style>
      <ha-card>
        ${e.title ? `<div class="card-title">${M(e.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(e)}">
          ${(s = e.background) != null && s.image ? `<img class="background" src="${g(e.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${g(t)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${o.map((u) => this.renderLine(u, a)).join("")}
            ${a ? this.renderCoordinateGrid(t) : ""}
            ${i.map(([u, c]) => this.renderNode(u, c, a)).join("")}
          </svg>
        </div>
      </ha-card>
    `, this.bindNodeActions(), this.bindLineActions();
  }
  stageStyle(e) {
    var o, a;
    const t = (o = e.background) != null && o.color ? `background:${e.background.color};` : "", i = (a = e.background) != null && a.aspectRatio ? `aspect-ratio:${e.background.aspectRatio};` : "";
    return `${t}${i}`;
  }
  renderLine(e, t) {
    const i = this.defaults(), o = e.value ?? this.entityNumber(e.entity), a = e.invert ? -o : o, n = Math.abs(a), r = e.activeAbove ?? i.activeAbove, s = n > r;
    if (!s && e.hideWhenInactive) return "";
    const u = this.linePath(e, a);
    if (!u) return "";
    const c = Q(e.id), h = e.width ?? i.lineWidth, p = e.duration ?? U(n, i.duration), y = e.color ?? i.lineColor, b = e.trackColor ?? i.trackColor, C = e.pulseColor ?? i.pulseColor, $ = e.lineStyle ?? "flow", S = e.dashPattern ?? X($), x = Math.max(0, Math.min(4, e.pulseCount ?? 2)), _ = e.direction === "forward" ? "normal" : e.direction === "reverse" || a < 0 ? "reverse" : "normal", E = s ? String(Math.max(0.1, Math.min(1, e.opacity ?? 1))) : ".38", w = s && e.animate !== !1;
    return `
      <g class="flow-line style-${$} ${s ? "is-active" : "is-idle"} ${w ? "is-animated" : "is-static"}" data-line-id="${g(e.id)}" style="--line-width:${h};--duration:${p}s;--direction:${_};--flow-opacity:${E};--line-color:${g(y)};--track-color:${g(b)};--pulse-color:${g(C)};--dash-pattern:${g(S)}">
        <path id="${c}" data-flow-path class="flow-track" d="${g(u)}"></path>
        <path data-flow-path class="flow-main" d="${g(u)}"></path>
        ${w ? Array.from({ length: x }, (v, m) => `<circle class="flow-pulse ${m ? "secondary" : "primary"}" r="${Math.max(m ? 4 : 5, h * (m ? 1 : 1.3))}"><animateMotion dur="${p}s" begin="${p / Math.max(1, x) * m}s" repeatCount="indefinite" calcMode="paced"><mpath href="#${c}"></mpath></animateMotion></circle>`).join("") : ""}
        ${t ? (e.points ?? []).map((v, m) => `<circle class="line-handle" data-point-index="${m}" cx="${v.x}" cy="${v.y}" r="13"></circle>`).join("") : ""}
      </g>
    `;
  }
  linePath(e, t = 0) {
    var i, o, a, n;
    if (e.points && e.points.length > 1) return z(e.points);
    if (e.autoRoute && e.source && e.target) {
      const r = (o = (i = this._config) == null ? void 0 : i.nodes) == null ? void 0 : o[e.source], s = (n = (a = this._config) == null ? void 0 : a.nodes) == null ? void 0 : n[e.target];
      if (r && s) return Z(r, s, this.defaults(), e.sourcePort ?? r.connectionPort, e.targetPort ?? s.connectionPort);
    }
    return t < 0 && e.pathNegative ? e.pathNegative : t >= 0 && e.pathPositive ? e.pathPositive : e.path;
  }
  renderCoordinateGrid(e) {
    const t = e.trim().split(/\s+/).map(Number), [, , i = 1e3, o = 1e3] = t, a = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(i * r)), n = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(o * r));
    return `<g class="coordinate-grid">${a.map((r) => `<path d="M${r} 0 V${o}"></path><text x="${r + 10}" y="28">${r}</text>`).join("")}${n.map((r) => `<path d="M0 ${r} H${i}"></path>${r ? `<text x="10" y="${r - 8}">${r}</text>` : ""}`).join("")}</g>`;
  }
  renderNode(e, t, i) {
    var $, S, x, _, E, w, v, m, N, A, D;
    const o = this.defaults(), a = this.entity(t.entity), n = this.formatEntity(a, t), r = t.secondaryEntity ? this.formatEntity(this.entity(t.secondaryEntity), { ...t, unit: void 0, stateType: "power" }) : "", s = t.name ?? ((S = ($ = a == null ? void 0 : a.attributes) == null ? void 0 : $.friendly_name) == null ? void 0 : S.toString()) ?? e, u = t.labelWidth ?? o.labelWidth, c = t.labelHeight ?? o.labelHeight, h = Math.abs(this.entityNumber(t.entity)) > (t.activeAbove ?? o.activeAbove), p = r ? 26 : 32, y = r ? 54 : 61, b = Math.max(42, c - 10), C = [
      (x = t.style) != null && x.background ? `--node-background:${g(t.style.background)}` : "",
      (_ = t.style) != null && _.border ? `--node-border:${g(t.style.border)}` : "",
      (E = t.style) != null && E.titleColor ? `--node-title:${g(t.style.titleColor)}` : "",
      (w = t.style) != null && w.valueColor ? `--node-value:${g(t.style.valueColor)}` : "",
      (v = t.style) != null && v.titleSize ? `--node-title-size:${t.style.titleSize}px` : "",
      (m = t.style) != null && m.valueSize ? `--node-value-size:${t.style.valueSize}px` : "",
      (N = t.style) != null && N.secondarySize ? `--node-secondary-size:${t.style.secondarySize}px` : ""
    ].filter(Boolean).join(";");
    return `
      <g class="flow-node ${h ? "is-active" : "is-idle"} ${i ? "is-editing" : ""}" data-node-id="${g(e)}" data-entity="${g(t.entity ?? "")}" transform="translate(${t.x} ${t.y})" style="${C}">
        <rect class="node-box" width="${u}" height="${c}" rx="${((A = t.style) == null ? void 0 : A.radius) ?? 16}" ry="${((D = t.style) == null ? void 0 : D.radius) ?? 16}"></rect>
        <text class="node-title" x="18" y="${p}">${P(s)}</text>
        <text class="node-value" x="18" y="${y}">${P(n)}</text>
        ${r ? `<text class="node-secondary" x="${u - 18}" y="${b}">${P(r)}</text>` : ""}
        ${i ? `<text class="node-coordinates" x="0" y="${c + 21}">x ${t.x} · y ${t.y}</text>` : ""}
      </g>
    `;
  }
  bindNodeActions() {
    var o, a;
    const e = this._root.querySelector(".flow-svg");
    if (!e) return;
    const t = !!((a = (o = this._config) == null ? void 0 : o.background) != null && a.showCoordinates && this._editMode);
    this._root.querySelectorAll(".flow-node[data-node-id]").forEach((n) => {
      const r = n.dataset.entity;
      n.addEventListener("pointerdown", (s) => {
        var h, p;
        if (!t) return;
        const u = this.svgPoint(e, s), c = (p = (h = this._config) == null ? void 0 : h.nodes) == null ? void 0 : p[n.dataset.nodeId ?? ""];
        c && (this._drag = { id: n.dataset.nodeId ?? "", node: n, pointerId: s.pointerId, offsetX: u.x - c.x, offsetY: u.y - c.y, moved: !1 }, e.setPointerCapture(s.pointerId), s.preventDefault());
      }), n.addEventListener("click", (s) => {
        t ? s.preventDefault() : r && this.openMoreInfo(r);
      });
    }), e.addEventListener("pointermove", (n) => this.dragNode(e, n)), e.addEventListener("pointerup", (n) => this.finishNodeDrag(e, n)), e.addEventListener("pointercancel", (n) => this.finishNodeDrag(e, n));
  }
  dragNode(e, t) {
    const i = this._drag;
    if (!i || i.pointerId !== t.pointerId) return;
    const o = this.svgPoint(e, t), a = this.snapPoint({ x: o.x - i.offsetX, y: o.y - i.offsetY }), n = a.x, r = a.y;
    i.moved = !0, i.node.setAttribute("transform", `translate(${n} ${r})`);
    const s = i.node.querySelector(".node-coordinates");
    s && (s.textContent = `x ${n} · y ${r}`);
  }
  finishNodeDrag(e, t) {
    const i = this._drag;
    if (!i || i.pointerId !== t.pointerId || (this._drag = void 0, !i.moved)) return;
    const o = this.svgPoint(e, t), a = this.snapPoint({ x: o.x - i.offsetX, y: o.y - i.offsetY });
    this.publishNodePosition(i.id, a.x, a.y);
  }
  bindLineActions() {
    var t, i;
    const e = this._root.querySelector(".flow-svg");
    !e || !((i = (t = this._config) == null ? void 0 : t.background) != null && i.showCoordinates) || !this._editMode || this._root.querySelectorAll(".flow-line[data-line-id]").forEach((o) => {
      const a = o.dataset.lineId ?? "";
      o.querySelectorAll(".line-handle").forEach((n) => {
        n.addEventListener("pointerdown", (r) => {
          var c, h, p;
          const s = (h = (c = this._config) == null ? void 0 : c.lines) == null ? void 0 : h.find((y) => y.id === a), u = Number(n.dataset.pointIndex);
          (p = s == null ? void 0 : s.points) != null && p[u] && (this._lineDrag = { id: a, index: u, handle: n, group: o, points: s.points.map((y) => ({ ...y })) }, n.setPointerCapture(r.pointerId), r.preventDefault(), r.stopPropagation());
        }), n.addEventListener("pointermove", (r) => this.dragLinePoint(e, r)), n.addEventListener("pointerup", () => {
          const r = this._lineDrag;
          if (!r || r.handle !== n) return;
          this._lineDrag = void 0;
          const s = r.points[r.index];
          window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-moved", { detail: { id: r.id, index: r.index, x: s.x, y: s.y } }));
        });
      }), o.addEventListener("dblclick", (n) => {
        var u, c;
        const r = (c = (u = this._config) == null ? void 0 : u.lines) == null ? void 0 : c.find((h) => h.id === a);
        if (!(r != null && r.points) || r.points.length < 2) return;
        const s = this.snapPoint(this.svgPoint(e, n));
        window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-added", { detail: { id: a, index: J(r.points, s), x: s.x, y: s.y } })), n.preventDefault();
      });
    });
  }
  dragLinePoint(e, t) {
    const i = this._lineDrag;
    if (!i) return;
    const o = this.snapPoint(this.svgPoint(e, t));
    i.points[i.index] = o, i.handle.setAttribute("cx", String(i.points[i.index].x)), i.handle.setAttribute("cy", String(i.points[i.index].y));
    const a = z(i.points);
    i.group.querySelectorAll("[data-flow-path]").forEach((n) => n.setAttribute("d", a));
  }
  publishNodePosition(e, t, i) {
    window.dispatchEvent(new CustomEvent("energy-flow-builder-node-moved", {
      detail: { id: e, x: Math.round(t), y: Math.round(i) }
    }));
  }
  snapPoint(e) {
    var a;
    const t = (a = this._config) == null ? void 0 : a.background, i = Math.max(1, (t == null ? void 0 : t.gridSize) ?? 25), o = (t == null ? void 0 : t.snapToGrid) ?? !!(t != null && t.showCoordinates);
    return {
      x: o ? Math.round(e.x / i) * i : Math.round(e.x),
      y: o ? Math.round(e.y / i) * i : Math.round(e.y)
    };
  }
  svgPoint(e, t) {
    const [i = 0, o = 0, a = 1e3, n = 1e3] = (e.getAttribute("viewBox") ?? B).split(/\s+/).map(Number), r = e.getBoundingClientRect();
    return {
      x: i + (t.clientX - r.left) / r.width * a,
      y: o + (t.clientY - r.top) / r.height * n
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
    var i;
    const t = e == null ? void 0 : e.replace(/\u200B/g, "").trim();
    return t ? (i = this._hass) == null ? void 0 : i.states[t] : void 0;
  }
  defaults() {
    var e;
    return { ...R, ...((e = this._config) == null ? void 0 : e.defaults) ?? {} };
  }
  entityNumber(e) {
    const t = this.entity(e), i = Number(t == null ? void 0 : t.state);
    return Number.isFinite(i) ? i : 0;
  }
  formatEntity(e, t) {
    var n, r;
    if (!e) return "unavailable";
    if (t.stateType === "raw") return e.state;
    const i = Number(e.state);
    if (!Number.isFinite(i)) return e.state;
    const o = t.decimals ?? (Math.abs(i) >= 100 ? 0 : 1), a = t.unit ?? ((r = (n = e.attributes) == null ? void 0 : n.unit_of_measurement) == null ? void 0 : r.toString()) ?? "";
    return `${i.toFixed(o)}${a ? ` ${a}` : ""}`;
  }
}
const K = `
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

  .flow-line:not(.is-animated) .flow-main {
    animation: none;
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
    font-size: var(--node-title-size, 18px);
    font-weight: 700;
  }

  .node-value {
    fill: var(--node-value, var(--primary-text-color));
    font-size: var(--node-value-size, 24px);
    font-weight: 800;
  }

  .node-secondary {
    fill: var(--secondary-text-color);
    font-size: var(--node-secondary-size, 16px);
    text-anchor: end;
    font-weight: 700;
  }

  @keyframes efb-flow {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -216; }
  }
`;
function U(l, e) {
  if (l <= 0) return e;
  const t = Math.max(100, Math.min(l, 8e3));
  return Number((6 - (t - 100) / 7900 * 4.4).toFixed(2));
}
function z(l) {
  return l.map((e, t) => `${t ? "L" : "M"}${e.x} ${e.y}`).join(" ");
}
function X(l) {
  return l === "solid" ? "none" : l === "dashed" ? "20 14" : l === "dotted" ? "1 14" : "26 190";
}
function Z(l, e, t, i, o) {
  const a = T(l, t, i ?? "bottom"), n = T(e, t, o ?? "bottom");
  if (i === "left" || i === "right" || o === "left" || o === "right") {
    const u = Math.round((a.x + n.x) / 2);
    return z([a, { x: u, y: a.y }, { x: u, y: n.y }, n]);
  }
  const s = Math.round((a.y + n.y) / 2);
  return z([a, { x: a.x, y: s }, { x: n.x, y: s }, n]);
}
function T(l, e, t) {
  const i = l.labelWidth ?? e.labelWidth, o = l.labelHeight ?? e.labelHeight;
  return t === "top" ? { x: l.x + i / 2, y: l.y } : t === "bottom" ? { x: l.x + i / 2, y: l.y + o } : t === "left" ? { x: l.x, y: l.y + o / 2 } : { x: l.x + i, y: l.y + o / 2 };
}
function J(l, e) {
  let t = 0, i = Number.POSITIVE_INFINITY;
  for (let o = 0; o < l.length - 1; o += 1) {
    const a = l[o], n = l[o + 1], r = (n.x - a.x) ** 2 + (n.y - a.y) ** 2 || 1, s = Math.max(0, Math.min(1, ((e.x - a.x) * (n.x - a.x) + (e.y - a.y) * (n.y - a.y)) / r)), u = a.x + s * (n.x - a.x), c = a.y + s * (n.y - a.y), h = (e.x - u) ** 2 + (e.y - c) ** 2;
    h < i && (i = h, t = o);
  }
  return t + 1;
}
function Q(l) {
  return `efb-${l.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function M(l) {
  return l.replace(/[&<>"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] ?? e);
}
function g(l) {
  return M(l);
}
function P(l) {
  return M(l);
}
customElements.define(k, Y);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: k,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
