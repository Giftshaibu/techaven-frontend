// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { readVisits, recordVisit, clearVisits, rankProducts } from "./browsing-history";
import type { CatalogProduct } from "./catalog-api";
const product = (slug: string, shop = "shop-1", category = "smartphones", inStock = true) =>
  ({ slug, shop, category, price: 100, inStock }) as CatalogProduct;
beforeEach(() => localStorage.clear());
describe("private browsing preferences", () => {
  it("expires history, rejects malformed entries and deduplicates successful visits", () => {
    localStorage.setItem(
      "techaven.browsing.v1",
      JSON.stringify([
        { kind: "product", slug: "old", at: 1 },
        { kind: "bad", slug: "bad", at: Date.now() },
      ]),
    );
    expect(readVisits()).toEqual([]);
    recordVisit({ kind: "product", slug: "one" });
    recordVisit({ kind: "product", slug: "one" });
    expect(readVisits()).toHaveLength(1);
    for (let i = 0; i < 30; i++) recordVisit({ kind: "shop", slug: `shop-${i}` });
    expect(readVisits()).toHaveLength(20);
    clearVisits();
    expect(readVisits()).toEqual([]);
  });
  it("ranks product then shop then related category, excludes unavailable and deduplicates", () => {
    const input = [
      product("default", "other", "audio"),
      product("category"),
      product("shop", "shop-2"),
      product("recent"),
      product("sold", "shop-2", "audio", false),
      product("recent"),
    ];
    const visits = [
      { kind: "shop" as const, slug: "shop-2", at: Date.now() },
      { kind: "product" as const, slug: "recent", category: "smartphones", at: Date.now() },
    ];
    expect(rankProducts(input, visits).map((p) => p.slug)).toEqual([
      "recent",
      "shop",
      "category",
      "default",
    ]);
    expect(rankProducts(input, []).map((p) => p.slug)).toEqual([
      "default",
      "category",
      "shop",
      "recent",
    ]);
  });
});
