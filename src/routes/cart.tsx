import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { formatMwk, getProduct, getShop } from "@/data/catalog";
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
  const { lines, setQuantity, remove, clear, ready } = useCart();

  const items = lines
    .map((line) => ({ line, product: getProduct(line.slug) }))
    .filter((entry): entry is { line: typeof entry.line; product: NonNullable<typeof entry.product> } =>
      Boolean(entry.product),
    );

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.line.quantity, 0);
  const delivery = subtotal > 900000 || subtotal === 0 ? 0 : 6000;

  return (
    <section className="shell py-10 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">
        Your basket
      </h1>

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
              className="rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-stage"
            >
              Browse shops
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="divide-y divide-border rounded-3xl bg-surface">
            {items.map(({ line, product }) => {
              const shop = getShop(product.shop);
              return (
                <div key={line.slug} className="flex gap-4 p-5">
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="w-24 shrink-0 sm:w-28"
                  >
                    <ImageStage category={product.category} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-semibold leading-snug text-ink-800">
                      <Link
                        to="/product/$slug"
                        params={{ slug: product.slug }}
                        className="hover:underline"
                      >
                        {product.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sold by {shop?.name} · {product.condition}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.delivery}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.slug, line.quantity - 1)}
                          aria-label={`Reduce quantity of ${product.name}`}
                          className="grid h-9 w-9 place-items-center text-ink-800 hover:text-brand-500"
                        >
                          <Icon name="minus-circle-linear" className="h-[18px] w-[18px]" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-ink-800">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.slug, line.quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="grid h-9 w-9 place-items-center text-ink-800 hover:text-brand-500"
                        >
                          <Icon name="add-circle-linear" className="h-[18px] w-[18px]" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(line.slug)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                      >
                        <Icon name="trash-bin-trash-linear" className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-extrabold text-ink-800">
                      {formatMwk(product.price * line.quantity)}
                    </p>
                    {line.quantity > 1 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMwk(product.price)} each
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end p-5">
              <button
                type="button"
                onClick={clear}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive"
              >
                Empty basket
              </button>
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-surface p-6">
            <h2 className="text-lg font-bold text-ink-800">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold text-ink-800">{formatMwk(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-semibold text-ink-800">
                  {delivery === 0 ? "Free" : formatMwk(delivery)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-bold text-ink-800">Total</dt>
                <dd className="text-xl font-extrabold text-ink-800">
                  {formatMwk(subtotal + delivery)}
                </dd>
              </div>
            </dl>

            <Link
              to="/checkout"
              className="mt-6 block w-full rounded-lg bg-ink-900 px-5 py-3.5 text-center text-[15px] font-semibold text-white hover:bg-ink-800"
            >
              Continue to checkout
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              You'll sign in on the next step so we can save your delivery details and order
              history.
            </p>

            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-info-soft p-4 text-xs text-ink-800/80">
              <Icon name="shield-check-linear" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Every Techaven order is covered by buyer protection until the device is working in your
              hands.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
