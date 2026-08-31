import { describe, expect, it } from "vitest";

import {
  getMountTransform,
  getRequiredMountTransform,
} from "./mountTransforms";

describe("mount transforms", () => {
  it("maps the PCIE domain mount to a stable 3D position", () => {
    expect(getMountTransform("pcie-slot-1")).toEqual({
      position: [-1, 2.6, -0.15],
    });
  });

  it("fails fast when a renderer transform is missing", () => {
    expect(() => getRequiredMountTransform("unknown-mount")).toThrow(
      "Missing scene transform for unknown-mount",
    );
  });
});
