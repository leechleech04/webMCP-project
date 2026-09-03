import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry, ComponentType } from "../types/component";
import type { ConstraintIssue } from "../types/constraint";
import { validateBuild, type ValidationContext } from "./validateBuild";

export type BuildAssessmentStatus = "READY" | "INCOMPLETE" | "CONFLICT";

export interface BuildAssessment {
  status: BuildAssessmentStatus;
  valid: boolean;
  issues: ConstraintIssue[];
  missingComponentTypes: ComponentType[];
  missingPowerConnections: string[];
  summary: string;
}

const ESSENTIAL_TYPES: readonly ComponentType[] = [
  "CASE",
  "MOTHERBOARD",
  "CPU",
  "RAM",
  "STORAGE",
  "PSU",
];

export const assessBuildState = (
  state: BuildState,
  context: ValidationContext = {},
): BuildAssessment => {
  const components: ComponentRegistry = context.componentRegistry ?? defaultComponents;
  const issues = validateBuild(state, context);
  const hasConflict = issues.some((issue) => issue.severity === "ERROR");

  const installedTypes = new Set<ComponentType>();
  const installedByComponent = new Map<string, ComponentType>();

  for (const placement of state.placements) {
    const def = components[placement.componentId];
    if (def) {
      installedTypes.add(def.type);
      installedByComponent.set(placement.componentId, def.type);
    }
  }

  const missingComponentTypes = ESSENTIAL_TYPES.filter(
    (type) => !installedTypes.has(type),
  );

  const missingPowerConnections: string[] = [];

  const psuPlacements = state.placements.filter(
    (p) => components[p.componentId]?.type === "PSU",
  );
  const mbPlacements = state.placements.filter(
    (p) => components[p.componentId]?.type === "MOTHERBOARD",
  );
  const gpuPlacements = state.placements.filter(
    (p) => components[p.componentId]?.type === "GPU",
  );

  if (psuPlacements.length > 0 && mbPlacements.length > 0) {
    for (const mb of mbPlacements) {
      const mbDef = components[mb.componentId];
      const hasAtxInput = mbDef?.connectors?.some(
        (c) => c.type === "ATX_24PIN" && c.direction === "INPUT",
      );
      if (hasAtxInput) {
        const hasAtxLink = state.connections.some(
          (c) =>
            c.to.componentId === mb.componentId &&
            components[c.from.componentId]?.type === "PSU" &&
            components[c.from.componentId]?.connectors?.some(
              (connector) => connector.id === c.from.connectorId && connector.type === "ATX_24PIN",
            ) &&
            mbDef.connectors?.some(
              (connector) => connector.id === c.to.connectorId && connector.type === "ATX_24PIN",
            ),
        );
        if (!hasAtxLink) {
          missingPowerConnections.push(`ATX 24-Pin Power to ${mbDef.name}`);
        }
      }

      const hasEpsInput = mbDef?.connectors?.some(
        (c) => c.type === "EPS_8PIN" && c.direction === "INPUT",
      );
      if (hasEpsInput) {
        const hasEpsLink = state.connections.some(
          (c) =>
            c.to.componentId === mb.componentId &&
            components[c.from.componentId]?.type === "PSU" &&
            components[c.from.componentId]?.connectors?.some(
              (connector) => connector.id === c.from.connectorId && connector.type === "EPS_8PIN",
            ) &&
            mbDef.connectors?.some(
              (connector) => connector.id === c.to.connectorId && connector.type === "EPS_8PIN",
            ),
        );
        if (!hasEpsLink) {
          missingPowerConnections.push(`EPS CPU Power to ${mbDef.name}`);
        }
      }
    }
  }

  if (psuPlacements.length > 0 && gpuPlacements.length > 0) {
    for (const gpu of gpuPlacements) {
      const gpuDef = components[gpu.componentId];
      const gpuPowerInputs = gpuDef?.connectors?.filter(
        (connector) => (connector.type === "12V_2X6" || connector.type === "PCIE_8PIN") && connector.direction === "INPUT",
      ) ?? [];
      for (const powerInput of gpuPowerInputs) {
        const hasGpuLink = state.connections.some(
          (c) =>
            c.to.componentId === gpu.componentId &&
            c.to.connectorId === powerInput.id &&
            components[c.from.componentId]?.type === "PSU" &&
            components[c.from.componentId]?.connectors?.some(
              (connector) => connector.id === c.from.connectorId &&
                (connector.type === "12V_2X6" || connector.type === "PCIE_8PIN"),
            ) &&
            gpuDef.connectors?.some(
              (connector) => connector.id === c.to.connectorId && connector.type ===
                components[c.from.componentId]?.connectors?.find((source) => source.id === c.from.connectorId)?.type,
            ),
        );
        if (!hasGpuLink) {
          missingPowerConnections.push(`${powerInput.type} (${powerInput.id}) to ${gpuDef?.name ?? gpu.componentId}`);
        }
      }
    }
  }

  let status: BuildAssessmentStatus = "READY";
  if (hasConflict) {
    status = "CONFLICT";
  } else if (
    missingComponentTypes.length > 0 ||
    missingPowerConnections.length > 0
  ) {
    status = "INCOMPLETE";
  }

  const summary =
    status === "CONFLICT"
      ? `Build has ${issues.filter((i) => i.severity === "ERROR").length} blocking conflict(s).`
      : status === "INCOMPLETE"
        ? `Build is incomplete: ${[
            missingComponentTypes.length > 0
              ? `Missing components: ${missingComponentTypes.join(", ")}`
              : "",
            missingPowerConnections.length > 0
              ? `Missing cables: ${missingPowerConnections.join("; ")}`
              : "",
          ]
            .filter(Boolean)
            .join(". ")}`
        : "Build is ready and power verified.";

  return {
    status,
    valid: status === "READY",
    issues,
    missingComponentTypes,
    missingPowerConnections,
    summary,
  };
};
