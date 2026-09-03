import type { ComponentDefinition, ComponentRegistry } from "../types/component";
import type { MountDefinition, MountRegistry } from "../types/mount";
import type { BuildState } from "../types/build";
import { getActiveCaseProfile } from "../cases/getActiveCase";

export type DomainErrorCode =
  | "COMPONENT_NOT_FOUND"
  | "MOUNT_NOT_FOUND"
  | "COMPONENT_ALREADY_INSTALLED"
  | "COMPONENT_NOT_INSTALLED"
  | "MOUNT_OCCUPIED"
  | "UNSUPPORTED_COMPONENT_TYPE"
  | "COMPONENT_DOES_NOT_FIT"
  | "INCOMPATIBLE_MOUNT"
  | "INCOMPATIBLE_CASE"
  | "CASE_REQUIRED"
  | "CONNECTOR_NOT_FOUND"
  | "CONNECTOR_DIRECTION_INVALID"
  | "CONNECTOR_TYPE_MISMATCH"
  | "CONNECTOR_OCCUPIED"
  | "CONNECTION_ALREADY_EXISTS"
  | "CONNECTION_NOT_FOUND"
  | "NOTHING_TO_UNDO"
  | "UNDO_STALE"
  | "NO_COMPATIBLE_FAN_MOUNT"
  | "FAN_MOUNT_NOT_EXPOSED"
  | "FAN_DIRECTION_METADATA_MISSING"
  | "AUTO_FILL_BLOCKED"
  | "AUTO_FILL_NO_CHANGES"
  | "CLEAR_BUILD_NO_CHANGES"
  | "CONFIRMATION_REQUIRED";

export class DomainCommandError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = "DomainCommandError";
    this.code = code;
  }
}

export const getComponentOrThrow = (
  componentId: string,
  registry: ComponentRegistry,
): ComponentDefinition => {
  const component = registry[componentId];
  if (!component) {
    throw new DomainCommandError(
      "COMPONENT_NOT_FOUND",
      `Unknown component: ${componentId}`,
    );
  }
  return component;
};

export const getMountOrThrow = (
  mountId: string,
  registry: MountRegistry,
): MountDefinition => {
  const mount = registry[mountId];
  if (!mount) {
    throw new DomainCommandError(
      "MOUNT_NOT_FOUND",
      `Unknown mount: ${mountId}`,
    );
  }
  return mount;
};

export const assertComponentFitsMount = (
  component: ComponentDefinition,
  mount: MountDefinition,
): void => {
  if (!mount.supportedComponentTypes.includes(component.type)) {
    throw new DomainCommandError(
      "UNSUPPORTED_COMPONENT_TYPE",
      `Component ${component.name} (${component.type}) is incompatible with mount ${mount.id}`,
    );
  }

  if (component.type === "STORAGE" && mount.supportedStorageFormFactors &&
      !mount.supportedStorageFormFactors.includes(component.compatibility?.storageFormFactor ?? "M2_2280")) {
    throw new DomainCommandError(
      "UNSUPPORTED_COMPONENT_TYPE",
      `${component.name} cannot use the ${mount.id} storage form factor`,
    );
  }

  if (mount.constraints && component.dimensions) {
    const { maxWidth, maxHeight, maxDepth } = mount.constraints;
    const { width, height, depth } = component.dimensions;

    if (
      (maxWidth !== undefined && width > maxWidth) ||
      (maxHeight !== undefined && height > maxHeight) ||
      (maxDepth !== undefined && depth > maxDepth)
    ) {
      throw new DomainCommandError(
        "COMPONENT_DOES_NOT_FIT",
        `Component ${component.name} exceeds dimensions for mount ${mount.id}`,
      );
    }
  }
};

export const assertComponentFitsActiveCase = (
  state: BuildState,
  component: ComponentDefinition,
  mount: MountDefinition,
): void => {
  const profile = getActiveCaseProfile(state);
  if (mount.id !== "case-root" && !profile.supportedMountIds.includes(mount.id)) {
    throw new DomainCommandError(
      "INCOMPATIBLE_MOUNT",
      `Mount ${mount.id} is not available in ${profile.label}`,
    );
  }

  if (component.type === "FAN") {
    const fanMount = profile.fanMounts.find((item) => item.mountId === mount.id);
    if (fanMount && component.dimensions.width > fanMount.sizeMm) {
      throw new DomainCommandError(
        "COMPONENT_DOES_NOT_FIT",
        `${component.name} is ${component.dimensions.width}mm but ${mount.id} supports up to ${fanMount.sizeMm}mm`,
      );
    }
  }

  const profileLimit = profile.clearanceLimits[mount.id];
  assertComponentFitsMount(component, {
    ...mount,
    constraints: {
      maxWidth: profileLimit?.maxWidth ?? mount.constraints?.maxWidth,
      maxHeight: profileLimit?.maxHeight ?? mount.constraints?.maxHeight,
      maxDepth: profileLimit?.maxDepth ?? mount.constraints?.maxDepth,
    },
  });
};

const coolingZoneForMount = (mountId: string): "top" | "front" | undefined => {
  if (mountId === "radiator-top" || mountId.startsWith("fan-top-")) {
    return "top";
  }
  if (mountId === "radiator-front" || mountId.startsWith("fan-front-")) {
    return "front";
  }
  return undefined;
};

/**
 * The procedural AIO already includes its own fans, so an AIO and standalone
 * case fans cannot occupy the same top/front rail in this MVP geometry model.
 */
export const assertCoolingZoneAvailable = (
  state: BuildState,
  component: ComponentDefinition,
  mount: MountDefinition,
): void => {
  const zone = coolingZoneForMount(mount.id);
  if (!zone || (component.type !== "RADIATOR" && component.type !== "FAN")) {
    return;
  }

  const conflictingPlacement = state.placements.find((placement) => {
    if (placement.componentId === component.id) return false;
    if (component.type === "RADIATOR") {
      return placement.mountId.startsWith(`fan-${zone}-`);
    }
    return placement.mountId === `radiator-${zone}`;
  });

  if (conflictingPlacement) {
    throw new DomainCommandError(
      "MOUNT_OCCUPIED",
      `${mount.id} shares the ${zone} cooling rail with ${conflictingPlacement.componentId}`,
    );
  }
};
