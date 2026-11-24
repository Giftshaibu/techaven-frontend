import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  catalogApi,
  sellerApi,
  uploadStaffImage,
  type PublicDevice,
} from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

import { buttonClass, errorMessage, Field, inputClass, LoadingBlock, mwk, storage } from "./kit";

type Condition = "new" | "used" | "refurbished" | "open_box";
const CONDITIONS: { value: Condition; label: string; note: string }[] = [
  { value: "new", label: "New", note: "Sealed, never used" },
  { value: "open_box", label: "Open box", note: "Opened, unused" },
  { value: "refurbished", label: "Refurbished", note: "Restored & tested" },
  { value: "used", label: "Used", note: "Pre-owned" },
];
const STEPS = ["Device", "Configuration", "Your offer"];

/** Three-step flow: find a catalogue device → choose the exact variant & colour → set the offer. */
export function ListingWizard({
  open,
  onOpenChange,
  shopId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: number;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<PublicDevice | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [colorId, setColorId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setDevice(null);
      setVariantId(null);
      setColorId(null);
    }
  }, [open]);

  const variant = device?.variants.find((item) => item.id === variantId) ?? null;
  const color = variant?.colors.find((item) => item.id === colorId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>List a device</DialogTitle>
          <DialogDescription>
            Listings attach to verified catalogue variants so shoppers can compare like for like.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  index < step
                    ? "bg-brand-500 text-white"
                    : index === step
                      ? "bg-brand-100 text-brand-800 ring-2 ring-brand-500"
                      : "bg-stage text-muted-foreground",
                )}
              >
                {index < step ? <Icon name="check-read-linear" className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:inline",
                  index <= step ? "text-ink-800" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded",
                    index < step ? "bg-brand-500" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <DeviceStep
            onPick={(picked) => {
              setDevice(picked);
              setVariantId(null);
              setColorId(null);
              setStep(1);
            }}
          />
        ) : null}
        {step === 1 && device ? (
          <VariantStep
            deviceId={device.id}
            variantId={variantId}
            colorId={colorId}
            onLoaded={setDevice}
            onVariant={(id) => {
              setVariantId(id);
              setColorId(null);
            }}
            onColor={setColorId}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        ) : null}
        {step === 2 && device && variant ? (
          <OfferStep
            shopId={shopId}
            device={device}
            variantLabel={`${variant.ram_gb != null ? `${variant.ram_gb} GB · ` : ""}${storage(variant.storage_gb)}${variant.network_generation ? ` · ${variant.network_generation}` : ""}`}
            variantId={variant.id}
            color={color}
            onBack={() => setStep(1)}
            onDone={() => {
              onCreated();
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DeviceStep({ onPick }: { onPick: (device: PublicDevice) => void }) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const results = useQuery({
    queryKey: ["portal", "catalog", "search", term],
    queryFn: () => catalogApi.searchDevices(term),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Icon
          name="magnifier-linear"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search e.g. iPhone 17 Pro, Galaxy S25, Spark 40"
          className={cn(inputClass, "py-3 pl-11 text-base")}
          aria-label="Search the catalogue"
        />
      </div>
      {results.isLoading ? (
        <LoadingBlock rows={3} />
      ) : results.error ? (
        <p className="text-sm text-rose-700">{errorMessage(results.error)}</p>
      ) : (
        <div className="grid max-h-[46vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {results.data?.devices.map((device) => {
            const image = device.primary_image_url ?? device.media?.[0]?.url;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => onPick(device)}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-3 text-left transition hover:border-brand-500 hover:shadow-md"
              >
                <span className="grid aspect-square place-items-center rounded-xl bg-stage">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-contain p-3" />
                  ) : (
                    <Icon
                      name={
                        device.category?.name === "Laptops" ? "laptop-linear" : "smartphone-linear"
                      }
                      className="h-10 w-10 text-neutral-400 transition group-hover:text-brand-500"
                    />
                  )}
                </span>
                <span className="mt-2 text-[11px] font-semibold text-brand-500">
                  {device.brand?.name}
                </span>
                <span className="text-sm font-bold leading-tight text-ink-800">{device.name}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">
                  {device.category?.name}
                </span>
              </button>
            );
          })}
          {!results.data?.devices.length ? (
            <p className="col-span-full rounded-xl bg-stage p-4 text-sm text-muted-foreground">
              No match in the catalogue. Ask Techaven to add it from the <strong>Requests</strong>{" "}
              tab.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function VariantStep({
  deviceId,
  variantId,
  colorId,
  onLoaded,
  onVariant,
  onColor,
  onBack,
  onNext,
}: {
  deviceId: number;
  variantId: number | null;
  colorId: number | null;
  onLoaded: (device: PublicDevice) => void;
  onVariant: (id: number) => void;
  onColor: (id: number | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const detail = useQuery({
    queryKey: ["portal", "catalog", "device", deviceId],
    queryFn: () => catalogApi.device(deviceId),
  });
  useEffect(() => {
    if (detail.data) onLoaded(detail.data);
  }, [detail.data, onLoaded]);
  const variants = detail.data?.variants ?? [];
  const selected = variants.find((item) => item.id === variantId);
  const [ram, setRam] = useState<number | null>(null);

  const rams = useMemo(
    () => [...new Set(variants.map((item) => item.ram_gb))].sort((a, b) => (a ?? 0) - (b ?? 0)),
    [variants],
  );
  const activeRam = selected?.ram_gb ?? ram ?? rams[0] ?? null;
  const forRam = variants
    .filter((item) => item.ram_gb === activeRam)
    .sort((a, b) => (a.storage_gb ?? 0) - (b.storage_gb ?? 0));

  if (detail.isLoading) return <LoadingBlock rows={3} />;
  if (detail.error) return <p className="text-sm text-rose-700">{errorMessage(detail.error)}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-stage p-3">
        <Icon name="smartphone-linear" className="h-6 w-6 text-brand-500" />
        <div>
          <p className="text-xs text-muted-foreground">{detail.data?.brand?.name}</p>
          <p className="text-sm font-bold text-ink-800">{detail.data?.name}</p>
        </div>
        <button type="button" onClick={onBack} className={cn(buttonClass.ghost, "ml-auto")}>
          Change
        </button>
      </div>

      {rams.length > 1 ? (
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Memory
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {rams.map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={activeRam === value}
                onClick={() => {
                  setRam(value);
                  const first = variants.find((item) => item.ram_gb === value);
                  if (first) onVariant(first.id);
                }}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-bold ring-1 ring-inset transition",
                  activeRam === value
                    ? "bg-ink-800 text-white ring-ink-800"
                    : "bg-surface text-ink-800 ring-border hover:ring-brand-300",
                )}
              >
                {value == null ? "—" : `${value} GB RAM`}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Storage
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {forRam.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={variantId === item.id}
              onClick={() => onVariant(item.id)}
              className={cn(
                "rounded-xl p-3 text-left ring-1 ring-inset transition",
                variantId === item.id
                  ? "bg-brand-100 ring-2 ring-brand-500"
                  : "bg-surface ring-border hover:ring-brand-300",
              )}
            >
              <span className="block text-base font-extrabold text-ink-800">
                {storage(item.storage_gb)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {[item.network_generation, item.region !== "global" ? item.region : null]
                  .filter(Boolean)
                  .join(" · ") || "Standard"}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {selected ? (
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Colour {color(selected.colors, colorId)}
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {selected.colors.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={colorId === item.id}
                title={item.manufacturer_name}
                onClick={() => onColor(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-[11px] font-semibold",
                  colorId === item.id ? "text-ink-800" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-10 w-10 rounded-full ring-1 ring-black/10 transition",
                    colorId === item.id && "ring-4 ring-brand-500 ring-offset-2",
                  )}
                  style={{ background: item.hex ?? "#ccc" }}
                />
                <span className="max-w-[72px] truncate">{item.manufacturer_name}</span>
              </button>
            ))}
            <button
              type="button"
              aria-pressed={colorId === null}
              onClick={() => onColor(null)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-[11px] font-semibold",
                colorId === null ? "text-ink-800" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full bg-stage ring-1 ring-border",
                  colorId === null && "ring-4 ring-brand-500 ring-offset-2",
                )}
              >
                <Icon name="pallete-2-linear" className="h-4 w-4" />
              </span>
              Mixed / any
            </button>
          </div>
        </fieldset>
      ) : null}

      <div className="flex justify-between gap-2 border-t border-border pt-4">
        <button type="button" className={buttonClass.secondary} onClick={onBack}>
          Back
        </button>
        <button type="button" className={buttonClass.primary} disabled={!selected} onClick={onNext}>
          Continue <Icon name="arrow-right-linear" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function color(colors: { id: number; manufacturer_name: string }[], id: number | null) {
  const match = colors.find((item) => item.id === id);
  return match ? (
    <span className="normal-case tracking-normal text-ink-800">· {match.manufacturer_name}</span>
  ) : null;
}

function OfferStep({
  shopId,
  device,
  variantLabel,
  variantId,
  color: chosen,
  onBack,
  onDone,
}: {
  shopId: number;
  device: PublicDevice;
  variantLabel: string;
  variantId: number;
  color: { id: number; manufacturer_name: string; hex: string | null } | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const [condition, setCondition] = useState<Condition>("new");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [warranty, setWarranty] = useState("12");
  const [sku, setSku] = useState("");
  const [battery, setBattery] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publish, setPublish] = useState(true);
  const needsPhoto = condition !== "new";

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 6 - images.length)) {
        const url = await uploadStaffImage(file);
        setImages((current) => [...current, url]);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  const create = useMutation({
    mutationFn: () =>
      sellerApi.createListing(shopId, {
        device_variant_id: variantId,
        device_variant_color_id: chosen?.id ?? null,
        condition,
        currency: "MWK",
        price: Number(price),
        quantity: Number(quantity),
        warranty_months: warranty === "" ? null : Number(warranty),
        merchant_sku: sku.trim() || null,
        status: publish ? "active" : "draft",
        images: images.map((url, index) => ({ url, is_primary: index === 0 })),
        details:
          battery && condition !== "new"
            ? {
                condition_details: { battery_health_percent: Number(battery) },
                warranty_available: Number(warranty) > 0,
              }
            : { warranty_available: Number(warranty) > 0 },
      }),
    onSuccess: () => {
      toast.success(publish ? "Your listing is live" : "Draft saved");
      onDone();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const preview = images[0] ?? device.primary_image_url ?? device.media?.[0]?.url;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate();
      }}
      className="grid gap-6 md:grid-cols-[1fr_240px]"
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Condition
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONDITIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={condition === item.value}
                onClick={() => setCondition(item.value)}
                className={cn(
                  "rounded-xl p-3 text-left ring-1 ring-inset",
                  condition === item.value
                    ? "bg-brand-100 ring-2 ring-brand-500"
                    : "bg-surface ring-border hover:ring-brand-300",
                )}
              >
                <span className="block text-sm font-bold text-ink-800">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.note}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (MWK)">
            <input
              type="number"
              min={1}
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={inputClass}
              placeholder="2500000"
            />
          </Field>
          <Field label="Units in stock">
            <input
              type="number"
              min={0}
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Warranty (months)">
            <input
              type="number"
              min={0}
              value={warranty}
              onChange={(event) => setWarranty(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your SKU" hint="Optional internal reference">
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              className={inputClass}
            />
          </Field>
          {condition !== "new" ? (
            <Field label="Battery health (%)" hint="Shown to shoppers on used devices">
              <input
                type="number"
                min={1}
                max={100}
                value={battery}
                onChange={(event) => setBattery(event.target.value)}
                className={inputClass}
              />
            </Field>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold text-ink-800">
            Photos{" "}
            {needsPhoto ? (
              <span className="text-rose-700">
                · at least one required for {condition.replace("_", " ")} devices
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">
                · optional, catalogue photo is used otherwise
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url, index) => (
              <div
                key={url}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-stage"
              >
                <img src={url} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute bottom-1 left-1 rounded bg-ink-800/80 px-1 text-[9px] font-bold text-white">
                    COVER
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setImages((current) => current.filter((item) => item !== url))}
                  className="absolute right-1 top-1 rounded-full bg-surface/90 p-0.5"
                >
                  <Icon name="close-circle-linear" className="h-4 w-4" />
                </button>
              </div>
            ))}
            {images.length < 6 ? (
              <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-brand-300 hover:text-brand-500">
                {uploading ? (
                  <span className="text-[11px]">Uploading…</span>
                ) : (
                  <Icon name="camera-add-linear" className="h-6 w-6" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => void addFiles(event.target.files)}
                />
              </label>
            ) : null}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Shopper preview
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid aspect-square place-items-center bg-stage">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-contain p-4" />
            ) : (
              <Icon name="smartphone-linear" className="h-12 w-12 text-neutral-400" />
            )}
          </div>
          <div className="p-3">
            <p className="text-[11px] font-semibold text-brand-500">
              {CONDITIONS.find((item) => item.value === condition)?.label}
            </p>
            <p className="text-sm font-bold leading-tight text-ink-800">{device.name}</p>
            <p className="text-[11px] text-muted-foreground">{variantLabel}</p>
            {chosen ? (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-800">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-black/10"
                  style={{ background: chosen.hex ?? "#ccc" }}
                />
                {chosen.manufacturer_name}
              </p>
            ) : null}
            <p className="mt-2 text-lg font-extrabold tabular-nums text-ink-800">
              {price ? mwk(price) : "MK —"}
            </p>
            {Number(warranty) > 0 ? (
              <p className="text-[11px] text-emerald-700">{warranty}-month warranty</p>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-xl bg-stage p-3 text-sm font-semibold text-ink-800">
          <input
            type="checkbox"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          Publish immediately
        </label>
      </aside>

      <div className="flex justify-between gap-2 border-t border-border pt-4 md:col-span-2">
        <button type="button" className={buttonClass.secondary} onClick={onBack}>
          Back
        </button>
        <button
          type="submit"
          disabled={create.isPending || uploading || (needsPhoto && !images.length)}
          className={buttonClass.primary}
        >
          {create.isPending ? "Saving…" : publish ? "Publish listing" : "Save draft"}
        </button>
      </div>
    </form>
  );
}
