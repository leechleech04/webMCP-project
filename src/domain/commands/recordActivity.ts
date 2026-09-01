import { buildStore } from "../../store/buildStore";
import {
  appendActivity,
  cloneBuildState,
  createActivityEntry,
  type ActivitySource,
} from "../activity";
import type { ActivityActor } from "../types/build";

export interface RecordActivityInput {
  actor: ActivityActor;
  message: string;
  affectedComponentIds?: string[];
}

export const recordActivity = (
  { actor, message, affectedComponentIds }: RecordActivityInput,
  source: ActivitySource = {},
): void => {
  const state = cloneBuildState(buildStore.getState());
  buildStore.setState(
    appendActivity(
      state,
      createActivityEntry({ ...source, actor, message, affectedComponentIds }),
    ),
  );
};
