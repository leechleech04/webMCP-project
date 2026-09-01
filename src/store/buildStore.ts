import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { BuildState } from "../domain/types/build";
import { cloneBuildState } from "../domain/activity";
import { resetCommandHistory } from "../domain/commands/commandHistory";

export const initialBuildState: BuildState = {
  placements: [],
  connections: [],
  fanConfigs: [],
  activity: [],
};

export const buildStore = createStore<BuildState>(() => ({
  ...initialBuildState,
}));

export const useBuildStore = <T>(selector: (state: BuildState) => T): T =>
  useStore(buildStore, selector);

export const getBuildState = (): BuildState => {
  return cloneBuildState(buildStore.getState());
};

export const resetBuildStore = (): void => {
  buildStore.setState({ ...initialBuildState }, true);
  resetCommandHistory();
};
