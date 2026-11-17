import { AccountPaymentMethods } from "@/components/PaymentMethods";
import { AddressDrawer } from "@/components/AddressDrawer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  getCustomerSetup,
  completeAddressSetup,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  getProfile,
  getShippingAddresses,
  setDefaultShippingAddress,
  updateProfile,
} from "@/integrations/techaven/customer";
import { useAuth } from "@/lib/auth";
import { apiAddressToForm, formToApiBody, type AddressForm } from "@/lib/addresses-ui";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "Account details — Techaven" },
      {
        name: "description",
        content: "Update your Techaven contact details and saved delivery addresses.",
      },
      { property: "og:title", content: "Account details — Techaven" },
      { property: "og:description", content: "Your Techaven contact and delivery details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountDetails,
});

const emptyAddress: AddressForm = {
  label: "Home",
  recipient: "",
  phone: "",
  city: "",
  area: "",
  street: "",
  notes: "",
};

function AccountDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [editing, setEditing] = useState<number | null>(null);

  const setup = useQuery({
    queryKey: ["customer-setup", user?.id],
    queryFn: getCustomerSetup,
    enabled: Boolean(user),
  });
  useEffect(() => {
    if (setup.data?.requires_address) {
      setAdding(true);
      document.getElementById("delivery-details")?.scrollIntoView({ block: "start" });
    }
  }, [setup.data?.requires_address]);

  const profile = useQuery({
    queryKey: ["profile", user?.id ?? "anon"],
    queryFn: () => getProfile(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.name ?? "");
    setPhone(profile.data.phone_number ?? "");
  }, [profile.data]);

  useEffect(() => {
    const customer = profile.data;
    if (!adding || editing !== null || !customer) return;
    setForm(previous => ({
      ...previous,
      recipient: previous.recipient || customer.name || "",
      phone: previous.phone || customer.phone_number || "",
    }));
  }, [adding, editing, profile.data]);

  const addresses = useQuery({
    queryKey: ["addresses", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const list = await getShippingAddresses();
      return [...list].sort((a, b) => Number(b.is_default) - Number(a.is_default));
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      await updateProfile({
        ...(fullName ? { name: fullName } : {}),
        ...(phone ? { phone_number: phone } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Details saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save your details"),
  });

  const addAddress = useMutation({
    mutationFn: async () => {
      if (editing !== null) await updateShippingAddress(editing, formToApiBody(form));
      else await addShippingAddress(formToApiBody(form, !(addresses.data?.length ?? 0)));
    },
    onSuccess: async () => {
      toast.success("Delivery details saved");
      setForm(emptyAddress);
      setAdding(false);
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      if (setup.data?.requires_address) {
        try {
          await completeAddressSetup();
        } catch {
          toast.error("Your address was saved. Select Use my saved address to finish setup.");
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["customer-setup"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save the address"),
  });

  const removeAddress = useMutation({
    mutationFn: async (id: number) => {
      await deleteShippingAddress(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  const makeDefault = useMutation({
    mutationFn: async (id: number) => {
      await setDefaultShippingAddress(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="rounded-3xl bg-surface p-6 md:p-8">
        <h2 className="text-lg font-bold text-ink-800">Contact details</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Full name" value={fullName} onChange={setFullName} />
          <Field label="Phone number" value={phone} onChange={setPhone} placeholder="+265 ..." />
          <div>
            <span className="mb-1.5 block text-sm font-semibold tracking-normal text-ink-800">
              Email
            </span>
            <p className="text-sm text-ink-800">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => saveProfile.mutate()}
          disabled={saveProfile.isPending}
          className="mt-6 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saveProfile.isPending ? "Saving…" : "Save details"}
        </button>
      </div>

      <div id="delivery-details" className="scroll-mt-28 rounded-3xl bg-surface p-5 md:p-8">
        {setup.data?.requires_address ? (
          <div className="mb-5 rounded-xl bg-brand-100 p-4 text-sm">
            <p className="font-semibold">First, add your delivery address</p>
            <p className="mt-1">
              Save an address to continue shopping. Mobile-money setup comes next and is optional.
            </p>
            {addresses.data?.length ? (
              <button
                className="min-h-11 font-semibold underline"
                onClick={async () => {
                  try {
                    await completeAddressSetup();
                    await queryClient.invalidateQueries({ queryKey: ["customer-setup"] });
                  } catch {
                    toast.error("Unable to finish setup. Please retry.");
                  }
                }}
              >
                Use my saved address
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-800">Delivery details</h2>
          <button
            type="button"
            disabled={setup.data?.requires_address}
            onClick={() => { setEditing(null); setForm({ ...emptyAddress, recipient: profile.data?.name ?? "", phone: profile.data?.phone_number ?? "" }); setAdding(true); }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:underline"
          >
            <Icon name={adding ? "close-circle-linear" : "add-circle-linear"} className="h-4 w-4" />
            {adding ? "Cancel" : "Add address"}
          </button>
        </div>

        {addresses.data?.length ? (
          <ul className="mt-5 space-y-3">
            {addresses.data.map((a) => (
              <li key={a.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-800">
                      {a.label} · {a.name}
                      {a.is_default ? (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[a.address, a.region, a.city].filter(Boolean).join(", ")} · {a.phone}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className="text-xs underline" onClick={() => { setEditing(a.id); setForm(apiAddressToForm(a)); setAdding(true); }}>Edit</button>
                    {!a.is_default ? (
                      <button
                        type="button"
                        onClick={() => makeDefault.mutate(a.id)}
                        className="text-xs font-semibold text-brand-500 hover:underline"
                      >
                        Make default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeAddress.mutate(a.id)}
                      aria-label={`Remove ${a.label} address`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Icon name="trash-bin-trash-linear" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            No saved addresses yet — add one to check out faster.
          </p>
        )}

        <AddressDrawer key={editing ?? "new"} open={adding} close={() => setAdding(false)}
          title={editing === null ? "Add address" : "Edit address"} value={form}
          onChange={setForm} onSave={() => addAddress.mutate()} busy={addAddress.isPending}
          savedPhone={profile.data?.phone_number ?? undefined} />
      </div>
      <AccountPaymentMethods disabled={Boolean(setup.data?.requires_address)} />
    </div>
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
