import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";
import type { Placement } from "../types/placement";

export const selectCase = (
  input: { componentId: string },
  options: DomainTransitionOptions = {}
): Placement => {
  const transition = commitDomainAction(
    { type: "SELECT_CASE", componentId: input.componentId },
    options
  );
  return transition.result as Placement;
};
