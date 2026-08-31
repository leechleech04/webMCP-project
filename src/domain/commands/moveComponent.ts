import { buildStore } from "../../store/buildStore";
import type { Placement } from "../types/placement";
import { applyDomainAction, type DomainTransitionOptions } from "./transition";

export interface MoveComponentInput {
  componentId: string;
  mountId: string;
}

export const moveComponent = (
  { componentId, mountId }: MoveComponentInput,
  options: DomainTransitionOptions = {},
): Placement => {
  const transition = applyDomainAction(
    buildStore.getState(),
    { type: "MOVE_COMPONENT", componentId, mountId },
    options,
  );
  buildStore.setState(transition.state);
  return transition.result as Placement;
};
