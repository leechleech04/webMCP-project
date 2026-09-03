import type { ComponentDefinition } from "../types/component";
import { realProductIds, realProductOverrides } from "./realProductCatalog";

// Cases
const case01: ComponentDefinition = {
  id: "case-01",
  type: "CASE",
  name: "Lian Li Lancool 216",
  dimensions: { width: 235, height: 491.7, depth: 480.9 },
  visualAsset: {
    mode: "GLB",
    assetId: "CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X",
    url: "/assets/case-lian-li-lancool-216/lod0.glb",
    license: "Original manual reconstruction; official specifications cited",
    attributionPath: "assets/case-lian-li-lancool-216/ATTRIBUTION.md",
  },
};

const caseMiniPc01: ComponentDefinition = {
  id: "case-mini-pc-01",
  type: "CASE",
  name: "MINI_PC Compact Cube",
  dimensions: { width: 190, height: 200, depth: 200 },
};

const caseSff01: ComponentDefinition = {
  id: "case-sff-01",
  type: "CASE",
  name: "SFF Mini Tower",
  dimensions: { width: 210, height: 350, depth: 340 },
};

const caseLff01: ComponentDefinition = {
  id: "case-lff-01",
  type: "CASE",
  name: "LFF Full Tower",
  dimensions: { width: 270, height: 560, depth: 580 },
};

const caseTerra01: ComponentDefinition = {
  id: "case-terra-01",
  type: "CASE",
  name: "Fractal Design Terra",
  dimensions: { width: 185, height: 218, depth: 343 },
};

const caseMatxAirflow: ComponentDefinition = {
  id: "case-matx-airflow",
  type: "CASE",
  name: "Mesh Airflow Micro-ATX Tower",
  dimensions: { width: 215, height: 400, depth: 390 },
  visualAsset: {
    mode: "GLB", assetId: "CASE_MATX_AIRFLOW", url: "/assets/case-matx-airflow/lod0.glb",
    license: "Original procedural asset — CC0-1.0", attributionPath: "assets/case-matx-airflow/ATTRIBUTION.md",
    nativeDimensions: { width: 1, height: 1, depth: 1 },
  },
};


// Motherboards
const motherboard01: ComponentDefinition = {
  id: "motherboard-01",
  type: "MOTHERBOARD",
  name: "ATX Standard Motherboard (305×244mm)",
  dimensions: { width: 244, height: 35, depth: 305 },
  compatibility: { motherboardFormFactor: "ATX", cpuSocket: "AM5", memoryType: "DDR5" },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
    { id: "fan-header-1", type: "PWM", direction: "OUTPUT" },
    { id: "argb-header-1", type: "ARGB", direction: "OUTPUT" },
  ],
};

const motherboardItx01: ComponentDefinition = {
  id: "motherboard-itx-01",
  type: "MOTHERBOARD",
  name: "Mini-ITX Compact Motherboard (170×170mm)",
  dimensions: { width: 170, height: 35, depth: 170 },
  compatibility: { motherboardFormFactor: "MINI_ITX", cpuSocket: "AM5", memoryType: "DDR5" },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
    { id: "fan-header-1", type: "PWM", direction: "OUTPUT" },
    { id: "argb-header-1", type: "ARGB", direction: "OUTPUT" },
  ],
};

const boardAsset = {
  mode: "GLB" as const, assetId: "MOTHERBOARD_FAMILY", url: "/assets/motherboard-family/lod0.glb",
  license: "Original procedural asset — CC0-1.0", attributionPath: "assets/motherboard-family/ATTRIBUTION.md",
  nativeDimensions: { width: 1, height: 1, depth: 1 },
};
const motherboardMatxAm5: ComponentDefinition = {
  id: "motherboard-matx-am5", type: "MOTHERBOARD", name: "Micro-ATX AM5 DDR5 Motherboard",
  dimensions: { width: 244, height: 35, depth: 244 },
  compatibility: { motherboardFormFactor: "MICRO_ATX", cpuSocket: "AM5", memoryType: "DDR5" },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
    { id: "fan-header-1", type: "PWM", direction: "OUTPUT" },
    { id: "argb-header-1", type: "ARGB", direction: "OUTPUT" },
  ], visualAsset: boardAsset,
};
const motherboardAtxLga: ComponentDefinition = {
  id: "motherboard-atx-lga1851", type: "MOTHERBOARD", name: "ATX LGA1851 DDR5 Motherboard",
  dimensions: { width: 244, height: 35, depth: 305 },
  compatibility: { motherboardFormFactor: "ATX", cpuSocket: "LGA1851", memoryType: "DDR5" },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
    { id: "fan-header-1", type: "PWM", direction: "OUTPUT" },
    { id: "argb-header-1", type: "ARGB", direction: "OUTPUT" },
  ], visualAsset: boardAsset,
};
const motherboardItxLga: ComponentDefinition = {
  id: "motherboard-itx-lga1851", type: "MOTHERBOARD", name: "Mini-ITX LGA1851 DDR5 Motherboard",
  dimensions: { width: 170, height: 35, depth: 170 },
  compatibility: { motherboardFormFactor: "MINI_ITX", cpuSocket: "LGA1851", memoryType: "DDR5" },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
    { id: "fan-header-1", type: "PWM", direction: "OUTPUT" },
    { id: "argb-header-1", type: "ARGB", direction: "OUTPUT" },
  ], visualAsset: boardAsset,
};

