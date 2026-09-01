import type { BuildState } from "../types/build";
import type { CaseProfile } from "../cases/types";
import type { AirflowScene, AirflowStream } from "./types";
import { getActiveCaseProfile } from "../cases/getActiveCase";
import { getRecommendedFanDirection } from "../cases/caseProfiles";

export const deriveAirflowScene = (
  state?: BuildState,
  profile?: CaseProfile
): AirflowScene => {
  const activeProfile = profile ?? getActiveCaseProfile(state);
  const fanPlacements = (state?.placements ?? []).filter((p) => p.componentId.startsWith("fan-"));
  const fanConfigs = state?.fanConfigs ?? [];

  const streams: AirflowStream[] = [];
  let intakeCount = 0;
  let exhaustCount = 0;
  let intakeCapacity = 0;
  let exhaustCapacity = 0;
  const unconfiguredFans: string[] = [];

  for (const fp of fanPlacements) {
    const meta = activeProfile.fanMounts.find((m) => m.mountId === fp.mountId);
    if (!meta) continue;

    let cfg = fanConfigs.find((c) => c.componentId === fp.componentId);
    let direction: "INTAKE" | "EXHAUST" | null = cfg?.direction ?? meta.recommendedDirection ?? getRecommendedFanDirection(fp.mountId);

    const isIntake = direction === "INTAKE";
    const cfm = meta.maxCfm || 60;
    const color = isIntake ? "#3b82f6" : "#ef4444";

    if (isIntake) {
      intakeCount++;
      intakeCapacity += cfm;
    } else {
      exhaustCount++;
      exhaustCapacity += cfm;
    }

    const pos = meta.transform.position;
    const loc = meta.location ?? (fp.mountId.includes("top") ? "top" : fp.mountId.includes("front") ? "front" : fp.mountId.includes("rear") ? "rear" : fp.mountId.includes("bottom") ? "bottom" : "side");

    let flowDir: [number, number, number] = [0, 0, -1.8]; // default front-to-back
    if (loc === "top") {
      flowDir = [0, 1.8, 0]; // upwards exhaust
    } else if (loc === "bottom") {
      flowDir = [0, 1.8, 0]; // upwards intake
    } else if (loc === "rear") {
      flowDir = [0, 0, -1.8]; // backwards exhaust
    } else if (loc === "side") {
      flowDir = [-1.8, 0, 0]; // inwards intake
    }

    const start: [number, number, number] = isIntake
      ? [pos[0] - flowDir[0], pos[1] - flowDir[1], pos[2] - flowDir[2]]
      : [pos[0], pos[1], pos[2]];
    const end: [number, number, number] = isIntake
      ? [pos[0], pos[1], pos[2]]
      : [pos[0] + flowDir[0], pos[1] + flowDir[1], pos[2] + flowDir[2]];

    const stream: AirflowStream = {
      id: `stream-${fp.componentId}`,
      componentId: fp.componentId,
      mountId: fp.mountId,
      direction,
      status: "active",
      color,
      start,
      end,
      particles: [
        { position: start, speed: 0.05 },
        { position: [ (start[0] + end[0])/2, (start[1] + end[1])/2, (start[2] + end[2])/2 ], speed: 0.05 },
      ],
      cfm,
    };
    streams.push(stream);
  }

  let balance: AirflowScene["balance"] = "balanced";
  if (intakeCapacity > exhaustCapacity) {
    balance = "positive";
  } else if (exhaustCapacity > intakeCapacity) {
    balance = "negative";
  }

  return {
    streams,
    perFanStreams: streams,
    intakeCount,
    exhaustCount,
    intakeCapacity,
    exhaustCapacity,
    balance,
    unconfiguredFans,
  };
};