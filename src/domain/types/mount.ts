import type { ComponentType } from "./component";

export type MountType =
  | "MOTHERBOARD"
  | "PCIE"
  | "RADIATOR"
  | "PSU"
  | "FAN";

export interface MountDefinition {
  id: string;
  type: MountType;
  label: string;
  supportedComponentTypes: ComponentType[];
  constraints?: {
    maxDepth?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}
