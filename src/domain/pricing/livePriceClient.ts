import type { ComponentDefinition, ProductPrice } from "../types/component";

export type LivePriceMap = Readonly<Record<string, ProductPrice>>;

interface PriceApiResponse {
  quotes?: Array<{ productId?: unknown; amount?: unknown; source?: unknown; updatedAt?: unknown }>;
}

/**
 * Calls a same-origin/backend price proxy. Shopping credentials must never be
 * exposed to the browser; when no endpoint is configured the catalog estimate remains active.
 */
export const fetchLivePrices = async (
  products: readonly ComponentDefinition[],
  endpoint: string,
  signal?: AbortSignal,
): Promise<LivePriceMap> => {
  const requestedIds = new Set(products.map((product) => product.id));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      products: products.filter((product) => product.mpn).map((product) => ({
        productId: product.id,
        manufacturer: product.manufacturer,
        model: product.model,
        mpn: product.mpn,
      })),
    }),
    signal,
  });
  if (!response.ok) throw new Error(`Price service returned HTTP ${response.status}`);
  const payload = await response.json() as PriceApiResponse;
  if (!Array.isArray(payload.quotes)) throw new TypeError("Price service response must contain quotes[]");

  const prices: Record<string, ProductPrice> = {};
  for (const quote of payload.quotes) {
    if (typeof quote.productId !== "string" || !requestedIds.has(quote.productId)) continue;
    if (typeof quote.amount !== "number" || !Number.isFinite(quote.amount) || quote.amount <= 0) continue;
    if (typeof quote.source !== "string" || typeof quote.updatedAt !== "string") continue;
    prices[quote.productId] = {
      amount: Math.round(quote.amount),
      currency: "KRW",
      kind: "LIVE",
      source: quote.source,
      updatedAt: quote.updatedAt,
      billingUnit: products.find((product) => product.id === quote.productId)?.price?.billingUnit ?? "INSTANCE",
    };
  }
  return prices;
};
