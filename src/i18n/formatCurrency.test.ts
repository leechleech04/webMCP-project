import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("converts KRW catalog amounts to USD in English mode", () => {
    expect(formatCurrency(1_400_000, "en")).toBe("$1,000");
  });

  it("keeps KRW amounts in Korean mode", () => {
    expect(formatCurrency(1_400_000, "ko")).toContain("1,400,000");
  });
});
