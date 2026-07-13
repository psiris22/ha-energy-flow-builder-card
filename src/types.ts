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
}

export interface EnergyFlowLineConfig {
  id: string;
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
}
