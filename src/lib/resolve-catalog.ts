import {
  getCategories,
  getCategoryProducts,
  getProduct,
  getProducts,
  getShop,
  getShopProducts,
  searchProducts,
  type ProductsQuery,
} from "@/integrations/techaven/customer";
import { getCategory, getShop as getMockShop } from "@/data/catalog";
import type { Category } from "@/data/catalog";
import {
  categorySlugFromApi,
  mapApiCategoryToCatalog,
  mapApiProductToCatalog,
  mapApiShopToCatalog,
  parseApiCategoryId,
  parseApiProductId,
  parseApiShopId,
  type CatalogProduct,
  type CatalogShop,
} from "@/lib/catalog-api";

export async function resolveProduct(slug: string): Promise<CatalogProduct | null> {
  const id = parseApiProductId(slug);
  if (id != null) {
    try {
      const api = await getProduct(id);
      return mapApiProductToCatalog(api);
    } catch {
      return null;
    }
  }
  return null;
}

export async function resolveShop(slug: string): Promise<CatalogShop | null> {
  const id = parseApiShopId(slug);
  if (id != null) {
    try {
      const api = await getShop(id);
      return mapApiShopToCatalog(api);
    } catch {
      return null;
    }
  }
  const mock = getMockShop(slug);
  if (!mock) return null;
  return { ...mock, apiId: 0 };
}

export async function resolveCategory(slug: string): Promise<{
  category: Category;
  apiCategoryId: number | null;
} | null> {
  const id = parseApiCategoryId(slug);
  if (id != null) {
    try {
      const list = await getCategories();
      const match = list.find((c) => c.id === id);
      if (match) {
        return { category: mapApiCategoryToCatalog(match), apiCategoryId: id };
      }
    } catch {
      /* fall through */
    }
  }
  const mock = getCategory(slug);
  if (mock) return { category: mock, apiCategoryId: null };
  try {
    const list = await getCategories();
    const bySlug = list.find((c) => categorySlugFromApi(c) === slug || slugify(c.name) === slug);
    if (bySlug) {
      return { category: mapApiCategoryToCatalog(bySlug), apiCategoryId: bySlug.id };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchProductsPage(page = 1, limit = 30) {
  const data = await getProducts({ page, limit, sort: "newest" });
  const products = (data.products ?? []).map((p) => mapApiProductToCatalog(p));
  return { products, pagination: data.pagination };
}

export async function fetchCategoryProducts(categoryId: number, page = 1, limit = 30) {
  const data = await getCategoryProducts(categoryId, page, limit);
  const products = (data.products ?? []).map((p) => mapApiProductToCatalog(p));
  return { products, pagination: data.pagination };
}

export async function fetchShopProducts(shopId: number, page = 1, limit = 30) {
  const data = await getShopProducts(shopId, page, limit);
  const products = (data.products ?? []).map((p) => mapApiProductToCatalog(p));
  return { products, pagination: data.pagination };
}

export async function searchCatalogProducts(q: string, page = 1, limit = 30) {
  const data = await searchProducts(q, { page, limit });
  const products = (data.products ?? []).map((p) => mapApiProductToCatalog(p));
  return { products, pagination: data.pagination };
}

const PRODUCT_LIST_PAGE_SIZE = 48;

function paginationHasNext(page: number, raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Record<string, unknown>;
  if (typeof p.has_next === "boolean") return p.has_next;
  const current = Number(p.current_page ?? page);
  const totalPages = Number(p.total_pages);
  if (Number.isFinite(current) && Number.isFinite(totalPages) && totalPages > 0) {
    return current < totalPages;
  }
  return false;
}

export async function fetchProductListing(
  page = 1,
  limit = PRODUCT_LIST_PAGE_SIZE,
  sort: ProductsQuery["sort"] = "newest",
) {
  const data = await getProducts({ page, limit, sort });
  const products = (data.products ?? []).map((p) => mapApiProductToCatalog(p));
  const hasMore =
    paginationHasNext(page, data.pagination) ||
    (products.length >= limit && !paginationHasNext(page, data.pagination) && data.pagination == null);
  return { products, page, hasMore, sort };
}

export async function loadHomeFeed() {
  const [categories, productsData, shops] = await Promise.all([
    getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
    getProducts({ page: 1, limit: 30 }).catch(() => ({ products: [], pagination: {} })),
    import("@/integrations/techaven/customer").then((m) => m.getShops()).catch(() => []),
  ]);

  const mappedCategories = categories.map(mapApiCategoryToCatalog);
  const allProducts = (productsData.products ?? []).map((p) => mapApiProductToCatalog(p));
  const mappedShops = shops.map(mapApiShopToCatalog);

  let banners: { id?: number; title?: string; image?: string; link?: string }[] = [];
  try {
    const raw = await import("@/integrations/techaven/customer").then((m) => m.getBanners());
    banners = Array.isArray(raw) ? raw : [];
  } catch {
    banners = [];
  }

  return {
    categories: mappedCategories,
    products: allProducts,
    shops: mappedShops,
    banners,
    pagination: productsData.pagination,
  };
}
