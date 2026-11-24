import { createFileRoute } from "@tanstack/react-router";

import { PORTAL_THEMES, PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { requireStaffRole } from "@/lib/portal-guard";

export const Route = createFileRoute("/portal/admin")({
  beforeLoad: requireStaffRole("admin"),
  head: () => ({ meta: [{ title: "Control Tower · Techaven" }] }),
  component: AdminLayout,
});

const nav: PortalNavItem[] = [
  { to: "/portal/admin", label: "Overview", icon: "widget-2-linear", exact: true },
  { to: "/portal/admin/shops", label: "Shops", icon: "shop-2-linear" },
  { to: "/portal/admin/catalog", label: "Catalogue", icon: "layers-linear" },
  { to: "/portal/admin/orders", label: "Orders", icon: "bag-4-linear" },
  { to: "/portal/admin/users", label: "People", icon: "users-group-rounded-linear" },
  { to: "/portal/admin/subscriptions", label: "Subscriptions", icon: "card-linear" },
  { to: "/portal/admin/payouts", label: "Payouts", icon: "wallet-money-linear" },
  { to: "/portal/admin/settings", label: "Settings", icon: "settings-linear" },
  { to: "/portal/admin/activity", label: "Activity", icon: "history-linear" },
];

function AdminLayout() {
  return <PortalShell theme={PORTAL_THEMES.admin} nav={nav} />;
}
