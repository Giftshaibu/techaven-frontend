import { Outlet, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';

import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountLayout,
});

const tabs = [
  { to: "/account", label: "Details", icon: "user-circle-linear" },
  { to: "/account/orders", label: "Orders", icon: "clipboard-list-linear" },
  { to: "/account/saved", label: "Saved", icon: "heart-linear" },
] as const;

function AccountLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    try {
    await signOut();
    await queryClient.cancelQueries();
    queryClient.clear();
    navigate({ to: "/auth", replace: true });
    } catch { toast.error('Could not sign out. Check your connection and try again.'); }
  }

  return (
    <section className="shell py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-normal text-brand-500">Your account</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">
            {user?.email}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-stage"
        >
          <Icon name="logout-2-linear" className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.to === "/account" }}
            activeProps={{ className: "border-brand-500 text-ink-800" }}
            inactiveProps={{ className: "border-transparent text-muted-foreground" }}
            className="-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold hover:text-ink-800"
          >
            <Icon name={tab.icon} className="h-[18px] w-[18px]" />
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </section>
  );
}
