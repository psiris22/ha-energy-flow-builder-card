import type { EnergyFlowBuilderCardConfig, EnergyFlowLineConfig, EnergyFlowNodeConfig, HomeAssistant } from "./types";

const EDITOR_TAG = "energy-flow-builder-card-editor";

class EnergyFlowBuilderCardEditor extends HTMLElement {
  private _config?: EnergyFlowBuilderCardConfig;
  private _hass?: HomeAssistant;
  private _entitySignature = "";
  private _openSections = new Map<string, boolean>();
  private _history: EnergyFlowBuilderCardConfig[] = [];
  private _future: EnergyFlowBuilderCardConfig[] = [];
  private readonly _root = this.attachShadow({ mode: "open" });
  private readonly _onNodeMoved = (event: Event) => {
    const detail = (event as CustomEvent<{ id?: string; x?: number; y?: number }>).detail;
    if (!detail?.id || !Number.isFinite(detail.x) || !Number.isFinite(detail.y)) return;
    const nodes = { ...(this.config().nodes ?? {}) };
    if (!nodes[detail.id]) return;
    nodes[detail.id] = { ...nodes[detail.id], x: detail.x!, y: detail.y! };
    this.commit({ ...this.config(), nodes });
  };
  private readonly _onLinePointMoved = (event: Event) => {
    const detail = (event as CustomEvent<{ id?: string; index?: number; x?: number; y?: number }>).detail;
    this.updateLinePoint(detail, false);
  };
  private readonly _onLinePointAdded = (event: Event) => {
    const detail = (event as CustomEvent<{ id?: string; index?: number; x?: number; y?: number }>).detail;
    this.updateLinePoint(detail, true);
  };

  connectedCallback(): void {
    window.addEventListener("energy-flow-builder-node-moved", this._onNodeMoved);
    window.addEventListener("energy-flow-builder-line-point-moved", this._onLinePointMoved);
    window.addEventListener("energy-flow-builder-line-point-added", this._onLinePointAdded);
  }

  disconnectedCallback(): void {
    window.removeEventListener("energy-flow-builder-node-moved", this._onNodeMoved);
    window.removeEventListener("energy-flow-builder-line-point-moved", this._onLinePointMoved);
    window.removeEventListener("energy-flow-builder-line-point-added", this._onLinePointAdded);
  }

  setConfig(config: EnergyFlowBuilderCardConfig): void {
    this._config = structuredClone(config);
    this.render();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    // Home Assistant updates entity states frequently. Re-rendering here would
    // replace active inputs and makes the editor impossible to use.
    const signature = Object.keys(hass.states).sort().join("|");
    if (signature !== this._entitySignature) {
      this._entitySignature = signature;
      this.render();
    }
  }

  private render(): void {
    if (!this._config) return;
    const config = this._config;
    const nodes = Object.entries(config.nodes ?? {});
    const lines = config.lines ?? [];
    this._root.innerHTML = `
      <style>${styles}</style>
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
          <label>Überschrift <input data-path="title" value="${attr(config.title ?? "")}" placeholder="Energiefluss"></label>
          <div class="row">
            <label>Hintergrundfarbe <input data-path="background.color" value="${attr(config.background?.color ?? "")}" placeholder="#dbeafe"></label>
            <label>Koordinatenraum <input data-path="background.viewBox" value="${attr(config.background?.viewBox ?? "0 0 1073 1466")}"></label>
          </div>
          <label>Hintergrundbild per Pfad <input data-path="background.image" value="${attr(isDataImage(config.background?.image) ? "" : config.background?.image ?? "")}" placeholder="/local/meine-grafik.png"></label>
          <label>Bild vom Computer auswählen <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-action="select-image"></label>
          <div class="file-note">Das Bild wird direkt in dieser Karten-Konfiguration gespeichert.</div>
          ${isDataImage(config.background?.image) ? '<button class="secondary" type="button" data-action="clear-image">Ausgewähltes Bild entfernen</button>' : ""}
          <label class="check"><input type="checkbox" data-path="background.showCoordinates" ${config.background?.showCoordinates ? "checked" : ""}> Koordinatenraster und X/Y-Werte in der Vorschau zeigen</label>
          <div class="row"><label class="check"><input type="checkbox" data-path="background.snapToGrid" ${config.background?.snapToGrid ?? config.background?.showCoordinates ? "checked" : ""}> Am Raster einrasten</label><label>Rasterabstand <input type="number" min="1" data-path="background.gridSize" value="${config.background?.gridSize ?? 25}"></label></div>
        </div>
        <div class="heading"><h3>Anzeigen</h3><button type="button" data-action="add-node">Anzeige hinzufügen</button></div>
        ${nodes.length ? nodes.map(([id, node]) => this.nodeForm(id, node)).join("") : "<p class=empty>Noch keine Anzeigen angelegt.</p>"}
        <div class="heading"><h3>Linien</h3><button type="button" data-action="add-line">Linie hinzufügen</button></div>
        ${lines.length ? lines.map((line, index) => this.lineForm(line, index)).join("") : "<p class=empty>Linien können später per SVG-Pfad ergänzt werden.</p>"}
        <datalist id="efb-entity-list">${this.entityOptions()}</datalist>
      </section>`;
    this.bind();
  }

