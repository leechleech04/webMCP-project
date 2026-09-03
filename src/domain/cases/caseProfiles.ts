import type { CaseProfile, CaseFanMountMetadata } from "./types";
import type { SceneTransform } from "../../scene/mountTransforms";

type Dimensions = { width: number; height: number; depth: number };
type MotherboardFormFactor = CaseProfile["supportedMotherboardFormFactors"][number];

const mm = (value: number) => value * 0.02;
const envelopeScaleMm = (dim: Dimensions): [number, number, number] => [mm(dim.width), mm(dim.height), mm(dim.depth)];
const cameraTargetFor = (dim: Dimensions): [number, number, number] => [0, mm(dim.height) / 2, 0];

export const getRecommendedFanDirection = (mountId: string): "INTAKE" | "EXHAUST" =>
  mountId.includes("front") || mountId.includes("bottom") || mountId.includes("side") ? "INTAKE" : "EXHAUST";

const locationFor = (mountId: string): CaseFanMountMetadata["location"] =>
  mountId.includes("front") ? "front"
    : mountId.includes("top") ? "top"
      : mountId.includes("rear") ? "rear"
        : mountId.includes("bottom") ? "bottom"
          : "side";

const makeFanMounts = (
  transforms: Record<string, SceneTransform>,
  fanIds: string[],
  sizeOverrides: Partial<Record<string, 120 | 140 | 160>> = {},
): CaseFanMountMetadata[] => fanIds.map((mountId) => ({
  mountId,
  label: mountId.toUpperCase(),
  sizeMm: sizeOverrides[mountId] ?? 120,
  maxRpm: 2000,
  maxCfm: 60,
  location: locationFor(mountId),
  recommendedDirection: getRecommendedFanDirection(mountId),
  transform: transforms[mountId],
}));

interface LayoutOptions {
  motherboardBottom: number;
  maxMotherboardDepth: number;
  sandwich?: boolean;
  motherboardX?: number;
  motherboardZ?: number;
  gpuX?: number;
  gpuY?: number;
  gpuZ?: number;
  psuY?: number;
  bottomFanY?: number;
  fanIds?: string[];
}

/**
 * Builds every transform from the physical case envelope. Motherboards are
 * vertical in the Y/Z plane. CPU, M.2 and air-cooler mounts share their +X
 * normal. GPUs are horizontal in the X/Z plane at 90° to the motherboard,
 * slotted directly into the PCIe slot with card length along case depth.
 */
