import type { BuildState } from "../types/build";
import type { CaseProfile } from "../cases/types";
import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";
import {
  assertComponentFitsActiveCase,
  assertCoolingZoneAvailable,
} from "../commands/commandGuards";
import { validateSpatialCollisions } from "../constraints/spatialCollisions";

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
      .filter((p) => p.mountId !== currentMountId)
      .map((p) => p.mountId)
  );

  return caseProfile.supportedMountIds
    .filter((mountId) => {
      const mount = mountRegistry[mountId];
      if (!mount || !mount.supportedComponentTypes.includes(component.type)) return false;
      try {
        assertComponentFitsActiveCase(state, component, mount);
        assertCoolingZoneAvailable(state, component, mount);
        const candidateId = currentMountId ? componentId : `${component.id}#candidate`;
        const placements = [
          ...state.placements.filter((placement) => placement.componentId !== componentId),
          { componentId: candidateId, ...(candidateId === component.id ? {} : { productId: component.id }), mountId },
        ];
        if (validateSpatialCollisions({ ...state, placements }).some((issue) => issue.affectedComponentIds.includes(candidateId))) return false;
        return true;
      } catch {
        return false;
      }
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
