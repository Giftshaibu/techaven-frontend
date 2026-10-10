import { z } from "zod";

export const placements = [
  "home_hero",
  "categories_hero",
  "products_hero",
  "shops_hero",
  "shop_hero",
  "catalogs_hero",
  "compare_hero",
  "trade_in_hero",
  "help_hero",
  "search_hero",
  "home_banner_1",
  "home_product_rail_1",
  "home_banner_2",
  "home_shop_rail",
  "home_inline_1",
  "category_hero",
  "category_inline_1",
  "category_inline_2",
  "search_inline_1",
  "deals_hero",
  "deals_inline_1",
  "shops_inline_1",
  "shop_inline_1",
  "product_inline_1",
  "catalog_inline_1",
  "promotion_page_hero",
  "promotion_page_inline_1",
  "promotion_page_inline_2",
  "promotion_page_inline_3",
  "header_mega_menu",
  "site_announcement",
] as const;
export type Placement = (typeof placements)[number];
const media = z.object({ url: z.string().url(), alt: z.string() }).nullable();
const cta = z
  .object({ label: z.string(), targetType: z.string(), targetValue: z.string() })
  .nullable();
const ref = z.object({ externalId: z.string(), slug: z.string() });
export const promotionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  eyebrow: z.string().nullable().default(null),
  headline: z.string(),
  subheadline: z.string().nullable(),
  body: z.string().nullable(),
  badge: z.string().nullable().default(null),
  finePrint: z.string().nullable().default(null),
  placement: z.enum(placements),
  layout: z.enum([
    "hero",
    "hero_product",
    "split",
    "banner",
    "lifestyle_banner",
    "product_rail",
    "product_grid",
    "shop_rail",
    "service_grid",
    "card_rail",
    "flash_deals",
    "coupon",
    "editorial",
    "announcement",
  ]),
  presentation: z
    .enum([
      "standard",
      "product_led",
      "lifestyle",
      "dark_editorial",
      "image_top",
      "image_side",
      "image_right",
      "background_image",
      "compact",
    ])
    .default("standard"),
  slotGroup: z.string().nullable().default(null),
  groupOrder: z.number().int().default(0),
  imagePosition: z.enum(["left", "right", "top", "background"]).default("right"),
  theme: z.enum(["light", "dark", "brand", "brand_soft", "neutral"]),
  desktopBackground: media,
  mobileBackground: media,
  foregroundImage: media,
  cta,
  secondaryCta: cta.default(null),
  commerceOfferKey: z.string().nullable(),
  campaignIntro: z.string().nullable().default(null),
  schedule: z
    .object({ startsAt: z.string().nullable(), endsAt: z.string().nullable() })
    .default({ startsAt: null, endsAt: null }),
  showCountdown: z.boolean().default(false),
  coupon: z
    .object({ code: z.string().nullable(), instructions: z.array(z.string()) })
    .default({ code: null, instructions: [] }),
  targeting: z
    .object({
      categorySlug: z.string().nullable(),
      shopExternalId: z.string().nullable(),
      brandSlug: z.string().nullable(),
      campaignSlug: z.string().nullable(),
    })
    .default({ categorySlug: null, shopExternalId: null, brandSlug: null, campaignSlug: null }),
  seo: z
    .object({ title: z.string().nullable(), description: z.string().nullable(), image: media })
    .default({ title: null, description: null, image: null }),
  productRefs: z.array(ref),
  anchorProductRef: ref.nullable().default(null),
  secondaryProductRefs: z.array(ref).default([]),
  shopRefs: z.array(ref),
});
export type Promotion = z.infer<typeof promotionSchema>;

function baseUrl() {
  return (
    (import.meta.env.VITE_PROMOTIONS_API_URL as string | undefined)?.replace(/\/$/, "") ??
    "http://localhost:1337"
  );
}
async function cmsFetch(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Promotions CMS returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
export async function getPromotions(placement: Placement): Promise<Promotion[]> {
  try {
    const raw = await cmsFetch(`/api/promotions/active?placement=${encodeURIComponent(placement)}`);
    return z.object({ data: z.array(promotionSchema) }).parse(raw).data;
  } catch {
    return [];
  }
}
export async function getPromotion(slug: string): Promise<Promotion | null> {
  try {
    return z
      .object({ data: promotionSchema })
      .parse(await cmsFetch(`/api/promotions/${encodeURIComponent(slug)}`)).data;
  } catch {
    return null;
  }
}

export async function getPromotionPreview(params: {
  documentId: string;
  status: "draft" | "published";
  expires: string;
  signature: string;
}): Promise<Promotion | null> {
  if (!params.documentId || !params.expires || !params.signature) return null;
  const query = new URLSearchParams({
    status: params.status,
    expires: params.expires,
    signature: params.signature,
  });
  try {
    return z
      .object({ data: promotionSchema })
      .parse(
        await cmsFetch(
          `/api/promotions/preview/${encodeURIComponent(params.documentId)}?${query.toString()}`,
        ),
      ).data;
  } catch {
    return null;
  }
}

export type PromotionContext = {
  categorySlug?: string;
  shopExternalId?: string;
  brandSlug?: string;
  campaignSlug?: string;
  searchQuery?: string;
};
export function matchesTarget(p: Promotion, c: PromotionContext = {}) {
  const t = p.targeting;
  return (
    (!t.categorySlug || t.categorySlug === c.categorySlug) &&
    (!t.shopExternalId || t.shopExternalId === c.shopExternalId) &&
    (!t.brandSlug || t.brandSlug === c.brandSlug) &&
    (!t.campaignSlug || t.campaignSlug === c.campaignSlug)
  );
}
export function ctaHref(value: NonNullable<Promotion["cta"]>): string | null {
  const v = value.targetValue.trim();
  const fixed: Record<string, string> = {
    catalog: "/catalogs",
    compare: "/compare",
    trade_in: "/trade-in",
    deals: "/deals",
  };
  if (value.targetType === "external_url") {
    try {
      return new URL(v).protocol === "https:" ? v : null;
    } catch {
      return null;
    }
  }
  if (fixed[value.targetType]) return fixed[value.targetType];
  if (value.targetType === "promotion_page") return `/promotions/${encodeURIComponent(v)}`;
  if (value.targetType === "product") return `/product/${encodeURIComponent(v)}`;
  if (value.targetType === "shop") return `/shops/${encodeURIComponent(v)}`;
  if (value.targetType === "category") return `/category/${encodeURIComponent(v)}`;
  if (value.targetType === "search") return `/search?q=${encodeURIComponent(v)}`;
  if (value.targetType === "internal_path" && v.startsWith("/") && !v.startsWith("//")) return v;
  return null;
}
