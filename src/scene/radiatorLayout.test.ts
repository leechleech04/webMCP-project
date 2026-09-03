import { describe, expect, it } from "vitest";

import { caseProfiles } from "../domain/cases/caseProfiles";
import { componentRegistry } from "../domain/data/components";
import {
  RADIATOR_FRONT_ROTATION,
  RADIATOR_TOP_ROTATION,
} from "./mountTransforms";
import { getRadiatorLayout } from "./radiatorLayout";

const radiatorIds = [
  "radiator-120-01",
  "radiator-240-01",
  "radiator-01",
] as const;

describe("radiator layout and mount contracts", () => {
  it.each([
    ["radiator-120-01", 1],
    ["radiator-240-01", 2],
    ["radiator-01", 3],
  ] as const)("derives the correct fan count for %s", (componentId, fanCount) => {
    const component = componentRegistry[componentId];
    expect(getRadiatorLayout(component.dimensions).fanCount).toBe(fanCount);
  });

  it.each(radiatorIds)("keeps every fan inside the %s radiator envelope", (componentId) => {
    const component = componentRegistry[componentId];
    const layout = getRadiatorLayout(component.dimensions);

    for (const offset of layout.fanOffsets) {
      expect(Math.abs(offset) + layout.fanSize / 2).toBeLessThanOrEqual(
        layout.length / 2,
      );
    }
  });

  it("uses one canonical inward-facing orientation across every case", () => {
    for (const profile of caseProfiles) {
      expect(profile.mountTransforms["radiator-top"].rotation).toEqual(
        RADIATOR_TOP_ROTATION,
      );
      expect(profile.mountTransforms["radiator-front"].rotation).toEqual(
        RADIATOR_FRONT_ROTATION,
      );
    }
  });

  it("only permits radiator lengths that fit each case envelope", () => {
    for (const profile of caseProfiles) {
      const topLimit = profile.clearanceLimits["radiator-top"]?.maxDepth ?? 0;
      const frontLimit = profile.clearanceLimits["radiator-front"]?.maxDepth ?? 0;

      expect(topLimit).toBeLessThanOrEqual(profile.dimensionsMm.depth);
      expect(frontLimit).toBeLessThanOrEqual(profile.dimensionsMm.height);
    }
  });
});
