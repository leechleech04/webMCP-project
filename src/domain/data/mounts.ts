import type { MountDefinition } from "../types/mount";

const mountDefinitions: MountDefinition[] = [
  {
    id: "case-root",
    type: "CASE",
    supportedComponentTypes: ["CASE"],
  },
  {
    id: "motherboard-tray",
    type: "MOTHERBOARD",
    supportedComponentTypes: ["MOTHERBOARD"],
  },
  {
    id: "cpu-socket-1",
    type: "CPU",
    supportedComponentTypes: ["CPU"],
  },
  {
    id: "dimm-a1",
    type: "RAM",
    supportedComponentTypes: ["RAM"],
  },
  {
    id: "dimm-b1",
    type: "RAM",
    supportedComponentTypes: ["RAM"],
  },
  {
    id: "pcie-slot-1",
    type: "PCIE",
    supportedComponentTypes: ["GPU"],
    constraints: { maxDepth: 420, maxWidth: 180, maxHeight: 90 },
  },
  {
    id: "radiator-front",
    type: "RADIATOR",
    supportedComponentTypes: ["RADIATOR"],
    constraints: { maxDepth: 480, maxWidth: 150, maxHeight: 50 },
  },
  {
    id: "radiator-top",
    type: "RADIATOR",
    supportedComponentTypes: ["RADIATOR"],
    constraints: { maxDepth: 480, maxWidth: 150, maxHeight: 50 },
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
  {
    id: "fan-top-2",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-top-3",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-front-1",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-front-2",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-front-3",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-rear-1",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-bottom-1",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "storage-m2-1",
    type: "STORAGE",
    supportedComponentTypes: ["STORAGE"],
  },
  {
    id: "fan-bottom-2",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
  {
    id: "fan-side-1",
    type: "FAN",
    supportedComponentTypes: ["FAN"],
  },
];

export const mountRegistry: Readonly<Record<string, MountDefinition>> =
  Object.fromEntries(mountDefinitions.map((mount) => [mount.id, mount]));

export const mounts = Object.values(mountRegistry);
