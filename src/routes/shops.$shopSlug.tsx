import { useEffect } from "react";
import { recordVisit } from "@/lib/browsing-history";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { fetchShopProducts, resolveShop } from "@/lib/resolve-catalog";
import { parseApiShopId } from "@/lib/catalog-api";
import { marketplaceMedia } from "@/data/media";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";
import { ShopHero } from "@/components/ShopHero";

export const Route = createFileRoute("/shops/$shopSlug")({
  loader: async ({ params }) => {
    const shop = await resolveShop(params.shopSlug);
    if (!shop) throw notFound();
    const shopId = parseApiShopId(shop.slug);
    const [productData, heroPromotions, inlinePromotions] = await Promise.all([
      shopId != null ? fetchShopProducts(shopId, 1, 60) : Promise.resolve({ products: [] }),
      getPromotions("shop_hero"),
      getPromotions("shop_inline_1"),
    ]);
    return { shop, products: productData.products, heroPromotions, inlinePromotions };
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
  const { shop, products, heroPromotions, inlinePromotions } = Route.useLoaderData();
  useEffect(() => { recordVisit({ kind: "shop", slug: shop.slug }); }, [shop.slug]);

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

      <PromotionSlot
        placement="shop_hero"
        promotions={heroPromotions}
        context={{ shopExternalId: String(shop.apiId) }}
        heroHeading="h1"
        fallback={
          <ShopHero shop={shop} />
        }
      />

      <section className="shell pb-14">
        <p className="mb-6 text-sm text-muted-foreground">
          {shop.location} · {products.length} product{products.length === 1 ? "" : "s"} listed
        </p>
        <ProductGrid products={products} />
      </section>
      <PromotionSlot
        placement="shop_inline_1"
        promotions={inlinePromotions}
        context={{ shopExternalId: String(shop.apiId) }}
      />
    </>
  );
}
