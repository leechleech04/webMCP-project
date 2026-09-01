import { beforeEach, describe, expect, it } from "vitest";

import { buildStore, getBuildState, resetBuildStore } from "../../store/buildStore";
import { simulateChanges } from "../simulation/simulateChanges";
import { autoFillBuild } from "./autoFillBuild";
import { clearBuild } from "./clearBuild";
import {
  canUndoLastAgentAction,
  getTopologyRevision,
  undoLastAgentAction,
} from "./commitDomainAction";
import { installComponent } from "./installComponent";
import { selectCase } from "./selectCase";

describe("revision-aware domain commits", () => {
  beforeEach(() => resetBuildStore());

  it("increments revision only for successful live commands", () => {
    expect(getTopologyRevision()).toBe(0);

    installComponent(
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { actor: "AGENT" },
    );
    expect(getTopologyRevision()).toBe(1);

    const before = getBuildState();
    simulateChanges(before, [
      {
        type: "MOVE_COMPONENT",
        componentId: "gpu-01",
        mountId: "pcie-slot-1",
      },
    ]);
    expect(getTopologyRevision()).toBe(1);

    expect(() =>
      installComponent({ componentId: "missing", mountId: "pcie-slot-1" }),
    ).toThrow();
    expect(getTopologyRevision()).toBe(1);
  });

  it("undoes the latest agent snapshot and records affected components", () => {
    installComponent(
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { actor: "AGENT" },
    );

    expect(canUndoLastAgentAction()).toBe(true);
    expect(getBuildState().activity.at(-1)).toMatchObject({
      actor: "AGENT",
      affectedComponentIds: ["gpu-01"],
      undoable: true,
    });

    expect(undoLastAgentAction()).toEqual({
      affectedComponentIds: ["gpu-01"],
    });
    expect(getBuildState().placements).toEqual([]);
    expect(getBuildState().activity.at(-1)).toMatchObject({
      actor: "SYSTEM",
      affectedComponentIds: ["gpu-01"],
    });
    expect(canUndoLastAgentAction()).toBe(false);
    expect(getTopologyRevision()).toBe(2);
  });

  it("blocks stale undo after a later user commit", () => {
    installComponent(
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { actor: "AGENT" },
    );
    installComponent({ componentId: "psu-01", mountId: "psu-bay" });

    expect(canUndoLastAgentAction()).toBe(false);
    expect(() => undoLastAgentAction()).toThrowError(
      expect.objectContaining({ code: "UNDO_STALE" }),
    );
  });

  it("supports snapshot undo for case selection, auto-fill, and clear", () => {
    selectCase({ componentId: "case-mini-pc-01" }, { actor: "AGENT" });
    undoLastAgentAction();
    expect(getBuildState().placements).toEqual([]);

    autoFillBuild({ actor: "AGENT" });
    const autoFilled = getBuildState();
    expect(autoFilled.placements.length).toBeGreaterThan(3);
    undoLastAgentAction();
    expect(getBuildState().placements).toEqual([]);

    autoFillBuild();
    const beforeClear = getBuildState();
    clearBuild({ confirm: true }, { actor: "AGENT" });
    expect(getBuildState().placements).toHaveLength(1);
    undoLastAgentAction();
    expect(getBuildState().placements).toEqual(beforeClear.placements);
    expect(getBuildState().connections).toEqual(beforeClear.connections);
    expect(getBuildState().fanConfigs).toEqual(beforeClear.fanConfigs);
  });

  it("resetBuildStore clears both topology and command history", () => {
    installComponent(
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { actor: "AGENT" },
    );
    expect(canUndoLastAgentAction()).toBe(true);

    resetBuildStore();

    expect(getTopologyRevision()).toBe(0);
    expect(canUndoLastAgentAction()).toBe(false);
    expect(buildStore.getState()).toEqual({
      placements: [],
      connections: [],
      fanConfigs: [],
      activity: [],
    });
  });
});
