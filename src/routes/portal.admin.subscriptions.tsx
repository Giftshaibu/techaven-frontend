import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  Field,
  FilterChips,
  inputClass,
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  relativeTime,
  shortDate,
  StatTile,
  StatusPill,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  adminSubscriptionApi,
  type ShopSubscription,
  type SubscriptionPackage,
} from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/subscriptions")({
  component: AdminSubscriptions,
});

type Filter = "all" | "active" | "pending_payment" | "canceled" | "expired";
const MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12, custom: 1 };

function AdminSubscriptions() {
  const [tab, setTab] = useState<"shops" | "plans">("shops");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue"
        title="Subscriptions"
        description="Seller plans paid with Airtel Money. Plans activate automatically when Airtel confirms payment."
      />
      <div className="inline-flex rounded-xl bg-stage p-1">
        {(
          [
            ["shops", "Shop subscriptions"],
            ["plans", "Plans"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold",
              tab === value ? "bg-surface text-ink-800 shadow-sm" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "shops" ? <ShopSubscriptions /> : <Plans />}
    </div>
  );
}

function ShopSubscriptions() {
  const queryClient = useQueryClient();
  const subs = useQuery({
    queryKey: ["portal", "admin", "shop-subs"],
    queryFn: () => adminSubscriptionApi.subscriptions({}),
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [markPaid, setMarkPaid] = useState<ShopSubscription | null>(null);
  const [cancelling, setCancelling] = useState<ShopSubscription | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });

  const all = useMemo(() => subs.data?.subscriptions ?? [], [subs.data]);
  const visible = all.filter((sub) => filter === "all" || sub.effective_status === filter);
  const active = all.filter((sub) => sub.subscribed);
  const pending = all.filter((sub) => sub.effective_status === "pending_payment");
  const mrr = active.reduce(
    (sum, sub) =>
      sum + (sub.package ? sub.package.price_mwk / (MONTHS[sub.package.billing_period] ?? 1) : 0),
    0,
  );
  const count = (status: Filter) => all.filter((sub) => sub.effective_status === status).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          accent
          label="Monthly recurring"
          icon="graph-up-linear"
          value={mwk(mrr, { compact: true })}
          hint="Active plans, per month"
        />
        <StatTile label="Paying shops" icon="shop-2-linear" value={active.length} />
        <StatTile
          label="Awaiting payment"
          icon="clock-circle-linear"
          value={pending.length}
          hint="Airtel prompt not yet approved"
        />
        <StatTile
          label="Cancelling"
          icon="pause-circle-linear"
          value={active.filter((sub) => sub.cancel_at_period_end).length}
          hint="End at period close"
        />
      </div>
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: all.length },
          { value: "active", label: "Active", count: count("active") },
          { value: "pending_payment", label: "Awaiting payment", count: count("pending_payment") },
          { value: "expired", label: "Expired", count: count("expired") },
          { value: "canceled", label: "Canceled", count: count("canceled") },
        ]}
      />
      <Panel bodyClassName="p-0">
        {subs.isLoading ? (
          <div className="p-5">
            <LoadingBlock label="Loading subscriptions" />
          </div>
        ) : subs.error ? (
          <div className="p-5">
            <ErrorBlock error={subs.error} onRetry={() => subs.refetch()} />
          </div>
        ) : !visible.length ? (
          <EmptyState icon="card-linear" title="No subscriptions here">
            When sellers choose a plan in Shop Studio it appears here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((sub) => (
              <li key={sub.id} className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-sm font-extrabold text-brand-700">
                  {(sub.shop?.name ?? sub.shop_name ?? "?")[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink-800">
                    {sub.shop?.name ?? sub.shop_name ?? `Shop #${sub.shop_id}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {sub.package?.name} · {mwk(sub.package?.price_mwk)} ·{" "}
                    {sub.subscribed
                      ? `until ${shortDate(sub.current_period_end)}`
                      : `created ${relativeTime(sub.created_at)}`}
                    {sub.payment_reference ? ` · ref ${sub.payment_reference}` : ""}
                  </p>
                </div>
                <StatusPill status={sub.payment_status} />
                <StatusPill status={sub.effective_status} />
                <div className="flex gap-1.5">
                  {sub.status === "pending_payment" ? (
                    <button
                      type="button"
                      className={buttonClass.ghost}
                      onClick={() => setMarkPaid(sub)}
                    >
                      <Icon name="check-circle-linear" className="h-3.5 w-3.5" />
                      Mark paid
                    </button>
                  ) : null}
                  {["active", "pending_payment", "trialing", "past_due"].includes(sub.status) ? (
                    <button
                      type="button"
                      className={cn(buttonClass.ghost, "text-rose-700 hover:bg-danger-soft")}
                      onClick={() => setCancelling(sub)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ReasonDialog
        open={!!markPaid}
        onOpenChange={(open) => !open && setMarkPaid(null)}
        tone="primary"
        title={`Activate ${markPaid?.shop?.name ?? "this shop"}'s plan?`}
        description="Use only when you've confirmed the payment yourself, for example an Airtel Money transaction ID from the seller's SMS."
        reasonLabel="Airtel transaction ID or note"
        requireReason
        confirmLabel="Mark as paid"
        onConfirm={async (reference) => {
          if (!markPaid) return;
          try {
            await adminSubscriptionApi.updateSubscription(markPaid.id, {
              payment_status: "paid",
              payment_reference: reference,
            });
            toast.success("Plan activated");
            void refresh();
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
      <ReasonDialog
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        title={`Cancel ${cancelling?.shop?.name ?? "this"} subscription now?`}
        description="The plan ends immediately. No refund is issued automatically."
        reasonLabel="Internal note"
        confirmLabel="Cancel subscription"
        onConfirm={async (note) => {
          if (!cancelling) return;
          try {
            await adminSubscriptionApi.updateSubscription(cancelling.id, {
              status: "canceled",
              notes: note || null,
            });
            toast.success("Subscription canceled");
            void refresh();
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
    </>
  );
}

function Plans() {
  const queryClient = useQueryClient();
  const packages = useQuery({
    queryKey: ["portal", "admin", "packages"],
    queryFn: adminSubscriptionApi.packages,
  });
  const [editing, setEditing] = useState<SubscriptionPackage | "new" | null>(null);
  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminSubscriptionApi.updatePackage(id, { is_active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const plans = [...(packages.data?.packages ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="flex justify-end">
        <button type="button" className={buttonClass.primary} onClick={() => setEditing("new")}>
          <Icon name="add-circle-linear" className="h-4 w-4" />
          New plan
        </button>
      </div>
      {packages.isLoading ? (
        <LoadingBlock label="Loading packages" />
      ) : packages.error ? (
        <ErrorBlock error={packages.error} />
      ) : !plans.length ? (
        <Panel>
          <EmptyState icon="card-linear" title="No plans yet">
            Create a plan, or run{" "}
            <code className="rounded bg-stage px-1">npm run seed:packages:apply</code> on the API
            server.
          </EmptyState>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((pkg) => (
            <article
              key={pkg.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-surface p-5",
                pkg.is_featured ? "border-brand-500" : "border-border",
                !pkg.is_active && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-extrabold text-ink-800">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{pkg.slug} · {pkg.duration_days} days
                    {pkg.trial_days ? ` + ${pkg.trial_days} trial` : ""}
                  </p>
                </div>
                <Switch
                  checked={pkg.is_active}
                  aria-label={`Offer ${pkg.name}`}
                  onCheckedChange={(checked) => toggle.mutate({ id: pkg.id, is_active: checked })}
                />
              </div>
              <p className="mt-3 text-2xl font-extrabold tabular-nums text-ink-800">
                {mwk(pkg.price_mwk)}{" "}
                <span className="text-sm font-semibold capitalize text-muted-foreground">
                  {pkg.billing_period}
                </span>
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
                {pkg.features.slice(0, 4).map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2">
                {pkg.is_featured ? <StatusPill tone="brand">Featured</StatusPill> : null}
                <button
                  type="button"
                  className={cn(buttonClass.ghost, "ml-auto")}
                  onClick={() => setEditing(pkg)}
                >
                  <Icon name="pen-linear" className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <PlanDialog plan={editing} onClose={() => setEditing(null)} />
    </>
  );
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function PlanDialog({
  plan,
  onClose,
}: {
  plan: SubscriptionPackage | "new" | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = plan === "new";
  const empty = {
    name: "",
    slug: "",
    description: "",
    price_mwk: "",
    billing_period: "monthly",
    duration_days: "30",
    trial_days: "0",
    features: "",
    is_featured: false,
    sort_order: "10",
  };
  const [form, setForm] = useState(empty);
  useEffect(() => {
    if (plan && plan !== "new") {
      setForm({
        name: plan.name,
        slug: plan.slug,
        description: plan.description ?? "",
        price_mwk: String(plan.price_mwk),
        billing_period: plan.billing_period,
        duration_days: String(plan.duration_days),
        trial_days: String(plan.trial_days),
        features: plan.features.join("\n"),
        is_featured: plan.is_featured,
        sort_order: String(plan.sort_order),
      });
    } else if (plan === "new") setForm(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_mwk: Number(form.price_mwk),
        billing_period: form.billing_period,
        duration_days: Number(form.duration_days),
        trial_days: Number(form.trial_days || 0),
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order || 0),
        features: form.features
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };
      return isNew
        ? adminSubscriptionApi.createPackage({ ...body, slug: form.slug || slugify(form.name) })
        : adminSubscriptionApi.updatePackage((plan as SubscriptionPackage).id, body);
    },
    onSuccess: () => {
      toast.success(isNew ? "Plan created" : "Plan saved");
      void queryClient.invalidateQueries({ queryKey: ["portal"] });
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New plan" : `Edit ${form.name}`}</DialogTitle>
          <DialogDescription>
            Price changes apply to new subscriptions; current periods are not affected.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Name">
            <input required value={form.name} onChange={set("name")} className={inputClass} />
          </Field>
          <Field label="Slug" hint={isNew ? "Leave empty to generate" : "Cannot be changed"}>
            <input
              value={isNew ? form.slug : form.slug}
              disabled={!isNew}
              onChange={set("slug")}
              placeholder={slugify(form.name)}
              className={inputClass}
            />
          </Field>
          <Field label="Price (MWK)">
            <input
              type="number"
              min={1}
              required
              value={form.price_mwk}
              onChange={set("price_mwk")}
              className={inputClass}
            />
          </Field>
          <Field label="Billing period">
            <select
              value={form.billing_period}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  billing_period: event.target.value,
                  duration_days: String(
                    { monthly: 30, quarterly: 90, yearly: 365 }[event.target.value] ??
                      current.duration_days,
                  ),
                }))
              }
              className={inputClass}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
          <Field label="Duration (days)">
            <input
              type="number"
              min={1}
              required
              value={form.duration_days}
              onChange={set("duration_days")}
              className={inputClass}
            />
          </Field>
          <Field label="Free trial (days)">
            <input
              type="number"
              min={0}
              value={form.trial_days}
              onChange={set("trial_days")}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <input
                value={form.description}
                onChange={set("description")}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Features" hint="One per line">
              <textarea
                rows={4}
                value={form.features}
                onChange={set("features")}
                className={cn(inputClass, "resize-none")}
              />
            </Field>
          </div>
          <Field label="Display order">
            <input
              type="number"
              value={form.sort_order}
              onChange={set("sort_order")}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-ink-800">
            <Switch
              checked={form.is_featured}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, is_featured: checked }))
              }
            />
            Highlight as most popular
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={buttonClass.secondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={save.isPending} className={buttonClass.primary}>
              {save.isPending ? "Saving…" : "Save plan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
