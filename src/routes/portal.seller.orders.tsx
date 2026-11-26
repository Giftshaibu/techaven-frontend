import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  Field,
  FilterChips,
  inputClass,
  LoadingBlock,
  mwk,
  PageHeader,
  relativeTime,
  StatusPill,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sellerApi, type Order } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/seller/orders")({ component: SellerOrders });

type Filter = "send" | "unpaid" | "sent" | "done" | "all";

const isPickup = (order: Order) => order.fulfilment_type === "pickup";
const isPaid = (order: Order) => order.payment_status === "paid" && order.escrow_status === "held";
const wasSent = (order: Order) =>
  Boolean(order.dispatched_at) || order.status === "shipped" || order.status === "delivered";

/** Where an order stands for the seller. There is no acceptance step: paid orders are ready to send. */
const stage = (order: Order): Filter => {
  if (order.status === "cancelled" || order.escrow_status === "released") return "done";
  if (wasSent(order)) return "sent";
  if (isPaid(order)) return "send";
  return "unpaid";
};

function SellerOrders() {
  const queryClient = useQueryClient();
  const orders = useQuery({
    queryKey: ["portal", "seller", "orders"],
    queryFn: sellerApi.orders,
    refetchInterval: 60_000,
  });
  const [filter, setFilter] = useState<Filter>("send");
  const [sending, setSending] = useState<Order | null>(null);
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "seller"] });

  const all = orders.data ?? [];
  const count = (value: Filter) => all.filter((order) => stage(order) === value).length;
  const visible = all.filter((order) => filter === "all" || stage(order) === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Paid orders are ready to go. Mark each one as sent, or as handed over when the buyer collects at your shop. Your payment is released once the buyer confirms delivery and Techaven approves it."
      />
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "send", label: "To send", count: count("send") },
          { value: "unpaid", label: "Awaiting payment", count: count("unpaid") },
          { value: "sent", label: "Sent", count: count("sent") },
          { value: "done", label: "Completed", count: count("done") },
          { value: "all", label: "All", count: all.length },
        ]}
      />

      {orders.isLoading ? (
        <LoadingBlock label="Loading orders" />
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
            <OrderCard
              key={order.id}
              order={order}
              onSend={() => setSending(order)}
              onReject={() => setRejecting(order)}
            />
          ))}
        </div>
      )}

      <DispatchDialog
        order={sending}
        onClose={() => setSending(null)}
        onDone={() => void refresh()}
      />
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

/** Paid → Sent → Buyer confirmed → Paid out. */
function Progress({ order }: { order: Order }) {
  const pickup = isPickup(order);
  const steps = [
    { label: "Paid", done: order.payment_status === "paid" },
    { label: pickup ? "Handed over" : "Sent", done: wasSent(order) },
    {
      label:
        order.delivery_proof_status === "rejected" ? "Proof rejected" : "Buyer confirmed",
      done: order.delivery_proof_status === "pending_review" || order.delivery_proof_status === "approved",
      warn: order.delivery_proof_status === "rejected",
    },
    { label: "Paid out", done: order.escrow_status === "released" },
  ];
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
              step.warn
                ? "bg-amber-50 text-amber-800"
                : step.done
                  ? "bg-success-soft text-emerald-800"
                  : "bg-stage text-muted-foreground",
            )}
          >
            <Icon
              name={step.done ? "check-circle-linear" : step.warn ? "danger-triangle-linear" : "clock-circle-linear"}
              className="h-3.5 w-3.5"
            />
            {step.label}
          </span>
          {index < steps.length - 1 ? <span aria-hidden="true" className="h-px w-3 bg-border" /> : null}
        </li>
      ))}
    </ol>
  );
}

