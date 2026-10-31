import type { MarketplaceDevice, MarketplaceVariant } from "@/integrations/techaven/types";

export type SpecRow = { label: string; value: string };
export type SpecGroup = { title: string; rows: SpecRow[] };

export function deviceDescription(device: MarketplaceDevice): string | undefined {
  const value = record(device.specs)["description"];
  return typeof value === "string" && value.trim() && !/^[\[{]/.test(value.trim())
    ? value.trim()
    : undefined;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return record(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const fields: Record<string, [string, string?]> = {
  size_inch: ["Screen size", "inches"],
  refresh_hz: ["Refresh rate", "Hz"],
  ppi: ["Pixel density", "ppi"],
  brightness_nits: ["Brightness", "nits"],
  wired_w: ["Wired charging", "W"],
  wireless_w: ["Wireless charging", "W"],
  reverse_wireless_w: ["Reverse wireless charging", "W"],
  height_mm: ["Height", "mm"],
  width_mm: ["Width", "mm"],
  depth_mm: ["Depth", "mm"],
  weight_g: ["Weight", "g"],
  ip_rating: ["IP rating"],
  mp: ["Resolution", "MP"],
  ois: ["Optical image stabilisation"],
  nfc: ["NFC"],
  usb: ["USB"],
  wifi: ["Wi-Fi"],
  wlan: ["Wi-Fi"],
  gps: ["GPS"],
  cpu: ["CPU"],
  gpu: ["GPU"],
  ram_gb: ["RAM", "GB"],
  storage_gb: ["Storage", "GB"],
  network_generation: ["Network"],
  sim_type: ["SIM"],
  model_number: ["Model number"],
};

function label(key: string): string {
  return fields[key]?.[0] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function scalar(value: unknown, key: string): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  const text = String(value).trim();
  // Never expose serialized JSON as a specification value.
  if (!text || /^[\[{]/.test(text)) return null;
  if (key === "aperture") return `f/${text}`;
  const unit = fields[key]?.[1];
  return unit ? `${text} ${unit}` : text;
}

function rowsFrom(value: unknown, prefix = ""): SpecRow[] {
  return Object.entries(record(value)).flatMap(([key, entry]): SpecRow[] => {
    if (/^(source($|_)|raw_|metadata$|source_metadata$|description$)/.test(key)) return [];
    const name = [prefix, label(key)].filter(Boolean).join(" · ");
    if (Array.isArray(entry)) {
      return entry.flatMap((item, index) => {
        const text = scalar(item, key);
        return text != null
          ? [{ label: `${name} ${index + 1}`, value: text }]
          : rowsFrom(item, `${name} ${index + 1}`);
      });
    }
    if (entry && typeof entry === "object") return rowsFrom(entry, name);
    const text = scalar(entry, key);
    return text == null ? [] : [{ label: name, value: text }];
  });
}

export function deviceSpecGroups(
  device: MarketplaceDevice,
  variant?: MarketplaceVariant,
): SpecGroup[] {
  const specs = record(device.specs);
  const groups: SpecGroup[] = [
    {
      title: "Performance and software",
      rows: [
        ...(device.soc ? [{ label: "Processor", value: device.soc }] : []),
        ...(device.os_family ? [{ label: "Operating system", value: device.os_family }] : []),
      ],
    },
    {
      title: "Selected configuration",
      rows: variant
        ? rowsFrom({
            ram_gb: variant.ram_gb,
            storage_gb: variant.storage_gb,
            network_generation: variant.network_generation,
            sim_type: variant.sim_type,
            model_number: variant.model_number,
            region: variant.region,
          })
        : [],
    },
    { title: "Display", rows: rowsFrom(specs["display"]) },
    {
      title: "Cameras",
      rows: Array.isArray(specs["cameras"])
        ? specs["cameras"].flatMap((camera, i) => {
            const { type, ...details } = record(camera);
            const cameraName =
              typeof type === "string" ? `${label(type)} camera` : `Camera ${i + 1}`;
            return rowsFrom(details, cameraName);
          })
        : rowsFrom(specs["cameras"]),
    },
    {
      title: "Battery and charging",
      rows: [
        ...(device.battery_mah != null
          ? [{ label: "Battery", value: `${device.battery_mah} mAh` }]
          : []),
        ...rowsFrom(specs["charging"]),
      ],
    },
    { title: "Connectivity", rows: rowsFrom(specs["connectivity"]) },
    {
      title: "Dimensions and protection",
      rows: [
        ...rowsFrom(specs["dimensions"]),
        ...rowsFrom({ weight_g: specs["weight_g"], ip_rating: specs["ip_rating"] }),
      ],
    },
    {
      title: "Other specifications",
      rows: rowsFrom(
        Object.fromEntries(
          Object.entries(specs).filter(
            ([key]) =>
              ![
                "display",
                "cameras",
                "charging",
                "connectivity",
                "dimensions",
                "weight_g",
                "ip_rating",
              ].includes(key),
          ),
        ),
      ),
    },
  ];
  return groups.filter((group) => group.rows.length > 0);
}
