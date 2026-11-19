import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { Icon } from "@/components/Icon";
import { buttonClass, errorMessage, inputClass, useStaffSession } from "@/components/portal/kit";
import {
  clearStaffSession,
  ROLE_HOME,
  staffLogin,
  type StaffRole,
} from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: PortalSignIn,
});

function safePortalRedirect(value: string | undefined, role: StaffRole) {
  const home = ROLE_HOME[role];
  return value && value.startsWith(home) ? value : home;
}

function PortalSignIn() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const session = useStaffSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const next = await staffLogin(email.trim(), password, remember);
      const role = next.user.role as StaffRole;
      await navigate({ to: safePortalRedirect(redirect, role), replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const signedInRole = session?.user.role as StaffRole | undefined;

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Brand side */}
      <section className="relative flex flex-col overflow-hidden bg-ink-900 px-6 py-8 text-white md:px-12 lg:min-h-screen lg:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl"
        />
        {/* Faint dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <Link
          to="/"
          className="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
        >
          <Icon name="alt-arrow-left-linear" className="h-4 w-4" /> Back to the storefront
        </Link>

        <div className="relative flex flex-1 flex-col items-center justify-center py-8">
          <div className="relative grid place-items-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <span className="absolute h-[22rem] w-[22rem] rounded-full border border-brand-300/15 md:h-[30rem] md:w-[30rem]" />
              <span className="absolute h-[15rem] w-[15rem] rounded-full border border-brand-300/20 md:h-[21rem] md:w-[21rem]" />
              <span className="absolute h-[15rem] w-[15rem] animate-ping rounded-full border border-brand-300/20 [animation-duration:3.5s] md:h-[21rem] md:w-[21rem]" />
              <span className="absolute h-48 w-48 rounded-full bg-brand-500/35 blur-3xl md:h-72 md:w-72" />
            </div>
            <img
              src="/map.png"
              alt="Map of Malawi showing Techaven delivery routes"
              className="relative h-64 w-auto select-none drop-shadow-[0_30px_60px_rgba(59,91,255,0.45)] md:h-[26rem] lg:h-[min(58vh,560px)]"
            />
          </div>
        </div>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center px-4 py-10 md:px-10">
        <div className="w-full max-w-md">
          {session && signedInRole && ROLE_HOME[signedInRole] ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="truncate text-sm font-bold text-ink-800">{session.user.name}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className={buttonClass.ghost}
                  onClick={() => clearStaffSession()}
                >
                  Switch
                </button>
                <Link to={ROLE_HOME[signedInRole]} className={buttonClass.primary}>
                  Continue <Icon name="arrow-right-linear" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}

          <h2 className="text-2xl font-extrabold tracking-tight text-ink-800">
            Sign in to the portal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and password.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-ink-800">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={cn(inputClass, "mt-1.5")}
                placeholder="you@techaven.mw"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-800">Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={cn(inputClass, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-ink-800"
                >
                  <Icon
                    name={showPassword ? "eye-closed-linear" : "eye-linear"}
                    className="h-[18px] w-[18px]"
                  />
                </button>
              </div>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-800">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Keep me signed in on this device
            </label>
            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-rose-900"
              >
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className={cn(buttonClass.primary, "w-full py-3")}
            >
              {busy ? (
                "Signing in…"
              ) : (
                <>
                  Sign in <Icon name="arrow-right-linear" className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Shopping on Techaven?{" "}
            <Link to="/auth" className="font-semibold text-brand-500 hover:underline">
              Use the customer sign-in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
