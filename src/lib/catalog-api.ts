import { marketplaceImages } from "@/lib/marketplace-images";
import type { ApiCategory, ApiProduct, ApiShop, MarketplaceDevice, MarketplaceOffer } from "@/integrations/techaven/types";
import type { Category, Condition, Product, Shop } from "@/data/catalog";

/** Product loaded from Techaven API (storefront shape + API fields) */
export type CatalogProduct = Product & {
  apiId: number;
  imageUrl?: string;
  images?: string[];
  description?: string;
  shopName?: string;
  categoryId?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isHotSale?: boolean;
  isSpecialOffer?: boolean;
  listingId?: number;
  offers?: MarketplaceOffer[];
  marketplaceDevice?: MarketplaceDevice;
};

export type CatalogShop = Shop & {
  apiId: number;
  logoUrl?: string | null;
  productCount?: number;
  followersCount?: number;
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productSlugFromApiId(id: number): string {
  return `p-${id}`;
}

export function parseApiProductId(slug: string): number | null {
  if (slug.startsWith("p-")) {
    const n = Number(slug.slice(2));
    return Number.isFinite(n) ? n : null;
  }
  const asNum = Number(slug);
  return Number.isFinite(asNum) && String(asNum) === slug ? asNum : null;
}

export function categorySlugFromApi(c: ApiCategory): string {
  if (c.slug && !c.slug.match(/^\d+$/)) return c.slug;
  return `c-${c.id}`;
}

export function parseApiCategoryId(slug: string): number | null {
  if (slug.startsWith("c-")) {
    const n = Number(slug.slice(2));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function shopSlugFromApiId(id: number): string {
  return `shop-${id}`;
}

export function parseApiShopId(slug: string): number | null {
  if (slug.startsWith("shop-")) {
    const n = Number(slug.slice(5));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickImage(api: ApiProduct): string | undefined {
  const direct =
    (api.image_url as string | undefined) ||
    (api.image as string | undefined) ||
    (api.thumbnail as string | undefined);
  if (direct) return direct;
  const list = api.images_urls ?? api.images;
  if (Array.isArray(list) && list.length && typeof list[0] === "string") return list[0];
  return undefined;
}

function pickImages(api: ApiProduct): string[] {
  const list = api.images_urls ?? api.images;
  if (Array.isArray(list)) return list.filter((x): x is string => typeof x === "string");
  const one = pickImage(api);
  return one ? [one] : [];
}

function nestedShopName(api: ApiProduct): string | undefined {
  const shop = api.shop as { name?: string } | undefined;
  return shop?.name ?? (typeof api.vendor === "string" ? api.vendor : undefined);
}

const defaultCategoryIcon = "box-minimalistic-linear";

function brandDisplayName(name: string): string {
  if (name.toLowerCase() === "hp") return "HP";
  if (name.toLowerCase() === "itel") return "itel";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function mapApiCategoryToCatalog(c: ApiCategory): Category {
  const slug = categorySlugFromApi(c);
  return {
    slug,
    name: c.name,
    icon: defaultCategoryIcon,
    blurb: c.description ?? `Shop ${c.name} on Techaven.`,
    subcategories: [],
    brands: (c.brands ?? []).map((brand) => brandDisplayName(brand.name)),
    brandTiles: (c.brands ?? []).map((brand) => ({ ...brand, name: brandDisplayName(brand.name) })),
  };
}

export function mapApiProductToCatalog(
  api: ApiProduct,
  categoryName = "Electronics",
  categorySlug?: string,
): CatalogProduct {
  const slug =
    api.slug && typeof api.slug === "string" && !api.slug.match(/^\d+$/)
      ? api.slug
      : productSlugFromApiId(api.id);
  const shopId = api.shop_id != null ? Number(api.shop_id) : undefined;
  const imageUrl = pickImage(api);
  return {
    apiId: api.id,
    slug,
    name: api.name,
    brand: (api.vendor as string) ?? nestedShopName(api) ?? "Techaven",
    category: categorySlug ?? categoryName,
    shop: shopId ? shopSlugFromApiId(shopId) : "unknown",
    shopName: nestedShopName(api),
    price: Number(api.price) || 0,
    oldPrice: api.original_price != null ? Number(api.original_price) : undefined,
    condition: "New",
    rating: Number(api.rating) || 0,
    reviews: Number(api.total_reviews) || 0,
    shopsCount: 1,
    warranty: "Shop warranty",
    delivery: "Delivery at checkout",
    inStock: (api.stock ?? 1) > 0,
    specs: [],
    highlights: [],
    imageUrl,
    images: pickImages(api),
    description: typeof api.description === "string" ? api.description : undefined,
    categoryId: api.category_id != null ? Number(api.category_id) : undefined,
    isFeatured: Boolean(api.is_featured),
    isNewArrival: Boolean(api.is_new_arrival),
    isHotSale: Boolean(api.is_hot_sale),
    isSpecialOffer: Boolean(api.is_special_offer),
  };
}

const conditionLabel: Record<MarketplaceOffer["condition"], Condition> = {
  new: "New", used: "Good refurbished", refurbished: "Excellent refurbished", open_box: "Open box",
};

export function mapMarketplaceDeviceToCatalog(device: MarketplaceDevice): CatalogProduct {
  const offers = [...(device.offers ?? [])].sort((a, b) => a.price - b.price || a.id - b.id);
  const offer = offers[0];
  const images = marketplaceImages(device, offer);
  const specs = [
    device.soc ? { label: "Processor", value: device.soc } : null,
    device.battery_mah ? { label: "Battery", value: `${device.battery_mah} mAh` } : null,
    device.os_family ? { label: "Operating system", value: device.os_family } : null,
  ].filter((value): value is { label: string; value: string } => value != null);
  return {
    apiId: device.id,
    ...(offer ? { listingId: offer.id } : {}),
    slug: device.slug,
    name: device.name,
    brand: device.brand?.name ?? "Techaven",
    category: device.category ? `c-${device.category.id}` : "electronics",
    ...(device.category ? { categoryId: device.category.id } : {}),
    shop: offer?.shop ? shopSlugFromApiId(offer.shop.id) : "unknown",
    ...(offer?.shop?.name ? { shopName: offer.shop.name } : {}),
    price: offer?.price ?? 0,
    condition: offer ? conditionLabel[offer.condition] : "New",
    rating: 0,
    reviews: 0,
    shopsCount: new Set(offers.map((item) => item.shop?.id).filter(Boolean)).size,
    warranty: offer?.warranty_months ? `${offer.warranty_months}-month warranty` : "Shop warranty",
    delivery: "Delivery at checkout",
    inStock: offers.some((item) => item.quantity > 0),
    specs,
    highlights: [],
    ...(images[0] ? { imageUrl: images[0] } : {}),
    images,
    offers,
    marketplaceDevice: device,
  };
}

export function mapApiShopToCatalog(api: ApiShop): CatalogShop {
  return {
    apiId: api.id,
    slug: shopSlugFromApiId(api.id),
    name: api.name,
    specialty: api.description?.slice(0, 80) ?? "Electronics",
    location: api.location ?? "Malawi",
    verified: Boolean(api.is_verified),
    rating: Number(api.rating) || 0,
    orders: Number(api.total_products) || 0,
    blurb: api.description ?? "",
    logoUrl: api.logo ?? null,
    productCount: api.total_products,
    followersCount: api.followers_count,
  };
}

export function filterHotSales(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((p) => p.isHotSale);
}

export function filterNewArrivals(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((p) => p.isNewArrival);
}

export function filterSpecialOffers(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((p) => p.isSpecialOffer || (p.oldPrice && p.oldPrice > p.price));
}

export function filterFeatured(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((p) => p.isFeatured);
}

export function conditionFromApi(_api: ApiProduct): Condition {
  return "New";
}

export function shopListingCount(shop: Shop & { productCount?: number }): number {
  return shop.productCount ?? 0;
}

export function categoryIconForSlug(slug: string): string {
  const key = slug.replace(/^c-\d+$/, "").split("-")[0];
  const map: Record<string, string> = {
    smartphones: "smartphone-2-linear",
    phones: "smartphone-2-linear",
    laptops: "laptop-minimalistic-linear",
    tablets: "tablet-linear",
    gaming: "gamepad-linear",
    audio: "headphones-round-linear",
    wearables: "watch-round-linear",
    accessories: "plug-circle-linear",
    electronics: "tv-linear",
  };
  return map[key ?? ""] ?? defaultCategoryIcon;
}

export function enrichCategoryIcons(categories: Category[]): Category[] {
  return categories.map((c) => ({
    ...c,
    icon: c.icon === defaultCategoryIcon ? categoryIconForSlug(c.slug) : c.icon,
  }));
}
