import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { MegaHeader } from "@/components/MegaHeader";
import { ShopCard } from "@/components/ShopCard";
import { TrustStrip } from "@/components/TrustStrip";
import { getShops } from "@/integrations/techaven/customer";
import { mapApiShopToCatalog, shopListingCount } from "@/lib/catalog-api";
import { cn } from "@/lib/utils";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";

export const Route = createFileRoute("/shops/")({
  loader: async () => {
    const [shops, heroPromotions, inlinePromotions] = await Promise.all([
      getShops(),
      getPromotions("shops_hero"),
      getPromotions("shops_inline_1"),
    ]);
    return { shops: shops.map(mapApiShopToCatalog), heroPromotions, inlinePromotions };
  },
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

const sorts = ["Most products", "Top rated", "A–Z"] as const;

function ShopsPage() {
  const { shops, heroPromotions, inlinePromotions } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Most products");
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
    if (sort === "Most products") out.sort((a, b) => shopListingCount(b) - shopListingCount(a));
    if (sort === "Top rated") out.sort((a, b) => b.rating - a.rating);
    if (sort === "A–Z") out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [shops, query, sort, verifiedOnly]);

  return (
    <>
      <PromotionSlot
        placement="shops_hero"
        promotions={heroPromotions}
        heroHeading="h1"
        fallback={
          <MegaHeader
            eyebrow="The mall"
            title="Every shop in one place"
            support="Browse seller storefronts, follow shops and buy with escrow protection — like the mobile app."
            actions={[]}
            media={[]}
            tone="brand-soft"
          />
        }
      />

      <section className="shell pb-12 md:pb-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <label className="relative block max-w-md flex-1">
            <Icon
              name="magnifier-linear"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops…"
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {sorts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-brand-500)]"
              />
              Verified only
            </label>
          </div>
        </div>

        <div
          className={cn(
            "mt-5 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3",
          )}
        >
          {list.map((shop) => (
            <ShopCard key={shop.slug} shop={shop} />
          ))}
        </div>

        {!list.length ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No shops match your search.
          </p>
        ) : null}
      </section>

      <PromotionSlot placement="shops_inline_1" promotions={inlinePromotions} />

      <TrustStrip />
    </>
  );
}
