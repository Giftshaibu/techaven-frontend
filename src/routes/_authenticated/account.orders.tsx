import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { formatMwk } from "@/data/catalog";
import { getOrders } from "@/integrations/techaven/customer";
import type { ApiOrder } from "@/integrations/techaven/types";
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
  processing: "bg-info-soft text-ink-800",
  shipped: "bg-success-soft text-ink-800",
  delivered: "bg-success-soft text-ink-800",
  confirmed: "bg-success-soft text-ink-800",
  cancelled: "bg-stage text-muted-foreground",
};

function normalizeOrders(data: Awaited<ReturnType<typeof getOrders>>): ApiOrder[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "orders" in data && Array.isArray(data.orders)) {
    return data.orders;
  }
  return [];
}

function orderReference(order: ApiOrder): string {
  return String(order.order_number ?? order.reference ?? order.id);
}

function OrdersPage() {
  const { user } = useAuth();

  const orders = useQuery({
    queryKey: ["orders", "list", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => normalizeOrders(await getOrders({ page: 1, limit: 50 })),
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
      {orders.data.map((order) => {
        const ref = orderReference(order);
        const itemCount = order.items?.length ?? 0;
        return (
          <li key={ref} className="rounded-3xl bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink-800">{ref}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}{" "}
                  · {itemCount} item{itemCount === 1 ? "" : "s"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Payment: {order.payment_status ?? "pending"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-ink-800">
                  {order.total != null ? formatMwk(Number(order.total)) : "—"}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusTone[order.status] ?? "bg-stage text-ink-800"}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
            <Link
              to="/orders/$reference"
              params={{ reference: ref }}
              className="mt-4 inline-flex text-sm font-semibold text-brand-500 hover:underline"
            >
              View order
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
