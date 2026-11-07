import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { GoogleSignIn } from "./GoogleSignIn";
import { PaymentMethodForm, setupButton } from "./PaymentMethods";
import { getCustomerSetup, skipPaymentSetup, linkGoogle } from "@/integrations/techaven/customer";
import { useAuth } from "@/lib/auth";
import {
  excludesShoppingPrompt,
  guestPromptKey,
  safeShoppingDestination,
  setupReturnKey,
} from "@/lib/customer-experience";

function remember(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* memory state still works without storage */
  }
}
function recall(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function CustomerExperience() {
  const { user, loading, setSessionFromAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [guestOpen, setGuestOpen] = useState(false);
  const [linkChallenge, setLinkChallenge] = useState<string | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const prompted = useRef(false);
  const destination = useRef("/");
  const [addressOpened, setAddressOpened] = useState(false);
  const [manualPayment, setManualPayment] = useState(false);
  const [paymentFinished, setPaymentFinished] = useState(false);
  const setup = useQuery({
    queryKey: ["customer-setup", user?.id],
    queryFn: getCustomerSetup,
    enabled: Boolean(user),
    staleTime: 30000,
  });
  const isAccount = /^\/account\/?$/.test(location.pathname);
  const isPublicHelp = /^\/(help|privacy|terms)(\/|$)/.test(location.pathname);
  const needsAddress = Boolean(user && setup.data?.requires_address);
  const addressOpen =
    needsAddress && !isPublicHelp && !addressOpened && location.pathname !== "/auth";
  const paymentOpen = Boolean(
    user &&
    !needsAddress &&
    (manualPayment ||
      (setup.data?.offer_payment_setup &&
        !paymentFinished &&
        !isPublicHelp &&
        location.pathname !== "/auth")),
  );
  useEffect(() => {
    if (!isAccount) setAddressOpened(false);
  }, [isAccount]);
  useEffect(() => {
    setPaymentFinished(false);
    setManualPayment(false);
    setGuestOpen(false);
  }, [user?.id]);
  useEffect(() => {
    destination.current = `${location.pathname}${location.searchStr || ""}${location.hash ? `#${location.hash}` : ""}`;
    if (needsAddress && !isAccount && !isPublicHelp && location.pathname !== "/auth")
      remember(setupReturnKey, destination.current);
  }, [location.pathname, location.searchStr, location.hash, needsAddress, isAccount, isPublicHelp]);
  useEffect(() => {
    const open = () => setManualPayment(true);
    window.addEventListener("techaven:payment-setup", open);
    return () => window.removeEventListener("techaven:payment-setup", open);
  }, []);
  useEffect(() => {
    if (
      loading ||
      user ||
      excludesShoppingPrompt(location.pathname) ||
      prompted.current ||
      recall(guestPromptKey)
    )
      return;
    const trigger = (event: Event) => {
      if (prompted.current || recall(guestPromptKey)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (document.querySelector('[role="dialog"]')) return;
      const link = target?.closest("a");
      if (link) {
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || excludesShoppingPrompt(url.pathname)) return;
        destination.current = `${url.pathname}${url.search}${url.hash}`;
      }
      prompted.current = true;
      remember(guestPromptKey, "shown");
      setGuestOpen(true);
    };
    // Let the original action run, preserving search text, navigation and click intent.
    const click = (event: MouseEvent) => {
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.button === 0 &&
        event.target instanceof Element &&
        event.target.closest("main,header")
      )
        trigger(event);
    };
    window.addEventListener("scroll", trigger, { passive: true, once: true });
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("scroll", trigger);
      document.removeEventListener("click", click, true);
    };
  }, [loading, user, location.pathname]);
  function finishPayment() {
    setPaymentFinished(true);
    setManualPayment(false);
    const returnTo = recall(setupReturnKey);
    try {
      sessionStorage.removeItem(setupReturnKey);
    } catch {
      /* optional storage */
    }
    if (returnTo && isAccount) void navigate({ to: safeShoppingDestination(returnTo) });
  }
  const linking = useMutation({
    mutationFn: () => linkGoogle({ linking_challenge: linkChallenge!, password: linkPassword }),
    onSuccess: (session) => {
      setSessionFromAuth(session);
      setGuestOpen(false);
      setLinkChallenge(null);
      setLinkPassword("");
      void navigate({ to: safeShoppingDestination(destination.current) });
    },
  });
  const skip = useMutation({
    mutationFn: skipPaymentSetup,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["customer-setup"] });
      finishPayment();
    },
  });
  function closePayment() {
    if (setup.data?.offer_payment_setup) skip.mutate();
    else setManualPayment(false);
  }
  return (
    <>
      <Dialog open={guestOpen && !user} onOpenChange={setGuestOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-surface p-6 sm:p-8 [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center">
          <img src="/techaven-logo-transparent.png" alt="Techaven" className="mb-2 h-7 w-auto" />
          <DialogTitle className="pr-8 text-2xl font-bold">Make yourself at home</DialogTitle>
          <DialogDescription>
            Sign in to save your favourites, delivery details and orders.
          </DialogDescription>
          {linkChallenge ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                linking.mutate();
              }}
            >
              <label className="text-sm">
                Confirm your existing account password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={linkPassword}
                  onChange={(event) => setLinkPassword(event.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border border-border px-3"
                />
              </label>
              {linking.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  {linking.error.message}
                </p>
              ) : null}
              <button disabled={linking.isPending} className={setupButton}>
                {linking.isPending ? "Linking…" : "Link Google and sign in"}
              </button>
            </form>
          ) : (
            <GoogleSignIn
              onAuth={(session) => {
                setSessionFromAuth(session);
                setGuestOpen(false);
                void navigate({ to: safeShoppingDestination(destination.current) });
              }}
              onLink={setLinkChallenge}
            />
          )}
          <button
            className={setupButton}
            onClick={() => {
              setGuestOpen(false);
              void navigate({
                to: "/auth",
                search: { redirect: safeShoppingDestination(destination.current) },
              });
            }}
          >
            Sign in with email
          </button>
          <button
            className="min-h-11 text-sm font-semibold text-ink-800 underline"
            onClick={() => setGuestOpen(false)}
          >
            Continue browsing
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={addressOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddressOpened(true);
            void navigate({ to: "/account" });
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl bg-surface p-6 sm:p-8 [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center">
          <DialogTitle className="pr-8 text-2xl font-bold">Where should we deliver?</DialogTitle>
          <DialogDescription>
            Welcome to Techaven. Add your delivery address to finish setting up your account. You
            can type it or choose your location on the map.
          </DialogDescription>
          <button
            className={setupButton}
            onClick={() => {
              setAddressOpened(true);
              void navigate({ to: "/account" });
            }}
          >
            Add my address
          </button>
          <p className="text-xs text-muted-foreground">
            Next: choose whether to save a mobile-money number.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={paymentOpen}
        onOpenChange={(open) => {
          if (!open && !skip.isPending) closePayment();
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-surface p-6 sm:p-8 [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center">
          <DialogTitle className="pr-8 text-2xl font-bold">Add mobile money?</DialogTitle>
          <DialogDescription>
            Save a number for future payments. This step is optional.
          </DialogDescription>
          <PaymentMethodForm onSaved={finishPayment} />
          {skip.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {skip.error.message}
            </p>
          ) : null}
          <button
            className="min-h-11 text-sm font-semibold underline"
            disabled={skip.isPending}
            onClick={closePayment}
          >
            {skip.isPending ? "Saving…" : "Not now"}
          </button>
        </DialogContent>
      </Dialog>
      {user && setup.isError ? (
        <div
          role="alert"
          className="fixed bottom-4 left-4 z-40 max-w-sm rounded-xl border border-border bg-surface p-4 text-sm shadow-lg"
        >
          Account setup couldn’t load.{" "}
          <button className="min-h-11 underline" onClick={() => void setup.refetch()}>
            Retry
          </button>
        </div>
      ) : null}
    </>
  );
}
