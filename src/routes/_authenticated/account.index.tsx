import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

const emptyAddress = {
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

  const profile = useQuery({
    queryKey: ["profile", user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.full_name ?? "");
    setPhone(profile.data.phone ?? "");
  }, [profile.data]);

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

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName || null, phone: phone || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Details saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save your details"),
  });

  const addAddress = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("addresses").insert({
        user_id: user!.id,
        label: form.label || "Home",
        recipient: form.recipient,
        phone: form.phone,
        city: form.city,
        area: form.area,
        street: form.street || null,
        notes: form.notes || null,
        is_default: !(addresses.data?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delivery details saved");
      setForm(emptyAddress);
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save the address"),
  });

  const removeAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  const makeDefault = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
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

      <div className="rounded-3xl bg-surface p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-800">Delivery details</h2>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
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
                      {a.label} · {a.recipient}
                      {a.is_default ? (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[a.street, a.area, a.city].filter(Boolean).join(", ")} · {a.phone}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
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

        <div className={cn("mt-6 grid gap-4 sm:grid-cols-2", adding ? "" : "hidden")}>
          <Field
            label="Full name"
            value={form.recipient}
            onChange={(v) => setForm({ ...form, recipient: v })}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Area" value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
          <Field
            label="Street"
            value={form.street}
            onChange={(v) => setForm({ ...form, street: v })}
          />
          <Field
            label="Label"
            value={form.label}
            onChange={(v) => setForm({ ...form, label: v })}
          />
          <button
            type="button"
            onClick={() => addAddress.mutate()}
            disabled={
              addAddress.isPending || !form.recipient || !form.phone || !form.city || !form.area
            }
            className="sm:col-span-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {addAddress.isPending ? "Saving…" : "Save address"}
          </button>
        </div>
      </div>
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
