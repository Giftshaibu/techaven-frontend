import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Icon } from "@/components/Icon";
import { useStaffSession } from "@/components/portal/kit";
import { PORTAL_THEMES, PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { clearStaffSession, sellerApi } from "@/integrations/techaven/staff";
import { requireStaffRole } from "@/lib/portal-guard";

export const Route = createFileRoute("/portal/seller")({
  beforeLoad: requireStaffRole("seller"),
  head: () => ({ meta: [{ title: "Shop Studio · Techaven" }] }),
  component: SellerLayout,
});

const nav: PortalNavItem[] = [
  { to: "/portal/seller", label: "Today", icon: "widget-2-linear", exact: true, mobile: true },
  { to: "/portal/seller/listings", label: "Listings", icon: "tag-price-linear", mobile: true },
  { to: "/portal/seller/orders", label: "Orders", icon: "bag-4-linear", mobile: true },
  { to: "/portal/seller/earnings", label: "Earnings", icon: "wallet-money-linear", mobile: true },
  { to: "/portal/seller/reports", label: "Reports", icon: "chart-2-linear" },
  { to: "/portal/seller/plan", label: "Plan", icon: "card-linear" },
  { to: "/portal/seller/requests", label: "Requests", icon: "document-add-linear" },
  { to: "/portal/seller/shop", label: "My shop", icon: "shop-2-linear" },
];

function SellerLayout() {
  const status = useQuery({ queryKey: ["portal", "seller", "status"], queryFn: sellerApi.status });
  const approved = status.data?.onboarding_status === "approved";

  if (status.data && !approved)
    return (
      <OnboardingGate status={status.data.onboarding_status} shopName={status.data.shop?.name} />
    );
  return <PortalShell theme={PORTAL_THEMES.seller} nav={nav} aside={<StorefrontLink />} />;
}

function StorefrontLink() {
  return (
    <a
      href="/shops"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-4 text-white"
    >
      <Icon name="eye-linear" className="h-5 w-5" />
      <span className="flex-1 text-sm font-semibold leading-tight">
        See your shop as shoppers do
      </span>
      <Icon name="arrow-right-up-linear" className="h-4 w-4" />
    </a>
  );
}

const STEPS = ["Account created", "Shop details submitted", "Techaven review", "Start selling"];

function OnboardingGate({ status, shopName }: { status: string; shopName?: string | undefined }) {
  const session = useStaffSession();
  const rejected = status === "rejected";
  const current = status === "account_unverified" ? 0 : status === "no_shop" ? 1 : 2;
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 md:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
          <Icon name="shop-2-linear" className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-800">
          {rejected
            ? "Your application needs changes"
            : `Almost there${session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? "Techaven couldn't approve this shop yet. Contact support to find out what to update."
            : `${shopName ?? "Your shop"} is being reviewed by the Techaven team. Shop Studio unlocks once you're approved.`}
        </p>
        <ol className="mt-6 space-y-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={
                  index < current
                    ? "grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white"
                    : index === current
                      ? "grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700 ring-2 ring-brand-500"
                      : "grid h-7 w-7 place-items-center rounded-full bg-stage text-muted-foreground"
                }
              >
                {index < current ? (
                  <Icon name="check-read-linear" className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </span>
              <span
                className={
                  index <= current ? "font-semibold text-ink-800" : "text-muted-foreground"
                }
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex gap-2">
          <Link
            to="/help"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Contact support
          </Link>
          <button
            type="button"
            onClick={() => {
              clearStaffSession();
              window.location.assign("/portal");
            }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-stage"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
