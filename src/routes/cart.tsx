import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { formatMwk } from "@/data/catalog";
import type { CatalogProduct } from "@/lib/catalog-api";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your basket — Techaven" },
      {
        name: "description",
        content: "Review the devices in your Techaven basket before checking out.",
      },
      { property: "og:title", content: "Your basket — Techaven" },
      { property: "og:description", content: "Review the devices in your Techaven basket." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQuantity, remove, clear, ready, syncing } = useCart();

  const items = lines
    .map((line) => ({
      line,
      product: line.product as CatalogProduct | undefined,
    }))
    .filter((entry) => entry.product);

  const subtotal = items.reduce(
    (sum, i) => sum + (i.product?.price ?? 0) * i.line.quantity,
    0,
  );
  const delivery = subtotal > 900000 || subtotal === 0 ? 0 : 6000;

  return (
    <section className="shell py-10 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">
        Your basket
      </h1>
      {syncing ? (
        <p className="mt-2 text-xs text-muted-foreground">Syncing with your account…</p>
      ) : null}

      {!ready ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading your basket…</p>
      ) : !items.length ? (
        <div className="mt-8 rounded-3xl bg-surface p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-stage text-ink-800">
            <Icon name="cart-large-2-linear" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-ink-800">Nothing here yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the shops and add a device to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/deals"
              className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Shop the deals
            </Link>
            <Link
              to="/shops"
              className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-stage"
            >
              Browse shops
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y divide-border rounded-3xl bg-surface px-6">
            {items.map(({ line, product }) => (
              <li key={line.slug} className="flex gap-4 py-5">
                <div className="w-24 shrink-0">
                  <ImageStage
                    category={product!.category}
                    src={product!.imageUrl}
                    alt={product!.name}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.slug }}
                    className="font-semibold text-ink-800 hover:underline"
                  >
                    {product!.name}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-ink-800">{formatMwk(product!.price)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      Qty
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          void setQuantity(line.slug, Number(e.target.value) || 1)
                        }
                        className="h-9 w-16 rounded-lg border border-border px-2"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void remove(line.slug)}
                      className="text-sm font-semibold text-brand-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-3xl bg-surface p-6">
            <h2 className="text-lg font-bold text-ink-800">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">{formatMwk(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Est. delivery</dt>
                <dd className="font-semibold">{delivery === 0 ? "Free" : formatMwk(delivery)}</dd>
              </div>
            </dl>
            <Link
              to="/checkout"
              className="mt-6 block rounded-lg bg-brand-500 py-3.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Checkout
            </Link>
            <button
              type="button"
              onClick={() => void clear()}
              className="mt-3 w-full text-sm font-semibold text-muted-foreground hover:text-ink-800"
            >
              Clear basket
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
