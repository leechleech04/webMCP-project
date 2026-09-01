import type { ComponentDefinition, ComponentRegistry } from "../types/component";
import type { MountDefinition, MountRegistry } from "../types/mount";

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
