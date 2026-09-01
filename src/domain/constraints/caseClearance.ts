import { componentRegistry as defaultComponents } from "../data/components";
import { mountRegistry as defaultMounts } from "../data/mounts";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import type { ConstraintIssue } from "../types/constraint";
import { getActiveCaseProfile } from "../cases/getActiveCase";

export const validateCaseClearance = (
  state: BuildState,
  context: { componentRegistry?: ComponentRegistry; mountRegistry?: MountRegistry } = {}
): ConstraintIssue[] => {
  const components = context.componentRegistry ?? defaultComponents;
  const mounts = context.mountRegistry ?? defaultMounts;
  const profile = getActiveCaseProfile(state);
  const issues: ConstraintIssue[] = [];

  for (const placement of state.placements) {
    if (placement.mountId === "case-root") continue;
    const component = components[placement.componentId];
    const mount = mounts[placement.mountId];
    if (!component) continue;

    // Check if mount is unsupported by active case
    if (!profile.supportedMountIds.includes(placement.mountId)) {
      issues.push({
        id: "CASE_UNSUPPORTED_MOUNT",
        type: "CLEARANCE",
        severity: "ERROR",
        message: `${component.name} is installed on ${placement.mountId}, which is not supported in ${profile.label}.`,
        affectedComponentIds: [placement.componentId],
      });
      continue;
    }

    // Check case profile clearance limits for this mount
    const caseLimit = profile.clearanceLimits?.[placement.mountId];
    const mountConstraint = mount?.constraints;

    const maxDepth = caseLimit?.maxDepth ?? mountConstraint?.maxDepth;
    const maxWidth = caseLimit?.maxWidth ?? mountConstraint?.maxWidth;
    const maxHeight = caseLimit?.maxHeight ?? mountConstraint?.maxHeight;

    if (maxDepth !== undefined && component.dimensions.depth > maxDepth) {
      issues.push({
        id: "CASE_CLEARANCE_DEPTH_EXCEEDED",
        type: "CLEARANCE",
        severity: "ERROR",
        message: `${component.name} length (${component.dimensions.depth} mm) exceeds ${profile.label} clearance (${maxDepth} mm). Collision margin: ${maxDepth - component.dimensions.depth} mm`,
        affectedComponentIds: [placement.componentId],
      });
    }

    if (maxWidth !== undefined && component.dimensions.width > maxWidth) {
      issues.push({
        id: "CASE_CLEARANCE_WIDTH_EXCEEDED",
        type: "CLEARANCE",
        severity: "ERROR",
        message: `${component.name} width (${component.dimensions.width} mm) exceeds ${profile.label} clearance (${maxWidth} mm).`,
        affectedComponentIds: [placement.componentId],
      });
    }

    if (maxHeight !== undefined && component.dimensions.height > maxHeight) {
      issues.push({
        id: "CASE_CLEARANCE_HEIGHT_EXCEEDED",
        type: "CLEARANCE",
        severity: "ERROR",
        message: `${component.name} height (${component.dimensions.height} mm) exceeds ${profile.label} clearance (${maxHeight} mm).`,
        affectedComponentIds: [placement.componentId],
      });
    }
  }

  return issues;
};
