import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductsQuery } from "@/integrations/techaven/customer";
import type { CatalogProduct } from "@/lib/catalog-api";
import { fetchProductListing } from "@/lib/resolve-catalog";
import { cn } from "@/lib/utils";

const sortOptions: { label: string; value: ProductsQuery["sort"] }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Top rated", value: "rating" },
];

export const Route = createFileRoute("/products")({
  loader: () => fetchProductListing(1, 48, "newest"),
  head: () => ({
    meta: [
      { title: "All products — Techaven" },
      {
        name: "description",
        content: "Browse every product listed across Techaven shops — phones, laptops, audio and more.",
      },
      { property: "og:title", content: "All products — Techaven" },
      {
        property: "og:description",
        content: "The full marketplace catalog from verified Malawian electronics shops.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const initial = Route.useLoaderData();
  const [products, setProducts] = useState<CatalogProduct[]>(initial.products);
  const [page, setPage] = useState(initial.page);
  const [sort, setSort] = useState<ProductsQuery["sort"]>(initial.sort ?? "newest");
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [busy, setBusy] = useState(false);

  const sortLabel = useMemo(
    () => sortOptions.find((o) => o.value === sort)?.label ?? "Newest",
    [sort],
  );

  const applySort = useCallback(async (next: ProductsQuery["sort"]) => {
    if (next === sort) return;
    setBusy(true);
    try {
      const data = await fetchProductListing(1, 48, next);
      setProducts(data.products);
      setPage(data.page);
      setHasMore(data.hasMore);
      setSort(next);
    } finally {
      setBusy(false);
    }
  }, [sort]);

  const loadMore = useCallback(async () => {
    if (!hasMore || busy) return;
    setBusy(true);
    try {
      const nextPage = page + 1;
      const data = await fetchProductListing(nextPage, 48, sort);
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
      setHasMore(data.hasMore && data.products.length > 0);
    } finally {
      setBusy(false);
    }
  }, [hasMore, busy, page, sort]);

  return (
    <>
      <MegaHeader
        eyebrow="Marketplace"
        title="All products"
        support="Every live listing from Techaven shops — same catalog as the mobile app."
        actions={[
          { label: "Shop deals", to: "/deals" },
          { label: "Browse shops", to: "/shops" },
        ]}
        media={[]}
        tone="neutral"
      />

      <section className="shell pb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-800 md:text-3xl">
              {products.length}
              {hasMore ? "+" : ""} products
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sort the feed or load more pages from the marketplace API.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Sort</span>
            <select
              value={sort}
              disabled={busy}
              onChange={(e) => void applySort(e.target.value as ProductsQuery["sort"])}
              aria-label={`Sort products, currently ${sortLabel}`}
              className="h-10 rounded-lg border border-border bg-surface px-3 font-semibold text-ink-800"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {busy && !products.length ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : !products.length ? (
          <div className="rounded-3xl bg-surface p-10 text-center">
            <p className="text-sm text-muted-foreground">No products are listed yet.</p>
            <Link
              to="/shops"
              className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:underline"
            >
              Browse shops instead
            </Link>
          </div>
        ) : (
          <>
            <ProductGrid products={products} />
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void loadMore()}
                  className={cn(
                    "rounded-lg border border-border px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-stage",
                    busy && "opacity-60",
                  )}
                >
                  {busy ? "Loading…" : "Load more products"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
