import { beforeEach, describe, expect, it } from "vitest";
import { installComponent } from "../domain/commands/installComponent";
import { getBuildState, resetBuildStore } from "./buildStore";
import { exportBuildState, importBuildState } from "./buildPersistence";

describe("build persistence", () => {
  beforeEach(() => resetBuildStore());

  it("round-trips a detached build document", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const exported = exportBuildState();
    const expected = getBuildState();
    resetBuildStore();
    expect(importBuildState(exported)).toEqual(expected);
    expect(getBuildState()).toEqual(expected);
  });

  it("rejects unknown catalog references without replacing the live build", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const before = getBuildState();
    expect(() => importBuildState(JSON.stringify({
      placements: [{ componentId: "unknown", mountId: "pcie-slot-1" }],
      connections: [],
      fanConfigs: [],
      activity: [],
    }))).toThrow(/Unknown component/);
    expect(getBuildState()).toEqual(before);
  });
});
