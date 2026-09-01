import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildStore, getBuildState, resetBuildStore } from "../store/buildStore";
import { connectComponentTool, installComponentTool, moveComponentTool, undoLastAgentActionTool, validateBuildTool } from "./toolImplementations";
import { registerTools } from "./registerTools";
import { resetCommandHistory } from "../domain/commands/commitDomainAction";
import { moveComponent } from "../domain/commands/moveComponent";

const makeContext = () => {
  const tools = new Map<string, { name: string }>();
  return {
    tools,
    registerTool: async (tool: { name: string }, options?: { signal?: AbortSignal }) => {
      tools.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
    },
  };
};

describe("WebMCP tool boundary", () => {
  beforeEach(() => {
    resetBuildStore();
    resetCommandHistory();
    vi.unstubAllGlobals();
  });

  it("registers the canonical document.modelContext tools and cleans them up", async () => {
    const context = makeContext();
    vi.stubGlobal("document", { modelContext: context });
    const registration = await registerTools();

    expect(registration.mode).toBe("webmcp");
    expect(registration.registeredTools).toEqual([
      "get_build_state",
      "get_available_mounts",
      "validate_build",
      "install_component",
      "move_component",
      "remove_component",
      "connect_component",
      "set_fan_direction",
      "simulate_changes",
      "undo_last_agent_action",
    ]);
    expect(context.tools.size).toBe(10);
    registration.cleanup();
    expect(context.tools.size).toBe(0);
  });

  it("truthfully returns simulation mode when the transport is unavailable", async () => {
    const registration = await registerTools();
    expect(registration.mode).toBe("simulation");
    expect(registration.supported).toBe(false);
  });

  it("handles delayed canonical API injection", async () => {
    const context = makeContext();
    vi.stubGlobal("document", {});
    setTimeout(() => vi.stubGlobal("document", { modelContext: context }), 20);
    const registration = await registerTools({ timeoutMs: 100, intervalMs: 5 });
    expect(registration.mode).toBe("webmcp");
    expect(registration.registeredTools).toHaveLength(10);
    registration.cleanup();
  });

  it("proves the exact Front to Top vertical slice through tool and store state", () => {
    installComponentTool({ componentId: "case-01", mountId: "workspace-root" });
    installComponentTool({ componentId: "motherboard-01", mountId: "motherboard-tray" });
    installComponentTool({ componentId: "psu-01", mountId: "psu-bay" });
    connectComponentTool({ fromComponentId: "psu-01", fromConnectorId: "psu-atx-01", toComponentId: "motherboard-01", toConnectorId: "motherboard-atx" });
    connectComponentTool({ fromComponentId: "psu-01", fromConnectorId: "psu-eps-01", toComponentId: "motherboard-01", toConnectorId: "motherboard-eps" });
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    connectComponentTool({ fromComponentId: "psu-01", fromConnectorId: "psu-gpu-01", toComponentId: "gpu-01", toConnectorId: "gpu-power" });
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    expect(validateBuildTool().issues.some((issue) => issue.id === "GPU_RADIATOR_COLLISION")).toBe(true);
    const moved = moveComponentTool({ componentId: "radiator-01", mountId: "radiator-top" });

    expect(moved.ok).toBe(true);
    expect(buildStore.getState().placements).toContainEqual({ componentId: "radiator-01", mountId: "radiator-top" });
    expect(moved.validation).toMatchObject({ valid: true, issues: [] });
    expect(getBuildState().activity.map((entry) => entry.actor)).toContain("AGENT");
    expect(getBuildState().activity.map((entry) => entry.actor)).toContain("SYSTEM");
  });

  it("keeps concurrent StrictMode-style registration leases alive until both clean up", async () => {
    const context = makeContext(); vi.stubGlobal("document", { modelContext: context });
    const [first, second] = await Promise.all([registerTools(), registerTools()]);
    expect(context.tools.size).toBe(10); first.cleanup(); expect(context.tools.size).toBe(10); second.cleanup(); expect(context.tools.size).toBe(0);
  });

  it("undoes a latest agent change", () => {
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    expect(undoLastAgentActionTool().ok).toBe(true);
    expect(getBuildState().placements).not.toContainEqual({ componentId: "gpu-01", mountId: "pcie-slot-1" });
  });

  it("refuses stale undo after a later human change", () => {
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    moveComponent({ componentId: "radiator-01", mountId: "radiator-top" });
    expect(undoLastAgentActionTool()).toMatchObject({ ok: false, error: { code: "UNDO_STALE" } });
    expect(getBuildState().placements).toContainEqual({ componentId: "radiator-01", mountId: "radiator-top" });
  });

  it("does not commit failed move tool input", () => {
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    const before = getBuildState();
    const result = moveComponentTool({ componentId: "radiator-01", mountId: "not-a-mount" });
    expect(result.ok).toBe(false);
    expect(getBuildState()).toEqual(before);
  });
});
