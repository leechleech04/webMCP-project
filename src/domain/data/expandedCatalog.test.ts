import { describe, expect, it } from "vitest";
import { caseProfiles } from "../cases/caseProfiles";
import { applyDomainAction } from "../commands/transition";
import { getCompatibleMountCandidates } from "../interaction/getCompatibleMounts";
import type { BuildState } from "../types/build";
import { componentRegistry } from "./components";
import { validateBuild } from "../constraints/validateBuild";

const addedIds = [
  "case-matx-airflow", "case-dual-chamber-atx",
  "motherboard-matx-am5", "motherboard-atx-lga1851", "motherboard-itx-lga1851",
  "cpu-am5-65w", "cpu-am5-170w", "cpu-lga1851-125w",
  "gpu-compact-200", "gpu-performance-280", "gpu-enthusiast-360",
  "ram-lowprofile-32", "ram-lowprofile-48",
  "storage-nvme-heatsink", "storage-sata-2tb", "storage-hdd-4tb",
  "psu-atx-650", "psu-atx-short-850", "radiator-280-01", "fan-140-argb-01",
  "cooler-single-tower", "cooler-dual-tower",
] as const;

const blank = (caseId: string): BuildState => ({
  placements: [{ componentId: caseId, mountId: "case-root" }],
  connections: [], fanConfigs: [], activity: [],
});

describe("expanded component catalog", () => {
  it("contains the expanded registry and new compact products", () => {
    expect(Object.keys(componentRegistry)).toHaveLength(50);
    for (const id of addedIds) expect(componentRegistry[id], id).toBeDefined();
    for (const id of ["case-terra-01", "cooler-low-profile-am5"]) expect(componentRegistry[id], id).toBeDefined();
  });

  it("has seven selectable case profiles with complete mount transforms", () => {
    expect(caseProfiles).toHaveLength(7);
    for (const profile of caseProfiles) {
      expect(componentRegistry[profile.componentId]?.type).toBe("CASE");
      for (const mountId of profile.supportedMountIds) {
        expect(profile.mountTransforms[mountId], `${profile.id}:${mountId}`).toBeDefined();
      }
    }
  });

  it("can install and remove every new non-case part in at least one case", () => {
    for (const componentId of addedIds.filter((id) => componentRegistry[id].type !== "CASE")) {
      let exercised = false;
      for (const profile of caseProfiles) {
        const state = blank(profile.componentId);
        const candidates = getCompatibleMountCandidates({ componentId, currentMountId: "", state, caseProfile: profile });
        if (candidates.length === 0) continue;
        const installed = applyDomainAction(state, { type: "INSTALL_COMPONENT", componentId, mountId: candidates[0].mountId }, { recordActivity: false }).state;
        expect(installed.placements.some((p) => p.componentId === componentId)).toBe(true);
        const removed = applyDomainAction(installed, { type: "REMOVE_COMPONENT", componentId }, { recordActivity: false }).state;
        expect(removed.placements.some((p) => p.componentId === componentId)).toBe(false);
        exercised = true;
        break;
      }
      expect(exercised, `${componentId} has no installable case/mount combination`).toBe(true);
    }
  });

  it("switches to both new cases without losing a valid empty build", () => {
    let state = blank("case-01");
    for (const componentId of ["case-matx-airflow", "case-dual-chamber-atx"]) {
      state = applyDomainAction(state, { type: "SELECT_CASE", componentId }, { recordActivity: false }).state;
      expect(state.placements).toContainEqual({ componentId, mountId: "case-root" });
    }
  });

  it("shares 13 new GLB families across the expanded product definitions", () => {
    const urls = new Set(addedIds.map((id) => componentRegistry[id].visualAsset?.url).filter(Boolean));
    expect(urls.size).toBe(13);
    expect(componentRegistry["cpu-am5-65w"].visualAsset?.url).toBe(componentRegistry["cpu-am5-170w"].visualAsset?.url);
    expect(componentRegistry["gpu-compact-200"].visualAsset?.url).toBe(componentRegistry["gpu-performance-280"].visualAsset?.url);
  });

  it("routes each storage form factor only to its matching bay", () => {
    const profile = caseProfiles.find((item) => item.componentId === "case-dual-chamber-atx")!;
    const state = blank(profile.componentId);
    const candidates = (componentId: string) => getCompatibleMountCandidates({ componentId, currentMountId: "", state, caseProfile: profile }).map((item) => item.mountId);
    expect(candidates("storage-nvme-heatsink")).toEqual(["storage-m2-1"]);
    expect(candidates("storage-sata-2tb")).toEqual(["storage-2-5-1"]);
    expect(candidates("storage-hdd-4tb")).toEqual(["storage-3-5-1"]);
  });

  it("rejects oversized fans from 120mm-only mounts", () => {
    const profile = caseProfiles.find((item) => item.componentId === "case-mini-pc-01")!;
    const candidates = getCompatibleMountCandidates({ componentId: "fan-140-argb-01", currentMountId: "", state: blank(profile.componentId), caseProfile: profile });
    expect(candidates).toHaveLength(0);
  });

  it("reports mutually exclusive air and liquid CPU cooling", () => {
    const state: BuildState = {
      ...blank("case-dual-chamber-atx"),
      placements: [
        { componentId: "case-dual-chamber-atx", mountId: "case-root" },
        { componentId: "motherboard-matx-am5", mountId: "motherboard-tray" },
        { componentId: "cooler-single-tower", mountId: "cpu-cooler-1" },
        { componentId: "radiator-280-01", mountId: "radiator-front" },
      ],
    };
    expect(validateBuild(state).map((issue) => issue.id)).toContain("CPU_COOLING_SOLUTION_CONFLICT");
  });
});
