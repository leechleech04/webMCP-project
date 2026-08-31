export type ComponentType =
  | "CASE"
  | "MOTHERBOARD"
  | "GPU"
  | "RAM"
  | "RADIATOR"
  | "FAN"
  | "PSU";

export type ConnectorType =
  | "ATX_24PIN"
  | "EPS_8PIN"
  | "PCIE_8PIN"
  | "12V_2X6"
  | "PWM"
  | "ARGB"
  | "USB_2"
  | "USB_3";

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ConnectorDefinition {
  id: string;
  type: ConnectorType;
  direction: "INPUT" | "OUTPUT";
}

export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  name: string;
  dimensions: Dimensions;
  power?: {
    consumption?: number;
    capacity?: number;
  };
  connectors?: ConnectorDefinition[];
}
