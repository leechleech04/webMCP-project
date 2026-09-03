import { afterEach, describe, expect, it, vi } from "vitest";
import { clearNaverPriceCache, lookupNaverShoppingPrices } from "./naverShoppingPriceService";

describe("Naver Shopping server-side price service", () => {
  afterEach(() => clearNaverPriceCache());

  it("selects the lowest valid shopping price and caches it by MPN", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ lprice: "249000" }, { lprice: "219900" }, { lprice: "0" }] }), { status: 200 }));
    const input = { products: [{ productId: "ssd", manufacturer: "Samsung", model: "990 PRO", mpn: "MZ-V9P2T0BW" }], clientId: "id", clientSecret: "secret", fetchImpl, now: () => 1000 };
    expect(await lookupNaverShoppingPrices(input)).toEqual([{ productId: "ssd", amount: 219900, source: "Naver Shopping", updatedAt: new Date(1000).toISOString() }]);
    expect(await lookupNaverShoppingPrices(input)).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][1].headers).toEqual({ "X-Naver-Client-Id": "id", "X-Naver-Client-Secret": "secret" });
  });

  it("fails closed when server credentials are absent", async () => {
    await expect(lookupNaverShoppingPrices({ products: [], clientId: "", clientSecret: "" })).rejects.toThrow(/credentials/);
  });
});
