import { useEffect, useRef, useState, type FormEvent } from "react";

import { Icon } from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { subscriptionApi, type ShopSubscription } from "@/integrations/techaven/staff";
import { isAirtelNumber } from "@/lib/airtel";
import { cn } from "@/lib/utils";

import { buttonClass, errorMessage, inputClass, mwk, shortDate } from "./kit";

type Phase = "phone" | "sending" | "waiting" | "paid" | "failed";

const POLL_MS = 4000;
const TIMEOUT_MS = 3 * 60 * 1000;
const RESEND_AFTER_MS = 45 * 1000;

/**
 * Pays a pending shop subscription with an Airtel Money USSD push, then polls the server
 * (which enquires Airtel and activates the plan) until the seller approves on their phone.
 */
export function AirtelPayDialog({
  open,
  onOpenChange,
  shopId,
  subscription,
  defaultPhone,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: number;
  subscription: ShopSubscription | null;
  defaultPhone?: string | null | undefined;
  onPaid: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [paidSub, setPaidSub] = useState<ShopSubscription | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => {
    if (open) {
      setPhase("phone");
      setError(null);
      setPaidSub(null);
      setPhone(
        (current) => current || (defaultPhone && isAirtelNumber(defaultPhone) ? defaultPhone : ""),
      );
    } else {
      stopPolling();
    }
  }, [open, defaultPhone]);

  useEffect(() => stopPolling, []);

  // Clock for the waiting screen (countdown + resend availability).
  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  function startPolling(subscriptionId: number) {
    stopPolling();
    const began = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const result = await subscriptionApi.airtelStatus(shopId, subscriptionId);
        if (result.state === "paid") {
          stopPolling();
          setPaidSub(result.subscription);
          setPhase("paid");
          onPaid();
        } else if (result.state === "failed" || result.state === "error") {
          stopPolling();
          setError(
            result.state === "failed"
              ? "The payment was declined or cancelled on the phone. No money was taken."
              : "Airtel confirmed the payment but the plan could not be activated. Contact Techaven support.",
          );
          setPhase("failed");
        } else if (Date.now() - began > TIMEOUT_MS) {
          stopPolling();
          setError(
            "We didn't hear back from Airtel in time. If you approved the payment, your plan activates automatically once Airtel confirms.",
          );
          setPhase("failed");
        }
      } catch {
        // Transient network errors: keep polling until timeout.
      }
    }, POLL_MS);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (!subscription) return;
    if (!isAirtelNumber(phone)) {
      setError("Enter an Airtel Money number, e.g. 0991 234 567");
      return;
    }
    setError(null);
    setPhase("sending");
    try {
      const result = await subscriptionApi.payWithAirtel(shopId, subscription.id, phone);
      if (result.state === "paid") {
        setPaidSub(result.subscription);
        setPhase("paid");
        onPaid();
        return;
      }
      setStartedAt(Date.now());
      setNow(Date.now());
      setPhase("waiting");
      startPolling(subscription.id);
    } catch (caught) {
      setError(errorMessage(caught));
      setPhase("phone");
    }
  }

  const pkg = subscription?.package;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, Math.ceil((TIMEOUT_MS - elapsed) / 1000));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (phase === "sending" ? undefined : onOpenChange(next))}
    >
      <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <div className="bg-gradient-to-br from-rose-600 to-red-700 px-6 pb-5 pt-6 text-white">
          <DialogHeader className="text-left">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Icon name="smartphone-linear" className="h-3.5 w-3.5" />
              Airtel Money
            </p>
            <DialogTitle className="mt-3 text-xl font-extrabold text-white">
              {pkg ? `${pkg.name} plan` : "Subscription"}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {pkg
                ? `${pkg.duration_days} days of selling on Techaven`
                : "Pay to activate your plan"}
            </DialogDescription>
          </DialogHeader>
          <p className="mt-3 text-3xl font-extrabold tabular-nums">{mwk(pkg?.price_mwk)}</p>
        </div>

        <div className="px-6 pb-6 pt-5">
          {phase === "phone" || phase === "sending" ? (
            <form onSubmit={send} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink-800">Airtel Money number</span>
                <div className="relative mt-1.5">
                  <Icon
                    name="phone-linear"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    autoFocus
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0991 234 567"
                    className={cn(inputClass, "pl-10 text-base tracking-wide")}
                    aria-invalid={!!error}
                  />
                </div>
              </label>
              <ol className="space-y-2 rounded-xl bg-stage p-3 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-ink-800">1.</span>We send a payment prompt to this
                  phone.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-ink-800">2.</span>Enter your Airtel Money PIN on
                  the phone to approve.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-ink-800">3.</span>Your plan activates as soon as
                  Airtel confirms.
                </li>
              </ol>
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
                disabled={phase === "sending"}
                className={cn(
                  buttonClass.primary,
                  "w-full bg-red-600 py-3 text-base hover:bg-red-700",
                )}
              >
                {phase === "sending" ? "Sending prompt…" : `Pay ${mwk(pkg?.price_mwk)}`}
              </button>
            </form>
          ) : null}

          {phase === "waiting" ? (
            <div className="text-center">
              <div className="relative mx-auto grid h-24 w-24 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-red-200 opacity-60" />
                <span className="relative grid h-20 w-20 place-items-center rounded-full bg-red-50 text-red-600 ring-4 ring-red-100">
                  <Icon name="smartphone-linear" className="h-9 w-9" />
                </span>
              </div>
              <p className="mt-4 text-lg font-extrabold text-ink-800">Check your phone</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Approve the {mwk(pkg?.price_mwk)} request on{" "}
                <strong className="text-ink-800">{phone}</strong> with your Airtel Money PIN.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-stage px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                Waiting for Airtel · {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, "0")}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  className={buttonClass.secondary}
                  onClick={() => {
                    stopPolling();
                    setPhase("phone");
                  }}
                >
                  Change number
                </button>
                <button
                  type="button"
                  className={buttonClass.secondary}
                  disabled={elapsed < RESEND_AFTER_MS}
                  onClick={() => void send()}
                >
                  {elapsed < RESEND_AFTER_MS
                    ? `Resend in ${Math.ceil((RESEND_AFTER_MS - elapsed) / 1000)}s`
                    : "Resend prompt"}
                </button>
              </div>
            </div>
          ) : null}

          {phase === "paid" ? (
            <div className="text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-soft text-emerald-600 ring-4 ring-emerald-100">
                <Icon name="check-circle-bold" className="h-10 w-10" />
              </span>
              <p className="mt-4 text-lg font-extrabold text-ink-800">You're subscribed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {paidSub?.package?.name ?? pkg?.name} is active
                {paidSub?.current_period_end
                  ? ` until ${shortDate(paidSub.current_period_end)}`
                  : ""}
                .
              </p>
              <button
                type="button"
                className={cn(buttonClass.primary, "mt-5 w-full")}
                onClick={() => onOpenChange(false)}
              >
                Done
              </button>
            </div>
          ) : null}

          {phase === "failed" ? (
            <div className="text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-danger-soft text-rose-600">
                <Icon name="danger-triangle-linear" className="h-9 w-9" />
              </span>
              <p className="mt-4 text-lg font-extrabold text-ink-800">Payment not completed</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={buttonClass.secondary}
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={cn(buttonClass.primary, "bg-red-600 hover:bg-red-700")}
                  onClick={() => {
                    setError(null);
                    setPhase("phone");
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
