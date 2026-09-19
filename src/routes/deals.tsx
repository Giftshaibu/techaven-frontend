import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MegaHeader } from "@/components/MegaHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { TrustStrip } from "@/components/TrustStrip";
import { categories, dealProducts, discountPercent } from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals on electronics — Techaven" },
      {
        name: "description",
        content:
          "Current price drops on phones, laptops, audio and home electronics from shops across Techaven.",
      },
      { property: "og:title", content: "Deals on electronics — Techaven" },
      {
        property: "og:description",
        content: "Price drops across every category, updated by the shops themselves.",
      },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const list = [...dealProducts]
    .filter((p) => !filter || p.category === filter)
    .sort((a, b) => discountPercent(b) - discountPercent(a));

  const categoriesWithDeals = categories.filter((c) =>
    dealProducts.some((p) => p.category === c.slug),
  );

  return (
    <>
      <MegaHeader
        eyebrow="Deals"
        title="This week's price drops"
        support="Real reductions from Techaven shops, sorted by the biggest saving first."
        stages={["smartphones", "audio", "laptops"]}
        tone="brand"
      />

      <section className="shell py-10 md:py-14">
        <SectionHeader
          title={`${list.length} deals live now`}
          description="Prices are set by each shop and can change while stock lasts."
        />

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filter === null ? "bg-ink-900 text-white" : "bg-stage text-ink-800 hover:bg-neutral-200",
            )}
          >
            All deals
          </button>
          {categoriesWithDeals.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilter(c.slug)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                filter === c.slug
                  ? "bg-ink-900 text-white"
                  : "bg-stage text-ink-800 hover:bg-neutral-200",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <ProductGrid products={list} columns={4} />
      </section>

      <TrustStrip />
    </>
  );
}
