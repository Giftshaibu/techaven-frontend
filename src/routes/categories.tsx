import { createFileRoute, Link } from "@tanstack/react-router";
import { CategoryCard } from "@/components/CategoryTile";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { SectionHeader, ViewAllLink } from "@/components/SectionHeader";
import { ShopCard } from "@/components/ShopCard";
import { catalogs, popularBrands } from "@/data/catalog";
import { enrichCategoryIcons, mapApiCategoryToCatalog } from "@/lib/catalog-api";
import { getCategories, getShops } from "@/integrations/techaven/customer";
import { mapApiShopToCatalog } from "@/lib/catalog-api";
import { marketplaceMedia } from "@/data/media";

export const Route = createFileRoute("/categories")({
  loader: async () => {
    const [categories, shops] = await Promise.all([
      getCategories().catch(() => []),
      getShops().catch(() => []),
    ]);
    return {
      categories: enrichCategoryIcons(categories.map(mapApiCategoryToCatalog)),
      shops: shops.map(mapApiShopToCatalog),
    };
  },
  head: () => ({
    meta: [
      { title: "Browse all electronics categories — Techaven" },
      {
        name: "description",
        content:
          "The full Techaven taxonomy: smartphones, laptops, tablets, gaming, audio, wearables, accessories and home electronics.",
      },
      { property: "og:title", content: "Browse all electronics categories — Techaven" },
      {
        property: "og:description",
        content: "Every category in the Techaven mall, plus popular brands and curated catalogs.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories, shops } = Route.useLoaderData();
  return (
    <>
      <MegaHeader
        eyebrow="Categories"
        title="Browse electronics"
        support="Everything sold across the Techaven mall, grouped the way people actually shop."
        media={[marketplaceMedia.workspace]}
        tone="neutral"
      />

      <section className="shell py-10 md:py-14">
        <SectionHeader title="All categories" />
        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      <section className="shell pb-10 md:pb-14">
        <SectionHeader title="Popular brands" />
        <div className="flex flex-wrap gap-2.5">
          {popularBrands.map((brand) => (
            <span
              key={brand}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-800"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section className="shell pb-10 md:pb-14">
        <SectionHeader
          title="Featured catalogs"
          description="Curated sets put together by shops and by Techaven."
          action={<ViewAllLink to="/catalogs" label="All catalogs" />}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalogs.map((catalog, index) => (
            <Link
              key={catalog.slug}
              to="/catalogs"
              className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-300"
            >
              <ImageStage
                ratio="wide"
                tone="brand"
                src={
                  [
                    marketplaceMedia.workspace,
                    marketplaceMedia.smartphones,
                    marketplaceMedia.audio,
                    marketplaceMedia.hero,
                  ][index]?.src
                }
                alt={
                  [
                    marketplaceMedia.workspace,
                    marketplaceMedia.smartphones,
                    marketplaceMedia.audio,
                    marketplaceMedia.hero,
                  ][index]?.alt ?? ""
                }
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
              />
              <h3 className="mt-3 text-base font-bold text-ink-800 group-hover:underline">
                {catalog.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Curated by {catalog.owner}</p>
              <p className="mt-2 text-sm text-ink-800/70">{catalog.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell pb-12 md:pb-16">
        <SectionHeader
          title="Shops by specialty"
          description="Go straight to a shop that focuses on what you need."
          action={<ViewAllLink to="/shops" label="All shops" />}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shops.slice(0, 4).map((s) => (
            <ShopCard key={s.slug} shop={s} />
          ))}
        </div>
      </section>
    </>
  );
}
