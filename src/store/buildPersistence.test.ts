import { beforeEach, describe, expect, it } from "vitest";
import { installComponent } from "../domain/commands/installComponent";
import { autoFillBuild } from "../domain/commands/autoFillBuild";
import { getBuildState, resetBuildStore } from "./buildStore";
import { exportBuildState, importBuildState } from "./buildPersistence";

describe("build persistence", () => {
  beforeEach(() => resetBuildStore());

  it("round-trips a detached build document", () => {
    autoFillBuild();
    const exported = exportBuildState();
    const expected = getBuildState();
    resetBuildStore();
    expect(importBuildState(exported)).toEqual(expected);
    expect(getBuildState()).toEqual(expected);
  });

  it("rejects invalid connection endpoints without replacing the live build", () => {
    autoFillBuild();
    const before = getBuildState();
    const invalid = JSON.parse(exportBuildState());
    invalid.build.connections[0].to.connectorId = "missing-connector";
    expect(() => importBuildState(JSON.stringify(invalid))).toThrow(/unknown connector/);
    expect(getBuildState()).toEqual(before);
  });

  it("rejects fan configuration for a non-fan component", () => {
    autoFillBuild();
    const before = getBuildState();
    const invalid = JSON.parse(exportBuildState());
    invalid.build.fanConfigs.push({ componentId: "gpu-01", direction: "INTAKE" });
    expect(() => importBuildState(JSON.stringify(invalid))).toThrow(/uninstalled fan/);
    expect(getBuildState()).toEqual(before);
  });

  it("rejects placements that violate shared mount compatibility", () => {
    const before = getBuildState();
    expect(() => importBuildState(JSON.stringify({
      placements: [{ componentId: "gpu-01", mountId: "psu-bay" }],
      connections: [],
      fanConfigs: [],
      activity: [],
    }))).toThrow(/incompatible with mount/);
    expect(getBuildState()).toEqual(before);
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
