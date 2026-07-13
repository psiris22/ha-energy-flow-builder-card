import type {
  EnergyFlowBuilderCardConfig,
  EnergyFlowLineConfig,
  EnergyFlowNodeConfig,
  HassEntity,
  HomeAssistant
} from "./types";
import "./editor";

const CARD_TAG = "energy-flow-builder-card";
const DEFAULT_VIEW_BOX = "0 0 1000 1000";
type DefaultConfig = Required<NonNullable<EnergyFlowBuilderCardConfig["defaults"]>>;

const DEFAULT_CONFIG: DefaultConfig = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};

class EnergyFlowBuilderCard extends HTMLElement {
  private _config?: EnergyFlowBuilderCardConfig;
  private _hass?: HomeAssistant;
  private readonly _root = this.attachShadow({ mode: "open" });

  setConfig(config: EnergyFlowBuilderCardConfig): void {
    if (!config || config.type !== `custom:${CARD_TAG}`) {
      throw new Error(`Expected type custom:${CARD_TAG}`);
    }
    this._config = {
      ...config,
      defaults: { ...DEFAULT_CONFIG, ...(config.defaults ?? {}) }
    };
    this.render();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.render();
  }

  getCardSize(): number {
    return 5;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("energy-flow-builder-card-editor");
  }

