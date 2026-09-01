import {
  appendActivity,
  cloneBuildState,
  createActivityEntry,
  type ActivitySource,
} from "../activity";
import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import type { DomainAction } from "../types/action";
import type { ActivityActor, BuildState } from "../types/build";
import type { ComponentRegistry } from "../types/component";
import type { MountRegistry } from "../types/mount";
import {
  assertComponentFitsMount,
  DomainCommandError,
  getComponentOrThrow,
  getMountOrThrow,
} from "./commandGuards";

export interface DomainTransitionOptions extends ActivitySource {
  componentRegistry?: ComponentRegistry;
  mountRegistry?: MountRegistry;
  actor?: ActivityActor;
  recordActivity?: boolean;
}

export interface DomainTransitionResult<T = unknown> {
  state: BuildState;
  result: T;
}

const mountLabel = (mountId: string): string => mountId.replaceAll("-", " ");

const withActivity = (
  state: BuildState,
  message: string,
  options: DomainTransitionOptions,
  affectedComponentIds: string[] = [],
): BuildState => {
  if (options.recordActivity === false) {
    return state;
  }

  return appendActivity(
    state,
    createActivityEntry({
      actor: options.actor ?? "USER",
      message,
      affectedComponentIds,
      now: options.now,
      createId: options.createId,
    }),
  );
};

const requireConnector = (
  componentId: string,
  connectorId: string,
  registry: ComponentRegistry,
) => {
  const component = getComponentOrThrow(componentId, registry);
  const connector = component.connectors?.find((item) => item.id === connectorId);

  if (!connector) {
    throw new DomainCommandError(
      "CONNECTOR_NOT_FOUND",
      `Unknown connector ${connectorId} on ${component.name}`,
    );
  }

  return connector;
};

