import { componentRegistry as defaultComponents } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";

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
  const hasExplicitCase = state.placements.some((placement) => placement.mountId === "case-root");
  const shouldCheckMissing = context.enforceMissingPsu ?? (hasExplicitCase &&
    (powered.length > 0 || [...ids].some((id) => components[id]?.type === "MOTHERBOARD"))
  );
  if (powered.length === 0 && !shouldCheckMissing) return [];

  const installedPsus = [...ids]
    .map((id) => components[id])
    .filter((component) => component?.type === "PSU");
  if (installedPsus.length === 0) {
    if (!shouldCheckMissing) return [];
    return [{ id: "PSU_MISSING", type: "POWER" as const, severity: "ERROR" as const, message: "A PSU is required for the installed powered components.", affectedComponentIds: [...powered] }];
  }

  const psu = installedPsus[0];
  const load = [...ids].reduce((total, id) => total + (components[id]?.power?.consumption ?? 0), 0);
  const required = load * (1 + PSU_RESERVE_RATIO);
  const issues: Array<{ id: string; type: "POWER" | "CONNECTOR"; severity: "ERROR"; message: string; affectedComponentIds: string[] }> = [];
  if ((psu.power?.capacity ?? 0) < required) {
    issues.push({ id: "PSU_INSUFFICIENT_CAPACITY", type: "POWER", severity: "ERROR", message: `PSU capacity: ${psu.power?.capacity ?? 0} W; required with ${PSU_RESERVE_RATIO * 100}% reserve: ${required} W`, affectedComponentIds: [...powered, psu.id] });
  }

  const installedGpus = [...ids]
    .map((id) => components[id])
    .filter((component) => component?.type === "GPU");
  for (const gpu of installedGpus) {
    const requiredByType = new Map<string, number>();
    for (const connector of gpu.connectors?.filter((item) => item.direction === "INPUT" && ["PCIE_8PIN", "12V_2X6"].includes(item.type)) ?? []) {
      requiredByType.set(connector.type, (requiredByType.get(connector.type) ?? 0) + 1);
    }
    for (const [connectorType, requiredCount] of requiredByType) {
      const availableCount = psu.connectors?.filter((connector) => connector.direction === "OUTPUT" && connector.type === connectorType).length ?? 0;
      if (availableCount < requiredCount) {
        issues.push({ id: gpu.id === "gpu-01" ? "PSU_GPU_CONNECTOR_MISMATCH" : `PSU_GPU_CONNECTOR_MISMATCH:${gpu.id}`, type: "CONNECTOR", severity: "ERROR", message: `PSU exposes ${availableCount} compatible ${connectorType} output(s), but ${gpu.name} requires ${requiredCount}.`, affectedComponentIds: [gpu.id, psu.id] });
      }
    }
  }
  return issues;
};
