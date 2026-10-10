import { describe, expect, it } from "vitest";
import { ctaHref, matchesTarget, promotionSchema, type Promotion } from "./promotions";

const base = {
  id: "promotion-1",
  slug: "campaign",
  headline: "Campaign",
  subheadline: null,
  body: null,
  placement: "home_hero",
  layout: "hero",
  theme: "light",
  desktopBackground: null,
  mobileBackground: null,
  foregroundImage: null,
  cta: null,
  commerceOfferKey: null,
  productRefs: [],
  shopRefs: [],
} as const;

describe("promotionSchema", () => {
  it("accepts all editor-managed hero placements", () => {
    for (const placement of [
      "categories_hero",
      "products_hero",
      "shops_hero",
      "shop_hero",
      "catalogs_hero",
      "compare_hero",
      "trade_in_hero",
      "help_hero",
      "search_hero",
    ] as const) {
      expect(promotionSchema.parse({ ...base, placement }).placement).toBe(placement);
    }
  });
  it("fills optional normalized fields with safe defaults", () => {
    const value = promotionSchema.parse(base);
    expect(value.presentation).toBe("standard");
    expect(value.targeting).toEqual({
      categorySlug: null,
      shopExternalId: null,
      brandSlug: null,
      campaignSlug: null,
    });
    expect(value.secondaryProductRefs).toEqual([]);
  });

  it("rejects an unknown controlled layout", () => {
    expect(() => promotionSchema.parse({ ...base, layout: "anything" })).toThrow();
  });
});

describe("promotion targeting and CTAs", () => {
  const promotion = promotionSchema.parse({
    ...base,
    targeting: {
      categorySlug: "phones",
      shopExternalId: null,
      brandSlug: "samsung",
      campaignSlug: null,
    },
  });

  it("requires every configured target to match", () => {
    expect(matchesTarget(promotion, { categorySlug: "phones", brandSlug: "samsung" })).toBe(true);
    expect(matchesTarget(promotion, { categorySlug: "phones", brandSlug: "apple" })).toBe(false);
  });

  it("rejects unsafe external and internal URLs", () => {
    const value = (targetType: string, targetValue: string) =>
      ({ label: "Open", targetType, targetValue }) as NonNullable<Promotion["cta"]>;
    expect(ctaHref(value("external_url", "http://example.com"))).toBeNull();
    expect(ctaHref(value("internal_path", "//example.com"))).toBeNull();
    expect(ctaHref(value("external_url", "https://example.com/deal"))).toBe(
      "https://example.com/deal",
    );
    expect(ctaHref(value("promotion_page", "term-deals"))).toBe("/promotions/term-deals");
  });
});
