import { useState } from "react";
import { CatalogueControls } from "@/components/CatalogueControls";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/data/catalog";

export function FilteredProductGrid({ products }: { products: Product[] }) {
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("");
  const brands = [...new Set(products.map(product => product.brand))].filter(Boolean).sort();
  const visible = products.filter(product => !brand || product.brand === brand);
  if (sort === "price-asc") visible.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") visible.sort((a, b) => b.price - a.price);
  if (sort === "rating") visible.sort((a, b) => b.rating - a.rating);
  return <>
    <div className="mb-4 flex justify-end">
      <CatalogueControls filters={<select aria-label="Filter by brand" className="rounded-lg border border-border bg-surface p-2" value={brand}
        onChange={event => setBrand(event.target.value)}>
        <option value="">All brands</option>
        {brands.map(value => <option key={value}>{value}</option>)}
      </select>} sort={<select aria-label="Sort products" className="rounded-lg border border-border bg-surface p-2" value={sort}
        onChange={event => setSort(event.target.value)}>
        <option value="">Recommended</option><option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option><option value="rating">Top rated</option>
      </select>} />
    </div>
    {visible.length ? <ProductGrid products={visible} /> : <p className="py-8 text-sm text-muted-foreground">No products match these filters.</p>}
  </>;
}
