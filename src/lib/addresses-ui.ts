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
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
};

export function apiAddressToForm(addr: ShippingAddress): AddressForm {
  return {
    label: addr.label,
    recipient: addr.name,
    phone: addr.phone,
    city: addr.city,
    area: addr.region ?? "",
    street: addr.address,
    notes: addr.delivery_notes ?? "",
    latitude: addr.latitude == null ? null : Number(addr.latitude),
    longitude: addr.longitude == null ? null : Number(addr.longitude),
    location_accuracy: addr.location_accuracy == null ? null : Number(addr.location_accuracy),
  };
}

export function formToApiBody(form: AddressForm, isDefault?: boolean) {
  return {
    label: form.label || "Home",
    name: form.recipient,
    phone: form.phone,
    address: [form.street, form.area].filter(Boolean).join(", ") || form.street,
    city: form.city,
    ...(form.area ? { region: form.area } : {}),
    ...(isDefault == null ? {} : { is_default: isDefault }),
    latitude: form.latitude ?? null,
    longitude: form.longitude ?? null,
    location_accuracy: form.location_accuracy ?? null,
    delivery_notes: form.notes || null,
  };
}
