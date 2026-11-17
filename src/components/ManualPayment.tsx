import { ImageStage } from "@/components/ImageStage";
import { Copy, Upload, Check } from "lucide-react";
import { brandLogoUrl } from "@/lib/brand-logos";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommerceConfig, getPaymentContext, submitPaymentProof } from "@/lib/manual-payments";
import { formatMwk } from "@/data/catalog";
export function ManualPayment({ orderId, footer }: { orderId: number | string; footer?: ReactNode }) {
  const config = useQuery({ queryKey: ["commerce-config"], queryFn: getCommerceConfig });
  const context = useQuery({
    queryKey: ["payment-context", orderId],
    queryFn: () => getPaymentContext(orderId),
    refetchInterval: 30000,
  });
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const key = useRef("");
  const [copied, setCopied] = useState<{ provider: string; account_number: string } | null>(null);
  const [opening, setOpening] = useState(false);
  const handoff = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(handoff.current), []);
  const [copyFailed, setCopyFailed] = useState(false);
  const [receiptName, setReceiptName] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const data = context.data,
    instructions = config.data?.manual_payment;
  const latest = data?.submissions[0];
  const deadline = data?.deadline ? Date.parse(data.deadline) : null;
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  const expired = data?.expired || remaining === 0;
  const references = data?.orders.map(order => order.reference).join(", ");
  const publicPhoto = data?.items?.map(item => item.product_image).find(image =>
    Boolean(image?.startsWith("https://") && !/^https:\/\/(?:localhost|127\.|0\.0\.0\.0)(?=[:/])/i.test(image)));
  function buildMessage(destination?: { provider: string; account_number: string } | null) {
    if (!data?.proof_url || !instructions?.whatsapp) return "";
    const lines = [
      `Hello Techaven, I am paying for ${data.summary || "my order"} (${references}).`,
      ...(destination ? [`Payment destination: ${destination.provider} · ${destination.account_number}`] : []),
      ...(publicPhoto ? ["", "Product photo", publicPhoto] : []),
      "", "Payment proof form", data.proof_url,
    ];
    return `https://wa.me/${instructions.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
  }
  const whatsappLink = copied || expired || latest?.status === "rejected"
    ? buildMessage(copied) || whatsapp || latest?.whatsapp_url || ""
    : !deadline ? whatsapp || latest?.whatsapp_url || "" : "";
  async function copyDestination(destination: { provider: string; account_number: string }) {
    window.clearTimeout(handoff.current);
    setOpening(false);
    setCopyFailed(false);
    try { await navigator.clipboard.writeText(destination.account_number); }
    catch { setCopyFailed(true); return; }
    setCopied(destination);
    const link = buildMessage(destination);
    if (!link) return;
    setOpening(true);
    handoff.current = window.setTimeout(() => {
      setOpening(false);
      window.open(link, "_self");
    }, 1500);
  }
  return (
    <section id="payment-proof"
      className="scroll-mt-24 min-w-0 rounded-xl border border-border bg-surface p-4 md:p-6"
      aria-labelledby="manual-payment-heading"
    >
      <h2 id="manual-payment-heading" className="text-lg font-bold">
        Payment details
      </h2>
      {data?.items?.length ? (
        <ul className="mt-3 divide-y divide-border">
          {data.items.map(item => <li key={item.id} className="flex items-center gap-3 py-2">
            <ImageStage src={item.product_image ?? undefined} className="size-12 shrink-0" />
            <p className="min-w-0 grow text-sm font-semibold">{item.product_name} <span className="font-normal text-muted-foreground">× {item.quantity}</span></p>
            <span className="text-sm font-semibold">{formatMwk(item.subtotal)}</span>
          </li>)}
        </ul>
      ) : data?.summary ? <p className="mt-3 text-sm font-semibold">{data.summary}</p> : null}
      {data && (
        <ul className="mt-3 space-y-2 text-sm">
          {data.orders.map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2">
              <Link
                to="/orders/$reference"
                params={{ reference: o.reference }}
                className="underline"
              >
                {o.reference}
              </Link>

            </li>
          ))}
        </ul>
      )}
      {data && <p className="mt-3 text-lg font-bold">
        {data.payable_order_ids.length > 0 ? "Total due" : "Order total"} · {formatMwk(data.payable_order_ids.length > 0
          ? Number(data.amount) : data.orders.reduce((sum, item) => sum + Number(item.total), 0))}
      </p>}
      {context.isError && (
        <p role="alert" className="mt-3 text-sm">
          Payment details could not load.{" "}
          <button type="button" onClick={() => context.refetch()} className="min-h-11 underline">
            Try again
          </button>
        </p>
      )}
      {latest?.status === "pending_review" && (
        <p role="status" className="mt-4 rounded-lg bg-stage p-3 text-sm">
          Your payment proof has been submitted for review. Techaven will contact you after checking
          it.
        </p>
      )}
      {latest?.status === "approved" && (
        <p role="status" className="mt-4 text-sm">
          Your payment has been approved.
        </p>
      )}
      {latest?.status === "rejected" && (
        <p role="status" className="mt-4 text-sm">
          Payment proof needs attention: {latest.rejection_reason}. You can submit a corrected
          receipt below.
        </p>
      )}
      {remaining !== null && latest?.status !== "pending_review" && latest?.status !== "approved" && (
        <p className="mt-3 text-sm font-semibold">
          {expired ? "Payment deadline passed. Contact Techaven if you already transferred funds."
            : `Time left to submit proof: ${[Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60].map(value => String(value).padStart(2, "0")).join(":")}`}
        </p>
      )}
      {instructions?.enabled && !expired &&
        data &&
        data.payable_order_ids.length > 0 &&
        latest?.status !== "pending_review" && (
          <>
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {(instructions.destinations ?? (instructions.account_number ? [{
                provider: instructions.provider ?? "Bank", account_name: instructions.account_name ?? "",
                account_number: instructions.account_number, brand: "",
              }] : [])).map(destination => {
                const logo = brandLogoUrl(destination.brand);
                return <li key={destination.account_number} className="flex items-center gap-3 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded border border-border text-xs font-semibold">
                    {logo ? <img alt="" src={logo} className="size-8 object-contain" onError={event => {
                      event.currentTarget.hidden = true;
                      event.currentTarget.parentElement?.querySelector("span")?.removeAttribute("hidden");
                    }} /> : null}
                    <span hidden={Boolean(logo)}>{destination.provider.split(" ").map(word => word[0]).slice(0, 3).join("")}</span>
                  </span>
                  <span className="min-w-0 grow text-sm">
                    <strong className="block">{destination.provider}</strong>
                    <span className="block">{destination.account_name}</span>
                    <span className="break-all tabular-nums">{destination.account_number}</span>
                  </span>
                  <button type="button" aria-label={`Copy ${destination.provider} account ${destination.account_number}`}
                    className="grid size-11 shrink-0 place-items-center rounded-lg border border-border disabled:opacity-50"
                    onClick={() => void copyDestination(destination)}><Copy size={18} aria-hidden /></button>
                </li>;
              })}
            </ul>
            {copyFailed && <p role="alert" className="mt-2 text-sm text-destructive">Copy failed. Select the number to copy it manually.</p>}
            {copied && <div className={`rounded-xl border border-border bg-surface p-4 ${opening ? "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm shadow-lg" : "mt-3"}`}>
              <p role="status" className="flex items-center gap-2 text-sm font-semibold"><Check size={17} aria-hidden /> Copied {copied.provider} · {copied.account_number}</p>
              {opening && <>
                <p className="mt-1 text-xs text-muted-foreground">Opening WhatsApp…</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand-500 motion-safe:animate-[payment-handoff_1.5s_linear_both]" />
                </div>
              </>}
              {whatsappLink && <a href={whatsappLink} onClick={() => { window.clearTimeout(handoff.current); setOpening(false); }} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline">Open WhatsApp</a>}
            </div>}
            <p className="mt-3 text-sm text-muted-foreground">Use your order reference and upload the receipt after you transfer.</p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const form = e.currentTarget,
                  body = new FormData(form);
                const file = body.get("receipt");
                if (
                  !(file instanceof File) ||
                  !file.size ||
                  file.size > 10 * 1024 * 1024 ||
                  !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
                ) {
                  setError("Choose a JPEG, PNG or PDF receipt, no larger than 10MB.");
                  return;
                }
                key.current ||= crypto.randomUUID();
                body.set("submission_key", key.current);
                body.set("order_ids", JSON.stringify(data.payable_order_ids));
                setBusy(true);
                setError("");
                try {
                  const result = await submitPaymentProof(body);
                  setWhatsapp(result.whatsapp_url || "");
                  await client.invalidateQueries({ queryKey: ["payment-context", orderId] });
                  client.invalidateQueries({ queryKey: ["orders"] });
                  form.reset();
                  setReceiptName("");
                  key.current = "";
                  if (!deadline && result.whatsapp_url) window.location.assign(result.whatsapp_url);
                } catch (error) {
                  setError(
                    error instanceof Error ? error.message : "Could not submit proof. Try again.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="text-sm font-semibold">
                Payer name
                <input
                  name="payer_name"
                  autoComplete="name"
                  required
                  maxLength={160}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
                />
              </label>
              <label className="text-sm font-semibold">
                Transaction reference
                <input
                  name="payment_reference"
                  required
                  maxLength={160}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
                />
              </label>
              <label className="text-sm font-semibold">
                Payment date
                <input
                  name="payment_date"
                  type="date"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border p-3"
                />
              </label>
              <label className="block min-w-0 text-sm font-semibold">
                <span>Payment receipt</span>
                <span className="relative mt-1 flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-stage focus-within:ring-2 focus-within:ring-brand-500">
                  <Upload size={19} aria-hidden="true" className="shrink-0 text-brand-500" />
                  <span className="min-w-0">
                    <span className="block truncate">{receiptName || "Choose a receipt"}</span>
                    <span id="receipt-file-types" className="block text-xs font-normal text-muted-foreground">JPEG, PNG or PDF · Up to 10 MB</span>
                  </span>
                  <input
                    name="receipt"
                    type="file"
                    aria-label="Upload payment receipt"
                    aria-describedby="receipt-file-types"
                    accept="image/jpeg,image/png,application/pdf"
                    required
                    onChange={event => setReceiptName(event.target.files?.[0]?.name ?? "")}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </span>
              </label>
              {error && (
                <p role="alert" className="sm:col-span-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                disabled={busy}
                className="min-h-11 rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit payment proof"}
              </button>
            </form>
          </>
        )}
      {instructions && !instructions.enabled && (
        <p className="mt-4 text-sm text-muted-foreground">
          Manual bank transfers are not available yet. Your existing order remains saved.
        </p>
      )}
      {!copied && whatsappLink && <a href={whatsappLink} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline">Open WhatsApp</a>}
      {footer}
    </section>
  );
}
