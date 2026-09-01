import type { BuildState } from "../types/build";
import type { Placement } from "../types/placement";
import type { Connection } from "../types/connection";
import type { FanConfig } from "../types/build";
import { getActiveCaseProfile } from "../cases/getActiveCase";
import { getRecommendedFanDirection } from "../cases/caseProfiles";
import { componentRegistry } from "../data/components";
import { mountRegistry } from "../data/mounts";

export interface AutoFillPlan {
  formFactor: string;
  placements: Placement[];
  connections: Connection[];
  fanConfigs: FanConfig[];
}

export const generateAutoFillRecipe = (state: BuildState): AutoFillPlan => {
  const profile = getActiveCaseProfile(state);
  const occupiedMounts = new Set(state.placements.map((p) => p.mountId));
  const installedComponents = new Set(state.placements.map((p) => p.componentId));

  const proposedPlacements: Placement[] = [];
  const proposedConnections: Connection[] = [];
  const proposedFanConfigs: FanConfig[] = [];

  const isMini = profile.formFactor.toUpperCase().includes("MINI") || profile.id.toLowerCase().includes("mini");

  // 0. Case Root
  if (!occupiedMounts.has("case-root") && profile.supportedMountIds.includes("case-root")) {
    if (componentRegistry[profile.componentId] && !installedComponents.has(profile.componentId)) {
      proposedPlacements.push({ componentId: profile.componentId, mountId: "case-root" });
      occupiedMounts.add("case-root");
      installedComponents.add(profile.componentId);
    }
  }

  // 1. Motherboard
  if (!occupiedMounts.has("motherboard-tray") && profile.supportedMountIds.includes("motherboard-tray")) {
    const mbLimit = profile.clearanceLimits["motherboard-tray"];
    const mbId = (isMini || (mbLimit?.maxDepth && mbLimit.maxDepth < 305)) && componentRegistry["motherboard-itx-01"]
      ? "motherboard-itx-01"
      : "motherboard-01";
    if (!installedComponents.has(mbId)) {
      proposedPlacements.push({ componentId: mbId, mountId: "motherboard-tray" });
      occupiedMounts.add("motherboard-tray");
      installedComponents.add(mbId);
    }
  }

  // 2. CPU
  if (!occupiedMounts.has("cpu-socket-1") && profile.supportedMountIds.includes("cpu-socket-1")) {
    const cpuId = "cpu-01";
    if (componentRegistry[cpuId] && !installedComponents.has(cpuId)) {
      proposedPlacements.push({ componentId: cpuId, mountId: "cpu-socket-1" });
      occupiedMounts.add("cpu-socket-1");
      installedComponents.add(cpuId);
    }
  }

  // 3. RAM
  const dimmSlots = ["dimm-a1", "dimm-b1"].filter((m) => profile.supportedMountIds.includes(m));
  for (let i = 0; i < dimmSlots.length; i++) {
    const slot = dimmSlots[i];
    const ramId = `ram-0${i + 1}`;
    if (!occupiedMounts.has(slot) && componentRegistry[ramId] && !installedComponents.has(ramId)) {
      proposedPlacements.push({ componentId: ramId, mountId: slot });
      occupiedMounts.add(slot);
      installedComponents.add(ramId);
    }
  }

  // 4. GPU (check clearance)
  if (!occupiedMounts.has("pcie-slot-1") && profile.supportedMountIds.includes("pcie-slot-1")) {
    const limit = profile.clearanceLimits["pcie-slot-1"];
    let gpuCandidate = "gpu-01";
    if (isMini || (limit?.maxDepth && limit.maxDepth < 340)) {
      gpuCandidate = componentRegistry["gpu-1fan-01"] ? "gpu-1fan-01" : "gpu-01";
    }
    if (componentRegistry[gpuCandidate] && !installedComponents.has(gpuCandidate)) {
      proposedPlacements.push({ componentId: gpuCandidate, mountId: "pcie-slot-1" });
      occupiedMounts.add("pcie-slot-1");
      installedComponents.add(gpuCandidate);
    }
  }

  // 5. Radiator
  const radMount = ["radiator-top", "radiator-front"].find((m) => profile.supportedMountIds.includes(m) && !occupiedMounts.has(m));
  if (radMount) {
    const limit = profile.clearanceLimits[radMount];
    let radCandidate = "radiator-01";
    if (limit?.maxDepth && limit.maxDepth < 397) {
      radCandidate = limit.maxDepth >= 275 && componentRegistry["radiator-240-01"] ? "radiator-240-01" : "radiator-120-01";
    }
    if (componentRegistry[radCandidate] && !installedComponents.has(radCandidate)) {
      proposedPlacements.push({ componentId: radCandidate, mountId: radMount });
      occupiedMounts.add(radMount);
      installedComponents.add(radCandidate);
    }
  }

  // 6. PSU
  if (!occupiedMounts.has("psu-bay") && profile.supportedMountIds.includes("psu-bay")) {
    const psuLimit = profile.clearanceLimits["psu-bay"];
    const psuId = (isMini || (psuLimit?.maxDepth && psuLimit.maxDepth < 180)) && componentRegistry["psu-sfx-01"]
      ? "psu-sfx-01"
      : "psu-01";
    if (componentRegistry[psuId] && !installedComponents.has(psuId)) {
      proposedPlacements.push({ componentId: psuId, mountId: "psu-bay" });
      occupiedMounts.add("psu-bay");
      installedComponents.add(psuId);
    }
  }

  // 7. Fans
  const fanMounts = profile.fanMounts.filter((m) => !occupiedMounts.has(m.mountId));
  for (const fm of fanMounts) {
    let fanId = fm.mountId.replace("fan-", "fan-") + "-01";
    if (!componentRegistry[fanId]) {
      fanId = "fan-top-01";
    }
    if (installedComponents.has(fanId)) {
      const candidates = Object.keys(componentRegistry).filter((id) => id.startsWith("fan-") && !installedComponents.has(id));
      if (candidates.length > 0) fanId = candidates[0];
      else continue;
    }
    proposedPlacements.push({ componentId: fanId, mountId: fm.mountId });
    occupiedMounts.add(fm.mountId);
    installedComponents.add(fanId);

    const dir = fm.recommendedDirection ?? getRecommendedFanDirection(fm.mountId);
    proposedFanConfigs.push({ componentId: fanId, direction: dir });
  }

  // 8. Power Cables
  const allPlacements = [...state.placements, ...proposedPlacements];
  const psuPlacement = allPlacements.find((p) => p.componentId.startsWith("psu"));
  const mbPlacement = allPlacements.find((p) => p.componentId.startsWith("motherboard"));
  const gpuPlacement = allPlacements.find((p) => p.componentId.startsWith("gpu"));

  if (psuPlacement && mbPlacement) {
    const atxId = `${psuPlacement.componentId}:psu-atx-01->${mbPlacement.componentId}:motherboard-atx`;
    if (!state.connections.some((c) => c.id === atxId)) {
      proposedConnections.push({
        id: atxId,
        from: { componentId: psuPlacement.componentId, connectorId: "psu-atx-01" },
        to: { componentId: mbPlacement.componentId, connectorId: "motherboard-atx" },
      });
    }

    const epsId = `${psuPlacement.componentId}:psu-eps-01->${mbPlacement.componentId}:motherboard-eps`;
    if (!state.connections.some((c) => c.id === epsId)) {
      proposedConnections.push({
        id: epsId,
        from: { componentId: psuPlacement.componentId, connectorId: "psu-eps-01" },
        to: { componentId: mbPlacement.componentId, connectorId: "motherboard-eps" },
      });
    }
  }

  if (psuPlacement && gpuPlacement) {
    const id = `${psuPlacement.componentId}:psu-gpu-01->${gpuPlacement.componentId}:gpu-power`;
    if (!state.connections.some((c) => c.id === id)) {
      proposedConnections.push({
        id,
        from: { componentId: psuPlacement.componentId, connectorId: "psu-gpu-01" },
        to: { componentId: gpuPlacement.componentId, connectorId: "gpu-power" },
      });
    }
  }

  return {
    formFactor: profile.formFactor,
    placements: proposedPlacements,
    connections: proposedConnections,
    fanConfigs: proposedFanConfigs,
  };
};