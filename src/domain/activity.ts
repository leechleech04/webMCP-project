import type {
  ActivityActor,
  ActivityEntry,
  BuildState,
} from "./types/build";

export interface ActivitySource {
  now?: () => Date;
  createId?: () => string;
}

let activitySequence = 0;

export const createActivityEntry = ({
  actor,
  message,
  affectedComponentIds,
  undoable,
  now = () => new Date(),
  createId,
}: ActivitySource & {
  actor: ActivityActor;
  message: string;
  affectedComponentIds?: string[];
  undoable?: boolean;
}): ActivityEntry => {
  const createdAt = now();
  const id = createId?.() ?? `activity-${createdAt.getTime()}-${activitySequence++}`;

  return {
    id,
    actor,
    message,
    createdAt: createdAt.toISOString(),
    affectedComponentIds: affectedComponentIds ? [...affectedComponentIds] : undefined,
    undoable,
  };
};

export const appendActivity = (
  state: BuildState,
  entry: ActivityEntry,
): BuildState => ({
  ...state,
  activity: [...state.activity, entry],
});

export const cloneBuildState = (state: BuildState): BuildState => ({
  placements: state.placements.map((placement) => ({ ...placement })),
  connections: state.connections.map((connection) => ({
    ...connection,
    from: { ...connection.from },
    to: { ...connection.to },
  })),
  fanConfigs: state.fanConfigs.map((config) => ({ ...config })),
  activity: state.activity.map((entry) => ({
    ...entry,
    affectedComponentIds: entry.affectedComponentIds
      ? [...entry.affectedComponentIds]
      : undefined,
  })),
});
