import { ProductCard } from "@/components/ProductCard";
import { HorizontalRail } from "@/components/HorizontalRail";
import { InlinePromo, type Promo } from "@/components/PromoTile";
import type { Product } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  columns = 4,
  promo,
  promoAfter = 8,
}: {
  products: Product[];
  columns?: 3 | 4;
  promo?: Promo | undefined;
  promoAfter?: number;
}) {
  const before = promo ? products.slice(0, promoAfter) : products;
  const after = promo ? products.slice(promoAfter) : [];

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:gap-x-6 md:gap-y-12",
        columns === 4 ? "lg:grid-cols-4 2xl:grid-cols-5" : "lg:grid-cols-3",
      )}
    >
      {before.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
      {promo ? <InlinePromo promo={promo} /> : null}
      {after.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

export function ProductRail({
  products,
  label = "Products",
  scrollOnDesktop = false,
}: {
  products: Product[];
  label?: string;
  scrollOnDesktop?: boolean;
}) {
  return (
    <HorizontalRail
      label={label}
      className="gap-5"
      desktopClassName={scrollOnDesktop ? "md:!overflow-x-auto" : "md:grid md:grid-cols-4 md:gap-6 2xl:grid-cols-5"}
      desktopControls={scrollOnDesktop}
    >
      {products.map((p) => (
        <div
          key={`${p.slug}:${(p as { listingId?: number }).listingId ?? "catalogue"}`}
          className={cn("w-[72%] max-w-[280px] shrink-0 snap-start", scrollOnDesktop ? "md:w-[240px]" : "md:w-auto md:max-w-none")}
        >
          <ProductCard product={p} />
        </div>
      ))}
    </HorizontalRail>
  );
}
