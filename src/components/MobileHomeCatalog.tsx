import {
  resolveProduct,
  fetchShopProducts,
  fetchCategoryProducts,
  resolveCategory,
} from "@/lib/resolve-catalog";
import { parseApiShopId } from "@/lib/catalog-api";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import type { CatalogProduct } from "@/lib/catalog-api";
import { readVisits, rankProducts } from "@/lib/browsing-history";
export function MobileHomeCatalog({ products, historyCleared }: { products: CatalogProduct[]; historyCleared: number }) {
  const [visits, setVisits] = useState<ReturnType<typeof readVisits>>([]);
  const [extra, setExtra] = useState<CatalogProduct[]>([]);
  useEffect(() => {
    let active = true;
    const history = readVisits();
    setVisits(history);
    setExtra([]);
    if (!window.matchMedia("(max-width: 767px)").matches || !history.length) return;
    const productVisits = history.filter((v) => v.kind === "product").slice(0, 5);
    const shopIds = history
      .filter((v) => v.kind === "shop")
      .map((v) => parseApiShopId(v.slug))
      .filter((id): id is number => id != null)
      .slice(0, 2);
    const category = productVisits[0]?.category;
    Promise.allSettled([
      ...productVisits.map((v) => resolveProduct(v.slug).then((p) => (p ? [p] : []))),
      ...shopIds.map((id) => fetchShopProducts(id, 1, 8).then((p) => p.products)),
      ...(category
        ? [
            resolveCategory(category).then((c) =>
              c?.apiCategoryId != null
                ? fetchCategoryProducts(c.apiCategoryId, 1, 8).then((p) => p.products)
                : [],
            ),
          ]
        : []),
    ]).then((results) => {
      if (active)
        setExtra(results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])));
    });
    return () => {
      active = false;
    };
  }, [historyCleared]);
  return (
    <section className="shell py-5 md:hidden" aria-labelledby="mobile-shopping-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 id="mobile-shopping-title" className="text-xl font-bold">
          {visits.length ? "Picked for your browsing" : "Find your next device"}
        </h1>
        <Link to="/products" className="text-sm font-semibold text-brand-500 py-2">
          View all products
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {rankProducts([...products, ...extra], visits).map((p) => (
          <ProductCard key={p.slug} product={p} compact />
        ))}
      </div>
      {!products.length && (
        <p className="text-sm text-muted-foreground">
          Products are loading.{" "}
          <Link to="/products" className="underline">
            Browse the catalogue
          </Link>
        </p>
      )}
    </section>
  );
}
