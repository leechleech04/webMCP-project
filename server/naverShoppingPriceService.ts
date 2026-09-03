export interface PriceLookupProduct {
  productId: string;
  manufacturer?: string;
  model?: string;
  mpn: string;
}

export interface PriceQuote {
  productId: string;
  amount: number;
  source: "Naver Shopping";
  updatedAt: string;
}

interface NaverShoppingItem { title?: string; lprice?: string; productId?: string; mallName?: string; }
interface NaverShoppingResponse { items?: NaverShoppingItem[]; }
interface CacheEntry { expiresAt: number; quote: PriceQuote; }
export type ServerFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const quoteCache = new Map<string, CacheEntry>();

const lowestValidPrice = (items: NaverShoppingItem[]): number | undefined => items
  .map((item) => Number(item.lprice))
  .filter((price) => Number.isFinite(price) && price > 0)
  .sort((a, b) => a - b)[0];

export const lookupNaverShoppingPrices = async ({
  products,
  clientId,
  clientSecret,
  fetchImpl,
  now = () => Date.now(),
}: {
  products: readonly PriceLookupProduct[];
  clientId: string;
  clientSecret: string;
  fetchImpl?: ServerFetch;
  now?: () => number;
}): Promise<PriceQuote[]> => {
  if (!clientId || !clientSecret) throw new Error("Naver Shopping API credentials are not configured");
  const serverFetch = fetchImpl ?? (globalThis as { fetch?: ServerFetch }).fetch;
  if (!serverFetch) throw new Error("This server runtime does not provide fetch");
  const quotes: PriceQuote[] = [];

  for (const product of products) {
    const cacheKey = product.mpn.trim().toUpperCase();
    const cached = quoteCache.get(cacheKey);
    if (cached && cached.expiresAt > now()) {
      quotes.push({ ...cached.quote, productId: product.productId });
      continue;
    }
    const query = [product.manufacturer, product.model, product.mpn].filter(Boolean).join(" ");
    const response = await serverFetch(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=10&sort=sim`, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!response.ok) throw new Error(`Naver Shopping API returned HTTP ${response.status}`);
    const payload = await response.json() as NaverShoppingResponse;
    const amount = lowestValidPrice(Array.isArray(payload.items) ? payload.items : []);
    if (!amount) continue;
    const quote: PriceQuote = { productId: product.productId, amount, source: "Naver Shopping", updatedAt: new Date(now()).toISOString() };
    quoteCache.set(cacheKey, { quote, expiresAt: now() + CACHE_TTL_MS });
    quotes.push(quote);
  }
  return quotes;
};

export const clearNaverPriceCache = (): void => quoteCache.clear();