const createLayout = (dim: Dimensions, options: LayoutOptions): Record<string, SceneTransform> => {
  const height = mm(dim.height);
  const halfWidth = mm(dim.width) / 2;
  const halfDepth = mm(dim.depth) / 2;
  const motherboardHeight = mm(options.maxMotherboardDepth);
  const motherboardY = options.motherboardBottom + motherboardHeight / 2;
  const motherboardX = options.motherboardX ?? (options.sandwich ? 0 : -halfWidth + 0.45);
  const motherboardZ = options.motherboardZ ?? 0;
  const componentFaceX = motherboardX + 0.38;
  const cpuY = motherboardY + Math.min(0.55, motherboardHeight * 0.12);
  const cpuZ = -Math.min(0.55, halfDepth * 0.18);
  const ramY = cpuY + 0.04;
  const fanIds = options.fanIds ?? [];
  const gpuX = options.gpuX ?? (motherboardX + 1.55);
  const gpuY = options.gpuY ?? (motherboardY - 1.4);
  const gpuZ = options.gpuZ ?? motherboardZ;
  const transforms: Record<string, SceneTransform> = {
    "case-root": { position: [0, height / 2, 0], rotation: [0, 0, 0] },
    "motherboard-tray": { position: [motherboardX, motherboardY, motherboardZ], rotation: [0, Math.PI / 2, 0] },
    "cpu-socket-1": { position: [componentFaceX, cpuY, motherboardZ + cpuZ], rotation: [0, Math.PI / 2, 0] },
    // AirCoolerModel uses this as the CPU contact plane and extends along +X.
    "cpu-cooler-1": { position: [componentFaceX + 0.08, cpuY, motherboardZ + cpuZ], rotation: [0, 0, 0] },
    "dimm-a1": { position: [componentFaceX, ramY, motherboardZ + 1.25], rotation: [0, Math.PI / 2, 0] },
    "dimm-b1": { position: [componentFaceX, ramY, motherboardZ + 1.52], rotation: [0, Math.PI / 2, 0] },
    "storage-m2-1": { position: [componentFaceX, motherboardY - motherboardHeight * 0.28, motherboardZ - 0.25], rotation: [0, 0, Math.PI / 2] },
    "pcie-slot-1": { position: [gpuX, gpuY, gpuZ], rotation: [0, 0, 0] },
    "psu-bay": { position: [0, options.psuY ?? 0.95, halfDepth * 0.22], rotation: [0, 0, 0] },
    "storage-2-5-1": { position: [Math.max(0, halfWidth - 0.8), 0.18, Math.max(0, halfDepth - 1.15)], rotation: [0, 0, 0] },
    "storage-3-5-1": { position: [Math.max(0, halfWidth - 1.05), 0.32, -Math.max(0, halfDepth - 1.55)], rotation: [0, 0, 0] },
    "radiator-top": { position: [0, height - 0.64, 0], rotation: [Math.PI / 2, 0, 0] },
    "radiator-front": { position: [0, height / 2, halfDepth - 0.64], rotation: [0, Math.PI, 0] },
  };

  const byLocation = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  for (const fanId of fanIds) {
    const location = locationFor(fanId);
    locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
  }
  for (const fanId of fanIds) {
    const location = locationFor(fanId);
    const index = byLocation.get(location) ?? 0;
    byLocation.set(location, index + 1);
    const count = locationCounts.get(location) ?? 1;
    const offset = (index - (count - 1) / 2) * 2.9;
    if (location === "top") transforms[fanId] = { position: [0, height - 0.26, offset], rotation: [Math.PI / 2, 0, 0] };
    else if (location === "bottom") transforms[fanId] = { position: [0, options.bottomFanY ?? 0.26, offset], rotation: [Math.PI / 2, 0, 0] };
    else if (location === "front") transforms[fanId] = { position: [0, height / 2 + offset, halfDepth - 0.26], rotation: [0, 0, 0] };
    else if (location === "rear") transforms[fanId] = { position: [0, height / 2 + offset, -halfDepth + 0.26], rotation: [0, Math.PI, 0] };
    else transforms[fanId] = { position: [halfWidth - 0.26, height / 2 + offset, 0], rotation: [0, Math.PI / 2, 0] };
  }
  return transforms;
};