// CPUs
const cpu01: ComponentDefinition = {
  id: "cpu-01",
  type: "CPU",
  name: "Octa-Core CPU (125W TDP)",
  dimensions: { width: 45, height: 5, depth: 45 },
  power: { consumption: 125 },
  compatibility: { cpuSocket: "AM5" },
};

const cpuAsset = {
  mode: "GLB" as const, assetId: "CPU_PACKAGE", url: "/assets/cpu-package/lod0.glb",
  license: "Original procedural asset — CC0-1.0", attributionPath: "assets/cpu-package/ATTRIBUTION.md",
  nativeDimensions: { width: 1, height: 1, depth: 1 },
};
const cpuAm5Low: ComponentDefinition = { id: "cpu-am5-65w", type: "CPU", name: "AM5 Efficient 8-Core CPU (65W)", dimensions: { width: 45, height: 5, depth: 45 }, power: { consumption: 65 }, compatibility: { cpuSocket: "AM5" }, visualAsset: cpuAsset };
const cpuAm5High: ComponentDefinition = { id: "cpu-am5-170w", type: "CPU", name: "AM5 Performance 16-Core CPU (170W)", dimensions: { width: 45, height: 5, depth: 45 }, power: { consumption: 170 }, compatibility: { cpuSocket: "AM5" }, visualAsset: cpuAsset };
const cpuLga: ComponentDefinition = { id: "cpu-lga1851-125w", type: "CPU", name: "LGA1851 Performance CPU (125W)", dimensions: { width: 45, height: 5, depth: 37.5 }, power: { consumption: 125 }, compatibility: { cpuSocket: "LGA1851" }, visualAsset: cpuAsset };

// RAM
const ram01: ComponentDefinition = {
  id: "ram-01",
  type: "RAM",
  name: "16GB DDR5-6000 Stick 1",
  dimensions: { width: 133, height: 35, depth: 7 },
  compatibility: { memoryType: "DDR5" },
};

const ram02: ComponentDefinition = {
  id: "ram-02",
  type: "RAM",
  name: "16GB DDR5-6000 Stick 2",
  dimensions: { width: 133, height: 35, depth: 7 },
  compatibility: { memoryType: "DDR5" },
};

const ram03: ComponentDefinition = {
  id: "ram-03",
  type: "RAM",
  name: "32GB RGB DDR5-6400 High-Capacity Stick",
  dimensions: { width: 133, height: 42, depth: 8 },
  compatibility: { memoryType: "DDR5" },
};

const ramAsset = {
  mode: "GLB" as const, assetId: "RAM_LOW_PROFILE", url: "/assets/ram-low-profile/lod0.glb",
  license: "Original procedural asset — CC0-1.0", attributionPath: "assets/ram-low-profile/ATTRIBUTION.md",
  nativeDimensions: { width: 1, height: 1, depth: 1 },
};
const ramLowProfile32: ComponentDefinition = { id: "ram-lowprofile-32", type: "RAM", name: "32GB DDR5-6000 Low-Profile Stick", dimensions: { width: 133, height: 32, depth: 7 }, compatibility: { memoryType: "DDR5" }, visualAsset: ramAsset };
const ramLowProfile48: ComponentDefinition = { id: "ram-lowprofile-48", type: "RAM", name: "48GB DDR5-6400 Low-Profile Stick", dimensions: { width: 133, height: 32, depth: 7 }, compatibility: { memoryType: "DDR5" }, visualAsset: ramAsset };