  private nodeForm(id: string, node: EnergyFlowNodeConfig): string {
    return `<details class="item" data-section="node:${attr(id)}" ${this.sectionOpen(`node:${id}`, true) ? "open" : ""}>
      <summary>${escapeHtml(node.name ?? id)} <span>${escapeHtml(node.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${attr(id)}" data-key="name" value="${attr(node.name ?? "")}"></label><label>Interne ID <input data-node-id="${attr(id)}" value="${attr(id)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", id, "entity", node.entity)}</label>
        <label>Zweite Entity (optional) ${this.entitySelect("node", id, "secondaryEntity", node.secondaryEntity, true)}</label>
        <div class="row three"><label>X <input type="number" data-node="${attr(id)}" data-key="x" value="${numberValue(node.x)}"></label><label>Y <input type="number" data-node="${attr(id)}" data-key="y" value="${numberValue(node.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${attr(id)}" data-key="decimals" value="${node.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${attr(id)}" data-key="labelWidth" value="${node.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${attr(id)}" data-key="labelHeight" value="${node.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <details class="subitem" data-section="node-style:${attr(id)}" ${this.sectionOpen(`node-style:${id}`) ? "open" : ""}>
          <summary>Darstellung</summary>
          <div class="row"><label>Hintergrund <input data-node-style="${attr(id)}" data-key="background" value="${attr(node.style?.background ?? "")}" placeholder="#182432"></label><label>Rahmen <input data-node-style="${attr(id)}" data-key="border" value="${attr(node.style?.border ?? "")}" placeholder="#16a6d9"></label></div>
          <div class="row"><label>Titelfarbe <input data-node-style="${attr(id)}" data-key="titleColor" value="${attr(node.style?.titleColor ?? "")}" placeholder="Standard"></label><label>Wertfarbe <input data-node-style="${attr(id)}" data-key="valueColor" value="${attr(node.style?.valueColor ?? "")}" placeholder="Standard"></label></div>
          <label>Eckenradius <input type="number" min="0" data-node-style="${attr(id)}" data-key="radius" value="${node.style?.radius ?? ""}" placeholder="16"></label>
        </details>
        <label class="check"><input type="checkbox" data-node="${attr(id)}" data-key="hide" ${node.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-node" data-id="${attr(id)}">Duplizieren</button><button class="danger" type="button" data-action="remove-node" data-id="${attr(id)}">Anzeige entfernen</button></div>
      </div>
    </details>`;
  }

