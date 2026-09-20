import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { formatMwk, getShop, products } from "@/data/catalog";
import { useCompareSelection } from "@/lib/compare";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare devices side by side — Techaven" },
      {
        name: "description",
        content:
          "Pick two to three phones, laptops or tablets and see price, condition, seller and specifications side by side.",
      },
      { property: "og:title", content: "Compare devices side by side — Techaven" },
      {
        property: "og:description",
        content: "See price, condition, seller and specs for up to three devices at once.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { selected, toggle, remove, clear, count } = useCompareSelection();
  const [query, setQuery] = useState("");
  const [differencesOnly, setDifferencesOnly] = useState(false);

  const chosen = selected
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  function getVariation(label: string) {
    const values = chosen
      .map((product) => product.specs.find((spec) => spec.label === label)?.value ?? "—")
      .filter((value) => value !== "—");
    return new Set(values).size > 1;
  }

  const specLabels = [...new Set(chosen.flatMap((p) => p.specs.map((s) => s.label)))];
  const visibleSpecLabels = differencesOnly
    ? specLabels.filter((label) => getVariation(label))
    : specLabels;

  const canCompare = chosen.length >= 2;
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? products
        .filter((product) =>
          [product.name, product.brand, product.category].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        )
        .slice(0, 5)
    : [];

  return (
    <>
      <MegaHeader
        eyebrow="Compare"
        title="Compare before you buy"
        support="Pick two to three devices and see the differences side-by-side — price, condition, shop and specifications."
        stages={["smartphones", "laptops"]}
        tone="dark"
      />

      <section className="shell pb-16 pt-10 md:pt-14">
        <div className="rounded-[28px] border border-neutral-200 bg-surface p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-normal text-ink-800">Shortlist</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-800 md:text-3xl">
                Choose devices <span className="text-muted-foreground">({count}/3)</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDifferencesOnly((value) => !value)}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-semibold transition-colors md:text-sm",
                  differencesOnly
                    ? "border-brand-500 bg-brand-100 text-brand-700"
                    : "border-neutral-200 bg-stage text-ink-800 hover:border-neutral-400",
                )}
              >
                Differences only
              </button>

              {selected.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-full border border-neutral-200 bg-surface px-3 py-2 text-xs font-semibold text-ink-800 transition-colors hover:border-neutral-400 md:text-sm"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="compare-search" className="sr-only">
              Search products to compare
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-050 px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <Icon name="magnifier-linear" className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                id="compare-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products to compare..."
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-muted-foreground"
              />
            </div>

            {searchResults.length ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-surface">
                {searchResults.map((product) => {
                  const alreadySelected = selected.includes(product.slug);
                  const atLimit = selected.length >= 3 && !alreadySelected;

                  return (
                    <div
                      key={product.slug}
                      className="flex items-center gap-3 border-b border-neutral-200 px-3 py-3 last:border-b-0"
                    >
                      <ImageStage
                        category={product.category}
                        className="h-12 w-12 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {getShop(product.shop)?.name} · {formatMwk(product.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={atLimit}
                        onClick={() => {
                          toggle(product.slug);
                          if (!alreadySelected) setQuery("");
                        }}
                        className={cn(
                          "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                          alreadySelected
                            ? "bg-brand-100 text-brand-700"
                            : atLimit
                              ? "cursor-not-allowed bg-neutral-200 text-muted-foreground"
                              : "bg-brand-500 text-white hover:bg-brand-700",
                        )}
                      >
                        {alreadySelected ? "Added" : "+ Compare"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : normalizedQuery ? (
              <p className="mt-3 text-sm text-muted-foreground">No products match that search.</p>
            ) : null}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-ink-800">Selected devices</h3>
              {selected.length < 3 ? (
                <span className="text-xs text-muted-foreground">
                  {3 - selected.length} slot(s) available
                </span>
              ) : null}
            </div>

            {chosen.length ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chosen.map((product) => (
                  <div
                    key={product.slug}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-050 p-2.5"
                  >
                    <ImageStage
                      category={product.category}
                      className="h-14 w-14 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMwk(product.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(product.slug)}
                      aria-label={`Remove ${product.name} from selected devices`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-ink-800"
                    >
                      <Icon name="close-circle-linear" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-info-soft px-4 py-3 text-sm text-ink-800/80">
                Search for products to start comparing.
              </p>
            )}
          </div>
        </div>

        {!canCompare ? (
          <div className="mt-8 rounded-[28px] border border-info-soft bg-info-soft p-6 text-sm text-ink-800/80 md:p-8">
            <p className="text-base font-semibold text-ink-800">
              {chosen.length === 1
                ? "Add one more product to compare."
                : "Search for products to start comparing."}
            </p>
            <p className="mt-2 max-w-xl">
              {chosen.length === 1
                ? "Choose another device to view a side-by-side comparison of price, shop, condition and core specs."
                : "Add two or three devices to view a side-by-side comparison of price, shop, condition and core specs."}
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-[28px] border border-neutral-200 bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 w-40 border-b border-neutral-200 bg-neutral-050 px-4 py-4 text-[13px] font-semibold tracking-normal text-ink-800">
                      Device
                    </th>
                    {chosen.map((p) => (
                      <th key={p.slug} className="border-b border-neutral-200 px-4 py-4 align-top">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <ImageStage
                              category={p.category}
                              className="w-24 rounded-2xl md:w-28"
                            />
                            <Link
                              to="/product/$slug"
                              params={{ slug: p.slug }}
                              className="mt-3 block text-base font-semibold text-ink-800 transition-colors hover:text-brand-500"
                            >
                              {p.name}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {getShop(p.shop)?.name}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(p.slug)}
                            className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-ink-800"
                          >
                            Remove
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-neutral-200">
                    <th className="sticky left-0 z-10 bg-neutral-050 px-4 py-4 text-left text-[13px] font-semibold tracking-normal text-ink-800">
                      Price
                    </th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="px-4 py-4 align-top">
                        <span className="text-xl font-extrabold tracking-tight text-ink-800">
                          {formatMwk(p.price)}
                        </span>
                        {p.oldPrice ? (
                          <span className="ml-2 text-xs text-muted-foreground line-through">
                            {formatMwk(p.oldPrice)}
                          </span>
                        ) : null}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-neutral-200">
                    <th className="sticky left-0 z-10 bg-neutral-050 px-4 py-4 text-left text-[13px] font-semibold tracking-normal text-ink-800">
                      Condition
                    </th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="px-4 py-4 align-top text-ink-800">
                        {p.condition}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-neutral-200">
                    <th className="sticky left-0 z-10 bg-neutral-050 px-4 py-4 text-left text-[13px] font-semibold tracking-normal text-ink-800">
                      Shop
                    </th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="px-4 py-4 align-top text-ink-800">
                        {getShop(p.shop)?.name}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-neutral-200">
                    <th className="sticky left-0 z-10 bg-neutral-050 px-4 py-4 text-left text-[13px] font-semibold tracking-normal text-ink-800">
                      Rating
                    </th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="px-4 py-4 align-top text-ink-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="star-bold" className="h-4 w-4 text-rating" />
                          <span className="font-semibold">{p.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({p.reviews})</span>
                        </span>
                      </td>
                    ))}
                  </tr>

                  {visibleSpecLabels.map((label) => {
                    const hasVariation = getVariation(label);
                    return (
                      <tr key={label} className="border-b border-neutral-200">
                        <th className="sticky left-0 z-10 bg-neutral-050 px-4 py-4 text-left text-[13px] font-semibold tracking-normal text-ink-800">
                          {label}
                        </th>
                        {chosen.map((p) => {
                          const value = p.specs.find((s) => s.label === label)?.value ?? "—";
                          return (
                            <td
                              key={`${label}-${p.slug}`}
                              className={cn(
                                "px-4 py-4 align-top text-ink-800",
                                differencesOnly && hasVariation ? "bg-brand-100/40" : "bg-surface",
                                differencesOnly && !hasVariation && "text-ink-800/55",
                              )}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  <tr>
                    <th className="sticky left-0 z-10 bg-neutral-050 px-4 py-4 text-left text-[13px] font-semibold tracking-normal text-ink-800">
                      Warranty
                    </th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="px-4 py-4 align-top text-ink-800">
                        {p.warranty}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
