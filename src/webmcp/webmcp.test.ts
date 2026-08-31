import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildStore, getBuildState, resetBuildStore } from "../store/buildStore";
import { installComponentTool, moveComponentTool, validateBuildTool } from "./toolImplementations";
import { registerTools } from "./registerTools";

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
    vi.unstubAllGlobals();
  });

  it("registers the canonical document.modelContext tools and cleans them up", async () => {
    const context = makeContext();
    vi.stubGlobal("document", { modelContext: context });
    const registration = await registerTools();

    expect(registration.mode).toBe("webmcp");
    expect(registration.registeredTools).toEqual([
      "get_build_state",
      "validate_build",
      "move_component",
      "install_component",
      "remove_component",
      "simulate_changes",
    ]);
    expect(context.tools.size).toBe(6);
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
    expect(registration.registeredTools).toHaveLength(6);
    registration.cleanup();
  });

  it("proves the exact Front to Top vertical slice through tool and store state", () => {
    installComponentTool({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    expect(validateBuildTool()).toMatchObject({ valid: false, issues: [{ id: "GPU_RADIATOR_COLLISION" }] });
    const moved = moveComponentTool({ componentId: "radiator-01", mountId: "radiator-top" });

    expect(moved.ok).toBe(true);
    expect(buildStore.getState().placements).toContainEqual({ componentId: "radiator-01", mountId: "radiator-top" });
    expect(moved.validation).toMatchObject({ valid: true, issues: [] });
    expect(getBuildState().activity.map((entry) => entry.actor)).toContain("AGENT");
    expect(getBuildState().activity.map((entry) => entry.actor)).toContain("SYSTEM");
  });

  it("does not commit failed move tool input", () => {
    installComponentTool({ componentId: "radiator-01", mountId: "radiator-front" });
    const before = getBuildState();
    const result = moveComponentTool({ componentId: "radiator-01", mountId: "not-a-mount" });
    expect(result.ok).toBe(false);
    expect(getBuildState()).toEqual(before);
  });
});
