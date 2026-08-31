import { componentRegistry as defaultComponents } from "../data/components";
import { mountRegistry as defaultMounts } from "../data/mounts";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import { GPU_ID } from "./constraintIds";

/** MVP demo rule: reserve 10 mm of side clearance for the installed GPU power lead. */
export const GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM = 10;

export interface GpuCableContext {
  componentRegistry?: ComponentRegistry;
  mountRegistry?: MountRegistry;
}

export const validateGpuCable = (state: BuildState, context: GpuCableContext = {}) => {
  const components = context.componentRegistry ?? defaultComponents;
  const mounts = context.mountRegistry ?? defaultMounts;
  const placement = state.placements.find((item) => item.componentId === GPU_ID);
  if (!placement) return [];
  const gpu = components[GPU_ID];
  const mount = mounts[placement.mountId];
  const available = (mount?.constraints?.maxWidth ?? gpu?.dimensions.width ?? 0) - (gpu?.dimensions.width ?? 0);
  const margin = available - GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM;
  if (margin >= 0) return [];
  return [{
    id: "GPU_POWER_CABLE_CLEARANCE",
    type: "CABLE" as const,
    severity: "ERROR" as const,
    message: `GPU power cable clearance: ${available} mm available; ${GPU_POWER_CABLE_REQUIRED_CLEARANCE_MM} mm required; Margin: ${margin} mm`,
    affectedComponentIds: [GPU_ID],
  }];
};
