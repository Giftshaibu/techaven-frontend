import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { TrustStrip } from "@/components/TrustStrip";
import {
  discountPercent,
  formatMwk,
  getCategory,
  getProduct,
  getShop,
  products,
  shops,
} from "@/data/catalog";
import { useCart } from "@/lib/cart";
import { useCompareSelection } from "@/lib/compare";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product unavailable — Techaven" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — Techaven`;
    const description = `${product.name} from ${getShop(product.shop)?.name} at ${formatMwk(
      product.price,
    )}. ${product.condition}, ${product.warranty}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const shop = getShop(product.shop)!;
  const category = getCategory(product.category);
  const { add, count } = useCart();
  const { toggle, isSelected } = useCompareSelection();
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const otherShops = shops
    .filter((s) => s.slug !== shop.slug)
    .slice(0, Math.max(product.shopsCount - 1, 0))
    .map((s, i) => ({ shop: s, price: product.price + (i + 1) * 15000 }));

  const related = products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 5);

  const discount = discountPercent(product);

  return (
    <>
      <div className="shell flex flex-wrap items-center gap-2 py-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-brand-500">
          Techaven
        </Link>
        <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
        {category ? (
          <>
            <Link
              to="/category/$slug"
              params={{ slug: category.slug }}
              className="hover:text-brand-500"
            >
              {category.name}
            </Link>
            <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
          </>
        ) : null}
        <span className="font-semibold text-ink-800">{product.name}</span>
      </div>

      <section className="shell grid gap-10 pb-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <ImageStage category={product.category} className="rounded-2xl" />
          <div className="mt-4 flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "w-20 rounded-xl border-2 transition-colors",
                  activeImage === i ? "border-brand-500" : "border-transparent",
                )}
              >
                <ImageStage category={product.category} className="rounded-[10px]" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-normal text-brand-700">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink-800 md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <Icon name="star-bold" className="h-4 w-4 text-rating" />
              <span className="font-bold text-ink-800">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
            </span>
            <span className="rounded-[6px] bg-success-soft px-2 py-0.5 text-xs font-semibold text-ink-800">
              {product.condition}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-ink-800">
              {formatMwk(product.price)}
            </span>
            {product.oldPrice ? (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatMwk(product.oldPrice)}
                </span>
                <span className="rounded-[6px] bg-ink-900 px-2 py-1 text-xs font-bold text-white">
                  -{discount}%
                </span>
              </>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {shop.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-800">
                  Sold by{" "}
                  <Link
                    to="/shops/$shopSlug"
                    params={{ shopSlug: shop.slug }}
                    className="hover:underline"
                  >
                    {shop.name}
                  </Link>
                  {shop.verified ? (
                    <Icon name="verified-check-bold" className="h-4 w-4 text-brand-500" />
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {shop.location} · {shop.rating.toFixed(1)} rating ·{" "}
                  {shop.orders.toLocaleString("en-US")} orders
                </p>
              </div>
            </div>

            {otherShops.length ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[13px] font-semibold tracking-normal text-ink-800">
                  Also offered by
                </p>
                <ul className="mt-2 space-y-2">
                  {otherShops.map((entry) => (
                    <li key={entry.shop.slug} className="flex items-center justify-between text-sm">
                      <Link
                        to="/shops/$shopSlug"
                        params={{ shopSlug: entry.shop.slug }}
                        className="text-ink-800 hover:underline"
                      >
                        {entry.shop.name}
                      </Link>
                      <span className="font-bold text-ink-800">{formatMwk(entry.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                add(product.slug);
                setAdded(true);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Icon name="cart-large-2-linear" className="h-5 w-5" />
              Add to basket
            </button>
            <Link
              to="/cart"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-stage"
            >
              View basket{count > 0 ? ` (${count})` : ""}
            </Link>
          </div>

          {added ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-ink-800">
              <Icon name="check-circle-bold" className="h-4 w-4 text-brand-500" />
              Added to your basket.
            </p>
          ) : null}

          <ul className="mt-6 space-y-2.5 text-sm">
            {[
              { icon: "box-linear", text: product.delivery },
              { icon: "shield-check-linear", text: product.warranty },
              { icon: "refresh-circle-linear", text: "Trade-in accepted towards this device" },
            ].map((row) => (
              <li key={row.text} className="flex items-center gap-2.5 text-ink-800/80">
                <Icon name={row.icon} className="h-[18px] w-[18px] text-brand-500" />
                {row.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell pb-12">
        <div className="grid gap-8 rounded-3xl bg-surface p-6 md:p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-ink-800">Specifications</h2>
            <dl className="mt-4 divide-y divide-border">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="text-right font-semibold text-ink-800">{spec.value}</dd>
                </div>
              ))}
              {product.storage ? (
                <div className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="text-muted-foreground">Storage</dt>
                  <dd className="text-right font-semibold text-ink-800">{product.storage}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-800">Good to know</h2>
            <ul className="mt-4 space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-ink-800/80">
                  <Icon
                    name="check-circle-linear"
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-500"
                  />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-info-soft p-5">
              <h3 className="text-base font-bold text-ink-800">Still deciding?</h3>
              <p className="mt-1.5 text-sm text-ink-800/70">
                Compare this with up to three other devices before you buy.
              </p>
              <button
                type="button"
                onClick={() => toggle(product.slug)}
                className="mt-4 inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {isSelected(product.slug) ? "Added to compare" : "Add to compare"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="shell pb-14">
        <SectionHeader title="You might also like" />
        <ProductGrid products={related} columns={4} />
      </section>

      <TrustStrip />
    </>
  );
}
