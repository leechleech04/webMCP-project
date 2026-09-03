import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import { validateAirflow } from "./airflow";
import { validateCaseClearance } from "./caseClearance";
import { validateGpuCable } from "./gpuCableClearance";
import { validateGpuRadiatorClearance } from "./gpuRadiatorClearance";
import { validatePsu } from "./psuPower";
import { validatePlatformCompatibility } from "./platformCompatibility";
import type { ConstraintIssue } from "../types/constraint";
import { validateSpatialCollisions } from "./spatialCollisions";

export interface ValidationContext {
  componentRegistry?: ComponentRegistry;
  mountRegistry?: MountRegistry;
}

export const validateBuild = (
  state: BuildState,
  context: ValidationContext = {},
): ConstraintIssue[] => [
  ...validatePlatformCompatibility(state, context),
  ...validateCaseClearance(state, context),
  ...validateSpatialCollisions(state, context),
  ...validateGpuRadiatorClearance(state, context),
  ...validateGpuCable(state, context),
  ...validatePsu(state, context),
  ...validateAirflow(state, context),
];

export const defaultValidationContext: Required<ValidationContext> = {
  componentRegistry,
  mountRegistry,
};
