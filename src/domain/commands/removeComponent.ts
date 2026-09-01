import type { Placement } from "../types/placement";
import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";

export interface RemoveComponentInput {
  componentId: string;
}

export const removeComponent = (
  { componentId }: RemoveComponentInput,
  options: DomainTransitionOptions = {},
): Placement => {
  const transition = commitDomainAction({ type: "REMOVE_COMPONENT", componentId }, options);
  return transition.result as Placement;
};
