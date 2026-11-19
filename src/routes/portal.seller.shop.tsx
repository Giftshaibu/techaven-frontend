import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  ErrorBlock,
  errorMessage,
  Field,
  inputClass,
  LoadingBlock,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/portal/kit";
import { sellerApi, uploadStaffImage } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/seller/shop")({ component: SellerShop });

function SellerShop() {
  const queryClient = useQueryClient();
  const dashboard = useQuery({
    queryKey: ["portal", "seller", "dashboard"],
    queryFn: sellerApi.dashboard,
  });
  const shop = dashboard.data?.shop;
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
  });
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (shop)
      setForm({
        name: shop.name ?? "",
        description: shop.description ?? "",
        location: shop.location ?? "",
        address: shop.address ?? "",
        phone: shop.phone ?? "",
        email: shop.email ?? "",
        logo: shop.logo ?? "",
      });
  }, [shop]);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const save = useMutation({
    mutationFn: () => sellerApi.updateShop(shop!.id, { ...form, logo: form.logo || null }),
    onSuccess: () => {
      toast.success("Shop profile saved");
      void queryClient.invalidateQueries({ queryKey: ["portal", "seller"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function uploadLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadStaffImage(file);
      setForm((current) => ({ ...current, logo: url }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  if (dashboard.isLoading) return <LoadingBlock />;
  if (dashboard.error || !shop)
    return <ErrorBlock error={dashboard.error ?? new Error("Shop not found")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Storefront"
        title="My shop"
        description="This is what shoppers see on your Techaven shop page and next to every offer."
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Profile">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="flex items-center gap-4 sm:col-span-2">
              <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-2xl font-extrabold text-brand-700">
                {form.logo ? (
                  <img src={form.logo} alt="Shop logo" className="h-full w-full object-cover" />
                ) : (
                  form.name[0]
                )}
              </span>
              <label className={`${buttonClass.secondary} cursor-pointer`}>
                <Icon name="camera-add-linear" className="h-4 w-4" />
                {uploading ? "Uploading…" : "Change logo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => void uploadLogo(event.target.files?.[0])}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <Field label="Shop name">
                <input required value={form.name} onChange={set("name")} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="About your shop" hint="Warranty terms, specialities, opening hours…">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={set("description")}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
            <Field label="City / area">
              <input value={form.location} onChange={set("location")} className={inputClass} />
            </Field>
            <Field label="Street address">
              <input value={form.address} onChange={set("address")} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={set("phone")} className={inputClass} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={save.isPending || uploading}
                className={buttonClass.primary}
              >
                {save.isPending ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        </Panel>
        <div className="space-y-6">
          <Panel title="Shop card preview">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-brand-100 font-extrabold text-brand-700">
                  {form.logo ? (
                    <img src={form.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    form.name[0]
                  )}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate font-bold text-ink-800">
                    {form.name || "Shop name"}
                    {shop.is_verified ? (
                      <Icon name="verified-check-bold" className="h-4 w-4 text-brand-500" />
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {form.location || "Location"}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {form.description || "Tell shoppers what makes your shop worth buying from."}
              </p>
            </div>
          </Panel>
          <Panel title="Status">
            <div className="flex flex-wrap gap-2">
              <StatusPill status={shop.status} />
              <StatusPill status={shop.application_status} />
              <StatusPill status={shop.is_verified ? "verified" : "unverified"} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Verification is granted by Techaven after checking your business documents.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
