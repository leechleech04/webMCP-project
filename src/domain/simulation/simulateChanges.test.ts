import { beforeEach, describe, expect, it } from "vitest";

import { installComponent } from "../commands/installComponent";
import { buildStore, getBuildState, resetBuildStore } from "../../store/buildStore";
import { validateBuild } from "../constraints/validateBuild";
import { simulateChanges } from "./simulateChanges";

describe("simulateChanges", () => {
  beforeEach(() => resetBuildStore());

  it("projects Front to Top and clears the collision without a live commit", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    installComponent({ componentId: "radiator-01", mountId: "radiator-front" });
    const before = getBuildState();
    let notifications = 0;
    const unsubscribe = buildStore.subscribe(() => { notifications += 1; });

    const result = simulateChanges(before, [{
      type: "MOVE_COMPONENT",
      componentId: "radiator-01",
      mountId: "radiator-top",
    }]);

    unsubscribe();
    expect(result.ok).toBe(true);
    expect(result.projectedPlacements).toEqual([
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
      { componentId: "radiator-01", mountId: "radiator-top" },
    ]);
    expect(result.issues).toEqual([]);
    expect(getBuildState()).toEqual(before);
    expect(notifications).toBe(0);
    expect(validateBuild(getBuildState())).toHaveLength(1);
  });

  it("is atomic when an invalid action follows a valid action", () => {
    const before = getBuildState();
    const result = simulateChanges(before, [
      { type: "INSTALL_COMPONENT", componentId: "gpu-01", mountId: "pcie-slot-1" },
      { type: "MOVE_COMPONENT", componentId: "missing", mountId: "pcie-slot-1" },
    ]);

    expect(result.ok).toBe(false);
    expect(result.atomic).toBe(true);
    expect(result.projectedPlacements).toEqual([]);
    expect(result.actionResults[0].ok).toBe(true);
    expect(result.actionResults[1].ok).toBe(false);
    expect(getBuildState()).toEqual(before);
  });

  it("keeps real command wrappers to one store commit", () => {
    let notifications = 0;
    const unsubscribe = buildStore.subscribe(() => { notifications += 1; });
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    unsubscribe();
    expect(notifications).toBe(1);
  });
});
