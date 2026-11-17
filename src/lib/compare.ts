import { useQuery } from "@tanstack/react-query";
import { selectMarketplaceOffer } from "@/lib/catalog-api";
import { resolveProduct } from "@/lib/resolve-catalog";
import { products } from "@/data/catalog";
import { useEffect, useState } from "react";

export const COMPARE_STORAGE_KEY = "techaven.compare.v1";
export const MAX_COMPARE_ITEMS = 2;
const OFFER_STORAGE_PREFIX = "techaven.compare.offer.";
const COMPARE_CHANGE_EVENT = "techaven:compare-change";

export function readCompareSelection(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return [...new Set(parsed.filter((value): value is string => typeof value === "string"))].slice(0, MAX_COMPARE_ITEMS);
  } catch {
    return [];
  }
}

export function writeCompareSelection(slugs: string[]) {
  if (typeof window === "undefined") return;

  try {
    const normalized = [...new Set(slugs)].slice(0, MAX_COMPARE_ITEMS);
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(COMPARE_CHANGE_EVENT));
  } catch {
    // storage may be unavailable
  }
}

export function clearCompareSelection() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(COMPARE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(COMPARE_CHANGE_EVENT));
  } catch {
    // storage may be unavailable
  }
}

export function toggleCompareSelection(current: string[], slug: string) {
  if (current.includes(slug)) {
    return current.filter((item) => item !== slug);
  }

  if (current.length >= MAX_COMPARE_ITEMS) {
    return current;
  }

  return [...current, slug];
}

export function removeCompareSelection(current: string[], slug: string) {
  return current.filter((item) => item !== slug);
}

export function useCompareSelection(initialSelection: string[] = []) {
  const initialSelectionKey = initialSelection.join("|");
  const [selected, setSelected] = useState<string[]>(() => {
    const stored = readCompareSelection();
    return (stored.length ? stored : initialSelection).slice(0, MAX_COMPARE_ITEMS);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = () => {
      const stored = readCompareSelection();
      setSelected(stored.length ? stored : initialSelection.slice(0, MAX_COMPARE_ITEMS));
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(COMPARE_CHANGE_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(COMPARE_CHANGE_EVENT, syncFromStorage);
    };
  }, [initialSelectionKey]);

  const commit = (next: string[]) => {
    setSelected(next);
    writeCompareSelection(next);
  };

  const toggle = (slug: string, listingId?: number | undefined) => {
    const current = readCompareSelection();
    const next = toggleCompareSelection(current, slug);
    if (!current.includes(slug) && next.includes(slug)) {
      try {
        if (listingId) window.localStorage.setItem(OFFER_STORAGE_PREFIX + slug, String(listingId));
        else window.localStorage.removeItem(OFFER_STORAGE_PREFIX + slug);
      } catch { /* storage may be unavailable */ }
    }
    commit(next);
  };

  const remove = (slug: string) => {
    commit(removeCompareSelection(readCompareSelection(), slug));
  };

  const clear = () => {
    setSelected([]);
    clearCompareSelection();
  };

  return {
    selected,
    toggle,
    remove,
    clear,
    count: selected.length,
    hasSelection: selected.length > 0,
    isSelected: (slug: string) => selected.includes(slug),
    replaceAll: commit,
  };
}

export function useComparedProducts(selected: string[], replaceAll: (slugs: string[]) => void) {
  const listingIds = selected.map(slug => {
    try { return Number(window.localStorage.getItem(OFFER_STORAGE_PREFIX + slug)); } catch { return 0; }
  });
  const { data } = useQuery({
    queryKey: ["compared-products", selected, listingIds],
    enabled: selected.length > 0,
    queryFn: () => Promise.all(selected.map(async (slug, index) => {
      const product = await resolveProduct(slug);
      const offer = product?.offers?.find(item => item.id === listingIds[index]);
      return product && offer ? selectMarketplaceOffer(product, offer)
        : product ?? products.find(item => item.slug === slug) ?? null;
    })),
  });

  useEffect(() => {
    if (!data || readCompareSelection().join("|") !== selected.join("|")) return;
    const canonical = [...new Set(selected.map((slug, index) => data[index]?.slug ?? slug))];
    if (canonical.join("|") !== selected.join("|")) replaceAll(canonical);
  }, [data, selected, replaceAll]);

  return [...new Map((data ?? []).flatMap((product) =>
    product ? [[product.slug, product] as const] : [],
  )).values()];
}
