import type { ComponentDefinition } from "../types/component";

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

// CPUs
const cpu01: ComponentDefinition = {
  id: "cpu-01",
  type: "CPU",
  name: "Octa-Core CPU (125W TDP)",
  dimensions: { width: 45, height: 5, depth: 45 },
  power: { consumption: 125 },
  compatibility: { cpuSocket: "AM5" },
};

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

const storage01: ComponentDefinition = {
  id: "storage-nvme-01",
  type: "STORAGE",
  name: "2TB PCIe 4.0 NVMe SSD",
  dimensions: { width: 22, height: 3.5, depth: 80 },
  power: { consumption: 5 },
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

export const componentRegistry: Readonly<
  Record<string, ComponentDefinition>
> = {
  [case01.id]: case01,
  [caseMiniPc01.id]: caseMiniPc01,
  [caseSff01.id]: caseSff01,
  [caseLff01.id]: caseLff01,
  [motherboard01.id]: motherboard01,
  [motherboardItx01.id]: motherboardItx01,
  [cpu01.id]: cpu01,
  [ram01.id]: ram01,
  [ram02.id]: ram02,
  [ram03.id]: ram03,
  [storage01.id]: storage01,
  [gpu01.id]: gpu01,
  [gpu2fan01.id]: gpu2fan01,
  [gpu1fan01.id]: gpu1fan01,
  [radiator01.id]: radiator01,
  [radiator24001.id]: radiator24001,
  [radiator12001.id]: radiator12001,
  [psu01.id]: psu01,
  [psuSfx01.id]: psuSfx01,
  [fanTop01.id]: fanTop01,
  [fanFront01.id]: fanFront01,
  [fanRear01.id]: fanRear01,
  [fanBottom01.id]: fanBottom01,
  [fanSide01.id]: fanSide01,
  [fan14001.id]: fan14001,
  [fan16001.id]: fan16001,
};

export const components = Object.values(componentRegistry);
