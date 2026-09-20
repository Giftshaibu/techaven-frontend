import { createFileRoute, Link } from "@tanstack/react-router";
import { CategoryCard, CategoryTile } from "@/components/CategoryTile";
import { Icon } from "@/components/Icon";
import { HorizontalRail } from "@/components/HorizontalRail";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductRail } from "@/components/ProductGrid";
import { PromoTile, type Promo } from "@/components/PromoTile";
import { SectionHeader, ViewAllLink } from "@/components/SectionHeader";
import { ShopCard } from "@/components/ShopCard";
import { TrustStrip } from "@/components/TrustStrip";
import {
  catalogs,
  categories,
  dealProducts,
  formatMwk,
  products,
  productsBySlugs,
  shops,
} from "@/data/catalog";
import { marketplaceMedia } from "@/data/media";

export const Route = createFileRoute("/")({
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

const editorialPromos: Promo[] = [
  {
    headline: "Upgrade without the guesswork.",
    support: "Put two to four phones side by side and see exactly what changes.",
    cta: "Compare phones",
    to: "/compare",
    theme: "brand-soft",
    stageCategory: "smartphones",
    media: marketplaceMedia.compare,
  },
  {
    headline: "Your old device still has value.",
    support: "Check what your current phone or laptop is worth towards the next one.",
    cta: "Start a trade-in",
    to: "/trade-in",
    theme: "neutral",
    stageCategory: "laptops",
    media: marketplaceMedia.workspace,
  },
];

function Home() {
  const featuredCatalog = catalogs[0]!;
  const catalogProducts = productsBySlugs(featuredCatalog.productSlugs).slice(0, 4);
  const hotDeals = dealProducts.slice(0, 5);
  const recentlyViewed = products.slice(12, 17);

  return (
    <>
      <MegaHeader
        eyebrow="Techaven Marketplace"
        title="Every electronics shop in one place."
        support="Phones, laptops, audio and home electronics from verified Malawian shops — with comparison, trade-in and buyer protection built in."
        actions={[
          { label: "Shop the deals", to: "/deals" },
          { label: "Browse the shops", to: "/shops" },
        ]}
        media={[marketplaceMedia.hero]}
        tone="brand-soft"
        aside={
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-800/60">Shops</dt>
              <dd className="text-lg font-bold text-ink-800">{shops.length} verified & growing</dd>
            </div>
            <div>
              <dt className="text-ink-800/60">Products listed</dt>
              <dd className="text-lg font-bold text-ink-800">{products.length}+</dd>
            </div>
            <div>
              <dt className="text-ink-800/60">From</dt>
              <dd className="text-lg font-bold text-ink-800">
                {formatMwk(Math.min(...products.map((p) => p.price)))}
              </dd>
            </div>
          </dl>
        }
      />

      <section className="shell py-10 md:py-14">
        <SectionHeader
          title="Start where you shop most"
          action={<ViewAllLink to="/categories" label="All categories" />}
        />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <CategoryTile key={c.slug} category={c} />
          ))}
        </div>
      </section>

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

      <section className="shell pb-10 md:pb-14">
        <SectionHeader
          title="Hot deals this week"
          description="Price drops across every category, refreshed by the shops themselves."
          action={<ViewAllLink to="/deals" label="All deals" />}
        />
        <ProductRail products={hotDeals} label="Hot deals" />
      </section>

      <section className="shell pb-10 md:pb-14">
        <div className="grid gap-5 lg:grid-cols-2">
          {editorialPromos.map((p) => (
            <PromoTile key={p.headline} promo={p} />
          ))}
        </div>
      </section>

      <section className="shell pb-10 md:pb-14">
        <SectionHeader
          title="Browse by category"
          description="The full mall taxonomy, with the subcategories shops actually stock."
        />
        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {categories.slice(0, 4).map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      <section className="shell pb-10 md:pb-14">
        <div className="rounded-3xl bg-surface p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="text-sm font-semibold tracking-normal text-brand-700">
                Featured catalog
              </p>
              <h2 className="mt-3 font-editorial text-3xl leading-tight text-ink-800 md:text-4xl">
                {featuredCatalog.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Curated by {featuredCatalog.owner}
              </p>
              <p className="mt-4 text-[15px] text-ink-800/75">{featuredCatalog.blurb}</p>
              <Link
                to="/catalogs"
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800"
              >
                Browse catalog
                <Icon name="alt-arrow-right-linear" className="h-4 w-4" />
              </Link>
              <ImageStage
                category="laptops"
                src={marketplaceMedia.workspace.src}
                alt={marketplaceMedia.workspace.alt}
                position={marketplaceMedia.workspace.position}
                sizes="34vw"
                ratio="wide"
                className="mt-6 hidden lg:flex"
              />
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {catalogProducts.map((p) => (
                <Link
                  key={p.slug}
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="group block"
                >
                  <ImageStage category={p.category} />
                  <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold text-ink-800 group-hover:underline">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-base font-extrabold text-ink-800">{formatMwk(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell pb-10 md:pb-14">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-ink-900 p-8 text-white md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                Compare before you buy
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/75">
                Pick two to four devices and see the differences side-by-side.
              </p>
              <Link
                to="/compare"
                className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-neutral-200"
              >
                Start comparing
              </Link>
            </div>
            <div className="flex gap-3">
              <ImageStage
                category="smartphones"
                src={marketplaceMedia.compare.src}
                alt={marketplaceMedia.compare.alt}
                position={marketplaceMedia.compare.position}
                tone="white"
                ratio="wide"
                sizes="220px"
                className="w-48 rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-success-soft p-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-ink-800 md:text-3xl">
                Give your old device another life
              </h2>
              <p className="mt-2 max-w-sm text-sm text-ink-800/70">
                Check whether your device qualifies and see the available trade-in path.
              </p>
              <Link
                to="/trade-in"
                className="mt-5 inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Start trade-in
              </Link>
            </div>
            <ImageStage
              category="smartphones"
              src={marketplaceMedia.tradeIn.src}
              alt={marketplaceMedia.tradeIn.alt}
              position={marketplaceMedia.tradeIn.position}
              tone="white"
              sizes="180px"
              className="w-32 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="shell pb-12 md:pb-16">
        <SectionHeader
          title="Recommended for you"
          description="Based on what people are browsing on Techaven right now."
        />
        <ProductRail products={recentlyViewed} label="Recommended products" />
      </section>

      <TrustStrip />
    </>
  );
}
