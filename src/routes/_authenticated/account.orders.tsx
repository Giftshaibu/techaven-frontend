import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { formatMwk } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({
    meta: [
      { title: "Your orders — Techaven" },
      { name: "description", content: "Every order you've placed on Techaven." },
      { property: "og:title", content: "Your orders — Techaven" },
      { property: "og:description", content: "Every order you've placed on Techaven." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

const statusTone: Record<string, string> = {
  pending: "bg-info-soft text-ink-800",
  confirmed: "bg-success-soft text-ink-800",
  cancelled: "bg-stage text-muted-foreground",
};

function OrdersPage() {
  const { user } = useAuth();

  const orders = useQuery({
    queryKey: ["orders", "list", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (orders.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your orders…</p>;
  }

  if (!orders.data?.length) {
    return (
      <div className="rounded-3xl bg-surface p-10 text-center">
        <h2 className="text-xl font-bold text-ink-800">No orders yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When you place an order it'll show up here with its full history.
        </p>
        <Link
          to="/deals"
          className="mt-6 inline-flex rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Shop the deals
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.data.map((order) => (
        <li key={order.id} className="rounded-3xl bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink-800">{order.reference}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {(order.order_items ?? []).length} item
                {(order.order_items ?? []).length === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {(order.order_items ?? [])
                  .map((i) => `${i.product_name} ×${i.quantity}`)
                  .join(", ")}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                  statusTone[order.status] ?? "bg-stage text-muted-foreground"
                }`}
              >
                {order.status}
              </span>
              <p className="mt-2 text-lg font-extrabold text-ink-800">
                {formatMwk(Number(order.total))}
              </p>
              <Link
                to="/orders/$reference"
                params={{ reference: order.reference }}
                className="mt-1 inline-flex text-xs font-semibold text-brand-500 hover:underline"
              >
                View order
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
