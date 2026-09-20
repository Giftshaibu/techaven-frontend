import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { safeRedirect, useAuth } from "@/lib/auth";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Techaven" },
      {
        name: "description",
        content:
          "Sign in to Techaven to check out, save products and keep your delivery details for next time.",
      },
      { property: "og:title", content: "Sign in — Techaven" },
      {
        property: "og:description",
        content: "Sign in to Techaven to check out and track your orders.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect: redirectParam } = Route.useSearch();
  const destination = safeRedirect(redirectParam || undefined);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: destination, replace: true });
    }
  }, [session, loading, destination, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${destination}`,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        toast.success("Welcome to Techaven");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      window.sessionStorage.setItem("techaven.postAuthPath", destination);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in didn't work. Please try again.");
        return;
      }
      if (result.redirected) return;
    } catch {
      toast.error("Google sign-in didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <section className="shell flex min-h-[60vh] items-center justify-center py-14">
        <div className="max-w-md rounded-3xl bg-surface p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-info-soft text-brand-500">
            <Icon name="letter-linear" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink-800">Confirm your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-semibold">{email}</span>. Open it
            to finish creating your Techaven account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="shell py-12 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="max-w-md">
          <p className="text-sm font-semibold tracking-normal text-brand-500">Techaven account</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Your account keeps your delivery details ready, saves the products you like, and holds
            the history of every order you place on Techaven.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink-800">
            {[
              { icon: "bag-check-linear", text: "Faster checkout with saved delivery details" },
              { icon: "heart-linear", text: "Save products to come back to" },
              { icon: "clipboard-list-linear", text: "See every order you've placed" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-stage text-brand-500">
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-surface p-6 md:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-stage p-1 text-sm font-semibold">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  mode === m
                    ? "rounded-full bg-surface py-2 text-ink-800"
                    : "rounded-full py-2 text-muted-foreground"
                }
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink-800 hover:bg-stage disabled:opacity-60"
          >
            <Icon name="google-bold" className="h-[18px] w-[18px]" />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use your email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <>
                <Field
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  autoComplete="name"
                  required
                />
                <Field
                  label="Phone number"
                  value={phone}
                  onChange={setPhone}
                  type="tel"
                  placeholder="+265 ..."
                  autoComplete="tel"
                  required
                />
              </>
            ) : null}

            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-500 px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold tracking-normal text-ink-800">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-[15px] text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
