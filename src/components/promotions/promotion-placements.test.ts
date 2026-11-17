import { describe, expect, it } from "vitest";
import { promotionSchema, type Promotion } from "@/lib/cms/promotions";
import { promotionPlacements, selectPromotions } from "./promotion-placements";

function promotion(slug: string, order: number, group = "pair"): Promotion {
  return promotionSchema.parse({
    id: `id-${slug}`,
    slug,
    headline: slug,
    subheadline: null,
    body: null,
    placement: "home_banner_1",
    layout: "split",
    slotGroup: group,
    displayOrder: 100,
    groupOrder: order,
    theme: "light",
    desktopBackground: null,
    mobileBackground: null,
    foregroundImage: null,
    cta: null,
    commerceOfferKey: null,
    productRefs: [],
    shopRefs: [],
  });
}

describe("selectPromotions", () => {
  it("orders a square tile group and supports mixed banner rail layouts", () => {
    const tiles = [2, 1, 4, 3, 5].map((order) => ({
      ...promotion(String(order), order),
      placement: "home_square_tiles" as const,
      layout: "square_tile" as const,
    }));
    expect(selectPromotions(tiles, "home_square_tiles").map(({ slug }) => slug))
      .toEqual(["1", "2", "3", "4"]);
    const strip = {
      ...promotion("strip", 0), placement: "home_promo_rails" as const,
      layout: "banner_with_rail" as const, displayOrder: 20,
    };
    const side = { ...strip, id: "side", layout: "side_banner_with_rail" as const, displayOrder: 10 };
    expect(selectPromotions([strip, side], "home_promo_rails")).toEqual([side, strip]);
  });

  it("sorts homepage promo rails by display order and ID, and caps them at eight", () => {
    const records = ["j", "i", "h", "g", "f", "e", "d", "c", "b", "a"].map((slug) => ({
      ...promotion(slug, 0),
      placement: "home_promo_rails" as const,
      layout: "banner_with_rail" as const,
      displayOrder: slug === "j" ? 10 : 100,
    }));
    expect(selectPromotions(records, "home_promo_rails").map(({ slug }) => slug))
      .toEqual(["j", "a", "b", "c", "d", "e", "f", "g"]);
  });

  it("registers every marketing hero as a single controlled slot", () => {
    const heroes = [
      "home_hero",
      "categories_hero",
      "category_hero",
      "products_hero",
      "shops_hero",
      "shop_hero",
      "catalogs_hero",
      "deals_hero",
      "compare_hero",
      "trade_in_hero",
      "help_hero",
      "search_hero",
      "promotion_page_hero",
    ] as const;
    for (const placement of heroes) {
      expect(promotionPlacements[placement].cardinality).toBe("single");
      expect(promotionPlacements[placement].layouts).toContain("hero");
    }
  });
  it("selects and orders records from the lead group", () => {
    const selected = selectPromotions(
      [promotion("second", 2), promotion("first", 1), promotion("other", 0, "other")],
      "home_banner_1",
    );
    expect(selected.map((item) => item.slug)).toEqual(["first", "second"]);
  });

  it("honors current-campaign exclusions and incompatible layouts", () => {
    const excluded = selectPromotions(
      [promotion("current", 1), promotion("next", 2)],
      "home_banner_1",
      ["current"],
    );
    expect(excluded.map((item) => item.slug)).toEqual(["next"]);
  });

  it("does not mix layouts within a grouped promotion slot", () => {
    const incompatible = {
      ...promotion("banner", 0),
      layout: "banner" as const,
    };
    const selected = selectPromotions(
      [promotion("first", 1), incompatible, promotion("second", 2)],
      "home_banner_1",
    );
    expect(selected.map((item) => item.slug)).toEqual(["first", "second"]);
  });

  it("renders an ungrouped multi-record lead as a standalone promotion", () => {
    const first = { ...promotion("first", 1), slotGroup: null };
    const second = { ...promotion("second", 2), slotGroup: null };
    expect(selectPromotions([first, second], "home_banner_1").map((item) => item.slug)).toEqual([
      "first",
    ]);
  });
});
