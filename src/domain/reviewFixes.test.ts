import { beforeEach, describe, expect, it } from "vitest";
import { MAX_ACTIVITY_ENTRIES } from "./activity";
import { autoFillBuild } from "./commands/autoFillBuild";
import {
  canRedoLastAction,
  commitDomainActions,
  getTopologyRevision,
  redoLastAction,
  undoLastAction,
} from "./commands/commitDomainAction";
import { installComponent } from "./commands/installComponent";
import { moveComponent } from "./commands/moveComponent";
import { recordActivity } from "./commands/recordActivity";
import { selectCase } from "./commands/selectCase";
import { validatePsu } from "./constraints/psuPower";
import { mountRegistry } from "./data/mounts";
import { getBuildState, resetBuildStore } from "../store/buildStore";
import { simulateChangesTool } from "../webmcp/toolImplementations";

describe("review feedback regressions", () => {
  beforeEach(() => resetBuildStore());

  it("enforces active-case mounts and profile clearance on install and case switch", () => {
    selectCase({ componentId: "case-mini-pc-01" });
    expect(() => installComponent({ componentId: "fan-side-01", mountId: "fan-side-1" }))
      .toThrowError(expect.objectContaining({ code: "INCOMPATIBLE_MOUNT" }));

    selectCase({ componentId: "case-01" });
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    expect(() => selectCase({ componentId: "case-mini-pc-01" }))
      .toThrowError(expect.objectContaining({ code: "INCOMPATIBLE_CASE" }));
  });

  it("validates compact PSU variants generically", () => {
    const state = {
      placements: [
        { componentId: "case-mini-pc-01", mountId: "case-root" },
        { componentId: "motherboard-itx-01", mountId: "motherboard-tray" },
        { componentId: "cpu-01", mountId: "cpu-socket-1" },
        { componentId: "gpu-1fan-01", mountId: "pcie-slot-1" },
        { componentId: "psu-sfx-01", mountId: "psu-bay" },
      ],
      connections: [],
      fanConfigs: [],
      activity: [],
    };
    expect(validatePsu(state).some((issue) => issue.id === "PSU_MISSING")).toBe(false);
    expect(validatePsu(state).some((issue) => issue.id === "PSU_INSUFFICIENT_CAPACITY")).toBe(false);
  });

  it("keeps simulations fully read-only, including activity", () => {
    installComponent({ componentId: "radiator-01", mountId: "radiator-front" });
    const before = getBuildState();
    expect(simulateChangesTool({ actions: [{ type: "MOVE_COMPONENT", componentId: "radiator-01", mountId: "radiator-top" }] }).ok).toBe(true);
    expect(getBuildState()).toEqual(before);
  });

  it("commits composite actions atomically and rolls back all actions on failure", () => {
    const before = getBuildState();
    expect(() => commitDomainActions([
      { type: "INSTALL_COMPONENT", componentId: "ram-01", mountId: "dimm-a1" },
      { type: "INSTALL_COMPONENT", componentId: "gpu-01", mountId: "dimm-b1" },
    ], "invalid kit")).toThrow();
    expect(getBuildState()).toEqual(before);
  });

  it("does not create revisions for no-op moves and supports user undo/redo", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const revision = getTopologyRevision();
    moveComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    expect(getTopologyRevision()).toBe(revision);
    undoLastAction();
    expect(getBuildState().placements).toEqual([]);
    expect(canRedoLastAction()).toBe(true);
    redoLastAction();
    expect(getBuildState().placements).toContainEqual({ componentId: "gpu-01", mountId: "pcie-slot-1" });
  });

  it("caps the activity audit trail and only emits registered auto-fill mounts", () => {
    for (let index = 0; index < MAX_ACTIVITY_ENTRIES + 5; index += 1) {
      recordActivity({ actor: "SYSTEM", message: `event-${index}` });
    }
    expect(getBuildState().activity).toHaveLength(MAX_ACTIVITY_ENTRIES);

    resetBuildStore();
    autoFillBuild();
    expect(getBuildState().placements.every((placement) => Boolean(mountRegistry[placement.mountId]))).toBe(true);
    expect(getBuildState().placements).toContainEqual({ componentId: "storage-nvme-01", mountId: "storage-m2-1" });
  });
});
