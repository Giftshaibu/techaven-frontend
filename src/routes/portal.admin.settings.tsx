import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  Field,
  inputClass,
  LoadingBlock,
  PageHeader,
  Panel,
  relativeTime,
  StatusPill,
} from "@/components/portal/kit";
import { CourierDialog } from "@/components/portal/CourierDialog";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import { Switch } from "@/components/ui/switch";
import { adminApi, type Courier, type CourierInput } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Commission, loyalty points and the courier options shoppers see at checkout."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <EconomicsPanel />
        <CourierPanel />
      </div>
    </div>
  );
}

function EconomicsPanel() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["portal", "admin", "settings"],
    queryFn: adminApi.settings,
  });
  const [commission, setCommission] = useState("");
  const [points, setPoints] = useState("");
  useEffect(() => {
    if (settings.data) {
      setCommission(String(settings.data.seller_commission_percent ?? 0));
      setPoints(
        settings.data.default_points_mwk_per_point == null
          ? ""
          : String(settings.data.default_points_mwk_per_point),
      );
    }
  }, [settings.data]);
  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        seller_commission_percent: Number(commission),
        default_points_mwk_per_point: points === "" ? null : Number(points),
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["portal", "admin", "settings"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const example = (1_000_000 * (Number(commission) || 0)) / 100;

  return (
    <Panel
      title="Marketplace economics"
      description={
        settings.data?.updated_at
          ? `Last changed ${relativeTime(settings.data.updated_at)}`
          : undefined
      }
    >
      {settings.isLoading ? (
        <LoadingBlock rows={2} label="Loading settings" />
      ) : settings.error ? (
        <ErrorBlock error={settings.error} />
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          className="space-y-5"
        >
          <Field
            label="Seller commission (%)"
            hint="Deducted from each paid order before the seller's escrow is released."
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={Number(commission) || 0}
                onChange={(event) => setCommission(event.target.value)}
                className="flex-1 accent-brand-500"
                aria-label="Commission slider"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commission}
                onChange={(event) => setCommission(event.target.value)}
                className={`${inputClass} w-24`}
              />
            </div>
          </Field>
          <div className="rounded-xl bg-info-soft p-4 text-sm text-sky-900">
            On a <strong>MK 1,000,000</strong> phone, Techaven keeps{" "}
            <strong>MK {example.toLocaleString("en-GB")}</strong> and the seller receives{" "}
            <strong>MK {(1_000_000 - example).toLocaleString("en-GB")}</strong>.
          </div>
          <Field
            label="Default loyalty value (MWK per point)"
            hint="Leave empty to let each shop decide."
          >
            <input
              type="number"
              min={0}
              value={points}
              onChange={(event) => setPoints(event.target.value)}
              className={inputClass}
            />
          </Field>
          <button type="submit" disabled={save.isPending} className={buttonClass.primary}>
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </Panel>
  );
}

function CourierPanel() {
  const queryClient = useQueryClient();
  const couriers = useQuery({
    queryKey: ["portal", "admin", "couriers"],
    queryFn: adminApi.couriers,
  });
  // undefined = closed, null = adding, Courier = editing
  const [editing, setEditing] = useState<Courier | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Courier | null>(null);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["portal", "admin", "couriers"] });
  const list = couriers.data ?? [];
  const nextSortOrder = list.reduce((max, courier) => Math.max(max, courier.sort_order), 0) + 1;

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.updateCourier(id, { is_active }),
    onSuccess: () => void refresh(),
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function save(values: CourierInput) {
    if (editing) {
      await adminApi.updateCourier(editing.id, values);
      toast.success("Courier updated");
    } else {
      await adminApi.createCourier(values);
      toast.success("Courier added");
    }
    await refresh();
  }

  async function remove() {
    if (!deleting) return;
    try {
      await adminApi.deleteCourier(deleting.id);
      toast.success(`${deleting.name} deleted`);
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  }

  return (
    <Panel
      title="Courier services"
      description="Options offered at checkout besides Techaven riders"
      actions={
        <button type="button" className={buttonClass.primary} onClick={() => setEditing(null)}>
          <Icon name="add-circle-linear" className="h-4 w-4" />
          Add courier
        </button>
      }
    >
      {couriers.isLoading ? (
        <LoadingBlock rows={2} label="Loading couriers" />
      ) : couriers.error ? (
        <ErrorBlock error={couriers.error} onRetry={() => void couriers.refetch()} />
      ) : !list.length ? (
        <EmptyState icon="delivery-linear" title="No couriers yet">
          Add a courier so shoppers can choose it at checkout.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {list.map((courier) => (
            <li key={courier.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface text-brand-500">
                {courier.logo_url ? (
                  <img src={courier.logo_url} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Icon name="delivery-linear" className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-800">{courier.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {courier.description || "No description"}
                </p>
              </div>
              <StatusPill status={courier.is_active ? "active" : "paused"} />
              <Switch
                checked={courier.is_active}
                aria-label={`Offer ${courier.name}`}
                disabled={toggle.isPending && toggle.variables.id === courier.id}
                onCheckedChange={(checked) => toggle.mutate({ id: courier.id, is_active: checked })}
              />
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-stage hover:text-ink-800"
                aria-label={`Edit ${courier.name}`}
                title="Edit"
                onClick={() => setEditing(courier)}
              >
                <Icon name="pen-linear" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-rose-700"
                aria-label={`Delete ${courier.name}`}
                title="Delete"
                onClick={() => setDeleting(courier)}
              >
                <Icon name="trash-bin-trash-linear" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <CourierDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        courier={editing ?? null}
        nextSortOrder={nextSortOrder}
        onSave={save}
      />
      <ReasonDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "courier"}?`}
        description="Shoppers will no longer see it at checkout. Past orders keep the courier's name. To hide it temporarily, turn it off instead."
        confirmLabel="Delete courier"
        onConfirm={remove}
      />
    </Panel>
  );
}
