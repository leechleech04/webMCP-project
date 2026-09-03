import type { CaseProfile, CaseFanMountMetadata } from "./types";
import type { SceneTransform } from "../../scene/mountTransforms";
import {
  createRadiatorMountTransforms,
  mountTransforms,
} from "../../scene/mountTransforms";

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

const makeFanMounts = (
  transforms: Record<string, SceneTransform>,
  fanIds: string[],
  sizeOverrides: Partial<Record<string, 120 | 140 | 160>> = {},
): CaseFanMountMetadata[] => {
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
      sizeMm: sizeOverrides[mountId] ?? 120,
      maxRpm: 2000,
      maxCfm: 60,
      location: loc,
      recommendedDirection: getRecommendedFanDirection(mountId),
      transform: t,
    };
  });
};

const accessoryTransforms = (
  dimMm: { width: number; height: number; depth: number },
  motherboardX: number,
  storageSurfaceY: number,
): Record<string, SceneTransform> => ({
  "cpu-cooler-1": { position: [-dimMm.width * 0.02 * 0.32, dimMm.height * 0.02 * 0.58, -dimMm.depth * 0.02 * 0.08], rotation: [0, Math.PI / 2, 0] },
  // M.2 boards lie flat against the motherboard instead of standing upright
  // or hovering in front of it. The 0.38-unit offset accounts for the board
  // model and a typical M.2 heatsink on its visible (+X) face.
  "storage-m2-1": { position: [motherboardX + 0.38, dimMm.height * 0.02 * 0.46, dimMm.depth * 0.02 * 0.06], rotation: [0, 0, Math.PI / 2] },
  // 2.5/3.5-inch drives rest on the case's drive tray / PSU-shroud surface.
  "storage-2-5-1": { position: [dimMm.width * 0.02 * 0.22, storageSurfaceY + 0.07, -dimMm.depth * 0.02 * 0.16], rotation: [0, 0, 0] },
  "storage-3-5-1": { position: [dimMm.width * 0.02 * 0.15, storageSurfaceY + 0.261, dimMm.depth * 0.02 * 0.2], rotation: [0, 0, 0] },
});

// --- Profile Definitions ---

// 1. MINI_PC (190 x 200 x 200 mm -> 3.8 x 4.0 x 4.0 units)
const DIM_MINI = { width: 190, height: 200, depth: 200 };
const MINI_FAN_IDS = ["fan-top-1", "fan-rear-1", "fan-front-1"];
const MINI_RADIATOR_TRANSFORMS = createRadiatorMountTransforms(DIM_MINI);
const MINI_TRANSFORMS: Record<string, SceneTransform> = {
  "case-root": { position: [0, 2.0, 0], rotation: [0, 0, 0] },
  "motherboard-tray": { position: [-1.0, 2.5, 0], rotation: [0, Math.PI / 2, 0] },
  "cpu-socket-1": { position: [-0.7, 2.7, -0.4], rotation: [0, Math.PI / 2, 0] },
  "dimm-a1": { position: [-0.7, 2.7, 0.4], rotation: [0, Math.PI / 2, 0] },
  "dimm-b1": { position: [-0.7, 2.7, 0.15], rotation: [0, Math.PI / 2, 0] },
  "pcie-slot-1": { position: [-0.2, 1.4, 0], rotation: [0, 0, 0] },
  "psu-bay": { position: [0.7, 0.8, 0], rotation: [0, 0, 0] },
  ...MINI_RADIATOR_TRANSFORMS,
  "fan-top-1": { position: [0, 3.85, 0], rotation: [Math.PI / 2, 0, 0] },
  "fan-rear-1": { position: [0, 2.5, -1.85], rotation: [0, 0, 0] },
  "fan-front-1": { position: [0, 2.5, 1.85], rotation: [0, 0, 0] },
  ...accessoryTransforms(DIM_MINI, -1.0, 1.5),
};

// 2. SFF (210 x 350 x 340 mm -> 4.2 x 7.0 x 6.8 units)
const DIM_SFF = { width: 210, height: 350, depth: 340 };
const SFF_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-rear-1", "fan-front-1", "fan-front-2"];
const SFF_RADIATOR_TRANSFORMS = createRadiatorMountTransforms(DIM_SFF);
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
  "fan-front-1": { position: [0, 4.8, 3.25], rotation: [0, 0, 0] },
  "fan-front-2": { position: [0, 2.6, 3.25], rotation: [0, 0, 0] },
  ...SFF_RADIATOR_TRANSFORMS,
  "fan-rear-1": { position: [0, 4.8, -3.25], rotation: [0, 0, 0] },
  ...accessoryTransforms(DIM_SFF, -1.1, 1.8),
};

