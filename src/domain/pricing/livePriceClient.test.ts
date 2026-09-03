import { afterEach, describe, expect, it, vi } from "vitest";
import { components } from "../data/components";
import { fetchLivePrices } from "./livePriceClient";

describe("live price client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts validated quotes from a backend proxy without exposing shopping credentials", async () => {
    const product = components.find((item) => item.id === "storage-nvme-01")!;
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      quotes: [{ productId: product.id, amount: 219900, source: "Naver Shopping", updatedAt: "2026-09-03T07:00:00Z" }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchLivePrices([product], "/api/prices");
    expect(result[product.id]).toMatchObject({ amount: 219900, currency: "KRW", kind: "LIVE" });
    const request = fetchMock.mock.calls[0];
    expect(request[0]).toBe("/api/prices");
    expect(JSON.parse(request[1].body)).toEqual({ products: [{ productId: product.id, manufacturer: "Samsung", model: "990 PRO 2TB", mpn: "MZ-V9P2T0BW" }] });
  });

  it("rejects malformed proxy responses instead of replacing estimates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(fetchLivePrices([components[0]], "/api/prices")).rejects.toThrow(/quotes/);
  });
});
