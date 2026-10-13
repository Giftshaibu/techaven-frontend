import { expect, test, vi } from "vitest";
import { mapApiCategoryToCatalog } from "./catalog-api";
import { fetchCategoryProducts } from "./resolve-catalog";
import { getMarketplaceDevices } from "@/integrations/techaven/customer";
vi.mock("@/integrations/techaven/customer", () => ({ getMarketplaceDevices: vi.fn(async () => ({ devices: [], pagination: {} })) }));
test("live brand identity, stock count and photo survive category mapping", () => {
  const result = mapApiCategoryToCatalog({ id: 1, name: "Smartphones", brands: [{ slug: "apple", name: "apple", image: "https://example.com/iphone.png", product_count: 26 }] });
  expect(result.brands).toEqual(["Apple"]);
  expect(result.brandTiles?.[0]).toEqual({ slug: "apple", name: "Apple", image: "https://example.com/iphone.png", product_count: 26 });
  expect(mapApiCategoryToCatalog({ id: 1, name: "Smartphones" }).brandTiles).toEqual([]);
});
test("brand filter is sent to the API before pagination", async () => {
  await fetchCategoryProducts(1, 2, 100, "google");
  expect(getMarketplaceDevices).toHaveBeenCalledWith({ category_id: 1, page: 2, limit: 100, brand: "google" });
});
