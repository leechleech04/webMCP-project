import { beforeEach, describe, expect, it } from "vitest";
import { buildStore, resetBuildStore } from "../store/buildStore";
import { installComponent } from "./commands/installComponent";
import { autoFillBuild } from "./commands/autoFillBuild";
import { clearBuild } from "./commands/clearBuild";
import { selectCase } from "./commands/selectCase";
import { setFanDirection } from "./commands/setFanDirection";
import { moveComponent } from "./commands/moveComponent";
import { caseProfiles, getRecommendedFanDirection } from "./cases/caseProfiles";
import { getActiveCaseProfile } from "./cases/getActiveCase";
import { generateAutoFillRecipe } from "./recipes/autoFillRecipe";
import { executeWebMcpTool } from "../webmcp/registerTools";

describe("Stage 19 — Fan Reliability, Auto Fill, Clear Build, and WebMCP Tools", () => {
  beforeEach(() => {
    resetBuildStore();
  });

  describe("Fan Installability & Default Direction", () => {
    it("assigns recommended direction INTAKE on front/bottom and EXHAUST on top/rear upon fan install", () => {
      installComponent({ componentId: "fan-top-01", mountId: "fan-top-1" });
      let cfg = buildStore.getState().fanConfigs.find((c) => c.componentId === "fan-top-01");
      expect(cfg).toBeDefined();
      expect(cfg?.direction).toBe("EXHAUST");

      selectCase({ componentId: "case-01" });
      installComponent({ componentId: "fan-front-01", mountId: "fan-front-1" });
      cfg = buildStore.getState().fanConfigs.find((c) => c.componentId === "fan-front-01");
      expect(cfg?.direction).toBe("INTAKE");
    });

    it("supports setting fan direction explicitly and toggling", () => {
      installComponent({ componentId: "fan-top-01", mountId: "fan-top-1" });
      setFanDirection({ componentId: "fan-top-01", direction: "INTAKE" });
      expect(buildStore.getState().fanConfigs.find((c) => c.componentId === "fan-top-01")?.direction).toBe("INTAKE");

      setFanDirection({ componentId: "fan-top-01", direction: "EXHAUST" });
      expect(buildStore.getState().fanConfigs.find((c) => c.componentId === "fan-top-01")?.direction).toBe("EXHAUST");
    });

    it("preserves fan direction when moving a fan across compatible mounts", () => {
      installComponent({ componentId: "fan-top-01", mountId: "fan-top-1" });
      setFanDirection({ componentId: "fan-top-01", direction: "INTAKE" });

      moveComponent({ componentId: "fan-top-01", mountId: "fan-top-2" });
      const cfg = buildStore.getState().fanConfigs.find((c) => c.componentId === "fan-top-01");
      expect(cfg?.mountId).toBe("fan-top-2");
      expect(cfg?.direction).toBe("INTAKE");
    });

    it("prevents standalone fans and an integrated-fan radiator from sharing one rail", () => {
      installComponent({ componentId: "radiator-01", mountId: "radiator-top" });
      expect(() =>
        installComponent({ componentId: "fan-top-01", mountId: "fan-top-1" }),
      ).toThrow(/MOUNT_OCCUPIED/);

      resetBuildStore();
      installComponent({ componentId: "fan-front-01", mountId: "fan-front-1" });
      expect(() =>
        installComponent({ componentId: "radiator-01", mountId: "radiator-front" }),
      ).toThrow(/MOUNT_OCCUPIED/);
    });
  });

  describe("Auto Fill Build Command", () => {
    it("generates and atomically applies a complete build for MFF case (Lian Li 216)", () => {
      const outcome = autoFillBuild();
      const st = buildStore.getState();

      expect(outcome.appliedPlacements.length).toBeGreaterThan(3);
      expect(outcome.appliedConnections.length).toBeGreaterThan(0);
      expect(outcome.appliedFanConfigs.length).toBeGreaterThan(0);
      expect(outcome.validation).toMatchObject({ status: "READY", valid: true });

      const hasMB = st.placements.some((p) => p.mountId === "motherboard-tray");
      const hasPSU = st.placements.some((p) => p.mountId === "psu-bay");
      expect(hasMB).toBe(true);
      expect(hasPSU).toBe(true);
      expect(st.placements.some((p) => p.mountId.startsWith("fan-top-"))).toBe(false);
    });

    it("throws AUTO_FILL_NO_CHANGES if build is already completely auto-filled", () => {
      autoFillBuild();
      expect(() => autoFillBuild()).toThrow(/AUTO_FILL_NO_CHANGES/);
    });

    it("fits compact GPU and Mini-ITX components when auto-filling MINI_PC case", () => {
      selectCase({ componentId: "case-mini-pc-01" });
      const outcome = autoFillBuild();
      const st = buildStore.getState();

      expect(outcome.appliedPlacements.some((p) => p.componentId === "gpu-1fan-01")).toBe(true);
      expect(outcome.appliedPlacements).toContainEqual({
        componentId: "radiator-120-01",
        mountId: "radiator-top",
      });
      expect(outcome.appliedPlacements.some((p) => p.componentId === "radiator-240-01")).toBe(false);
      expect(st.placements.some((p) => p.mountId.startsWith("fan-top-"))).toBe(false);
      expect(outcome.validation).toMatchObject({ status: "READY", valid: true });
    });
  });

  describe("Clear Build Command", () => {
    it("throws CONFIRMATION_REQUIRED when confirm is false or missing", () => {
      autoFillBuild();
      expect(() => clearBuild({ confirm: false } as any)).toThrow(/CONFIRMATION_REQUIRED/);
    });

    it("clears non-case components, cables, and fan configs while preserving active case", () => {
      selectCase({ componentId: "case-01" });
      autoFillBuild();

      const outcome = clearBuild({ confirm: true });
      const st = buildStore.getState();

      expect(outcome.clearedComponentsCount).toBeGreaterThan(3);
      expect(outcome.clearedConnectionsCount).toBeGreaterThan(0);
      expect(outcome.clearedFanConfigsCount).toBeGreaterThan(0);
      expect(outcome.activeCasePreserved.componentId).toBe("case-01");

      expect(st.placements).toEqual([{ componentId: "case-01", mountId: "case-root" }]);
      expect(st.connections).toEqual([]);
      expect(st.fanConfigs).toEqual([]);
      expect(outcome.validation).toMatchObject({ status: "INCOMPLETE", valid: false });
    });

    it("throws CLEAR_BUILD_NO_CHANGES if no components are installed", () => {
      expect(() => clearBuild({ confirm: true })).toThrow(/CLEAR_BUILD_NO_CHANGES/);
    });
  });

  describe("WebMCP Tool Parity (auto_fill_build & clear_build)", () => {
    it("executes auto_fill_build tool successfully via WebMCP interface", async () => {
      const res = await executeWebMcpTool("auto_fill_build", {});
      expect(res.isError).toBeFalsy();
      expect(res.content[0].text).toContain("Auto-fill build completed successfully");
    });

    it("rejects clear_build without confirmation and succeeds with confirmation", async () => {
      await executeWebMcpTool("auto_fill_build", {});

      const failRes = await executeWebMcpTool("clear_build", { confirm: false });
      expect(failRes.isError).toBe(true);
      expect(failRes.content[0].text).toContain("CONFIRMATION_REQUIRED");

      const successRes = await executeWebMcpTool("clear_build", { confirm: true });
      expect(successRes.isError).toBeFalsy();
      expect(successRes.content[0].text).toContain("Build cleared successfully");
    });
  });
});
