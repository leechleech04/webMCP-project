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

  it("exports v2 while accepting a valid v1 document", () => {
    const v1 = {
      version: 1,
      build: {
        placements: [{ componentId: "case-01", mountId: "case-root" }],
        connections: [], fanConfigs: [], activity: [],
      },
    };
    expect(importBuildState(JSON.stringify(v1)).placements).toEqual(v1.build.placements);
    expect(JSON.parse(exportBuildState()).version).toBe(2);
  });

  it("migrates legacy PSU and repeated fan IDs together with their references", () => {
    const v1 = {
      version: 1,
      build: {
        placements: [
          { componentId: "case-01", mountId: "case-root" },
          { componentId: "motherboard-01", mountId: "motherboard-tray" },
          { componentId: "psu-01", mountId: "psu-bay" },
          { componentId: "fan-front-01", mountId: "fan-front-1" },
          { componentId: "fan-rear-01", mountId: "fan-rear-1" },
        ],
        connections: [{
          id: "psu-01:psu-atx-01->motherboard-01:motherboard-atx",
          from: { componentId: "psu-01", connectorId: "psu-atx-01" },
          to: { componentId: "motherboard-01", connectorId: "motherboard-atx" },
        }],
        fanConfigs: [
          { componentId: "fan-front-01", direction: "INTAKE", mountId: "fan-front-1" },
          { componentId: "fan-rear-01", direction: "EXHAUST", mountId: "fan-rear-1" },
        ],
        activity: [],
      },
    };
    const migrated = importBuildState(JSON.stringify(v1));
    expect(migrated.placements).toContainEqual({ componentId: "psu-atx-short-850", mountId: "psu-bay" });
    expect(migrated.placements).toContainEqual({ componentId: "fan-top-01#2", productId: "fan-top-01", mountId: "fan-rear-1" });
    expect(migrated.connections[0].id).toBe("psu-atx-short-850:psu-atx-01->motherboard-01:motherboard-atx");
    expect(migrated.fanConfigs.map((config) => config.componentId)).toEqual(["fan-top-01", "fan-top-01#2"]);
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
