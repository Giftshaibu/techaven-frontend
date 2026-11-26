import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Upload } from "lucide-react";
import { useState } from "react";

import { Icon } from "@/components/Icon";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import { submitDeliveryProof } from "@/integrations/techaven/customer";
import type { ApiOrder } from "@/integrations/techaven/types";
import { DELIVERY_PROOF_TYPES, uploadDeliveryProof } from "@/lib/manual-payments";
import { cn } from "@/lib/utils";

type Step = { label: string; done: boolean; current?: boolean };

/**
 * Buyer's view of fulfilment: what happens next, and the proof-of-delivery upload once the shop
 * has sent (or handed over) the order. Payment reaches the shop only after Techaven approves it.
 */
export function DeliveryConfirmation({ order }: { order: ApiOrder }) {
  const queryClient = useQueryClient();
  const pickup = order.fulfilment_type === "pickup";
  const paid = order.payment_status === "paid";
  const sent = Boolean(order.dispatched_at) || order.status === "shipped" || order.status === "delivered";
  const proof = order.delivery_proof_status ?? null;
  const confirmed = proof === "approved" || order.escrow_status === "released";
  const canUpload = paid && sent && !confirmed && proof !== "pending_review" && order.escrow_status === "held";

  const [file, setFile] = useState<{ key: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const submit = useMutation({
    mutationFn: () => submitDeliveryProof(String(order.id).replace("ord_", ""), file!.key),
    onSuccess: async () => {
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Could not submit. Try again."),
  });

  async function choose(selected: File | undefined) {
    if (!selected) return;
    setError("");
    setProgress(0);
    setUploading(true);
    setFile(null);
    try {
      const stored = await uploadDeliveryProof(selected, setProgress);
      setFile({ key: stored.key, name: selected.name });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  if (!paid || order.status === "cancelled") return null;

  const steps: Step[] = [
    { label: "Paid", done: true },
    { label: pickup ? "Collected at shop" : "On its way", done: sent, current: !sent },
    { label: "You confirm", done: proof === "pending_review" || confirmed, current: sent && !proof },
    { label: "Complete", done: confirmed, current: proof === "pending_review" },
  ];

  return (
    <section id="delivery" aria-labelledby="delivery-heading" className="mt-8 rounded-3xl bg-surface p-6 md:p-8">
      <h2 id="delivery-heading" className="flex items-center gap-2 text-lg font-bold text-ink-800">
        <Icon name={pickup ? "shop-linear" : "delivery-linear"} className="h-5 w-5 text-brand-500" />
        {pickup ? "Collection" : "Delivery"}
      </h2>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <li
            key={step.label}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
              step.done ? "bg-success-soft text-emerald-800" : step.current ? "bg-brand-100 text-brand-800" : "bg-stage text-muted-foreground",
            )}
          >
            <Icon name={step.done ? "check-circle-linear" : "clock-circle-linear"} className="h-4 w-4 shrink-0" />
            {step.label}
          </li>
        ))}
      </ol>

      <div className="mt-5 text-sm text-ink-800">
        {!sent ? (
          <p>
            {pickup
              ? "The shop is preparing your order for collection. We'll let you know when it's handed over."
              : `The shop is preparing your parcel${order.courier_service ? ` for ${order.courier_service}` : ""}. We'll let you know when it's sent.`}
          </p>
        ) : confirmed ? (
          <p className="flex items-center gap-2 font-semibold text-emerald-800">
            <Check size={18} aria-hidden="true" /> Delivery confirmed. Thanks for shopping with Techaven.
          </p>
        ) : proof === "pending_review" ? (
          <p>Thanks! We're checking your proof of delivery. The shop is paid once it's approved.</p>
        ) : (
          <>
            <p>
              {pickup
                ? "You collected this order. Upload a photo of what you received to confirm everything is right."
                : `Your parcel is on its way${order.courier_service ? ` with ${order.courier_service}` : ""}${order.courier_tracking_number ? ` (tracking ${order.courier_tracking_number})` : ""}. When it arrives, upload a photo of it to confirm delivery.`}
            </p>
            {proof === "rejected" && order.delivery_proof_rejection_reason ? (
              <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                Your last upload wasn't accepted: {order.delivery_proof_rejection_reason}. Please upload a clearer photo.
              </p>
            ) : null}
          </>
        )}
      </div>

      {canUpload ? (
        <div className="mt-5 space-y-3">
          <label className="relative flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-stage focus-within:ring-2 focus-within:ring-brand-500">
            {file ? (
              <Check size={20} aria-hidden="true" className="shrink-0 text-emerald-600" />
            ) : (
              <Upload size={20} aria-hidden="true" className="shrink-0 text-brand-500" />
            )}
            <span className="min-w-0 grow">
              <span className="block truncate">
                {file?.name ?? (uploading ? "Uploading…" : "Upload a photo of the parcel or what you received")}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {file ? "Uploaded · choose another file to replace it" : "JPEG, PNG, WebP or PDF · Up to 10 MB"}
              </span>
              {uploading ? <UploadProgressBar percent={progress} label="Uploading proof" className="mt-2" /> : null}
            </span>
            <input
              type="file"
              accept={DELIVERY_PROOF_TYPES.join(",")}
              capture="environment"
              aria-label="Upload proof of delivery"
              disabled={uploading || submit.isPending}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                event.target.value = "";
                void choose(selected);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!file || uploading || submit.isPending}
            onClick={() => submit.mutate()}
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submit.isPending ? "Submitting…" : "Confirm I received it"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