const storage01: ComponentDefinition = {
  id: "storage-nvme-01",
  type: "STORAGE",
  name: "2TB PCIe 4.0 NVMe SSD",
  dimensions: { width: 22, height: 3.5, depth: 80 },
  power: { consumption: 5 },
  compatibility: { storageFormFactor: "M2_2280" },
};

const storageNvmeHeatsink: ComponentDefinition = { id: "storage-nvme-heatsink", type: "STORAGE", name: "4TB PCIe 5.0 NVMe SSD with Heatsink", dimensions: { width: 24, height: 12, depth: 80 }, power: { consumption: 12 }, compatibility: { storageFormFactor: "M2_2280" } };
const storageSata: ComponentDefinition = {
  id: "storage-sata-2tb", type: "STORAGE", name: "2TB 2.5-inch SATA SSD", dimensions: { width: 69.85, height: 7, depth: 100 }, power: { consumption: 4 }, compatibility: { storageFormFactor: "SATA_2_5" },
  visualAsset: { mode: "GLB", assetId: "STORAGE_SATA", url: "/assets/storage-sata/lod0.glb", license: "Original procedural asset — CC0-1.0", attributionPath: "assets/storage-sata/ATTRIBUTION.md", nativeDimensions: { width: 1, height: 1, depth: 1 } },
};
const storageHdd: ComponentDefinition = {
  id: "storage-hdd-4tb", type: "STORAGE", name: "4TB 3.5-inch Hard Drive", dimensions: { width: 101.6, height: 26.1, depth: 147 }, power: { consumption: 9 }, compatibility: { storageFormFactor: "HDD_3_5" },
  visualAsset: { mode: "GLB", assetId: "STORAGE_HDD", url: "/assets/storage-hdd/lod0.glb", license: "Original procedural asset — CC0-1.0", attributionPath: "assets/storage-hdd/ATTRIBUTION.md", nativeDimensions: { width: 1, height: 1, depth: 1 } },
};

// GPUs
const gpu01: ComponentDefinition = {
  id: "gpu-01",
  type: "GPU",
  name: "Triple-Fan Flagship GPU (340mm, 450W)",
  dimensions: { width: 150, height: 70, depth: 340 },
  power: { consumption: 450 },
  connectors: [
    { id: "gpu-power", type: "12V_2X6", direction: "INPUT" },
  ],
};

const gpu2fan01: ComponentDefinition = {
  id: "gpu-2fan-01",
  type: "GPU",
  name: "Dual-Fan Mid-Tier GPU (242mm, 220W)",
  dimensions: { width: 130, height: 45, depth: 242 },
  power: { consumption: 220 },
  connectors: [
    { id: "gpu-power", type: "12V_2X6", direction: "INPUT" },
  ],
};

const gpu1fan01: ComponentDefinition = {
  id: "gpu-1fan-01",
  type: "GPU",
  name: "Compact 1-Fan Mini-ITX GPU (170mm, 130W)",
  dimensions: { width: 150, height: 40, depth: 170 },
  power: { consumption: 130 },
  connectors: [
    { id: "gpu-power", type: "12V_2X6", direction: "INPUT" },
  ],
};

const gpuDualAsset = {
  mode: "GLB" as const, assetId: "GPU_DUAL_FAN", url: "/assets/gpu-dual-fan/lod0.glb",
  license: "Original procedural asset — CC0-1.0", attributionPath: "assets/gpu-dual-fan/ATTRIBUTION.md",
  nativeDimensions: { width: 1, height: 1, depth: 1 },
};
const gpuCompact200: ComponentDefinition = { id: "gpu-compact-200", type: "GPU", name: "Compact Dual-Fan GPU (200mm, 160W)", dimensions: { width: 112, height: 40, depth: 200 }, power: { consumption: 160 }, connectors: [{ id: "gpu-power", type: "PCIE_8PIN", direction: "INPUT" }], visualAsset: gpuDualAsset };
const gpuPerformance280: ComponentDefinition = { id: "gpu-performance-280", type: "GPU", name: "Performance Dual-Fan GPU (280mm, 285W)", dimensions: { width: 135, height: 55, depth: 280 }, power: { consumption: 285 }, connectors: [{ id: "gpu-power", type: "12V_2X6", direction: "INPUT" }], visualAsset: gpuDualAsset };
const gpuEnthusiast360: ComponentDefinition = {
  id: "gpu-enthusiast-360", type: "GPU", name: "Enthusiast Quad-Slot GPU (360mm, 575W)", dimensions: { width: 155, height: 80, depth: 360 }, power: { consumption: 575 }, connectors: [{ id: "gpu-power", type: "12V_2X6", direction: "INPUT" }],
  visualAsset: { mode: "GLB", assetId: "GPU_QUAD_SLOT", url: "/assets/gpu-quad-slot/lod0.glb", license: "Original procedural asset — CC0-1.0", attributionPath: "assets/gpu-quad-slot/ATTRIBUTION.md", nativeDimensions: { width: 1, height: 1, depth: 1 } },
};

