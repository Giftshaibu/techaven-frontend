import { useEffect, useRef, useState } from "react";
import type { AddressForm } from "@/lib/addresses-ui";
import { techavenRequest } from "@/integrations/techaven/client";
import "leaflet/dist/leaflet.css";
export default function AddressMap({
  value,
  onChange,
}: {
  value: AddressForm;
  onChange: (v: AddressForm) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const select = useRef<(lat: number, lon: number, accuracy?: number) => void>(() => {});
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const version = useRef(0);
  const [message, setMessage] = useState(
    "Move the pin to your delivery location, or use your current location.",
  );
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    let disposed = false;
    select.current = async (lat, lon, accuracy) => {
      const request = ++version.current;
      const current = latest.current;
      current.onChange({
        ...current.value,
        latitude: lat,
        longitude: lon,
        location_accuracy: accuracy ?? null,
      });
      setMessage("Finding address details…");
      try {
        const found = await techavenRequest<{ city?: string; area?: string; street?: string }>(
          `/api/location/reverse?lat=${lat}&lon=${lon}`,
          { auth: true },
        );
        if (disposed || request !== version.current) return;
        const fresh = latest.current;
        fresh.onChange({
          ...fresh.value,
          latitude: lat,
          longitude: lon,
          location_accuracy: accuracy ?? null,
          city: found.city || fresh.value.city,
          area: found.area || fresh.value.area,
          street: found.street || fresh.value.street,
        });
        setMessage("Check the suggested address and add a building name or landmark if needed.");
      } catch {
        if (!disposed && request === version.current)
          setMessage("Pin saved. Enter or check the address details below.");
      }
    };
    (async () => {
      try {
        const config = await techavenRequest<{ maps: { key: string | null } }>(
          "/api/commerce-config",
        );
        if (!config.maps.key)
          throw new Error("Map is unavailable. You can still enter your address below.");
        const L = await import("leaflet");
        if (disposed || !element.current) return;
        const current = latest.current.value;
        const centre: [number, number] = [
          current.latitude ?? -13.9626,
          current.longitude ?? 33.7741,
        ];
        const instance = L.map(element.current).setView(centre, current.latitude == null ? 6 : 16);
        map.current = instance;
        L.tileLayer(
          `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(config.maps.key)}`,
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.geoapify.com/">Geoapify</a>',
            maxZoom: 20,
          },
        )
          .addTo(instance)
          .on("tileerror", () =>
            setMessage("Map tiles could not load. You can still enter the address manually."),
          );
        const pin = L.marker(centre, {
          draggable: true,
          icon: L.divIcon({
            className: "delivery-map-pin",
            html: '<span aria-hidden="true">●</span>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(instance);
        instance.on("click", (e) => {
          pin.setLatLng(e.latlng);
          select.current(e.latlng.lat, e.latlng.lng);
        });
        pin.on("dragend", () => {
          const p = pin.getLatLng();
          select.current(p.lat, p.lng);
        });
        instance.on("locationfound", (e) => {
          pin.setLatLng(e.latlng);
          instance.setView(e.latlng, 16);
          select.current(e.latlng.lat, e.latlng.lng, e.accuracy);
          setLocating(false);
        });
        instance.on("locationerror", () => {
          setLocating(false);
          setMessage(
            "Location access was unavailable. Choose a pin or enter the address manually.",
          );
        });
      } catch (error) {
        if (!disposed)
          setMessage(
            error instanceof Error
              ? error.message
              : "Map unavailable; enter your address manually.",
          );
      }
    })();
    return () => {
      disposed = true;
      version.current++;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  return (
    <div className="mt-3 min-w-0 space-y-3">
      <button
        type="button"
        disabled={locating}
        className="min-h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-50"
        onClick={() => {
          if (!map.current) {
            setMessage("Map is unavailable. Enter your address manually.");
            return;
          }
          setLocating(true);
          map.current.locate({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
        }}
      >
        {locating ? "Finding your location…" : "Use my current location"}
      </button>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
      <div
        ref={element}
        role="region"
        aria-label="Delivery location map"
        className="relative z-0 h-64 w-full rounded-lg bg-stage"
      />
      {value.latitude != null && (
        <p className="break-words text-xs">
          Selected pin: {value.latitude.toFixed(5)}, {value.longitude?.toFixed(5)}{" "}
          <button
            type="button"
            className="ml-2 min-h-11 underline"
            onClick={() => {
              version.current++;
              onChange({ ...value, latitude: null, longitude: null, location_accuracy: null });
            }}
          >
            Remove pin
          </button>
        </p>
      )}
    </div>
  );
}
