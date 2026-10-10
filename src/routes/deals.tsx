import { createFileRoute } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductGrid";
import { filterHotSales, filterSpecialOffers, mapMarketplaceDeviceToCatalog } from "@/lib/catalog-api";
import { getMarketplaceDevices } from "@/integrations/techaven/customer";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";

export const Route = createFileRoute("/deals")({
  loader: async () => {
    const [data, hero, inline] = await Promise.all([
      getMarketplaceDevices({ page: 1, limit: 60 }),
      getPromotions("deals_hero"),
      getPromotions("deals_inline_1"),
    ]);
    const products = (data.devices ?? []).map(mapMarketplaceDeviceToCatalog);
    const deals = filterHotSales(products);
    const fallback = deals.length ? deals : filterSpecialOffers(products);
    return { products: fallback.length ? fallback : products, promotions: [...hero, ...inline] };
  },
  head: () => ({
    meta: [
      { title: "Deals — Techaven" },
      {
        name: "description",
        content: "Hot sales and special offers from Techaven shops.",
      },
      { property: "og:title", content: "Deals — Techaven" },
      { property: "og:description", content: "Hot sales and special offers from Techaven shops." },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { products, promotions } = Route.useLoaderData();

  return (
    <>
      <PromotionSlot placement="deals_hero" promotions={promotions} heroHeading="h1" />
      <section className="shell pb-14">
        <ProductGrid products={products} />
      </section>
      <PromotionSlot placement="deals_inline_1" promotions={promotions} />
    </>
  );
}
