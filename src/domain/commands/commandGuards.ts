import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import type {
  ComponentDefinition,
  ComponentRegistry,
} from "../types/component";
import type { MountDefinition, MountRegistry } from "../types/mount";

export type DomainCommandErrorCode =
  | "COMPONENT_NOT_FOUND"
  | "MOUNT_NOT_FOUND"
  | "COMPONENT_ALREADY_INSTALLED"
  | "COMPONENT_NOT_INSTALLED"
  | "MOUNT_OCCUPIED"
  | "UNSUPPORTED_COMPONENT_TYPE"
  | "COMPONENT_DOES_NOT_FIT"
  | "CONNECTOR_NOT_FOUND"
  | "CONNECTOR_TYPE_MISMATCH"
  | "CONNECTOR_OCCUPIED"
  | "CONNECTION_ALREADY_EXISTS"
  | "CONNECTION_NOT_FOUND"
  | "NOTHING_TO_UNDO"
  | "UNDO_STALE";

export class DomainCommandError extends Error {
  constructor(
    public readonly code: DomainCommandErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainCommandError";
  }
}

export const getComponentOrThrow = (
  componentId: string,
  registry: ComponentRegistry = componentRegistry,
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
  registry: MountRegistry = mountRegistry,
): MountDefinition => {
  const mount = registry[mountId];

  if (!mount) {
    throw new DomainCommandError("MOUNT_NOT_FOUND", `Unknown mount: ${mountId}`);
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
      `${component.type} cannot be installed in ${mount.id}`,
    );
  }

  const { constraints } = mount;
  const exceedsDimensions =
    (constraints?.maxDepth !== undefined &&
      component.dimensions.depth > constraints.maxDepth) ||
    (constraints?.maxWidth !== undefined &&
      component.dimensions.width > constraints.maxWidth) ||
    (constraints?.maxHeight !== undefined &&
      component.dimensions.height > constraints.maxHeight);

  if (exceedsDimensions) {
    throw new DomainCommandError(
      "COMPONENT_DOES_NOT_FIT",
      `${component.name} does not fit in ${mount.id}`,
    );
  }
};