  private lineForm(line: EnergyFlowLineConfig, index: number): string {
    const nodes = Object.entries(this.config().nodes ?? {});
    return `<details class="item" data-section="line:${index}" ${this.sectionOpen(`line:${index}`) ? "open" : ""}>
      <summary>${escapeHtml(line.id || `Linie ${index + 1}`)} <span>${escapeHtml(line.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>ID <input data-line="${index}" data-key="id" value="${attr(line.id)}"></label><label>Breite <input type="number" data-line="${index}" data-key="width" value="${line.width ?? ""}" placeholder="Standard"></label></div>
        <label>Steuernde Entity ${this.lineEntitySelect(index, line.entity)}</label>
        <label class="check"><input type="checkbox" data-line="${index}" data-key="autoRoute" ${line.autoRoute ? "checked" : ""}> Automatisch zwischen zwei Anzeigen verbinden</label>
        <div class="row"><label>Von ${this.nodeSelect(index, "source", line.source, nodes)}</label><label>Nach ${this.nodeSelect(index, "target", line.target, nodes)}</label></div>
        <div class="row"><label>Startseite ${this.portSelect(index, "sourcePort", line.sourcePort)}</label><label>Zielseite ${this.portSelect(index, "targetPort", line.targetPort)}</label></div>
        ${line.autoRoute ? `<div class="file-note">Die Verbindung folgt den Boxen automatisch. Für einen eigenen Verlauf die automatische Verbindung ausschalten und Punkte bearbeiten.</div>` : `<label>SVG-Pfad <input data-line="${index}" data-key="path" value="${attr(line.path ?? "")}" placeholder="M600 500 V1100"></label>`}
        ${line.points?.length ? `<div class="file-note">${line.points.length} bearbeitbare Punkte: Punkte ziehen, Doppelklick auf die Linie für einen weiteren Punkt.</div>` : `<button class="secondary" type="button" data-action="make-points" data-index="${index}">Pfad mit Maus bearbeiten</button>`}
        <div class="row"><label>Farbe <input data-line="${index}" data-key="color" value="${attr(line.color ?? "")}" placeholder="#16a6d9"></label><label>Strichmuster <input data-line="${index}" data-key="dashPattern" value="${attr(line.dashPattern ?? "")}" placeholder="26 190"></label></div>
        <div class="row"><label>Schwelle <input type="number" data-line="${index}" data-key="activeAbove" value="${line.activeAbove ?? ""}" placeholder="Standard"></label><label>Animierte Punkte <input type="number" min="0" max="4" data-line="${index}" data-key="pulseCount" value="${line.pulseCount ?? ""}" placeholder="2"></label></div>
        <label class="check"><input type="checkbox" data-line="${index}" data-key="invert" ${line.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
        <div class="actions"><button class="secondary" type="button" data-action="duplicate-line" data-index="${index}">Duplizieren</button><button class="danger" type="button" data-action="remove-line" data-index="${index}">Linie entfernen</button></div>
      </div>
    </details>`;
  }

  private entitySelect(kind: "node" | "line", id: string, key: string, current?: string, optional = false): string {
    const data = kind === "node" ? `data-node="${attr(id)}"` : `data-line="${attr(id)}"`;
    return `<input class="entity-search" type="search" list="efb-entity-list" ${data} data-key="${key}" value="${attr(current ?? "")}" placeholder="${optional ? "Keine zweite Entity" : "Entität suchen..."}" autocomplete="off">`;
  }

  private lineEntitySelect(index: number, current?: string): string {
    const entityIds = this.nodeEntityIds();
    const available = current && !entityIds.includes(current) ? [current, ...entityIds] : entityIds;
    return `<select data-line="${index}" data-key="entity"><option value="">Keine Entity</option>${available.map((entityId) => `<option value="${attr(entityId)}" ${entityId === current ? "selected" : ""}>${escapeHtml(this.entityLabel(entityId))} (${escapeHtml(entityId)})</option>`).join("")}</select>`;
  }

  private nodeSelect(index: number, key: string, current: string | undefined, nodes: Array<[string, EnergyFlowNodeConfig]>): string {
    return `<select data-line="${index}" data-key="${key}"><option value="">Nicht gewählt</option>${nodes.map(([id, node]) => `<option value="${attr(id)}" ${id === current ? "selected" : ""}>${escapeHtml(node.name ?? id)} (${escapeHtml(id)})</option>`).join("")}</select>`;
  }

  private portSelect(index: number, key: string, current: string | undefined): string {
    return `<select data-line="${index}" data-key="${key}">${["top", "right", "bottom", "left"].map((port) => `<option value="${port}" ${port === (current ?? (key === "sourcePort" ? "right" : "left")) ? "selected" : ""}>${({ top: "Oben", right: "Rechts", bottom: "Unten", left: "Links" })[port]}</option>`).join("")}</select>`;
  }

  private sectionOpen(id: string, defaultOpen = false): boolean {
    return this._openSections.get(id) ?? defaultOpen;
  }

  private entityOptions(): string {
    return Object.entries(this._hass?.states ?? {})
      .filter(([, state]) => Boolean(state))
      .sort(([a, stateA], [b, stateB]) => (stateA?.attributes?.friendly_name?.toString() ?? a).localeCompare(stateB?.attributes?.friendly_name?.toString() ?? b))
      .map(([entityId, state]) => `<option value="${attr(entityId)}" label="${attr(`${state?.attributes?.friendly_name?.toString() ?? entityId} (${entityId})`)}"></option>`)
      .join("");
  }

