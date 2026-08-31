import { buildStore } from "../../store/buildStore";
import type { Placement } from "../types/placement";
import {
  DomainCommandError,
  getComponentOrThrow,
} from "./commandGuards";

export interface RemoveComponentInput {
  componentId: string;
}

export const removeComponent = ({
  componentId,
}: RemoveComponentInput): Placement => {
  const component = getComponentOrThrow(componentId);
  const state = buildStore.getState();
  const placement = state.placements.find(
    (item) => item.componentId === componentId,
  );

  if (!placement) {
    throw new DomainCommandError(
      "COMPONENT_NOT_INSTALLED",
      `${component.name} is not installed`,
    );
  }

  buildStore.setState((current) => ({
    placements: current.placements.filter(
      (item) => item.componentId !== componentId,
    ),
    connections: current.connections.filter(
      (connection) =>
        connection.from.componentId !== componentId &&
        connection.to.componentId !== componentId,
    ),
    fanConfigs: current.fanConfigs.filter(
      (config) => config.componentId !== componentId,
    ),
  }));

  return placement;
};
