import { useState } from "react";
import { AddressLocation } from "@/components/AddressLocation";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { malawiDistricts, validDistrict, type AddressForm } from "@/lib/addresses-ui";

const inputClass = "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-3";

export function AddressDrawer({ open, close, title, value, onChange, onSave, busy, savedPhone }: {
  open: boolean; close: () => void; title: string; value: AddressForm;
  onChange: (value: AddressForm) => void; onSave: () => void; busy?: boolean; savedPhone?: string | undefined;
}) {
  const [otherPhone, setOtherPhone] = useState(false);
  const canReuse = Boolean(savedPhone && savedPhone === value.phone && !otherPhone);
  function field(label: string, key: "recipient" | "phone" | "area" | "street" | "label", required = false) {
    return <label className="block text-sm font-semibold">{label}
      <input className={inputClass} required={required} type={key === "phone" ? "tel" : "text"}
        value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} />
    </label>;
  }
  return <Sheet open={open} onOpenChange={next => { if (!next && !busy) close(); }}>
    <SheetContent className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-lg">
      <header className="border-b border-border px-6 py-5">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>Enter a district and area for delivery.</SheetDescription>
      </header>
      <form className="flex min-h-0 grow flex-col" onSubmit={e => {
        e.preventDefault();
        if (validDistrict(value.city) && value.area.trim() && value.phone.trim() && value.recipient.trim()) onSave();
      }}>
        <div className="no-scrollbar grow space-y-4 overflow-y-auto p-6">
          {field("Recipient name", "recipient", true)}
          {canReuse ? <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>Delivery phone · {value.phone}</span>
            <button type="button" className="underline" onClick={() => setOtherPhone(true)}>Use another number</button>
          </div> : field("Delivery phone", "phone", true)}
          <label className="block text-sm font-semibold">District
            <select required className={inputClass} value={validDistrict(value.city) ? value.city : ""} onChange={e => onChange({ ...value, city: e.target.value })}>
              <option value="">Choose a district</option>
              {Object.entries(malawiDistricts).map(([region, entries]) => (
                <optgroup key={region} label={region}>{entries.map(name => <option key={name}>{name}</option>)}</optgroup>
              ))}
            </select>
          </label>
          {field("Area or locality", "area", true)}
          {field("Street or landmark (optional)", "street")}
          {field("Address label", "label")}
          <AddressLocation value={value} onChange={onChange} />
          <label className="block text-sm font-semibold">Delivery notes (optional)
            <textarea className={inputClass} maxLength={1000} value={value.notes} onChange={e => onChange({ ...value, notes: e.target.value })} />
          </label>
        </div>
        <footer className="border-t border-border bg-surface p-4">
          <button disabled={busy} className="w-full rounded-lg bg-brand-500 px-5 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save address"}
          </button>
        </footer>
      </form>
    </SheetContent>
  </Sheet>;
}
