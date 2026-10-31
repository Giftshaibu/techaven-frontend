import { describe, expect, it } from "vitest";
import { enrichCategoryIcons, mapApiCategoryToCatalog, mapMarketplaceDeviceToCatalog, selectMarketplaceOffer } from "./catalog-api";
import type { MarketplaceDevice } from "@/integrations/techaven/types";

const device: MarketplaceDevice = {
  id: 7,
  slug: "phone-seven",
  name: "Phone Seven",
  brand: { id: 1, name: "Example", slug: "example" },
  category: { id: 2, name: "Smartphones" },
  release_date: null,
  soc: null,
  battery_mah: null,
  os_family: null,
  specs: {},
  primary_image_url: null,
  media: [],
  variant_axes: [],
  variants: [],
  offers: [
    {
      id: 12,
      variant_id: 3,
      variant_color_id: null,
      shop: { id: 5, name: "Shop B" },
      condition: "new",
      currency: "MWK",
      price: 250,
      quantity: 1,
      warranty_months: null,
      images: [],
    },
    {
      id: 11,
      variant_id: 3,
      variant_color_id: null,
      shop: { id: 4, name: "Shop A" },
      condition: "used",
      currency: "MWK",
      price: 200,
      quantity: 2,
      warranty_months: 3,
      images: [],
    },
  ],
};

describe("category icons", () => {
  it("uses the category name for ID-based routes without changing the route", () => {
    const category = mapApiCategoryToCatalog({ id: 1, name: "Smartphones" });
    expect(category.slug).toBe("c-1");
    expect(category.icon).toBe("smartphone-2-linear");
    expect(enrichCategoryIcons([{ ...category, icon: "box-minimalistic-linear" }])[0]?.icon)
      .toBe("smartphone-2-linear");
  });

  it("preserves explicit icons and retains the fallback for unknown categories", () => {
    const category = mapApiCategoryToCatalog({ id: 2, name: "Other" });
    expect(category.icon).toBe("box-minimalistic-linear");
    expect(enrichCategoryIcons([{ ...category, icon: "headphones-round-linear" }])[0]?.icon)
      .toBe("headphones-round-linear");
  });
});

describe("marketplace catalogue mapping", () => {
  it("switches seller, configuration, condition, warranty, image and basket listing together", () => {
    const first = {
      ...device.offers[0]!,
      id: 71,
      variant_id: 1,
      price: 499000,
      condition: "new" as const,
      shop: { id: 1, name: "Mnex Electronics" },
      images: [{ id: 1, url: "/offer-71.jpg", is_primary: true }],
    };
    const second = {
      ...device.offers[1]!,
      id: 72,
      variant_id: 2,
      price: 550000,
      shop: { id: 2, name: "Pixie Electronics" },
      quantity: 0,
      warranty_months: 6,
    };
    const variant = {
      id: 1,
      model_number: null,
      ram_gb: 4,
      storage_gb: 64,
      network_generation: null,
      region: null,
      sim_type: null,
      attributes: {},
      colors: [],
    };
    const product = mapMarketplaceDeviceToCatalog({
      ...device,
      offers: [second, first],
      variants: [variant, { ...variant, id: 2, ram_gb: 6, storage_gb: 128 }],
      media: [
        { id: 1, url: "/device.jpg", media_type: "image", is_primary: true },
        { id: 2, url: "/video.mp4", media_type: "video", is_primary: false },
      ],
    });
    expect(product.listingId).toBe(71);
    expect(product.images).toEqual(["/device.jpg", "/offer-71.jpg"]);
    const selected = selectMarketplaceOffer(product, second);
    expect(selected).toMatchObject({
      listingId: 72,
      price: 550000,
      shop: "shop-2",
      shopName: "Pixie Electronics",
      condition: "Pre-owned",
      warranty: "6-month warranty",
      inStock: false,
      imageUrl: "/device.jpg",
    });
    expect(selected.specs).toContainEqual({ label: "Storage", value: "128 GB" });
    expect(selected.images).not.toContain("/offer-71.jpg");
  });
  it("uses the lowest-priced offer and retains all offers", () => {
    const product = mapMarketplaceDeviceToCatalog(device);
    expect(product.slug).toBe("phone-seven");
    expect(product.listingId).toBe(11);
    expect(product.price).toBe(200);
    expect(product.shopName).toBe("Shop A");
    expect(product.offers).toHaveLength(2);
  });
});
