import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";

/** MVP demo rule: an active fan set must define both directions and cannot be one-sided. */
export const AIRFLOW_MAX_DIRECTION_IMBALANCE = 1;

export interface AirflowContext {
  componentRegistry?: ComponentRegistry;
  enforceNoFans?: boolean;
}

export const validateAirflow = (state: BuildState, context: AirflowContext = {}) => {
  const components = context.componentRegistry ?? defaultComponents;
  const fans = state.placements.filter((placement) => components[placement.componentId]?.type === "FAN");
  if (fans.length === 0) {
    return context.enforceNoFans ? [{ id: "AIRFLOW_NO_FANS", type: "AIRFLOW" as const, severity: "WARNING" as const, message: "No case fans are installed.", affectedComponentIds: [] }] : [];
  }

  const configured = new Map(state.fanConfigs.map((config) => [config.componentId, config.direction]));
  const missing = fans.filter((fan) => !configured.has(fan.componentId)).map((fan) => fan.componentId);
  if (missing.length > 0) {
    return [{ id: "AIRFLOW_DIRECTION_UNCONFIGURED", type: "AIRFLOW" as const, severity: "ERROR" as const, message: `Fan direction is not configured for: ${missing.join(", ")}.`, affectedComponentIds: missing }];
  }

  const intake = fans.filter((fan) => configured.get(fan.componentId) === "INTAKE").length;
  const exhaust = fans.filter((fan) => configured.get(fan.componentId) === "EXHAUST").length;
  if (intake === 0 || exhaust === 0 || Math.abs(intake - exhaust) > AIRFLOW_MAX_DIRECTION_IMBALANCE) {
    return [{ id: "AIRFLOW_UNBALANCED", type: "AIRFLOW" as const, severity: "WARNING" as const, message: `Airflow is unbalanced: ${intake} intake / ${exhaust} exhaust.`, affectedComponentIds: fans.map((fan) => fan.componentId) }];
  }
  return [];
};
