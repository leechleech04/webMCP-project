import { beforeEach, describe, expect, it } from "vitest";
import { installComponent } from "../commands/installComponent";
import { selectCase } from "../commands/selectCase";
import { assessBuildState } from "../constraints/buildAssessment";
import { derivePriceSummary } from "../pricing/priceSummary";
import { components, componentRegistry } from "./components";
import { buildStore, resetBuildStore } from "../../store/buildStore";

describe("real product catalog and installed instances", () => {
  beforeEach(() => resetBuildStore());

  it("publishes every purchasable SKU with stable MPN and estimated KRW prices", () => {
    expect(components).toHaveLength(33);
    expect(new Set(components.map((product) => product.id)).size).toBe(33);
    expect(Object.fromEntries([...new Set(components.map((product) => product.type))].map((type) => [
      type, components.filter((product) => product.type === type).length,
    ]))).toEqual({ CASE: 5, MOTHERBOARD: 4, CPU: 4, GPU: 5, RAM: 2, STORAGE: 3, CPU_COOLER: 3, RADIATOR: 2, PSU: 3, FAN: 2 });
    for (const product of components) {
      expect(product.manufacturer).toBeTruthy();
      expect(product.model).toBeTruthy();
      expect(product.mpn).toBeTruthy();
      expect(product.officialUrl).toMatch(/^https:\/\//);
      expect(product.price).toMatchObject({ currency: "KRW", kind: "ESTIMATE", updatedAt: "2026-09-03" });
      expect(product.price?.amount).toBeGreaterThan(0);
    }
  });

  it("installs the same physical fan SKU as unique instances without losing its product definition", () => {
    selectCase({ componentId: "case-01" });
    const first = installComponent({ componentId: "fan-top-01", mountId: "fan-top-1" });
    const second = installComponent({ componentId: "fan-top-01", mountId: "fan-top-2" });

    expect(first.componentId).toBe("fan-top-01");
    expect(second).toEqual({ componentId: "fan-top-01#2", productId: "fan-top-01", mountId: "fan-top-2" });
    expect(componentRegistry[second.componentId].mpn).toBe("NF-A12X25-G2-PWM");
    expect(buildStore.getState().fanConfigs.map((config) => config.componentId)).toEqual(["fan-top-01", "fan-top-01#2"]);
  });

  it("prices a two-module RAM kit once while pricing fans per installed unit", () => {
    const state = {
      placements: [
        { componentId: "case-01", mountId: "case-root" },
        { componentId: "ram-01", mountId: "dimm-a1" },
        { componentId: "ram-01#2", productId: "ram-01", mountId: "dimm-b1" },
        { componentId: "fan-top-01", mountId: "fan-top-1" },
        { componentId: "fan-top-01#2", productId: "fan-top-01", mountId: "fan-top-2" },
      ],
      connections: [], fanConfigs: [], activity: [],
    };
    const summary = derivePriceSummary(state);
    expect(summary.selectedLines.find((line) => line.productId === "ram-01")).toMatchObject({ quantity: 1, total: 149000 });
    expect(summary.selectedLines.find((line) => line.productId === "fan-top-01")).toMatchObject({ quantity: 2, total: 98000 });
    expect(summary.selectedTotal).toBe(396000);
    expect(summary.completionEstimate).toBeGreaterThan(summary.selectedTotal);
  });

  it("does not project a discrete GPU or second PSU for the Chopin MAX", () => {
    selectCase({ componentId: "case-mini-pc-01" });
    const summary = derivePriceSummary(buildStore.getState());
    expect(summary.projectedMissingProducts.some((product) => product.type === "GPU")).toBe(false);
    expect(summary.projectedMissingProducts.some((product) => product.type === "PSU")).toBe(false);
  });

  it("requires both 8-pin GPU power inputs for actual dual-connector cards", () => {
    selectCase({ componentId: "case-01" });
    installComponent({ componentId: "gpu-compact-200", mountId: "pcie-slot-1" });
    installComponent({ componentId: "psu-atx-650", mountId: "psu-bay" });
    const assessment = assessBuildState(buildStore.getState());
    expect(assessment.missingPowerConnections.filter((item) => item.includes("PCIE_8PIN"))).toHaveLength(2);
  });
});
