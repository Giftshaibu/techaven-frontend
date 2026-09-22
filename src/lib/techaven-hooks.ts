import { useQuery } from "@tanstack/react-query";

import {
  getBanners,
  getCategories,
  getPlatformSettings,
  getProducts,
  getShops,
  getProduct,
  getShop,
  getShopProducts,
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

export function useTechavenProducts(params?: Parameters<typeof getProducts>[0]) {
  return useQuery({
    queryKey: techavenKeys.products(params),
    queryFn: () => getProducts(params),
  });
}

export function useTechavenProduct(id: number | string | null) {
  return useQuery({
    queryKey: techavenKeys.product(id ?? ""),
    enabled: id != null && id !== "",
    queryFn: () => getProduct(id!),
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
    queryFn: () => getShopProducts(shopId!, page),
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
  });
}
