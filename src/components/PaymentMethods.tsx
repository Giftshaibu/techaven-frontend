import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
} from "@/integrations/techaven/customer";
import { useAuth } from "@/lib/auth";

export const setupButton =
  "min-h-11 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50";
const inputClass = "mt-2 h-12 w-full rounded-lg border border-border bg-surface px-3 text-base";

export function PaymentMethodForm({ onSaved }: { onSaved: () => void }) {
  const { user, refreshUser } = useAuth();
  const client = useQueryClient();
  const [provider, setProvider] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState(false);
  const [makeDefault, setMakeDefault] = useState(true);
  const methods = useQuery({
    queryKey: ["payment-methods", user?.id],
    queryFn: getPaymentMethods,
    enabled: Boolean(user),
  });
  const selectedProvider = provider || methods.data?.available_providers[0]?.slug || "";
  const save = useMutation({
    mutationFn: () =>
      addPaymentMethod({
        type: "mobile_money",
        provider: selectedProvider,
        phone_number: phone,
        use_for_contact: contact,
        is_default: makeDefault,
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["payment-methods"] }),
        client.invalidateQueries({ queryKey: ["customer-setup"] }),
        client.invalidateQueries({ queryKey: ["profile"] }),
      ]);
      if (contact) void refreshUser();
      onSaved();
    },
  });
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      {methods.isError ? (
        <p role="alert" className="text-sm">
          Payment providers couldn’t load.{" "}
          <button
            type="button"
            onClick={() => void methods.refetch()}
            className="min-h-11 underline"
          >
            Try again
          </button>
        </p>
      ) : null}
      <label className="text-sm font-semibold">
        Mobile-money provider
        <select
          className={inputClass}
          value={selectedProvider}
          onChange={(event) => setProvider(event.target.value)}
          disabled={methods.isPending || !methods.data?.available_providers.length}
          required
        >
          <option value="" disabled>
            Choose provider
          </option>
          {methods.data?.available_providers.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      {methods.isSuccess && !methods.data.available_providers.length ? (
        <p className="text-sm text-muted-foreground">
          No mobile-money providers are available right now. You can add a method later.
        </p>
      ) : null}
      <label className="text-sm font-semibold">
        Mobile-money number
        <input
          className={inputClass}
          type="tel"
          autoComplete="tel"
          placeholder="+265 983 780 656"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          maxLength={25}
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={contact}
          onChange={(event) => setContact(event.target.checked)}
          className="h-5 w-5 shrink-0"
        />
        Also use this as my contact number
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={makeDefault}
          onChange={(event) => setMakeDefault(event.target.checked)}
          className="h-5 w-5 shrink-0"
        />
        Make this my default payment method
      </label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        This saves your payment preference only. No money is charged and the number is not verified.
        Never share your PIN.
      </p>
      {save.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      ) : null}
      <button
        className={setupButton}
        disabled={save.isPending || !selectedProvider || !phone.trim()}
      >
        {save.isPending ? "Saving…" : "Save payment method"}
      </button>
    </form>
  );
}

export function AccountPaymentMethods({ disabled = false }: { disabled?: boolean }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const methods = useQuery({
    queryKey: ["payment-methods", user?.id],
    queryFn: getPaymentMethods,
    enabled: Boolean(user),
  });
  const remove = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => client.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
  return (
    <section id="payment-methods" className="rounded-3xl bg-surface p-5 md:p-8 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Payment methods</h2>
        <button
          className="min-h-11 text-sm font-semibold text-brand-500 disabled:opacity-50"
          disabled={disabled}
          onClick={() => window.dispatchEvent(new Event("techaven:payment-setup"))}
        >
          Add mobile money
        </button>
      </div>
      {methods.isPending ? (
        <p role="status" className="mt-3 text-sm">
          Loading payment methods…
        </p>
      ) : methods.isError ? (
        <p role="alert" className="text-sm">
          Unable to load methods.{" "}
          <button className="min-h-11 underline" onClick={() => void methods.refetch()}>
            Retry
          </button>
        </p>
      ) : methods.data.payment_methods.length ? (
        <ul className="mt-3 divide-y divide-border">
          {methods.data.payment_methods.map((method) => (
            <li key={method.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  {methods.data.available_providers.find((p) => p.slug === method.provider)?.name ||
                    method.provider}
                  {method.is_default ? " · Default" : ""}
                </p>
                <p>{method.phone_number}</p>
              </div>
              <button
                aria-label={`Remove payment method ${method.phone_number}`}
                disabled={remove.isPending}
                className="min-h-11 text-sm text-brand-500"
                onClick={() => remove.mutate(method.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No saved payment methods. Adding one is optional.
        </p>
      )}
      {remove.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {remove.error.message}
        </p>
      ) : null}
    </section>
  );
}
