import { appendActivity, cloneBuildState, createActivityEntry } from "../activity";
import type { DomainAction } from "../types/action";
import type { ActivityActor, BuildState } from "../types/build";
import { buildStore } from "../../store/buildStore";
import { applyDomainAction, type DomainTransitionOptions, type DomainTransitionResult } from "./transition";
import { DomainCommandError } from "./commandGuards";

interface TopologySnapshot {
  placements: BuildState["placements"];
  connections: BuildState["connections"];
  fanConfigs: BuildState["fanConfigs"];
}

interface UndoEntry {
  appliedRevision: number;
  snapshot: TopologySnapshot;
  affectedComponentIds: string[];
  message: string;
}

let topologyRevision = 0;
const undoStack: UndoEntry[] = [];

const snapshotTopology = (state: BuildState): TopologySnapshot => ({
  placements: state.placements.map((item) => ({ ...item })),
  connections: state.connections.map((item) => ({ ...item, from: { ...item.from }, to: { ...item.to } })),
  fanConfigs: state.fanConfigs.map((item) => ({ ...item })),
});

const affectedIds = (action: DomainAction): string[] => {
  if (action.type === "CONNECT_COMPONENTS") return [action.fromComponentId, action.toComponentId];
  if (action.type === "DISCONNECT_COMPONENTS") return [];
  return [action.componentId];
};

export const commitDomainAction = (
  action: DomainAction,
  options: DomainTransitionOptions = {},
): DomainTransitionResult => {
  const before = cloneBuildState(buildStore.getState());
  const transition = applyDomainAction(before, action, options);
  topologyRevision += 1;
  const actor: ActivityActor = options.actor ?? "USER";
  if (actor === "AGENT") {
    undoStack.push({
      appliedRevision: topologyRevision,
      snapshot: snapshotTopology(before),
      affectedComponentIds: affectedIds(action),
      message: action.type.replaceAll("_", " ").toLowerCase(),
    });
    const last = transition.state.activity.at(-1);
    if (last) last.undoable = true;
  }
  buildStore.setState(transition.state);
  return transition;
};

export const canUndoLastAgentAction = (): boolean =>
  undoStack.length > 0 && undoStack.at(-1)?.appliedRevision === topologyRevision;

export const undoLastAgentAction = (): { affectedComponentIds: string[] } => {
  const entry = undoStack.at(-1);
  if (!entry) throw new DomainCommandError("NOTHING_TO_UNDO", "There is no agent action to undo");
  if (entry.appliedRevision !== topologyRevision) {
    throw new DomainCommandError("UNDO_STALE", "Undo was blocked because the build changed after the agent action");
  }
  undoStack.pop();
  topologyRevision += 1;
  const current = cloneBuildState(buildStore.getState());
  buildStore.setState(appendActivity({
    ...current,
    placements: entry.snapshot.placements,
    connections: entry.snapshot.connections,
    fanConfigs: entry.snapshot.fanConfigs,
  }, createActivityEntry({
    actor: "SYSTEM",
    message: `Undid agent ${entry.message}`,
    affectedComponentIds: entry.affectedComponentIds,
  })));
  return { affectedComponentIds: entry.affectedComponentIds };
};

export const resetCommandHistory = (): void => {
  topologyRevision = 0;
  undoStack.length = 0;
};
