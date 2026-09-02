import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";
import type { BuildAssessment } from "../constraints/buildAssessment";
import type { Placement } from "../types/placement";

export interface ClearBuildOutcome {
  clearedComponentsCount: number;
  clearedConnectionsCount: number;
  clearedFanConfigsCount: number;
  activeCasePreserved: Placement;
  validation: BuildAssessment;
}

export const clearBuild = (
  input: { confirm: boolean },
  options: DomainTransitionOptions = {}
): ClearBuildOutcome => {
  const transition = commitDomainAction(
    { type: "CLEAR_BUILD", confirm: input?.confirm },
    options
  );
  return transition.result as ClearBuildOutcome;
};