// Radiators
const radiator01: ComponentDefinition = {
  id: "radiator-01",
  type: "RADIATOR",
  name: "360mm Triple Liquid Radiator (397mm)",
  dimensions: { width: 120, height: 30, depth: 397 },
};

const radiator24001: ComponentDefinition = {
  id: "radiator-240-01",
  type: "RADIATOR",
  name: "240mm Dual Liquid Radiator (275mm)",
  dimensions: { width: 120, height: 30, depth: 275 },
};

const radiator12001: ComponentDefinition = {
  id: "radiator-120-01",
  type: "RADIATOR",
  name: "120mm Single Liquid Radiator (157mm)",
  dimensions: { width: 120, height: 30, depth: 157 },
};

const radiator280: ComponentDefinition = { id: "radiator-280-01", type: "RADIATOR", name: "280mm Dual Liquid Radiator (315mm)", dimensions: { width: 140, height: 30, depth: 315 } };

const coolerSingleTower: ComponentDefinition = {
  id: "cooler-single-tower", type: "CPU_COOLER", name: "Single-Tower 120mm Air Cooler (155mm)", dimensions: { width: 125, height: 155, depth: 78 }, compatibility: { supportedCpuSockets: ["AM5", "LGA1851"] },
  visualAsset: { mode: "GLB", assetId: "COOLER_SINGLE_TOWER", url: "/assets/cooler-single-tower/lod0.glb", license: "Original procedural asset — CC0-1.0", attributionPath: "assets/cooler-single-tower/ATTRIBUTION.md", nativeDimensions: { width: 1, height: 1, depth: 1 } },
};
const coolerDualTower: ComponentDefinition = {
  id: "cooler-dual-tower", type: "CPU_COOLER", name: "Dual-Tower 140mm Air Cooler (165mm)", dimensions: { width: 150, height: 165, depth: 135 }, compatibility: { supportedCpuSockets: ["AM5", "LGA1851"] },
  visualAsset: { mode: "GLB", assetId: "COOLER_DUAL_TOWER", url: "/assets/cooler-dual-tower/lod0.glb", license: "Original procedural asset — CC0-1.0", attributionPath: "assets/cooler-dual-tower/ATTRIBUTION.md", nativeDimensions: { width: 1, height: 1, depth: 1 } },
};
const coolerLowProfileAm5: ComponentDefinition = {
  id: "cooler-low-profile-am5",
  type: "CPU_COOLER",
  name: "Noctua NH-L9a-AM5",
  dimensions: { width: 114, height: 37, depth: 92 },
  compatibility: { supportedCpuSockets: ["AM5"] },
  visualAsset: coolerSingleTower.visualAsset,
};

// PSUs
const psu01: ComponentDefinition = {
  id: "psu-01",
  type: "PSU",
  name: "1000W ATX Modular Platinum PSU",
  dimensions: { width: 150, height: 86, depth: 180 },
  power: { capacity: 1000 },
  connectors: [
    { id: "psu-atx-01", type: "ATX_24PIN", direction: "OUTPUT" },
    { id: "psu-eps-01", type: "EPS_8PIN", direction: "OUTPUT" },
    { id: "psu-gpu-01", type: "12V_2X6", direction: "OUTPUT" },
  ],
};

