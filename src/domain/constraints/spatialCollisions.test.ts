import { beforeEach, describe, expect, it } from "vitest";
import { caseProfiles } from "../cases/caseProfiles";
import { componentRegistry, components } from "../data/components";
import type { BuildState } from "../types/build";
import { autoFillBuild } from "../commands/autoFillBuild";
import { selectCase } from "../commands/selectCase";
import { installComponent } from "../commands/installComponent";
import { buildStore, resetBuildStore } from "../../store/buildStore";
import { getPlacementAabb, validateSpatialCollisions } from "./spatialCollisions";
import { mountRegistry } from "../data/mounts";
import { assertComponentFitsActiveCase } from "../commands/commandGuards";

const blank = (componentId: string): BuildState => ({
  placements: [{ componentId, mountId: "case-root" }], connections: [], fanConfigs: [], activity: [],
});

describe("physical 3D placement contracts", () => {
  beforeEach(() => resetBuildStore());

  it("keeps every individually compatible public product inside every case envelope", () => {
    for (const profile of caseProfiles) {
      for (const component of components.filter((item) => item.type !== "CASE")) {
        for (const mountId of profile.supportedMountIds) {
          const mount = mountRegistry[mountId];
          if (!mount?.supportedComponentTypes.includes(component.type)) continue;
          try {
            assertComponentFitsActiveCase(blank(profile.componentId), component, mount);
          } catch {
            continue;
          }
          const state = { ...blank(profile.componentId), placements: [...blank(profile.componentId).placements, { componentId: component.id, mountId }] };
          expect(validateSpatialCollisions(state), `${profile.id}:${component.id}:${mountId}`).toEqual([]);
        }
      }
    }
  });

  it("auto-fills every purchasable case without case-part or part-part intersections", () => {
    for (const product of components.filter((item) => item.type === "CASE")) {
      resetBuildStore();
      selectCase({ componentId: product.id });
      autoFillBuild();
      expect(validateSpatialCollisions(buildStore.getState()), product.id).toEqual([]);
    }
  });

  it("places air-cooler height on the motherboard normal and starts at the CPU face", () => {
    for (const profile of caseProfiles) {
      const cooler = componentRegistry["cooler-single-tower"];
      const transform = profile.mountTransforms["cpu-cooler-1"];
      const box = getPlacementAabb({ componentId: cooler.id, mountId: "cpu-cooler-1" }, cooler, transform);
      expect(box.max[0] - box.min[0], profile.id).toBeCloseTo(cooler.dimensions.height * 0.02, 6);
      expect(box.max[1] - box.min[1], profile.id).toBeCloseTo(cooler.dimensions.width * 0.02, 6);
      expect(box.min[0], profile.id).toBeCloseTo(transform.position[0], 6);
      expect(transform.position[1], profile.id).toBe(profile.mountTransforms["cpu-socket-1"].position[1]);
      expect(transform.position[2], profile.id).toBe(profile.mountTransforms["cpu-socket-1"].position[2]);
    }
  });

  it("rejects a manual part combination that would intersect in 3D", () => {
    selectCase({ componentId: "case-sff-01" });
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    expect(() => installComponent({ componentId: "fan-top-01", mountId: "fan-bottom-1" })).toThrow(/SPATIAL_COLLISION/);
    expect(buildStore.getState().placements.some((item) => item.mountId === "fan-bottom-1")).toBe(false);
  });
});
