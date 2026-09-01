import { MAX_ACTIVITY_ENTRIES, cloneBuildState } from "../domain/activity";
import { componentRegistry } from "../domain/data/components";
import { mountRegistry } from "../domain/data/mounts";
import { resetCommandHistory } from "../domain/commands/commitDomainAction";
import type { BuildState } from "../domain/types/build";
import { buildStore } from "./buildStore";

const STORAGE_KEY = "pc-build-workspace:v1";

const normalizeState = (value: unknown): BuildState => {
  if (!value || typeof value !== "object") throw new TypeError("Build file must contain an object");
  const candidate = value as Partial<BuildState>;
  if (!Array.isArray(candidate.placements) || !Array.isArray(candidate.connections) ||
      !Array.isArray(candidate.fanConfigs) || !Array.isArray(candidate.activity)) {
    throw new TypeError("Build file is missing required state arrays");
  }

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
