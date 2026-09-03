import type { ComponentType } from "./component";

export type MountType =
  | "CASE"
  | "MOTHERBOARD"
  | "CPU"
  | "CPU_COOLER"
  | "RAM"
  | "STORAGE"
  | "PCIE"
  | "RADIATOR"
  | "PSU"
  | "FAN";

export interface MountDefinition {
  id: string;
  type: MountType;
  supportedComponentTypes: ComponentType[];
  constraints?: {
    maxDepth?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  supportedStorageFormFactors?: Array<"M2_2280" | "SATA_2_5" | "HDD_3_5">;
}

export type MountRegistry = Readonly<Record<string, MountDefinition>>;