const psuSfx01: ComponentDefinition = {
  id: "psu-sfx-01",
  type: "PSU",
  name: "750W SFX Compact Modular Gold PSU",
  dimensions: { width: 125, height: 63.5, depth: 100 },
  power: { capacity: 750 },
  connectors: [
    { id: "psu-atx-01", type: "ATX_24PIN", direction: "OUTPUT" },
    { id: "psu-eps-01", type: "EPS_8PIN", direction: "OUTPUT" },
    { id: "psu-gpu-01", type: "12V_2X6", direction: "OUTPUT" },
  ],
};

const psuAsset = {
  mode: "GLB" as const, assetId: "PSU_ATX", url: "/assets/psu-atx/lod0.glb",
  license: "Original procedural asset — CC0-1.0", attributionPath: "assets/psu-atx/ATTRIBUTION.md",
  nativeDimensions: { width: 1, height: 1, depth: 1 },
};
const psuAtx650: ComponentDefinition = {
  id: "psu-atx-650", type: "PSU", name: "650W ATX Modular Gold PSU", dimensions: { width: 150, height: 86, depth: 150 }, power: { capacity: 650 },
  connectors: [
    { id: "psu-atx-01", type: "ATX_24PIN", direction: "OUTPUT" }, { id: "psu-eps-01", type: "EPS_8PIN", direction: "OUTPUT" },
    { id: "psu-gpu-01", type: "PCIE_8PIN", direction: "OUTPUT" }, { id: "psu-gpu-02", type: "12V_2X6", direction: "OUTPUT" },
  ], visualAsset: psuAsset,
};
const psuAtxShort850: ComponentDefinition = {
  id: "psu-atx-short-850", type: "PSU", name: "850W Short ATX Modular Gold PSU", dimensions: { width: 150, height: 86, depth: 140 }, power: { capacity: 850 },
  connectors: [
    { id: "psu-atx-01", type: "ATX_24PIN", direction: "OUTPUT" }, { id: "psu-eps-01", type: "EPS_8PIN", direction: "OUTPUT" },
    { id: "psu-gpu-01", type: "12V_2X6", direction: "OUTPUT" }, { id: "psu-gpu-02", type: "PCIE_8PIN", direction: "OUTPUT" },
  ], visualAsset: psuAsset,
};

// Fans
const fanTop01: ComponentDefinition = {
  id: "fan-top-01",
  type: "FAN",
  name: "120mm High-Static Fan (Top 1)",
  dimensions: { width: 120, height: 25, depth: 120 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
    { id: "fan-argb", type: "ARGB", direction: "INPUT" },
  ],
  visualAsset: {
    mode: "GLB",
    assetId: "FAN_NOCTUA_NF_A12X25_G2_PWM",
    url: "/assets/fan-noctua-nf-a12x25-g2-pwm/lod0.glb",
    license: "CC BY 4.0 International",
    attributionPath: "assets/fan-noctua-nf-a12x25-g2-pwm/ATTRIBUTION.md",
  },
};

const fanFront01: ComponentDefinition = {
  id: "fan-front-01",
  type: "FAN",
  name: "120mm Front Intake Fan 1",
  dimensions: { width: 120, height: 25, depth: 120 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
    { id: "fan-argb", type: "ARGB", direction: "INPUT" },
  ],
};

const fanRear01: ComponentDefinition = {
  id: "fan-rear-01",
  type: "FAN",
  name: "120mm Rear Exhaust Fan",
  dimensions: { width: 120, height: 25, depth: 120 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
  ],
};

const fanBottom01: ComponentDefinition = {
  id: "fan-bottom-01",
  type: "FAN",
  name: "120mm Bottom Shroud Fan",
  dimensions: { width: 120, height: 25, depth: 120 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
  ],
};

const fanSide01: ComponentDefinition = {
  id: "fan-side-01",
  type: "FAN",
  name: "120mm Side Bracket Fan",
  dimensions: { width: 120, height: 25, depth: 120 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
  ],
};

const fan14001: ComponentDefinition = {
  id: "fan-140-01",
  type: "FAN",
  name: "140mm High-Airflow PWM Fan (85 CFM)",
  dimensions: { width: 140, height: 25, depth: 140 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
  ],
};

const fan16001: ComponentDefinition = {
  id: "fan-160-01",
  type: "FAN",
  name: "160mm Large Intake Fan (110 CFM)",
  dimensions: { width: 160, height: 30, depth: 160 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
  ],
};

