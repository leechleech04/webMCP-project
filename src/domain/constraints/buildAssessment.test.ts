import { beforeEach, describe, expect, it } from "vitest";
import { resetBuildStore } from "../../store/buildStore";
import { installComponent } from "../commands/installComponent";
import { connectComponents } from "../commands/connectComponents";
import { selectCase } from "../commands/selectCase";
import { autoFillBuild } from "../commands/autoFillBuild";
import { assessBuildState } from "./buildAssessment";
import { getBuildState } from "../../store/buildStore";

describe("buildAssessment layer", () => {
  beforeEach(() => resetBuildStore());

  it("reports INCOMPLETE for an empty build and lists missing essential component types", () => {
    const assessment = assessBuildState(getBuildState());
    expect(assessment.status).toBe("INCOMPLETE");
    expect(assessment.missingComponentTypes).toEqual([
      "CASE",
      "MOTHERBOARD",
      "CPU",
      "RAM",
      "PSU",
    ]);
  });

  it("reports INCOMPLETE when components are installed but missing power cables", () => {
    selectCase({ componentId: "case-01" });
    installComponent({ componentId: "motherboard-01", mountId: "motherboard-tray" });
    installComponent({ componentId: "cpu-01", mountId: "cpu-socket-1" });
    installComponent({ componentId: "ram-01", mountId: "dimm-a1" });
    installComponent({ componentId: "psu-01", mountId: "psu-bay" });

    const assessment = assessBuildState(getBuildState());
    expect(assessment.status).toBe("INCOMPLETE");
    expect(assessment.missingComponentTypes).toEqual([]);
    expect(assessment.missingPowerConnections.length).toBeGreaterThan(0);
    expect(assessment.missingPowerConnections[0]).toContain("ATX 24-Pin Power");
  });

  it("reports READY when build is auto-filled and all essential components and power cables are present", () => {
    autoFillBuild();
    const assessment = assessBuildState(getBuildState());
    expect(assessment.status).toBe("READY");
    expect(assessment.valid).toBe(true);
    expect(assessment.missingComponentTypes).toEqual([]);
    expect(assessment.missingPowerConnections).toEqual([]);
  });

  it("reports CONFLICT when a blocking constraint violation exists", () => {
    installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" });
    installComponent({ componentId: "radiator-01", mountId: "radiator-front" });

    const assessment = assessBuildState(getBuildState());
    expect(assessment.status).toBe("CONFLICT");
    expect(assessment.issues.some((i) => i.id === "GPU_RADIATOR_COLLISION")).toBe(true);
  });
});
