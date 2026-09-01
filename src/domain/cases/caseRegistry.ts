import { caseProfiles } from "./caseProfiles";
import type { CaseProfile } from "./types";

export const caseProfileByComponentId = new Map<string, CaseProfile>();
for (const p of caseProfiles) {
  caseProfileByComponentId.set(p.componentId, p);
}
export { caseProfiles };
