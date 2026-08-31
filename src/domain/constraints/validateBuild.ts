import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import { validateAirflow } from "./airflow";
import { validateGpuCable } from "./gpuCableClearance";
import { validateGpuRadiatorClearance } from "./gpuRadiatorClearance";
import { validatePsu } from "./psuPower";

export interface ValidationContext {
  componentRegistry?: ComponentRegistry;
  mountRegistry?: MountRegistry;
}

export const validateBuild = (
  state: BuildState,
  context: ValidationContext = {},
) => [
  ...validateGpuRadiatorClearance(state, context),
  ...validateGpuCable(state, context),
  ...validatePsu(state, context),
  ...validateAirflow(state, context),
];

export const defaultValidationContext: Required<ValidationContext> = {
  componentRegistry,
  mountRegistry,
};
