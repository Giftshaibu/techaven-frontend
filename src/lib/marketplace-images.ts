type Image = { url: string; is_primary?: boolean; media_type?: string };
type DeviceImages = { primary_image_url?: string | null; media?: Image[] };

/** Only catalogue stock photography may be a product cover. Seller evidence
 * remains attached to its listing; it cannot fill an unavailable stock photo. */
export function marketplaceImages(device: DeviceImages | undefined, offer?: { images?: Image[] }): string[] {
  const stock = [...(device?.media ?? [])]
    .filter((image) => image.media_type === "image")
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
    .map((image) => image.url);
  const catalogue = [...new Set([...stock, device?.primary_image_url].filter((url): url is string => Boolean(url)))];
  if (!catalogue.length) return [];
  const evidence = [...(offer?.images ?? [])]
    .sort((a,b)=>Number(Boolean(b.is_primary))-Number(Boolean(a.is_primary)))
    .map(image=>image.url);
  return [...new Set([catalogue[0], ...evidence, ...catalogue.slice(1)])];
}
