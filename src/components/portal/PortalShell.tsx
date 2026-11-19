import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { clearStaffSession } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

import { useStaffSession } from "./kit";

export type PortalNavItem = { to: string; label: string; icon: string; exact?: boolean };

type Theme = {
  name: string;
  tagline: string;
  mark: string;
  /** Sidebar look: dark control-room for admin, light studio for sellers. */
  dark: boolean;
};

export const PORTAL_THEMES = {
  admin: {
    name: "Control Tower",
    tagline: "Marketplace operations",
    mark: "radar-2-linear",
    dark: true,
  },
  seller: {
    name: "Shop Studio",
    tagline: "Run your Techaven shop",
    mark: "shop-2-linear",
    dark: false,
  },
  delivery: {
    name: "Rider",
    tagline: "Deliveries on the move",
    mark: "delivery-linear",
    dark: true,
  },
} satisfies Record<string, Theme>;

export function PortalShell({
  theme,
  nav,
  aside,
  mobileTabs = false,
}: {
  theme: Theme;
  nav: PortalNavItem[];
  aside?: ReactNode;
  mobileTabs?: boolean;
}) {
  const session = useStaffSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initials = (session?.user.name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function signOut() {
    clearStaffSession();
    queryClient.removeQueries({ queryKey: ["portal"] });
    void navigate({ to: "/portal", replace: true });
  }

  const linkBase =
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r md:flex",
          theme.dark
            ? "border-white/5 bg-ink-900 text-white"
            : "border-border bg-surface text-ink-800",
        )}
      >
        <div className="flex items-center gap-3 px-5 pb-6 pt-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 text-white shadow-lg shadow-brand-500/30">
            <Icon name={theme.mark} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold leading-tight tracking-tight">{theme.name}</p>
            <p
              className={cn(
                "truncate text-xs",
                theme.dark ? "text-white/50" : "text-muted-foreground",
              )}
            >
              {theme.tagline}
            </p>
          </div>
        </div>
        <nav
          className="flex-1 space-y-1 overflow-y-auto px-3"
          aria-label={`${theme.name} navigation`}
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              activeProps={{
                className: theme.dark ? "bg-white/10 text-white" : "bg-brand-100 text-brand-800",
              }}
              inactiveProps={{
                className: theme.dark
                  ? "text-white/60 hover:bg-white/5 hover:text-white"
                  : "text-muted-foreground hover:bg-stage hover:text-ink-800",
              }}
              className={linkBase}
            >
              <Icon name={item.icon} className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        {aside ? <div className="px-3 pb-3">{aside}</div> : null}
        <div
          className={cn(
            "m-3 flex items-center gap-3 rounded-2xl p-3",
            theme.dark ? "bg-white/5" : "bg-stage",
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{session?.user.name}</p>
            <p
              className={cn(
                "truncate text-xs",
                theme.dark ? "text-white/50" : "text-muted-foreground",
              )}
            >
              {session?.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className={cn(
              "rounded-lg p-2 transition-colors",
              theme.dark
                ? "text-white/60 hover:bg-white/10 hover:text-white"
                : "text-muted-foreground hover:bg-surface hover:text-ink-800",
            )}
          >
            <Icon name="logout-2-linear" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className={cn(
          "sticky top-0 z-30 md:hidden",
          theme.dark
            ? "bg-ink-900 text-white"
            : "border-b border-border bg-surface/95 text-ink-800 backdrop-blur",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 text-white">
            <Icon name={theme.mark} className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold leading-tight">{theme.name}</p>
            <p
              className={cn(
                "truncate text-xs",
                theme.dark ? "text-white/55" : "text-muted-foreground",
              )}
            >
              {session?.user.name}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-lg p-2 opacity-80 hover:opacity-100"
          >
            <Icon name="logout-2-linear" className="h-5 w-5" />
          </button>
        </div>
        {!mobileTabs ? (
          <nav
            className="flex gap-1 overflow-x-auto px-3 pb-2.5"
            aria-label={`${theme.name} sections`}
          >
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                activeProps={{
                  className: theme.dark ? "bg-white/15 text-white" : "bg-ink-800 text-white",
                }}
                inactiveProps={{
                  className: theme.dark ? "text-white/65" : "text-muted-foreground bg-stage",
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      <main className={cn("min-w-0 flex-1", mobileTabs && "pb-24 md:pb-0")}>
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-9">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tabs (thumb-friendly, used by the rider app) */}
      {mobileTabs ? (
        <nav
          aria-label={`${theme.name} tabs`}
          className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              activeProps={{ className: "text-brand-500" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold"
            >
              <Icon name={item.icon} className="h-6 w-6" />
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
