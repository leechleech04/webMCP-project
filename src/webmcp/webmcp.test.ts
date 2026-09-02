import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildStore, getBuildState, resetBuildStore } from "../store/buildStore";
import {
  getAvailableMountsTool,
  getCaseProfilesTool,
  getComponentCatalogTool,
  installComponentTool,
  moveComponentTool,
  selectCaseTool,
  undoLastAgentActionTool,
  validateBuildTool,
} from "./toolImplementations";
import { createTelemetry } from "./telemetry";
import {
  executeWebMcpTool,
  makeToolDefinitions,
  registerTools,
} from "./registerTools";
import type { ToolDefinition } from "./types";

const expectedToolNames = [
  "get_build_state",
  "get_component_catalog",
  "get_case_profiles",
  "get_available_mounts",
  "validate_build",
  "install_component",
  "move_component",
  "remove_component",
  "connect_component",
  "disconnect_component",
  "set_fan_direction",
  "simulate_changes",
  "select_case",
  "auto_fill_build",
  "clear_build",
  "undo_last_agent_action",
];

const makeContext = (rejectTool?: string) => {
  const tools = new Map<string, ToolDefinition>();
  const signals = new Map<string, AbortSignal>();
  return {
    tools,
    signals,
    registerTool: async (tool: ToolDefinition, options?: { signal?: AbortSignal }) => {
      if (tool.name === rejectTool) throw new Error(`Rejected ${tool.name}`);
      tools.set(tool.name, tool);
      if (options?.signal) signals.set(tool.name, options.signal);
      options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
    },
  };
};