function OrderCard({
  order,
  onSend,
  onReject,
}: {
  order: Order;
  onSend: () => void;
  onReject: () => void;
}) {
  const pickup = isPickup(order);
  const current = stage(order);
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-ink-800">{order.order_number}</h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                pickup ? "bg-violet-50 text-violet-800" : "bg-sky-50 text-sky-800",
              )}
            >
              {pickup ? "Collect at shop" : "Delivery"}
            </span>
            {order.status === "cancelled" ? <StatusPill status="cancelled" /> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.buyer?.name ?? "Buyer"} · placed {relativeTime(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tabular-nums text-ink-800">{mwk(order.total_amount)}</p>
          {order.escrow_amount != null ? (
            <p className="text-[11px] text-muted-foreground">You receive {mwk(order.escrow_amount)}</p>
          ) : null}
        </div>
      </div>
      {order.status !== "cancelled" ? <Progress order={order} /> : null}
      <ul className="mt-3 space-y-1 rounded-xl bg-stage p-3 text-sm">
        {(order.items ?? []).map((item, index) => (
          <li key={item.id ?? index} className="flex justify-between gap-3">
            <span className="truncate">
              {item.quantity ?? 1} × {item.product_name}
            </span>
            <span className="tabular-nums text-muted-foreground">{mwk(item.subtotal ?? item.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="flex items-start gap-1.5">
          <Icon name={pickup ? "shop-linear" : "map-point-linear"} className="mt-0.5 h-4 w-4 shrink-0" />
          {pickup
            ? `Buyer collects at your shop · ${order.shipping_phone ?? ""}`
            : order.shipping_address || "No address"}
        </p>
        {!pickup ? (
          <p className="flex items-start gap-1.5">
            <Icon name="delivery-linear" className="mt-0.5 h-4 w-4 shrink-0" />
            {order.delivery_agent_name
              ? `Rider: ${order.delivery_agent_name}`
              : order.courier_service
                ? `Courier: ${order.courier_service}`
                : "Techaven rider"}
            {order.courier_tracking_number ? ` · Tracking ${order.courier_tracking_number}` : ""}
          </p>
        ) : null}
      </div>
      {current === "sent" && order.delivery_proof_status === "pending_review" ? (
        <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">
          The buyer confirmed delivery. Techaven is reviewing it before releasing your payment.
        </p>
      ) : current === "sent" && !order.delivery_proof_status ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {pickup ? "Handed over" : "Sent"} {relativeTime(order.dispatched_at)}. Waiting for the buyer to confirm.
        </p>
      ) : null}
      {current === "send" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={buttonClass.primary} onClick={onSend}>
            <Icon name={pickup ? "hand-shake-linear" : "delivery-linear"} className="h-4 w-4" />
            {pickup ? "Mark as handed over" : "Mark as sent"}
          </button>
          <button type="button" className={buttonClass.danger} onClick={onReject}>
            Can't fulfil
          </button>
        </div>
      ) : current === "unpaid" && order.status !== "cancelled" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Waiting for the buyer's payment. Don't send anything yet.
        </p>
      ) : null}
    </article>
  );
}

function DispatchDialog({
  order,
  onClose,
  onDone,
}: {
  order: Order | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tracking, setTracking] = useState("");
  useEffect(() => setTracking(order?.courier_tracking_number ?? ""), [order]);
  const pickup = order ? isPickup(order) : false;
  const send = useMutation({
    mutationFn: () => sellerApi.dispatchOrder(order!.id, tracking.trim() || undefined),
    onSuccess: () => {
      toast.success(pickup ? "Marked as handed over" : "Marked as sent. The buyer has been told.");
      onDone();
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    send.mutate();
  };
  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && !send.isPending && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pickup ? "Buyer collected the order?" : "Parcel sent?"} · {order?.order_number}
          </DialogTitle>
          <DialogDescription>
            {pickup
              ? "Confirm you handed the order to the buyer at your shop. They'll be asked to upload a photo to confirm."
              : `Confirm the parcel has left your shop${order?.courier_service ? ` with ${order.courier_service}` : ""}. The buyer will upload a photo when it arrives.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!pickup ? (
            <Field label="Tracking number (optional)" hint="Shared with the buyer so they can follow the parcel.">
              <input
                value={tracking}
                maxLength={120}
                onChange={(event) => setTracking(event.target.value)}
                placeholder="e.g. CTS-123456"
                className={inputClass}
              />
            </Field>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass.secondary} disabled={send.isPending} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={buttonClass.primary} disabled={send.isPending}>
              {send.isPending ? "Saving…" : pickup ? "Yes, handed over" : "Yes, it's sent"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
