import { useShopsTabVisible } from "@/lib/techaven-hooks";
import { CatalogueControls } from "@/components/CatalogueControls";
import { LoaderMark } from "@/components/TechavenLoader";
import { getCategories } from "@/integrations/techaven/customer";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductsQuery } from "@/integrations/techaven/customer";
import type { CatalogProduct } from "@/lib/catalog-api";
import { fetchProductListing } from "@/lib/resolve-catalog";
import { cn } from "@/lib/utils";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";

const sortOptions: { label: string; value: NonNullable<ProductsQuery["sort"]> }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Top rated", value: "rating" },
];

type CatalogueSearch = {
  category?: number | undefined;
  brand?: string | undefined;
  sort?: NonNullable<ProductsQuery["sort"]> | undefined;
};

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): CatalogueSearch => ({
    category: Number.isInteger(Number(search["category"])) && Number(search["category"]) > 0 ? Number(search["category"]) : undefined,
    brand: typeof search["brand"] === "string" ? search["brand"] : undefined,
    sort: sortOptions.find(option => option.value === search["sort"])?.value ?? "newest",
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [listing, heroPromotions, inlinePromotions, categories] = await Promise.all([
      fetchProductListing(1, 48, deps.sort, listingFilters(deps)),
      getPromotions("products_hero"),
      getPromotions("catalog_inline_1"),
      getCategories(),
    ]);
    return { ...listing, heroPromotions, inlinePromotions, categories };
  },
  head: () => ({
    meta: [
      { title: "All products — Techaven" },
      {
        name: "description",
        content:
          "Browse every product listed across Techaven shops — phones, laptops, audio and more.",
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

function listingFilters(search: { category?: number | undefined; brand?: string | undefined }) {
  return { ...(search.category ? { category_id: search.category } : {}), ...(search.brand ? { brand: search.brand } : {}) };
}

function ProductsPage() {
  const search = Route.useSearch();
  return <ProductResults key={JSON.stringify(search)} />;
}

function ProductResults() {
  const showShops = useShopsTabVisible();
  const initial = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [products, setProducts] = useState<CatalogProduct[]>(initial.products);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [busy, setBusy] = useState(false);
  const categories = search.category ? initial.categories.filter(category => category.id === search.category) : initial.categories;
  const brands = [...new Map(categories.flatMap(category => category.brands ?? []).map(brand => [brand.slug, brand])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));
  const fallbackHero = (
    <MegaHeader
      eyebrow="Marketplace"
      title="All products"
      support="Every live listing from Techaven shops — same catalog as the mobile app."
      actions={[
        { label: "Shop deals", to: "/deals" },
        ...(showShops ? [{ label: "Browse shops", to: "/shops" }] : []),
      ]}
      media={[]}
      tone="neutral"
    />
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || busy) return;
    setBusy(true);
    try {
      const nextPage = page + 1;
      const data = await fetchProductListing(nextPage, 48, search.sort, listingFilters(search));
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
      setHasMore(data.hasMore && data.products.length > 0);
    } finally {
      setBusy(false);
    }
  }, [hasMore, busy, page, search]);

  return (
    <>
      <PromotionSlot
        placement="products_hero"
        promotions={initial.heroPromotions}
        fallback={fallbackHero}
        heroHeading="h1"
      />

      <section className="shell pb-14">
        <div className="mb-4 flex justify-end">
          <CatalogueControls filters={<>
            <label className="grid gap-1 text-sm">Category
              <select value={search.category ?? ""} onChange={e => void navigate({ search: { ...search, category: Number(e.target.value) || undefined, brand: undefined } })} className="rounded-lg border border-border bg-surface p-2">
                <option value="">All categories</option>
                {initial.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">Brand
              <select value={search.brand ?? ""} onChange={e => void navigate({ search: { ...search, brand: e.target.value || undefined } })} className="rounded-lg border border-border bg-surface p-2">
                <option value="">All brands</option>
                {brands.map(brand => <option key={brand.slug} value={brand.slug}>{brand.name}</option>)}
              </select>
            </label>
          </>} sort={<select aria-label="Sort products" value={search.sort ?? "newest"} onChange={e => void navigate({ search: { ...search, sort: e.target.value as NonNullable<ProductsQuery["sort"]> } })} className="rounded-lg border border-border bg-surface p-2">
            {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>} />
        </div>

        {busy && !products.length ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : !products.length ? (
          <div className="rounded-3xl bg-surface p-10 text-center">
            <p className="text-sm text-muted-foreground">No products are listed yet.</p>
            {showShops ? (
              <Link
                to="/shops"
                className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:underline"
              >
                Browse shops instead
              </Link>
            ) : null}
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
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <LoaderMark size="xs" />
                      Loading more…
                    </span>
                  ) : (
                    "Load more products"
                  )}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
      <PromotionSlot placement="catalog_inline_1" promotions={initial.inlinePromotions} />
    </>
  );
}