export const applyDomainAction = (
  inputState: BuildState,
  action: DomainAction,
  options: DomainTransitionOptions = {},
): DomainTransitionResult => {
  const state = cloneBuildState(inputState);
  const components = options.componentRegistry ?? componentRegistry;
  const mounts = options.mountRegistry ?? mountRegistry;

  switch (action.type) {
    case "INSTALL_COMPONENT": {
      const component = getComponentOrThrow(action.componentId, components);
      const mount = getMountOrThrow(action.mountId, mounts);

      if (state.placements.some((item) => item.componentId === action.componentId)) {
        throw new DomainCommandError(
          "COMPONENT_ALREADY_INSTALLED",
          `${component.name} is already installed`,
        );
      }
      if (state.placements.some((item) => item.mountId === action.mountId)) {
        throw new DomainCommandError("MOUNT_OCCUPIED", `${mount.id} is already occupied`);
      }

      assertComponentFitsMount(component, mount);
      const placement = { componentId: action.componentId, mountId: action.mountId };
      return {
        state: withActivity(
          { ...state, placements: [...state.placements, placement] },
          `${component.name} installed at ${mountLabel(action.mountId)}`,
          options,
          [action.componentId],
        ),
        result: placement,
      };
    }

    case "MOVE_COMPONENT": {
      const component = getComponentOrThrow(action.componentId, components);
      const mount = getMountOrThrow(action.mountId, mounts);
      const currentPlacement = state.placements.find(
        (item) => item.componentId === action.componentId,
      );

      if (!currentPlacement) {
        throw new DomainCommandError(
          "COMPONENT_NOT_INSTALLED",
          `${component.name} is not installed`,
        );
      }
      if (
        currentPlacement.mountId !== action.mountId &&
        state.placements.some((item) => item.mountId === action.mountId)
      ) {
        throw new DomainCommandError("MOUNT_OCCUPIED", `${mount.id} is already occupied`);
      }

      assertComponentFitsMount(component, mount);
      const placement = { componentId: action.componentId, mountId: action.mountId };
      return {
        state: withActivity(
          {
            ...state,
            placements: state.placements.map((item) =>
              item.componentId === action.componentId ? placement : item,
            ),
          },
          `${component.name} moved to ${mountLabel(action.mountId)}`,
          options,
          [action.componentId],
        ),
        result: placement,
      };
    }

    case "REMOVE_COMPONENT": {
      const component = getComponentOrThrow(action.componentId, components);
      const placement = state.placements.find(
        (item) => item.componentId === action.componentId,
      );
      if (!placement) {
        throw new DomainCommandError(
          "COMPONENT_NOT_INSTALLED",
          `${component.name} is not installed`,
        );
      }

      return {
        state: withActivity(
          {
            ...state,
            placements: state.placements.filter((item) => item.componentId !== action.componentId),
            connections: state.connections.filter(
              (connection) =>
                connection.from.componentId !== action.componentId &&
                connection.to.componentId !== action.componentId,
            ),
            fanConfigs: state.fanConfigs.filter((config) => config.componentId !== action.componentId),
          },
          `${component.name} removed from the build`,
          options,
          [action.componentId],
        ),
        result: placement,
      };
    }

    case "CONNECT_COMPONENTS": {
      const fromComponent = getComponentOrThrow(action.fromComponentId, components);
      const toComponent = getComponentOrThrow(action.toComponentId, components);
      if (
        !state.placements.some((item) => item.componentId === action.fromComponentId) ||
        !state.placements.some((item) => item.componentId === action.toComponentId)
      ) {
        throw new DomainCommandError(
          "COMPONENT_NOT_INSTALLED",
          "Both connected components must be installed",
        );
      }
      const fromConnector = requireConnector(action.fromComponentId, action.fromConnectorId, components);
      const toConnector = requireConnector(action.toComponentId, action.toConnectorId, components);
      if (fromConnector.direction !== "OUTPUT" || toConnector.direction !== "INPUT") {
        throw new DomainCommandError("CONNECTOR_NOT_FOUND", "Connections must run from an output to an input");
      }
      if (fromConnector.type !== toConnector.type) {
        throw new DomainCommandError("CONNECTOR_TYPE_MISMATCH", `Cannot connect ${fromConnector.type} to ${toConnector.type}`);
      }
      if (state.connections.some((connection) => connection.to.componentId === action.toComponentId && connection.to.connectorId === action.toConnectorId)) {
        throw new DomainCommandError("CONNECTOR_OCCUPIED", `${action.toConnectorId} is already connected`);
      }
      const id = `${action.fromComponentId}:${action.fromConnectorId}->${action.toComponentId}:${action.toConnectorId}`;
      if (state.connections.some((connection) => connection.id === id)) {
        throw new DomainCommandError("CONNECTION_ALREADY_EXISTS", `Connection ${id} already exists`);
      }
      const connection = {
        id,
        from: { componentId: action.fromComponentId, connectorId: action.fromConnectorId },
        to: { componentId: action.toComponentId, connectorId: action.toConnectorId },
      };
      return {
        state: withActivity(
          { ...state, connections: [...state.connections, connection] },
          `${fromComponent.name} connected to ${toComponent.name}`,
          options,
          [action.fromComponentId, action.toComponentId],
        ),
        result: connection,
      };
    }

    case "DISCONNECT_COMPONENTS": {
      if (!state.connections.some((connection) => connection.id === action.connectionId)) {
        throw new DomainCommandError("CONNECTION_NOT_FOUND", `Unknown connection: ${action.connectionId}`);
      }
      return {
        state: withActivity(
          { ...state, connections: state.connections.filter((connection) => connection.id !== action.connectionId) },
          `Connection ${action.connectionId} removed`,
          options,
          [],
        ),
        result: action.connectionId,
      };
    }

    case "SET_FAN_DIRECTION": {
      const component = getComponentOrThrow(action.componentId, components);
      if (!state.placements.some((item) => item.componentId === action.componentId)) {
        throw new DomainCommandError("COMPONENT_NOT_INSTALLED", `${component.name} is not installed`);
      }
      const config = { componentId: action.componentId, direction: action.direction };
      return {
        state: withActivity(
          {
            ...state,
            fanConfigs: [
              ...state.fanConfigs.filter((item) => item.componentId !== action.componentId),
              config,
            ],
          },
          `${component.name} set to ${action.direction.toLowerCase()}`,
          options,
          [action.componentId],
        ),
        result: config,
      };
    }
  }
};
