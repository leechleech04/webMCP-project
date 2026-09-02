import { MAX_ACTIVITY_ENTRIES, cloneBuildState } from "../domain/activity";
import { componentRegistry } from "../domain/data/components";
import { mountRegistry } from "../domain/data/mounts";
import { resetCommandHistory } from "../domain/commands/commitDomainAction";
import {
  assertComponentFitsActiveCase,
  assertCoolingZoneAvailable,
} from "../domain/commands/commandGuards";
import { validateBuild } from "../domain/constraints/validateBuild";
import type { BuildState } from "../domain/types/build";
import { buildStore } from "./buildStore";

const STORAGE_KEY = "pc-build-workspace:v1";

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
};

const normalizeState = (value: unknown): BuildState => {
  if (!value || typeof value !== "object") throw new TypeError("Build file must contain an object");
  const candidate = value as Partial<BuildState>;
  if (!Array.isArray(candidate.placements) || !Array.isArray(candidate.connections) ||
      !Array.isArray(candidate.fanConfigs) || !Array.isArray(candidate.activity)) {
    throw new TypeError("Build file is missing required state arrays");
  }

  candidate.placements.forEach((placement, index) => {
    if (!isRecord(placement)) throw new TypeError(`placements[${index}] must be an object`);
    requireString(placement.componentId, `placements[${index}].componentId`);
    requireString(placement.mountId, `placements[${index}].mountId`);
  });
  candidate.connections.forEach((connection, index) => {
    if (!isRecord(connection) || !isRecord(connection.from) || !isRecord(connection.to)) {
      throw new TypeError(`connections[${index}] must contain from and to endpoints`);
    }
    requireString(connection.id, `connections[${index}].id`);
    requireString(connection.from.componentId, `connections[${index}].from.componentId`);
    requireString(connection.from.connectorId, `connections[${index}].from.connectorId`);
    requireString(connection.to.componentId, `connections[${index}].to.componentId`);
    requireString(connection.to.connectorId, `connections[${index}].to.connectorId`);
  });
  candidate.fanConfigs.forEach((config, index) => {
    if (!isRecord(config)) throw new TypeError(`fanConfigs[${index}] must be an object`);
    requireString(config.componentId, `fanConfigs[${index}].componentId`);
    if (config.direction !== "INTAKE" && config.direction !== "EXHAUST") {
      throw new TypeError(`fanConfigs[${index}].direction must be INTAKE or EXHAUST`);
    }
    if (config.mountId !== undefined) requireString(config.mountId, `fanConfigs[${index}].mountId`);
  });
  candidate.activity.forEach((entry, index) => {
    if (!isRecord(entry)) throw new TypeError(`activity[${index}] must be an object`);
    requireString(entry.id, `activity[${index}].id`);
    requireString(entry.message, `activity[${index}].message`);
    requireString(entry.createdAt, `activity[${index}].createdAt`);
    if (entry.actor !== "USER" && entry.actor !== "AGENT" && entry.actor !== "SYSTEM") {
      throw new TypeError(`activity[${index}].actor is invalid`);
    }
    if (entry.affectedComponentIds !== undefined &&
        (!Array.isArray(entry.affectedComponentIds) || entry.affectedComponentIds.some((id) => typeof id !== "string"))) {
      throw new TypeError(`activity[${index}].affectedComponentIds must be a string array`);
    }
    if (entry.undoable !== undefined && typeof entry.undoable !== "boolean") {
      throw new TypeError(`activity[${index}].undoable must be a boolean`);
    }
  });

  const state = cloneBuildState(candidate as BuildState);
  const componentIds = new Set<string>();
  const mountIds = new Set<string>();
  for (const placement of state.placements) {
    if (!componentRegistry[placement.componentId]) throw new TypeError(`Unknown component: ${placement.componentId}`);
    if (!mountRegistry[placement.mountId]) throw new TypeError(`Unknown mount: ${placement.mountId}`);
    if (componentIds.has(placement.componentId)) throw new TypeError(`Duplicate component: ${placement.componentId}`);
    if (mountIds.has(placement.mountId)) throw new TypeError(`Duplicate mount occupancy: ${placement.mountId}`);
    componentIds.add(placement.componentId);
    mountIds.add(placement.mountId);
  }

  for (const placement of state.placements) {
    const component = componentRegistry[placement.componentId];
    const mount = mountRegistry[placement.mountId];
    try {
      assertComponentFitsActiveCase(state, component, mount);
      assertCoolingZoneAvailable(state, component, mount);
    } catch (error) {
      throw new TypeError(error instanceof Error ? error.message : "Imported placement is incompatible");
    }
  }

  const connectionIds = new Set<string>();
  const occupiedEndpoints = new Set<string>();
  for (const connection of state.connections) {
    if (connectionIds.has(connection.id)) throw new TypeError(`Duplicate connection: ${connection.id}`);
    connectionIds.add(connection.id);
    if (!componentIds.has(connection.from.componentId) || !componentIds.has(connection.to.componentId)) {
      throw new TypeError(`Connection ${connection.id} references an uninstalled component`);
    }
    const from = componentRegistry[connection.from.componentId]?.connectors?.find(
      (connector) => connector.id === connection.from.connectorId,
    );
    const to = componentRegistry[connection.to.componentId]?.connectors?.find(
      (connector) => connector.id === connection.to.connectorId,
    );
    if (!from || !to) throw new TypeError(`Connection ${connection.id} references an unknown connector`);
    if (from.direction !== "OUTPUT" || to.direction !== "INPUT") {
      throw new TypeError(`Connection ${connection.id} must run from OUTPUT to INPUT`);
    }
    if (from.type !== to.type) throw new TypeError(`Connection ${connection.id} has mismatched connector types`);
    const expectedId = `${connection.from.componentId}:${connection.from.connectorId}->${connection.to.componentId}:${connection.to.connectorId}`;
    if (connection.id !== expectedId) throw new TypeError(`Connection ID must be ${expectedId}`);
    const endpointKeys = [
      `${connection.from.componentId}:${connection.from.connectorId}`,
      `${connection.to.componentId}:${connection.to.connectorId}`,
    ];
    if (endpointKeys.some((key) => occupiedEndpoints.has(key))) {
      throw new TypeError(`Connection ${connection.id} reuses an occupied connector`);
    }
    endpointKeys.forEach((key) => occupiedEndpoints.add(key));
  }

  const configuredFans = new Set<string>();
  for (const config of state.fanConfigs) {
    const component = componentRegistry[config.componentId];
    const placement = state.placements.find((item) => item.componentId === config.componentId);
    if (!component || component.type !== "FAN" || !placement) {
      throw new TypeError(`Fan configuration references an uninstalled fan: ${config.componentId}`);
    }
    if (configuredFans.has(config.componentId)) throw new TypeError(`Duplicate fan configuration: ${config.componentId}`);
    if (config.mountId !== undefined && config.mountId !== placement.mountId) {
      throw new TypeError(`Fan configuration mount does not match placement: ${config.componentId}`);
    }
    configuredFans.add(config.componentId);
  }

  const blockingIssues = validateBuild(state).filter((issue) => issue.severity === "ERROR");
  if (blockingIssues.length > 0) {
    throw new TypeError(`Imported build has blocking domain issues: ${blockingIssues.map((issue) => issue.id).join(", ")}`);
  }
  state.activity = state.activity.slice(-MAX_ACTIVITY_ENTRIES);
  return state;
};