// 3. MFF (235 x 491.7 x 480.9 mm -> 4.7 x 9.834 x 9.618 units)
const DIM_MFF = { width: 235, height: 491.7, depth: 480.9 };
const MFF_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-front-1", "fan-front-2", "fan-rear-1", "fan-bottom-1", "fan-bottom-2"];
const MFF_TRANSFORMS = { ...mountTransforms, ...accessoryTransforms(DIM_MFF, -1.38, 2.2) };

// 4. LFF (270 x 560 x 580 mm -> 5.4 x 11.2 x 11.6 units)
const DIM_LFF = { width: 270, height: 560, depth: 580 };
const LFF_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-front-1", "fan-front-2", "fan-front-3", "fan-rear-1", "fan-bottom-1", "fan-side-1"];
const LFF_RADIATOR_TRANSFORMS = createRadiatorMountTransforms(DIM_LFF);
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
  "fan-front-1": { position: [0, 8.5, 5.6], rotation: [0, 0, 0] },
  "fan-front-2": { position: [0, 5.8, 5.6], rotation: [0, 0, 0] },
  "fan-front-3": { position: [0, 3.1, 5.6], rotation: [0, 0, 0] },
  ...LFF_RADIATOR_TRANSFORMS,
  "fan-rear-1": { position: [0, 7.6, -5.6], rotation: [0, 0, 0] },
  "fan-bottom-1": { position: [0, 2.55, 1.5], rotation: [Math.PI / 2, 0, 0] },
  "fan-side-1": { position: [2.5, 6.5, 0], rotation: [0, Math.PI / 2, 0] },
  ...accessoryTransforms(DIM_LFF, -1.5, 2.4),
};

const DIM_MATX_AIR = { width: 215, height: 400, depth: 390 };
const MATX_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-front-1", "fan-front-2", "fan-rear-1"];
const MATX_TRANSFORMS: Record<string, SceneTransform> = {
  "case-root": { position: [0, 4, 0], rotation: [0, 0, 0] },
  "motherboard-tray": { position: [-1.2, 4.8, -0.3], rotation: [0, Math.PI / 2, 0] },
  "cpu-socket-1": { position: [-0.9, 5.4, -0.6], rotation: [0, Math.PI / 2, 0] },
  "dimm-a1": { position: [-0.9, 4.9, 1.2], rotation: [0, Math.PI / 2, 0] },
  "dimm-b1": { position: [-0.9, 4.9, 0.85], rotation: [0, Math.PI / 2, 0] },
  "pcie-slot-1": { position: [-0.35, 3.1, 0], rotation: [0, 0, 0] },
  "psu-bay": { position: [0, 0.9, -1.2], rotation: [0, 0, 0] },
  ...createRadiatorMountTransforms(DIM_MATX_AIR),
  "fan-top-1": { position: [0, 7.85, 1.4], rotation: [Math.PI / 2, 0, 0] },
  "fan-top-2": { position: [0, 7.85, -1.4], rotation: [Math.PI / 2, 0, 0] },
  "fan-front-1": { position: [0, 5.4, 3.75], rotation: [0, 0, 0] },
  "fan-front-2": { position: [0, 2.8, 3.75], rotation: [0, 0, 0] },
  "fan-rear-1": { position: [0, 5.3, -3.75], rotation: [0, 0, 0] },
  ...accessoryTransforms(DIM_MATX_AIR, -1.2, 0.3),
};

const DIM_DUAL = { width: 285, height: 466, depth: 456 };
const DUAL_FAN_IDS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-side-1", "fan-front-1", "fan-front-2", "fan-rear-1", "fan-bottom-1"];
const DUAL_TRANSFORMS: Record<string, SceneTransform> = {
  ...MFF_TRANSFORMS,
  "case-root": { position: [0, 4.66, 0], rotation: [0, 0, 0] },
  "motherboard-tray": { position: [-1.5, 5.4, -0.2], rotation: [0, Math.PI / 2, 0] },
  "cpu-socket-1": { position: [-1.15, 6.2, -0.7], rotation: [0, Math.PI / 2, 0] },
  "psu-bay": { position: [1.6, 2.0, -2.2], rotation: [0, 0, 0] },
  ...createRadiatorMountTransforms(DIM_DUAL),
  ...accessoryTransforms(DIM_DUAL, -1.5, 3.0),
};