const fan140Argb: ComponentDefinition = {
  id: "fan-140-argb-01", type: "FAN", name: "140mm ARGB PWM Fan (90 CFM)", dimensions: { width: 140, height: 25, depth: 140 },
  connectors: [{ id: "fan-pwm", type: "PWM", direction: "INPUT" }, { id: "fan-argb", type: "ARGB", direction: "INPUT" }],
  visualAsset: { mode: "GLB", assetId: "FAN_140_ARGB", url: "/assets/fan-140-argb/lod0.glb", license: "Original procedural asset — CC0-1.0", attributionPath: "assets/fan-140-argb/ATTRIBUTION.md", nativeDimensions: { width: 1, height: 1, depth: 1 } },
};

const legacyComponentRegistry: Record<string, ComponentDefinition> = {
  [case01.id]: case01,
  [caseMiniPc01.id]: caseMiniPc01,
  [caseTerra01.id]: caseTerra01,
  [caseSff01.id]: caseSff01,
  [caseLff01.id]: caseLff01,
  [caseMatxAirflow.id]: caseMatxAirflow,
  [motherboard01.id]: motherboard01,
  [motherboardItx01.id]: motherboardItx01,
  [motherboardMatxAm5.id]: motherboardMatxAm5,
  [motherboardAtxLga.id]: motherboardAtxLga,
  [motherboardItxLga.id]: motherboardItxLga,
  [cpu01.id]: cpu01,
  [cpuAm5Low.id]: cpuAm5Low,
  [cpuAm5High.id]: cpuAm5High,
  [cpuLga.id]: cpuLga,
  [ram01.id]: ram01,
  [ram02.id]: ram02,
  [ram03.id]: ram03,
  [ramLowProfile32.id]: ramLowProfile32,
  [ramLowProfile48.id]: ramLowProfile48,
  [storage01.id]: storage01,
  [storageNvmeHeatsink.id]: storageNvmeHeatsink,
  [storageSata.id]: storageSata,
  [storageHdd.id]: storageHdd,
  [gpu01.id]: gpu01,
  [gpu2fan01.id]: gpu2fan01,
  [gpu1fan01.id]: gpu1fan01,
  [gpuCompact200.id]: gpuCompact200,
  [gpuPerformance280.id]: gpuPerformance280,
  [gpuEnthusiast360.id]: gpuEnthusiast360,
  [radiator01.id]: radiator01,
  [radiator24001.id]: radiator24001,
  [radiator12001.id]: radiator12001,
  [radiator280.id]: radiator280,
  [coolerSingleTower.id]: coolerSingleTower,
  [coolerDualTower.id]: coolerDualTower,
  [coolerLowProfileAm5.id]: coolerLowProfileAm5,
  [psu01.id]: psu01,
  [psuSfx01.id]: psuSfx01,
  [psuAtx650.id]: psuAtx650,
  [psuAtxShort850.id]: psuAtxShort850,
  [fanTop01.id]: fanTop01,
  [fanFront01.id]: fanFront01,
  [fanRear01.id]: fanRear01,
  [fanBottom01.id]: fanBottom01,
  [fanSide01.id]: fanSide01,
  [fan14001.id]: fan14001,
  [fan16001.id]: fan16001,
  [fan140Argb.id]: fan140Argb,
};

/** Public product catalog. Legacy definitions remain resolvable for v1 build imports. */
export const components: ComponentDefinition[] = realProductIds.map((id) => {
  const base = legacyComponentRegistry[id];
  const override = realProductOverrides[id];
  if (!base || !override) throw new Error(`Real product override has no base component: ${id}`);
  return { ...base, ...override, id: base.id, type: base.type };
});

const productRegistry = Object.fromEntries([
  ...Object.values(legacyComponentRegistry).map((component) => [component.id, component] as const),
  ...components.map((component) => [component.id, component] as const),
]);

/**
 * Instance-aware read facade. Mounted duplicates use ids such as `fan-top-01#2`
 * while all specification lookups resolve to the same purchasable product.
 */
export const componentRegistry: Readonly<Record<string, ComponentDefinition>> = new Proxy(productRegistry, {
  get(target, property, receiver) {
    if (typeof property !== "string") return Reflect.get(target, property, receiver);
    return target[property] ?? target[property.split("#", 1)[0]];
  },
});

export const getProductId = (componentInstanceId: string): string => componentInstanceId.split("#", 1)[0];

export const getComponentProduct = (componentInstanceId: string): ComponentDefinition | undefined => (
  componentRegistry[componentInstanceId]
);
