import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Icon } from "@/components/Icon";
import { formatMwk, getShop } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";

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

const paymentLabels: Record<string, string> = {
  "airtel-money": "Airtel Money",
  mpamba: "TNM Mpamba",
  "bank-transfer": "Bank transfer",
  "cash-on-delivery": "Cash on delivery",
};

function OrderPage() {
  const { reference } = Route.useParams();

  const order = useQuery({
    queryKey: ["orders", reference],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("reference", reference)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
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
  const items = data.order_items ?? [];

  return (
    <section className="shell py-10 md:py-14">
      <div className="rounded-3xl bg-success-soft p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-brand-500">
          <Icon name="check-circle-bold" className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-800">
          Order placed
        </h1>
        <p className="mt-2 text-sm text-ink-800/80">
          Reference <span className="font-bold">{data.reference}</span> · we're confirming stock with
          the shop and will message you on {data.phone}.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="rounded-3xl bg-surface p-6 md:p-8">
          <h2 className="text-lg font-bold text-ink-800">What you ordered</h2>
          <ul className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-800">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.product_slug }}
                      className="hover:underline"
                    >
                      {item.product_name}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getShop(item.shop_slug)?.name ?? item.shop_slug} · Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-ink-800">
                  {formatMwk(Number(item.unit_price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-stage p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {data.fulfilment === "pickup" ? "Collection contact" : "Delivering to"}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-800">{data.recipient}</p>
              <p className="text-xs text-muted-foreground">
                {[data.street, data.area, data.city].filter(Boolean).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground">{data.phone}</p>
            </div>
            <div className="rounded-2xl bg-stage p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Payment
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-800">
                {paymentLabels[data.payment_method] ?? data.payment_method}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Instructions arrive once the shop confirms stock.
              </p>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-surface p-6">
          <h2 className="text-lg font-bold text-ink-800">Totals</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold text-ink-800">{formatMwk(Number(data.subtotal))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold text-ink-800">
                {Number(data.delivery_fee) === 0 ? "Free" : formatMwk(Number(data.delivery_fee))}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-bold text-ink-800">Total</dt>
              <dd className="text-xl font-extrabold text-ink-800">
                {formatMwk(Number(data.total))}
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
