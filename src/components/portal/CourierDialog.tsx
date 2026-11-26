import { useEffect, useState, type FormEvent } from "react";

import { Icon } from "@/components/Icon";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { uploadStaffImage, type Courier, type CourierInput } from "@/integrations/techaven/staff";

import { buttonClass, errorMessage, Field, inputClass } from "./kit";

const blank: CourierInput = {
  name: "",
  description: null,
  logo_url: null,
  is_active: true,
  sort_order: 0,
};

/**
 * Add or edit a courier. The icon is uploaded to Cloudflare R2 as soon as it is chosen,
 * and the returned URL is sent as logo_url when the form is saved.
 */
export function CourierDialog({
  open,
  onOpenChange,
  courier,
  nextSortOrder,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null adds a new courier. */
  courier: Courier | null;
  nextSortOrder: number;
  onSave: (values: CourierInput) => Promise<unknown>;
}) {
  const [form, setForm] = useState<CourierInput>(blank);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(courier ? { ...courier } : { ...blank, sort_order: nextSortOrder });
    setError("");
    setProgress(0);
  }, [open, courier, nextSortOrder]);

  async function chooseIcon(file: File | undefined) {
    if (!file) return;
    setError("");
    setProgress(0);
    setUploading(true);
    try {
      const url = await uploadStaffImage(file, setProgress);
      setForm((current) => ({ ...current, logo_url: url }));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter the courier's name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      });
      onOpenChange(false);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  const busy = uploading || saving;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{courier ? `Edit ${courier.name}` : "Add courier"}</DialogTitle>
          <DialogDescription>Shoppers choose from active couriers at checkout.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-stage text-brand-500">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Courier icon"
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <Icon name="delivery-linear" className="h-7 w-7" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <label
                  className={`${buttonClass.secondary} cursor-pointer focus-within:ring-2 focus-within:ring-brand-500 ${busy ? "pointer-events-none opacity-60" : ""}`}
                >
                  <Icon name="camera-add-linear" className="h-4 w-4" />
                  {form.logo_url ? "Change icon" : "Upload icon"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void chooseIcon(file);
                    }}
                  />
                </label>
                {form.logo_url && !uploading ? (
                  <button
                    type="button"
                    className={buttonClass.ghost}
                    disabled={busy}
                    onClick={() => setForm((current) => ({ ...current, logo_url: null }))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {uploading ? (
                <UploadProgressBar percent={progress} label="Uploading icon" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Optional · JPEG, PNG, WebP or GIF, up to 5 MB
                </p>
              )}
            </div>
          </div>

          <Field label="Name">
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. CTS Courier"
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label="Description" hint="Shown under the name at checkout.">
            <input
              maxLength={200}
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="e.g. Next-day delivery to major towns"
              className={inputClass}
            />
          </Field>
          <Field label="Display order" hint="Lower numbers appear first.">
            <input
              type="number"
              min={0}
              step={1}
              value={form.sort_order}
              onChange={(event) =>
                setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))
              }
              className={`${inputClass} w-28`}
            />
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-ink-800">Offer at checkout</span>
              <span className="block text-xs text-muted-foreground">
                Turn off to hide it without deleting it.
              </span>
            </span>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, is_active: checked }))
              }
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonClass.secondary}
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonClass.primary}>
              {saving
                ? "Saving…"
                : uploading
                  ? "Uploading…"
                  : courier
                    ? "Save changes"
                    : "Add courier"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
