import type { ComponentType } from "./component";

export type MountType =
  | "CASE"
  | "MOTHERBOARD"
  | "CPU"
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
}

export type MountRegistry = Readonly<Record<string, MountDefinition>>;
