import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { forgotPassword, linkGoogle, login, registerCustomer, resendOtp, resetPassword, verifyOtp } from "@/integrations/techaven/customer";
import { TechavenApiError } from '@/integrations/techaven/client';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import type { AuthPayload } from "@/integrations/techaven/types";
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
  const { user, loading, setSessionFromAuth } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [linkingChallenge, setLinkingChallenge] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<'request' | 'reset' | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: destination, replace: true });
    }
  }, [user, loading, destination, navigate]);

  function applyAuth(data: AuthPayload | { success: true }) {
    if ("access_token" in data && data.user) {
      setSessionFromAuth(data);
      toast.success("Welcome to Techaven");
      navigate({ to: destination, replace: true });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await registerCustomer({
          full_name: fullName,
          email,
          phone_number: phone,
          password,
        });
        setOtpStep(true);
        toast.success("Check your email for a six-digit verification code");
        return;
      }
      const data = await login({ email, password });
      applyAuth(data);
    } catch (error) {
      const code = error instanceof TechavenApiError ? (error.body as { code?: string })?.code : undefined;
      if (code === 'EMAIL_UNVERIFIED') {
        try { await resendOtp({ email, type: 'signup' }); setOtpStep(true); }
        catch (sendError) { toast.error(sendError instanceof Error ? sendError.message : 'Unable to send a code'); }
      }
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await verifyOtp({ email, otp, type: "signup" });
      applyAuth(data as AuthPayload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  if (otpStep) {
    return (
      <section className="shell flex min-h-[60vh] items-center justify-center py-14">
        <div className="w-full max-w-md rounded-3xl bg-surface p-8">
          <h1 className="text-2xl font-extrabold text-ink-800">Enter verification code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the six-digit code sent to <span className="font-semibold">{email}</span>. It expires in ten minutes.
          </p>
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <Field label="Code" value={otp} onChange={setOtp} required placeholder="123456" autoComplete="one-time-code" />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-500 px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify and continue"}
            </button>
          </form>
          <button type="button" disabled={busy} className="mt-4 text-sm underline" onClick={async () => {
            setBusy(true);
            try { await resendOtp({ email, type: 'signup' }); toast.success('Check your email for a new code'); }
            catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to resend'); }
            finally { setBusy(false); }
          }}>Resend code</button>
          <button type="button" className="ml-4 text-sm underline" onClick={() => { setOtpStep(false); setOtp(''); }}>Back to sign in</button>
        </div>
      </section>
    );
  }

  if (linkingChallenge || recovery) return <section className="shell flex min-h-[60vh] items-center justify-center py-14">
    <div className="w-full max-w-md rounded-3xl bg-surface p-8">
      <h1 className="text-2xl font-extrabold text-ink-800">{linkingChallenge ? 'Confirm your existing account' : 'Reset your password'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{linkingChallenge ? 'Enter your existing Techaven password to connect Google and keep your orders and saved products.' : recovery === 'reset' ? 'Enter the six-digit email code and your new password. The code expires in ten minutes.' : 'Enter your email to request a password reset code.'}</p>
      <form className="mt-6 space-y-4" onSubmit={async event => {
        event.preventDefault(); setBusy(true);
        try {
          if (linkingChallenge) applyAuth(await linkGoogle({ linking_challenge: linkingChallenge, password }));
          else if (recovery === 'request') { await forgotPassword({ email }); setRecovery('reset'); toast.success('If your account is eligible, a code has been emailed'); }
          else { await resetPassword({ email, otp, new_password: password }); setRecovery(null); setPassword(''); setOtp(''); toast.success('Password updated. Sign in again.'); }
        } catch (error) { toast.error(error instanceof Error ? error.message : 'Please try again'); }
        finally { setBusy(false); }
      }}>
        {!linkingChallenge ? <Field label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" /> : null}
        {recovery === 'reset' ? <Field label="Code" value={otp} onChange={setOtp} required autoComplete="one-time-code" placeholder="123456" /> : null}
        {linkingChallenge || recovery === 'reset' ? <Field label={linkingChallenge ? 'Existing password' : 'New password (at least 12 characters)'} type="password" value={password} onChange={setPassword} required autoComplete={linkingChallenge ? 'current-password' : 'new-password'} /> : null}
        <button disabled={busy} className="w-full rounded-lg bg-brand-500 px-5 py-3.5 font-semibold text-white disabled:opacity-60">{busy ? 'Please wait…' : linkingChallenge ? 'Connect Google and sign in' : recovery === 'request' ? 'Send reset code' : 'Update password'}</button>
      </form>
      <button className="mt-4 text-sm underline" onClick={() => { setLinkingChallenge(null); setRecovery(null); setPassword(''); setOtp(''); }}>Back to sign in</button>
      {linkingChallenge ? <button className="ml-4 text-sm underline" onClick={() => { setLinkingChallenge(null); setRecovery('request'); setPassword(''); }}>Forgot password?</button> : null}
    </div>
  </section>;

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
              label={mode === 'signup' ? 'Password (at least 12 characters)' : 'Password'}
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
          {mode === 'signin' ? <button type="button" className="mt-4 text-sm underline" onClick={() => { setRecovery('request'); setPassword(''); }}>Forgot password?</button> : null}
          <GoogleSignIn onAuth={applyAuth} onLink={challenge => { setLinkingChallenge(challenge); setPassword(''); }} />
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
