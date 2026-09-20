import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { catalogs, getShop, productsByShop } from "@/data/catalog";
import { marketplaceMedia } from "@/data/media";

export const Route = createFileRoute("/shops/$shopSlug")({
  loader: ({ params }) => {
    const shop = getShop(params.shopSlug);
    if (!shop) throw notFound();
    return { shop };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Shop unavailable — Techaven" }, { name: "robots", content: "noindex" }],
      };
    }
    const { shop } = loaderData;
    const title = `${shop.name} — Techaven shop`;
    return {
      meta: [
        { title },
        { name: "description", content: shop.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: shop.blurb },
      ],
    };
  },
  component: ShopPage,
});

function ShopPage() {
  const { shop } = Route.useLoaderData();
  const shopProducts = productsByShop(shop.slug);
  const shopCatalogs = catalogs.filter((c) => c.owner === shop.name);
  const categoriesHere = [...new Set(shopProducts.map((p) => p.category))];

  return (
    <>
      <div className="shell flex items-center gap-2 py-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-brand-500">
          Techaven
        </Link>
        <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
        <Link to="/shops" className="hover:text-brand-500">
          Shops
        </Link>
        <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink-800">{shop.name}</span>
      </div>

      <MegaHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            {shop.verified ? (
              <>
                <Icon name="verified-check-bold" className="h-4 w-4" /> Verified Techaven shop
              </>
            ) : (
              "Techaven shop"
            )}
            <span>· {shop.location}</span>
          </span>
        }
        title={shop.name}
        support={shop.blurb}
        actions={[
          { label: "Browse store", to: "/shops/$shopSlug", params: { shopSlug: shop.slug } },
          { label: "View catalogs", to: "/catalogs" },
        ]}
        stages={categoriesHere.slice(0, 3)}
        tone="neutral"
        aside={
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-800/60">Rating</dt>
              <dd className="flex items-center gap-1 text-lg font-bold text-ink-800">
                <Icon name="star-bold" className="h-4 w-4 text-rating" />
                {shop.rating.toFixed(1)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-800/60">Orders</dt>
              <dd className="text-lg font-bold text-ink-800">
                {shop.orders.toLocaleString("en-US")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-800/60">Specialty</dt>
              <dd className="text-lg font-bold text-ink-800">{shop.specialty}</dd>
            </div>
          </dl>
        }
      />

      {shopCatalogs.length ? (
        <section className="shell py-10">
          <SectionHeader
            title={`Catalogs from ${shop.name}`}
            description="Curated sets this shop keeps up to date."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shopCatalogs.map((catalog, index) => (
              <Link
                key={catalog.slug}
                to="/catalogs"
                className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-300"
              >
                <ImageStage
                  ratio="wide"
                  tone="brand"
                  src={
                    [marketplaceMedia.shop, marketplaceMedia.workspace, marketplaceMedia.audio][
                      index % 3
                    ]!.src
                  }
                  alt=""
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                />
                <h3 className="mt-3 text-base font-bold text-ink-800 group-hover:underline">
                  {catalog.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{catalog.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="shell py-10 pb-14">
        <SectionHeader
          title={`All products from ${shop.name}`}
          description={`${shopProducts.length} products across ${categoriesHere.length} categories.`}
        />
        <ProductGrid products={shopProducts} columns={4} />
      </section>
    </>
  );
}
