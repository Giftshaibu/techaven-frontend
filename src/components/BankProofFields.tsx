import { Check, Upload } from "lucide-react";
import { useState } from "react";

import { UploadProgressBar } from "@/components/UploadProgressBar";
import type { BankProof } from "@/lib/bank-proof";
import { RECEIPT_TYPES, uploadPaymentProof } from "@/lib/manual-payments";

const field =
  "mt-1 min-h-11 w-full rounded-lg border border-border bg-surface p-3 text-sm font-normal";

/** Bank-transfer details and receipt upload. The receipt goes to storage as soon as it is chosen. */
export function BankProofFields({
  value,
  onChange,
  idPrefix = "bank-proof",
}: {
  value: BankProof;
  onChange: (update: (current: BankProof) => BankProof) => void;
  idPrefix?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const set =
    (key: "payerName" | "payerBank" | "amount" | "reference") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      onChange((current) => ({ ...current, [key]: next }));
    };

  async function choose(file: File | undefined) {
    if (!file) return;
    setError("");
    setProgress(0);
    onChange((current) => ({ ...current, uploading: true, receipt: null }));
    try {
      const stored = await uploadPaymentProof(file, setProgress);
      onChange((current) => ({
        ...current,
        uploading: false,
        receipt: { key: stored.key, url: stored.url, name: file.name },
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed. Try again.");
      onChange((current) => ({ ...current, uploading: false }));
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        Bank name
        <input
          name="payer_bank"
          required
          maxLength={120}
          value={value.payerBank}
          onChange={set("payerBank")}
          placeholder="e.g. National Bank"
          className={field}
        />
      </label>
      <label className="text-sm font-semibold">
        Account name
        <input
          name="payer_name"
          autoComplete="name"
          required
          maxLength={160}
          value={value.payerName}
          onChange={set("payerName")}
          placeholder="Name on the paying account"
          className={field}
        />
      </label>
      <label className="text-sm font-semibold">
        Amount paid (MWK)
        <input
          name="declared_amount"
          inputMode="decimal"
          required
          value={value.amount}
          onChange={set("amount")}
          className={`${field} tabular-nums`}
        />
      </label>
      <label className="text-sm font-semibold">
        Transaction reference <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          name="payment_reference"
          maxLength={160}
          value={value.reference}
          onChange={set("reference")}
          className={field}
        />
      </label>
      <div className="min-w-0 text-sm font-semibold sm:col-span-2">
        <span id={`${idPrefix}-label`}>Proof of payment</span>
        <label className="relative mt-1 flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-stage focus-within:ring-2 focus-within:ring-brand-500">
          {value.receipt ? (
            <Check size={19} aria-hidden="true" className="shrink-0 text-emerald-600" />
          ) : (
            <Upload size={19} aria-hidden="true" className="shrink-0 text-brand-500" />
          )}
          <span className="min-w-0 grow">
            <span className="block truncate">
              {value.receipt?.name ?? (value.uploading ? "Uploading receipt…" : "Choose a receipt")}
            </span>
            <span
              id={`${idPrefix}-types`}
              className="block text-xs font-normal text-muted-foreground"
            >
              {value.receipt
                ? "Uploaded · choose another file to replace it"
                : "JPEG, PNG or PDF · Up to 10 MB"}
            </span>
            {value.uploading ? (
              <UploadProgressBar percent={progress} label="Uploading receipt" className="mt-2" />
            ) : null}
          </span>
          <input
            type="file"
            aria-labelledby={`${idPrefix}-label`}
            aria-describedby={`${idPrefix}-types`}
            accept={RECEIPT_TYPES.join(",")}
            disabled={value.uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void choose(file);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
          />
        </label>
        {error ? (
          <p role="alert" className="mt-2 text-sm font-normal text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
