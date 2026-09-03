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
  assertCoolingZoneAvailable,
  assertComponentFitsMount,
  assertComponentFitsActiveCase,
  DomainCommandError,
  getComponentOrThrow,
  getMountOrThrow,
} from "./commandGuards";
import { getRecommendedFanDirection } from "../cases/caseProfiles";
import { getActiveCaseProfile } from "../cases/getActiveCase";
import { generateAutoFillRecipe } from "../recipes/autoFillRecipe";
import { assessBuildState } from "../constraints/buildAssessment";
import { getProductId } from "../data/components";

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
): BuildState => {
  if (options.recordActivity === false) {
    return state;
  }

  return appendActivity(
    state,
    createActivityEntry({
      actor: options.actor ?? "USER",
      message,
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
    case "SELECT_CASE": {
      const component = getComponentOrThrow(action.componentId, components);
      if (component.type !== "CASE") {
        throw new DomainCommandError("INCOMPATIBLE_CASE", `${component.name} is not a CASE component`);
      }

      const profile = getActiveCaseProfile({
        ...state,
        placements: [{ componentId: action.componentId, mountId: "case-root" }],
      });

      const incompatible = state.placements.filter((p) => {
        if (p.mountId === "case-root") return false;
        const installedComponent = components[p.componentId];
        const installedMount = mounts[p.mountId];
        if (!installedComponent || !installedMount || !profile.supportedMountIds.includes(p.mountId)) {
          return true;
        }
        try {
          assertComponentFitsActiveCase(
            { ...state, placements: [{ componentId: action.componentId, mountId: "case-root" }] },
            installedComponent,
            installedMount,
          );
          return false;
        } catch {
          return true;
        }
      });

      if (incompatible.length > 0) {
        throw new DomainCommandError(
          "INCOMPATIBLE_CASE",
          `Cannot switch to ${component.name}: ${incompatible.map((p) => p.componentId).join(", ")} are incompatible with the selected case.`
        );
      }

      const nextPlacements = [
        ...state.placements.filter((p) => p.mountId !== "case-root"),
        { componentId: action.componentId, mountId: "case-root" },
      ];

      const placement = { componentId: action.componentId, mountId: "case-root" };
      return {
        state: withActivity(
          { ...state, placements: nextPlacements },
          `Case switched to ${component.name}`,
          options
        ),
        result: placement,
      };
    }

    case "INSTALL_COMPONENT": {
      const component = getComponentOrThrow(action.componentId, components);
      const mount = getMountOrThrow(action.mountId, mounts);

      const productId = getProductId(action.componentId);
      const installedProductInstances = state.placements.filter(
        (item) => (item.productId ?? getProductId(item.componentId)) === productId,
      );
      const maxPerBuild = component.maxPerBuild ?? 1;
      if (installedProductInstances.length >= maxPerBuild) {
        throw new DomainCommandError(
          "COMPONENT_ALREADY_INSTALLED",
          `${component.name} already has the maximum ${maxPerBuild} instance(s) installed`,
        );
      }
      if (state.placements.some((item) => item.mountId === action.mountId)) {
        throw new DomainCommandError("MOUNT_OCCUPIED", `${mount.id} is already occupied`);
      }

      assertComponentFitsActiveCase(state, component, mount);
      assertCoolingZoneAvailable(state, component, mount);
      let instanceId = productId;
      if (state.placements.some((item) => item.componentId === instanceId)) {
        let sequence = 2;
        while (state.placements.some((item) => item.componentId === `${productId}#${sequence}`)) sequence += 1;
        instanceId = `${productId}#${sequence}`;
      }
      const placement = {
        componentId: instanceId,
        ...(instanceId === productId ? {} : { productId }),
        mountId: action.mountId,
      };

      let nextFanConfigs = state.fanConfigs;
      if (component.type === "FAN") {
        const defaultDir = getRecommendedFanDirection(action.mountId);
        nextFanConfigs = [
          ...state.fanConfigs.filter((c) => c.componentId !== instanceId),
          { componentId: instanceId, direction: defaultDir, mountId: action.mountId },
        ];
      }

      return {
        state: withActivity(
          { ...state, placements: [...state.placements, placement], fanConfigs: nextFanConfigs },
          `${component.name} installed at ${mountLabel(action.mountId)}`,
          options,
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

      assertComponentFitsActiveCase(state, component, mount);
      assertCoolingZoneAvailable(state, component, mount);
      const placement = { componentId: action.componentId, mountId: action.mountId };

      let nextFanConfigs = state.fanConfigs;
      if (component.type === "FAN") {
        const existingCfg = state.fanConfigs.find((c) => c.componentId === action.componentId);
        nextFanConfigs = [
          ...state.fanConfigs.filter((c) => c.componentId !== action.componentId),
          {
            componentId: action.componentId,
            direction: existingCfg?.direction ?? getRecommendedFanDirection(action.mountId),
            mountId: action.mountId,
          },
        ];
      }

      return {
        state: withActivity(
          {
            ...state,
            placements: state.placements.map((item) =>
              item.componentId === action.componentId ? placement : item,
            ),
            fanConfigs: nextFanConfigs,
          },
          `${component.name} moved to ${mountLabel(action.mountId)}`,
          options,
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
        throw new DomainCommandError(
          "CONNECTOR_DIRECTION_INVALID",
          "Connections must run from an output to an input",
        );
      }
      if (fromConnector.type !== toConnector.type) {
        throw new DomainCommandError(
          "CONNECTOR_TYPE_MISMATCH",
          `Cannot connect ${fromConnector.type} to ${toConnector.type}`,
        );
      }
      const id = `${action.fromComponentId}:${action.fromConnectorId}->${action.toComponentId}:${action.toConnectorId}`;
      if (state.connections.some((connection) => connection.id === id)) {
        throw new DomainCommandError("CONNECTION_ALREADY_EXISTS", `Connection ${id} already exists`);
      }
      if (
        state.connections.some(
          (connection) =>
            connection.from.componentId === action.fromComponentId &&
            connection.from.connectorId === action.fromConnectorId,
        ) || state.connections.some(
          (connection) =>
            connection.to.componentId === action.toComponentId &&
            connection.to.connectorId === action.toConnectorId,
        )
      ) {
        throw new DomainCommandError(
          "CONNECTOR_OCCUPIED",
          `${action.toConnectorId} is already connected`,
        );
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
        ),
        result: action.connectionId,
      };
    }

    case "SET_FAN_DIRECTION": {
      const component = getComponentOrThrow(action.componentId, components);
      if (component.type !== "FAN") {
        throw new DomainCommandError("UNSUPPORTED_COMPONENT_TYPE", `${component.name} is not a fan`);
      }
      const placement = state.placements.find((item) => item.componentId === action.componentId);
      if (!placement) {
        throw new DomainCommandError("COMPONENT_NOT_INSTALLED", `${component.name} is not installed`);
      }
      const config = { componentId: action.componentId, direction: action.direction, mountId: placement.mountId };
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
        ),
        result: config,
      };
    }

    case "AUTO_FILL_BUILD": {
      const recipe = generateAutoFillRecipe(state);
      if (recipe.placements.length === 0 && recipe.connections.length === 0 && recipe.fanConfigs.length === 0) {
        throw new DomainCommandError("AUTO_FILL_NO_CHANGES", "Build already has all compatible slots filled for current case profile.");
      }

      let proposedState = state;
      try {
        for (const placement of recipe.placements) {
          proposedState = applyDomainAction(proposedState, {
            type: placement.mountId === "case-root" ? "SELECT_CASE" : "INSTALL_COMPONENT",
            componentId: placement.componentId,
            ...(placement.mountId === "case-root" ? {} : { mountId: placement.mountId }),
          } as DomainAction, { ...options, recordActivity: false }).state;
        }
        for (const connection of recipe.connections) {
          proposedState = applyDomainAction(proposedState, {
            type: "CONNECT_COMPONENTS",
            fromComponentId: connection.from.componentId,
            fromConnectorId: connection.from.connectorId,
            toComponentId: connection.to.componentId,
            toConnectorId: connection.to.connectorId,
          }, { ...options, recordActivity: false }).state;
        }
        for (const config of recipe.fanConfigs) {
          proposedState = applyDomainAction(proposedState, {
            type: "SET_FAN_DIRECTION",
            componentId: config.componentId,
            direction: config.direction,
          }, { ...options, recordActivity: false }).state;
        }
      } catch (error) {
        throw new DomainCommandError(
          "AUTO_FILL_BLOCKED",
          `Auto-fill was rolled back: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const validation = assessBuildState(proposedState);

      const outcome = {
        formFactor: recipe.formFactor,
        appliedPlacements: recipe.placements,
        appliedConnections: recipe.connections,
        appliedFanConfigs: recipe.fanConfigs,
        skippedMounts: [],
        validation,
      };

      return {
        state: withActivity(
          proposedState,
          `Auto-filled build for ${recipe.formFactor}: +${recipe.placements.length} components, +${recipe.connections.length} cables, +${recipe.fanConfigs.length} fan directions`,
          options,
        ),
        result: outcome,
      };
    }

    case "CLEAR_BUILD": {
      if (!action.confirm) {
        throw new DomainCommandError("CONFIRMATION_REQUIRED", "Clearing build requires explicit confirmation ({ confirm: true }).");
      }

      const activeCase = state.placements.find((p) => p.mountId === "case-root");
      const nonCasePlacements = state.placements.filter((p) => p.mountId !== "case-root");

      if (nonCasePlacements.length === 0 && state.connections.length === 0 && state.fanConfigs.length === 0) {
        throw new DomainCommandError("CLEAR_BUILD_NO_CHANGES", "Build is already empty. Nothing to clear.");
      }

      const preservedPlacements = activeCase ? [activeCase] : [{ componentId: "case-01", mountId: "case-root" }];

      const proposedState: BuildState = {
        ...state,
        placements: preservedPlacements,
        connections: [],
        fanConfigs: [],
      };

      const validation = assessBuildState(proposedState);

      const outcome = {
        clearedComponentsCount: nonCasePlacements.length,
        clearedConnectionsCount: state.connections.length,
        clearedFanConfigsCount: state.fanConfigs.length,
        activeCasePreserved: preservedPlacements[0],
        validation,
      };

      return {
        state: withActivity(
          proposedState,
          `Cleared build: removed ${nonCasePlacements.length} components, ${state.connections.length} cables. Case preserved.`,
          options,
        ),
        result: outcome,
      };
    }
  }
};
