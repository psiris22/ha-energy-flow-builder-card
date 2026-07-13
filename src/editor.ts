import type { EnergyFlowBuilderCardConfig, EnergyFlowLineConfig, EnergyFlowNodeConfig, HomeAssistant } from "./types";

const EDITOR_TAG = "energy-flow-builder-card-editor";

class EnergyFlowBuilderCardEditor extends HTMLElement {
  private _config?: EnergyFlowBuilderCardConfig;
  private _hass?: HomeAssistant;
  private _entitySignature = "";
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
    return `<details class="item" open>
      <summary>${escapeHtml(node.name ?? id)} <span>${escapeHtml(node.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>Name <input data-node="${attr(id)}" data-key="name" value="${attr(node.name ?? "")}"></label><label>Interne ID <input data-node-id="${attr(id)}" value="${attr(id)}"></label></div>
        <label>Wert-Entity ${this.entitySelect("node", id, "entity", node.entity)}</label>
        <label>Zweite Entity (optional) ${this.entitySelect("node", id, "secondaryEntity", node.secondaryEntity, true)}</label>
        <div class="row three"><label>X <input type="number" data-node="${attr(id)}" data-key="x" value="${numberValue(node.x)}"></label><label>Y <input type="number" data-node="${attr(id)}" data-key="y" value="${numberValue(node.y)}"></label><label>Nachkommastellen <input type="number" min="0" max="4" data-node="${attr(id)}" data-key="decimals" value="${node.decimals ?? ""}" placeholder="auto"></label></div>
        <div class="row"><label>Breite <input type="number" data-node="${attr(id)}" data-key="labelWidth" value="${node.labelWidth ?? ""}" placeholder="Standard"></label><label>Höhe <input type="number" data-node="${attr(id)}" data-key="labelHeight" value="${node.labelHeight ?? ""}" placeholder="Standard"></label></div>
        <label class="check"><input type="checkbox" data-node="${attr(id)}" data-key="hide" ${node.hide ? "checked" : ""}> Anzeige ausblenden</label>
        <button class="danger" type="button" data-action="remove-node" data-id="${attr(id)}">Anzeige entfernen</button>
      </div>
    </details>`;
  }

  private lineForm(line: EnergyFlowLineConfig, index: number): string {
    return `<details class="item">
      <summary>${escapeHtml(line.id || `Linie ${index + 1}`)} <span>${escapeHtml(line.entity ?? "Keine Entity")}</span></summary>
      <div class="content">
        <div class="row"><label>ID <input data-line="${index}" data-key="id" value="${attr(line.id)}"></label><label>Breite <input type="number" data-line="${index}" data-key="width" value="${line.width ?? ""}" placeholder="Standard"></label></div>
        <label>Steuernde Entity ${this.entitySelect("line", String(index), "entity", line.entity)}</label>
        <label>SVG-Pfad <input data-line="${index}" data-key="path" value="${attr(line.path ?? "")}" placeholder="M600 500 V1100"></label>
        ${line.points?.length ? `<div class="file-note">${line.points.length} bearbeitbare Punkte: Punkte ziehen, Doppelklick auf die Linie für einen weiteren Punkt.</div>` : `<button class="secondary" type="button" data-action="make-points" data-index="${index}">Pfad mit Maus bearbeiten</button>`}
        <div class="row"><label>Farbe <input data-line="${index}" data-key="color" value="${attr(line.color ?? "")}" placeholder="#16a6d9"></label><label>Schwelle <input type="number" data-line="${index}" data-key="activeAbove" value="${line.activeAbove ?? ""}" placeholder="Standard"></label></div>
        <label class="check"><input type="checkbox" data-line="${index}" data-key="invert" ${line.invert ? "checked" : ""}> Vorzeichen umdrehen</label>
        <button class="danger" type="button" data-action="remove-line" data-index="${index}">Linie entfernen</button>
      </div>
    </details>`;
  }

  private entitySelect(kind: "node" | "line", id: string, key: string, current?: string, optional = false): string {
    const data = kind === "node" ? `data-node="${attr(id)}"` : `data-line="${attr(id)}"`;
    return `<input class="entity-search" type="search" list="efb-entity-list" ${data} data-key="${key}" value="${attr(current ?? "")}" placeholder="${optional ? "Keine zweite Entity" : "Entität suchen..."}" autocomplete="off">`;
  }

  private entityOptions(): string {
    return Object.entries(this._hass?.states ?? {})
      .filter(([, state]) => Boolean(state))
      .sort(([a, stateA], [b, stateB]) => (stateA?.attributes?.friendly_name?.toString() ?? a).localeCompare(stateB?.attributes?.friendly_name?.toString() ?? b))
      .map(([entityId, state]) => `<option value="${attr(entityId)}" label="${attr(`${state?.attributes?.friendly_name?.toString() ?? entityId} (${entityId})`)}"></option>`)
      .join("");
  }

  private bind(): void {
    this._root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-path], select[data-path]").forEach((input) => input.addEventListener("change", () => this.updatePath(input.dataset.path!, input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value)));
    this._root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-node][data-key]").forEach((input) => input.addEventListener("change", () => this.updateNode(input.dataset.node!, input.dataset.key!, input)));
    this._root.querySelectorAll<HTMLInputElement>("input[data-node-id]").forEach((input) => input.addEventListener("change", () => this.renameNode(input.dataset.nodeId!, input.value)));
    this._root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-line][data-key]").forEach((input) => input.addEventListener("change", () => this.updateLine(Number(input.dataset.line), input.dataset.key!, input)));
    this._root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((button) => button.addEventListener("click", () => this.action(button)));
    this._root.querySelectorAll<HTMLInputElement>('input[data-action="select-image"]').forEach((input) => input.addEventListener("change", () => this.selectImage(input)));
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
    if (button.dataset.action === "add-line") this.commit({ ...config, lines: [...(config.lines ?? []), { id: `linie_${(config.lines?.length ?? 0) + 1}`, path: "M100 100 H300" }] });
    if (button.dataset.action === "remove-line") this.commit({ ...config, lines: (config.lines ?? []).filter((_, index) => index !== Number(button.dataset.index)) });
    if (button.dataset.action === "make-points") {
      const lines = [...(config.lines ?? [])];
      const index = Number(button.dataset.index);
      lines[index] = { ...lines[index], points: parsePathPoints(lines[index].path ?? "") };
      this.commit({ ...config, lines });
    }
    if (button.dataset.action === "clear-image") this.updatePath("background.image", "");
  }

  private selectImage(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => this.updatePath("background.image", String(reader.result ?? "")));
    reader.readAsDataURL(file);
  }

  private updatePath(path: string, value: string | boolean): void {
    const config = this.config();
    const [group, key] = path.split(".");
    const existing = group === "background" ? config.background ?? {} : {};
    this.commit({ ...config, [group]: { ...existing, [key]: value || undefined } });
  }

  private updateNode(id: string, key: string, input: HTMLInputElement | HTMLSelectElement): void {
    const nodes = { ...(this.config().nodes ?? {}) };
    const value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
    nodes[id] = { ...nodes[id], [key]: numericKey(key) && value !== "" ? Number(value) : value || undefined };
    this.commit({ ...this.config(), nodes });
  }

  private renameNode(oldId: string, newId: string): void {
    const id = newId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!id || id === oldId || this.config().nodes?.[id]) { this.render(); return; }
    const nodes = { ...(this.config().nodes ?? {}) };
    const node = nodes[oldId];
    delete nodes[oldId];
    nodes[id] = node;
    this.commit({ ...this.config(), nodes });
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

  private config(): EnergyFlowBuilderCardConfig { return this._config ?? { type: "custom:energy-flow-builder-card" }; }
  private commit(config: EnergyFlowBuilderCardConfig): void {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    this.render();
  }
}

function numericKey(key: string): boolean { return ["x", "y", "decimals", "labelWidth", "labelHeight", "width", "activeAbove"].includes(key); }
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

const styles = `
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
  .entity-search { border-color: color-mix(in srgb, var(--primary-color) 36%, var(--divider-color)); }
  .file-note { color:var(--secondary-text-color); font-size:.78rem; margin-top:-4px; }
  button { border:0; border-radius:4px; padding:8px 10px; background:var(--primary-color); color:var(--text-primary-color); cursor:pointer; font:inherit; }
  button.secondary { background:transparent; color:var(--primary-color); padding-left:0; }
  button.danger { background:transparent; color:var(--error-color); padding-left:0; }
  @media (max-width: 420px) { .row, .three { grid-template-columns:1fr; gap:0; } }
`;

customElements.define(EDITOR_TAG, EnergyFlowBuilderCardEditor);
