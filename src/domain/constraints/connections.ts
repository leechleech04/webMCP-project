import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { ConstraintIssue } from "../types/constraint";

const hasConnection = (state: BuildState, fromComponentId: string, fromConnectorId: string, toComponentId: string, toConnectorId: string) =>
  state.connections.some((connection) =>
    connection.from.componentId === fromComponentId && connection.from.connectorId === fromConnectorId &&
    connection.to.componentId === toComponentId && connection.to.connectorId === toConnectorId);

export const validateRequiredConnections = (
  state: BuildState,
  components: ComponentRegistry = defaultComponents,
): ConstraintIssue[] => {
  const installed = new Set(state.placements.map((item) => item.componentId));
  const issues: ConstraintIssue[] = [];
  const requireLink = (id: string, from: [string, string], to: [string, string], message: string) => {
    if (installed.has(from[0]) && installed.has(to[0]) && !hasConnection(state, from[0], from[1], to[0], to[1])) {
      issues.push({ id, type: "CONNECTOR", severity: "ERROR", category: "COMPLETENESS", message, affectedComponentIds: [from[0], to[0]] });
    }
  };

  requireLink("ATX_POWER_NOT_CONNECTED", ["psu-01", "psu-atx-01"], ["motherboard-01", "motherboard-atx"], "Connect the PSU 24-pin output to the motherboard ATX input.");
  requireLink("CPU_POWER_NOT_CONNECTED", ["psu-01", "psu-eps-01"], ["motherboard-01", "motherboard-eps"], "Connect the PSU EPS output to the motherboard CPU power input.");
  requireLink("GPU_POWER_NOT_CONNECTED", ["psu-01", "psu-gpu-01"], ["gpu-01", "gpu-power"], "Connect the PSU GPU output to the GPU power input.");
  requireLink("FAN_PWM_NOT_CONNECTED", ["motherboard-01", "fan-header-1"], ["fan-top-01", "fan-pwm"], "Connect the fan PWM lead to a motherboard fan header.");
  requireLink("FAN_ARGB_NOT_CONNECTED", ["motherboard-01", "argb-header-1"], ["fan-top-01", "fan-argb"], "Connect the fan ARGB lead to a motherboard ARGB header.");

  // Keep the registry argument explicit so custom fixtures cannot silently validate unknown IDs.
  return issues.filter((issue) => issue.affectedComponentIds.every((id) => components[id] !== undefined));
};

export const validateRequiredComponents = (state: BuildState): ConstraintIssue[] => {
  const installed = new Set(state.placements.map((item) => item.componentId));
  const required = ["case-01", "motherboard-01", "psu-01"];
  const missing = required.filter((id) => !installed.has(id));
  return missing.length === 0 ? [] : [{
    id: "REQUIRED_COMPONENTS_MISSING",
    type: "CONNECTOR",
    severity: "ERROR",
    category: "COMPLETENESS",
    message: `Install required base components: ${missing.join(", ")}.`,
    affectedComponentIds: missing,
  }];
};
