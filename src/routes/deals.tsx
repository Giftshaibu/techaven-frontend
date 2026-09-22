import { createFileRoute } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductGrid";
import { MegaHeader } from "@/components/MegaHeader";
import { filterHotSales, filterSpecialOffers, mapApiProductToCatalog } from "@/lib/catalog-api";
import { getProducts } from "@/integrations/techaven/customer";

export const Route = createFileRoute("/deals")({
  loader: async () => {
    const data = await getProducts({ page: 1, limit: 60, sort: "newest" });
    const products = (data.products ?? []).map((p) => mapApiProductToCatalog(p));
    const deals = filterHotSales(products);
    const fallback = deals.length ? deals : filterSpecialOffers(products);
    return { products: fallback.length ? fallback : products };
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
  const { products } = Route.useLoaderData();

  return (
    <>
      <MegaHeader
        eyebrow="Deals"
        title="Hot sales & special offers"
        support="Same segments as the Techaven mobile app — filtered from live shop listings."
        actions={[]}
        media={[]}
        tone="neutral"
      />
      <section className="shell pb-14">
        <ProductGrid products={products} />
      </section>
    </>
  );
}
