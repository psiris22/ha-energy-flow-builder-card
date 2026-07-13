export interface HassEntity {
  state: string;
  attributes?: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity | undefined>;
  callService?: (domain: string, service: string, data?: Record<string, unknown>) => void;
}

export interface EnergyFlowBuilderCardConfig {
  type: string;
  title?: string;
  background?: {
    image?: string;
    color?: string;
    viewBox?: string;
    aspectRatio?: string;
    showCoordinates?: boolean;
    snapToGrid?: boolean;
    gridSize?: number;
  };
  defaults?: {
    activeAbove?: number;
    lineWidth?: number;
    lineColor?: string;
    trackColor?: string;
    pulseColor?: string;
    duration?: number;
    labelWidth?: number;
    labelHeight?: number;
  };
  nodes?: Record<string, EnergyFlowNodeConfig>;
  lines?: EnergyFlowLineConfig[];
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: EnergyFlowBuilderCardConfig): void;
}

export interface EnergyFlowNodeConfig {
  x: number;
  y: number;
  name?: string;
  entity?: string;
  secondaryEntity?: string;
  unit?: string;
  decimals?: number;
  icon?: string;
  hide?: boolean;
  activeAbove?: number;
  labelWidth?: number;
  labelHeight?: number;
  stateType?: "power" | "energy" | "percent" | "raw";
  tapAction?: "more-info" | "none";
  /** Default connection side for automatic lines. Defaults to bottom center. */
  connectionPort?: "top" | "right" | "bottom" | "left";
  style?: {
    background?: string;
    border?: string;
    titleColor?: string;
    valueColor?: string;
    titleSize?: number;
    valueSize?: number;
    secondarySize?: number;
    radius?: number;
  };
}

export interface EnergyFlowLineConfig {
  id: string;
  points?: Array<{ x: number; y: number }>;
  path?: string;
  pathPositive?: string;
  pathNegative?: string;
  entity?: string;
  value?: number;
  activeAbove?: number;
  invert?: boolean;
  width?: number;
  color?: string;
  trackColor?: string;
  pulseColor?: string;
  duration?: number;
  hideWhenInactive?: boolean;
  /** Optional endpoints for an automatically routed line between two cards. */
  source?: string;
  target?: string;
  sourcePort?: "top" | "right" | "bottom" | "left";
  targetPort?: "top" | "right" | "bottom" | "left";
  autoRoute?: boolean;
  dashPattern?: string;
  pulseCount?: number;
  /** Direction along the path: automatic follows the entity sign. */
  direction?: "auto" | "forward" | "reverse";
  lineStyle?: "flow" | "solid" | "dashed" | "dotted";
  animate?: boolean;
  opacity?: number;
}
