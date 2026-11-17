import { useEffect, useState } from "react";
import { ContinueBrowsing } from "@/components/ContinueBrowsing";
import { MobileShoppingBanner } from "@/components/MobileShoppingBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CategoryTile } from "@/components/CategoryTile";
import { ProductRail } from "@/components/ProductGrid";
import { SectionHeader, ViewAllLink } from "@/components/SectionHeader";
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
      "home_promo_rails",
      "home_square_tiles",
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
    return { ...feedResult.value, promotions, promoRails: promotions.filter((record) => record.placement === "home_promo_rails") };
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

function HomePromotionRails({ initial }: { initial: Awaited<ReturnType<typeof getPromotions>> }) {
  const [promotions, setPromotions] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setPromotions(initial);
  }, [initial]);
  useEffect(() => {
    let cancelled = false;
    const scheduledAt = Date.now();
    const nextEnd = Math.min(...promotions.flatMap(({ schedule }) =>
      schedule.endsAt && Date.parse(schedule.endsAt) > scheduledAt ? [Date.parse(schedule.endsAt)] : [],
    ));
    const timer = window.setTimeout(async () => {
      setNow(Date.now());
      const records = await getPromotions("home_promo_rails");
      if (!cancelled) {
        setNow(Date.now());
        setPromotions(records);
      }
    }, Math.max(0, Math.min(nextEnd - Date.now(), 60_000)));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [promotions]);
  const active = promotions.filter(({ schedule }) =>
    (!schedule.startsAt || Date.parse(schedule.startsAt) <= now) &&
    (!schedule.endsAt || Date.parse(schedule.endsAt) > now),
  );
  return <PromotionSlot placement="home_promo_rails" promotions={active} />;
}

function Home() {
  const { categories, products, promotions, promoRails } = Route.useLoaderData();
  const [historyCleared, setHistoryCleared] = useState(0);
  const navCategories = enrichCategoryIcons(categories);
  const hotDeals = filterHotSales(products).slice(0, 8);
  const hotFallback = hotDeals.length ? hotDeals : filterSpecialOffers(products).slice(0, 8);
  const recommended = products.slice(0, 8);

  return (
    <>
      <MobileShoppingBanner promotions={promotions} />
      <div className="hidden md:block">
        <PromotionSlot
          placement="home_hero"
          promotions={promotions}
          fallback={<DefaultHomeHero />}
          heroHeading="h1"
        />
      </div>

      <ContinueBrowsing onClear={() => setHistoryCleared((value) => value + 1)} />
      <MobileHomeCatalog products={products} historyCleared={historyCleared} />

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

      <PromotionSlot placement="home_product_rail_1" promotions={promotions} />

      <PromotionSlot placement="home_square_tiles" promotions={promotions} />
      <HomePromotionRails initial={promoRails} />

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
