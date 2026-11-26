import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Panel,
  relativeTime,
  shortDate,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, type DeliveryReview } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/admin/deliveries")({ component: AdminDeliveries });

type Status = "pending_review" | "approved" | "rejected";
const PAGE_SIZE = 30;

function AdminDeliveries() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("pending_review");
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<DeliveryReview | null>(null);
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);

  const deliveries = useQuery({
    queryKey: ["portal", "admin", "deliveries", status, page],
    queryFn: () => adminApi.deliveryProofs(status, page),
    refetchInterval: 60_000,
  });
  const list = deliveries.data?.orders ?? [];
  const pages = Math.max(1, Math.ceil((deliveries.data?.total ?? 0) / PAGE_SIZE));
  useEffect(() => {
    if (deliveries.data && page > pages) setPage(pages);
  }, [deliveries.data, page, pages]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["portal", "admin", "deliveries"] }),
      queryClient.invalidateQueries({ queryKey: ["portal", "admin", "orders"] }),
      queryClient.invalidateQueries({ queryKey: ["portal", "admin", "dashboard"] }),
    ]);
  const decide = useMutation({
    mutationFn: async ({ order, decision, reason }: { order: DeliveryReview; decision: "approve" | "reject"; reason: string }) =>
      decision === "approve" ? adminApi.approveDelivery(order.id) : adminApi.rejectDelivery(order.id, reason),
    onSuccess: async (_, { order, decision }) => {
      toast.success(
        decision === "approve"
          ? `Released ${mwk(order.escrow_amount)} to ${order.shop_name ?? "the seller"}`
          : "Proof rejected. The buyer has been asked to upload again.",
      );
      setReviewing(null);
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Escrow"
        title="Deliveries"
        description="Buyers upload proof once their parcel arrives or they collect it. Approving releases the order's escrow to the seller's wallet."
      />
      <FilterChips
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        options={[
          {
            value: "pending_review",
            label: "To review",
            ...(status === "pending_review" && deliveries.data ? { count: deliveries.data.total } : {}),
          },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      <Panel bodyClassName="p-0">
        {deliveries.isLoading ? (
          <div className="p-5">
            <LoadingBlock label="Loading deliveries" />
          </div>
        ) : deliveries.error ? (
          <div className="p-5">
            <ErrorBlock error={deliveries.error} onRetry={() => void deliveries.refetch()} />
          </div>
        ) : !list.length ? (
          <EmptyState icon="box-linear" title="Nothing here">
            {status === "pending_review"
              ? "Proofs of delivery uploaded by buyers queue here for review."
              : "No deliveries in this list yet."}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-4 px-4 py-4 md:px-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-stage text-brand-500">
                  <Icon name={order.fulfilment_type === "pickup" ? "shop-linear" : "delivery-linear"} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm font-bold text-ink-800">
                    {order.order_number}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {order.shop_name ?? "Seller"} → {order.user?.name ?? "Buyer"}
                    </span>
                  </p>
                  <p className="break-words text-xs text-muted-foreground">
                    {order.fulfilment_type === "pickup" ? "Collected at shop" : order.courier_service ?? "Techaven rider"}
                    {order.courier_tracking_number ? ` · ${order.courier_tracking_number}` : ""} · proof{" "}
                    {relativeTime(order.delivery_proof_submitted_at)}
                  </p>
                  {order.delivery_proof_rejection_reason && status === "rejected" ? (
                    <p className="mt-1 text-xs text-muted-foreground">Reason: {order.delivery_proof_rejection_reason}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold tabular-nums text-ink-800">{mwk(order.escrow_amount)}</p>
                  <p className="text-[11px] text-muted-foreground">to seller</p>
                </div>
                <button
                  type="button"
                  className={status === "pending_review" ? buttonClass.primary : buttonClass.secondary}
                  onClick={() => setReviewing(order)}
                >
                  {status === "pending_review" ? "Review" : "View"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {pages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" className={buttonClass.secondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          Page {page} of {pages}
          <button type="button" className={buttonClass.secondary} disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      ) : null}

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          {reviewing ? (
            <>
              <DialogHeader>
                <DialogTitle>Delivery of {reviewing.order_number}</DialogTitle>
                <DialogDescription>
                  Check the proof shows the buyer received the right items before releasing payment.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 rounded-xl bg-stage p-4 text-sm sm:grid-cols-2">
                {[
                  ["Seller", reviewing.shop_name ?? "—"],
                  ["Buyer", `${reviewing.user?.name ?? "—"}${reviewing.user?.phone_number ? ` · ${reviewing.user.phone_number}` : ""}`],
                  ["Fulfilment", reviewing.fulfilment_type === "pickup" ? "Collected at shop" : reviewing.courier_service ?? "Techaven rider"],
                  ["Tracking", reviewing.courier_tracking_number || "—"],
                  ["Sent", reviewing.dispatched_at ? shortDate(reviewing.dispatched_at) : "—"],
                  ["Proof uploaded", shortDate(reviewing.delivery_proof_submitted_at)],
                  ["Order total", mwk(reviewing.total_amount)],
                  ["Released to seller on approval", mwk(reviewing.escrow_amount)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="break-words font-semibold text-ink-800">{value}</dd>
                  </div>
                ))}
              </dl>
              {reviewing.items?.length ? (
                <ul className="space-y-1 rounded-xl border border-border p-3 text-sm">
                  {reviewing.items.map((item, index) => (
                    <li key={item.id ?? index} className="flex justify-between gap-3">
                      <span className="truncate">{item.quantity ?? 1} × {item.product_name}</span>
                      <span className="tabular-nums text-muted-foreground">{mwk(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {reviewing.has_proof_file ? (
                <ProofFile key={reviewing.id} id={reviewing.id} />
              ) : reviewing.delivery_confirmation_proof_url ? (
                <a href={String(reviewing.delivery_confirmation_proof_url)} target="_blank" rel="noreferrer" className={buttonClass.secondary}>
                  Open proof link
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No proof file was attached.</p>
              )}
              {status === "pending_review" ? (
                <div className="flex justify-end gap-2">
                  <button type="button" className={buttonClass.danger} onClick={() => setConfirming("reject")}>
                    Reject
                  </button>
                  <button type="button" className={buttonClass.primary} onClick={() => setConfirming("approve")}>
                    Approve & release {mwk(reviewing.escrow_amount)}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <ReasonDialog
        open={confirming === "approve"}
        onOpenChange={(open) => !open && setConfirming(null)}
        tone="primary"
        title={`Release ${mwk(reviewing?.escrow_amount)} to ${reviewing?.shop_name ?? "the seller"}?`}
        description="The money moves from escrow to the seller's wallet and the order is complete. This cannot be undone here."
        confirmLabel="Approve & release"
        onConfirm={() => (reviewing ? decide.mutateAsync({ order: reviewing, decision: "approve", reason: "" }) : undefined)}
      />
      <ReasonDialog
        open={confirming === "reject"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Reject this proof?"
        description="The buyer sees your reason and can upload a new photo. Escrow stays held."
        reasonLabel="Reason for the buyer"
        requireReason
        confirmLabel="Reject proof"
        onConfirm={(reason) => (reviewing ? decide.mutateAsync({ order: reviewing, decision: "reject", reason }) : undefined)}
      />
    </div>
  );
}

function ProofFile({ id }: { id: number }) {
  const proof = useQuery({
    queryKey: ["portal", "admin", "delivery-proof", id],
    queryFn: () => adminApi.deliveryProofFile(id),
    staleTime: Infinity,
    gcTime: 0,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!proof.data) return;
    const next = URL.createObjectURL(proof.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [proof.data]);
  if (proof.error) return <ErrorBlock error={proof.error} onRetry={() => void proof.refetch()} />;
  if (!proof.data || !url) return <LoadingBlock rows={3} label="Opening proof of delivery" />;
  return proof.data.type === "application/pdf" ? (
    <iframe src={url} title="Proof of delivery" className="h-[50dvh] w-full rounded-xl border border-border" />
  ) : (
    <img src={url} alt="Proof of delivery" className="max-h-[50dvh] w-full rounded-xl border border-border object-contain" />
  );
}
