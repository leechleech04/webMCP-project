import { componentRegistry, components, getProductId } from "../data/components";
import type { BuildState } from "../types/build";
import type { ComponentDefinition, ComponentType, ProductPrice } from "../types/component";

export interface PriceLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kind: "ESTIMATE" | "LIVE";
}

export interface PriceSummary {
  selectedLines: PriceLine[];
  selectedTotal: number;
  completionEstimate: number;
  projectedMissingProducts: ComponentDefinition[];
  allLive: boolean;
  updatedAt: string | null;
}

const COMPLETION_GROUPS: ReadonlyArray<{ key: string; types: ComponentType[] }> = [
  { key: "case", types: ["CASE"] },
  { key: "motherboard", types: ["MOTHERBOARD"] },
  { key: "cpu", types: ["CPU"] },
  { key: "ram", types: ["RAM"] },
  { key: "storage", types: ["STORAGE"] },
  { key: "gpu", types: ["GPU"] },
  { key: "cooling", types: ["CPU_COOLER", "RADIATOR"] },
  { key: "psu", types: ["PSU"] },
];

const compatibleProjectionCandidate = (
  candidate: ComponentDefinition,
  installed: ComponentDefinition[],
): boolean => {
  const motherboard = installed.find((item) => item.type === "MOTHERBOARD");
  const cpu = installed.find((item) => item.type === "CPU");
  const ram = installed.find((item) => item.type === "RAM");
  const socket = motherboard?.compatibility?.cpuSocket ?? cpu?.compatibility?.cpuSocket;
  const memoryType = motherboard?.compatibility?.memoryType ?? ram?.compatibility?.memoryType;

  if (candidate.type === "CPU" && socket && candidate.compatibility?.cpuSocket !== socket) return false;
  if (candidate.type === "MOTHERBOARD") {
    if (cpu?.compatibility?.cpuSocket && candidate.compatibility?.cpuSocket !== cpu.compatibility.cpuSocket) return false;
    if (ram?.compatibility?.memoryType && candidate.compatibility?.memoryType !== ram.compatibility.memoryType) return false;
  }
  if (candidate.type === "RAM" && memoryType && candidate.compatibility?.memoryType !== memoryType) return false;
  if ((candidate.type === "CPU_COOLER" || candidate.type === "RADIATOR") && socket &&
      candidate.compatibility?.supportedCpuSockets && !candidate.compatibility.supportedCpuSockets.includes(socket)) return false;
  if (candidate.type === "PSU") {
    const load = installed.reduce((sum, item) => sum + (item.power?.consumption ?? 0), 0);
    if ((candidate.power?.capacity ?? 0) < load * 1.2) return false;
  }
  return true;
};

export const derivePriceSummary = (
  state: BuildState,
  catalog: readonly ComponentDefinition[] = components,
  livePrices: Readonly<Record<string, ProductPrice>> = {},
): PriceSummary => {
  const grouped = new Map<string, { definition: ComponentDefinition; instanceCount: number }>();
  for (const placement of state.placements) {
    const productId = placement.productId ?? getProductId(placement.componentId);
    const definition = componentRegistry[productId];
    if (!definition?.price) continue;
    const current = grouped.get(productId);
    grouped.set(productId, { definition, instanceCount: (current?.instanceCount ?? 0) + 1 });
  }

  const selectedLines = [...grouped.entries()].map(([productId, { definition, instanceCount }]) => {
    const price = livePrices[productId] ?? definition.price;
    const quantity = price?.billingUnit === "PRODUCT" ? 1 : instanceCount;
    const unitPrice = price?.amount ?? 0;
    return {
      productId,
      name: definition.name,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      kind: price?.kind ?? "ESTIMATE",
    };
  });
  const selectedTotal = selectedLines.reduce((sum, line) => sum + line.total, 0);
  const installed = state.placements
    .map((placement) => componentRegistry[placement.productId ?? getProductId(placement.componentId)])
    .filter((definition): definition is ComponentDefinition => Boolean(definition));

  const projectedMissingProducts = COMPLETION_GROUPS.flatMap((group) => {
    if (installed.some((definition) => group.types.includes(definition.type))) return [];
    const candidate = catalog
      .filter((definition) => group.types.includes(definition.type) && definition.price)
      .filter((definition) => compatibleProjectionCandidate(definition, installed))
      .sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity))[0];
    return candidate ? [candidate] : [];
  });
  const missingTotal = projectedMissingProducts.reduce((sum, product) => sum + (livePrices[product.id]?.amount ?? product.price?.amount ?? 0), 0);
  const dates = [...selectedLines.map((line) => (livePrices[line.productId] ?? componentRegistry[line.productId]?.price)?.updatedAt),
    ...projectedMissingProducts.map((product) => product.price?.updatedAt)].filter((date): date is string => Boolean(date));

  return {
    selectedLines,
    selectedTotal,
    completionEstimate: selectedTotal + missingTotal,
    projectedMissingProducts,
    allLive: selectedLines.length > 0 && projectedMissingProducts.length === 0 && selectedLines.every((line) => line.kind === "LIVE"),
    updatedAt: dates.sort().at(-1) ?? null,
  };
};
