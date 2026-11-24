import { ImageStage } from "@/components/ImageStage";
import { useEffect, useState } from "react";
import { AirtelPayment } from "@/components/AirtelPayment";
import { ManualPayment } from "@/components/ManualPayment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Icon } from "@/components/Icon";
import { formatMwk } from "@/data/catalog";
import { cancelOrder, getOrder } from "@/integrations/techaven/customer";
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

  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useMutation({
    mutationFn: () => cancelOrder(String(order.data!.id)),
    onSuccess: async () => {
      setConfirmCancel(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["payment-context"] }),
      ]);
    },
  });

  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (order.data && (target === "payment-proof" || target === "airtel-payment")) {
      document.getElementById(target)?.scrollIntoView();
    }
  }, [order.data]);

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

  const actions = <footer className="mt-6 border-t border-border pt-4">
    <div className="flex flex-wrap justify-center gap-2">
      <Link to="/account/orders" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">See all orders</Link>
      <Link to="/deals" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Keep shopping</Link>
    </div>
          {data.can_cancel && (
            <div className="mt-5 flex flex-col items-center border-t border-border pt-4">
              {confirmCancel ? (
                <div className="space-y-3 rounded-xl border border-destructive/30 p-3">
                  <p className="text-sm font-medium">Cancel this {data.payment_method === "bank-transfer" ? "checkout" : "order"} and release its reserved stock?</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()} className="min-h-11 rounded-lg bg-destructive px-3 text-sm font-semibold text-white disabled:opacity-60">
                      {cancel.isPending ? "Cancelling…" : "Confirm cancellation"}
                    </button>
                    <button type="button" disabled={cancel.isPending} onClick={() => setConfirmCancel(false)} className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold">Keep order</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmCancel(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-destructive/30 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5">
                  <Icon name="close-circle-linear" className="size-4" />
                  Cancel order
                </button>
              )}
              {cancel.isError && <p role="alert" className="mt-2 text-sm text-destructive">{cancel.error.message}</p>}
            </div>
          )}
  </footer>;
  if (data.payment_method === "bank-transfer" && data.status !== "cancelled") {
    return <section className="shell py-8">
      <ManualPayment orderId={String(data.id).replace("ord_", "")} footer={actions} />
    </section>;
  }

  if (data.payment_method === "airtel" && data.payment_status !== "paid" && data.status !== "cancelled") {
    return <section className="shell py-8">
      <AirtelPayment orderId={String(data.id).replace("ord_", "")} footer={actions} />
    </section>;
  }

  return (
    <section className="shell py-10 md:py-14">
      <div className="rounded-3xl bg-success-soft p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-brand-500">
          <Icon name="check-circle-bold" className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-800">{data.status === "cancelled" ? "Order cancelled" : "Order placed"}</h1>
        <p className="mt-2 text-sm text-ink-800/80">
          Reference <span className="font-bold">{ref}</span>{data.status !== "cancelled" && <> · we’re confirming stock with the shop and will message you on {phone}.</>}
        </p>
        {data.payment_status ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-800/70">
            Payment: {data.payment_status}
          </p>
        ) : null}
      </div>

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
              const total = Number(item.subtotal ?? Number(item.unit_price ?? item.price ?? 0) * qty);
              return (
                <li key={`${item.product_id ?? index}`} className="flex items-center gap-4 py-4">
                  <ImageStage src={item.product_image ?? undefined} className="size-12 shrink-0" />
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
                  <p className="text-sm font-bold text-ink-800">{formatMwk(total)}</p>
                </li>
              );
            })}
          </ul>

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
          {actions}
        </aside>
      </div>
    </section>
  );
}
