import type { Placement, Promotion } from "@/lib/cms/promotions";

type Rule = {
  cardinality: "single" | "pair" | "collection";
  max: number;
  layouts: Promotion["layout"][];
};

export const promotionPlacements: Record<Placement, Rule> = {
  home_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  categories_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  products_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  shops_hero: { cardinality: "single", max: 1, layouts: ["hero", "lifestyle_banner"] },
  shop_hero: { cardinality: "single", max: 1, layouts: ["hero", "lifestyle_banner"] },
  catalogs_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  compare_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  trade_in_hero: { cardinality: "single", max: 1, layouts: ["hero", "lifestyle_banner"] },
  help_hero: { cardinality: "single", max: 1, layouts: ["hero", "lifestyle_banner"] },
  search_hero: { cardinality: "single", max: 1, layouts: ["hero", "lifestyle_banner"] },
  home_banner_1: { cardinality: "pair", max: 2, layouts: ["split", "banner", "lifestyle_banner"] },
  home_product_rail_1: {
    cardinality: "single",
    max: 1,
    layouts: ["product_rail", "product_grid", "flash_deals"],
  },
  home_banner_2: {
    cardinality: "collection",
    max: 4,
    layouts: ["card_rail", "split", "banner", "lifestyle_banner"],
  },
  home_shop_rail: { cardinality: "single", max: 1, layouts: ["shop_rail"] },
  home_inline_1: {
    cardinality: "collection",
    max: 4,
    layouts: ["service_grid", "card_rail", "banner", "editorial", "coupon"],
  },
  category_hero: { cardinality: "single", max: 1, layouts: ["hero", "hero_product", "banner"] },
  category_inline_1: {
    cardinality: "single",
    max: 1,
    layouts: ["banner", "lifestyle_banner", "product_rail", "product_grid"],
  },
  category_inline_2: {
    cardinality: "collection",
    max: 4,
    layouts: ["banner", "split", "card_rail", "product_rail", "product_grid"],
  },
  search_inline_1: { cardinality: "single", max: 1, layouts: ["banner", "editorial"] },
  deals_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  deals_inline_1: {
    cardinality: "single",
    max: 1,
    layouts: ["flash_deals", "banner", "lifestyle_banner", "product_rail", "product_grid"],
  },
  shops_inline_1: { cardinality: "single", max: 1, layouts: ["banner", "editorial", "shop_rail"] },
  shop_inline_1: {
    cardinality: "single",
    max: 1,
    layouts: ["banner", "product_rail", "product_grid"],
  },
  product_inline_1: { cardinality: "single", max: 1, layouts: ["banner", "editorial", "coupon"] },
  catalog_inline_1: {
    cardinality: "single",
    max: 1,
    layouts: ["banner", "product_rail", "product_grid", "card_rail"],
  },
  promotion_page_hero: {
    cardinality: "single",
    max: 1,
    layouts: ["hero", "hero_product", "lifestyle_banner"],
  },
  promotion_page_inline_1: {
    cardinality: "single",
    max: 1,
    layouts: ["banner", "lifestyle_banner", "product_rail", "product_grid", "shop_rail"],
  },
  promotion_page_inline_2: {
    cardinality: "pair",
    max: 2,
    layouts: ["split", "banner", "service_grid", "shop_rail"],
  },
  promotion_page_inline_3: {
    cardinality: "collection",
    max: 4,
    layouts: ["card_rail", "banner", "editorial", "coupon"],
  },
  header_mega_menu: { cardinality: "single", max: 1, layouts: ["announcement", "banner"] },
  site_announcement: { cardinality: "single", max: 1, layouts: ["announcement"] },
};

export function selectPromotions(records: Promotion[], placement: Placement, exclude?: string[]) {
  const rule = promotionPlacements[placement];
  const excluded = new Set(exclude ?? []);
  const eligible = records.filter(
    (p) =>
      p.placement === placement &&
      rule.layouts.includes(p.layout) &&
      !excluded.has(p.id) &&
      !excluded.has(p.slug),
  );
  if (!eligible.length) return [];
  if (rule.cardinality === "single") return eligible.slice(0, 1);
  const lead = eligible[0]!;
  const groupedLayouts = new Set<Promotion["layout"]>(["split", "service_grid", "card_rail"]);
  if (!groupedLayouts.has(lead.layout) || !lead.slotGroup) return [lead];
  const grouped = eligible.filter(
    (p) => p.layout === lead.layout && p.slotGroup === lead.slotGroup,
  );
  return grouped.sort((a, b) => a.groupOrder - b.groupOrder).slice(0, rule.max);
}
