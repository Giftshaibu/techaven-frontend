import { describe, expect, it } from "vitest";
import { deviceDescription, deviceSpecGroups } from "./device-specs";
import type { MarketplaceDevice } from "@/integrations/techaven/types";

const device: MarketplaceDevice = {
  id: 1,
  slug: "galaxy-a05",
  name: "Galaxy A05",
  brand: null,
  category: null,
  release_date: null,
  soc: "helio-g85",
  battery_mah: 5000,
  os_family: "Android",
  specs: {
    display: { size_inch: 6.7, refresh_hz: 60 },
    cameras: [{ type: "main", mp: 50, aperture: 1.8, ois: false }],
    charging: { wired_w: 25, wireless_w: 0 },
    connectivity: { nfc: false, usb: "USB-C 2.0" },
    dimensions: { height_mm: 168.8 },
    weight_g: 195,
    ip_rating: null,
    source_metadata: { provider: "not a phone spec" },
    raw_source: { internal: true },
  },
  variants: [],
  variant_axes: [],
  media: [],
  offers: [],
  primary_image_url: null,
};

describe("device specifications", () => {
  it("keeps supplied descriptions separate from spec rows", () => {
    const described = {
      ...device,
      specs: { ...device.specs, description: "Supplied phone description." },
    };
    expect(deviceDescription(described)).toBe("Supplied phone description.");
    expect(
      deviceSpecGroups(described)
        .flatMap((group) => group.rows)
        .some((row) => row.label === "Description"),
    ).toBe(false);
    expect(deviceDescription({ ...device, specs: { description: "{bad JSON" } })).toBeUndefined();
  });
  it("formats structured specs and preserves explicit false and zero values", () => {
    const rows = deviceSpecGroups(device).flatMap((group) => group.rows);
    expect(rows).toEqual(
      expect.arrayContaining([
        { label: "Screen size", value: "6.7 inches" },
        { label: "Refresh rate", value: "60 Hz" },
        { label: "Main camera · Resolution", value: "50 MP" },
        { label: "Main camera · Aperture", value: "f/1.8" },
        { label: "Main camera · Optical image stabilisation", value: "No" },
        { label: "Wireless charging", value: "0 W" },
        { label: "NFC", value: "No" },
      ]),
    );
    expect(rows.some((row) => /metadata|provider|internal|IP rating/.test(row.label))).toBe(false);
    expect(rows.every((row) => !/^[\[{]/.test(row.value))).toBe(true);
  });

  it("accepts serialized specs without crashing on malformed JSON", () => {
    expect(deviceSpecGroups({ ...device, specs: JSON.stringify(device.specs) as never })).toEqual(
      deviceSpecGroups(device),
    );
    expect(
      deviceSpecGroups({ ...device, specs: "{bad json" as never }).map((group) => group.title),
    ).toEqual(["Performance and software", "Battery and charging"]);
  });
});
