import { componentRegistry as defaultComponents } from "../data/components";
import { getActiveCaseProfile } from "../cases/getActiveCase";
import type { BuildState } from "../types/build";
import type { ComponentDefinition, ComponentRegistry } from "../types/component";
import type { Placement } from "../types/placement";
import type { ConstraintIssue } from "../types/constraint";
import type { SceneTransform } from "../../scene/mountTransforms";

export interface Aabb {
  min: [number, number, number];
  max: [number, number, number];
}

const mm = (value: number) => value * 0.02;

const rotate = ([x0, y0, z0]: [number, number, number], [rx, ry, rz]: [number, number, number]): [number, number, number] => {
  let x = x0; let y = y0; let z = z0;
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  return [x, y, z];
};

const localSize = (component: ComponentDefinition): [number, number, number] => {
  const { width, height, depth } = component.dimensions;
  if (component.type === "MOTHERBOARD") return [mm(width), mm(depth), mm(height)];
  if (component.type === "RAM") return [mm(depth), mm(width), mm(height)];
  if (component.type === "CPU") return [mm(width), mm(width), mm(height)];
  if (component.type === "FAN") return [mm(width), mm(width), mm(height)];
  // AIO rendering includes a 25 mm fan bank in addition to radiator thickness.
  if (component.type === "RADIATOR") return [mm(width), mm(depth), mm(height + 25)];
  return [mm(width), mm(height), mm(depth)];
};

export const getPlacementAabb = (
  placement: Placement,
  component: ComponentDefinition,
  transform: SceneTransform,
): Aabb => {
  let size = localSize(component);
  let center: [number, number, number] = [...transform.position];
  let rotation = transform.rotation;
  if (component.type === "CPU_COOLER") {
    // AirCoolerModel maps physical height to the board normal (+X).
    size = [mm(component.dimensions.height), mm(component.dimensions.width), mm(component.dimensions.depth)];
    center = [center[0] + size[0] / 2, center[1], center[2]];
    rotation = [0, 0, 0];
  }

  const scale = transform.scale ?? [1, 1, 1];
  const half: [number, number, number] = [size[0] * scale[0] / 2, size[1] * scale[1] / 2, size[2] * scale[2] / 2];
  const points: Array<[number, number, number]> = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const point = rotate([half[0] * sx, half[1] * sy, half[2] * sz], rotation);
    points.push([point[0] + center[0], point[1] + center[1], point[2] + center[2]]);
  }
  return {
    min: [Math.min(...points.map((p) => p[0])), Math.min(...points.map((p) => p[1])), Math.min(...points.map((p) => p[2]))],
    max: [Math.max(...points.map((p) => p[0])), Math.max(...points.map((p) => p[1])), Math.max(...points.map((p) => p[2]))],
  };
};

const penetration = (a: Aabb, b: Aabb): [number, number, number] => [
  Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]),
  Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]),
  Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]),
];

const intentionalAttachment = (a: Placement, ac: ComponentDefinition, b: Placement, bc: ComponentDefinition): boolean => {
  const types = new Set([ac.type, bc.type]);
  if (types.has("MOTHERBOARD")) {
    const other = ac.type === "MOTHERBOARD" ? b : a;
    return ["cpu-socket-1", "dimm-a1", "dimm-b1", "storage-m2-1", "pcie-slot-1"].includes(other.mountId);
  }
  if (types.has("STORAGE") && types.has("GPU")) return true;
  return types.has("CPU") && types.has("CPU_COOLER");
};

export const validateSpatialCollisions = (
  state: BuildState,
  context: { componentRegistry?: ComponentRegistry } = {},
): ConstraintIssue[] => {
  const components = context.componentRegistry ?? defaultComponents;
  const profile = getActiveCaseProfile(state);
  const casePlacement = state.placements.find((item) => item.mountId === "case-root");
  if (!casePlacement) return [];
  const entries = state.placements
    .filter((item) => item.mountId !== "case-root")
    .flatMap((placement) => {
      const component = components[placement.componentId];
      const transform = profile.mountTransforms[placement.mountId];
      return component && transform ? [{ placement, component, aabb: getPlacementAabb(placement, component, transform) }] : [];
    });
  const issues: ConstraintIssue[] = [];
  const envelope: Aabb = {
    min: [-mm(profile.dimensionsMm.width) / 2, 0, -mm(profile.dimensionsMm.depth) / 2],
    max: [mm(profile.dimensionsMm.width) / 2, mm(profile.dimensionsMm.height), mm(profile.dimensionsMm.depth) / 2],
  };
  const tolerance = 0.03;
  for (const entry of entries) {
    const outside = entry.aabb.min.some((value, axis) => value < envelope.min[axis] - tolerance)
      || entry.aabb.max.some((value, axis) => value > envelope.max[axis] + tolerance);
    if (outside) {
      issues.push({
        id: `CASE_ENVELOPE_COLLISION:${entry.placement.componentId}`,
        type: "CLEARANCE",
        severity: "ERROR",
        message: `${entry.component.name} crosses the physical envelope of ${profile.label}.`,
        affectedComponentIds: [entry.placement.componentId, casePlacement.componentId],
      });
    }
  }

  for (let i = 0; i < entries.length; i += 1) for (let j = i + 1; j < entries.length; j += 1) {
    const a = entries[i]; const b = entries[j];
    if (intentionalAttachment(a.placement, a.component, b.placement, b.component)) continue;
    const overlap = penetration(a.aabb, b.aabb);
    if (overlap.every((value) => value > 0.04)) {
      issues.push({
        id: `PART_COLLISION:${a.placement.componentId}:${b.placement.componentId}`,
        type: "CLEARANCE",
        severity: "ERROR",
        message: `${a.component.name} intersects ${b.component.name} in the 3D layout.`,
        affectedComponentIds: [a.placement.componentId, b.placement.componentId],
      });
    }
  }
  return issues;
};
