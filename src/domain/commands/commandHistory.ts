import { appendActivity, cloneBuildState, createActivityEntry } from "../activity";
import type { ActivityActor, BuildState } from "../types/build";
import { DomainCommandError } from "./commandGuards";

export interface TopologySnapshot {
  placements: BuildState["placements"];
  connections: BuildState["connections"];
  fanConfigs: BuildState["fanConfigs"];
}

export interface UndoEntry {
  appliedRevision: number;
  snapshot: TopologySnapshot;
  redoSnapshot: TopologySnapshot;
  affectedComponentIds: string[];
  message: string;
  actor: ActivityActor;
}

let topologyRevision = 0;
const undoStack: UndoEntry[] = [];
const redoStack: UndoEntry[] = [];
const MAX_HISTORY_ENTRIES = 100;

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
  if (undoStack.length > MAX_HISTORY_ENTRIES) undoStack.splice(0, undoStack.length - MAX_HISTORY_ENTRIES);
  redoStack.length = 0;
};

export const canUndoLastAgentAction = (): boolean =>
  undoStack.length > 0 &&
  undoStack.at(-1)?.actor === "AGENT" &&
  undoStack.at(-1)?.appliedRevision === topologyRevision;

export const canUndoLastAction = (): boolean =>
  undoStack.length > 0 && undoStack.at(-1)?.appliedRevision === topologyRevision;

export const canRedoLastAction = (): boolean => redoStack.length > 0;

export const popUndoEntryOrThrow = (): UndoEntry => {
  const entry = undoStack.at(-1);
  if (!entry) {
    throw new DomainCommandError(
      "NOTHING_TO_UNDO",
      "There is no agent action to undo",
    );
  }
  if (entry.actor !== "AGENT") {
    throw new DomainCommandError(
      "UNDO_STALE",
      "Undo was blocked because a later user action is now the latest change",
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

export const popAnyUndoEntryOrThrow = (): UndoEntry => {
  const entry = undoStack.at(-1);
  if (!entry) {
    throw new DomainCommandError("NOTHING_TO_UNDO", "There is no action to undo");
  }
  if (entry.appliedRevision !== topologyRevision) {
    throw new DomainCommandError("UNDO_STALE", "Undo history no longer matches the build revision");
  }
  undoStack.pop();
  return entry;
};

export const restoreSnapshotState = (
  currentState: BuildState,
  entry: UndoEntry,
): BuildState => {
  topologyRevision += 1;
  redoStack.push(entry);
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
      message: `Undid ${entry.message}`,
      affectedComponentIds: entry.affectedComponentIds,
    }),
  );
};

export const restoreRedoState = (currentState: BuildState): { state: BuildState; entry: UndoEntry } => {
  const entry = redoStack.pop();
  if (!entry) {
    throw new DomainCommandError("NOTHING_TO_UNDO", "There is no action to redo");
  }
  topologyRevision += 1;
  const current = cloneBuildState(currentState);
  const reapplied: UndoEntry = { ...entry, appliedRevision: topologyRevision };
  undoStack.push(reapplied);
  const state = appendActivity(
    {
      ...current,
      placements: entry.redoSnapshot.placements.map((item) => ({ ...item })),
      connections: entry.redoSnapshot.connections.map((item) => ({
        ...item,
        from: { ...item.from },
        to: { ...item.to },
      })),
      fanConfigs: entry.redoSnapshot.fanConfigs.map((item) => ({ ...item })),
      activity: current.activity.map((item) => ({ ...item, undoable: false })),
    },
    createActivityEntry({
      actor: "SYSTEM",
      message: `Redid ${entry.message}`,
      affectedComponentIds: entry.affectedComponentIds,
    }),
  );
  return { state, entry: reapplied };
};

export const resetCommandHistory = (): void => {
  topologyRevision = 0;
  undoStack.length = 0;
  redoStack.length = 0;
};
