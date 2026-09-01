import { appendActivity, cloneBuildState, createActivityEntry } from "../activity";
import type { BuildState } from "../types/build";
import { DomainCommandError } from "./commandGuards";

export interface TopologySnapshot {
  placements: BuildState["placements"];
  connections: BuildState["connections"];
  fanConfigs: BuildState["fanConfigs"];
}

export interface UndoEntry {
  appliedRevision: number;
  snapshot: TopologySnapshot;
  affectedComponentIds: string[];
  message: string;
}

let topologyRevision = 0;
const undoStack: UndoEntry[] = [];

export const snapshotTopology = (state: BuildState): TopologySnapshot => ({
  placements: state.placements.map((item) => ({ ...item })),
  connections: state.connections.map((item) => ({
    ...item,
    from: { ...item.from },
    to: { ...item.to },
  })),
  fanConfigs: state.fanConfigs.map((item) => ({ ...item })),
});

export const getTopologyRevision = (): number => topologyRevision;

export const incrementTopologyRevision = (): number => {
  topologyRevision += 1;
  return topologyRevision;
};

export const pushUndoEntry = (entry: UndoEntry): void => {
  undoStack.push(entry);
};

export const canUndoLastAgentAction = (): boolean =>
  undoStack.length > 0 &&
  undoStack.at(-1)?.appliedRevision === topologyRevision;

export const popUndoEntryOrThrow = (): UndoEntry => {
  const entry = undoStack.at(-1);
  if (!entry) {
    throw new DomainCommandError(
      "NOTHING_TO_UNDO",
      "There is no agent action to undo",
    );
  }
  if (entry.appliedRevision !== topologyRevision) {
    throw new DomainCommandError(
      "UNDO_STALE",
      "Undo was blocked because the build changed after the agent action",
    );
  }
  undoStack.pop();
  return entry;
};

export const restoreSnapshotState = (
  currentState: BuildState,
  entry: UndoEntry,
): BuildState => {
  topologyRevision += 1;
  const current = cloneBuildState(currentState);
  return appendActivity(
    {
      ...current,
      placements: entry.snapshot.placements.map((item) => ({ ...item })),
      connections: entry.snapshot.connections.map((item) => ({
        ...item,
        from: { ...item.from },
        to: { ...item.to },
      })),
      fanConfigs: entry.snapshot.fanConfigs.map((item) => ({ ...item })),
      activity: current.activity.map((item) => ({ ...item, undoable: false })),
    },
    createActivityEntry({
      actor: "SYSTEM",
      message: `Undid agent ${entry.message}`,
      affectedComponentIds: entry.affectedComponentIds,
    }),
  );
};

export const resetCommandHistory = (): void => {
  topologyRevision = 0;
  undoStack.length = 0;
};
