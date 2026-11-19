import { useState, type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { buttonClass, inputClass } from "./kit";

/** Confirmation dialog that optionally collects a short reason or note. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = "danger",
  reasonLabel,
  requireReason = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  reasonLabel?: string;
  requireReason?: boolean;
  onConfirm: (reason: string) => Promise<unknown> | void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onOpenChange(false);
    } catch {
      // The caller reports the error; keep the dialog open so the user can retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {reasonLabel ? (
            <label className="block">
              <span className="text-xs font-semibold text-ink-800">{reasonLabel}</span>
              <textarea
                rows={3}
                value={reason}
                required={requireReason}
                onChange={(event) => setReason(event.target.value)}
                className={cn(inputClass, "mt-1.5 resize-none")}
              />
            </label>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonClass.secondary}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={
                tone === "danger"
                  ? cn(buttonClass.primary, "bg-rose-600 hover:bg-rose-700")
                  : buttonClass.primary
              }
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
