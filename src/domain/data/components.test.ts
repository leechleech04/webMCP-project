import { describe, expect, it } from "vitest";

import { componentRegistry } from "./components";

describe("production visual asset registry", () => {
  it("maps case-01 to the verified Lian Li GLB and frozen dimensions", () => {
    expect(componentRegistry["case-01"]).toMatchObject({
      name: "Lian Li Lancool 216",
      dimensions: { width: 235, height: 491.7, depth: 480.9 },
      visualAsset: {
        mode: "GLB",
        assetId: "CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X",
        url: "/assets/case-lian-li-lancool-216/lod0.glb",
        attributionPath: "assets/case-lian-li-lancool-216/ATTRIBUTION.md",
      },
    });
  });
});
