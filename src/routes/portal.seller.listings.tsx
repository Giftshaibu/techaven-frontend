import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  FilterChips,
  inputClass,
  LoadingBlock,
  mwk,
  PageHeader,
  StatusPill,
  storage,
  toNumber,
  useStaffSession,
} from "@/components/portal/kit";
import { ListingWizard } from "@/components/portal/ListingWizard";
import { sellerApi, type Listing } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/seller/listings")({
  validateSearch: z.object({ new: z.boolean().optional() }),
  component: SellerListings,
});

type Filter = "all" | Listing["status"];
const CONDITION: Record<string, string> = {
  new: "New",
  used: "Used",
  refurbished: "Refurbished",
  open_box: "Open box",
};

function listingTitle(listing: Listing) {
  const variant = listing.variant;
  const parts = [
    variant?.ram_gb != null ? `${Number(variant.ram_gb)} GB` : null,
    variant?.storage_gb != null ? storage(variant.storage_gb) : null,
    variant?.network_generation,
  ];
  return {
    name: variant?.device?.name ?? `Variant #${listing.device_variant_id}`,
    spec: parts.filter(Boolean).join(" · "),
  };
}

function SellerListings() {
  const session = useStaffSession();
  const shopId = session?.user.shop_id ?? 0;
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listings = useQuery({
    queryKey: ["portal", "seller", "listings", shopId],
    queryFn: () => sellerApi.listings(shopId),
    enabled: !!shopId,
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [term, setTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    if (search.new) {
      setWizardOpen(true);
      void navigate({ to: "/portal/seller/listings", search: {}, replace: true });
    }
  }, [search.new, navigate]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "seller"] });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      sellerApi.updateListing(shopId, id, body),
    onSuccess: () => {
      toast.success("Listing updated");
      setEditing(null);
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const archive = useMutation({
    mutationFn: (id: number) => sellerApi.archiveListing(shopId, id),
    onSuccess: () => {
      toast.success("Listing archived");
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const all = listings.data ?? [];
  const visible = useMemo(
    () =>
      all.filter(
        (listing) =>
          (filter === "all" ? listing.status !== "archived" : listing.status === filter) &&
          (!term.trim() ||
            listingTitle(listing).name.toLowerCase().includes(term.trim().toLowerCase())),
      ),
    [all, filter, term],
  );
  const count = (status: Listing["status"]) =>
    all.filter((listing) => listing.status === status).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Listings"
        description="Each listing is your offer on a verified catalogue variant. Shoppers compare offers from every shop on one product page."
        actions={
          <button type="button" className={buttonClass.primary} onClick={() => setWizardOpen(true)}>
            <Icon name="add-circle-linear" className="h-4 w-4" />
            List a device
          </button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Current", count: all.length - count("archived") },
            { value: "active", label: "Live", count: count("active") },
            { value: "paused", label: "Paused", count: count("paused") },
            { value: "draft", label: "Drafts", count: count("draft") },
            { value: "archived", label: "Archived", count: count("archived") },
          ]}
        />
        <div className="relative md:w-72">
          <Icon
            name="magnifier-linear"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search your listings"
            className={cn(inputClass, "pl-9")}
          />
        </div>
      </div>

      {listings.isLoading ? (
        <LoadingBlock />
      ) : listings.error ? (
        <ErrorBlock error={listings.error} onRetry={() => listings.refetch()} />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface">
          <EmptyState
            icon="tag-price-linear"
            title={all.length ? "No listings in this view" : "Your shelf is empty"}
            action={
              <button
                type="button"
                className={buttonClass.primary}
                onClick={() => setWizardOpen(true)}
              >
                List a device
              </button>
            }
          >
            Pick a phone or laptop from the Techaven catalogue, choose its exact configuration and
            colour, and set your price.
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((listing) => {
            const title = listingTitle(listing);
            const image =
              listing.images?.find((item) => item.is_primary)?.url ??
              listing.images?.[0]?.url ??
              listing.variant?.device?.primary_image_url;
            return (
              <article
                key={listing.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl border border-border bg-surface",
                  listing.status !== "active" && "opacity-80",
                )}
              >
                <div className="relative grid aspect-[4/3] place-items-center bg-stage">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-contain p-6" />
                  ) : (
                    <Icon name="smartphone-linear" className="h-12 w-12 text-neutral-400" />
                  )}
                  <div className="absolute left-3 top-3">
                    <StatusPill status={listing.status === "active" ? "active" : listing.status}>
                      {listing.status === "active" ? "Live" : undefined}
                    </StatusPill>
                  </div>
                  {listing.variant_color ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2 py-1 text-[11px] font-semibold text-ink-800 backdrop-blur">
                      <span
                        className="h-3 w-3 rounded-full ring-1 ring-black/10"
                        style={{ background: listing.variant_color.hex_override ?? "#ccc" }}
                      />
                      {listing.variant_color.manufacturer_name}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-semibold text-brand-500">
                    {listing.variant?.device?.brand?.name} · {CONDITION[listing.condition]}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-ink-800">{title.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {title.spec}
                    {listing.warranty_months ? ` · ${listing.warranty_months} mo warranty` : ""}
                  </p>
                  {editing === listing.id ? (
                    <QuickEdit
                      listing={listing}
                      busy={update.isPending}
                      onCancel={() => setEditing(null)}
                      onSave={(body) => update.mutate({ id: listing.id, body })}
                    />
                  ) : (
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-xl font-extrabold tabular-nums text-ink-800">
                        {mwk(listing.price)}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          listing.quantity <= 2 ? "text-amber-700" : "text-muted-foreground",
                        )}
                      >
                        {listing.quantity} in stock
                      </p>
                    </div>
                  )}
                  {listing.status !== "archived" && editing !== listing.id ? (
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                      <button
                        type="button"
                        className={buttonClass.ghost}
                        onClick={() => setEditing(listing.id)}
                      >
                        <Icon name="pen-linear" className="h-3.5 w-3.5" />
                        Price & stock
                      </button>
                      {listing.status === "active" ? (
                        <button
                          type="button"
                          className={buttonClass.ghost}
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({ id: listing.id, body: { status: "paused" } })
                          }
                        >
                          <Icon name="pause-circle-linear" className="h-3.5 w-3.5" />
                          Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={buttonClass.ghost}
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({ id: listing.id, body: { status: "active" } })
                          }
                        >
                          <Icon name="play-circle-linear" className="h-3.5 w-3.5" />
                          Go live
                        </button>
                      )}
                      <button
                        type="button"
                        className={cn(
                          buttonClass.ghost,
                          "ml-auto text-rose-700 hover:bg-danger-soft",
                        )}
                        disabled={archive.isPending}
                        onClick={() => {
                          if (
                            window.confirm("Archive this listing? Shoppers will no longer see it.")
                          )
                            archive.mutate(listing.id);
                        }}
                      >
                        <Icon name="archive-linear" className="h-3.5 w-3.5" />
                        Archive
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ListingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        shopId={shopId}
        onCreated={() => void refresh()}
      />
    </div>
  );
}

function QuickEdit({
  listing,
  busy,
  onSave,
  onCancel,
}: {
  listing: Listing;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(String(toNumber(listing.price)));
  const [quantity, setQuantity] = useState(String(listing.quantity));
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ price: Number(price), quantity: Number(quantity) });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold">
          Price (MWK)
          <input
            type="number"
            min={1}
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={cn(inputClass, "mt-1")}
          />
        </label>
        <label className="text-xs font-semibold">
          Stock
          <input
            type="number"
            min={0}
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass.ghost} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className={cn(buttonClass.primary, "px-3 py-1.5 text-xs")}
        >
          Save
        </button>
      </div>
    </form>
  );
}
