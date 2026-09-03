export type ComponentType =
  | "CASE"
  | "MOTHERBOARD"
  | "CPU"
  | "GPU"
  | "RAM"
  | "STORAGE"
  | "CPU_COOLER"
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

export interface ProductPrice {
  amount: number;
  currency: "KRW";
  kind: "ESTIMATE" | "LIVE";
  source: string;
  updatedAt: string;
  /** PRODUCT prices a multi-module kit once; INSTANCE prices every installed unit. */
  billingUnit?: "PRODUCT" | "INSTANCE";
}

export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  name: string;
  manufacturer?: string;
  model?: string;
  mpn?: string;
  officialUrl?: string;
  price?: ProductPrice;
  /** Maximum number of separately mounted instances allowed in one build. */
  maxPerBuild?: number;
  dimensions: Dimensions;
  power?: {
    consumption?: number;
    capacity?: number;
  };
  connectors?: ConnectorDefinition[];
  compatibility?: {
    motherboardFormFactor?: "MINI_ITX" | "MICRO_ATX" | "ATX" | "E_ATX";
    cpuSocket?: string;
    memoryType?: string;
    supportedCpuSockets?: string[];
    storageFormFactor?: "M2_2280" | "SATA_2_5" | "HDD_3_5";
  };
  visualAsset?: {
    mode: "GLB" | "PROCEDURAL_FALLBACK";
    assetId?: string;
    url?: string;
    license?: string;
    attributionPath?: string;
    /** Dimensions of the source GLB in its own coordinate units. */
    nativeDimensions?: Dimensions;
  };
}

/** ProductDefinition is the purchasable SKU; placements are its mounted instances. */
export type ProductDefinition = ComponentDefinition;

export type ComponentRegistry = Readonly<Record<string, ComponentDefinition>>;
