import type { MountDefinition } from "../types/mount";

const mountDefinitions: MountDefinition[] = [
  {
    id: "motherboard-tray",
    type: "MOTHERBOARD",
    supportedComponentTypes: ["MOTHERBOARD"],
  },
  {
    id: "pcie-slot-1",
    type: "PCIE",
    supportedComponentTypes: ["GPU"],
    constraints: { maxDepth: 360, maxWidth: 160, maxHeight: 80 },
  },
  {
    id: "radiator-front",
    type: "RADIATOR",
    supportedComponentTypes: ["RADIATOR"],
    constraints: { maxDepth: 420, maxWidth: 140, maxHeight: 40 },
  },
  {
    id: "radiator-top",
    type: "RADIATOR",
    supportedComponentTypes: ["RADIATOR"],
    constraints: { maxDepth: 420, maxWidth: 140, maxHeight: 40 },
  },
  {
    id: "psu-bay",
    type: "PSU",
    supportedComponentTypes: ["PSU"],
  },
  {
    id: "fan-top-1",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
];

export const mountRegistry: Readonly<Record<string, MountDefinition>> =
  Object.fromEntries(mountDefinitions.map((mount) => [mount.id, mount]));

export const mounts = Object.values(mountRegistry);