  private nodeEntityIds(): string[] {
    const used = new Set<string>();
    Object.values(this.config().nodes ?? {}).forEach((node) => {
      if (node.entity) used.add(node.entity);
      if (node.secondaryEntity) used.add(node.secondaryEntity);
    });
    return [...used].sort((a, b) => this.entityLabel(a).localeCompare(this.entityLabel(b)));
  }

  private entityLabel(entityId: string): string {
    return this._hass?.states[entityId]?.attributes?.friendly_name?.toString() ?? entityId;
  }

  private bind(): void {
    this._root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-path], select[data-path]").forEach((input) => input.addEventListener("change", () => this.updatePath(input.dataset.path!, input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value)));
    this._root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-node][data-key]").forEach((input) => input.addEventListener("change", () => this.updateNode(input.dataset.node!, input.dataset.key!, input)));
    this._root.querySelectorAll<HTMLInputElement>("[data-node-style][data-key]").forEach((input) => input.addEventListener("change", () => this.updateNodeStyle(input.dataset.nodeStyle!, input.dataset.key!, input)));
    this._root.querySelectorAll<HTMLInputElement>("input[data-node-id]").forEach((input) => input.addEventListener("change", () => this.renameNode(input.dataset.nodeId!, input.value)));
    this._root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-line][data-key]").forEach((input) => input.addEventListener("change", () => this.updateLine(Number(input.dataset.line), input.dataset.key!, input)));
    this._root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((button) => button.addEventListener("click", () => this.action(button)));
    this._root.querySelectorAll<HTMLInputElement>('input[data-action="select-image"]').forEach((input) => input.addEventListener("change", () => this.selectImage(input)));
    this._root.querySelectorAll<HTMLInputElement>('input[data-action="import-file"]').forEach((input) => input.addEventListener("change", () => this.importConfig(input)));
    this._root.querySelectorAll<HTMLDetailsElement>("details[data-section]").forEach((details) => details.addEventListener("toggle", () => {
      const id = details.dataset.section!;
      this._openSections.set(id, details.open);
    }));
  }

  private action(button: HTMLButtonElement): void {
    const config = this.config();
    if (button.dataset.action === "add-node") {
      const nodes = { ...(config.nodes ?? {}) };
      let id = "anzeige";
      let number = 2;
      while (nodes[id]) id = `anzeige_${number++}`;
      nodes[id] = { x: 100, y: 100, name: "Neue Anzeige" };
      this.commit({ ...config, nodes });
    }
    if (button.dataset.action === "remove-node" && button.dataset.id) {
      const nodes = { ...(config.nodes ?? {}) };
      delete nodes[button.dataset.id];
      this.commit({ ...config, nodes });
    }
    if (button.dataset.action === "duplicate-node" && button.dataset.id) {
      const nodes = { ...(config.nodes ?? {}) };
      const source = nodes[button.dataset.id];
      if (!source) return;
      let id = `${button.dataset.id}_kopie`;
      let number = 2;
      while (nodes[id]) id = `${button.dataset.id}_kopie_${number++}`;
      nodes[id] = { ...structuredClone(source), x: source.x + 25, y: source.y + 25, name: `${source.name ?? button.dataset.id} Kopie` };
      this.commit({ ...config, nodes });
    }
    if (button.dataset.action === "add-line") this.commit({ ...config, lines: [...(config.lines ?? []), { id: `linie_${(config.lines?.length ?? 0) + 1}`, autoRoute: true, sourcePort: "right", targetPort: "left" }] });
    if (button.dataset.action === "remove-line") this.commit({ ...config, lines: (config.lines ?? []).filter((_, index) => index !== Number(button.dataset.index)) });
    if (button.dataset.action === "duplicate-line") {
      const lines = [...(config.lines ?? [])];
      const original = lines[Number(button.dataset.index)];
      if (!original) return;
      let id = `${original.id}_kopie`;
      let number = 2;
      while (lines.some((line) => line.id === id)) id = `${original.id}_kopie_${number++}`;
      lines.splice(Number(button.dataset.index) + 1, 0, { ...structuredClone(original), id });
      this.commit({ ...config, lines });
    }
    if (button.dataset.action === "make-points") {
      const lines = [...(config.lines ?? [])];
      const index = Number(button.dataset.index);
      const points = parsePathPoints(lines[index].path ?? "");
      lines[index] = { ...lines[index], autoRoute: false, points: points.length > 1 ? points : routePoints(lines[index], config.nodes ?? {}) };
      this.commit({ ...config, lines });
    }
    if (button.dataset.action === "clear-image") this.updatePath("background.image", "");
    if (button.dataset.action === "undo") this.undo();
    if (button.dataset.action === "redo") this.redo();
    if (button.dataset.action === "export") this.exportConfig();
    if (button.dataset.action === "import") this._root.querySelector<HTMLInputElement>('input[data-action="import-file"]')?.click();
    if (button.dataset.action === "preset") this.commit(pvPreset());
  }

  private selectImage(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => this.updatePath("background.image", String(reader.result ?? "")));
    reader.readAsDataURL(file);
  }

  private exportConfig(): void {
    const blob = new Blob([JSON.stringify(this.config(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "energy-flow-builder-card.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private importConfig(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const config = JSON.parse(String(reader.result ?? "")) as EnergyFlowBuilderCardConfig;
        if (!config || typeof config !== "object") throw new Error("Invalid configuration");
        this.commit({ ...config, type: "custom:energy-flow-builder-card" });
      } catch {
        window.alert("Die Datei enthält keine gültige Energy Flow Builder Konfiguration.");
      }
    });
    reader.readAsText(file);
  }

  private updatePath(path: string, value: string | boolean): void {
    const config = this.config();
    const [group, key] = path.split(".");
    const existing = group === "background" ? config.background ?? {} : {};
    const normalized = (key === "gridSize" && value !== "") ? Number(value) : value || undefined;
    this.commit({ ...config, [group]: { ...existing, [key]: normalized } });
  }

  private updateNode(id: string, key: string, input: HTMLInputElement | HTMLSelectElement): void {
    const nodes = { ...(this.config().nodes ?? {}) };
    const value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
    nodes[id] = { ...nodes[id], [key]: numericKey(key) && value !== "" ? Number(value) : value || undefined };
    this.commit({ ...this.config(), nodes });
  }

  private updateNodeStyle(id: string, key: string, input: HTMLInputElement): void {
    const nodes = { ...(this.config().nodes ?? {}) };
    const node = nodes[id];
    if (!node) return;
    const value = key === "radius" && input.value !== "" ? Number(input.value) : input.value || undefined;
    nodes[id] = { ...node, style: { ...node.style, [key]: value } };
    this.commit({ ...this.config(), nodes });
  }

  private renameNode(oldId: string, newId: string): void {
    const id = newId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!id || id === oldId || this.config().nodes?.[id]) { this.render(); return; }
    const nodes = { ...(this.config().nodes ?? {}) };
    const node = nodes[oldId];
    delete nodes[oldId];
    nodes[id] = node;
    const lines = (this.config().lines ?? []).map((line) => ({ ...line, source: line.source === oldId ? id : line.source, target: line.target === oldId ? id : line.target }));
    this.commit({ ...this.config(), nodes, lines });
  }

  private updateLine(index: number, key: string, input: HTMLInputElement | HTMLSelectElement): void {
    const config = this.config();
    const lines = [...(config.lines ?? [])];
    const value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
    lines[index] = { ...lines[index], [key]: numericKey(key) && value !== "" ? Number(value) : value || undefined };
    this.commit({ ...config, lines });
  }

  private updateLinePoint(detail: { id?: string; index?: number; x?: number; y?: number }, insert: boolean): void {
    if (!detail.id || detail.index === undefined || !Number.isFinite(detail.x) || !Number.isFinite(detail.y)) return;
    const config = this.config();
    const lines = [...(config.lines ?? [])];
    const lineIndex = lines.findIndex((line) => line.id === detail.id);
    if (lineIndex < 0) return;
    const points = [...(lines[lineIndex].points ?? [])];
    if (insert) points.splice(detail.index, 0, { x: detail.x!, y: detail.y! });
    else points[detail.index] = { x: detail.x!, y: detail.y! };
    lines[lineIndex] = { ...lines[lineIndex], points };
    this.commit({ ...config, lines });
  }

  private undo(): void {
    const previous = this._history.pop();
    if (!previous || !this._config) return;
    this._future.push(structuredClone(this._config));
    this.commit(previous, false);
  }

  private redo(): void {
    const next = this._future.pop();
    if (!next || !this._config) return;
    this._history.push(structuredClone(this._config));
    this.commit(next, false);
  }

  private config(): EnergyFlowBuilderCardConfig { return this._config ?? { type: "custom:energy-flow-builder-card" }; }
  private commit(config: EnergyFlowBuilderCardConfig, recordHistory = true): void {
    if (recordHistory && this._config) {
      this._history.push(structuredClone(this._config));
      if (this._history.length > 30) this._history.shift();
      this._future = [];
    }
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    this.render();
  }
}

