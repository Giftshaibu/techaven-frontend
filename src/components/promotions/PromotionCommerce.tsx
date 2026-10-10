import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ImageStage } from "@/components/ImageStage";
import { ProductGrid, ProductRail } from "@/components/ProductGrid";
import { ShopCard } from "@/components/ShopCard";
import { HorizontalRail } from "@/components/HorizontalRail";
import { formatMwk } from "@/data/catalog";
import type { CatalogProduct } from "@/lib/catalog-api";
import type { Promotion } from "@/lib/cms/promotions";
import { resolvePromotionProducts, resolvePromotionShops } from "@/lib/promotion-commerce";
import { PromotionCopy } from "./PromotionPrimitives";
import { PromotionCountdown, PromotionHero, PromotionHeroFrame } from "./PromotionVisuals";

export function PromotionHeroProduct({
  promotion,
  heading = "h2",
}: {
  promotion: Promotion;
  heading?: "h1" | "h2";
}) {
  const ref = promotion.anchorProductRef ?? promotion.productRefs[0];
  const products =
    useQuery({
      queryKey: ["promotion-anchor-product", promotion.id, ref?.externalId],
      queryFn: () => resolvePromotionProducts(ref ? [ref.externalId] : []),
      enabled: Boolean(ref),
    }).data ?? [];
  const product = products[0];
  if (!product) return <PromotionHero promotion={promotion} heading={heading} />;
  const catalogProduct = product as CatalogProduct;
  return (
    <PromotionHeroFrame
      promotion={promotion}
      visual={
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={`View ${product.name}`}
          className="group mx-auto block w-full max-w-md rounded-2xl p-2 text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        >
          <ImageStage
            category={product.category}
            src={catalogProduct.imageUrl}
            alt={product.name}
            priority
            className="mx-auto max-h-[340px] max-w-[340px] !bg-transparent"
            imageClassName="drop-shadow-[0_22px_30px_rgba(0,0,0,0.28)] transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
            iconClassName="text-current opacity-50"
          />
          <div className="mx-auto mt-3 max-w-sm text-center drop-shadow-sm">
            <p className="line-clamp-2 text-base font-bold md:text-lg">{product.name}</p>
            <p className="mt-1 text-sm opacity-80">Current price</p>
            <p className="text-2xl font-extrabold tracking-tight">{formatMwk(product.price)}</p>
          </div>
        </Link>
      }
    >
      <PromotionCopy promotion={promotion} heading={heading} />
    </PromotionHeroFrame>
  );
}

export function PromotionProducts({
  promotion,
  grid = false,
}: {
  promotion: Promotion;
  grid?: boolean;
}) {
  const products =
    useQuery({
      queryKey: ["promotion-products", promotion.id],
      queryFn: () => resolvePromotionProducts(promotion.productRefs.map((r) => r.externalId)),
    }).data ?? [];
  if (products.length < 2) return null;
  return (
    <section className="shell py-10 md:py-14">
      <div className="mb-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-ink-800 md:text-3xl">{promotion.headline}</h2>
        {promotion.subheadline ? (
          <p className="mt-2 text-sm text-muted-foreground">{promotion.subheadline}</p>
        ) : null}
        <PromotionCountdown promotion={promotion} />
      </div>
      {grid ? (
        <ProductGrid products={products} />
      ) : (
        <ProductRail products={products} label={promotion.headline} />
      )}
    </section>
  );
}

export function PromotionShops({ promotion }: { promotion: Promotion }) {
  const shops =
    useQuery({
      queryKey: ["promotion-shops", promotion.id],
      queryFn: () => resolvePromotionShops(promotion.shopRefs.map((r) => r.externalId)),
    }).data ?? [];
  if (shops.length < 2) return null;
  return (
    <section className="shell py-10 md:py-14">
      <h2 className="mb-6 text-2xl font-bold text-ink-800 md:text-3xl">{promotion.headline}</h2>
      <HorizontalRail label={promotion.headline} desktopClassName="md:grid md:grid-cols-3 md:gap-5">
        {shops.map((s) => (
          <div key={s.slug} className="w-[82%] max-w-[320px] shrink-0 snap-start md:w-auto">
            <ShopCard shop={s} />
          </div>
        ))}
      </HorizontalRail>
    </section>
  );
}

export function PromotionFlashDeals({ promotion }: { promotion: Promotion }) {
  const products =
    useQuery({
      queryKey: ["promotion-flash-products", promotion.id],
      queryFn: () => resolvePromotionProducts(promotion.productRefs.map((r) => r.externalId)),
    }).data ?? [];
  if (!promotion.schedule.endsAt || new Date(promotion.schedule.endsAt).getTime() <= Date.now())
    return null;
  if (products.length < 2) return null;
  return (
    <section className="bg-ink-900 py-10 text-white md:py-14">
      <div className="shell">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="font-editorial text-3xl md:text-4xl">{promotion.headline}</h2>
            {promotion.subheadline ? (
              <p className="mt-2 text-white/75">{promotion.subheadline}</p>
            ) : null}
          </div>
          <PromotionCountdown promotion={{ ...promotion, showCountdown: true }} />
        </div>
        <div className="rounded-2xl bg-white p-5 text-ink-900">
          <ProductRail products={products} label={promotion.headline} />
        </div>
      </div>
    </section>
  );
}
