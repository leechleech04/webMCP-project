import type { MountDefinition } from "../types/mount";

const mountDefinitions: MountDefinition[] = [
  {
    id: "motherboard-tray",
    type: "MOTHERBOARD",
    label: "MOTHERBOARD_TRAY",
    supportedComponentTypes: ["MOTHERBOARD"],
  },
  {
    id: "pcie-slot-1",
    type: "PCIE",
    label: "PCIE_SLOT_1",
    supportedComponentTypes: ["GPU"],
    constraints: { maxDepth: 360, maxWidth: 160, maxHeight: 80 },
  },
  {
    id: "radiator-front",
    type: "RADIATOR",
    label: "RADIATOR_FRONT",
    supportedComponentTypes: ["RADIATOR"],
    constraints: { maxDepth: 420, maxWidth: 140, maxHeight: 40 },
  },
  {
    id: "radiator-top",
    type: "RADIATOR",
    label: "RADIATOR_TOP",
    supportedComponentTypes: ["RADIATOR"],
    constraints: { maxDepth: 420, maxWidth: 140, maxHeight: 40 },
  },
  {
    id: "psu-bay",
    type: "PSU",
    label: "PSU_BAY",
    supportedComponentTypes: ["PSU"],
  },
  {
    id: "fan-top-1",
    type: "FAN",
    label: "FAN_TOP_1",
    supportedComponentTypes: ["FAN"],
  },
];

export const mountRegistry: Readonly<Record<string, MountDefinition>> =
  Object.fromEntries(mountDefinitions.map((mount) => [mount.id, mount]));

export const mounts = Object.values(mountRegistry);