function numericKey(key: string): boolean { return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove", "pulseCount"].includes(key); }
function numberValue(value: number | undefined): string { return value === undefined ? "" : String(value); }
function escapeHtml(value: string): string { return value.replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[char] ?? char); }
function attr(value: string): string { return escapeHtml(value); }
function isDataImage(value?: string): boolean { return Boolean(value?.startsWith("data:image/")); }
function parsePathPoints(path: string): Array<{ x: number; y: number }> {
  const tokens = path.match(/[MLHV]|-?(?:\d*\.\d+|\d+)/g) ?? [];
  const points: Array<{ x: number; y: number }> = [];
  let index = 0;
  let command = "";
  while (index < tokens.length) {
    if (/[MLHV]/.test(tokens[index])) command = tokens[index++];
    const previous = points[points.length - 1] ?? { x: 0, y: 0 };
    if ((command === "M" || command === "L") && index + 1 < tokens.length) points.push({ x: Number(tokens[index++]), y: Number(tokens[index++]) });
    else if (command === "H" && index < tokens.length) points.push({ x: Number(tokens[index++]), y: previous.y });
    else if (command === "V" && index < tokens.length) points.push({ x: previous.x, y: Number(tokens[index++]) });
    else break;
  }
  return points;
}

function pvPreset(): EnergyFlowBuilderCardConfig {
  return {
    type: "custom:energy-flow-builder-card",
    title: "Energiefluss",
    background: { color: "#dbeafe", viewBox: "0 0 1073 1466", aspectRatio: "1073 / 1466", showCoordinates: true, snapToGrid: true, gridSize: 25 },
    nodes: {
      solar: { x: 385, y: 330, name: "Solar" },
      house: { x: 760, y: 520, name: "Haus" },
      battery: { x: 385, y: 1124, name: "Batterie" },
      wallbox: { x: 42, y: 1124, name: "Auto / Wallbox" },
      grid: { x: 760, y: 1248, name: "Netz" },
      heating: { x: 760, y: 900, name: "Heizung" }
    },
    lines: [
      { id: "solar_haus", source: "solar", target: "house", sourcePort: "right", targetPort: "left", autoRoute: true },
      { id: "solar_batterie", source: "solar", target: "battery", sourcePort: "bottom", targetPort: "top", autoRoute: true },
      { id: "netz_haus", source: "grid", target: "house", sourcePort: "top", targetPort: "bottom", autoRoute: true }
    ]
  };
}