export const exportBuildState = (): string => JSON.stringify({
  version: 1,
  exportedAt: new Date().toISOString(),
  build: getSerializableBuildState(),
}, null, 2);

const getSerializableBuildState = (): BuildState => cloneBuildState(buildStore.getState());

export const importBuildState = (json: string): BuildState => {
  const parsed = JSON.parse(json) as unknown;
  const state = normalizeState(
    parsed && typeof parsed === "object" && "build" in parsed
      ? (parsed as { build?: unknown }).build
      : parsed,
  );
  resetCommandHistory();
  buildStore.setState(state, true);
  return cloneBuildState(state);
};

export const initializeBuildStorePersistence = (): (() => void) => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      importBuildState(saved);
    } else if (!buildStore.getState().placements.some((placement) => placement.mountId === "case-root")) {
      buildStore.setState({
        ...buildStore.getState(),
        placements: [{ componentId: "case-01", mountId: "case-root" }],
      });
    }
  } catch (error) {
    console.warn("Stored build could not be restored; using the default case.", error);
    buildStore.setState({
      placements: [{ componentId: "case-01", mountId: "case-root" }],
      connections: [],
      fanConfigs: [],
      activity: [],
    }, true);
  }

  return buildStore.subscribe((state) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, build: cloneBuildState(state) }));
    } catch (error) {
      console.warn("Build state could not be persisted.", error);
    }
  });
};
