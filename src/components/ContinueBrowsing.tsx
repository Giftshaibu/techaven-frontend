import { useEffect, useState } from "react";
import { ProductRail } from "@/components/ProductGrid";
import { clearVisits, readVisits } from "@/lib/browsing-history";
import type { CatalogProduct } from "@/lib/catalog-api";
import { resolveProduct } from "@/lib/resolve-catalog";

export function ContinueBrowsing({ onClear }: { onClear: () => void }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let active = true;
    const visits = readVisits().filter((visit) => visit.kind === "product");
    void Promise.all(visits.slice(0, 8).map((visit) => resolveProduct(visit.slug))).then((results) => {
      if (!active) return;
      const unique = new Map<string, CatalogProduct>();
      for (const product of results) {
        if (product && !unique.has(product.slug)) unique.set(product.slug, product);
      }
      setProducts([...unique.values()]);
    });
    return () => { active = false; };
  }, []);

  if (!products.length) return null;

  return (
    <section className="shell py-5 md:py-8" aria-labelledby="continue-browsing">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="continue-browsing" className="text-xl font-bold">Continue browsing</h2>
        <button type="button" className="min-h-11 px-2 text-sm underline" onClick={() => {
          clearVisits();
          setProducts([]);
          onClear();
        }}>Clear history</button>
      </div>
      <ProductRail products={products} label="Recently viewed products" />
    </section>
  );
}
