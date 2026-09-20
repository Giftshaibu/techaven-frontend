import { useEffect, useState } from "react";

export const COMPARE_STORAGE_KEY = "techaven.compare.v1";
export const MAX_COMPARE_ITEMS = 3;
const COMPARE_CHANGE_EVENT = "techaven:compare-change";

export function readCompareSelection(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === "string");
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
    return stored.length ? stored : initialSelection;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = () => {
      const stored = readCompareSelection();
      setSelected(stored.length ? stored : initialSelection);
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

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = toggleCompareSelection(prev, slug);
      writeCompareSelection(next);
      return next;
    });
  };

  const remove = (slug: string) => {
    setSelected((prev) => {
      const next = removeCompareSelection(prev, slug);
      writeCompareSelection(next);
      return next;
    });
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