describe("WebMCP tool boundary", () => {
  beforeEach(() => {
    resetBuildStore();
    vi.unstubAllGlobals();
  });

  it("registers all 16 canonical tools with one abort controller per tool", async () => {
    const context = makeContext();
    vi.stubGlobal("document", { modelContext: context });
    const registration = await registerTools();

    expect(registration.mode).toBe("webmcp");
    expect(registration.supported).toBe(true);
    expect(registration.registeredTools).toEqual(expectedToolNames);
    expect(context.tools.size).toBe(16);
    expect(new Set(context.signals.values()).size).toBe(16);
    registration.cleanup();
    expect(context.tools.size).toBe(0);
    expect([...context.signals.values()].every((signal) => signal.aborted)).toBe(true);
  });

  it("keeps concurrent StrictMode-style leases alive until both release", async () => {
    const context = makeContext();
    vi.stubGlobal("document", { modelContext: context });
    const [first, second] = await Promise.all([registerTools(), registerTools()]);

    expect(context.tools.size).toBe(16);
    first.cleanup();
    first.cleanup();
    expect(context.tools.size).toBe(16);
    second.cleanup();
    expect(context.tools.size).toBe(0);
  });

  it("truthfully reports simulation mode when the transport is unavailable", async () => {
    const telemetry = createTelemetry();
    const registration = await registerTools({ telemetry });
    expect(registration.mode).toBe("simulation");
    expect(registration.supported).toBe(false);
    expect(registration.registeredTools).toEqual([]);
    expect(telemetry.mode).toBe("simulation");
    expect(telemetry.events.filter((event) => event.kind === "registration")).toHaveLength(16);
    registration.cleanup();
  });

  it("reports partial mode when any tool registration fails", async () => {
    const context = makeContext("clear_build");
    const telemetry = createTelemetry();
    vi.stubGlobal("document", { modelContext: context });
    const registration = await registerTools({ telemetry });

    expect(registration.mode).toBe("partial");
    expect(registration.supported).toBe(false);
    expect(registration.registeredTools).toHaveLength(15);
    expect(registration.registeredTools).not.toContain("clear_build");
    expect(telemetry.mode).toBe("partial");
    registration.cleanup();
    expect(context.tools.size).toBe(0);
  });

  it("handles delayed canonical API injection", async () => {
    const context = makeContext();
    vi.stubGlobal("document", {});
    setTimeout(() => vi.stubGlobal("document", { modelContext: context }), 20);
    const registration = await registerTools({ timeoutMs: 100, intervalMs: 5 });
    expect(registration.mode).toBe("webmcp");
    expect(registration.registeredTools).toHaveLength(16);
    registration.cleanup();
  });

  it("keeps validate_build a pure read", () => {
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const before = getBuildState();
    validateBuildTool();
    validateBuildTool();
    expect(getBuildState()).toEqual(before);
  });

  it("reports empty and uncabled builds as incomplete instead of valid", () => {
    expect(validateBuildTool()).toMatchObject({
      status: "INCOMPLETE",
      valid: false,
      missingComponentTypes: ["CASE", "MOTHERBOARD", "CPU", "RAM", "STORAGE", "PSU"],
    });
  });

  it("exposes discoverable component connectors and case capabilities", () => {
    expect(getComponentCatalogTool({ componentType: "PSU" })).toContainEqual(expect.objectContaining({
      id: "psu-01",
      connectors: expect.arrayContaining([
        expect.objectContaining({ id: "psu-gpu-01", type: "12V_2X6", direction: "OUTPUT" }),
      ]),
    }));
    expect(getCaseProfilesTool()).toContainEqual(expect.objectContaining({
      componentId: "case-01",
      active: true,
      mounts: expect.arrayContaining([expect.objectContaining({ id: "pcie-slot-1" })]),
    }));
  });

  it("filters available mounts by the active case, occupancy, type, and clearance", () => {
    selectCaseTool({ componentId: "case-mini-pc-01" });
    const allIds = getAvailableMountsTool().map((mount) => mount.id);
    expect(allIds).toContain("fan-top-1");
    expect(allIds).not.toContain("fan-bottom-1");
    expect(getAvailableMountsTool({ componentId: "gpu-01" })).toEqual([]);
    expect(getAvailableMountsTool({ componentId: "gpu-1fan-01" }).map((mount) => mount.id)).toEqual(["pcie-slot-1"]);
    expect(() => getAvailableMountsTool({ componentId: "missing" })).toThrow("Unknown component");
  });

  it("strictly rejects unknown fields, missing fields, and unsupported simulation actions", async () => {
    const telemetry = createTelemetry();
    const definitions = makeToolDefinitions(telemetry);
    const signal = new AbortController().signal;
    const install = definitions.find((tool) => tool.name === "install_component");
    const simulate = definitions.find((tool) => tool.name === "simulate_changes");

    await expect(install?.execute({ componentId: "gpu-01", mountId: "pcie-slot-1", extra: true }, { signal })).rejects.toThrow("unknown property");
    await expect(install?.execute({ componentId: "gpu-01" }, { signal })).rejects.toThrow("mountId");
    await expect(simulate?.execute({ actions: [{ type: "DO_ANYTHING" }] }, { signal })).rejects.toThrow("unsupported");
    expect(telemetry.events.filter((event) => event.kind === "invocation" && event.ok === false)).toHaveLength(3);
  });

  it("accepts Stage 19 actions in strict simulation parsing without changing topology", async () => {
    const before = getBuildState();
    const response = await executeWebMcpTool("simulate_changes", {
      actions: [{ type: "SELECT_CASE", componentId: "case-sff-01" }],
    });
    expect(response.isError).not.toBe(true);
    expect(getBuildState().placements).toEqual(before.placements);
  });

  it("connects through the domain command and can undo the latest agent action", async () => {
    installComponentTool({ componentId: "psu-01", mountId: "psu-bay" });
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const connected = await executeWebMcpTool("connect_component", {
      fromComponentId: "psu-01",
      fromConnectorId: "psu-gpu-01",
      toComponentId: "gpu-01",
      toConnectorId: "gpu-power",
    });
    expect(connected.isError).not.toBe(true);
    expect(getBuildState().connections).toHaveLength(1);
    expect(undoLastAgentActionTool().ok).toBe(true);
    expect(getBuildState().connections).toHaveLength(0);
  });

  it("shares cooling-zone compatibility with the 3D and catalog mount query", () => {
    installComponentTool({ componentId: "fan-front-01", mountId: "fan-front-1" });
    const radiatorMounts = getAvailableMountsTool({ componentId: "radiator-01" }).map((mount) => mount.id);
    expect(radiatorMounts).toContain("radiator-top");
    expect(radiatorMounts).not.toContain("radiator-front");
  });

  it("disconnects a selected cable through the agent command path", async () => {
    installComponentTool({ componentId: "psu-01", mountId: "psu-bay" });
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const connectionId = "psu-01:psu-gpu-01->gpu-01:gpu-power";
    await executeWebMcpTool("connect_component", {
      fromComponentId: "psu-01",
      fromConnectorId: "psu-gpu-01",
      toComponentId: "gpu-01",
      toConnectorId: "gpu-power",
    });
    const disconnected = await executeWebMcpTool("disconnect_component", { connectionId });
    expect(disconnected.isError).not.toBe(true);
    expect(getBuildState().connections).toEqual([]);
  });

  it("proves the Front-to-Top vertical slice through tools and store state", () => {
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    expect(validateBuildTool()).toMatchObject({ valid: false, issues: [{ id: "GPU_RADIATOR_COLLISION" }] });
    const moved = moveComponentTool({ componentId: "radiator-01", mountId: "radiator-top" });

    expect(moved.ok).toBe(true);
    expect(buildStore.getState().placements).toContainEqual({ componentId: "radiator-01", mountId: "radiator-top" });
    expect(moved.validation?.issues.some((issue) => issue.id === "GPU_RADIATOR_COLLISION")).toBe(false);
    expect(getBuildState().activity.map((entry) => entry.actor)).toContain("AGENT");
  });

  it("does not commit failed move tool input", () => {
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    const before = getBuildState();
    const result = moveComponentTool({ componentId: "radiator-01", mountId: "not-a-mount" });
    expect(result.ok).toBe(false);
    expect(getBuildState()).toEqual(before);
  });

  it("exposes revision and ensures all read tools cause zero state and revision mutation", async () => {
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    const stateToolResult = (await executeWebMcpTool("get_build_state", {})) as any;
    expect(stateToolResult.isError).toBeFalsy();
    const parsed = JSON.parse(stateToolResult.content[0].text.split("\n\n")[1]);
    expect(parsed.revision).toBe(1);
    expect(parsed.placements).toHaveLength(1);

    const stateBefore = getBuildState();
    await executeWebMcpTool("get_build_state", {});
    await executeWebMcpTool("get_component_catalog", { componentType: "GPU" });
    await executeWebMcpTool("get_case_profiles", {});
    await executeWebMcpTool("get_available_mounts", {});
    await executeWebMcpTool("get_available_mounts", { componentId: "gpu-01" });
    await executeWebMcpTool("validate_build", {});

    expect(getBuildState()).toEqual(stateBefore);
    expect(getBuildState().activity).toEqual(stateBefore.activity);
  });

  it("verifies case-aware mount availability across all four case profiles", () => {
    // 1. MINI_PC
    selectCaseTool({ componentId: "case-mini-pc-01" });
    const miniMounts = getAvailableMountsTool().map((m) => m.id);
    expect(miniMounts).toContain("fan-top-1");
    expect(miniMounts).toContain("fan-front-1");
    expect(miniMounts).not.toContain("fan-bottom-1");
    expect(miniMounts).not.toContain("fan-top-2");
    expect(miniMounts).not.toContain("fan-side-1");

    // 2. SFF
    selectCaseTool({ componentId: "case-sff-01" });
    const sffMounts = getAvailableMountsTool().map((m) => m.id);
    expect(sffMounts).toContain("fan-top-1");
    expect(sffMounts).toContain("fan-top-2");
    expect(sffMounts).toContain("fan-rear-1");
    expect(sffMounts).not.toContain("fan-top-3");
    expect(sffMounts).not.toContain("fan-bottom-1");
    expect(sffMounts).not.toContain("fan-side-1");

    // 3. MFF (Standard Lian Li Lancool 216)
    selectCaseTool({ componentId: "case-01" });
    const mffMounts = getAvailableMountsTool().map((m) => m.id);
    expect(mffMounts).toContain("fan-top-1");
    expect(mffMounts).toContain("fan-front-1");
    expect(mffMounts).toContain("fan-bottom-1");
    expect(mffMounts).toContain("radiator-top");
    expect(mffMounts).toContain("radiator-front");
    expect(mffMounts).not.toContain("fan-side-1");

    // 4. LFF (Full Tower)
    selectCaseTool({ componentId: "case-lff-01" });
    const lffMounts = getAvailableMountsTool().map((m) => m.id);
    expect(lffMounts).toContain("fan-top-1");
    expect(lffMounts).toContain("fan-top-3");
    expect(lffMounts).toContain("fan-front-3");
    expect(lffMounts).toContain("fan-side-1");
  });
});
