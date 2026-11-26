import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  FilterChips,
  inputClass,
  LoadingBlock,
  PageHeader,
  shortDate,
  StatusPill,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import { ShopDialog } from "@/components/portal/ShopDialog";
import { adminApi, type Shop, type ShopInput } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/shops")({ component: AdminShops });

type Filter = "pending" | "active" | "inactive" | "all";

function AdminShops() {
  const queryClient = useQueryClient();
  const shops = useQuery({ queryKey: ["portal", "admin", "shops"], queryFn: adminApi.shops });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState<Shop | null>(null);
  // undefined = closed, null = adding, Shop = editing
  const [editing, setEditing] = useState<Shop | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Shop | null>(null);

  async function saveShop(values: ShopInput) {
    if (editing) {
      await adminApi.updateShop(editing.id, values);
      toast.success(`${values.shop_name} updated`);
    } else {
      await adminApi.createShop(values);
      toast.success(`${values.shop_name} added and live`);
      setFilter("all");
    }
    await refresh();
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
  const action = useMutation({
    mutationFn: async ({
      shop,
      kind,
    }: {
      shop: Shop;
      kind: "approve" | "suspend" | "reactivate";
    }) => {
      if (kind === "approve") return adminApi.approveShop(shop.id);
      return adminApi.updateShop(shop.id, { status: kind === "suspend" ? "inactive" : "active" });
    },
    onSuccess: (_data, { shop, kind }) => {
      toast.success(
        `${shop.name} ${kind === "approve" ? "approved" : kind === "suspend" ? "suspended" : "reactivated"}`,
      );
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const all = shops.data ?? [];
  const counts = {
    pending: all.filter((shop) => shop.application_status === "pending").length,
    active: all.filter((shop) => shop.status === "active").length,
    inactive: all.filter(
      (shop) => shop.status !== "active" && shop.application_status !== "pending",
    ).length,
  };
  const visible = useMemo(
    () =>
      all.filter((shop) => {
        if (filter === "pending" && shop.application_status !== "pending") return false;
        if (filter === "active" && shop.status !== "active") return false;
        if (
          filter === "inactive" &&
          (shop.status === "active" || shop.application_status === "pending")
        )
          return false;
        const term = search.trim().toLowerCase();
        return (
          !term ||
          [shop.name, shop.location, shop.email].some((value) =>
            value?.toLowerCase().includes(term),
          )
        );
      }),
    [all, filter, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Shops"
        description="Every storefront in the Techaven mall. Add shops, approve new applications and keep the line-up healthy."
        actions={
          <button type="button" className={buttonClass.primary} onClick={() => setEditing(null)}>
            <Icon name="add-circle-linear" className="h-4 w-4" />
            Add shop
          </button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: all.length },
            { value: "pending", label: "Awaiting review", count: counts.pending },
            { value: "active", label: "Live", count: counts.active },
            { value: "inactive", label: "Suspended / rejected", count: counts.inactive },
          ]}
        />
        <div className="relative md:w-72">
          <Icon
            name="magnifier-linear"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shops"
            className={cn(inputClass, "pl-9")}
          />
        </div>
      </div>

      {shops.isLoading ? (
        <LoadingBlock label="Loading shops" />
      ) : shops.error ? (
        <ErrorBlock error={shops.error} onRetry={() => shops.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon="shop-2-linear" title="No shops here">
          Try a different filter or search.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((shop) => (
            <article
              key={shop.id}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-100 text-lg font-extrabold text-brand-700">
                  {shop.logo ? (
                    <img src={shop.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    shop.name.slice(0, 1)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1.5 truncate text-base font-bold text-ink-800">
                    {shop.name}
                    {shop.is_verified ? (
                      <Icon
                        name="verified-check-bold"
                        className="h-4 w-4 shrink-0 text-brand-500"
                      />
                    ) : null}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {shop.location || "No location"} · since {shortDate(shop.createdAt)}
                  </p>
                </div>
                <StatusPill
                  status={shop.application_status === "pending" ? "pending" : shop.status}
                />
              </div>
              {shop.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {shop.description}
                </p>
              ) : null}
              <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-stage p-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="truncate font-semibold text-ink-800">
                    {shop.phone || shop.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Products</dt>
                  <dd className="font-semibold text-ink-800">{shop.total_products ?? 0}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd className="truncate font-semibold text-ink-800">
                    {shop.owners?.length ? shop.owners.map((owner) => owner.name).join(", ") : "Not invited yet"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                {shop.application_status === "pending" ? (
                  <>
                    <button
                      type="button"
                      className={buttonClass.primary}
                      disabled={action.isPending}
                      onClick={() => action.mutate({ shop, kind: "approve" })}
                    >
                      <Icon name="check-circle-linear" className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      className={buttonClass.danger}
                      onClick={() => setRejecting(shop)}
                    >
                      Reject
                    </button>
                  </>
                ) : shop.status === "active" ? (
                  <button
                    type="button"
                    className={buttonClass.secondary}
                    disabled={action.isPending}
                    onClick={() => action.mutate({ shop, kind: "suspend" })}
                  >
                    <Icon name="pause-circle-linear" className="h-4 w-4" />
                    Suspend
                  </button>
                ) : (
                  <button
                    type="button"
                    className={buttonClass.secondary}
                    disabled={action.isPending}
                    onClick={() => action.mutate({ shop, kind: "reactivate" })}
                  >
                    <Icon name="play-circle-linear" className="h-4 w-4" />
                    Reactivate
                  </button>
                )}
                <button
                  type="button"
                  className={cn(buttonClass.ghost, "ml-auto")}
                  onClick={() => setEditing(shop)}
                  aria-label={`Edit ${shop.name}`}
                >
                  <Icon name="pen-linear" className="h-4 w-4" />
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ShopDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        shop={editing ?? null}
        onSave={saveShop}
        onDelete={(shop) => setDeleting(shop)}
      />
      <ReasonDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "shop"}?`}
        description="This permanently removes the shop. Shops with sellers, listings, orders or subscriptions can't be deleted; suspend them instead so their history is kept."
        confirmLabel="Delete permanently"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await adminApi.deleteShop(deleting.id);
            toast.success(`${deleting.name} deleted`);
            setEditing(undefined);
            void refresh();
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
      <ReasonDialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject ${rejecting?.name ?? "shop"}?`}
        description="The applicant is told their application was not approved."
        reasonLabel="Reason (shared with the applicant)"
        requireReason
        confirmLabel="Reject application"
        onConfirm={async (reason) => {
          if (!rejecting) return;
          try {
            await adminApi.rejectShop(rejecting.id, reason);
            toast.success("Application rejected");
            void refresh();
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
    </div>
  );
}
