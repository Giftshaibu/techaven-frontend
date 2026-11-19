import { createFileRoute } from "@tanstack/react-router";

import { PORTAL_THEMES, PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { requireStaffRole } from "@/lib/portal-guard";

export const Route = createFileRoute("/portal/delivery")({
  beforeLoad: requireStaffRole("delivery_agent"),
  head: () => ({
    meta: [{ title: "Rider · Techaven" }, { name: "theme-color", content: "#050526" }],
  }),
  component: DeliveryLayout,
});

const nav: PortalNavItem[] = [
  { to: "/portal/delivery", label: "Jobs", icon: "routing-2-linear", exact: true },
  { to: "/portal/delivery/history", label: "Earnings", icon: "wallet-money-linear" },
  { to: "/portal/delivery/profile", label: "Profile", icon: "user-circle-linear" },
];

function DeliveryLayout() {
  return <PortalShell theme={PORTAL_THEMES.delivery} nav={nav} mobileTabs />;
}
