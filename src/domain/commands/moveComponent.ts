import { buildStore } from "../../store/buildStore";
import type { Placement } from "../types/placement";
import {
  assertComponentFitsMount,
  DomainCommandError,
  getComponentOrThrow,
  getMountOrThrow,
} from "./commandGuards";

export interface MoveComponentInput {
  componentId: string;
  mountId: string;
}

export const moveComponent = ({
  componentId,
  mountId,
}: MoveComponentInput): Placement => {
  const component = getComponentOrThrow(componentId);
  const mount = getMountOrThrow(mountId);
  const state = buildStore.getState();
  const currentPlacement = state.placements.find(
    (item) => item.componentId === componentId,
  );

  if (!currentPlacement) {
    throw new DomainCommandError(
      "COMPONENT_NOT_INSTALLED",
      `${component.name} is not installed`,
    );
  }

  if (currentPlacement.mountId === mountId) {
    return currentPlacement;
  }

  if (state.placements.some((item) => item.mountId === mountId)) {
    throw new DomainCommandError(
      "MOUNT_OCCUPIED",
      `${mount.id} is already occupied`,
    );
  }

  assertComponentFitsMount(component, mount);

  const placement = { componentId, mountId };
  buildStore.setState((current) => ({
    placements: current.placements.map((item) =>
      item.componentId === componentId ? placement : item,
    ),
  }));

  return placement;
};