  static getStubConfig(): EnergyFlowBuilderCardConfig {
    return {
      type: `custom:${CARD_TAG}`,
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

  private render(): void {
    if (!this._config) return;

    const config = this._config;
    const viewBox = config.background?.viewBox ?? DEFAULT_VIEW_BOX;
    const nodes = Object.entries(config.nodes ?? {}).filter(([, node]) => !node.hide);
    const lines = config.lines ?? [];

    this._root.innerHTML = `
      <style>${styles}</style>
      <ha-card>
        ${config.title ? `<div class="card-title">${escapeHtml(config.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(config)}">
          ${config.background?.image ? `<img class="background" src="${escapeAttr(config.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${escapeAttr(viewBox)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${lines.map((line) => this.renderLine(line)).join("")}
            ${nodes.map(([id, node]) => this.renderNode(id, node)).join("")}
          </svg>
        </div>
      </ha-card>
    `;

    this.bindNodeActions();
  }

  private stageStyle(config: EnergyFlowBuilderCardConfig): string {
    const background = config.background?.color ? `background:${config.background.color};` : "";
    const aspectRatio = config.background?.aspectRatio ? `aspect-ratio:${config.background.aspectRatio};` : "";
    return `${background}${aspectRatio}`;
  }

  private renderLine(line: EnergyFlowLineConfig): string {
    const defaults = this.defaults();
    const rawValue = line.value ?? this.entityNumber(line.entity);
    const value = line.invert ? -rawValue : rawValue;
    const absValue = Math.abs(value);
    const threshold = line.activeAbove ?? defaults.activeAbove;
    const active = absValue > threshold;
    if (!active && line.hideWhenInactive) return "";

    const path = value < 0 && line.pathNegative ? line.pathNegative : value >= 0 && line.pathPositive ? line.pathPositive : line.path;
    if (!path) return "";

    const id = safeId(line.id);
    const width = line.width ?? defaults.lineWidth;
    const duration = line.duration ?? speedFromValue(absValue, defaults.duration);
    const color = line.color ?? defaults.lineColor;
    const trackColor = line.trackColor ?? defaults.trackColor;
    const pulseColor = line.pulseColor ?? defaults.pulseColor;
    const direction = value < 0 ? "reverse" : "normal";
    const opacity = active ? "1" : ".38";

    return `
      <g class="flow-line ${active ? "is-active" : "is-idle"}" style="--line-width:${width};--duration:${duration}s;--direction:${direction};--flow-opacity:${opacity};--line-color:${escapeAttr(color)};--track-color:${escapeAttr(trackColor)};--pulse-color:${escapeAttr(pulseColor)}">
        <path id="${id}" class="flow-track" d="${escapeAttr(path)}"></path>
        <path class="flow-main" d="${escapeAttr(path)}"></path>
        ${active ? `
          <circle class="flow-pulse primary" r="${Math.max(5, width * 1.3)}">
            <animateMotion dur="${duration}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${id}"></mpath>
            </animateMotion>
          </circle>
          <circle class="flow-pulse secondary" r="${Math.max(4, width)}">
            <animateMotion dur="${duration}s" begin="${duration / 2}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${id}"></mpath>
            </animateMotion>
          </circle>
        ` : ""}
      </g>
    `;
  }

  private renderNode(id: string, node: EnergyFlowNodeConfig): string {
    const defaults = this.defaults();
    const entity = this.entity(node.entity);
    const primary = this.formatEntity(entity, node);
    const secondary = node.secondaryEntity ? this.formatEntity(this.entity(node.secondaryEntity), { ...node, stateType: "raw" }) : "";
    const name = node.name ?? entity?.attributes?.friendly_name?.toString() ?? id;
    const width = node.labelWidth ?? defaults.labelWidth;
    const height = node.labelHeight ?? defaults.labelHeight;
    const active = Math.abs(this.entityNumber(node.entity)) > (node.activeAbove ?? defaults.activeAbove);

    return `
      <g class="flow-node ${active ? "is-active" : "is-idle"}" data-node-id="${escapeAttr(id)}" data-entity="${escapeAttr(node.entity ?? "")}" transform="translate(${node.x} ${node.y})">
        <rect class="node-box" width="${width}" height="${height}" rx="16" ry="16"></rect>
        <text class="node-title" x="18" y="32">${escapeSvgText(name)}</text>
        <text class="node-value" x="18" y="61">${escapeSvgText(primary)}</text>
        ${secondary ? `<text class="node-secondary" x="${width - 18}" y="32">${escapeSvgText(secondary)}</text>` : ""}
      </g>
    `;
  }

  private bindNodeActions(): void {
    const nodes = this._root.querySelectorAll<SVGGElement>(".flow-node[data-entity]");
    nodes.forEach((node) => {
      const entityId = node.dataset.entity;
      if (!entityId) return;
      node.addEventListener("click", () => this.openMoreInfo(entityId));
    });
  }

  private openMoreInfo(entityId: string): void {
    const event = new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  private entity(entityId?: string): HassEntity | undefined {
    return entityId ? this._hass?.states[entityId] : undefined;
  }

  private defaults(): DefaultConfig {
    return { ...DEFAULT_CONFIG, ...(this._config?.defaults ?? {}) };
  }

  private entityNumber(entityId?: string): number {
    const entity = this.entity(entityId);
    const value = Number(entity?.state);
    return Number.isFinite(value) ? value : 0;
  }

  private formatEntity(entity: HassEntity | undefined, options: EnergyFlowNodeConfig): string {
    if (!entity) return "unavailable";
    if (options.stateType === "raw") return entity.state;

    const value = Number(entity.state);
    if (!Number.isFinite(value)) return entity.state;

    const decimals = options.decimals ?? (Math.abs(value) >= 100 ? 0 : 1);
    const unit = options.unit ?? entity.attributes?.unit_of_measurement?.toString() ?? "";
    return `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
  }
}

const styles = `
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

function speedFromValue(value: number, fallback: number): number {
  if (value <= 0) return fallback;
  const clamped = Math.max(100, Math.min(value, 8000));
  return Number((6 - ((clamped - 100) / 7900) * 4.4).toFixed(2));
}

function safeId(value: string): string {
  return `efb-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function escapeSvgText(value: string): string {
  return escapeHtml(value);
}

customElements.define(CARD_TAG, EnergyFlowBuilderCard);

declare global {
  interface Window {
    customCards?: Array<Record<string, string>>;
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: CARD_TAG,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
