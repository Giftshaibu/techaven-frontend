import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { AirtelPayDialog } from "@/components/portal/AirtelPayDialog";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  shortDate,
  StatusPill,
  useStaffSession,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import {
  subscriptionApi,
  type ShopSubscription,
  type SubscriptionPackage,
} from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/seller/plan")({ component: SellerPlan });

const PERIOD: Record<string, string> = {
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
  custom: "period",
};

function daysLeft(end: string | null) {
  if (!end) return null;
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
}

function SellerPlan() {
  const session = useStaffSession();
  const shopId = session?.user.shop_id ?? 0;
  const queryClient = useQueryClient();
  const packages = useQuery({ queryKey: ["portal", "plans"], queryFn: subscriptionApi.packages });
  const current = useQuery({
    queryKey: ["portal", "seller", "subscription", shopId],
    queryFn: () => subscriptionApi.current(shopId),
    enabled: !!shopId,
  });
  const [paying, setPaying] = useState<ShopSubscription | null>(null);
  const [switchTo, setSwitchTo] = useState<SubscriptionPackage | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "seller"] });
  const sub = current.data?.subscription ?? null;
  const live = sub?.subscribed ? sub : null;
  const pending =
    sub && sub.status === "pending_payment" && sub.effective_status !== "expired" ? sub : null;

  const choose = useMutation({
    mutationFn: (pkg: SubscriptionPackage) =>
      subscriptionApi.subscribe(shopId, pkg.id, !!(live || pending)),
    onSuccess: (data) => {
      void refresh();
      setPaying(data.subscription);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const resume = useMutation({
    mutationFn: () => subscriptionApi.resume(shopId),
    onSuccess: () => {
      toast.success("Auto-renew is back on");
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function pick(pkg: SubscriptionPackage) {
    if (pending && pending.package_id === pkg.id) return setPaying(pending);
    if (live) return setSwitchTo(pkg);
    choose.mutate(pkg);
  }

  const plans = [...(packages.data?.packages ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const remaining = daysLeft(live?.current_period_end ?? null);
  const total = live?.package?.duration_days ?? 30;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Your plan"
        description="Your Techaven plan keeps your shop open for business. Pay securely with Airtel Money — no card needed."
      />

      {current.isLoading ? (
        <LoadingBlock rows={2} />
      ) : current.error ? (
        <ErrorBlock error={current.error} onRetry={() => current.refetch()} />
      ) : live ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 p-6 text-white md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                Current plan
              </p>
              <p className="mt-1 text-3xl font-extrabold">{live.package?.name}</p>
              <p className="mt-1 text-sm text-white/80">
                {mwk(live.package?.price_mwk)} / {PERIOD[live.package?.billing_period ?? "monthly"]}{" "}
                ·{" "}
                {live.cancel_at_period_end
                  ? `ends ${shortDate(live.current_period_end)}`
                  : `renews ${shortDate(live.current_period_end)}`}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
              <Icon name="check-circle-linear" className="h-4 w-4" />
              {live.cancel_at_period_end ? "Cancels at period end" : "Active"}
            </span>
          </div>
          {remaining != null ? (
            <div className="relative mt-6">
              <div className="flex justify-between text-xs text-white/75">
                <span>{remaining} days left</span>
                <span>{live.cancel_at_period_end ? "Auto-renew off" : "Auto-renew on"}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${Math.min(100, (remaining / total) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="relative mt-6 flex flex-wrap gap-2">
            {live.cancel_at_period_end ? (
              <button
                type="button"
                disabled={resume.isPending}
                onClick={() => resume.mutate()}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-white/90"
              >
                Keep my plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCancelling(true)}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/20"
              >
                Cancel at period end
              </button>
            )}
          </div>
        </section>
      ) : pending ? (
        <section className="flex flex-wrap items-center gap-4 rounded-3xl border-2 border-dashed border-red-200 bg-red-50/60 p-5 md:p-6">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
            <Icon name="clock-circle-linear" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-ink-800">
              {pending.package?.name} is waiting for payment
            </p>
            <p className="text-sm text-muted-foreground">
              Pay {mwk(pending.package?.price_mwk)} with Airtel Money to open your shop for
              business.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaying(pending)}
            className={cn(buttonClass.primary, "bg-red-600 hover:bg-red-700")}
          >
            <Icon name="smartphone-linear" className="h-4 w-4" />
            Pay with Airtel Money
          </button>
        </section>
      ) : (
        <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-surface p-5 md:p-6">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Icon name="danger-triangle-linear" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-ink-800">
              {sub?.effective_status === "expired"
                ? "Your plan has expired"
                : "You don't have a plan yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              Pick a plan below. Activation is instant once your Airtel Money payment goes through.
            </p>
          </div>
        </section>
      )}

      <div>
        <h2 className="text-lg font-extrabold text-ink-800">
          {live ? "Switch plan" : "Choose a plan"}
        </h2>
        {packages.isLoading ? (
          <div className="mt-3">
            <LoadingBlock rows={2} />
          </div>
        ) : packages.error ? (
          <ErrorBlock error={packages.error} />
        ) : !plans.length ? (
          <Panel className="mt-3">
            <EmptyState icon="card-linear" title="No plans available">
              Techaven hasn't published any plans yet.
            </EmptyState>
          </Panel>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {plans.map((pkg) => {
              const isCurrent = live?.package_id === pkg.id;
              const isPending = pending?.package_id === pkg.id;
              return (
                <article
                  key={pkg.id}
                  className={cn(
                    "relative flex flex-col rounded-3xl border bg-surface p-5 md:p-6",
                    pkg.is_featured
                      ? "border-brand-500 shadow-xl shadow-brand-500/10"
                      : "border-border",
                  )}
                >
                  {pkg.is_featured ? (
                    <span className="absolute -top-3 left-5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  ) : null}
                  <p className="text-sm font-bold text-brand-500">{pkg.name}</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink-800">
                    {mwk(pkg.price_mwk)}
                    <span className="text-sm font-semibold text-muted-foreground">
                      {" "}
                      / {PERIOD[pkg.billing_period]}
                    </span>
                  </p>
                  {pkg.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p>
                  ) : null}
                  <ul className="mt-4 flex-1 space-y-2">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-ink-800">
                        <Icon
                          name="check-circle-linear"
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                        />
                        {feature}
                      </li>
                    ))}
                    {pkg.trial_days ? (
                      <li className="text-xs font-semibold text-emerald-700">
                        + {pkg.trial_days}-day free trial
                      </li>
                    ) : null}
                  </ul>
                  <button
                    type="button"
                    disabled={isCurrent || choose.isPending}
                    onClick={() => pick(pkg)}
                    className={cn(
                      "mt-5 w-full",
                      isCurrent
                        ? buttonClass.secondary
                        : pkg.is_featured
                          ? buttonClass.primary
                          : buttonClass.secondary,
                    )}
                  >
                    {isCurrent
                      ? "Your current plan"
                      : isPending
                        ? "Complete payment"
                        : choose.isPending && choose.variables?.id === pkg.id
                          ? "Preparing…"
                          : live
                            ? `Switch to ${pkg.name}`
                            : `Choose ${pkg.name}`}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {current.data?.recent_subscriptions.length ? (
        <Panel title="Billing history" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {current.data.recent_subscriptions.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-800">
                    {item.package?.name ?? "Plan"} · {mwk(item.package?.price_mwk)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shortDate(item.current_period_start ?? item.created_at)} –{" "}
                    {shortDate(item.current_period_end)}
                    {item.payment_reference ? ` · ref ${item.payment_reference}` : ""}
                  </p>
                </div>
                <StatusPill status={item.payment_status} />
                <StatusPill status={item.effective_status} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="flex items-start gap-3 rounded-2xl bg-info-soft p-4 text-sm text-sky-900">
        <Icon name="shield-check-linear" className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Payments go straight from your Airtel Money wallet to Techaven. You approve every payment
          with your own PIN — Techaven never sees it.
        </p>
      </div>

      <AirtelPayDialog
        open={!!paying}
        onOpenChange={(open) => !open && setPaying(null)}
        shopId={shopId}
        subscription={paying}
        defaultPhone={session?.user.phone_number}
        onPaid={() => void refresh()}
      />

      <ReasonDialog
        open={!!switchTo}
        onOpenChange={(open) => !open && setSwitchTo(null)}
        tone="primary"
        title={`Switch to ${switchTo?.name ?? "this plan"}?`}
        description={`Your ${live?.package?.name ?? "current"} plan stops as soon as you switch, and ${switchTo?.name ?? "the new plan"} starts once your ${mwk(switchTo?.price_mwk)} Airtel Money payment goes through.`}
        confirmLabel="Switch and pay"
        onConfirm={async () => {
          if (switchTo) await choose.mutateAsync(switchTo);
        }}
      />

      <ReasonDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title="Cancel at the end of this period?"
        description={`Your shop stays open until ${shortDate(live?.current_period_end)}. You can change your mind before then.`}
        confirmLabel="Cancel plan"
        onConfirm={async () => {
          try {
            await subscriptionApi.cancel(shopId);
            toast.success("Your plan will end at the close of this period");
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
