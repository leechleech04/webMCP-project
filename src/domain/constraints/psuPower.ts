import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import { GPU_ID, PSU_ID } from "./constraintIds";

/** Named MVP reserve policy: installed capacity must cover load plus 20%. */
export const PSU_RESERVE_RATIO = 0.2;

export interface PsuContext {
  componentRegistry?: ComponentRegistry;
  enforceMissingPsu?: boolean;
}

export const validatePsu = (state: BuildState, context: PsuContext = {}) => {
  const components = context.componentRegistry ?? defaultComponents;
  const ids = new Set(state.placements.map((item) => item.componentId));
  const powered = [...ids].filter((id) => components[id]?.power?.consumption !== undefined);
  const shouldCheckMissing = context.enforceMissingPsu ?? ids.has("motherboard-01");
  if (powered.length === 0 && !shouldCheckMissing) return [];

  const psu = components[PSU_ID];
  if (!psu || !ids.has(PSU_ID)) {
    if (!shouldCheckMissing) return [];
    return [{ id: "PSU_MISSING", type: "POWER" as const, severity: "ERROR" as const, category: "COMPLETENESS" as const, message: "A PSU is required for the installed powered components.", affectedComponentIds: [...powered, PSU_ID] }];
  }

  const load = [...ids].reduce((total, id) => total + (components[id]?.power?.consumption ?? 0), 0);
  const required = load * (1 + PSU_RESERVE_RATIO);
  const issues: Array<{ id: string; type: "POWER" | "CONNECTOR"; severity: "ERROR"; message: string; affectedComponentIds: string[] }> = [];
  if ((psu.power?.capacity ?? 0) < required) {
    issues.push({ id: "PSU_INSUFFICIENT_CAPACITY", type: "POWER", severity: "ERROR", message: `PSU capacity: ${psu.power?.capacity ?? 0} W; required with ${PSU_RESERVE_RATIO * 100}% reserve: ${required} W`, affectedComponentIds: [...powered, PSU_ID] });
  }

  const gpu = components[GPU_ID];
  const gpuConnector = gpu?.connectors?.find((connector) => connector.direction === "INPUT" && ["PCIE_8PIN", "12V_2X6"].includes(connector.type));
  const compatible = gpuConnector && psu.connectors?.some((connector) => connector.direction === "OUTPUT" && connector.type === gpuConnector.type);
  if (ids.has(GPU_ID) && gpuConnector && !compatible) {
    issues.push({ id: "PSU_GPU_CONNECTOR_MISMATCH", type: "CONNECTOR", severity: "ERROR", message: `PSU does not expose a compatible ${gpuConnector.type} output for the GPU.`, affectedComponentIds: [GPU_ID, PSU_ID] });
  }
  return issues;
};
