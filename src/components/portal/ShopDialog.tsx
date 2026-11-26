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
import { uploadStaffImage, type Shop, type ShopInput } from "@/integrations/techaven/staff";

import { buttonClass, errorMessage, Field, inputClass } from "./kit";

type Form = Required<Omit<ShopInput, "status" | "is_verified">> & { active: boolean; verified: boolean };
const blank: Form = {
  shop_name: "",
  location: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  logo_url: "",
  active: true,
  verified: false,
};
const fromShop = (shop: Shop): Form => ({
  shop_name: shop.name,
  location: shop.location ?? "",
  address: shop.address ?? "",
  phone: shop.phone ?? "",
  email: shop.email ?? "",
  description: shop.description ?? "",
  logo_url: shop.logo ?? "",
  active: shop.status === "active",
  verified: Boolean(shop.is_verified),
});

/**
 * Add or edit a shop. The logo uploads to Cloudflare R2 as soon as it is chosen and its URL is
 * saved with the shop. Delete lives here too, for shops created by mistake.
 */
export function ShopDialog({
  open,
  onOpenChange,
  shop,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null adds a new shop. */
  shop: Shop | null;
  onSave: (values: ShopInput) => Promise<unknown>;
  onDelete?: (shop: Shop) => void;
}) {
  const [form, setForm] = useState<Form>(blank);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(shop ? fromShop(shop) : blank);
    setError("");
  }, [open, shop]);

  const set = (key: keyof Form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function chooseLogo(file: File | undefined) {
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
    if (!form.shop_name.trim()) return setError("Enter the shop's name.");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError("Enter a valid email address.");
    }
    setSaving(true);
    setError("");
    try {
      const { active, verified, ...fields } = form;
      await onSave({
        ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()])),
        shop_name: form.shop_name.trim(),
        ...(shop ? { status: active ? "active" : "inactive" } : {}),
        is_verified: verified,
      } as ShopInput);
      onOpenChange(false);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  const busy = uploading || saving;
  const initial = form.shop_name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{shop ? `Edit ${shop.name}` : "Add a shop"}</DialogTitle>
          <DialogDescription>
            {shop
              ? "Changes show on the storefront straight away."
              : "Shops you add here go live immediately. Invite the owner afterwards so they can manage it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-2xl font-extrabold text-brand-700">
              {form.logo_url ? <img src={form.logo_url} alt="Shop logo" className="h-full w-full object-cover" /> : initial}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <label className={`${buttonClass.secondary} cursor-pointer focus-within:ring-2 focus-within:ring-brand-500 ${busy ? "pointer-events-none opacity-60" : ""}`}>
                  <Icon name="camera-add-linear" className="h-4 w-4" />
                  {form.logo_url ? "Change logo" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void chooseLogo(file);
                    }}
                  />
                </label>
                {form.logo_url && !uploading ? (
                  <button type="button" className={buttonClass.ghost} disabled={busy} onClick={() => setForm((c) => ({ ...c, logo_url: "" }))}>
                    Remove
                  </button>
                ) : null}
              </div>
              {uploading ? (
                <UploadProgressBar percent={progress} label="Uploading logo" />
              ) : (
                <p className="text-xs text-muted-foreground">Square image works best · up to 10 MB</p>
              )}
            </div>
          </div>

          <Field label="Shop name">
            <input required maxLength={255} value={form.shop_name} onChange={set("shop_name")} className={inputClass} autoFocus />
          </Field>
          <Field label="About the shop" hint="Warranty terms, specialities, opening hours…">
            <textarea rows={3} maxLength={5000} value={form.description} onChange={set("description")} className={`${inputClass} resize-none`} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City / area">
              <input maxLength={255} value={form.location} onChange={set("location")} placeholder="e.g. Lilongwe" className={inputClass} />
            </Field>
            <Field label="Street address">
              <input maxLength={255} value={form.address} onChange={set("address")} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input maxLength={50} inputMode="tel" value={form.phone} onChange={set("phone")} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" maxLength={255} value={form.email} onChange={set("email")} className={inputClass} />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-ink-800">Verified shop</span>
                <span className="block text-xs text-muted-foreground">Shows the verified badge to shoppers.</span>
              </span>
              <Switch checked={form.verified} onCheckedChange={(checked) => setForm((c) => ({ ...c, verified: checked }))} />
            </label>
            {shop ? (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-ink-800">Live on Techaven</span>
                  <span className="block text-xs text-muted-foreground">Turn off to suspend the shop and hide its offers.</span>
                </span>
                <Switch checked={form.active} onCheckedChange={(checked) => setForm((c) => ({ ...c, active: checked }))} />
              </label>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {shop && onDelete ? (
              <button type="button" className={buttonClass.ghost} disabled={busy} onClick={() => onDelete(shop)}>
                <Icon name="trash-bin-trash-linear" className="h-4 w-4" />
                Delete shop
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" className={buttonClass.secondary} disabled={busy} onClick={() => onOpenChange(false)}>
                Cancel
              </button>
              <button type="submit" className={buttonClass.primary} disabled={busy}>
                {saving ? "Saving…" : uploading ? "Uploading…" : shop ? "Save changes" : "Add shop"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
