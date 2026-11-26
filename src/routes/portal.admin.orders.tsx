import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  EmptyState,
  ErrorBlock,
  errorMessage,
  FilterChips,
  inputClass,
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  shortDate,
  StatusPill,
} from "@/components/portal/kit";
import { adminApi } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/orders")({ component: AdminOrders });

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type Filter = "all" | (typeof STATUSES)[number];

function AdminOrders() {
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ["portal", "admin", "orders"], queryFn: adminApi.orders });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: ["portal", "admin", "orders"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const all = orders.data ?? [];
  const visible = useMemo(
    () =>
      all.filter(
        (order) =>
          (filter === "all" || order.status === filter) &&
          (!search.trim() ||
            `${order.order_number} ${order.user?.name ?? ""}`
              .toLowerCase()
              .includes(search.trim().toLowerCase())),
      ),
    [all, filter, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Every order across all shops. Step in when a delivery needs a nudge."
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: all.length },
            ...STATUSES.map((status) => ({
              value: status,
              label: status[0]!.toUpperCase() + status.slice(1),
              count: all.filter((order) => order.status === status).length,
            })),
          ]}
        />
        <div className="relative md:w-72">
          <Icon
            name="magnifier-linear"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number or buyer"
            className={cn(inputClass, "pl-9")}
          />
        </div>
      </div>
      <Panel bodyClassName="p-0">
        {orders.isLoading ? (
          <div className="p-5">
            <LoadingBlock label="Loading orders" />
          </div>
        ) : orders.error ? (
          <div className="p-5">
            <ErrorBlock error={orders.error} onRetry={() => orders.refetch()} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon="bag-4-linear" title="No orders to show">
            Orders appear here as soon as shoppers check out.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-stage text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-3 py-3">Buyer</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((order) => (
                  <tr key={order.id} className="hover:bg-stage/50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-ink-800">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortDate(order.createdAt ?? order.created_at)}
                      </p>
                    </td>
                    <td className="px-3 py-3">{order.user?.name ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-muted-foreground">
                      {order.items
                        ?.map((item) => item.product_name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {mwk(order.total_amount)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={order.payment_status} />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={order.status}
                        disabled={update.isPending}
                        aria-label={`Status of ${order.order_number}`}
                        onChange={(event) =>
                          update.mutate({ id: order.id, status: event.target.value })
                        }
                        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold capitalize"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
