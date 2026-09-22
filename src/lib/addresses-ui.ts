import type { ShippingAddress } from "@/integrations/techaven/types";

/** Form shape used on checkout / account pages */
export type AddressForm = {
  label: string;
  recipient: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  notes: string;
};

export function apiAddressToForm(addr: ShippingAddress): AddressForm {
  return {
    label: addr.label,
    recipient: addr.name,
    phone: addr.phone,
    city: addr.city,
    area: addr.region ?? "",
    street: addr.address,
    notes: "",
  };
}

export function formToApiBody(form: AddressForm, isDefault?: boolean) {
  return {
    label: form.label || "Home",
    name: form.recipient,
    phone: form.phone,
    address: [form.street, form.area].filter(Boolean).join(", ") || form.street,
    city: form.city,
    region: form.area || undefined,
    is_default: isDefault,
  };
}
