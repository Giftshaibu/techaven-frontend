import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  FilterChips,
  LoadingBlock,
  mwk,
  PageHeader,
  relativeTime,
  StatusPill,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import { sellerApi, type Order } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/seller/orders")({ component: SellerOrders });

type Filter = "new" | "progress" | "done" | "all";
const stage = (order: Order): Filter =>
  order.status === "cancelled" || order.status === "delivered"
    ? "done"
    : order.seller_accepted_at
      ? "progress"
      : "new";

function SellerOrders() {
  const queryClient = useQueryClient();
  const orders = useQuery({
    queryKey: ["portal", "seller", "orders"],
    queryFn: sellerApi.orders,
    refetchInterval: 60_000,
  });
  const [filter, setFilter] = useState<Filter>("new");
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "seller"] });
  const accept = useMutation({
    mutationFn: (id: number) => sellerApi.acceptOrder(id),
    onSuccess: () => {
      toast.success("Order accepted — pack it for pickup");
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const all = orders.data ?? [];
  const visible = all.filter((order) => filter === "all" || stage(order) === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Accept new orders quickly. Once accepted, a Techaven rider or the buyer's courier collects the parcel."
      />
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          {
            value: "new",
            label: "To accept",
            count: all.filter((order) => stage(order) === "new").length,
          },
          {
            value: "progress",
            label: "In progress",
            count: all.filter((order) => stage(order) === "progress").length,
          },
          {
            value: "done",
            label: "Completed",
            count: all.filter((order) => stage(order) === "done").length,
          },
          { value: "all", label: "All", count: all.length },
        ]}
      />

      {orders.isLoading ? (
        <LoadingBlock />
      ) : orders.error ? (
        <ErrorBlock error={orders.error} onRetry={() => orders.refetch()} />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface">
          <EmptyState icon="bag-check-linear" title="Nothing here right now">
            We refresh this list every minute.
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-border bg-surface p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink-800">{order.order_number}</h3>
                    <StatusPill status={order.status} />
                    <StatusPill status={order.payment_status} />
                    {order.escrow_status ? (
                      <StatusPill status={order.escrow_status}>
                        escrow {order.escrow_status}
                      </StatusPill>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.buyer?.name ?? "Buyer"} · placed {relativeTime(order.created_at)}
                  </p>
                </div>
                <p className="text-lg font-extrabold tabular-nums text-ink-800">
                  {mwk(order.total_amount)}
                </p>
              </div>
              <ul className="mt-3 space-y-1 rounded-xl bg-stage p-3 text-sm">
                {(order.items ?? []).map((item, index) => (
                  <li key={item.id ?? index} className="flex justify-between gap-3">
                    <span className="truncate">
                      {item.quantity ?? 1} × {item.product_name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {mwk(item.subtotal ?? item.price)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p className="flex items-start gap-1.5">
                  <Icon name="map-point-linear" className="mt-0.5 h-4 w-4 shrink-0" />
                  {order.shipping_address || "No address"}
                </p>
                <p className="flex items-start gap-1.5">
                  <Icon name="delivery-linear" className="mt-0.5 h-4 w-4 shrink-0" />
                  {order.delivery_agent_name
                    ? `Rider: ${order.delivery_agent_name}`
                    : order.delivery_method
                      ? order.delivery_method.replace(/_/g, " ")
                      : "Delivery method not set"}
                </p>
              </div>
              {stage(order) === "new" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClass.primary}
                    disabled={accept.isPending}
                    onClick={() => accept.mutate(order.id)}
                  >
                    <Icon name="check-circle-linear" className="h-4 w-4" />
                    Accept & prepare
                  </button>
                  <button
                    type="button"
                    className={buttonClass.danger}
                    onClick={() => setRejecting(order)}
                  >
                    Can't fulfil
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
      <ReasonDialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject ${rejecting?.order_number ?? "order"}?`}
        description="The buyer is notified that you couldn't fulfil this order."
        reasonLabel="Reason for the buyer"
        requireReason
        confirmLabel="Reject order"
        onConfirm={async (reason) => {
          if (!rejecting) return;
          try {
            await sellerApi.rejectOrder(rejecting.id, reason);
            toast.success("Order rejected");
            void refresh();
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
    </div>
  );
}
