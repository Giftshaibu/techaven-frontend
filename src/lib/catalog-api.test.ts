import { describe, expect, it } from "vitest";
import { mapMarketplaceDeviceToCatalog } from "./catalog-api";
import type { MarketplaceDevice } from "@/integrations/techaven/types";

const device: MarketplaceDevice = {
  id: 7, slug: "phone-seven", name: "Phone Seven",
  brand: { id: 1, name: "Example", slug: "example" },
  category: { id: 2, name: "Smartphones" }, release_date: null, soc: null,
  battery_mah: null, os_family: null, specs: {}, primary_image_url: null,
  media: [], variant_axes: [], variants: [],
  offers: [
    { id: 12, variant_id: 3, variant_color_id: null, shop: { id: 5, name: "Shop B" }, condition: "new", currency: "MWK", price: 250, quantity: 1, warranty_months: null, images: [] },
    { id: 11, variant_id: 3, variant_color_id: null, shop: { id: 4, name: "Shop A" }, condition: "used", currency: "MWK", price: 200, quantity: 2, warranty_months: 3, images: [] },
  ],
};

describe("marketplace catalogue mapping", () => {
  it("uses the lowest-priced offer and retains all offers", () => {
    const product = mapMarketplaceDeviceToCatalog(device);
    expect(product.slug).toBe("phone-seven");
    expect(product.listingId).toBe(11);
    expect(product.price).toBe(200);
    expect(product.shopName).toBe("Shop A");
    expect(product.offers).toHaveLength(2);
  });
});
