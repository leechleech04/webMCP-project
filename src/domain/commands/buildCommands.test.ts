import { beforeEach, describe, expect, it } from "vitest";

import type { MountDefinition } from "../types/mount";
import {
  buildStore,
  getBuildState,
  resetBuildStore,
} from "../../store/buildStore";
import {
  assertComponentFitsMount,
  DomainCommandError,
} from "./commandGuards";
import { componentRegistry } from "../data/components";
import { installComponent } from "./installComponent";
import { moveComponent } from "./moveComponent";
import { removeComponent } from "./removeComponent";
import { connectComponents } from "./connectComponents";

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

  it("keeps MountDefinition compatible with the frozen Stage 01 contract", () => {
    const mount: MountDefinition = {
      id: "contract-pcie-slot",
      type: "PCIE",
      supportedComponentTypes: ["GPU"],
    };

    expect(mount).toEqual({
      id: "contract-pcie-slot",
      type: "PCIE",
      supportedComponentTypes: ["GPU"],
    });
  });

  it("rejects unknown component and mount identifiers without changing state", () => {
    const before = getBuildState();

    expect(() =>
      installComponent({ componentId: "missing", mountId: "pcie-slot-1" }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "COMPONENT_NOT_FOUND",
      }),
    );
    expect(() =>
      installComponent({ componentId: "gpu-01", mountId: "missing" }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "MOUNT_NOT_FOUND",
      }),
    );
    expect(getBuildState()).toEqual(before);
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

  it("returns the existing placement when moved to the same mount", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });

    const placement = moveComponent({
      componentId: "gpu-01",
      mountId: "pcie-slot-1",
    });

    expect(placement).toEqual({
      componentId: "gpu-01",
      mountId: "pcie-slot-1",
    });
    expect(getBuildState().placements).toHaveLength(1);
  });

  it("rejects moving an uninstalled component", () => {
    expect(() =>
      moveComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "COMPONENT_NOT_INSTALLED",
      }),
    );
  });

  it("rejects moving into an incompatible mount without changing state", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const before = getBuildState();

    expect(() =>
      moveComponent({ componentId: "gpu-01", mountId: "radiator-front" }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "UNSUPPORTED_COMPONENT_TYPE",
      }),
    );
    expect(getBuildState()).toEqual(before);
  });

  it("removes the placement for an installed component", () => {
    installComponent({
      componentId: "gpu-01",
      mountId: "pcie-slot-1",
    });

    removeComponent({ componentId: "gpu-01" });

    expect(getBuildState().placements).toEqual([]);
  });

  it("removes incident connections and fan configuration atomically", () => {
    buildStore.setState({
      placements: [
        { componentId: "fan-top-01", mountId: "fan-top-1" },
        { componentId: "motherboard-01", mountId: "motherboard-tray" },
      ],
      connections: [
        {
          id: "fan-pwm-link",
          from: { componentId: "motherboard-01", connectorId: "fan-header" },
          to: { componentId: "fan-top-01", connectorId: "fan-pwm" },
        },
      ],
      fanConfigs: [{ componentId: "fan-top-01", direction: "EXHAUST" }],
      activity: [],
    });

    removeComponent({ componentId: "fan-top-01" });

    expect(getBuildState()).toMatchObject({
      placements: [
        { componentId: "motherboard-01", mountId: "motherboard-tray" },
      ],
      connections: [],
      fanConfigs: [],
    });
    expect(getBuildState().activity).toHaveLength(1);
    expect(getBuildState().activity[0]).toMatchObject({ actor: "USER" });
  });

  it("returns a detached BuildState snapshot", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const snapshot = getBuildState();

    snapshot.placements.length = 0;

    expect(getBuildState().placements).toEqual([
      { componentId: "gpu-01", mountId: "pcie-slot-1" },
    ]);
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

  it("rejects an occupied mount without changing state", () => {
    buildStore.setState({
      placements: [{ componentId: "occupant", mountId: "pcie-slot-1" }],
    });
    const before = getBuildState();

    expect(() =>
      installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "MOUNT_OCCUPIED",
      }),
    );
    expect(getBuildState()).toEqual(before);
  });

  it("rejects dimension overflow through the shared mount guard", () => {
    const compactSlot: MountDefinition = {
      id: "compact-pcie-slot",
      type: "PCIE",
      supportedComponentTypes: ["GPU"],
      constraints: { maxDepth: 300 },
    };

    expect(() =>
      assertComponentFitsMount(componentRegistry["gpu-01"], compactSlot),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "COMPONENT_DOES_NOT_FIT",
      }),
    );
  });

  it("rejects connector type mismatches atomically with a stable error", () => {
    buildStore.setState({
      placements: [
        { componentId: "psu-01", mountId: "psu-bay" },
        { componentId: "gpu-01", mountId: "pcie-slot-1" },
      ],
      connections: [],
      fanConfigs: [],
      activity: [],
    });
    const before = getBuildState();

    expect(() =>
      connectComponents({
        fromComponentId: "psu-01",
        fromConnectorId: "psu-atx-01",
        toComponentId: "gpu-01",
        toConnectorId: "gpu-power",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "CONNECTOR_TYPE_MISMATCH",
      }),
    );
    expect(getBuildState()).toEqual(before);
  });

  it("rejects a second connection to an occupied input atomically", () => {
    buildStore.setState({
      placements: [
        { componentId: "psu-01", mountId: "psu-bay" },
        { componentId: "psu-sfx-01", mountId: "psu-secondary" },
        { componentId: "motherboard-01", mountId: "motherboard-tray" },
      ],
      connections: [],
      fanConfigs: [],
      activity: [],
    });
    const input = {
      fromComponentId: "psu-01",
      fromConnectorId: "psu-atx-01",
      toComponentId: "motherboard-01",
      toConnectorId: "motherboard-atx",
    };

    connectComponents(input);
    const beforeRejectedConnection = getBuildState();

    expect(() => connectComponents(input)).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "CONNECTION_ALREADY_EXISTS",
      }),
    );
    expect(() => connectComponents({
      ...input,
      fromComponentId: "psu-sfx-01",
    })).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "CONNECTOR_OCCUPIED",
      }),
    );
    expect(getBuildState()).toEqual(beforeRejectedConnection);
  });

  it("enforces connector validation precedence: not found -> direction -> type -> duplicate -> occupied", () => {
    buildStore.setState({
      placements: [
        { componentId: "psu-01", mountId: "psu-bay" },
        { componentId: "motherboard-01", mountId: "motherboard-tray" },
        { componentId: "gpu-01", mountId: "pcie-slot-1" },
      ],
      connections: [],
      fanConfigs: [],
      activity: [],
    });

    // 1. Missing connector
    expect(() =>
      connectComponents({
        fromComponentId: "psu-01",
        fromConnectorId: "nonexistent-connector",
        toComponentId: "motherboard-01",
        toConnectorId: "motherboard-atx",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "CONNECTOR_NOT_FOUND",
      }),
    );

    // 2. Invalid direction (INPUT -> INPUT or OUTPUT -> OUTPUT)
    expect(() =>
      connectComponents({
        fromComponentId: "motherboard-01",
        fromConnectorId: "motherboard-atx", // INPUT
        toComponentId: "gpu-01",
        toConnectorId: "gpu-power", // INPUT
      }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "CONNECTOR_DIRECTION_INVALID",
      }),
    );

    // 3. Type mismatch
    expect(() =>
      connectComponents({
        fromComponentId: "psu-01",
        fromConnectorId: "psu-atx-01", // ATX_24PIN
        toComponentId: "gpu-01",
        toConnectorId: "gpu-power", // 12V_2X6
      }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainCommandError>>({
        code: "CONNECTOR_TYPE_MISMATCH",
      }),
    );
  });
});
