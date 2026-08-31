import { describe, expect, it } from "vitest";

import { componentRegistry } from "../domain/data/components";
import { mounts } from "../domain/data/mounts";
import { modelRegistry } from "./modelRegistry";
import {
  getMountTransform,
  getRequiredMountTransform,
} from "./mountTransforms";

describe("mount transforms", () => {
  it("maps the PCIE domain mount to a stable 3D position", () => {
    expect(getMountTransform("pcie-slot-1")).toEqual({
      position: [-0.5, 3, 0],
      rotation: [0, 0, 0],
    });
  });

  it("maps radiator mount IDs to distinct position and rotation transforms", () => {
    expect(getRequiredMountTransform("radiator-front")).toEqual({
      position: [0, 4.9, 4.35],
      rotation: [0, 0, Math.PI / 2],
    });
    expect(getRequiredMountTransform("radiator-top")).toEqual({
      position: [0, 9.3, 0],
      rotation: [Math.PI / 2, 0, Math.PI / 2],
    });
  });

  it("fails fast when a renderer transform is missing", () => {
    expect(() => getRequiredMountTransform("unknown-mount")).toThrow(
      "Missing scene transform for unknown-mount",
    );
  });

  it("defines transforms for every compatible mount of a registered scene model", () => {
    Object.keys(modelRegistry).forEach((componentId) => {
      const component = componentRegistry[componentId];
      const compatibleMounts = mounts.filter((mount) =>
        mount.supportedComponentTypes.includes(component.type),
      );

      expect(compatibleMounts.length).toBeGreaterThan(0);
      compatibleMounts.forEach((mount) => {
        expect(getMountTransform(mount.id), mount.id).toBeDefined();
      });
    });
  });
});
