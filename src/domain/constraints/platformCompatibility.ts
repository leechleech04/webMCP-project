import { getActiveCaseProfile } from "../cases/getActiveCase";
import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { ConstraintIssue } from "../types/constraint";

export const validatePlatformCompatibility = (
  state: BuildState,
  context: { componentRegistry?: ComponentRegistry } = {},
): ConstraintIssue[] => {
  const components = context.componentRegistry ?? defaultComponents;
  const installed = state.placements
    .map((placement) => components[placement.componentId])
    .filter(Boolean);
  const profile = getActiveCaseProfile(state);
  const motherboard = installed.find((component) => component.type === "MOTHERBOARD");
  const issues: ConstraintIssue[] = [];
  if (!state.placements.some((placement) => placement.mountId === "case-root")) return issues;

  if (motherboard?.compatibility?.motherboardFormFactor &&
      !profile.supportedMotherboardFormFactors.includes(motherboard.compatibility.motherboardFormFactor)) {
    issues.push({
      id: "MOTHERBOARD_FORM_FACTOR_MISMATCH",
      type: "CLEARANCE",
      severity: "ERROR",
      message: `${motherboard.name} is not supported by ${profile.label}.`,
      affectedComponentIds: [motherboard.id],
    });
  }

  for (const component of installed) {
    if (["CPU", "CPU_COOLER", "RAM", "GPU", "STORAGE"].includes(component.type) && !motherboard) {
      issues.push({
        id: `MOTHERBOARD_REQUIRED:${component.id}`,
        type: "CONNECTOR",
        severity: "ERROR",
        message: `${component.name} requires an installed motherboard.`,
        affectedComponentIds: [component.id],
      });
    }
    if ((component.type === "CPU_COOLER" || component.type === "RADIATOR") && motherboard &&
        component.compatibility?.supportedCpuSockets &&
        !component.compatibility.supportedCpuSockets.includes(motherboard.compatibility?.cpuSocket ?? "")) {
      issues.push({
        id: `CPU_COOLER_SOCKET_MISMATCH:${component.id}`,
        type: "CONNECTOR",
        severity: "ERROR",
        message: `${component.name} does not support ${motherboard.compatibility?.cpuSocket ?? "the selected motherboard socket"}.`,
        affectedComponentIds: [component.id, motherboard.id],
      });
    }
    if (component.type === "CPU" && motherboard &&
        component.compatibility?.cpuSocket !== motherboard.compatibility?.cpuSocket) {
      issues.push({
        id: `CPU_SOCKET_MISMATCH:${component.id}`,
        type: "CONNECTOR",
        severity: "ERROR",
        message: `${component.name} uses ${component.compatibility?.cpuSocket ?? "an unknown socket"}, but ${motherboard.name} uses ${motherboard.compatibility?.cpuSocket ?? "an unknown socket"}.`,
        affectedComponentIds: [component.id, motherboard.id],
      });
    }
    if (component.type === "RAM" && motherboard &&
        component.compatibility?.memoryType !== motherboard.compatibility?.memoryType) {
      issues.push({
        id: `MEMORY_TYPE_MISMATCH:${component.id}`,
        type: "CONNECTOR",
        severity: "ERROR",
        message: `${component.name} is ${component.compatibility?.memoryType ?? "unknown"}, but ${motherboard.name} requires ${motherboard.compatibility?.memoryType ?? "unknown"}.`,
        affectedComponentIds: [component.id, motherboard.id],
      });
    }
  }

  const airCooler = installed.find((component) => component.type === "CPU_COOLER");
  const liquidCooler = installed.find((component) => component.type === "RADIATOR");
  if (airCooler && liquidCooler) {
    issues.push({
      id: "CPU_COOLING_SOLUTION_CONFLICT",
      type: "CLEARANCE",
      severity: "ERROR",
      message: "Choose either an air CPU cooler or an AIO liquid cooler, not both.",
      affectedComponentIds: [airCooler.id, liquidCooler.id],
    });
  }

  return issues;
};
