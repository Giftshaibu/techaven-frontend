import { createFileRoute } from "@tanstack/react-router";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductRail } from "@/components/ProductGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { catalogs, productsBySlugs } from "@/data/catalog";
import { useQuery } from "@tanstack/react-query";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";

export const Route = createFileRoute("/catalogs")({
  head: () => ({
    meta: [
      { title: "Curated catalogs — Techaven" },
      {
        name: "description",
        content:
          "Themed collections put together by Techaven shops and our own merchandising team: back to school, gaming setups, refurbished favourites and more.",
      },
      { property: "og:title", content: "Curated catalogs — Techaven" },
      {
        property: "og:description",
        content: "Themed electronics collections curated by shops and by Techaven.",
      },
    ],
  }),
  component: CatalogsPage,
});

function CatalogsPage() {
  const heroPromotions =
    useQuery({
      queryKey: ["promotions", "catalogs_hero"],
      queryFn: () => getPromotions("catalogs_hero"),
    }).data ?? [];
  const inlinePromotions =
    useQuery({
      queryKey: ["promotions", "catalog_inline_1"],
      queryFn: () => getPromotions("catalog_inline_1"),
    }).data ?? [];
  return (
    <>
      <PromotionSlot
        placement="catalogs_hero"
        promotions={heroPromotions}
        heroHeading="h1"
        fallback={
          <MegaHeader
            eyebrow="Catalogs"
            title="Collections worth browsing"
            support="Each catalog is owned by a shop or by Techaven, and kept current as stock changes."
            stages={["laptops", "gaming", "audio"]}
            tone="neutral"
            editorial
          />
        }
      />

      <div className="shell py-10 md:py-14">
        {catalogs.map((catalog) => (
          <section key={catalog.slug} className="mb-14 last:mb-0">
            <SectionHeader
              title={catalog.title}
              description={`${catalog.blurb} — curated by ${catalog.owner}`}
              editorial
            />
            <ProductRail products={productsBySlugs(catalog.productSlugs).slice(0, 5)} />
          </section>
        ))}
      </div>
      <PromotionSlot placement="catalog_inline_1" promotions={inlinePromotions} />
    </>
  );
}
