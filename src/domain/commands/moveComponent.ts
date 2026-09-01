import type { Placement } from "../types/placement";
import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";

export interface MoveComponentInput {
  componentId: string;
  mountId: string;
}

export const moveComponent = (
  { componentId, mountId }: MoveComponentInput,
  options: DomainTransitionOptions = {},
): Placement => {
  const transition = commitDomainAction(
    { type: "MOVE_COMPONENT", componentId, mountId },
    options,
  );
  return transition.result as Placement;
};
