import { buildStore } from "../../store/buildStore";
import type { Placement } from "../types/placement";
import {
  assertComponentFitsMount,
  DomainCommandError,
  getComponentOrThrow,
  getMountOrThrow,
} from "./commandGuards";

export interface InstallComponentInput {
  componentId: string;
  mountId: string;
}

export const installComponent = ({
  componentId,
  mountId,
}: InstallComponentInput): Placement => {
  const component = getComponentOrThrow(componentId);
  const mount = getMountOrThrow(mountId);
  const state = buildStore.getState();

  if (state.placements.some((item) => item.componentId === componentId)) {
    throw new DomainCommandError(
      "COMPONENT_ALREADY_INSTALLED",
      `${component.name} is already installed`,
    );
  }

  if (state.placements.some((item) => item.mountId === mountId)) {
    throw new DomainCommandError(
      "MOUNT_OCCUPIED",
      `${mount.label} is already occupied`,
    );
  }

  assertComponentFitsMount(component, mount);

  const placement = { componentId, mountId };
  buildStore.setState((current) => ({
    placements: [...current.placements, placement],
  }));

  return placement;
};
