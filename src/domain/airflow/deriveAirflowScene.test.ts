import { describe, expect, it } from "vitest";

import { getCaseProfile } from "../cases/caseProfiles";
import type { BuildState } from "../types/build";
import { deriveAirflowScene } from "./deriveAirflowScene";

const stateWithRadiator = (
  componentId: string,
  mountId: "radiator-top" | "radiator-front",
): BuildState => ({
  placements: [
    { componentId: "case-01", mountId: "case-root" },
    { componentId, mountId },
  ],
  connections: [],
  fanConfigs: [],
  activity: [],
});

describe("integrated radiator airflow", () => {
  const profile = getCaseProfile("case-01")!;

  it("renders one upward exhaust stream per top radiator fan", () => {
    const airflow = deriveAirflowScene(
      stateWithRadiator("radiator-240-01", "radiator-top"),
      profile,
    );

    expect(airflow.intakeCount).toBe(0);
    expect(airflow.exhaustCount).toBe(2);
    expect(airflow.streams).toHaveLength(2);
    expect(airflow.streams.every((stream) => stream.color === "#ef4444")).toBe(true);
    expect(airflow.streams.every((stream) => stream.end[1] > stream.start[1])).toBe(true);
  });

  it("renders front radiator fans as blue inward intake streams", () => {
    const airflow = deriveAirflowScene(
      stateWithRadiator("radiator-120-01", "radiator-front"),
      profile,
    );

    expect(airflow.intakeCount).toBe(1);
    expect(airflow.exhaustCount).toBe(0);
    expect(airflow.streams[0].color).toBe("#3b82f6");
    expect(airflow.streams[0].start[2]).toBeGreaterThan(airflow.streams[0].end[2]);
  });
});
