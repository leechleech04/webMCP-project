import { buildStore } from "../../store/buildStore";
import type { Placement } from "../types/placement";
import { applyDomainAction, type DomainTransitionOptions } from "./transition";

export interface RemoveComponentInput {
  componentId: string;
}

export const removeComponent = (
  { componentId }: RemoveComponentInput,
  options: DomainTransitionOptions = {},
): Placement => {
  const transition = applyDomainAction(
    buildStore.getState(),
    { type: "REMOVE_COMPONENT", componentId },
    options,
  );
  buildStore.setState(transition.state);
  return transition.result as Placement;
};
