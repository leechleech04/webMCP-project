import { componentRegistry as defaultComponents } from "../data/components";
import { mountRegistry as defaultMounts } from "../data/mounts";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import { getActiveCaseProfile } from "../cases/getActiveCase";

/** MVP demo rule: reserve 10 mm of side clearance for the installed GPU power lead. */
export const GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM = 10;

export interface GpuCableContext {
  componentRegistry?: ComponentRegistry;
  mountRegistry?: MountRegistry;
}

export const validateGpuCable = (state: BuildState, context: GpuCableContext = {}) => {
  const components = context.componentRegistry ?? defaultComponents;
  const mounts = context.mountRegistry ?? defaultMounts;
  const profile = getActiveCaseProfile(state);
  return state.placements.flatMap((placement) => {
    const gpu = components[placement.componentId];
    if (gpu?.type !== "GPU") return [];
    const mount = mounts[placement.mountId];
    const maxWidth = profile.clearanceLimits[placement.mountId]?.maxWidth ?? mount?.constraints?.maxWidth;
    const available = (maxWidth ?? gpu.dimensions.width) - gpu.dimensions.width;
    const margin = available - GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM;
    if (margin >= 0) return [];
    return [{
      id: gpu.id === "gpu-01" ? "GPU_POWER_CABLE_CLEARANCE" : `GPU_POWER_CABLE_CLEARANCE:${gpu.id}`,
      type: "CABLE" as const,
      severity: "ERROR" as const,
      message: `GPU power cable clearance: ${available} mm available; ${GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM} mm required; Margin: ${margin} mm`,
      affectedComponentIds: [placement.componentId],
      details: { availableMm: available, requiredMm: GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM, marginMm: margin },
    }];
  });
};