function routePoints(line: EnergyFlowLineConfig, nodes: Record<string, EnergyFlowNodeConfig>): Array<{ x: number; y: number }> {
  const source = line.source ? nodes[line.source] : undefined;
  const target = line.target ? nodes[line.target] : undefined;
  if (!source || !target) return [{ x: 100, y: 100 }, { x: 300, y: 100 }];
  const point = (node: EnergyFlowNodeConfig, port: string) => {
    const width = node.labelWidth ?? 210;
    const height = node.labelHeight ?? 82;
    if (port === "top") return { x: node.x + width / 2, y: node.y };
    if (port === "bottom") return { x: node.x + width / 2, y: node.y + height };
    if (port === "left") return { x: node.x, y: node.y + height / 2 };
    return { x: node.x + width, y: node.y + height / 2 };
  };
  const start = point(source, line.sourcePort ?? "right");
  const end = point(target, line.targetPort ?? "left");
  const horizontal = [line.sourcePort, line.targetPort].some((port) => port === "left" || port === "right");
  return horizontal
    ? [start, { x: Math.round((start.x + end.x) / 2), y: start.y }, { x: Math.round((start.x + end.x) / 2), y: end.y }, end]
    : [start, { x: start.x, y: Math.round((start.y + end.y) / 2) }, { x: end.x, y: Math.round((start.y + end.y) / 2) }, end];
}

const styles = `
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

customElements.define(EDITOR_TAG, EnergyFlowBuilderCardEditor);
