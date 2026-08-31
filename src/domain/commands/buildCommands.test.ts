import { beforeEach, describe, expect, it } from "vitest";

import { getBuildState, resetBuildStore } from "../../store/buildStore";
import { DomainCommandError } from "./commandGuards";
import { installComponent } from "./installComponent";
import { moveComponent } from "./moveComponent";
import { removeComponent } from "./removeComponent";

describe("build commands", () => {
  beforeEach(() => {
    resetBuildStore();
  });

  it("installs a component into a mount", () => {
    installComponent({
      componentId: "gpu-01",
      mountId: "pcie-slot-1",
    });

    expect(getBuildState().placements).toEqual([
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
    ]);
  });

  it("moves an installed component without duplicating it", () => {
    installComponent({
      componentId: "radiator-01",
      mountId: "radiator-front",
    });

    moveComponent({
      componentId: "radiator-01",
      mountId: "radiator-top",
    });

    expect(getBuildState().placements).toEqual([
      { componentId: "radiator-01", mountId: "radiator-top" },
    ]);
  });

  it("removes the placement for an installed component", () => {
    installComponent({
      componentId: "gpu-01",
      mountId: "pcie-slot-1",
    });

    removeComponent({ componentId: "gpu-01" });

    expect(getBuildState().placements).toEqual([]);
  });

  it("rejects a component that is incompatible with the mount", () => {
    expect(() =>
      installComponent({
        componentId: "gpu-01",
        mountId: "radiator-front",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "UNSUPPORTED_COMPONENT_TYPE",
      }),
    );

    expect(getBuildState().placements).toEqual([]);
  });

  it("rejects duplicate installation", () => {
    installComponent({
      componentId: "gpu-01",
      mountId: "pcie-slot-1",
    });

    expect(() =>
      installComponent({
        componentId: "gpu-01",
        mountId: "pcie-slot-1",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "COMPONENT_ALREADY_INSTALLED",
      }),
    );
  });
});
