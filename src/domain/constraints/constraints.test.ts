import { describe, expect, it } from "vitest";

import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import { validateAirflow } from "./airflow";
import { validateGpuCable } from "./gpuCableClearance";
import { validateGpuRadiatorClearance } from "./gpuRadiatorClearance";
import { assessBuild } from "./validateBuild";
import { validatePsu } from "./psuPower";
import type { BuildState } from "../types/build";

const emptyState = (): BuildState => ({ placements: [], connections: [], fanConfigs: [], activity: [] });

describe("GPU and radiator clearance", () => {
  it.each([
    ["empty state", []],
    ["GPU only", [{ componentId: "gpu-01", mountId: "pcie-slot-1" }]],
    ["radiator only", [{ componentId: "radiator-01", mountId: "radiator-front" }]],
    ["radiator at top", [
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { componentId: "radiator-01", mountId: "radiator-top" },
    ]],
  ])("returns no issue for %s", (_label, placements) => {
    expect(validateGpuRadiatorClearance({ ...emptyState(), placements })).toEqual([]);
  });

  it("returns one stable front-collision issue with measured values", () => {
    const state = {
      ...emptyState(),
      placements: [
        { componentId: "gpu-01", mountId: "pcie-slot-1" },
        { componentId: "radiator-01", mountId: "radiator-front" },
      ],
    };
    const before = structuredClone(state);
    const first = validateGpuRadiatorClearance(state);
    const second = validateGpuRadiatorClearance(state);

    expect(first).toEqual(second);
    expect(first).toEqual([{
      id: "GPU_RADIATOR_COLLISION",
      type: "CLEARANCE",
      severity: "ERROR",
      message: "GPU length: 340 mm; Available clearance: 320 mm; Margin: -20 mm",
      affectedComponentIds: ["gpu-01", "radiator-01"],
    }]);
    expect(state).toEqual(before);
  });
});

describe("build readiness", () => {
  it("does not overclaim an empty topology as valid", () => {
    expect(assessBuild(emptyState())).toMatchObject({ status: "INCOMPLETE", issues: [{ id: "REQUIRED_COMPONENTS_MISSING" }] });
  });

  it("separates a physical conflict from incomplete assembly", () => {
    const state = { ...emptyState(), placements: [
      { componentId: "case-01", mountId: "workspace-root" }, { componentId: "motherboard-01", mountId: "motherboard-tray" },
      { componentId: "psu-01", mountId: "psu-bay" }, { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { componentId: "radiator-01", mountId: "radiator-front" },
    ] };
    expect(assessBuild(state).status).toBe("CONFLICT");
  });

  it("reaches READY only after the required base power paths are connected", () => {
    const state: BuildState = { ...emptyState(), placements: [
      { componentId: "case-01", mountId: "workspace-root" }, { componentId: "motherboard-01", mountId: "motherboard-tray" }, { componentId: "psu-01", mountId: "psu-bay" },
    ], connections: [
      { id: "atx", from: { componentId: "psu-01", connectorId: "psu-atx-01" }, to: { componentId: "motherboard-01", connectorId: "motherboard-atx" } },
      { id: "eps", from: { componentId: "psu-01", connectorId: "psu-eps-01" }, to: { componentId: "motherboard-01", connectorId: "motherboard-eps" } },
    ] };
    expect(assessBuild(state)).toEqual({ status: "READY", issues: [] });
  });
});

describe("expanded constraint fixtures", () => {
  it("tests GPU cable pass at the exact boundary and failure below it", () => {
    const state = { ...emptyState(), placements: [{ componentId: "gpu-01", mountId: "pcie-slot-1" }] };
    expect(validateGpuCable(state)).toEqual([]);
    expect(validateGpuCable(state, {
      componentRegistry: { ...componentRegistry, "gpu-01": { ...componentRegistry["gpu-01"], dimensions: { width: 155, height: 70, depth: 340 } } },
      mountRegistry: { ...mountRegistry, "pcie-slot-1": { ...mountRegistry["pcie-slot-1"], constraints: { maxWidth: 160 } } },
    })).toHaveLength(1);
  });

  it("reports missing, insufficient, connector-mismatch, and valid PSU fixtures", () => {
    const powered = {
      ...emptyState(),
      placements: [
        { componentId: "motherboard-01", mountId: "motherboard-tray" },
        { componentId: "gpu-01", mountId: "pcie-slot-1" },
      ],
    };
    expect(validatePsu(powered, { enforceMissingPsu: true })[0].id).toBe("PSU_MISSING");

    const withPsu = { ...powered, placements: [...powered.placements, { componentId: "psu-01", mountId: "psu-bay" }] };
    const weakRegistry = { ...componentRegistry, "psu-01": { ...componentRegistry["psu-01"], power: { capacity: 100 } } };
    expect(validatePsu(withPsu, { componentRegistry: weakRegistry })[0].id).toBe("PSU_INSUFFICIENT_CAPACITY");

    const mismatchRegistry = { ...componentRegistry, "psu-01": { ...componentRegistry["psu-01"], connectors: [{ id: "old-gpu", type: "PCIE_8PIN" as const, direction: "OUTPUT" as const }] } };
    expect(validatePsu(withPsu, { componentRegistry: mismatchRegistry })[0].id).toBe("PSU_GPU_CONNECTOR_MISMATCH");
    expect(validatePsu(withPsu)).toEqual([]);
  });

  it("reports no fans, missing directions, one-sided flow, and balanced flow", () => {
    expect(validateAirflow(emptyState(), { enforceNoFans: true })[0].id).toBe("AIRFLOW_NO_FANS");
    const one = { ...emptyState(), placements: [{ componentId: "fan-top-01", mountId: "fan-top-1" }] };
    expect(validateAirflow(one)[0].id).toBe("AIRFLOW_DIRECTION_UNCONFIGURED");
    expect(validateAirflow({ ...one, fanConfigs: [{ componentId: "fan-top-01", direction: "INTAKE" }] })).toEqual([]);
    const components = { ...componentRegistry, "fan-top-02": { ...componentRegistry["fan-top-01"], id: "fan-top-02" } };
    expect(validateAirflow({ ...one, placements: [...one.placements, { componentId: "fan-top-02", mountId: "fan-top-1" }], fanConfigs: [
      { componentId: "fan-top-01", direction: "INTAKE" },
      { componentId: "fan-top-02", direction: "EXHAUST" },
    ] }, { componentRegistry: components })).toEqual([]);
  });
});
