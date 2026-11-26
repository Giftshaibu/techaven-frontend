import { Landmark } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getCommerceConfig, submitPaymentProof } from "@/lib/manual-payments";
import { BankProofFields } from "@/components/BankProofFields";
import { bankProofProblem, emptyBankProof, toProofPayload, type BankProof } from "@/lib/bank-proof";
import { AddressDrawer } from "@/components/AddressDrawer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { formatMwk } from "@/data/catalog";
import type { CatalogProduct } from "@/lib/catalog-api";
import {
  addShippingAddress,
  createOrder,
  getCourierServices,
  getProfile,
  getShippingAddresses,
} from "@/integrations/techaven/customer";
import { useAuth } from "@/lib/auth";
import { apiAddressToForm, formToApiBody, validDistrict, type AddressForm } from "@/lib/addresses-ui";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Techaven" },
      {
        name: "description",
        content: "Confirm delivery details, choose how to pay and place your Techaven order.",
      },
      { property: "og:title", content: "Checkout — Techaven" },
      { property: "og:description", content: "Complete your Techaven purchase." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Step = 1 | 2 | 3;

const paymentOptions = [
  { id: "airtel", label: "Airtel Money", logo: "/airtel.jpg", hint: "Place the order, then approve the payment prompt on your phone." },
  { id: "tnm-mpamba", label: "TNM Mpamba", logo: "/tnm.jpeg", hint: "Pay from your Mpamba wallet." },
  { id: "bank-transfer", label: "Bank transfer", logo: null, hint: "Transfer to our account, then enter the payment details and upload your proof of payment. We confirm the order once it’s verified." },
] as const;

type PaymentId = (typeof paymentOptions)[number]["id"];
/** Payment options shown to shoppers but not yet connected to a provider. */
const COMING_SOON: ReadonlySet<PaymentId> = new Set(["tnm-mpamba"]);

const emptyAddress: AddressForm = {
  label: "Home",
  recipient: "",
  phone: "",
  city: "",
  area: "",
  street: "",
  notes: "",
};

function CheckoutPage() {
  const { lines, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const commerceConfig = useQuery({ queryKey: ["commerce-config"], queryFn: getCommerceConfig });
  const [step, setStep] = useState<Step>(1);
  const [addressId, setAddressId] = useState<number | "new">("new");
  const [form, setForm] = useState(emptyAddress);
  const [addressOpen, setAddressOpen] = useState(false);

  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<PaymentId>("airtel");
  const [courierId, setCourierId] = useState<number | null>(null);
  const [bankProof, setBankProof] = useState<BankProof>(() => emptyBankProof());
  const couriers = useQuery({ queryKey: ["courier-services"], queryFn: getCourierServices });
  const chosenCourier = couriers.data?.find((courier) => courier.id === courierId) ?? null;
  const manualPaymentAvailable = commerceConfig.data?.manual_payment.enabled === true;
  const isAvailable = (id: PaymentId) =>
    !COMING_SOON.has(id) && (id === "airtel" || manualPaymentAvailable);
  const bankProblem = payment === "bank-transfer" ? bankProofProblem(bankProof) : null;
  const canPay = isAvailable(payment) && !bankProblem;
  const manual = commerceConfig.data?.manual_payment;
  const destinations =
    manual?.destinations ??
    (manual?.account_number
      ? [{ provider: manual.provider ?? "Bank", account_name: manual.account_name ?? "", account_number: manual.account_number, brand: "" }]
      : []);

  const items = useMemo(
    () =>
      lines
        .map((line) => ({ line, product: line.product as CatalogProduct | undefined }))
        .filter(
          (
            entry,
          ): entry is {
            line: (typeof lines)[number];
            product: CatalogProduct;
          } => Boolean(entry.product?.apiId && entry.product.apiId > 0),
        ),
    [lines],
  );

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.line.quantity, 0);
  // The orders API charges no delivery fee; quoting one would not match the amount paid.
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  // Pre-fill the amount with the order total; the shopper can correct it to what they sent.
  useEffect(() => {
    if (total > 0) setBankProof((current) => (current.amount ? current : { ...current, amount: String(total) }));
  }, [total]);

  const addresses = useQuery({
    queryKey: ["addresses", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const list = await getShippingAddresses();
      return [...list].sort((a, b) => Number(b.is_default) - Number(a.is_default));
    },
  });

  const profile = useQuery({
    queryKey: ["profile", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: () => getProfile(),
  });

  useEffect(() => {
    const saved = addresses.data;
    if (!saved) return;
    if (saved.length && addressId === "new") {
      setAddressId(saved[0]!.id);
    }
  }, [addresses.data, addressId]);

  useEffect(() => {
    if (!profile.data) return;
    setForm(previous => ({
      ...previous,
      recipient: previous.recipient || profile.data?.name || "",
      phone: previous.phone || profile.data?.phone_number || "",
    }));
  }, [profile.data]);

  const chosen = addresses.data?.find((a) => a.id === addressId);
  const delivery =
    addressId !== "new" && chosen ? apiAddressToForm(chosen) : form;

  const deliveryComplete = Boolean(
    delivery.recipient && delivery.phone && delivery.city && (addressId !== "new" || (validDistrict(delivery.city) && delivery.area)),
  );

  const saveDeliveryAddress = useMutation({
    mutationFn: () => addShippingAddress(formToApiBody(form, !(addresses.data?.length ?? 0))),
    onSuccess: async address => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setAddressId(address.id);
      setAddressOpen(false);
    },
    onError: error => toast.error(error instanceof Error ? error.message : "Could not save address"),
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in again");
      if (!canPay) throw new Error("This payment option is unavailable right now");
      if (!items.length) throw new Error("Your basket is empty");

      let shippingAddressId: number;
      if (addressId === "new") {
        const created = await addShippingAddress(
          formToApiBody(form, !(addresses.data?.length ?? 0)),
        );
        shippingAddressId = created.id;
      } else {
        shippingAddressId = addressId;
      }

      const orderItems = items.map(({ line, product }) => ({
        seller_listing_id: line.listingId,
        quantity: line.quantity,
      }));

      const result = await createOrder({
        payment_method: payment,
        shipping_address_id: shippingAddressId,
        items: orderItems,
        fulfilment,
        ...(fulfilment === "delivery" && courierId ? { courier_service_id: courierId } : {}),
        ...(delivery.notes ? { notes: delivery.notes } : {}),
      });
      const order = result.orders[0];
      if (!order) throw new Error("Checkout did not create an order");

      if (payment === "bank-transfer") {
        try {
          await submitPaymentProof({
            submission_key: crypto.randomUUID(),
            order_ids: result.orders.map((item) => Number(String(item.id).replace("ord_", ""))),
            ...toProofPayload(bankProof),
          });
        } catch (error) {
          // The order exists; the order page lets the shopper resubmit the proof.
          toast.error(
            `Order placed, but the payment proof was not saved: ${error instanceof Error ? error.message : "try again"}. Please submit it again.`,
          );
        }
      }

      // The orders API looks orders up by id, not order number.
      return String(order.id);
    },
    onSuccess: (reference) => {
      clear();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      navigate({ to: "/orders/$reference", params: { reference }, replace: true,
        hash: payment === "airtel" ? "airtel-payment" : "payment-proof" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "We couldn't place your order");
    },
  });

  if (!items.length && !placeOrder.isPending) {
    return (
      <section className="shell py-14">
        <div className="mx-auto max-w-md rounded-3xl bg-surface p-10 text-center">
          <h1 className="text-2xl font-extrabold text-ink-800">Your basket is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a device to your basket before checking out.
          </p>
          <Link
            to="/deals"
            className="mt-6 inline-flex rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Shop the deals
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shell py-10 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-800 md:text-4xl">Checkout</h1>

      <ol className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        {[
          { n: 1, label: "Delivery details" },
          { n: 2, label: "Payment" },
          { n: 3, label: "Review" },
        ].map((s) => (
          <li key={s.n} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                step >= s.n ? "bg-brand-500 text-white" : "bg-stage text-muted-foreground",
              )}
            >
              {s.n}
            </span>
            <span className={step === s.n ? "font-semibold text-ink-800" : "text-muted-foreground"}>
              {s.label}
            </span>
            {s.n < 3 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="rounded-3xl bg-surface p-6 md:p-8">
          {step !== 3 ? (
            <div>
              <h2 className="text-lg font-bold text-ink-800">Where should we deliver?</h2>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { id: "delivery", label: "Deliver to me", icon: "box-minimalistic-linear" },
                    { id: "pickup", label: "Collect at the shop", icon: "shop-linear" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFulfilment(option.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold",
                      fulfilment === option.id
                        ? "border-brand-500 bg-brand-100 text-brand-800"
                        : "border-border text-ink-800 hover:bg-stage",
                    )}
                  >
                    <Icon name={option.icon} className="h-5 w-5" />
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
                  {(addresses.data ?? []).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAddressId(a.id)}
                      className={cn(
                        "block h-full w-full rounded-xl border p-3 text-left",
                        addressId === a.id
                          ? "border-brand-500 bg-brand-100"
                          : "border-border hover:bg-stage",
                      )}
                    >
                      <p className="text-sm font-semibold text-ink-800">
                        {a.label} · {a.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[a.address, a.city].filter(Boolean).join(", ")} · {a.phone}
                      </p>
                    </button>
                  ))}
                <button type="button" onClick={() => setAddressOpen(true)}
                  className="grid min-h-24 place-content-center gap-1 rounded-xl border border-dashed border-border text-center text-sm font-semibold hover:bg-stage">
                  <Icon name="add-circle-linear" className="mx-auto size-5" />
                  Add address
                </button>
              </div>
              {fulfilment === "delivery" ? (
                <fieldset className="mt-7">
                  <legend className="text-base font-bold text-ink-800">Who should deliver it?</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      { id: null, name: "Techaven rider", description: "We arrange delivery with a Techaven rider.", logo_url: undefined as string | undefined },
                      ...(couriers.data ?? []).map((courier) => ({ ...courier, id: courier.id as number | null })),
                    ].map((option) => (
                      <label
                        key={option.id ?? "techaven"}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left focus-within:ring-2 focus-within:ring-brand-500",
                          courierId === option.id ? "border-brand-500 bg-brand-100" : "border-border hover:bg-stage",
                        )}
                      >
                        <input
                          type="radio"
                          name="courier"
                          className="sr-only"
                          checked={courierId === option.id}
                          onChange={() => setCourierId(option.id)}
                        />
                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface text-brand-500">
                          {option.logo_url ? (
                            <img src={option.logo_url} alt="" className="size-full object-contain p-1" />
                          ) : (
                            <Icon name="delivery-linear" className="size-5" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-800">{option.name}</span>
                          {option.description ? (
                            <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                  {couriers.isError ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Courier options could not load. Your order will go with a Techaven rider.
                    </p>
                  ) : null}
                </fieldset>
              ) : null}
              <AddressDrawer open={addressOpen} close={() => setAddressOpen(false)} title="Delivery address"
                value={form} onChange={setForm} onSave={() => saveDeliveryAddress.mutate()} busy={saveDeliveryAddress.isPending}
                savedPhone={profile.data?.phone_number ?? undefined} />

              <button
                type="button"
                disabled={!deliveryComplete}
                onClick={() => setStep(2)}
                className="mt-7 rounded-lg bg-brand-500 px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Continue to payment
              </button>
            </div>
          ) : null}

          <Sheet open={step === 2} onOpenChange={open => { if (!open && step === 2) setStep(1); }}>
            <SheetContent className="flex h-dvh w-full flex-col gap-0 p-0 sm:max-w-lg">
              <header className="border-b border-border px-6 py-5">
                <SheetTitle>Choose a payment method</SheetTitle>
                <SheetDescription>Choose how you’ll pay for this order.</SheetDescription>
              </header>
              <div className="no-scrollbar min-h-0 grow overflow-y-auto px-6 py-4">
              <fieldset className="mt-4 grid gap-2">
                <legend className="sr-only">Payment method</legend>
                {paymentOptions.map(option => {
                  const available = isAvailable(option.id);
                  const soon = COMING_SOON.has(option.id);
                  return <label key={option.id} className="flex items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-brand-500 has-[:disabled]:opacity-60">
                    <input type="radio" name="payment" value={option.id} checked={payment === option.id}
                      disabled={!available} onChange={() => setPayment(option.id)} className="mt-3 accent-brand-500" />
                    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
                      {option.logo
                        ? <img src={option.logo} alt="" className="size-full object-contain" />
                        : <Landmark aria-hidden="true" className="size-6 text-ink-800" strokeWidth={1.75} />}
                    </span>
                    <span className="min-w-0"><strong className="flex items-center gap-2 text-sm">{option.label}
                      {soon ? <span className="rounded-full bg-stage px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Coming soon</span> : null}</strong>
                      <span className="text-sm text-muted-foreground">{soon ? "Not available yet." : available ? option.hint : "Temporarily unavailable."}</span>
                    </span>
                  </label>;
                })}
              </fieldset>
              {payment === "bank-transfer" && manualPaymentAvailable ? (
                <div className="mt-5 space-y-4">
                  {destinations.length ? (
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Transfer {formatMwk(total)} to</p>
                      <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                        {destinations.map((destination) => (
                          <li key={destination.account_number} className="p-3 text-sm">
                            <strong className="block">{destination.provider}</strong>
                            <span className="block">{destination.account_name}</span>
                            <span className="break-all tabular-nums">{destination.account_number}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold text-ink-800">Your payment details</p>
                    <p className="text-xs text-muted-foreground">Enter the details of the transfer you made and upload the receipt.</p>
                    <div className="mt-3">
                      <BankProofFields value={bankProof} onChange={setBankProof} idPrefix="checkout-proof" />
                    </div>
                  </div>
                  {bankProblem ? <p className="text-xs text-muted-foreground">{bankProblem}</p> : null}
                </div>
              ) : null}
              </div>
              <footer className="flex flex-wrap gap-3 border-t border-border bg-surface p-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-border bg-surface px-5 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-stage"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canPay}
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-brand-500 px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-700"
                >
                  Review order
                </button>
              </footer>
            </SheetContent>
          </Sheet>

          {step === 3 ? (
            <div>
              <h2 className="text-lg font-bold text-ink-800">Review your order</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-stage p-4">
                  <p className="text-[13px] font-semibold tracking-normal text-ink-800">
                    {fulfilment === "pickup" ? "Collection contact" : "Delivering to"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-800">{delivery.recipient}</p>
                  <p className="text-xs text-muted-foreground">
                    {[delivery.street, delivery.area, delivery.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{delivery.phone}</p>
                  {fulfilment === "delivery" ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Delivery by <strong className="text-ink-800">{chosenCourier?.name ?? "Techaven rider"}</strong>
                    </p>
                  ) : null}
                  {delivery.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{delivery.notes}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-stage p-4">
                  <p className="text-[13px] font-semibold tracking-normal text-ink-800">
                    Paying with
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-800">
                    {paymentOptions.find(option => option.id === payment)?.label}
                  </p>
                  {payment === "bank-transfer" && bankProof.receipt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatMwk(Number(bankProof.amount))} from {bankProof.payerName} ({bankProof.payerBank}) · receipt uploaded
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {paymentOptions.find(option => option.id === payment)?.hint}
                    </p>
                  )}
                </div>
              </div>

              <ul className="mt-6 divide-y divide-border">
                {items.map(({ line, product }) => (
                  <li key={line.listingId} className="flex items-center gap-4 py-4">
                    <div className="w-16 shrink-0">
                      <ImageStage category={product.category} src={product.imageUrl} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.shopName ?? product.shop} · Qty {line.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-ink-800">
                      {formatMwk(product.price * line.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-border bg-surface px-5 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-stage"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={placeOrder.isPending || !canPay}
                  onClick={() => placeOrder.mutate()}
                  className="rounded-lg bg-ink-900 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
                >
                  {placeOrder.isPending ? "Placing order…" : "Place order and pay"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-3xl bg-surface p-6">
          <h2 className="text-lg font-bold text-ink-800">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Items ({items.reduce((n, i) => n + i.line.quantity, 0)})
              </dt>
              <dd className="font-semibold text-ink-800">{formatMwk(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {fulfilment === "pickup" ? "Collection" : "Delivery"}
              </dt>
              <dd className="font-semibold text-ink-800">
                {deliveryFee === 0 ? "Free" : formatMwk(deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-bold text-ink-800">Total</dt>
              <dd className="text-xl font-extrabold text-ink-800">{formatMwk(total)}</dd>
            </div>
          </dl>
          <Link
            to="/cart"
            className="mt-5 inline-flex text-xs font-semibold text-brand-500 hover:underline"
          >
            Edit basket
          </Link>
        </aside>
      </div>
    </section>
  );
}
