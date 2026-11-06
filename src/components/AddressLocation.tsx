import { lazy, Suspense, useState } from "react";
import type { AddressForm } from "@/lib/addresses-ui";
const Map = lazy(() => import("./AddressMap"));
export function AddressLocation({
  value,
  onChange,
}: {
  value: AddressForm;
  onChange: (v: AddressForm) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:col-span-2 min-w-0">
      <button
        type="button"
        className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide map" : "Choose delivery location on map"}
      </button>
      {open && (
        <Suspense fallback={<p className="py-3 text-sm">Loading map…</p>}>
          <Map value={value} onChange={onChange} />
        </Suspense>
      )}
    </div>
  );
}
