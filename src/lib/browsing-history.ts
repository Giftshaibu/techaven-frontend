import type { CatalogProduct } from "@/lib/catalog-api";
export type Visit = { kind: "product" | "shop"; slug: string; category?: string; at: number };
const KEY = "techaven.browsing.v1";
const AGE = 30 * 86400000;
export function readVisits(now = Date.now()): Visit[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (v): v is Visit =>
          v &&
          ["product", "shop"].includes(v.kind) &&
          typeof v.slug === "string" &&
          Number.isFinite(v.at) &&
          v.at <= now &&
          now - v.at < AGE,
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
export function recordVisit(visit: Omit<Visit, "at">) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        [
          { ...visit, at: Date.now() },
          ...readVisits().filter((v) => v.kind !== visit.kind || v.slug !== visit.slug),
        ].slice(0, 20),
      ),
    );
  } catch {
    /* Browsing remains available without storage. */
  }
}
export function clearVisits() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Optional storage. */
  }
}
export function rankProducts(products: CatalogProduct[], visits: Visit[]): CatalogProduct[] {
  const score = (p: CatalogProduct) => {
    const product = visits.findIndex((v) => v.kind === "product" && v.slug === p.slug);
    const shop = visits.findIndex((v) => v.kind === "shop" && v.slug === p.shop);
    const category = visits.findIndex((v) => v.kind === "product" && v.category === p.category);
    return product >= 0
      ? 300 - product
      : shop >= 0
        ? 200 - shop
        : category >= 0
          ? 100 - category
          : 0;
  };
  return [
    ...new Map(
      products.filter((p) => p.price > 0 && p.inStock !== false).map((p) => [p.slug, p]),
    ).values(),
  ]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 8);
}
