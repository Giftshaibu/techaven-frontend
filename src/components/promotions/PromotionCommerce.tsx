import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ImageStage } from "@/components/ImageStage";
import { ProductGrid, ProductRail } from "@/components/ProductGrid";
import { ShopCard } from "@/components/ShopCard";
import { HorizontalRail } from "@/components/HorizontalRail";
import { formatMwk } from "@/data/catalog";
import type { CatalogProduct } from "@/lib/catalog-api";
import { ctaHref, type Promotion } from "@/lib/cms/promotions";
import { resolvePromotionProducts, resolvePromotionShops, resolveParticipatingOffers } from "@/lib/promotion-commerce";
import { themeClass } from "./promotion-theme";
import { PromotionAction, PromotionCopy, PromotionMedia } from "./PromotionPrimitives";
import { PromotionCountdown, PromotionHero, PromotionHeroFrame } from "./PromotionVisuals";

function useRailProducts(promotion?: Promotion) {
  const ids = promotion?.productRefs.slice(0, 12).map((ref) => ref.externalId) ?? [];
  return useQuery({
    queryKey: ["promotion-rail-products", promotion?.slug, promotion?.useParticipatingOffers, ids],
    queryFn: () => promotion?.useParticipatingOffers ? resolveParticipatingOffers(promotion.slug) : resolvePromotionProducts(ids),
    enabled: Boolean(promotion?.useParticipatingOffers) || ids.length >= 2,
    refetchInterval: 30_000,
  }).data ?? [];
}

export function BannerWithRail({
  promotion,
  heading,
}: {
  promotion: Promotion;
  heading: "h1" | "h2";
}) {
  const products = useRailProducts(promotion);
  const desktopArtwork = promotion.desktopBackground ?? promotion.desktopStripArtwork;
  return (
    <section className="pb-10 md:pb-14">
      <div className="max-md:shell">
        <div className={`relative isolate overflow-hidden rounded-2xl max-md:[container-type:inline-size] md:rounded-none md:bg-brand-700 md:text-white ${themeClass[promotion.theme]}`}>
          {desktopArtwork && (
            <div aria-hidden="true" className="absolute inset-0 -z-10 hidden md:block">
              <img
                src={desktopArtwork.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover object-right"
              />
              <div className="absolute inset-0 bg-linear-to-r from-brand-800 via-brand-800/80 to-transparent" />
            </div>
          )}
          <PromotionMedia
            promotion={promotion}
            className="h-[calc(56.25cqw+16px)] md:hidden"
            ratio="none"
          />
          <div className="p-6 md:shell md:flex md:min-h-[240px] md:items-center md:py-9 2xl:min-h-[280px]">
            <div className="min-w-0 md:w-[60%] md:max-w-[44rem] md:[&_a]:bg-white md:[&_a]:text-ink-900 md:[&_a:hover]:bg-neutral-100">
              <PromotionCopy promotion={{ ...promotion, body: null, secondaryCta: null }} heading={heading} />
              {promotion.showCountdown && <PromotionCountdown promotion={promotion} />}
            </div>
          </div>
        </div>
      </div>
      {products.length >= (promotion.useParticipatingOffers ? 1 : 2) && (
        <div className="shell mt-6">
          <ProductRail products={products} label={promotion.headline} scrollOnDesktop />
        </div>
      )}
    </section>
  );
}

export function SideBannerWithRail({
  promotion,
  heading,
}: {
  promotion: Promotion;
  heading: "h1" | "h2";
}) {
  const products = useRailProducts(promotion);
  const hasRail = products.length >= (promotion.useParticipatingOffers ? 1 : 2);
  return (
    <section className="shell pb-10 md:pb-14">
      <div className={`overflow-hidden rounded-2xl bg-stage ${hasRail ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" : ""}`}>
        <div className={`min-w-0 ${themeClass[promotion.theme]}`}>
          <PromotionMedia
            promotion={promotion}
            mobileMediaQuery="(max-width: 1023px)"
            ratio="none"
            className={hasRail ? "aspect-video lg:aspect-[3/4]" : "aspect-[2/1] max-h-[320px]"}
          />
          <div className="p-5 md:p-6">
            <PromotionCopy promotion={{ ...promotion, body: null, secondaryCta: null }} heading={heading} compact />
            {promotion.showCountdown && <PromotionCountdown promotion={promotion} />}
          </div>
        </div>
        {hasRail && (
          <div className="flex min-w-0 flex-col justify-center p-4 md:p-6">
            <ProductRail products={products} label={promotion.headline} scrollOnDesktop />
          </div>
        )}
      </div>
    </section>
  );
}

export function SquarePromotionTiles({ promotions }: { promotions: Promotion[] }) {
  const [selectedId, setSelectedId] = useState<string>();
  const tilesWithProducts = promotions.filter((promotion) => promotion.useParticipatingOffers || promotion.productRefs.length > 0);
  const selected = tilesWithProducts.find((promotion) => promotion.id === selectedId) ?? tilesWithProducts[0];
  const products = useRailProducts(selected);
  const tileClass = "relative isolate block aspect-square w-full overflow-hidden rounded-xl bg-brand-800 text-left text-white ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

  return (
    <section className="shell py-6 md:py-9">
      <HorizontalRail
        label="Featured promotions"
        desktopControls
        desktopClassName="md:!overflow-x-auto lg:grid lg:grid-cols-4 lg:!overflow-visible"
      >
        {promotions.map((promotion) => {
          const href = promotion.cta && ctaHref(promotion.cta);
          const isSelected = selected?.id === promotion.id;
          const content = (
            <>
              <div aria-hidden="true" className="absolute inset-0 -z-10">
                <PromotionMedia promotion={promotion} ratio="none" className="size-full" />
              </div>
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent px-4 pb-4 pt-10 text-lg font-bold leading-tight md:text-xl">
                {promotion.headline}
              </span>
            </>
          );
          return (
            <div key={promotion.id} className="w-[72%] max-w-[300px] shrink-0 snap-start sm:w-[42%] lg:w-auto lg:max-w-none">
              {promotion.useParticipatingOffers || promotion.productRefs.length ? (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(promotion.id)}
                  className={tileClass}
                >
                  {content}
                  {isSelected && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl border-4 border-brand-400" />}
                </button>
              ) : href ? (
                <a href={href} className={tileClass}>{content}</a>
              ) : (
                <div className={tileClass}>{content}</div>
              )}
            </div>
          );
        })}
      </HorizontalRail>
      {selected && (products.length >= (selected.useParticipatingOffers ? 1 : 2) || selected.cta) && (
        <div key={selected.id} className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink-800">{selected.headline}</h2>
            <PromotionAction promotion={selected} />
          </div>
          {products.length >= (selected.useParticipatingOffers ? 1 : 2) && <ProductRail products={products} label={selected.headline} scrollOnDesktop />}
        </div>
      )}
    </section>
  );
}

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
