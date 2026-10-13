type Image = { url: string; is_primary?: boolean; media_type?: string };
type DeviceImages = { primary_image_url?: string | null; media?: Image[] };

/** Catalogue stock photography leads; the selected seller's evidence follows. */
export function marketplaceImages(device: DeviceImages | undefined, offer?: { images?: Image[] }): string[] {
  const stock = [...(device?.media ?? [])]
    .filter((image) => image.media_type === "image")
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
    .map((image) => image.url);
  const seller = [...(offer?.images ?? [])]
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
    .map((image) => image.url);
  const catalogue = [...new Set([...stock, device?.primary_image_url].filter((url): url is string => Boolean(url)))];
  return [...new Set([catalogue[0], ...seller, ...catalogue.slice(1)].filter((url): url is string => Boolean(url)))];
}
