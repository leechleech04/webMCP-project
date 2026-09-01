import type { BuildState } from "../types/build";
import type { CaseProfile } from "./types";
import { caseProfiles } from "./caseProfiles";

export const getActiveCaseProfile = (state?: BuildState): CaseProfile => {
  if (!state || !state.placements) {
    return caseProfiles[2];
  }
  const root = state.placements.find((p) => p.mountId === "case-root");
  if (root) {
    const matched = caseProfiles.find((c) => c.componentId === root.componentId);
    if (matched) return matched;
  }
  return caseProfiles[2];
};
