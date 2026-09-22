import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductGrid";
import { searchCatalogProducts } from "@/lib/resolve-catalog";

type Search = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Search — Techaven" },
      {
        name: "description",
        content: "Search products across Techaven shops.",
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
  const query = (q ?? "").trim();

  const results = useQuery({
    queryKey: ["search", query],
    enabled: query.length >= 2,
    queryFn: () => searchCatalogProducts(query, 1, 40),
  });

  return (
    <section className="shell py-10 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">
        {query ? <>Search results for “{q}”</> : "Search Techaven"}
      </h1>

      {!query ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Use the search box above to find products from live shop listings.
        </p>
      ) : query.length < 2 ? (
        <p className="mt-4 text-sm text-muted-foreground">Type at least two characters to search.</p>
      ) : results.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Searching…</p>
      ) : results.isError ? (
        <p className="mt-6 text-sm text-muted-foreground">Search is unavailable right now. Try again shortly.</p>
      ) : !results.data?.products.length ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No products matched. Try another name or{" "}
          <Link to="/shops" className="font-semibold text-brand-500 hover:underline">
            browse shops
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8">
          <ProductGrid products={results.data.products} />
        </div>
      )}
    </section>
  );
}
