import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { BuildState } from "../domain/types/build";

export const initialBuildState: BuildState = {
  placements: [],
  connections: [],
  fanConfigs: [],
  activity: [],
};

export const demoInitialBuildState: BuildState = {
  placements: [
    { componentId: "case-01", mountId: "workspace-root" },
    { componentId: "motherboard-01", mountId: "motherboard-tray" },
  ],
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
  const state = buildStore.getState();

  return {
    placements: state.placements.map((placement) => ({ ...placement })),
    connections: state.connections.map((connection) => ({
      ...connection,
      from: { ...connection.from },
      to: { ...connection.to },
    })),
    fanConfigs: state.fanConfigs.map((config) => ({ ...config })),
    activity: state.activity.map((entry) => ({ ...entry })),
  };
};

export const resetBuildStore = (): void => {
  buildStore.setState({ ...initialBuildState }, true);
};

export const initializeDemoBuild = (): void => {
  buildStore.setState({
    placements: demoInitialBuildState.placements.map((placement) => ({ ...placement })),
    connections: [],
    fanConfigs: [],
    activity: [],
  }, true);
};
