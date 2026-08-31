import { buildStore } from "../../store/buildStore";
import type { Placement } from "../types/placement";
import { applyDomainAction, type DomainTransitionOptions } from "./transition";

export interface InstallComponentInput {
  componentId: string;
  mountId: string;
}

export const installComponent = (
  { componentId, mountId }: InstallComponentInput,
  options: DomainTransitionOptions = {},
): Placement => {
  const transition = applyDomainAction(
    buildStore.getState(),
    { type: "INSTALL_COMPONENT", componentId, mountId },
    options,
  );
  buildStore.setState(transition.state);
  return transition.result as Placement;
};
