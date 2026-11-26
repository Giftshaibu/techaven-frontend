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
  shortDate,
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
import {
  adminApi,
  type PaymentProof,
  type PaymentProofStatus,
} from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/admin/payments")({ component: AdminPayments });

const PAGE_SIZE = 30;

function AdminPayments() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentProofStatus>("pending_review");
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<PaymentProof | null>(null);
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);

  const proofs = useQuery({
    queryKey: ["portal", "admin", "payment-proofs", status, page],
    queryFn: () => adminApi.paymentProofs(status, page),
  });
  const list = proofs.data?.submissions ?? [];
  const pages = Math.max(1, Math.ceil((proofs.data?.total ?? 0) / PAGE_SIZE));

  // Reviewing the last row of a later page leaves that page empty.
  useEffect(() => {
    if (proofs.data && page > pages) setPage(pages);
  }, [proofs.data, page, pages]);

  const review = useMutation({
    mutationFn: ({
      proof,
      decision,
      reason,
    }: {
      proof: PaymentProof;
      decision: "approve" | "reject";
      reason: string;
    }) => adminApi.reviewPaymentProof(proof.id, decision, reason),
    onSuccess: (_data, { decision }) => {
      toast.success(
        decision === "approve"
          ? "Payment approved and order marked paid"
          : "Proof rejected. The customer has been notified",
      );
      setReviewing(null);
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal", "admin", "payment-proofs"] });
      void queryClient.invalidateQueries({ queryKey: ["portal", "admin", "orders"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Bank payments"
        description="Check each proof of payment against the bank statement before approving it."
      />
      <FilterChips
        value={status}
        onChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        options={[
          { value: "pending_review", label: "Awaiting review" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      <Panel bodyClassName="p-0">
        {proofs.isLoading ? (
          <div className="p-5">
            <LoadingBlock label="Loading payment proofs" />
          </div>
        ) : proofs.error ? (
          <div className="p-5">
            <ErrorBlock error={proofs.error} onRetry={() => void proofs.refetch()} />
          </div>
        ) : !list.length ? (
          <EmptyState icon="bill-check-linear" title="Nothing here">
            Proofs of payment uploaded by customers queue here for review.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((proof) => (
              <li key={proof.id} className="flex flex-wrap items-center gap-4 px-4 py-4 md:px-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-stage text-brand-500">
                  <Icon name="bill-check-linear" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-sm font-bold text-ink-800">
                    {mwk(proof.amount)}{" "}
                    <span className="font-normal text-muted-foreground">
                      from {proof.payer_name}
                      {proof.payer_bank ? ` · ${proof.payer_bank}` : ""}
                    </span>
                  </p>
                  <p className="break-words text-xs text-muted-foreground">
                    {proof.order_references.join(", ")}
                    {proof.payment_reference ? ` · Ref ${proof.payment_reference}` : ""} · Submitted{" "}
                    {shortDate(proof.created_at)}
                  </p>
                  {proof.rejection_reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {proof.rejection_reason}
                    </p>
                  ) : null}
                </div>
                <StatusPill status={proof.status} />
                <button
                  type="button"
                  className={
                    proof.status === "pending_review" ? buttonClass.primary : buttonClass.secondary
                  }
                  onClick={() => setReviewing(proof)}
                >
                  {proof.status === "pending_review" ? "Review" : "View"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {pages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            className={buttonClass.secondary}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          Page {page} of {pages}
          <button
            type="button"
            className={buttonClass.secondary}
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          {reviewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{mwk(reviewing.amount)} bank payment</DialogTitle>
                <DialogDescription>
                  Confirm the money reached the account before approving.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 rounded-xl bg-stage p-4 text-sm sm:grid-cols-2">
                {[
                  ["Orders", reviewing.order_references.join(", ")],
                  ["Order total", mwk(reviewing.amount)],
                  [
                    "Amount the customer says they paid",
                    reviewing.declared_amount ? mwk(reviewing.declared_amount) : "Not provided",
                  ],
                  ["Bank", reviewing.payer_bank || "Not provided"],
                  ["Account name", reviewing.payer_name],
                  ["Transaction reference", reviewing.payment_reference || "Not provided"],
                  ["Payment date", shortDate(reviewing.payment_date)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="break-words font-semibold text-ink-800">{value}</dd>
                  </div>
                ))}
              </dl>
              {reviewing.declared_amount &&
              Number(reviewing.declared_amount) !== Number(reviewing.amount) ? (
                <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  The amount entered ({mwk(reviewing.declared_amount)}) differs from the order total
                  ({mwk(reviewing.amount)}). Check the receipt before approving.
                </p>
              ) : null}
              <Receipt key={reviewing.id} id={reviewing.id} />
              {reviewing.status === "pending_review" ? (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className={buttonClass.danger}
                    onClick={() => setConfirming("reject")}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className={buttonClass.primary}
                    onClick={() => setConfirming("approve")}
                  >
                    Approve payment
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
        title={`Approve ${mwk(reviewing?.amount)}?`}
        description="The order is marked paid and the funds are held in escrow. This cannot be undone here."
        confirmLabel="Approve payment"
        onConfirm={() =>
          reviewing
            ? review.mutateAsync({ proof: reviewing, decision: "approve", reason: "" })
            : undefined
        }
      />
      <ReasonDialog
        open={confirming === "reject"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Reject this proof?"
        description="The customer sees your reason and can upload a corrected receipt."
        reasonLabel="Reason"
        requireReason
        confirmLabel="Reject proof"
        onConfirm={(reason) =>
          reviewing
            ? review.mutateAsync({ proof: reviewing, decision: "reject", reason })
            : undefined
        }
      />
    </div>
  );
}

const EXTENSION: Record<string, string> = { "application/pdf": "pdf", "image/png": "png" };

function Receipt({ id }: { id: string }) {
  const receipt = useQuery({
    queryKey: ["portal", "admin", "payment-receipt", id],
    queryFn: () => adminApi.paymentReceipt(id),
    staleTime: Infinity,
    gcTime: 0,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!receipt.data) return;
    const next = URL.createObjectURL(receipt.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [receipt.data]);

  if (receipt.error)
    return <ErrorBlock error={receipt.error} onRetry={() => void receipt.refetch()} />;
  if (!receipt.data || !url) return <LoadingBlock rows={3} label="Opening receipt" />;
  return (
    <div className="space-y-2">
      {receipt.data.type === "application/pdf" ? (
        <iframe
          src={url}
          title="Proof of payment"
          className="h-[50dvh] w-full rounded-xl border border-border"
        />
      ) : (
        <img
          src={url}
          alt="Proof of payment"
          className="max-h-[50dvh] w-full rounded-xl border border-border object-contain"
        />
      )}
      <a
        href={url}
        download={`receipt-${id}.${EXTENSION[receipt.data.type] ?? "jpg"}`}
        className={buttonClass.ghost}
      >
        Download receipt
      </a>
    </div>
  );
}
