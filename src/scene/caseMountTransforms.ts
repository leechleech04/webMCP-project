import type { CaseProfile } from "../domain/cases/types";
import type { SceneTransform } from "./mountTransforms";
import { mountTransforms } from "./mountTransforms";

export const getCaseMountTransform = (
  profile: CaseProfile | undefined,
  mountId: string
): SceneTransform | undefined => {
  if (profile && profile.mountTransforms && profile.mountTransforms[mountId]) {
    return profile.mountTransforms[mountId];
  }
  return mountTransforms[mountId];
};

export const getRequiredCaseMountTransform = (
  profile: CaseProfile | undefined,
  mountId: string
): SceneTransform => {
  const transform = getCaseMountTransform(profile, mountId);
  if (!transform) {
    throw new Error(`Missing mount transform for ${mountId} in case ${profile?.label ?? "default"}`);
  }
  return transform;
};
