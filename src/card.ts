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
  private _drag?: { id: string; node: SVGGElement; offsetX: number; offsetY: number; moved: boolean };
  private _lineDrag?: { id: string; index: number; handle: SVGCircleElement; group: SVGGElement; points: Array<{ x: number; y: number }> };

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
            ${lines.map((line) => this.renderLine(line, Boolean(config.background?.showCoordinates))).join("")}
            ${config.background?.showCoordinates ? this.renderCoordinateGrid(viewBox) : ""}
            ${nodes.map(([id, node]) => this.renderNode(id, node, Boolean(config.background?.showCoordinates))).join("")}
          </svg>
        </div>
      </ha-card>
    `;

    this.bindNodeActions();
    this.bindLineActions();
  }

  private stageStyle(config: EnergyFlowBuilderCardConfig): string {
    const background = config.background?.color ? `background:${config.background.color};` : "";
    const aspectRatio = config.background?.aspectRatio ? `aspect-ratio:${config.background.aspectRatio};` : "";
    return `${background}${aspectRatio}`;
  }

  private renderLine(line: EnergyFlowLineConfig, showHandles: boolean): string {
    const defaults = this.defaults();
    const rawValue = line.value ?? this.entityNumber(line.entity);
    const value = line.invert ? -rawValue : rawValue;
    const absValue = Math.abs(value);
    const threshold = line.activeAbove ?? defaults.activeAbove;
    const active = absValue > threshold;
    if (!active && line.hideWhenInactive) return "";

    const path = this.linePath(line, value);
    if (!path) return "";

    const id = safeId(line.id);
    const width = line.width ?? defaults.lineWidth;
    const duration = line.duration ?? speedFromValue(absValue, defaults.duration);
    const color = line.color ?? defaults.lineColor;
    const trackColor = line.trackColor ?? defaults.trackColor;
    const pulseColor = line.pulseColor ?? defaults.pulseColor;
    const dashPattern = line.dashPattern ? `--dash-pattern:${escapeAttr(line.dashPattern)};` : "";
    const pulseCount = Math.max(0, Math.min(4, line.pulseCount ?? 2));
    const direction = value < 0 ? "reverse" : "normal";
    const opacity = active ? "1" : ".38";

    return `
      <g class="flow-line ${active ? "is-active" : "is-idle"}" data-line-id="${escapeAttr(line.id)}" style="--line-width:${width};--duration:${duration}s;--direction:${direction};--flow-opacity:${opacity};--line-color:${escapeAttr(color)};--track-color:${escapeAttr(trackColor)};--pulse-color:${escapeAttr(pulseColor)};${dashPattern}">
        <path id="${id}" data-flow-path class="flow-track" d="${escapeAttr(path)}"></path>
        <path data-flow-path class="flow-main" d="${escapeAttr(path)}"></path>
        ${active ? Array.from({ length: pulseCount }, (_, index) => `<circle class="flow-pulse ${index ? "secondary" : "primary"}" r="${Math.max(index ? 4 : 5, width * (index ? 1 : 1.3))}"><animateMotion dur="${duration}s" begin="${(duration / Math.max(1, pulseCount)) * index}s" repeatCount="indefinite" calcMode="paced"><mpath href="#${id}"></mpath></animateMotion></circle>`).join("") : ""}
        ${showHandles ? (line.points ?? []).map((point, index) => `<circle class="line-handle" data-point-index="${index}" cx="${point.x}" cy="${point.y}" r="13"></circle>`).join("") : ""}
      </g>
    `;
  }

  private linePath(line: EnergyFlowLineConfig, value = 0): string | undefined {
    if (line.points && line.points.length > 1) return pointsToPath(line.points);
    if (line.autoRoute && line.source && line.target) {
      const source = this._config?.nodes?.[line.source];
      const target = this._config?.nodes?.[line.target];
      if (source && target) return autoRoutePath(source, target, this.defaults(), line.sourcePort ?? source.connectionPort, line.targetPort ?? target.connectionPort);
    }
    return value < 0 && line.pathNegative ? line.pathNegative : value >= 0 && line.pathPositive ? line.pathPositive : line.path;
  }

  private renderCoordinateGrid(viewBox: string): string {
    const values = viewBox.trim().split(/\s+/).map(Number);
    const [, , width = 1000, height = 1000] = values;
    const xTicks = [0, .25, .5, .75, 1].map((part) => Math.round(width * part));
    const yTicks = [0, .25, .5, .75, 1].map((part) => Math.round(height * part));
    return `<g class="coordinate-grid">${xTicks.map((x) => `<path d="M${x} 0 V${height}"></path><text x="${x + 10}" y="28">${x}</text>`).join("")}${yTicks.map((y) => `<path d="M0 ${y} H${width}"></path>${y ? `<text x="10" y="${y - 8}">${y}</text>` : ""}`).join("")}</g>`;
  }

  private renderNode(id: string, node: EnergyFlowNodeConfig, showCoordinates: boolean): string {
    const defaults = this.defaults();
    const entity = this.entity(node.entity);
    const primary = this.formatEntity(entity, node);
    const secondary = node.secondaryEntity ? this.formatEntity(this.entity(node.secondaryEntity), { ...node, stateType: "raw" }) : "";
    const name = node.name ?? entity?.attributes?.friendly_name?.toString() ?? id;
    const width = node.labelWidth ?? defaults.labelWidth;
    const height = node.labelHeight ?? defaults.labelHeight;
    const active = Math.abs(this.entityNumber(node.entity)) > (node.activeAbove ?? defaults.activeAbove);
    const nodeStyle = [
      node.style?.background ? `--node-background:${escapeAttr(node.style.background)}` : "",
      node.style?.border ? `--node-border:${escapeAttr(node.style.border)}` : "",
      node.style?.titleColor ? `--node-title:${escapeAttr(node.style.titleColor)}` : "",
      node.style?.valueColor ? `--node-value:${escapeAttr(node.style.valueColor)}` : ""
    ].filter(Boolean).join(";");

    return `
      <g class="flow-node ${active ? "is-active" : "is-idle"}" data-node-id="${escapeAttr(id)}" data-entity="${escapeAttr(node.entity ?? "")}" transform="translate(${node.x} ${node.y})" style="${nodeStyle}">
        <rect class="node-box" width="${width}" height="${height}" rx="${node.style?.radius ?? 16}" ry="${node.style?.radius ?? 16}"></rect>
        <text class="node-title" x="18" y="32">${escapeSvgText(name)}</text>
        <text class="node-value" x="18" y="61">${escapeSvgText(primary)}</text>
        ${secondary ? `<text class="node-secondary" x="${width - 18}" y="32">${escapeSvgText(secondary)}</text>` : ""}
        ${showCoordinates ? `<text class="node-coordinates" x="0" y="${height + 21}">x ${node.x} · y ${node.y}</text>` : ""}
      </g>
    `;
  }

  private bindNodeActions(): void {
    const svg = this._root.querySelector<SVGSVGElement>(".flow-svg");
    if (!svg) return;
    const allowDragging = Boolean(this._config?.background?.showCoordinates);
    const nodes = this._root.querySelectorAll<SVGGElement>(".flow-node[data-node-id]");
    nodes.forEach((node) => {
      const entityId = node.dataset.entity;
      node.addEventListener("pointerdown", (event) => {
        if (!allowDragging) return;
        const point = this.svgPoint(svg, event);
        const configNode = this._config?.nodes?.[node.dataset.nodeId ?? ""];
        if (!configNode) return;
        this._drag = { id: node.dataset.nodeId ?? "", node, offsetX: point.x - configNode.x, offsetY: point.y - configNode.y, moved: false };
        node.setPointerCapture(event.pointerId);
        event.preventDefault();
      });
      node.addEventListener("pointermove", (event) => this.dragNode(svg, event));
      node.addEventListener("pointerup", (event) => {
        const drag = this._drag;
        if (!drag || drag.node !== node) return;
        this._drag = undefined;
        if (drag.moved) {
          const point = this.svgPoint(svg, event);
          const snapped = this.snapPoint({ x: point.x - drag.offsetX, y: point.y - drag.offsetY });
          this.publishNodePosition(drag.id, snapped.x, snapped.y);
        } else if (entityId) {
          this.openMoreInfo(entityId);
        }
      });
      node.addEventListener("click", (event) => {
        if (allowDragging) event.preventDefault();
        else if (entityId) this.openMoreInfo(entityId);
      });
    });
  }

  private dragNode(svg: SVGSVGElement, event: PointerEvent): void {
    const drag = this._drag;
    if (!drag) return;
    const point = this.svgPoint(svg, event);
    const snapped = this.snapPoint({ x: point.x - drag.offsetX, y: point.y - drag.offsetY });
    const x = snapped.x;
    const y = snapped.y;
    drag.moved = true;
    drag.node.setAttribute("transform", `translate(${x} ${y})`);
    const coordinates = drag.node.querySelector<SVGTextElement>(".node-coordinates");
    if (coordinates) coordinates.textContent = `x ${x} · y ${y}`;
  }

  private bindLineActions(): void {
    const svg = this._root.querySelector<SVGSVGElement>(".flow-svg");
    if (!svg || !this._config?.background?.showCoordinates) return;
    this._root.querySelectorAll<SVGGElement>(".flow-line[data-line-id]").forEach((group) => {
      const id = group.dataset.lineId ?? "";
      group.querySelectorAll<SVGCircleElement>(".line-handle").forEach((handle) => {
        handle.addEventListener("pointerdown", (event) => {
          const line = this._config?.lines?.find((candidate) => candidate.id === id);
          const index = Number(handle.dataset.pointIndex);
          if (!line?.points?.[index]) return;
          this._lineDrag = { id, index, handle, group, points: line.points.map((point) => ({ ...point })) };
          handle.setPointerCapture(event.pointerId);
          event.preventDefault();
          event.stopPropagation();
        });
        handle.addEventListener("pointermove", (event) => this.dragLinePoint(svg, event));
        handle.addEventListener("pointerup", () => {
          const drag = this._lineDrag;
          if (!drag || drag.handle !== handle) return;
          this._lineDrag = undefined;
          const point = drag.points[drag.index];
          window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-moved", { detail: { id: drag.id, index: drag.index, x: point.x, y: point.y } }));
        });
      });
      group.addEventListener("dblclick", (event) => {
        const line = this._config?.lines?.find((candidate) => candidate.id === id);
        if (!line?.points || line.points.length < 2) return;
        const point = this.snapPoint(this.svgPoint(svg, event));
        window.dispatchEvent(new CustomEvent("energy-flow-builder-line-point-added", { detail: { id, index: nearestSegment(line.points, point), x: point.x, y: point.y } }));
        event.preventDefault();
      });
    });
  }

  private dragLinePoint(svg: SVGSVGElement, event: PointerEvent): void {
    const drag = this._lineDrag;
    if (!drag) return;
    const point = this.snapPoint(this.svgPoint(svg, event));
    drag.points[drag.index] = point;
    drag.handle.setAttribute("cx", String(drag.points[drag.index].x));
    drag.handle.setAttribute("cy", String(drag.points[drag.index].y));
    const path = pointsToPath(drag.points);
    drag.group.querySelectorAll<SVGPathElement>("[data-flow-path]").forEach((element) => element.setAttribute("d", path));
  }

  private publishNodePosition(id: string, x: number, y: number): void {
    window.dispatchEvent(new CustomEvent("energy-flow-builder-node-moved", {
      detail: { id, x: Math.round(x), y: Math.round(y) }
    }));
  }

  private snapPoint(point: { x: number; y: number }): { x: number; y: number } {
    const background = this._config?.background;
    const grid = Math.max(1, background?.gridSize ?? 25);
    const snap = background?.snapToGrid ?? Boolean(background?.showCoordinates);
    return {
      x: snap ? Math.round(point.x / grid) * grid : Math.round(point.x),
      y: snap ? Math.round(point.y / grid) * grid : Math.round(point.y)
    };
  }

  private svgPoint(svg: SVGSVGElement, event: PointerEvent | MouseEvent): { x: number; y: number } {
    const [originX = 0, originY = 0, width = 1000, height = 1000] = (svg.getAttribute("viewBox") ?? DEFAULT_VIEW_BOX).split(/\s+/).map(Number);
    const bounds = svg.getBoundingClientRect();
    return {
      x: originX + ((event.clientX - bounds.left) / bounds.width) * width,
      y: originY + ((event.clientY - bounds.top) / bounds.height) * height
    };
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

function speedFromValue(value: number, fallback: number): number {
  if (value <= 0) return fallback;
  const clamped = Math.max(100, Math.min(value, 8000));
  return Number((6 - ((clamped - 100) / 7900) * 4.4).toFixed(2));
}

function pointsToPath(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
}

type Port = "top" | "right" | "bottom" | "left" | undefined;

function autoRoutePath(source: EnergyFlowNodeConfig, target: EnergyFlowNodeConfig, defaults: DefaultConfig, sourcePort: Port, targetPort: Port): string {
  const start = nodePort(source, defaults, sourcePort ?? "bottom");
  const end = nodePort(target, defaults, targetPort ?? "bottom");
  const horizontal = sourcePort === "left" || sourcePort === "right" || targetPort === "left" || targetPort === "right";
  if (horizontal) {
    const middle = Math.round((start.x + end.x) / 2);
    return pointsToPath([start, { x: middle, y: start.y }, { x: middle, y: end.y }, end]);
  }
  const middle = Math.round((start.y + end.y) / 2);
  return pointsToPath([start, { x: start.x, y: middle }, { x: end.x, y: middle }, end]);
}

function nodePort(node: EnergyFlowNodeConfig, defaults: DefaultConfig, port: Exclude<Port, undefined>): { x: number; y: number } {
  const width = node.labelWidth ?? defaults.labelWidth;
  const height = node.labelHeight ?? defaults.labelHeight;
  if (port === "top") return { x: node.x + width / 2, y: node.y };
  if (port === "bottom") return { x: node.x + width / 2, y: node.y + height };
  if (port === "left") return { x: node.x, y: node.y + height / 2 };
  return { x: node.x + width, y: node.y + height / 2 };
}

function nearestSegment(points: Array<{ x: number; y: number }>, point: { x: number; y: number }): number {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
    const x = start.x + t * (end.x - start.x);
    const y = start.y + t * (end.y - start.y);
    const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
  }
  return closestIndex + 1;
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
