const p = "energy-flow-builder-card", $ = "0 0 1000 1000", w = {
  activeAbove: 10,
  lineWidth: 7,
  lineColor: "#16a6d9",
  trackColor: "rgba(22, 166, 217, .26)",
  pulseColor: "#ffffff",
  duration: 4.8,
  labelWidth: 210,
  labelHeight: 82
};
class x extends HTMLElement {
  constructor() {
    super(...arguments), this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(t) {
    if (!t || t.type !== `custom:${p}`)
      throw new Error(`Expected type custom:${p}`);
    this._config = {
      ...t,
      defaults: { ...w, ...t.defaults ?? {} }
    }, this.render();
  }
  set hass(t) {
    this._hass = t, this.render();
  }
  getCardSize() {
    return 5;
  }
  render() {
    var i, n;
    if (!this._config) return;
    const t = this._config, e = ((i = t.background) == null ? void 0 : i.viewBox) ?? $, o = Object.entries(t.nodes ?? {}).filter(([, a]) => !a.hide), r = t.lines ?? [];
    this._root.innerHTML = `
      <style>${k}</style>
      <ha-card>
        ${t.title ? `<div class="card-title">${g(t.title)}</div>` : ""}
        <div class="stage" style="${this.stageStyle(t)}">
          ${(n = t.background) != null && n.image ? `<img class="background" src="${c(t.background.image)}" alt="">` : ""}
          <svg class="flow-svg" viewBox="${c(e)}" preserveAspectRatio="xMidYMid meet" role="img">
            <defs>
              <filter id="efb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="glow"></feGaussianBlur>
                <feMerge><feMergeNode in="glow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            ${r.map((a) => this.renderLine(a)).join("")}
            ${o.map(([a, l]) => this.renderNode(a, l)).join("")}
          </svg>
        </div>
      </ha-card>
    `, this.bindNodeActions();
  }
  stageStyle(t) {
    var r, i;
    const e = (r = t.background) != null && r.color ? `background:${t.background.color};` : "", o = (i = t.background) != null && i.aspectRatio ? `aspect-ratio:${t.background.aspectRatio};` : "";
    return `${e}${o}`;
  }
  renderLine(t) {
    const e = this.defaults(), o = t.value ?? this.entityNumber(t.entity), r = t.invert ? -o : o, i = Math.abs(r), n = t.activeAbove ?? e.activeAbove, a = i > n;
    if (!a && t.hideWhenInactive) return "";
    const l = r < 0 && t.pathNegative ? t.pathNegative : r >= 0 && t.pathPositive ? t.pathPositive : t.path;
    if (!l) return "";
    const u = C(t.id), f = t.width ?? e.lineWidth, d = t.duration ?? M(i, e.duration), h = t.color ?? e.lineColor, v = t.trackColor ?? e.trackColor, b = t.pulseColor ?? e.pulseColor, y = r < 0 ? "reverse" : "normal";
    return `
      <g class="flow-line ${a ? "is-active" : "is-idle"}" style="--line-width:${f};--duration:${d}s;--direction:${y};--flow-opacity:${a ? "1" : ".38"};--line-color:${c(h)};--track-color:${c(v)};--pulse-color:${c(b)}">
        <path id="${u}" class="flow-track" d="${c(l)}"></path>
        <path class="flow-main" d="${c(l)}"></path>
        ${a ? `
          <circle class="flow-pulse primary" r="${Math.max(5, f * 1.3)}">
            <animateMotion dur="${d}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${u}"></mpath>
            </animateMotion>
          </circle>
          <circle class="flow-pulse secondary" r="${Math.max(4, f)}">
            <animateMotion dur="${d}s" begin="${d / 2}s" repeatCount="indefinite" calcMode="paced">
              <mpath href="#${u}"></mpath>
            </animateMotion>
          </circle>
        ` : ""}
      </g>
    `;
  }
  renderNode(t, e) {
    var d, h;
    const o = this.defaults(), r = this.entity(e.entity), i = this.formatEntity(r, e), n = e.secondaryEntity ? this.formatEntity(this.entity(e.secondaryEntity), { ...e, stateType: "raw" }) : "", a = e.name ?? ((h = (d = r == null ? void 0 : r.attributes) == null ? void 0 : d.friendly_name) == null ? void 0 : h.toString()) ?? t, l = e.labelWidth ?? o.labelWidth, u = e.labelHeight ?? o.labelHeight;
    return `
      <g class="flow-node ${Math.abs(this.entityNumber(e.entity)) > (e.activeAbove ?? o.activeAbove) ? "is-active" : "is-idle"}" data-node-id="${c(t)}" data-entity="${c(e.entity ?? "")}" transform="translate(${e.x} ${e.y})">
        <rect class="node-box" width="${l}" height="${u}" rx="16" ry="16"></rect>
        <text class="node-title" x="18" y="32">${m(a)}</text>
        <text class="node-value" x="18" y="61">${m(i)}</text>
        ${n ? `<text class="node-secondary" x="${l - 18}" y="32">${m(n)}</text>` : ""}
      </g>
    `;
  }
  bindNodeActions() {
    this._root.querySelectorAll(".flow-node[data-entity]").forEach((e) => {
      const o = e.dataset.entity;
      o && e.addEventListener("click", () => this.openMoreInfo(o));
    });
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
    return { ...w, ...((t = this._config) == null ? void 0 : t.defaults) ?? {} };
  }
  entityNumber(t) {
    const e = this.entity(t), o = Number(e == null ? void 0 : e.state);
    return Number.isFinite(o) ? o : 0;
  }
  formatEntity(t, e) {
    var n, a;
    if (!t) return "unavailable";
    if (e.stateType === "raw") return t.state;
    const o = Number(t.state);
    if (!Number.isFinite(o)) return t.state;
    const r = e.decimals ?? (Math.abs(o) >= 100 ? 0 : 1), i = e.unit ?? ((a = (n = t.attributes) == null ? void 0 : n.unit_of_measurement) == null ? void 0 : a.toString()) ?? "";
    return `${o.toFixed(r)}${i ? ` ${i}` : ""}`;
  }
}
const k = `
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
function M(s, t) {
  if (s <= 0) return t;
  const e = Math.max(100, Math.min(s, 8e3));
  return Number((6 - (e - 100) / 7900 * 4.4).toFixed(2));
}
function C(s) {
  return `efb-${s.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function g(s) {
  return s.replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[t] ?? t);
}
function c(s) {
  return g(s);
}
function m(s) {
  return g(s);
}
customElements.define(p, x);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: p,
  name: "Energy Flow Builder Card",
  description: "Build a custom animated energy flow diagram from local Home Assistant entities."
});
