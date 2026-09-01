import type { CaseProfile, CaseFanMountMetadata } from "./types";
import type { SceneTransform } from "../../scene/mountTransforms";
import { mountTransforms } from "../../scene/mountTransforms";

const cameraTargetFor = (dimMm: { width: number; height: number; depth: number }): [number, number, number] => {
  return [0, (dimMm.height * 0.02) * 0.5, 0];
};

const envelopeScaleMm = (dimMm: { width: number; height: number; depth: number }): [number, number, number] => {
  return [dimMm.width * 0.02, dimMm.height * 0.02, dimMm.depth * 0.02];
};

export const getRecommendedFanDirection = (mountId: string): "INTAKE" | "EXHAUST" => {
  if (mountId.includes("front") || mountId.includes("bottom") || mountId.includes("side")) {
    return "INTAKE";
  }
  return "EXHAUST";
};

const makeFanMounts = (transforms: Record<string, SceneTransform>, fanIds: string[]): CaseFanMountMetadata[] => {
  return fanIds.map((mountId) => {
    const t = transforms[mountId] ?? { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    const loc: "front" | "top" | "rear" | "bottom" | "side" =
      mountId.includes("front") ? "front"
      : mountId.includes("top") ? "top"
      : mountId.includes("rear") ? "rear"
      : mountId.includes("bottom") ? "bottom"
      : "side";

    return {
      mountId,
      label: mountId.toUpperCase(),
      sizeMm: 120,
      maxRpm: 2000,
      maxCfm: 60,
      location: loc,
      recommendedDirection: getRecommendedFanDirection(mountId),
      transform: t,
    };
  });
};

// --- Profile Definitions ---

// 1. MINI_PC (190 x 200 x 200 mm -> 3.8 x 4.0 x 4.0 units)
const DIM_MINI = { width: 190, height: 200, depth: 200 };
const MINI_FAN_IDS = ["fan-top-1", "fan-rear-1", "fan-front-1"];
const MINI_TRANSFORMS: Record<string, SceneTransform> = {
  "case-root": { position: [0, 2.0, 0], rotation: [0, 0, 0] },
  "motherboard-tray": { position: [-1.0, 2.5, 0], rotation: [0, Math.PI / 2, 0] },
  "cpu-socket-1": { position: [-0.7, 2.7, -0.4], rotation: [0, Math.PI / 2, 0] },
  "dimm-a1": { position: [-0.7, 2.7, 0.4], rotation: [0, Math.PI / 2, 0] },
  "dimm-b1": { position: [-0.7, 2.7, 0.15], rotation: [0, Math.PI / 2, 0] },
  "pcie-slot-1": { position: [-0.2, 1.4, 0], rotation: [0, 0, 0] },
  "psu-bay": { position: [0.7, 0.8, 0], rotation: [0, 0, 0] },
  "radiator-top": { position: [0, 3.85, 0], rotation: [Math.PI / 2, 0, Math.PI / 2] },
  "radiator-front": { position: [0, 2.5, 1.85], rotation: [0, 0, Math.PI / 2] },
  "fan-top-1": { position: [0, 3.85, 0], rotation: [Math.PI / 2, 0, 0] },
  "fan-rear-1": { position: [0, 2.5, -1.85], rotation: [0, 0, 0] },
  "fan-front-1": { position: [0, 2.5, 1.85], rotation: [0, 0, 0] },
};

// 2. SFF (210 x 350 x 340 mm -> 4.2 x 7.0 x 6.8 units)
const DIM_SFF = { width: 210, height: 350, depth: 340 };
const SFF_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-rear-1", "fan-front-1", "fan-front-2"];
const SFF_TRANSFORMS: Record<string, SceneTransform> = {
  "case-root": { position: [0, 3.5, 0], rotation: [0, 0, 0] },
  "motherboard-tray": { position: [-1.1, 4.2, 0], rotation: [0, Math.PI / 2, 0] },
  "cpu-socket-1": { position: [-0.8, 5.0, -0.5], rotation: [0, Math.PI / 2, 0] },
  "dimm-a1": { position: [-0.8, 4.2, 1.3], rotation: [0, Math.PI / 2, 0] },
  "dimm-b1": { position: [-0.8, 4.2, 0.95], rotation: [0, Math.PI / 2, 0] },
  "pcie-slot-1": { position: [-0.3, 2.7, 0], rotation: [0, 0, 0] },
  "psu-bay": { position: [0, 0.9, -1.2], rotation: [0, 0, 0] },
  "fan-top-1": { position: [0, 6.85, 1.3], rotation: [Math.PI / 2, 0, 0] },
  "fan-top-2": { position: [0, 6.85, -1.3], rotation: [Math.PI / 2, 0, 0] },
  "radiator-top": { position: [0, 6.85, 0], rotation: [Math.PI / 2, 0, Math.PI / 2] },
  "fan-front-1": { position: [0, 4.8, 3.25], rotation: [0, 0, 0] },
  "fan-front-2": { position: [0, 2.6, 3.25], rotation: [0, 0, 0] },
  "radiator-front": { position: [0, 3.7, 3.25], rotation: [0, 0, Math.PI / 2] },
  "fan-rear-1": { position: [0, 4.8, -3.25], rotation: [0, 0, 0] },
};

// 3. MFF (235 x 491.7 x 480.9 mm -> 4.7 x 9.834 x 9.618 units)
const DIM_MFF = { width: 235, height: 491.7, depth: 480.9 };
const MFF_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-front-1", "fan-front-2", "fan-rear-1", "fan-bottom-1", "fan-bottom-2"];
const MFF_TRANSFORMS = mountTransforms;

// 4. LFF (270 x 560 x 580 mm -> 5.4 x 11.2 x 11.6 units)
const DIM_LFF = { width: 270, height: 560, depth: 580 };
const LFF_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-front-1", "fan-front-2", "fan-front-3", "fan-rear-1", "fan-bottom-1", "fan-side-1"];
const LFF_TRANSFORMS: Record<string, SceneTransform> = {
  "case-root": { position: [0, 5.6, 0], rotation: [0, 0, 0] },
  "motherboard-tray": { position: [-1.5, 6.3, 0], rotation: [0, Math.PI / 2, 0] },
  "cpu-socket-1": { position: [-1.15, 7.6, -0.7], rotation: [0, Math.PI / 2, 0] },
  "dimm-a1": { position: [-1.15, 6.3, 1.9], rotation: [0, Math.PI / 2, 0] },
  "dimm-b1": { position: [-1.15, 6.3, 1.45], rotation: [0, Math.PI / 2, 0] },
  "pcie-slot-1": { position: [-0.6, 4.0, 0], rotation: [0, 0, 0] },
  "psu-bay": { position: [0, 1.2, -1.8], rotation: [0, 0, 0] },
  "fan-top-1": { position: [0, 11.0, 3.2], rotation: [Math.PI / 2, 0, 0] },
  "fan-top-2": { position: [0, 11.0, 0], rotation: [Math.PI / 2, 0, 0] },
  "fan-top-3": { position: [0, 11.0, -3.2], rotation: [Math.PI / 2, 0, 0] },
  "radiator-top": { position: [0, 11.0, 0], rotation: [Math.PI / 2, 0, Math.PI / 2] },
  "fan-front-1": { position: [0, 8.5, 5.6], rotation: [0, 0, 0] },
  "fan-front-2": { position: [0, 5.8, 5.6], rotation: [0, 0, 0] },
  "fan-front-3": { position: [0, 3.1, 5.6], rotation: [0, 0, 0] },
  "radiator-front": { position: [0, 6.0, 5.6], rotation: [0, 0, Math.PI / 2] },
  "fan-rear-1": { position: [0, 7.6, -5.6], rotation: [0, 0, 0] },
  "fan-bottom-1": { position: [0, 2.55, 1.5], rotation: [Math.PI / 2, 0, 0] },
  "fan-side-1": { position: [2.5, 6.5, 0], rotation: [0, Math.PI / 2, 0] },
};

export const caseProfiles: CaseProfile[] = [
  {
    id: "case-profile-mini-pc",
    componentId: "case-mini-pc-01",
    label: "MINI_PC — Compact Cube (Internal Demo)",
    formFactor: "Mini-ITX (Internal Demo)",
    dimensionsMm: DIM_MINI,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "pcie-slot-1", "radiator-top", "radiator-front", "psu-bay", ...MINI_FAN_IDS],
    mountTransforms: MINI_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 175, maxWidth: 175, maxHeight: 45 },
      "pcie-slot-1": { maxDepth: 180, maxWidth: 155, maxHeight: 45 },
      "psu-bay": { maxDepth: 110, maxWidth: 130, maxHeight: 70 },
      "radiator-top": { maxDepth: 275, maxWidth: 125, maxHeight: 35 },
      "radiator-front": { maxDepth: 275, maxWidth: 125, maxHeight: 35 },
    },
    camera: { target: cameraTargetFor(DIM_MINI), distance: 13, minDistance: 5, maxDistance: 24, fov: 40 },
    fanMounts: makeFanMounts(MINI_TRANSFORMS, MINI_FAN_IDS),
    proceduralFallback: { color: "#334155", envelopeScale: envelopeScaleMm(DIM_MINI) },
  },
  {
    id: "case-profile-sff",
    componentId: "case-sff-01",
    label: "SFF — Mini Tower (Internal Demo)",
    formFactor: "Micro-ATX (Internal Demo)",
    dimensionsMm: DIM_SFF,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "pcie-slot-1", "radiator-top", "radiator-front", "psu-bay", ...SFF_FAN_IDS],
    mountTransforms: SFF_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 250, maxWidth: 250, maxHeight: 55 },
      "pcie-slot-1": { maxDepth: 280, maxWidth: 150, maxHeight: 60 },
      "psu-bay": { maxDepth: 160, maxWidth: 150, maxHeight: 86 },
      "radiator-top": { maxDepth: 280, maxWidth: 130, maxHeight: 35 },
      "radiator-front": { maxDepth: 280, maxWidth: 130, maxHeight: 35 },
    },
    camera: { target: cameraTargetFor(DIM_SFF), distance: 18, minDistance: 7, maxDistance: 28, fov: 38 },
    fanMounts: makeFanMounts(SFF_TRANSFORMS, SFF_FAN_IDS),
    proceduralFallback: { color: "#1e293b", envelopeScale: envelopeScaleMm(DIM_SFF) },
  },
  {
    id: "case-profile-mff",
    componentId: "case-01",
    label: "MFF — Lian Li Lancool 216 (GLB)",
    formFactor: "Mid Tower (Internal Demo)",
    dimensionsMm: DIM_MFF,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...MFF_FAN_IDS],
    mountTransforms: MFF_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 310, maxWidth: 250, maxHeight: 65 },
      "pcie-slot-1": { maxDepth: 392, maxWidth: 160, maxHeight: 75 },
      "psu-bay": { maxDepth: 220, maxWidth: 150, maxHeight: 86 },
      "radiator-front": { maxDepth: 397, maxWidth: 130, maxHeight: 40 },
      "radiator-top": { maxDepth: 397, maxWidth: 130, maxHeight: 40 },
    },
    camera: { target: cameraTargetFor(DIM_MFF), distance: 23.5, minDistance: 9, maxDistance: 34, fov: 38 },
    fanMounts: makeFanMounts(MFF_TRANSFORMS, MFF_FAN_IDS),
    proceduralFallback: { color: "#0f172a", envelopeScale: envelopeScaleMm(DIM_MFF) },
    asset: {
      glbUrl: "/assets/case-lian-li-lancool-216/lod0.glb",
      license: "Original manual reconstruction; official specifications cited",
    },
  },
  {
    id: "case-profile-lff",
    componentId: "case-lff-01",
    label: "LFF — Full Tower (Internal Demo)",
    formFactor: "Full Tower (Internal Demo)",
    dimensionsMm: DIM_LFF,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...LFF_FAN_IDS],
    mountTransforms: LFF_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 340, maxWidth: 290, maxHeight: 75 },
      "pcie-slot-1": { maxDepth: 440, maxWidth: 180, maxHeight: 85 },
      "psu-bay": { maxDepth: 250, maxWidth: 160, maxHeight: 90 },
      "radiator-front": { maxDepth: 480, maxWidth: 150, maxHeight: 60 },
      "radiator-top": { maxDepth: 480, maxWidth: 150, maxHeight: 60 },
    },
    camera: { target: cameraTargetFor(DIM_LFF), distance: 27.5, minDistance: 11, maxDistance: 40, fov: 38 },
    fanMounts: makeFanMounts(LFF_TRANSFORMS, LFF_FAN_IDS),
    proceduralFallback: { color: "#233044", envelopeScale: envelopeScaleMm(DIM_LFF) },
  },
];

export const getCaseProfile = (componentIdOrProfileId: string): CaseProfile | undefined => {
  return caseProfiles.find(
    (p) => p.id === componentIdOrProfileId || p.componentId === componentIdOrProfileId
  );
};