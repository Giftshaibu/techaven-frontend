import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { clearStaffSession } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

import { useStaffSession } from "./kit";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  /** Shown in the phone's bottom bar; the rest live under "More". */
  mobile?: boolean;
};

type Theme = {
  name: string;
  /** Shown under the Techaven logo, e.g. "Admin portal". */
  portal: string;
  tagline: string;
  /** Sidebar look: dark control-room for admin, light studio for sellers. */
  dark: boolean;
};

export const PORTAL_THEMES = {
  admin: { name: "Control Tower", portal: "Admin portal", tagline: "Marketplace operations", dark: true },
  seller: { name: "Shop Studio", portal: "Seller portal", tagline: "Run your Techaven shop", dark: false },
  delivery: { name: "Rider", portal: "Rider app", tagline: "Deliveries on the move", dark: true },
} satisfies Record<string, Theme>;

const BOTTOM_SLOTS = 4;

/** The TECHAVEN wordmark: brand colours on light surfaces, white on dark ones. */
function Logo({ dark, className }: { dark: boolean; className?: string }) {
  return (
    <img
      src="/techaven-logo-transparent.png"
      alt="Techaven"
      draggable={false}
      className={cn("w-auto select-none", dark && "brightness-0 invert", className)}
    />
  );
}

export function PortalShell({
  theme,
  nav,
  aside,
}: {
  theme: Theme;
  nav: PortalNavItem[];
  aside?: ReactNode;
}) {
  const session = useStaffSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);

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

  // Phone bottom bar: everything when it fits, otherwise the marked items plus "More".
  const fits = nav.length <= BOTTOM_SLOTS + 1;
  const primary = fits ? nav : (nav.some((i) => i.mobile) ? nav.filter((i) => i.mobile) : nav).slice(0, BOTTOM_SLOTS);
  const overflow = fits ? [] : nav.filter((item) => !primary.includes(item));
  const isActive = (item: PortalNavItem) =>
    item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname === item.to || pathname.startsWith(`${item.to}/`);
  const moreActive = overflow.some(isActive);

  const linkBase = "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r md:flex",
          theme.dark ? "border-white/5 bg-ink-900 text-white" : "border-border bg-surface text-ink-800",
        )}
      >
        <div className="px-5 pb-5 pt-4">
          <Link to="/" title="Techaven storefront" className="inline-block">
            <Logo dark={theme.dark} className="-ml-3 h-11" />
          </Link>
          <p
            className={cn(
              "mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
              theme.dark ? "bg-white/10 text-white/80" : "bg-brand-100 text-brand-700",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
            {theme.portal}
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label={`${theme.portal} navigation`}>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              activeProps={{ className: theme.dark ? "bg-white/10 text-white" : "bg-brand-100 text-brand-800" }}
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
        <div className={cn("m-3 flex items-center gap-3 rounded-2xl p-3", theme.dark ? "bg-white/5" : "bg-stage")}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{session?.user.name}</p>
            <p className={cn("truncate text-xs", theme.dark ? "text-white/50" : "text-muted-foreground")}>
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
              theme.dark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-surface hover:text-ink-800",
            )}
          >
            <Icon name="logout-2-linear" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* Phone top app bar */}
      <header
        className={cn(
          "sticky top-0 z-30 flex items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden",
          theme.dark ? "bg-ink-900 text-white" : "border-b border-border bg-surface/95 text-ink-800 backdrop-blur",
        )}
      >
        <Link to="/" title="Techaven storefront" className="shrink-0">
          <Logo dark={theme.dark} className="-ml-2 h-8" />
        </Link>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            theme.dark ? "bg-white/10 text-white/80" : "bg-brand-100 text-brand-700",
          )}
        >
          {theme.portal}
        </span>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Account and more"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white"
        >
          {initials}
        </button>
      </header>

      <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-9">
          <Outlet />
        </div>
      </main>

      {/* Phone bottom navigation bar (Android-style: icon in an active pill, label below) */}
      <nav
        aria-label={`${theme.portal} tabs`}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 grid border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden",
          theme.dark ? "border-white/5 bg-ink-900 text-white" : "border-border bg-surface",
        )}
        style={{ gridTemplateColumns: `repeat(${primary.length + (overflow.length ? 1 : 0)}, minmax(0, 1fr))` }}
      >
        {primary.map((item) => (
          <BottomTab key={item.to} to={item.to} label={item.label} icon={item.icon} active={isActive(item)} dark={theme.dark} />
        ))}
        {overflow.length ? (
          <BottomTab
            label="More"
            icon="hamburger-menu-linear"
            active={moreActive || moreOpen}
            expanded={moreOpen}
            dark={theme.dark}
            onClick={() => setMoreOpen(true)}
          />
        ) : null}
      </nav>

      {/* "More" bottom sheet: the remaining sections, account and sign out */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 md:hidden">
          <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
          <SheetTitle className="sr-only">{theme.portal} menu</SheetTitle>
          <SheetDescription className="sr-only">All sections, your account and sign out.</SheetDescription>
          <div className="flex items-center gap-3 rounded-2xl bg-stage p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink-800">{session?.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user.email ?? theme.tagline}</p>
            </div>
          </div>
          {overflow.length ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {overflow.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-xs font-semibold transition-colors",
                    isActive(item) ? "bg-brand-100 text-brand-800" : "bg-surface text-ink-800 ring-1 ring-border hover:bg-stage",
                  )}
                >
                  <Icon name={item.icon} className="h-6 w-6" />
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
          {aside ? <div className="mt-4">{aside}</div> : null}
          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            <Icon name="logout-2-linear" className="h-5 w-5" />
            Sign out
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BottomTab({
  to,
  label,
  icon,
  active,
  dark,
  expanded = false,
  onClick,
}: {
  expanded?: boolean;
  to?: string;
  label: string;
  icon: string;
  active: boolean;
  dark: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        className={cn(
          "grid h-8 w-14 place-items-center rounded-full transition-colors",
          active ? (dark ? "bg-white/15" : "bg-brand-100 text-brand-700") : "",
        )}
      >
        <Icon name={icon} className="h-[22px] w-[22px]" />
      </span>
      <span className={cn("max-w-full truncate px-1", active && "font-bold")}>{label}</span>
    </>
  );
  const className = cn(
    "flex min-h-16 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] font-semibold",
    active ? (dark ? "text-white" : "text-ink-800") : dark ? "text-white/55" : "text-muted-foreground",
  );
  return to ? (
    <Link to={to} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className} aria-haspopup="dialog" aria-expanded={expanded}>
      {content}
    </button>
  );
}
