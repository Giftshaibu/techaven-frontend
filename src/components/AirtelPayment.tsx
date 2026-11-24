import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { ManualPayment } from "@/components/ManualPayment";
import { formatMwk } from "@/data/catalog";
import {
  getOrderAirtelStatus,
  getPaymentMethods,
  payOrderAirtel,
} from "@/integrations/techaven/customer";
import { airtelState, isAirtelNumber } from "@/lib/airtel";
import { getCommerceConfig, getPaymentContext } from "@/lib/manual-payments";

const POLL_MS = 4000;
const TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Pays an order with an Airtel Money prompt. A checkout across several shops creates one order
 * per shop and Airtel charges each order separately, so unpaid orders are paid one after another.
 * An order only counts as paid once the server says so (it is told by Airtel's webhook).
 */
export function AirtelPayment({
  orderId,
  footer,
}: {
  orderId: number | string;
  footer?: ReactNode;
}) {
  const client = useQueryClient();
  const [phone, setPhone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ orderId: number; at: number } | null>(null);
  const [error, setError] = useState("");
  const [useBank, setUseBank] = useState(false);

  const context = useQuery({
    queryKey: ["payment-context", orderId],
    queryFn: () => getPaymentContext(orderId),
    refetchInterval: sent ? POLL_MS : 30000,
  });
  const config = useQuery({ queryKey: ["commerce-config"], queryFn: getCommerceConfig });
  const methods = useQuery({ queryKey: ["payment-methods"], queryFn: getPaymentMethods });

  const data = context.data;
  const current = data?.orders.find((order) => data.payable_order_ids.includes(order.id));
  const waiting = Boolean(sent && current?.id === sent.orderId);

  const status = useQuery({
    queryKey: ["airtel-status", current?.id],
    queryFn: () => getOrderAirtelStatus(current!.id),
    enabled: Boolean(current),
    refetchInterval: waiting ? POLL_MS : false,
    retry: false,
    gcTime: 0,
  });
  const state = airtelState(status.data?.airtel);
  const confirmed = state === "paid";
  // A response from before this prompt was sent says nothing about it.
  const declined = state === "failed" && Boolean(sent && status.dataUpdatedAt > sent.at);

  useEffect(() => {
    if (!waiting || !declined) return;
    setSent(null);
    setError("The payment was declined or cancelled on the phone. No money was taken.");
  }, [waiting, declined]);

  useEffect(() => {
    if (!waiting || confirmed) return;
    const timer = window.setTimeout(() => {
      setSent(null);
      setError(
        "We haven’t heard back from Airtel yet. If you approved the payment, this order updates automatically. Don’t pay again.",
      );
    }, TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [waiting, confirmed, sent]);

  const allPaid = Boolean(
    data && !current && data.orders.some((order) => order.payment_status === "paid"),
  );
  useEffect(() => {
    if (allPaid) void client.invalidateQueries({ queryKey: ["orders"] });
  }, [allPaid, client]);

  const savedNumber =
    methods.data?.payment_methods.find(
      (method) => method.provider === "airtel" && isAirtelNumber(method.phone_number),
    )?.phone_number ?? "";
  const number = phone ?? savedNumber;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!current || sending) return;
    if (!isAirtelNumber(number)) {
      setError("Enter an Airtel Money number, e.g. 0991 234 567");
      return;
    }
    setError("");
    setSending(true);
    try {
      await payOrderAirtel(current.id, { msisdn: number.replace(/[\s-]/g, "") });
      setSent({ orderId: current.id, at: Date.now() });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the payment prompt.");
    } finally {
      setSending(false);
    }
  }

  const proofPending = data?.submissions[0]?.status === "pending_review";
  if (useBank || proofPending) return <ManualPayment orderId={orderId} footer={footer} />;

  return (
    <section
      id="airtel-payment"
      aria-labelledby="airtel-payment-heading"
      className="mx-auto max-w-xl scroll-mt-24 rounded-xl border border-border bg-surface p-4 md:p-6"
    >
      <h2 id="airtel-payment-heading" className="text-lg font-bold">
        Pay with Airtel Money
      </h2>
      {context.isLoading && <p className="mt-3 text-sm text-muted-foreground">Loading payment…</p>}
      {context.isError && (
        <p role="alert" className="mt-3 text-sm">
          Payment details could not load.{" "}
          <button type="button" onClick={() => context.refetch()} className="min-h-11 underline">
            Try again
          </button>
        </p>
      )}
      {data && (
        <ul className="mt-3 divide-y divide-border text-sm">
          {data.orders.map((order) => (
            <li key={order.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="font-semibold">{order.reference}</span>
              <span>
                {formatMwk(Number(order.total))} ·{" "}
                {order.payment_status === "paid"
                  ? "Paid"
                  : order.status === "cancelled"
                    ? "Cancelled"
                    : "Not paid"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data && data.payable_order_ids.length > 1 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Your basket covers {data.payable_order_ids.length} shops, so you’ll approve one prompt per
          order. Total due: {formatMwk(Number(data.amount))}.
        </p>
      )}

      {allPaid && (
        <p role="status" className="mt-4 rounded-lg bg-success-soft p-3 text-sm font-semibold">
          Payment received. Thank you!
        </p>
      )}

      {current && confirmed && (
        <p role="status" className="mt-4 rounded-lg bg-stage p-3 text-sm">
          Airtel has confirmed your payment for {current.reference}. We’re updating your order.
          Don’t pay again.
        </p>
      )}

      {current && waiting && !confirmed && (
        <div role="status" className="mt-5 rounded-lg bg-stage p-4 text-center">
          <Icon name="smartphone-linear" className="mx-auto size-9 text-brand-500" />
          <p className="mt-2 font-bold">Check your phone</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve {formatMwk(Number(current.total))} on {number} with your Airtel Money PIN. This
            page updates by itself.
          </p>
        </div>
      )}

      {current && !waiting && !confirmed && (
        <form onSubmit={send} className="mt-5 grid gap-3">
          <label className="text-sm font-semibold">
            Airtel Money number
            <input
              inputMode="tel"
              autoComplete="tel"
              value={number}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0991 234 567"
              className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
            />
          </label>
          <p className="text-sm text-muted-foreground">
            We’ll send a prompt to this phone. Enter your PIN there to approve.
          </p>
          <button
            disabled={sending}
            className="min-h-11 rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Sending prompt…" : `Pay ${formatMwk(Number(current.total))}`}
          </button>
        </form>
      )}
      {error && !confirmed && !allPaid && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {current && !waiting && !confirmed && config.data?.manual_payment.enabled && (
        <button
          type="button"
          onClick={() => setUseBank(true)}
          className="mt-3 min-h-11 text-sm font-semibold text-brand-700 underline"
        >
          Pay by bank transfer instead
        </button>
      )}
      {footer}
    </section>
  );
}
