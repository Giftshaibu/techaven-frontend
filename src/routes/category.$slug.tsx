import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { type Promo } from "@/components/PromoTile";
import { getCategory, productsByCategory, shops } from "@/data/catalog";
import { cn } from "@/lib/utils";

type Search = { brand?: string };

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search.brand === "string" ? { brand: search.brand } : {},
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Category unavailable — Techaven" }, { name: "robots", content: "noindex" }],
      };
    }
    const { category } = loaderData;
    const title = `${category.name} — Techaven`;
    return {
      meta: [
        { title },
        { name: "description", content: category.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: category.blurb },
      ],
    };
  },
  component: CategoryPage,
});

const sorts = ["Recommended", "Price: low to high", "Price: high to low", "Top rated"] as const;

const inlinePromo: Promo = {
  headline: "Trade in, pay less",
  support: "Your old device can cover part of this purchase.",
  cta: "Check your device",
  to: "/trade-in",
  theme: "brand-soft",
};

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { brand: brandFromUrl } = Route.useSearch();

  const all = useMemo(() => productsByCategory(category.slug), [category.slug]);
  const [brand, setBrand] = useState<string | null>(brandFromUrl ?? null);
  const [shopFilter, setShopFilter] = useState<string | null>(null);
  const [condition, setCondition] = useState<"all" | "new" | "refurbished">("all");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Recommended");
  const [visible, setVisible] = useState(8);

  const shopsInCategory = shops.filter((s) => all.some((p) => p.shop === s.slug));

  const filtered = useMemo(() => {
    let list = all;
    if (brand) list = list.filter((p) => p.brand === brand);
    if (shopFilter) list = list.filter((p) => p.shop === shopFilter);
    if (condition === "new") list = list.filter((p) => p.condition === "New");
    if (condition === "refurbished")
      list = list.filter((p) => p.condition.includes("refurbished"));

    const sorted = [...list];
    if (sort === "Price: low to high") sorted.sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low") sorted.sort((a, b) => b.price - a.price);
    if (sort === "Top rated") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [all, brand, shopFilter, condition, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <>
      <div className="shell flex items-center gap-2 py-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-brand-500">
          Techaven
        </Link>
        <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
        <Link to="/categories" className="hover:text-brand-500">
          Categories
        </Link>
        <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink-800">{category.name}</span>
      </div>

      <MegaHeader
        eyebrow="Category"
        title={category.name}
        support={category.blurb}
        actions={[
          { label: `Shop ${category.name.toLowerCase()}`, to: "/deals" },
          { label: "Compare devices", to: "/compare" },
        ]}
        stages={[category.slug, category.slug, category.slug]}
        tone="brand-soft"
      />

      <section className="shell py-8">
        <div className="flex flex-wrap gap-2">
          {category.subcategories.map((sub) => (
            <span
              key={sub}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-800"
            >
              {sub}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBrand(null)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              brand === null ? "bg-ink-900 text-white" : "bg-stage text-ink-800 hover:bg-neutral-200",
            )}
          >
            All brands
          </button>
          {category.brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(b)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                brand === b ? "bg-ink-900 text-white" : "bg-stage text-ink-800 hover:bg-neutral-200",
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </section>

      <section className="shell pb-12 md:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-800">{category.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} product{filtered.length === 1 ? "" : "s"} from{" "}
              {shopsInCategory.length} shops
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={shopFilter ?? ""}
              onChange={(e) => setShopFilter(e.target.value || null)}
              aria-label="Filter by shop"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink-800"
            >
              <option value="">All shops</option>
              {shopsInCategory.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as typeof condition)}
              aria-label="Filter by condition"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink-800"
            >
              <option value="all">Any condition</option>
              <option value="new">New</option>
              <option value="refurbished">Refurbished</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
              aria-label="Sort products"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-ink-800"
            >
              {sorts.map((s) => (
                <option key={s} value={s}>
                  Sort: {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-8">
          {shown.length ? (
            <ProductGrid
              products={shown}
              promo={shown.length >= 8 ? inlinePromo : undefined}
              promoAfter={8}
            />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No products match those filters yet.
            </p>
          )}
        </div>

        {visible < filtered.length ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + 8)}
              className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-stage"
            >
              Load more products
            </button>
          </div>
        ) : null}

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-3xl bg-info-soft p-8 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-bold text-ink-800">
              Not sure which {category.name.toLowerCase().replace(/s$/, "")} to pick?
            </h3>
            <p className="mt-1.5 text-sm text-ink-800/70">
              Put your shortlist side by side and compare the specs that matter.
            </p>
          </div>
          <Link
            to="/compare"
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Compare {category.name.toLowerCase()}
          </Link>
        </div>
      </section>
    </>
  );
}
