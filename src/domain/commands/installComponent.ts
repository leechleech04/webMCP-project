import type { Placement } from "../types/placement";
import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";

export interface InstallComponentInput {
  componentId: string;
  mountId: string;
}

export const installComponent = (
  { componentId, mountId }: InstallComponentInput,
  options: DomainTransitionOptions = {},
): Placement => {
  const transition = commitDomainAction({ type: "INSTALL_COMPONENT", componentId, mountId }, options);
  return transition.result as Placement;
};
