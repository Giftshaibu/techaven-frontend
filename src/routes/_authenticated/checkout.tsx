import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { formatMwk, getProduct, getShop } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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

const paymentMethods = [
  {
    id: "airtel-money",
    name: "Airtel Money",
    icon: "smartphone-2-linear",
    blurb: "Approve the payment prompt on your phone when the shop confirms stock.",
  },
  {
    id: "mpamba",
    name: "TNM Mpamba",
    icon: "wallet-money-linear",
    blurb: "Pay from your Mpamba wallet using the order reference.",
  },
  {
    id: "bank-transfer",
    name: "Bank transfer",
    icon: "bank-linear",
    blurb: "Transfer to the Techaven holding account; we release funds on delivery.",
  },
  {
    id: "cash-on-delivery",
    name: "Cash on delivery",
    icon: "hand-money-linear",
    blurb: "Pay the courier in cash once you've checked the device.",
  },
] as const;

const emptyAddress = {
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

  const [step, setStep] = useState<Step>(1);
  const [addressId, setAddressId] = useState<string | "new">("new");
  const [form, setForm] = useState(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<string>(paymentMethods[0].id);

  const items = useMemo(
    () =>
      lines
        .map((line) => ({ line, product: getProduct(line.slug) }))
        .filter(
          (
            entry,
          ): entry is {
            line: (typeof lines)[number];
            product: NonNullable<typeof entry.product>;
          } => Boolean(entry.product),
        ),
    [lines],
  );

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.line.quantity, 0);
  const deliveryFee = fulfilment === "pickup" || subtotal === 0 || subtotal > 900000 ? 0 : 6000;
  const total = subtotal + deliveryFee;

  const addresses = useQuery({
    queryKey: ["addresses", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const profile = useQuery({
    queryKey: ["profile", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const saved = addresses.data;
    if (!saved) return;
    if (saved.length && addressId === "new" && !form.recipient) {
      setAddressId(saved[0]!.id);
    }
  }, [addresses.data, addressId, form.recipient]);

  useEffect(() => {
    if (!profile.data) return;
    setForm((prev) =>
      prev.recipient || prev.phone
        ? prev
        : {
            ...prev,
            recipient: profile.data?.full_name ?? "",
            phone: profile.data?.phone ?? "",
          },
    );
  }, [profile.data]);

  const chosen = addresses.data?.find((a) => a.id === addressId);
  const delivery =
    addressId !== "new" && chosen
      ? {
          recipient: chosen.recipient,
          phone: chosen.phone,
          city: chosen.city,
          area: chosen.area,
          street: chosen.street ?? "",
          notes: chosen.notes ?? "",
          label: chosen.label,
        }
      : form;

  const deliveryComplete = Boolean(
    delivery.recipient && delivery.phone && delivery.city && delivery.area,
  );

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in again");
      if (!items.length) throw new Error("Your basket is empty");

      const reference = `TH-${Date.now().toString(36).toUpperCase().slice(-6)}`;

      if (addressId === "new" && saveAddress) {
        await supabase.from("addresses").insert({
          user_id: user.id,
          label: form.label || "Home",
          recipient: form.recipient,
          phone: form.phone,
          city: form.city,
          area: form.area,
          street: form.street || null,
          notes: form.notes || null,
          is_default: !(addresses.data?.length ?? 0),
        });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          reference,
          payment_method: payment,
          fulfilment,
          recipient: delivery.recipient,
          phone: delivery.phone,
          city: delivery.city,
          area: delivery.area,
          street: delivery.street || null,
          notes: delivery.notes || null,
          subtotal,
          delivery_fee: deliveryFee,
          total,
        })
        .select("id, reference")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map(({ line, product }) => ({
          order_id: order.id,
          user_id: user.id,
          product_slug: product.slug,
          product_name: product.name,
          shop_slug: product.shop,
          unit_price: product.price,
          quantity: line.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      return order.reference;
    },
    onSuccess: (reference) => {
      clear();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      navigate({ to: "/orders/$reference", params: { reference }, replace: true });
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
          {step === 1 ? (
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

              {addresses.data?.length ? (
                <div className="mt-6 space-y-2">
                  <p className="text-[13px] font-semibold tracking-normal text-ink-800">
                    Saved details
                  </p>
                  {addresses.data.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAddressId(a.id)}
                      className={cn(
                        "block w-full rounded-2xl border p-4 text-left",
                        addressId === a.id
                          ? "border-brand-500 bg-brand-100"
                          : "border-border hover:bg-stage",
                      )}
                    >
                      <p className="text-sm font-semibold text-ink-800">
                        {a.label} · {a.recipient}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[a.street, a.area, a.city].filter(Boolean).join(", ")} · {a.phone}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddressId("new")}
                    className={cn(
                      "block w-full rounded-2xl border p-4 text-left text-sm font-semibold",
                      addressId === "new"
                        ? "border-brand-500 bg-brand-100 text-brand-800"
                        : "border-border text-ink-800 hover:bg-stage",
                    )}
                  >
                    Use new details
                  </button>
                </div>
              ) : null}

              {addressId === "new" ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={form.recipient}
                    onChange={(v) => setForm({ ...form, recipient: v })}
                  />
                  <Field
                    label="Phone number"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                    placeholder="+265 ..."
                  />
                  <Field
                    label="City or town"
                    value={form.city}
                    onChange={(v) => setForm({ ...form, city: v })}
                    placeholder="Blantyre"
                  />
                  <Field
                    label="Area"
                    value={form.area}
                    onChange={(v) => setForm({ ...form, area: v })}
                    placeholder="Namiwawa"
                  />
                  <Field
                    label="Street or building"
                    value={form.street}
                    onChange={(v) => setForm({ ...form, street: v })}
                  />
                  <Field
                    label="Label"
                    value={form.label}
                    onChange={(v) => setForm({ ...form, label: v })}
                    placeholder="Home"
                  />
                  <label className="sm:col-span-2 block">
                    <span className="mb-1.5 block text-sm font-semibold tracking-normal text-ink-800">
                      Delivery notes
                    </span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      placeholder="Landmarks, gate colour, best time to call"
                      className="w-full rounded-lg border border-border bg-surface p-3.5 text-[15px] text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </label>
                  <label className="sm:col-span-2 flex items-center gap-2 text-sm text-ink-800">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="h-4 w-4 accent-[var(--color-brand-500)]"
                    />
                    Save these details to my account
                  </label>
                </div>
              ) : null}

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

          {step === 2 ? (
            <div>
              <h2 className="text-lg font-bold text-ink-800">How would you like to pay?</h2>
              <div className="mt-4 space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPayment(method.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left",
                      payment === method.id
                        ? "border-brand-500 bg-brand-100"
                        : "border-border hover:bg-stage",
                    )}
                  >
                    <Icon name={method.icon} className="mt-0.5 h-5 w-5 text-brand-500" />
                    <span>
                      <span className="block text-sm font-semibold text-ink-800">
                        {method.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {method.blurb}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-info-soft p-4 text-xs text-ink-800/80">
                <Icon
                  name="shield-check-linear"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                />
                No money leaves your account yet. Techaven confirms stock with the shop first, then
                sends you payment instructions for the method you pick.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-border bg-surface px-5 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-stage"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-brand-500 px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-700"
                >
                  Review order
                </button>
              </div>
            </div>
          ) : null}

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
                  {delivery.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{delivery.notes}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-stage p-4">
                  <p className="text-[13px] font-semibold tracking-normal text-ink-800">
                    Paying with
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-800">
                    {paymentMethods.find((m) => m.id === payment)?.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentMethods.find((m) => m.id === payment)?.blurb}
                  </p>
                </div>
              </div>

              <ul className="mt-6 divide-y divide-border">
                {items.map(({ line, product }) => (
                  <li key={line.slug} className="flex items-center gap-4 py-4">
                    <div className="w-16 shrink-0">
                      <ImageStage category={product.category} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getShop(product.shop)?.name} · Qty {line.quantity}
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
                  disabled={placeOrder.isPending}
                  onClick={() => placeOrder.mutate()}
                  className="rounded-lg bg-ink-900 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
                >
                  {placeOrder.isPending ? "Placing order…" : "Place order"}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold tracking-normal text-ink-800">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-[15px] text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
