import type { BuildState, FanConfig } from "../types/build";
import type { Placement } from "../types/placement";
import type { Connection } from "../types/connection";
import type { ComponentDefinition, ComponentType } from "../types/component";
import { getActiveCaseProfile } from "../cases/getActiveCase";
import { getRecommendedFanDirection } from "../cases/caseProfiles";
import { componentRegistry, components, getProductId } from "../data/components";
import { mountRegistry } from "../data/mounts";

export interface AutoFillPlan { formFactor: string; placements: Placement[]; connections: Connection[]; fanConfigs: FanConfig[]; }
const formFactorRank = { MINI_ITX: 1, MICRO_ATX: 2, ATX: 3, E_ATX: 4 } as const;

export const generateAutoFillRecipe = (state: BuildState): AutoFillPlan => {
  const profile = getActiveCaseProfile(state);
  const occupiedMounts = new Set(state.placements.map((placement) => placement.mountId));
  const reservedIds = new Set(state.placements.map((placement) => placement.componentId));
  const proposedPlacements: Placement[] = [];
  const proposedConnections: Connection[] = [];
  const proposedFanConfigs: FanConfig[] = [];
  const allPlacements = () => [...state.placements, ...proposedPlacements];
  const definitionFor = (placement: Placement) => componentRegistry[placement.productId ?? getProductId(placement.componentId)];
  const installedOfType = (type: ComponentType) => allPlacements().find((placement) => definitionFor(placement)?.type === type);
  const candidates = (type: ComponentType) => components.filter((component) => component.type === type);
  const fitsMount = (component: ComponentDefinition, mountId: string) => {
    const mount = mountRegistry[mountId];
    if (!mount?.supportedComponentTypes.includes(component.type) || !profile.supportedMountIds.includes(mountId)) return false;
    if (component.type === "STORAGE" && mount.supportedStorageFormFactors && !mount.supportedStorageFormFactors.includes(component.compatibility?.storageFormFactor ?? "M2_2280")) return false;
    const limit = profile.clearanceLimits[mountId] ?? mount.constraints;
    return (!limit?.maxWidth || component.dimensions.width <= limit.maxWidth) && (!limit?.maxHeight || component.dimensions.height <= limit.maxHeight) && (!limit?.maxDepth || component.dimensions.depth <= limit.maxDepth);
  };
  const reserve = (product: ComponentDefinition, mountId: string): Placement => {
    let componentId = product.id;
    if (reservedIds.has(componentId)) {
      let sequence = 2;
      while (reservedIds.has(`${product.id}#${sequence}`)) sequence += 1;
      componentId = `${product.id}#${sequence}`;
    }
    const placement = { componentId, ...(componentId === product.id ? {} : { productId: product.id }), mountId };
    reservedIds.add(componentId);
    occupiedMounts.add(mountId);
    proposedPlacements.push(placement);
    return placement;
  };

  if (!occupiedMounts.has("case-root") && profile.supportedMountIds.includes("case-root")) {
    const activeCase = componentRegistry[profile.componentId];
    if (activeCase) reserve(activeCase, "case-root");
  }
  if (!occupiedMounts.has("motherboard-tray") && profile.supportedMountIds.includes("motherboard-tray")) {
    const motherboard = candidates("MOTHERBOARD")
      .filter((component) => profile.supportedMotherboardFormFactors.includes(component.compatibility?.motherboardFormFactor ?? "ATX"))
      .filter((component) => fitsMount(component, "motherboard-tray"))
      .sort((a, b) => (formFactorRank[b.compatibility?.motherboardFormFactor ?? "ATX"] - formFactorRank[a.compatibility?.motherboardFormFactor ?? "ATX"]) || ((a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity)))[0];
    if (motherboard) reserve(motherboard, "motherboard-tray");
  }
  const motherboardPlacement = installedOfType("MOTHERBOARD");
  const motherboard = motherboardPlacement ? definitionFor(motherboardPlacement) : undefined;
  if (!occupiedMounts.has("cpu-socket-1") && profile.supportedMountIds.includes("cpu-socket-1")) {
    const cpu = candidates("CPU").filter((component) => !motherboard?.compatibility?.cpuSocket || component.compatibility?.cpuSocket === motherboard.compatibility.cpuSocket)
      .filter((component) => fitsMount(component, "cpu-socket-1"))
      .sort((a, b) => (b.power?.consumption ?? 0) - (a.power?.consumption ?? 0) || (a.price?.amount ?? 0) - (b.price?.amount ?? 0))[0];
    if (cpu) reserve(cpu, "cpu-socket-1");
  }
  const ramProduct = candidates("RAM").filter((component) => !motherboard?.compatibility?.memoryType || component.compatibility?.memoryType === motherboard.compatibility.memoryType)
    .sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity))[0];
  if (ramProduct) for (const mountId of ["dimm-a1", "dimm-b1"]) if (!occupiedMounts.has(mountId) && fitsMount(ramProduct, mountId)) reserve(ramProduct, mountId);
  if (!occupiedMounts.has("storage-m2-1")) {
    const storage = candidates("STORAGE").filter((component) => component.compatibility?.storageFormFactor === "M2_2280" && fitsMount(component, "storage-m2-1"))
      .sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity))[0];
    if (storage) reserve(storage, "storage-m2-1");
  }
  if (!occupiedMounts.has("pcie-slot-1")) {
    const gpu = candidates("GPU").filter((component) => fitsMount(component, "pcie-slot-1")).sort((a, b) => (b.price?.amount ?? 0) - (a.price?.amount ?? 0))[0];
    if (gpu) reserve(gpu, "pcie-slot-1");
  }
  const radiatorMount = ["radiator-top", "radiator-front"].find((mountId) => !occupiedMounts.has(mountId) && profile.supportedMountIds.includes(mountId));
  if (!installedOfType("RADIATOR") && radiatorMount) {
    const radiator = candidates("RADIATOR").filter((component) => fitsMount(component, radiatorMount)).sort((a, b) => b.dimensions.depth - a.dimensions.depth)[0]
      ?? (componentRegistry["radiator-120-01"] && fitsMount(componentRegistry["radiator-120-01"], radiatorMount) ? componentRegistry["radiator-120-01"] : undefined);
    if (radiator) reserve(radiator, radiatorMount);
  }
  if (!installedOfType("RADIATOR") && !occupiedMounts.has("cpu-cooler-1")) {
    const cooler = candidates("CPU_COOLER")
      .filter((component) => !motherboard?.compatibility?.cpuSocket || !component.compatibility?.supportedCpuSockets || component.compatibility.supportedCpuSockets.includes(motherboard.compatibility.cpuSocket))
      .filter((component) => fitsMount(component, "cpu-cooler-1")).sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity))[0];
    if (cooler) reserve(cooler, "cpu-cooler-1");
  }
  const activeCaseHasIntegratedPsu = componentRegistry[profile.componentId]?.integratedPsu !== undefined;
  if (!activeCaseHasIntegratedPsu && !occupiedMounts.has("psu-bay") && profile.supportedMountIds.includes("psu-bay")) {
    const load = allPlacements().reduce((total, placement) => total + (definitionFor(placement)?.power?.consumption ?? 0), 0);
    const gpuPlacement = installedOfType("GPU");
    const gpuTypes = gpuPlacement ? (definitionFor(gpuPlacement)?.connectors ?? []).filter((connector) => connector.direction === "INPUT").map((connector) => connector.type) : [];
    const psu = candidates("PSU").filter((component) => fitsMount(component, "psu-bay") && (component.power?.capacity ?? 0) >= load * 1.2)
      .filter((component) => gpuTypes.every((type) => component.connectors?.some((connector) => connector.direction === "OUTPUT" && connector.type === type)))
      .sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity))[0];
    if (psu) reserve(psu, "psu-bay");
  }
  const radiatorPlacement = installedOfType("RADIATOR");
  const installedGpuPlacement = installedOfType("GPU");
  const blockedFanLocation = radiatorPlacement?.mountId.includes("top") ? "top" : radiatorPlacement?.mountId.includes("front") ? "front" : undefined;
  for (const fanMount of profile.fanMounts) {
    if (occupiedMounts.has(fanMount.mountId) || fanMount.location === blockedFanLocation) continue;
    // Terra exposes one optional bottom fan. Auto-installing that lone fan
    // creates a knowingly unbalanced layout, so leave it as an explicit choice.
    if (profile.id === "case-profile-terra") continue;
    if (profile.id === "case-profile-sff" && installedGpuPlacement && fanMount.location === "bottom") continue;
    const fan = candidates("FAN").filter((component) => fitsMount(component, fanMount.mountId))
      .sort((a, b) => Math.abs(a.dimensions.width - fanMount.sizeMm) - Math.abs(b.dimensions.width - fanMount.sizeMm))[0];
    if (!fan) continue;
    const placement = reserve(fan, fanMount.mountId);
    proposedFanConfigs.push({ componentId: placement.componentId, direction: fanMount.recommendedDirection ?? getRecommendedFanDirection(fanMount.mountId), mountId: fanMount.mountId });
  }
  const predicted = allPlacements();
  const psuPlacement = predicted.find((placement) => definitionFor(placement)?.type === "PSU");
  if (psuPlacement) {
    const psu = definitionFor(psuPlacement);
    const usedOutputs = new Set(state.connections.filter((connection) => connection.from.componentId === psuPlacement.componentId).map((connection) => connection.from.connectorId));
    for (const targetPlacement of predicted) {
      const target = definitionFor(targetPlacement);
      if (!target || !["MOTHERBOARD", "GPU"].includes(target.type)) continue;
      for (const input of (target.connectors ?? []).filter((connector) => connector.direction === "INPUT" && ["ATX_24PIN", "EPS_8PIN", "PCIE_8PIN", "12V_2X6"].includes(connector.type))) {
        if (state.connections.some((connection) => connection.to.componentId === targetPlacement.componentId && connection.to.connectorId === input.id)) continue;
        const output = psu?.connectors?.find((connector) => connector.direction === "OUTPUT" && connector.type === input.type && !usedOutputs.has(connector.id));
        if (!output) continue;
        usedOutputs.add(output.id);
        proposedConnections.push({ id: `${psuPlacement.componentId}:${output.id}->${targetPlacement.componentId}:${input.id}`, from: { componentId: psuPlacement.componentId, connectorId: output.id }, to: { componentId: targetPlacement.componentId, connectorId: input.id } });
      }
    }
  }
  return { formFactor: profile.formFactor, placements: proposedPlacements, connections: proposedConnections, fanConfigs: proposedFanConfigs };
};
