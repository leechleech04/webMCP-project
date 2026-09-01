import { cloneBuildState } from "../activity";
import type { DomainAction } from "../types/action";
import { appendActivity, createActivityEntry } from "../activity";
import type { BuildState } from "../types/build";
import { buildStore } from "../../store/buildStore";
import {
  canUndoLastAgentAction,
  canRedoLastAction,
  canUndoLastAction,
  getTopologyRevision,
  incrementTopologyRevision,
  popUndoEntryOrThrow,
  popAnyUndoEntryOrThrow,
  pushUndoEntry,
  resetCommandHistory,
  restoreSnapshotState,
  restoreRedoState,
  snapshotTopology,
} from "./commandHistory";
import {
  applyDomainAction,
  type DomainTransitionOptions,
  type DomainTransitionResult,
} from "./transition";

export {
  canRedoLastAction,
  canUndoLastAction,
  canUndoLastAgentAction,
  getTopologyRevision,
  resetCommandHistory,
} from "./commandHistory";

const componentFingerprints = (state: BuildState): Map<string, string> => {
  const ids = new Set<string>();
  state.placements.forEach((item) => ids.add(item.componentId));
  state.fanConfigs.forEach((item) => ids.add(item.componentId));
  state.connections.forEach((item) => {
    ids.add(item.from.componentId);
    ids.add(item.to.componentId);
  });

  return new Map(
    [...ids].map((componentId) => [
      componentId,
      JSON.stringify({
        placement: state.placements.find((item) => item.componentId === componentId),
        fanConfig: state.fanConfigs.find((item) => item.componentId === componentId),
        connections: state.connections
          .filter(
            (item) =>
              item.from.componentId === componentId ||
              item.to.componentId === componentId,
          )
          .map((item) => item.id)
          .sort(),
      }),
    ]),
  );
};

const getAffectedComponentIds = (
  before: BuildState,
  after: BuildState,
): string[] => {
  const beforeFingerprints = componentFingerprints(before);
  const afterFingerprints = componentFingerprints(after);
  const ids = new Set([
    ...beforeFingerprints.keys(),
    ...afterFingerprints.keys(),
  ]);

  return [...ids]
    .filter(
      (componentId) =>
        beforeFingerprints.get(componentId) !==
        afterFingerprints.get(componentId),
    )
    .sort();
};

const actionLabel = (action: DomainAction): string =>
  action.type.replaceAll("_", " ").toLowerCase();

const annotateLatestActivity = (
  state: BuildState,
  previousActivityLength: number,
  affectedComponentIds: string[],
  undoable: boolean,
): BuildState => {
  const activity = state.activity.map((entry, index) => ({
    ...entry,
    affectedComponentIds: entry.affectedComponentIds
      ? [...entry.affectedComponentIds]
      : undefined,
    undoable: index === state.activity.length - 1 &&
      index >= previousActivityLength
      ? undoable
      : false,
  }));

  if (state.activity.length > previousActivityLength) {
    activity[activity.length - 1] = {
      ...activity[activity.length - 1],
      affectedComponentIds: [...affectedComponentIds],
      undoable,
    };
  }

  return { ...state, activity };
};

/**
 * The only mutating path for live domain commands. Pure simulation continues to
 * call applyDomainAction directly and therefore never advances this revision.
 */
export const commitDomainAction = (
  action: DomainAction,
  options: DomainTransitionOptions = {},
): DomainTransitionResult => {
  const before = cloneBuildState(buildStore.getState());
  const transition = applyDomainAction(before, action, options);
  const affectedComponentIds = getAffectedComponentIds(before, transition.state);
  const actor = options.actor ?? "USER";

  if (affectedComponentIds.length === 0) {
    return { ...transition, state: before };
  }

  const nextRevision = incrementTopologyRevision();
  const isUndoableAgentAction = actor === "AGENT";
  pushUndoEntry({
    appliedRevision: nextRevision,
    snapshot: snapshotTopology(before),
    redoSnapshot: snapshotTopology(transition.state),
    affectedComponentIds,
    message: actionLabel(action),
    actor,
  });

  const committedState = annotateLatestActivity(
    transition.state,
    before.activity.length,
    affectedComponentIds,
    isUndoableAgentAction,
  );
  buildStore.setState(committedState);

  return { ...transition, state: committedState };
};

export const commitDomainActions = (
  actions: DomainAction[],
  message: string,
  options: DomainTransitionOptions = {},
): DomainTransitionResult<unknown[]> => {
  const before = cloneBuildState(buildStore.getState());
  let projected = before;
  const results: unknown[] = [];

  for (const action of actions) {
    const transition = applyDomainAction(projected, action, {
      ...options,
      recordActivity: false,
    });
    projected = transition.state;
    results.push(transition.result);
  }

  const affectedComponentIds = getAffectedComponentIds(before, projected);
  if (affectedComponentIds.length === 0) {
    return { state: before, result: results };
  }

  const actor = options.actor ?? "USER";
  const nextRevision = incrementTopologyRevision();
  const isUndoableAgentAction = actor === "AGENT";
  pushUndoEntry({
    appliedRevision: nextRevision,
    snapshot: snapshotTopology(before),
    redoSnapshot: snapshotTopology(projected),
    affectedComponentIds,
    message,
    actor,
  });

  const committedState = appendActivity(projected, createActivityEntry({
    actor,
    message,
    affectedComponentIds,
    undoable: isUndoableAgentAction,
    now: options.now,
    createId: options.createId,
  }));
  buildStore.setState(committedState);
  return { state: committedState, result: results };
};

export const undoLastAgentAction = (): { affectedComponentIds: string[] } => {
  const entry = popUndoEntryOrThrow();
  const restored = restoreSnapshotState(buildStore.getState(), entry);
  buildStore.setState(restored);
  return { affectedComponentIds: [...entry.affectedComponentIds] };
};

export const undoLastAction = (): { affectedComponentIds: string[] } => {
  const entry = popAnyUndoEntryOrThrow();
  const restored = restoreSnapshotState(buildStore.getState(), entry);
  buildStore.setState(restored);
  return { affectedComponentIds: [...entry.affectedComponentIds] };
};

export const redoLastAction = (): { affectedComponentIds: string[] } => {
  const { state, entry } = restoreRedoState(buildStore.getState());
  buildStore.setState(state);
  return { affectedComponentIds: [...entry.affectedComponentIds] };
};
