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
import { formatMwk } from "@/data/catalog";
import { marketplaceMedia } from "@/data/media";
import {
  enrichCategoryIcons,
  filterHotSales,
  filterNewArrivals,
  filterSpecialOffers,
} from "@/lib/catalog-api";
import { loadHomeFeed } from "@/lib/resolve-catalog";

export const Route = createFileRoute("/")({
  loader: () => loadHomeFeed(),
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
  const { categories, products, shops, banners } = Route.useLoaderData();
  const navCategories = enrichCategoryIcons(categories);
  const hotDeals = filterHotSales(products).slice(0, 8);
  const hotFallback = hotDeals.length ? hotDeals : filterSpecialOffers(products).slice(0, 8);
  const newArrivals = filterNewArrivals(products).slice(0, 8);
  const recommended = products.slice(0, 8);
  const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const heroBanner = banners[0] as { image?: string; title?: string; link?: string } | undefined;

  return (
    <>
      <MegaHeader
        eyebrow="Techaven Marketplace"
        title="Every electronics shop in one place."
        support="Phones, laptops, audio and home electronics from verified Malawian shops — with comparison, trade-in and buyer protection built in."
        actions={[
          { label: "View all products", to: "/products" },
          { label: "Shop the deals", to: "/deals" },
          { label: "Browse the shops", to: "/shops" },
        ]}
        media={
          heroBanner?.image
            ? [{ src: heroBanner.image, alt: heroBanner.title ?? "Promotion", position: "center" }]
            : [marketplaceMedia.hero]
        }
        tone="brand-soft"
        aside={
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-800/60">Shops</dt>
              <dd className="text-lg font-bold text-ink-800">{shops.length} on Techaven</dd>
            </div>
            <div>
              <dt className="text-ink-800/60">Products listed</dt>
              <dd className="text-lg font-bold text-ink-800">{products.length}+</dd>
            </div>
            <div>
              <dt className="text-ink-800/60">From</dt>
              <dd className="text-lg font-bold text-ink-800">
                {minPrice > 0 ? formatMwk(minPrice) : "Browse shops"}
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
        {navCategories.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {navCategories.slice(0, 8).map((c) => (
              <CategoryTile key={c.slug} category={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Categories will appear when the shop catalog is ready.</p>
        )}
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
          description="Highlights from shops across the mall — same feed as the mobile app."
          action={<ViewAllLink to="/deals" label="All deals" />}
        />
        <ProductRail products={hotFallback} label="Hot deals" />
      </section>

      {newArrivals.length ? (
        <section className="shell pb-10 md:pb-14">
          <SectionHeader
            title="New arrivals"
            action={<ViewAllLink to="/products" label="View all products" />}
          />
          <ProductRail products={newArrivals} label="New arrivals" />
        </section>
      ) : null}

      <section className="shell pb-10 md:pb-14">
        <div className="grid gap-5 lg:grid-cols-2">
          {editorialPromos.map((p) => (
            <PromoTile key={p.headline} promo={p} />
          ))}
        </div>
      </section>

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

      <section className="shell pb-12 md:pb-16">
        <SectionHeader
          title="Recommended for you"
          description="Fresh listings from the marketplace."
          action={<ViewAllLink to="/products" label="View all products" />}
        />
        <ProductRail products={recommended} label="Recommended products" />
      </section>

      <TrustStrip />
    </>
  );
}
