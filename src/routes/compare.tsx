import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { formatMwk, getShop, products } from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare devices side by side — Techaven" },
      {
        name: "description",
        content:
          "Pick two to four phones, laptops or tablets and see price, condition, seller and specifications side by side.",
      },
      { property: "og:title", content: "Compare devices side by side — Techaven" },
      {
        property: "og:description",
        content: "See price, condition, seller and specs for up to four devices at once.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [selected, setSelected] = useState<string[]>([
    "apple-iphone-15-128gb",
    "samsung-galaxy-s23-256gb",
  ]);

  const toggle = (slug: string) =>
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length >= 4
          ? prev
          : [...prev, slug],
    );

  const chosen = selected
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  const specLabels = [...new Set(chosen.flatMap((p) => p.specs.map((s) => s.label)))];

  return (
    <>
      <MegaHeader
        eyebrow="Compare"
        title="Compare before you buy"
        support="Pick two to four devices and see the differences side-by-side — price, condition, shop and specifications."
        stages={["smartphones", "laptops"]}
        tone="dark"
      />

      <section className="shell py-10 md:py-14">
        <h2 className="text-xl font-bold text-ink-800">
          Choose devices <span className="text-muted-foreground">({selected.length} of 4)</span>
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {products.slice(0, 16).map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => toggle(p.slug)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                selected.includes(p.slug)
                  ? "bg-brand-500 text-white"
                  : "bg-stage text-ink-800 hover:bg-neutral-200",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        {chosen.length < 2 ? (
          <p className="mt-10 rounded-2xl bg-info-soft p-6 text-sm text-ink-800/80">
            Pick at least two devices to see the comparison.
          </p>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-40 text-left align-bottom text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Device
                  </th>
                  {chosen.map((p) => (
                    <th key={p.slug} className="p-3 text-left align-bottom">
                      <ImageStage category={p.category} className="w-28" />
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-3 block text-[15px] font-semibold text-ink-800 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th className="py-4 text-left font-medium text-muted-foreground">Price</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="p-3 text-lg font-extrabold text-ink-800">
                      {formatMwk(p.price)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-4 text-left font-medium text-muted-foreground">Condition</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="p-3 text-ink-800">
                      {p.condition}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-4 text-left font-medium text-muted-foreground">Shop</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="p-3 text-ink-800">
                      {getShop(p.shop)?.name}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-4 text-left font-medium text-muted-foreground">Rating</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="p-3 text-ink-800">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="star-bold" className="h-4 w-4 text-rating" />
                        {p.rating.toFixed(1)} ({p.reviews})
                      </span>
                    </td>
                  ))}
                </tr>
                {specLabels.map((label) => (
                  <tr key={label}>
                    <th className="py-4 text-left font-medium text-muted-foreground">{label}</th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="p-3 text-ink-800">
                        {p.specs.find((s) => s.label === label)?.value ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th className="py-4 text-left font-medium text-muted-foreground">Warranty</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="p-3 text-ink-800">
                      {p.warranty}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
