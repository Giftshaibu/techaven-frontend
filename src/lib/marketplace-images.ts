type Image = { url: string; is_primary?: boolean; media_type?: string };
type DeviceImages = { primary_image_url?: string | null; media?: Image[] };

/** Prefer catalogue photography and fall back to images attached to the selected offer. */
export function marketplaceImages(device: DeviceImages | undefined, offer?: { images?: Image[] }): string[] {
  const stock = [...(device?.media ?? [])]
    .filter((image) => image.media_type === "image")
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
    .map((image) => image.url);
  const catalogue = [...new Set([...stock, device?.primary_image_url].filter((url): url is string => Boolean(url)))];
  const evidence = [...(offer?.images ?? [])]
    .sort((a,b)=>Number(Boolean(b.is_primary))-Number(Boolean(a.is_primary)))
    .map(image=>image.url);
  const [cover, ...additional] = catalogue;
  return [...new Set(cover ? [cover, ...evidence, ...additional] : evidence.filter(Boolean))];
}
