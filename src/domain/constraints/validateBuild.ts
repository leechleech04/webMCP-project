import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import { validateAirflow } from "./airflow";
import { validateGpuCable } from "./gpuCableClearance";
import { validateGpuRadiatorClearance } from "./gpuRadiatorClearance";
import { validatePsu } from "./psuPower";
import { validateRequiredComponents, validateRequiredConnections } from "./connections";
import type { ConstraintIssue } from "../types/constraint";

export type BuildReadiness = "INCOMPLETE" | "CONFLICT" | "READY";
export interface BuildAssessment { status: BuildReadiness; issues: ConstraintIssue[]; }

export interface ValidationContext {
  componentRegistry?: ComponentRegistry;
  mountRegistry?: MountRegistry;
}

export const validateBuild = (
  state: BuildState,
  context: ValidationContext = {},
): ConstraintIssue[] => [
  ...validateRequiredComponents(state),
  ...validateGpuRadiatorClearance(state, context),
  ...validateGpuCable(state, context),
  ...validatePsu(state, context),
  ...validateRequiredConnections(state, context.componentRegistry),
  ...validateAirflow(state, context),
];

export const assessBuild = (state: BuildState, context: ValidationContext = {}): BuildAssessment => {
  const issues = validateBuild(state, context);
  const hasConflict = issues.some((issue) => issue.severity === "ERROR" && issue.category !== "COMPLETENESS");
  return { status: hasConflict ? "CONFLICT" : issues.length > 0 ? "INCOMPLETE" : "READY", issues };
};

export const defaultValidationContext: Required<ValidationContext> = {
  componentRegistry,
  mountRegistry,
};
