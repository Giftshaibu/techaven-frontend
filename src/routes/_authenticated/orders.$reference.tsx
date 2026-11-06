import { ManualPayment } from "@/components/ManualPayment";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Icon } from "@/components/Icon";
import { formatMwk } from "@/data/catalog";
import { getOrder } from "@/integrations/techaven/customer";
import { productSlugFromApiId } from "@/lib/catalog-api";

export const Route = createFileRoute("/_authenticated/orders/$reference")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Techaven" },
      { name: "description", content: "Your Techaven order details and next steps." },
      { property: "og:title", content: "Order confirmed — Techaven" },
      { property: "og:description", content: "Your Techaven order details and next steps." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { reference } = Route.useParams();

  const order = useQuery({
    queryKey: ["orders", reference],
    queryFn: () => getOrder(reference),
  });

  if (order.isLoading) {
    return <p className="shell py-14 text-sm text-muted-foreground">Loading your order…</p>;
  }

  if (!order.data) {
    return (
      <section className="shell py-14">
        <div className="mx-auto max-w-md rounded-3xl bg-surface p-10 text-center">
          <h1 className="text-2xl font-extrabold text-ink-800">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find an order with reference {reference}.
          </p>
          <Link
            to="/account/orders"
            className="mt-6 inline-flex rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            See your orders
          </Link>
        </div>
      </section>
    );
  }

  const data = order.data;
  const items = data.items ?? [];
  const ref = String(data.order_number ?? data.reference ?? reference);
  const phone =
    (data.phone as string | undefined) ??
    (data as { shipping_phone?: string }).shipping_phone ??
    "your phone";

  return (
    <section className="shell py-10 md:py-14">
      <div className="rounded-3xl bg-success-soft p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-brand-500">
          <Icon name="check-circle-bold" className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-800">Order placed</h1>
        <p className="mt-2 text-sm text-ink-800/80">
          Reference <span className="font-bold">{ref}</span> · we're confirming stock with the shop
          and will message you on {phone}.
        </p>
        {data.payment_status ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-800/70">
            Payment: {data.payment_status}
          </p>
        ) : null}
      </div>

      <ManualPayment orderId={String(data.id).replace("ord_", "")} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="rounded-3xl bg-surface p-6 md:p-8">
          <h2 className="text-lg font-bold text-ink-800">What you ordered</h2>
          <ul className="mt-4 divide-y divide-border">
            {items.map((item, index) => {
              const slug = item.product_id
                ? productSlugFromApiId(Number(item.product_id))
                : undefined;
              const name = item.product_name ?? "Product";
              const qty = item.quantity ?? 1;
              const unit = Number(item.unit_price ?? 0);
              return (
                <li key={`${item.product_id ?? index}`} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-800">
                      {slug ? (
                        <Link to="/product/$slug" params={{ slug }} className="hover:underline">
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Qty {qty}</p>
                  </div>
                  <p className="text-sm font-bold text-ink-800">{formatMwk(unit * qty)}</p>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-stage p-4">
              <p className="text-[13px] font-semibold tracking-normal text-ink-800">Status</p>
              <p className="mt-2 text-sm font-semibold capitalize text-ink-800">{data.status}</p>
              {data.courier_tracking_number ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tracking: {data.courier_tracking_number}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-stage p-4">
              <p className="text-[13px] font-semibold tracking-normal text-ink-800">Escrow</p>
              <p className="mt-2 text-sm font-semibold text-ink-800">
                {data.escrow_status ?? "Held until delivery is confirmed"}
              </p>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-surface p-6">
          <h2 className="text-lg font-bold text-ink-800">Totals</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold text-ink-800">
                {data.subtotal != null ? formatMwk(Number(data.subtotal)) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold text-ink-800">
                {data.shipping_fee != null
                  ? Number(data.shipping_fee) === 0
                    ? "Free"
                    : formatMwk(Number(data.shipping_fee))
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-bold text-ink-800">Total</dt>
              <dd className="text-xl font-extrabold text-ink-800">
                {data.total != null ? formatMwk(Number(data.total)) : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-2">
            <Link
              to="/account/orders"
              className="rounded-lg bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              See all orders
            </Link>
            <Link
              to="/deals"
              className="rounded-lg border border-border px-5 py-3 text-center text-sm font-semibold text-ink-800 hover:bg-stage"
            >
              Keep shopping
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