const accessoryMountIds = ["cpu-cooler-1", "storage-2-5-1", "storage-3-5-1"];

export const caseProfiles: CaseProfile[] = [
  {
    id: "case-profile-mini-pc",
    componentId: "case-mini-pc-01",
    label: "MINI_PC — Compact Cube (Internal Demo)",
    formFactor: "Mini-ITX (Internal Demo)",
    dimensionsMm: DIM_MINI,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1", "radiator-top", "radiator-front", "psu-bay", ...accessoryMountIds, ...MINI_FAN_IDS],
    supportedMotherboardFormFactors: ["MINI_ITX"],
    mountTransforms: MINI_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 175, maxWidth: 175, maxHeight: 45 },
      "pcie-slot-1": { maxDepth: 180, maxWidth: 165, maxHeight: 45 },
      "psu-bay": { maxDepth: 110, maxWidth: 130, maxHeight: 70 },
      "radiator-top": { maxDepth: 160, maxWidth: 125, maxHeight: 35 },
      "radiator-front": { maxDepth: 160, maxWidth: 125, maxHeight: 35 },
      "cpu-cooler-1": { maxDepth: 95, maxWidth: 130, maxHeight: 95 },
      "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 },
      "storage-3-5-1": { maxDepth: 0, maxWidth: 0, maxHeight: 0 },
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
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1", "radiator-top", "radiator-front", "psu-bay", ...accessoryMountIds, ...SFF_FAN_IDS],
    supportedMotherboardFormFactors: ["MINI_ITX", "MICRO_ATX"],
    mountTransforms: SFF_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 250, maxWidth: 250, maxHeight: 55 },
      "pcie-slot-1": { maxDepth: 280, maxWidth: 150, maxHeight: 60 },
      "psu-bay": { maxDepth: 160, maxWidth: 150, maxHeight: 86 },
      "radiator-top": { maxDepth: 280, maxWidth: 130, maxHeight: 35 },
      "radiator-front": { maxDepth: 280, maxWidth: 130, maxHeight: 35 },
      "cpu-cooler-1": { maxDepth: 130, maxWidth: 145, maxHeight: 160 },
      "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 },
      "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 },
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
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...accessoryMountIds, ...MFF_FAN_IDS],
    supportedMotherboardFormFactors: ["MINI_ITX", "MICRO_ATX", "ATX"],
    mountTransforms: MFF_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 310, maxWidth: 250, maxHeight: 65 },
      "pcie-slot-1": { maxDepth: 392, maxWidth: 160, maxHeight: 75 },
      "psu-bay": { maxDepth: 220, maxWidth: 150, maxHeight: 86 },
      "radiator-front": { maxDepth: 397, maxWidth: 130, maxHeight: 40 },
      "radiator-top": { maxDepth: 397, maxWidth: 130, maxHeight: 40 },
      "cpu-cooler-1": { maxDepth: 165, maxWidth: 165, maxHeight: 180 },
      "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 },
      "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 },
    },
    camera: { target: cameraTargetFor(DIM_MFF), distance: 23.5, minDistance: 9, maxDistance: 34, fov: 38 },
    fanMounts: makeFanMounts(MFF_TRANSFORMS, MFF_FAN_IDS, { "fan-front-1": 160, "fan-front-2": 160, "fan-rear-1": 140 }),
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
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...accessoryMountIds, ...LFF_FAN_IDS],
    supportedMotherboardFormFactors: ["MINI_ITX", "MICRO_ATX", "ATX", "E_ATX"],
    mountTransforms: LFF_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 340, maxWidth: 290, maxHeight: 75 },
      "pcie-slot-1": { maxDepth: 440, maxWidth: 180, maxHeight: 85 },
      "psu-bay": { maxDepth: 250, maxWidth: 160, maxHeight: 90 },
      "radiator-front": { maxDepth: 480, maxWidth: 150, maxHeight: 60 },
      "radiator-top": { maxDepth: 480, maxWidth: 150, maxHeight: 60 },
      "cpu-cooler-1": { maxDepth: 170, maxWidth: 170, maxHeight: 190 },
      "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 },
      "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 },
    },
    camera: { target: cameraTargetFor(DIM_LFF), distance: 27.5, minDistance: 11, maxDistance: 40, fov: 38 },
    fanMounts: makeFanMounts(LFF_TRANSFORMS, LFF_FAN_IDS, { "fan-top-1": 140, "fan-top-2": 140, "fan-top-3": 140, "fan-front-1": 140, "fan-front-2": 140, "fan-front-3": 140, "fan-rear-1": 140 }),
    proceduralFallback: { color: "#233044", envelopeScale: envelopeScaleMm(DIM_LFF) },
  },
  {
    id: "case-profile-matx-airflow",
    componentId: "case-matx-airflow",
    label: "MFF — Mesh Airflow Micro-ATX",
    formFactor: "Micro-ATX",
    dimensionsMm: DIM_MATX_AIR,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...accessoryMountIds, ...MATX_FAN_IDS],
    supportedMotherboardFormFactors: ["MINI_ITX", "MICRO_ATX"],
    mountTransforms: MATX_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 250, maxWidth: 250, maxHeight: 60 },
      "pcie-slot-1": { maxDepth: 335, maxWidth: 150, maxHeight: 65 },
      "psu-bay": { maxDepth: 180, maxWidth: 150, maxHeight: 86 },
      "radiator-front": { maxDepth: 315, maxWidth: 145, maxHeight: 40 },
      "radiator-top": { maxDepth: 275, maxWidth: 125, maxHeight: 40 },
      "cpu-cooler-1": { maxDepth: 145, maxWidth: 150, maxHeight: 165 },
      "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 },
      "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 },
    },
    camera: { target: cameraTargetFor(DIM_MATX_AIR), distance: 20, minDistance: 8, maxDistance: 31, fov: 38 },
    fanMounts: makeFanMounts(MATX_TRANSFORMS, MATX_FAN_IDS),
    proceduralFallback: { color: "#263241", envelopeScale: envelopeScaleMm(DIM_MATX_AIR) },
    asset: { glbUrl: "/assets/case-matx-airflow/lod0.glb", license: "CC0-1.0" },
  },
  {
    id: "case-profile-dual-chamber",
    componentId: "case-dual-chamber-atx",
    label: "MFF — Dual-Chamber Panoramic ATX",
    formFactor: "ATX Dual Chamber",
    dimensionsMm: DIM_DUAL,
    supportedMountIds: ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...accessoryMountIds, ...DUAL_FAN_IDS],
    supportedMotherboardFormFactors: ["MINI_ITX", "MICRO_ATX", "ATX"],
    mountTransforms: DUAL_TRANSFORMS,
    clearanceLimits: {
      "motherboard-tray": { maxDepth: 310, maxWidth: 250, maxHeight: 65 },
      "pcie-slot-1": { maxDepth: 400, maxWidth: 165, maxHeight: 85 },
      "psu-bay": { maxDepth: 220, maxWidth: 150, maxHeight: 86 },
      "radiator-front": { maxDepth: 397, maxWidth: 145, maxHeight: 45 },
      "radiator-top": { maxDepth: 397, maxWidth: 145, maxHeight: 45 },
      "cpu-cooler-1": { maxDepth: 165, maxWidth: 165, maxHeight: 180 },
      "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 },
      "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 },
    },
    camera: { target: cameraTargetFor(DIM_DUAL), distance: 24, minDistance: 9, maxDistance: 36, fov: 38 },
    fanMounts: makeFanMounts(DUAL_TRANSFORMS, DUAL_FAN_IDS, { "fan-top-1": 140, "fan-top-2": 140, "fan-top-3": 140, "fan-side-1": 140 }),
    proceduralFallback: { color: "#172033", envelopeScale: envelopeScaleMm(DIM_DUAL) },
    asset: { glbUrl: "/assets/case-dual-chamber/lod0.glb", license: "CC0-1.0" },
  },
];

export const getCaseProfile = (componentIdOrProfileId: string): CaseProfile | undefined => {
  return caseProfiles.find(
    (p) => p.id === componentIdOrProfileId || p.componentId === componentIdOrProfileId
  );
};
