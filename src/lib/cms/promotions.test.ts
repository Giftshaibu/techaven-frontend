import { afterEach, describe, expect, it, vi } from "vitest";
import { ctaHref, getPromotions, matchesTarget, promotionSchema, type Promotion } from "./promotions";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("CMS connection", () => {
  it.each([true, false])("uses the correct CMS address when SSR is %s", async (ssr) => {
    vi.stubEnv("SSR", ssr);
    vi.stubEnv("VITE_PROMOTIONS_API_URL", "http://localhost:1337");
    vi.stubEnv("VITE_PROMOTIONS_SERVER_API_URL", "http://host.docker.internal:1337/");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [promotionSchema.parse(base)] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await getPromotions("home_hero")).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${ssr ? "http://host.docker.internal:1337" : "http://localhost:1337"}/api/promotions/active?placement=home_hero`);
  });
});

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