const commonMounts = ["case-root", "motherboard-tray", "cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "cpu-cooler-1"];
const storageMounts = ["storage-2-5-1", "storage-3-5-1"];

const profile = (input: {
  id: string; componentId: string; label: string; formFactor: string; dim: Dimensions;
  motherboardFactors: MotherboardFormFactor[]; transforms: Record<string, SceneTransform>;
  supported: string[]; clearances: CaseProfile["clearanceLimits"];
  fanIds?: string[]; fanSizes?: Partial<Record<string, 120 | 140 | 160>>;
  color: string; asset?: CaseProfile["asset"];
}): CaseProfile => ({
  id: input.id,
  componentId: input.componentId,
  label: input.label,
  formFactor: input.formFactor,
  dimensionsMm: input.dim,
  supportedMountIds: input.supported,
  supportedMotherboardFormFactors: input.motherboardFactors,
  mountTransforms: input.transforms,
  clearanceLimits: input.clearances,
  camera: {
    target: cameraTargetFor(input.dim),
    distance: Math.max(12, Math.max(...envelopeScaleMm(input.dim)) * 2.25),
    minDistance: 4,
    maxDistance: Math.max(24, Math.max(...envelopeScaleMm(input.dim)) * 4),
    fov: 38,
  },
  fanMounts: makeFanMounts(input.transforms, input.fanIds ?? [], input.fanSizes),
  proceduralFallback: { color: input.color, envelopeScale: envelopeScaleMm(input.dim) },
  asset: input.asset,
});

const DIM_CHOPIN = { width: 84, height: 244, depth: 217 };
const CHOPIN_T = createLayout(DIM_CHOPIN, { motherboardBottom: 0.72, maxMotherboardDepth: 170, sandwich: true, motherboardX: -0.4 });
const DIM_TERRA = { width: 185, height: 218, depth: 343 };
const TERRA_FANS = ["fan-bottom-1"];
const TERRA_T = createLayout(DIM_TERRA, { motherboardBottom: 0.48, maxMotherboardDepth: 170, motherboardX: -1.35, gpuY: 0.65, psuY: 2.8, fanIds: TERRA_FANS });
TERRA_T["psu-bay"] = { position: [0.85, 2.8, 2.0], rotation: [0, 0, Math.PI / 2] };
const DIM_NR200 = { width: 185, height: 292, depth: 372 };
const NR200_FANS = ["fan-top-1", "fan-top-2", "fan-bottom-1", "fan-bottom-2"];
const NR200_T = createLayout(DIM_NR200, { motherboardBottom: 0.95, maxMotherboardDepth: 180, motherboardX: -1.40, gpuY: 1.15, psuY: 3.94, fanIds: NR200_FANS });
NR200_T["psu-bay"] = { position: [0.58, 2.60, 2.10], rotation: [0, 0, 0] };
const DIM_MFF = { width: 235, height: 491.7, depth: 480.9 };
const MFF_FANS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-front-1", "fan-front-2", "fan-rear-1", "fan-bottom-1", "fan-bottom-2"];
const MFF_T = createLayout(DIM_MFF, { motherboardBottom: 2.25, maxMotherboardDepth: 305, motherboardX: -1.90, gpuY: 3.4, psuY: 1.05, bottomFanY: 2.15, fanIds: MFF_FANS });
const DIM_LFF = { width: 270, height: 560, depth: 580 };
const LFF_FANS = ["fan-top-1", "fan-top-2", "fan-top-3", "fan-front-1", "fan-front-2", "fan-front-3", "fan-rear-1", "fan-bottom-1", "fan-side-1"];
const LFF_T = createLayout(DIM_LFF, { motherboardBottom: 2.4, maxMotherboardDepth: 330, motherboardX: -2.25, gpuY: 3.8, psuY: 1.1, bottomFanY: 2.2, fanIds: LFF_FANS });
const DIM_MATX = { width: 215, height: 400, depth: 390 };
const MATX_FANS = ["fan-top-1", "fan-top-2", "fan-front-1", "fan-front-2", "fan-rear-1"];
const MATX_T = createLayout(DIM_MATX, { motherboardBottom: 2.1, maxMotherboardDepth: 244, motherboardX: -1.70, gpuY: 2.9, psuY: 0.95, bottomFanY: 2.0, fanIds: MATX_FANS });

export const caseProfiles: CaseProfile[] = [
  profile({
    id: "case-profile-mini-pc", componentId: "case-mini-pc-01", label: "InWin Chopin MAX (200W PSU Included)", formFactor: "Mini-ITX Mini PC", dim: DIM_CHOPIN,
    motherboardFactors: ["MINI_ITX"], transforms: CHOPIN_T,
    supported: [...commonMounts, "storage-2-5-1"],
    clearances: { "motherboard-tray": { maxDepth: 170, maxWidth: 170, maxHeight: 35 }, "cpu-cooler-1": { maxDepth: 100, maxWidth: 120, maxHeight: 54 }, "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 9.5 }, "radiator-top": { maxDepth: 0 }, "radiator-front": { maxDepth: 0 } },
    color: "#cbd5e1",
  }),
  profile({
    id: "case-profile-terra", componentId: "case-terra-01", label: "Fractal Design Terra", formFactor: "10.4L SFF Mini-ITX", dim: DIM_TERRA,
    motherboardFactors: ["MINI_ITX"], transforms: TERRA_T, fanIds: TERRA_FANS,
    supported: [...commonMounts, "pcie-slot-1", "psu-bay", "storage-2-5-1", ...TERRA_FANS],
    clearances: { "motherboard-tray": { maxDepth: 170, maxWidth: 170, maxHeight: 35 }, "pcie-slot-1": { maxDepth: 322, maxWidth: 145, maxHeight: 58 }, "psu-bay": { maxDepth: 130, maxWidth: 125, maxHeight: 64 }, "cpu-cooler-1": { maxDepth: 120, maxWidth: 120, maxHeight: 62 }, "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 }, "radiator-top": { maxDepth: 0 }, "radiator-front": { maxDepth: 0 } },
    color: "#78716c",
  }),
  profile({
    id: "case-profile-sff", componentId: "case-sff-01", label: "Cooler Master MasterBox NR200P V2", formFactor: "18.25L SFF Mini-ITX", dim: DIM_NR200,
    motherboardFactors: ["MINI_ITX"], transforms: NR200_T, fanIds: NR200_FANS,
    supported: [...commonMounts, "pcie-slot-1", "radiator-top", "psu-bay", ...storageMounts, ...NR200_FANS],
    clearances: { "motherboard-tray": { maxDepth: 180, maxWidth: 170, maxHeight: 35 }, "pcie-slot-1": { maxDepth: 356, maxWidth: 160, maxHeight: 73 }, "psu-bay": { maxDepth: 130, maxWidth: 125, maxHeight: 64 }, "radiator-top": { maxDepth: 280, maxWidth: 140, maxHeight: 40 }, "radiator-front": { maxDepth: 0 }, "cpu-cooler-1": { maxDepth: 120, maxWidth: 120, maxHeight: 67 }, "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 }, "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 }, "fan-bottom-1": { maxHeight: 25 }, "fan-bottom-2": { maxHeight: 15 } },
    color: "#1e293b",
  }),
  profile({
    id: "case-profile-mff", componentId: "case-01", label: "Lian Li LANCOOL 216", formFactor: "ATX Mid Tower", dim: DIM_MFF,
    motherboardFactors: ["MINI_ITX", "MICRO_ATX", "ATX"], transforms: MFF_T, fanIds: MFF_FANS,
    supported: [...commonMounts, "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...storageMounts, ...MFF_FANS],
    clearances: { "motherboard-tray": { maxDepth: 305, maxWidth: 244, maxHeight: 35 }, "pcie-slot-1": { maxDepth: 392, maxWidth: 160, maxHeight: 75 }, "psu-bay": { maxDepth: 220, maxWidth: 150, maxHeight: 86 }, "radiator-front": { maxDepth: 400, maxWidth: 130, maxHeight: 40 }, "radiator-top": { maxDepth: 400, maxWidth: 130, maxHeight: 40 }, "cpu-cooler-1": { maxDepth: 165, maxWidth: 165, maxHeight: 180 }, "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 }, "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 } },
    fanSizes: { "fan-front-1": 160, "fan-front-2": 160, "fan-rear-1": 140 }, color: "#0f172a",
    asset: { glbUrl: "/assets/case-lian-li-lancool-216/lod0.glb", license: "Original manual reconstruction; official specifications cited" },
  }),
  profile({
    id: "case-profile-lff", componentId: "case-lff-01", label: "LFF — Full Tower (Internal Demo)", formFactor: "Full Tower (Internal Demo)", dim: DIM_LFF,
    motherboardFactors: ["MINI_ITX", "MICRO_ATX", "ATX", "E_ATX"], transforms: LFF_T, fanIds: LFF_FANS,
    supported: [...commonMounts, "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...storageMounts, ...LFF_FANS],
    clearances: { "motherboard-tray": { maxDepth: 330, maxWidth: 290, maxHeight: 40 }, "pcie-slot-1": { maxDepth: 440, maxWidth: 180, maxHeight: 85 }, "psu-bay": { maxDepth: 250, maxWidth: 160, maxHeight: 90 }, "radiator-front": { maxDepth: 480, maxWidth: 150, maxHeight: 60 }, "radiator-top": { maxDepth: 480, maxWidth: 150, maxHeight: 60 }, "cpu-cooler-1": { maxDepth: 170, maxWidth: 170, maxHeight: 190 }, "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 }, "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 } },
    color: "#233044",
  }),
  profile({
    id: "case-profile-matx-airflow", componentId: "case-matx-airflow", label: "MFF — Mesh Airflow Micro-ATX", formFactor: "Micro-ATX", dim: DIM_MATX,
    motherboardFactors: ["MINI_ITX", "MICRO_ATX"], transforms: MATX_T, fanIds: MATX_FANS,
    supported: [...commonMounts, "pcie-slot-1", "radiator-front", "radiator-top", "psu-bay", ...storageMounts, ...MATX_FANS],
    clearances: { "motherboard-tray": { maxDepth: 244, maxWidth: 244, maxHeight: 35 }, "pcie-slot-1": { maxDepth: 335, maxWidth: 150, maxHeight: 65 }, "psu-bay": { maxDepth: 180, maxWidth: 150, maxHeight: 86 }, "radiator-front": { maxDepth: 315, maxWidth: 145, maxHeight: 40 }, "radiator-top": { maxDepth: 275, maxWidth: 125, maxHeight: 40 }, "cpu-cooler-1": { maxDepth: 145, maxWidth: 150, maxHeight: 165 }, "storage-2-5-1": { maxDepth: 105, maxWidth: 75, maxHeight: 15 }, "storage-3-5-1": { maxDepth: 150, maxWidth: 105, maxHeight: 30 } },
    color: "#263241", asset: { glbUrl: "/assets/case-matx-airflow/lod0.glb", license: "CC0-1.0" },
  }),
];

export const getCaseProfile = (componentIdOrProfileId: string): CaseProfile | undefined =>
  caseProfiles.find((item) => item.id === componentIdOrProfileId || item.componentId === componentIdOrProfileId);
