import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  addCartItem,
  clearCart as apiClearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/integrations/techaven/customer";
import type { CartItem } from "@/integrations/techaven/types";
import { useAuth } from "@/lib/auth";
import { mapApiProductToCatalog, productSlugFromApiId, type CatalogProduct } from "@/lib/catalog-api";

export type CartLine = {
  slug: string;
  productId: number;
  quantity: number;
  cartItemId?: string;
  product?: CatalogProduct;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (product: CatalogProduct, quantity?: number) => Promise<void>;
  setQuantity: (slug: string, quantity: number) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  ready: boolean;
  syncing: boolean;
  refresh: () => Promise<void>;
};

const STORAGE_KEY = "techaven.cart.v2";

function catalogProductFromCartItem(item: CartItem): CatalogProduct | undefined {
  if (item.product) return mapApiProductToCatalog(item.product);

  const productId = Number(item.product_id);
  if (!Number.isFinite(productId) || productId <= 0) return undefined;

  const name = item.product_name?.trim() || "Product";
  const price = Number(item.unit_price) || 0;
  const imageUrl = item.product_image?.trim() || undefined;

  return mapApiProductToCatalog({
    id: productId,
    name,
    price,
    image_url: imageUrl,
    stock: item.stock ?? 1,
  });
}

function lineFromApiItem(item: CartItem): CartLine | null {
  const productId = Number(item.product_id);
  if (!Number.isFinite(productId) || productId <= 0) return null;
  const product = catalogProductFromCartItem(item);
  return {
    slug: product?.slug ?? productSlugFromApiId(productId),
    productId,
    quantity: item.quantity,
    cartItemId: item.id != null ? String(item.id) : undefined,
    product,
  };
}

function parseLocalLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const productId = Number(r.productId);
      const quantity = Number(r.quantity);
      const slug = typeof r.slug === "string" ? r.slug : productSlugFromApiId(productId);
      if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity)) return null;
      return { slug, productId, quantity, product: r.product as CatalogProduct | undefined };
    })
    .filter((l): l is CartLine => l != null);
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const persistLocal = useCallback((next: CartLine[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const data = await getCart();
      const items = (data.items ?? []) as CartItem[];
      const mapped = items.map(lineFromApiItem).filter((l): l is CartLine => l != null);
      setLines((prev) =>
        mapped.map((line) => {
          if (line.product) return line;
          const existing = prev.find((p) => p.productId === line.productId);
          return existing?.product ? { ...line, product: existing.product } : line;
        }),
      );
    } catch {
      /* keep local lines */
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const syncLocalToServer = useCallback(async (local: CartLine[]) => {
    for (const line of local) {
      await addCartItem({ product_id: line.productId, quantity: line.quantity });
    }
    window.localStorage.removeItem(STORAGE_KEY);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(parseLocalLines(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      persistLocal(lines);
      return;
    }
    void (async () => {
      const localRaw = window.localStorage.getItem(STORAGE_KEY);
      const local = localRaw ? parseLocalLines(JSON.parse(localRaw)) : [];
      if (local.length) {
        setSyncing(true);
        try {
          await syncLocalToServer(local);
        } catch {
          toast.error("Could not sync your basket. Items stay on this device.");
          setLines(local);
        } finally {
          setSyncing(false);
        }
      } else {
        await refresh();
      }
    })();
  }, [user, ready]); // eslint-disable-line react-hooks/exhaustive-deps -- run on login only when ready

  useEffect(() => {
    if (!ready || user) return;
    persistLocal(lines);
  }, [lines, ready, user, persistLocal]);

  const add = useCallback(
    async (product: CatalogProduct, quantity = 1) => {
      if (product.apiId <= 0) {
        toast.error("This product is not available for checkout yet.");
        return;
      }
      const slug = product.slug;
      const productId = product.apiId;

      const optimistic = (prev: CartLine[]) => {
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === productId ? { ...l, quantity: l.quantity + quantity, product } : l,
          );
        }
        return [...prev, { slug, productId, quantity, product }];
      };

      setLines(optimistic);

      if (!user) return;

      setSyncing(true);
      try {
        await addCartItem({ product_id: productId, quantity });
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not add to basket");
        await refresh();
      } finally {
        setSyncing(false);
      }
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (slug: string) => {
      const line = lines.find((l) => l.slug === slug);
      setLines((prev) => prev.filter((l) => l.slug !== slug));

      if (!user || !line?.cartItemId) return;

      setSyncing(true);
      try {
        await removeCartItem(line.cartItemId);
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not remove item");
        await refresh();
      } finally {
        setSyncing(false);
      }
    },
    [lines, user, refresh],
  );

  const setQuantity = useCallback(
    async (slug: string, quantity: number) => {
      const line = lines.find((l) => l.slug === slug);
      if (!line) return;

      if (quantity <= 0) {
        await remove(slug);
        return;
      }

      setLines((prev) => prev.map((l) => (l.slug === slug ? { ...l, quantity } : l)));

      if (!user || !line.cartItemId) return;

      setSyncing(true);
      try {
        await updateCartItem(line.cartItemId, { quantity });
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update quantity");
        await refresh();
      } finally {
        setSyncing(false);
      }
    },
    [lines, user, refresh, remove],
  );

  const clear = useCallback(async () => {
    setLines([]);
    if (user) {
      setSyncing(true);
      try {
        await apiClearCart();
      } catch {
        /* ignore */
      } finally {
        setSyncing(false);
      }
    }
    window.localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      ready,
      syncing,
      refresh,
    }),
    [lines, add, setQuantity, remove, clear, ready, syncing, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
