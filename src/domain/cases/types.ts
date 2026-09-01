import type { SceneTransform } from "../../scene/mountTransforms";

export type CaseFormFactor =
  | "Mini-ITX (Internal Demo)"
  | "Micro-ATX (Internal Demo)"
  | "Mid Tower (Internal Demo)"
  | "Full Tower (Internal Demo)"
  | "MINI_PC"
  | "SFF"
  | "MFF"
  | "LFF";

export interface CaseFanMountMetadata {
  mountId: string;
  label: string;
  sizeMm: 120 | 140 | 160;
  maxRpm: number;
  maxCfm: number;
  location: "front" | "top" | "rear" | "bottom" | "side";
  recommendedDirection: "INTAKE" | "EXHAUST";
  transform: SceneTransform;
}

export interface CaseClearanceLimits {
  [mountId: string]: {
    maxWidth?: number;
    maxHeight?: number;
    maxDepth?: number;
  };
}

export interface CaseCameraConfig {
  target: [number, number, number];
  distance: number;
  minDistance: number;
  maxDistance: number;
  fov: number;
}

export interface CaseProceduralFallback {
  color: string;
  envelopeScale: [number, number, number];
}

export interface CaseProfile {
  id: string;
  componentId: string;
  label: string;
  formFactor: string;
  dimensionsMm: { width: number; height: number; depth: number };
  supportedMountIds: string[];
  supportedMotherboardFormFactors: Array<"MINI_ITX" | "MICRO_ATX" | "ATX" | "E_ATX">;
  mountTransforms: Record<string, SceneTransform>;
  clearanceLimits: CaseClearanceLimits;
  camera: CaseCameraConfig;
  fanMounts: CaseFanMountMetadata[];
  proceduralFallback: CaseProceduralFallback;
  asset?: {
    glbUrl: string;
    license: string;
  };
}
