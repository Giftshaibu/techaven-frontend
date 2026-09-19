import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductGrid";
import { categories, catalogs, products, shops } from "@/data/catalog";

type Search = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Search — Techaven" },
      {
        name: "description",
        content: "Search products, categories, brands, shops and catalogs across Techaven.",
      },
      { property: "og:title", content: "Search — Techaven" },
      { property: "og:description", content: "Search everything listed on Techaven." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const query = (q ?? "").trim().toLowerCase();

  const matchedProducts = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.includes(query),
      )
    : [];
  const matchedCategories = query
    ? categories.filter((c) => c.name.toLowerCase().includes(query))
    : [];
  const matchedShops = query
    ? shops.filter(
        (s) =>
          s.name.toLowerCase().includes(query) || s.specialty.toLowerCase().includes(query),
      )
    : [];
  const matchedCatalogs = query
    ? catalogs.filter((c) => c.title.toLowerCase().includes(query))
    : [];

  return (
    <section className="shell py-10 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">
        {query ? <>Search results for “{q}”</> : "Search Techaven"}
      </h1>

      {!query ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Use the search box above to look for products, brands, shops or catalogs.
        </p>
      ) : (
        <>
          <div className="mt-6 space-y-3 text-sm">
            {matchedCategories.length ? (
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Categories:</span>
                {matchedCategories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="font-semibold text-brand-500 hover:underline"
                  >
                    {c.name}
                  </Link>
                ))}
              </p>
            ) : null}

            {matchedShops.length ? (
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Shops:</span>
                {matchedShops.map((s) => (
                  <Link
                    key={s.slug}
                    to="/shops/$shopSlug"
                    params={{ shopSlug: s.slug }}
                    className="font-semibold text-brand-500 hover:underline"
                  >
                    {s.name}
                  </Link>
                ))}
              </p>
            ) : null}

            {matchedCatalogs.length ? (
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Catalogs:</span>
                {matchedCatalogs.map((c) => (
                  <Link
                    key={c.slug}
                    to="/catalogs"
                    className="font-semibold text-brand-500 hover:underline"
                  >
                    {c.title}
                  </Link>
                ))}
              </p>
            ) : null}
          </div>

          <p className="mt-8 border-b border-border pb-4 text-sm text-muted-foreground">
            {matchedProducts.length} product{matchedProducts.length === 1 ? "" : "s"}
          </p>

          <div className="pt-8">
            {matchedProducts.length ? (
              <ProductGrid products={matchedProducts} columns={4} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nothing matched that search. Try a brand, a category or a shop name.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
