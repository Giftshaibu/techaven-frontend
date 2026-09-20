import { ProductCard } from "@/components/ProductCard";
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

export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar flex snap-x gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 2xl:grid-cols-5">
      {products.map((p) => (
        <div key={p.slug} className="w-[62%] shrink-0 snap-start md:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
