import type { CaseProfile } from "../domain/cases/types";

export function getCaseCameraPosition(profile: CaseProfile): [number, number, number] {
  const [targetX, targetY, targetZ] = profile.camera.target;
  const distance = profile.camera.distance;
  return [
    targetX + distance * 0.72,
    targetY + distance * 0.52,
    targetZ + distance * 0.82,
  ];
}
