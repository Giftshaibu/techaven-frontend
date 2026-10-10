import { TechavenApiError, techavenRequest } from "@/integrations/techaven/client";
import { getMarketplaceDevices, getShop } from "@/integrations/techaven/customer";
import type { ApiShop } from "@/integrations/techaven/types";
import { mapMarketplaceDeviceToCatalog, mapApiShopToCatalog } from "@/lib/catalog-api";

const MAX_REFS = 12;
function deviceIds(values: string[]) {
  return [...new Set(values.flatMap((value) => {
    const match = /^device:(\d+)$/.exec(value);
    return match ? [match[1]!] : [];
  }))].slice(0, MAX_REFS);
}
function ids(values: string[]) { return [...new Set(values.filter((v) => /^\d+$/.test(v)))].slice(0, MAX_REFS); }
function unsupported(error: unknown) {
  return (
    error instanceof TechavenApiError &&
    (error.status === 404 ||
      error.status === 405 ||
      (error.status === 400 && /ids|unsupported/i.test(error.message)))
  );
}
function requestedOrder<T extends { id: number }>(wanted: string[], records: T[]) {
  const byId = new Map(records.map((record) => [String(record.id), record]));
  return wanted.flatMap((id) => {
    const record = byId.get(id);
    return record ? [record] : [];
  });
}
async function concurrent<T>(values: string[], fn: (id: string) => Promise<T>) {
  const out: (T | null)[] = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i += 4)
    await Promise.all(
      values.slice(i, i + 4).map(async (id, j) => {
        try {
          out[i + j] = await fn(id);
        } catch {
          out[i + j] = null;
        }
      }),
    );
  return out.filter((x): x is T => x !== null);
}
export async function resolvePromotionProducts(values: string[]) {
  const wanted = deviceIds(values);
  if (!wanted.length) return [];
  try {
    const data = await getMarketplaceDevices({ ids: wanted.map(Number) });
    return requestedOrder(wanted, data.devices ?? []).map(mapMarketplaceDeviceToCatalog);
  } catch {
    return [];
  }
}
export async function resolvePromotionShops(values: string[]) {
  const wanted = ids(values);
  if (!wanted.length) return [];
  try {
    const data = await techavenRequest<{ shops: ApiShop[] }>(`/api/shops?ids=${wanted.join(",")}`, {
      auth: false,
    });
    return requestedOrder(wanted, data.shops ?? []).map(mapApiShopToCatalog);
  } catch (e) {
    if (!unsupported(e)) return [];
    return (await concurrent(wanted, getShop)).map(mapApiShopToCatalog);
  }
}
