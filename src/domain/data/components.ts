import type { ComponentDefinition } from "../types/component";

const case01: ComponentDefinition = {
  id: "case-01",
  type: "CASE",
  name: "Demo Mid Tower",
  dimensions: { width: 240, height: 500, depth: 480 },
};

const motherboard01: ComponentDefinition = {
  id: "motherboard-01",
  type: "MOTHERBOARD",
  name: "Demo ATX Motherboard",
  dimensions: { width: 244, height: 35, depth: 305 },
  connectors: [
    { id: "motherboard-atx", type: "ATX_24PIN", direction: "INPUT" },
    { id: "motherboard-eps", type: "EPS_8PIN", direction: "INPUT" },
  ],
};

const gpu01: ComponentDefinition = {
  id: "gpu-01",
  type: "GPU",
  name: "Demo GPU 340",
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
  dimensions: { width: 120, height: 30, depth: 397 },
};

const psu01: ComponentDefinition = {
  id: "psu-01",
  type: "PSU",
  name: "Demo 1000W PSU",
  dimensions: { width: 150, height: 86, depth: 180 },
  power: { capacity: 1000 },
  connectors: [
    { id: "psu-atx-01", type: "ATX_24PIN", direction: "OUTPUT" },
    { id: "psu-gpu-01", type: "12V_2X6", direction: "OUTPUT" },
  ],
};

const fanTop01: ComponentDefinition = {
  id: "fan-top-01",
  type: "FAN",
  name: "Demo 120mm Fan",
  dimensions: { width: 120, height: 25, depth: 120 },
  connectors: [
    { id: "fan-pwm", type: "PWM", direction: "INPUT" },
    { id: "fan-argb", type: "ARGB", direction: "INPUT" },
  ],
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
