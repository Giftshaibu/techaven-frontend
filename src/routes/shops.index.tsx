import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { MegaHeader } from "@/components/MegaHeader";
import { ShopCard } from "@/components/ShopCard";
import { TrustStrip } from "@/components/TrustStrip";
import { shopProductCount, shops } from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shops/")({
  head: () => ({
    meta: [
      { title: "Shop the mall — all Techaven shops" },
      {
        name: "description",
        content:
          "Browse every electronics shop on Techaven, from phone specialists to audio and home electronics stores across Malawi.",
      },
      { property: "og:title", content: "Shop the mall — all Techaven shops" },
      {
        property: "og:description",
        content: "Verified electronics stores with their own catalogs, stock and delivery options.",
      },
    ],
  }),
  component: ShopsPage,
});

const sorts = ["Most orders", "Top rated", "Most products", "A–Z"] as const;

function ShopsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Most orders");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const list = useMemo(() => {
    let out = shops.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.specialty.toLowerCase().includes(query.toLowerCase()) ||
        s.location.toLowerCase().includes(query.toLowerCase()),
    );
    if (verifiedOnly) out = out.filter((s) => s.verified);
    out = [...out];
    if (sort === "Most orders") out.sort((a, b) => b.orders - a.orders);
    if (sort === "Top rated") out.sort((a, b) => b.rating - a.rating);
    if (sort === "Most products")
      out.sort((a, b) => shopProductCount(b.slug) - shopProductCount(a.slug));
    if (sort === "A–Z") out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [query, sort, verifiedOnly]);

  return (
    <>
      <MegaHeader
        eyebrow="Shops"
        title="Shop the mall"
        support="Browse the electronics stores on Techaven. Each one keeps its own stock, catalogs and delivery promises."
        stages={["smartphones", "home-electronics", "gaming"]}
        tone="dark"
      />

      <section className="shell py-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Icon
              name="magnifer-linear"
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops, specialties or towns"
              aria-label="Search shops"
              className="h-11 w-full rounded-full bg-stage pl-11 pr-4 text-[15px] outline-none ring-brand-500 focus:bg-surface focus:ring-2"
            />
          </div>

          <button
            type="button"
            onClick={() => setVerifiedOnly((v) => !v)}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
              verifiedOnly ? "bg-ink-900 text-white" : "bg-stage text-ink-800 hover:bg-neutral-200",
            )}
          >
            <Icon name="verified-check-linear" className="h-4 w-4" />
            Verified only
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
            aria-label="Sort shops"
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-ink-800"
          >
            {sorts.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {list.length} shop{list.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {list.map((shop) => (
            <ShopCard key={shop.slug} shop={shop} />
          ))}
        </div>

        {!list.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No shops match that search.
          </p>
        ) : null}
      </section>

      <TrustStrip />
    </>
  );
}
