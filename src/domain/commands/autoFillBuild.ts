import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";
import type { BuildAssessment } from "../constraints/buildAssessment";
import type { Placement } from "../types/placement";
import type { Connection } from "../types/connection";
import type { FanConfig } from "../types/build";

export interface AutoFillOutcome {
  formFactor: string;
  appliedPlacements: Placement[];
  appliedConnections: Connection[];
  appliedFanConfigs: FanConfig[];
  skippedMounts: string[];
  validation: BuildAssessment;
}

export const autoFillBuild = (
  options: DomainTransitionOptions = {}
): AutoFillOutcome => {
  const transition = commitDomainAction(
    { type: "AUTO_FILL_BUILD" },
    options
  );
  return transition.result as AutoFillOutcome;
};
