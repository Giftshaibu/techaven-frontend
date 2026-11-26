import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import {
  getBanners,
  getCategories,
  getPlatformSettings,
  getMarketplaceDevices,
  getShops,
  getMarketplaceDevice,
  getShop,
} from "@/integrations/techaven/customer";

export const techavenKeys = {
  products: (params?: Record<string, unknown>) => ["techaven", "products", params] as const,
  product: (id: string | number) => ["techaven", "product", id] as const,
  categories: () => ["techaven", "categories"] as const,
  shops: () => ["techaven", "shops"] as const,
  shop: (id: string | number) => ["techaven", "shop", id] as const,
  shopProducts: (id: string | number, page?: number) =>
    ["techaven", "shop", id, "products", page] as const,
  banners: () => ["techaven", "banners"] as const,
  platformSettings: () => ["techaven", "platform-settings"] as const,
};

export function useTechavenProducts(params?: Parameters<typeof getMarketplaceDevices>[0]) {
  return useQuery({
    queryKey: techavenKeys.products(params),
    queryFn: () => getMarketplaceDevices(params),
  });
}

export function useTechavenProduct(id: number | string | null) {
  return useQuery({
    queryKey: techavenKeys.product(id ?? ""),
    enabled: id != null && id !== "",
    queryFn: () => getMarketplaceDevice(id!),
  });
}

export function useTechavenCategories() {
  return useQuery({
    queryKey: techavenKeys.categories(),
    queryFn: getCategories,
  });
}

export function useTechavenShops() {
  return useQuery({
    queryKey: techavenKeys.shops(),
    queryFn: getShops,
  });
}

export function useTechavenShop(id: number | string | null) {
  return useQuery({
    queryKey: techavenKeys.shop(id ?? ""),
    enabled: id != null && id !== "",
    queryFn: () => getShop(id!),
  });
}

export function useTechavenShopProducts(shopId: number | string | null, page = 1) {
  return useQuery({
    queryKey: techavenKeys.shopProducts(shopId ?? "", page),
    enabled: shopId != null && shopId !== "",
    queryFn: () => getMarketplaceDevices({ shop_id: Number(shopId), page }),
  });
}

export function useTechavenBanners() {
  return useQuery({
    queryKey: techavenKeys.banners(),
    queryFn: getBanners,
  });
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: techavenKeys.platformSettings(),
    queryFn: getPlatformSettings,
    staleTime: 60_000,
  });
}

/**
 * Whether the storefront shows its Shops tab and "browse shops" links. Admins can hide them in
 * Settings; products, and the shop name on each offer, stay visible either way.
 */
export function useShopsTabVisible() {
  // The root loader reads the switch during the server render; the query keeps it fresh afterwards.
  const fromServer = useRouterState({
    select: (state) =>
      (state.matches[0]?.loaderData as { shopsTabHidden?: boolean } | undefined)?.shopsTabHidden,
  });
  const live = usePlatformSettings().data?.shops_tab_hidden;
  return !(live ?? fromServer ?? false);
}
