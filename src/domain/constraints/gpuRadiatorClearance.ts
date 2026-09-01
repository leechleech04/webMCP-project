import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";

/** MVP demo rule: a front 360 radiator leaves 320 mm for the GPU. */
export const FRONT_RADIATOR_GPU_CLEARANCE_MM = 320;

export interface ConstraintContext {
  componentRegistry?: ComponentRegistry;
}

export const validateGpuRadiatorClearance = (
  state: BuildState,
  context: ConstraintContext = {},
) => {
  const components = context.componentRegistry ?? defaultComponents;
  const gpuPlacement = state.placements.find((placement) => components[placement.componentId]?.type === "GPU");
  const radiatorPlacement = state.placements.find((placement) => components[placement.componentId]?.type === "RADIATOR");
  if (!gpuPlacement || !radiatorPlacement || radiatorPlacement.mountId !== "radiator-front") return [];

  const gpuDepth = components[gpuPlacement.componentId]?.dimensions.depth ?? 0;
  const margin = FRONT_RADIATOR_GPU_CLEARANCE_MM - gpuDepth;
  if (margin >= 0) return [];

  return [{
    id: "GPU_RADIATOR_COLLISION" as const,
    type: "CLEARANCE" as const,
    severity: "ERROR" as const,
    message: `GPU length: ${gpuDepth} mm; Available clearance: ${FRONT_RADIATOR_GPU_CLEARANCE_MM} mm; Margin: ${margin} mm`,
    affectedComponentIds: [gpuPlacement.componentId, radiatorPlacement.componentId],
    details: { gpuLengthMm: gpuDepth, availableClearanceMm: FRONT_RADIATOR_GPU_CLEARANCE_MM, marginMm: margin },
  }];
};
