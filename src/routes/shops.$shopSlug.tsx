import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { fetchShopProducts, resolveShop } from "@/lib/resolve-catalog";
import { parseApiShopId } from "@/lib/catalog-api";
import { marketplaceMedia } from "@/data/media";

export const Route = createFileRoute("/shops/$shopSlug")({
  loader: async ({ params }) => {
    const shop = await resolveShop(params.shopSlug);
    if (!shop) throw notFound();
    const shopId = parseApiShopId(shop.slug);
    let products: Awaited<ReturnType<typeof fetchShopProducts>>["products"] = [];
    if (shopId != null) {
      const data = await fetchShopProducts(shopId, 1, 60);
      products = data.products;
    }
    return { shop, products };
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
  const { shop, products } = Route.useLoaderData();

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
                Verified shop
                <Icon name="verified-check-bold" className="h-4 w-4 text-brand-500" />
              </>
            ) : (
              "Shop on Techaven"
            )}
          </span>
        }
        title={shop.name}
        support={shop.blurb || shop.specialty}
        actions={[]}
        media={[
          {
            src: (shop as { logoUrl?: string }).logoUrl ?? marketplaceMedia.shop.src,
            alt: shop.name,
            position: marketplaceMedia.shop.position,
          },
        ]}
        tone="neutral"
      />

      <section className="shell pb-14">
        <p className="mb-6 text-sm text-muted-foreground">
          {shop.location} · {products.length} product{products.length === 1 ? "" : "s"} listed
        </p>
        <ProductGrid products={products} />
      </section>
    </>
  );
}
