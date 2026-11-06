import { createFileRoute, Link } from "@tanstack/react-router";
import { CategoryCard, CategoryTile } from "@/components/CategoryTile";
import { Icon } from "@/components/Icon";
import { HorizontalRail } from "@/components/HorizontalRail";
import { ImageStage } from "@/components/ImageStage";
import { ProductRail } from "@/components/ProductGrid";
import { SectionHeader, ViewAllLink } from "@/components/SectionHeader";
import { ShopCard } from "@/components/ShopCard";
import { TrustStrip } from "@/components/TrustStrip";
import { enrichCategoryIcons, filterHotSales, filterSpecialOffers } from "@/lib/catalog-api";
import { loadHomeFeed } from "@/lib/resolve-catalog";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";
import { MobileHomeCatalog } from "@/components/MobileHomeCatalog";
import { DefaultHomeHero } from "@/components/promotions/DefaultHomeHero";

export const Route = createFileRoute("/")({
  loader: async () => {
    const placements = [
      "home_hero",
      "home_banner_1",
      "home_product_rail_1",
      "home_banner_2",
      "home_inline_1",
    ] as const;
    const [feedResult, ...promotionResults] = await Promise.allSettled([
      loadHomeFeed(),
      ...placements.map(getPromotions),
    ]);
    if (feedResult.status === "rejected") throw feedResult.reason;
    const promotions = promotionResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    return { ...feedResult.value, promotions };
  },
  head: () => ({
    meta: [
      { title: "Techaven — Malawi's electronics mall" },
      {
        name: "description",
        content:
          "Shop phones, laptops, audio and home electronics from verified Malawian shops. Compare devices, trade in your old tech and buy with buyer protection.",
      },
      { property: "og:title", content: "Techaven — Malawi's electronics mall" },
      {
        property: "og:description",
        content:
          "Many shops, one trusted place to buy electronics. Compare devices, trade in old tech and check out with buyer protection.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { categories, products, shops, promotions } = Route.useLoaderData();
  const navCategories = enrichCategoryIcons(categories);
  const hotDeals = filterHotSales(products).slice(0, 8);
  const hotFallback = hotDeals.length ? hotDeals : filterSpecialOffers(products).slice(0, 8);
  const recommended = products.slice(0, 8);

  return (
    <>
      <MobileHomeCatalog products={products} />
      <div className="hidden md:block"><PromotionSlot
        placement="home_hero"
        promotions={promotions}
        fallback={<DefaultHomeHero />}
        heroHeading="h1"
      /></div>

      <section className="shell py-10 md:py-14">
        <SectionHeader
          title="Start where you shop most"
          action={<ViewAllLink to="/categories" label="All categories" />}
        />
        {navCategories.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {navCategories.slice(0, 8).map((c) => (
              <CategoryTile key={c.slug} category={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Categories will appear when the shop catalog is ready.
          </p>
        )}
      </section>

      <section className="shell pb-10 md:pb-14">
        <SectionHeader
          title="Hot deals this week"
          description="Highlights from shops across the mall."
          action={<ViewAllLink to="/deals" label="All deals" />}
        />
        <ProductRail products={hotFallback} label="Hot deals" />
      </section>

      <PromotionSlot placement="home_banner_1" promotions={promotions} />

      {navCategories.length > 4 ? (
        <section className="shell pb-10 md:pb-14">
          <SectionHeader
            title="Browse by category"
            description="Categories from Techaven — sellers list products under these."
          />
          <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
            {navCategories.slice(0, 4).map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="shell pb-10 md:pb-14">
        <SectionHeader
          title="Featured shops"
          description="Real shops with their own catalogs, stock and delivery options."
          action={<ViewAllLink to="/shops" label="View all shops" />}
        />
        <HorizontalRail
          label="Featured shops"
          desktopClassName="md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-4"
        >
          {shops.slice(0, 4).map((s) => (
            <div
              key={s.slug}
              className="w-[82%] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none"
            >
              <ShopCard shop={s} />
            </div>
          ))}
        </HorizontalRail>
      </section>

      <PromotionSlot placement="home_product_rail_1" promotions={promotions} />

      <PromotionSlot placement="home_inline_1" promotions={promotions} />

      <section className="shell pb-12 md:pb-16">
        <SectionHeader
          title="Recommended for you"
          description="Fresh listings from the marketplace."
          action={<ViewAllLink to="/products" label="View all products" />}
        />
        <ProductRail products={recommended} label="Recommended products" />
      </section>

      <PromotionSlot placement="home_banner_2" promotions={promotions} />
      <TrustStrip />
    </>
  );
}
