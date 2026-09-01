import type { BuildState } from "../types/build";
import type { CaseProfile } from "../cases/types";
import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";

export interface CompatibleMountCandidate {
  mountId: string;
  label: string;
  isOccupied: boolean;
  isValidSnap: boolean;
  position: [number, number, number];
}

export const getCompatibleMountCandidates = ({
  componentId,
  currentMountId,
  state,
  caseProfile,
}: {
  componentId: string;
  currentMountId: string;
  state: BuildState;
  caseProfile: CaseProfile;
}): CompatibleMountCandidate[] => {
  const component = componentRegistry[componentId];
  if (!component) return [];

  const occupiedMounts = new Set(
    state.placements
      .filter((p) => p.componentId !== componentId)
      .map((p) => p.mountId)
  );

  return caseProfile.supportedMountIds
    .filter((mountId) => {
      const mount = mountRegistry[mountId];
      return mount && mount.supportedComponentTypes.includes(component.type);
    })
    .map((mountId) => {
      const transform = caseProfile.mountTransforms[mountId] ?? { position: [0, 0, 0] };
      const isOccupied = occupiedMounts.has(mountId);
      return {
        mountId,
        label: mountId.replace(/-/g, " ").toUpperCase(),
        isOccupied,
        isValidSnap: !isOccupied,
        position: transform.position,
      };
    });
};

export const getValidSnapTargets = getCompatibleMountCandidates;
