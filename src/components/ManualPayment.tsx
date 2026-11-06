import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommerceConfig, getPaymentContext, submitPaymentProof } from "@/lib/manual-payments";
import { formatMwk } from "@/data/catalog";
export function ManualPayment({ orderId }: { orderId: number | string }) {
  const config = useQuery({ queryKey: ["commerce-config"], queryFn: getCommerceConfig });
  const context = useQuery({
    queryKey: ["payment-context", orderId],
    queryFn: () => getPaymentContext(orderId),
    refetchInterval: 30000,
  });
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const key = useRef("");
  const data = context.data,
    instructions = config.data?.manual_payment;
  const latest = data?.submissions[0];
  const whatsappLink = whatsapp || latest?.whatsapp_url || "";
  return (
    <section
      className="mt-6 min-w-0 rounded-xl border border-border bg-surface p-4 md:p-6"
      aria-labelledby="manual-payment-heading"
    >
      <h2 id="manual-payment-heading" className="text-lg font-bold">
        Payment and order details
      </h2>
      {data && (
        <ul className="mt-3 space-y-2 text-sm">
          {data.orders.map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2">
              <Link
                to="/orders/$reference"
                params={{ reference: o.reference }}
                className="underline"
              >
                {o.reference}
              </Link>
              <span>
                {formatMwk(Number(o.total))} · {o.payment_status}
              </span>
            </li>
          ))}
        </ul>
      )}
      {context.isError && (
        <p role="alert" className="mt-3 text-sm">
          Payment details could not load.{" "}
          <button type="button" onClick={() => context.refetch()} className="min-h-11 underline">
            Try again
          </button>
        </p>
      )}
      {latest?.status === "pending_review" && (
        <p role="status" className="mt-4 rounded-lg bg-stage p-3 text-sm">
          Your payment proof has been submitted for review. Techaven will contact you after checking
          it.
        </p>
      )}
      {latest?.status === "approved" && (
        <p role="status" className="mt-4 text-sm">
          Your payment has been approved.
        </p>
      )}
      {latest?.status === "rejected" && (
        <p role="status" className="mt-4 text-sm">
          Payment proof needs attention: {latest.rejection_reason}. You can submit a corrected
          receipt below.
        </p>
      )}
      {whatsappLink && (
        <a
          className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-brand-500 px-4 font-semibold text-brand-500"
          href={whatsappLink}
        >
          Open WhatsApp
        </a>
      )}
      {instructions?.enabled &&
        data &&
        data.payable_order_ids.length > 0 &&
        latest?.status !== "pending_review" && (
          <>
            <dl className="mt-4 grid gap-2 rounded-lg bg-stage p-4 text-sm">
              <div>
                <dt className="font-semibold">Pay to</dt>
                <dd>
                  {instructions.provider} · {instructions.account_name}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Account number</dt>
                <dd className="break-all">{instructions.account_number}</dd>
              </div>
              <div>
                <dt className="font-semibold">Total due</dt>
                <dd>{formatMwk(Number(data.amount))}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              After transferring, upload your receipt. We will save it privately and open a WhatsApp
              message for you to send.
            </p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const form = e.currentTarget,
                  body = new FormData(form);
                const file = body.get("receipt");
                if (
                  !(file instanceof File) ||
                  !file.size ||
                  file.size > 10 * 1024 * 1024 ||
                  !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
                ) {
                  setError("Choose a JPEG, PNG or PDF receipt, no larger than 10MB.");
                  return;
                }
                key.current ||= crypto.randomUUID();
                body.set("submission_key", key.current);
                body.set("order_ids", JSON.stringify(data.payable_order_ids));
                setBusy(true);
                setError("");
                try {
                  const result = await submitPaymentProof(body);
                  setWhatsapp(result.whatsapp_url || "");
                  await client.invalidateQueries({ queryKey: ["payment-context", orderId] });
                  client.invalidateQueries({ queryKey: ["orders"] });
                  form.reset();
                  key.current = "";
                  if (result.whatsapp_url) window.location.assign(result.whatsapp_url);
                } catch (error) {
                  setError(
                    error instanceof Error ? error.message : "Could not submit proof. Try again.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="text-sm font-semibold">
                Payer name
                <input
                  name="payer_name"
                  autoComplete="name"
                  required
                  maxLength={160}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
                />
              </label>
              <label className="text-sm font-semibold">
                Transaction reference
                <input
                  name="payment_reference"
                  required
                  maxLength={160}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
                />
              </label>
              <label className="text-sm font-semibold">
                Payment date
                <input
                  name="payment_date"
                  type="date"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
                />
              </label>
              <label className="min-w-0 text-sm font-semibold">
                Receipt (JPEG, PNG or PDF, up to 10MB)
                <input
                  name="receipt"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  required
                  className="mt-2 block w-full min-w-0 text-sm"
                />
              </label>
              {error && (
                <p role="alert" className="sm:col-span-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                disabled={busy}
                className="min-h-11 rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit proof and open WhatsApp"}
              </button>
            </form>
          </>
        )}
      {instructions && !instructions.enabled && (
        <p className="mt-4 text-sm text-muted-foreground">
          Manual bank transfers are not available yet. Your existing order remains saved.
        </p>
      )}
    </section>
  );
}
