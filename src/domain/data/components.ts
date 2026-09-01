import type { ComponentDefinition } from "../types/component";

const case01: ComponentDefinition = {
  id: "case-01",
  type: "CASE",
  name: "Lian Li Lancool 216",
  dataConfidence: "SOURCED",
  sourceNote: "Dimensions and chassis asset are based on cited manufacturer specifications.",
  dimensions: { width: 235, height: 491.7, depth: 480.9 },
  visualAsset: {
    mode: "GLB",
    assetId: "CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X",
    url: "/assets/case-lian-li-lancool-216/lod0.glb",
    license: "Original manual reconstruction; official specifications cited",
    attributionPath: "assets/case-lian-li-lancool-216/ATTRIBUTION.md",
  },
};

const motherboard01: ComponentDefinition = {
  id: "motherboard-01",
  type: "MOTHERBOARD",
  name: "Demo ATX Motherboard",
  dataConfidence: "DEMO",
  sourceNote: "Synthetic challenge fixture; do not use as purchasing advice.",
  dimensions: { width: 244, height: 35, depth: 305 },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
    { id: "fan-header-1", type: "PWM", direction: "OUTPUT" },
    { id: "argb-header-1", type: "ARGB", direction: "OUTPUT" },
  ],
};

const gpu01: ComponentDefinition = {
  id: "gpu-01",
  type: "GPU",
  name: "Demo GPU 340",
  dataConfidence: "DEMO",
  sourceNote: "Synthetic 340 mm / 450 W challenge fixture.",
  dimensions: { width: 150, height: 70, depth: 340 },
  power: { consumption: 450 },
  connectors: [
    { id: "gpu-power", type: "12V_2X6", direction: "INPUT" },
  ],
};

const radiator01: ComponentDefinition = {
  id: "radiator-01",
  type: "RADIATOR",
  name: "Demo 360 Radiator",
  dataConfidence: "DEMO",
  sourceNote: "Synthetic challenge fixture used for deterministic clearance validation.",
  dimensions: { width: 120, height: 30, depth: 397 },
};

const psu01: ComponentDefinition = {
  id: "psu-01",
  type: "PSU",
  name: "Demo 1000W PSU",
  dataConfidence: "DEMO",
  sourceNote: "Synthetic challenge fixture.",
  dimensions: { width: 150, height: 86, depth: 180 },
  power: { capacity: 1000 },
  connectors: [
    { id: "psu-atx-01", type: "ATX_24PIN", direction: "OUTPUT" },
    { id: "psu-eps-01", type: "EPS_8PIN", direction: "OUTPUT" },
    { id: "psu-gpu-01", type: "12V_2X6", direction: "OUTPUT" },
  ],
};

const fanTop01: ComponentDefinition = {
  id: "fan-top-01",
  type: "FAN",
  name: "Demo 120mm Fan",
  dataConfidence: "DEMO",
  sourceNote: "Dimensions are a challenge fixture; visual asset attribution is provided separately.",
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

export const componentRegistry: Readonly<
  Record<string, ComponentDefinition>
> = {
  [case01.id]: case01,
  [motherboard01.id]: motherboard01,
  [gpu01.id]: gpu01,
  [radiator01.id]: radiator01,
  [psu01.id]: psu01,
  [fanTop01.id]: fanTop01,
};

export const components = Object.values(componentRegistry);
