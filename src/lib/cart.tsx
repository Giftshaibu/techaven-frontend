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
import type { MarketplaceCartItem } from "@/integrations/techaven/types";
import { useAuth } from "@/lib/auth";
import { getSession } from '@/integrations/techaven/token';
import type { CatalogProduct } from "@/lib/catalog-api";
import { marketplaceImages } from "@/lib/marketplace-images";

export type CartLine = {
  slug: string;
  productId: number;
  listingId: number;
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

function catalogProductFromCartItem(item: MarketplaceCartItem): CatalogProduct | undefined {
  const device = item.listing?.variant?.device;
  if (!device?.id) return undefined;
  const images = marketplaceImages(device, item.listing);
  const imageUrl = images[0];
  return {
    apiId: device.id, listingId: item.seller_listing_id, slug: device.slug, name: device.name,
    brand: "Techaven", category: "electronics", shop: `shop-${item.listing.shop.id}`,
    shopName: item.listing.shop.name, price: Number(item.unit_price), condition: "New",
    rating: 0, reviews: 0, shopsCount: 1, warranty: "Shop warranty",
    delivery: "Delivery at checkout", inStock: item.is_available, specs: [], highlights: [],
    ...(imageUrl ? { imageUrl, images } : {}),
  };
}

function lineFromApiItem(item: MarketplaceCartItem): CartLine | null {
  const productId = Number(item.listing?.variant?.device?.id);
  const listingId = Number(item.seller_listing_id);
  if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(listingId) || listingId <= 0) return null;
  const product = catalogProductFromCartItem(item);
  return {
    slug: product?.slug ?? `device-${productId}`,
    productId,
    listingId,
    quantity: item.quantity,
    ...(item.id != null ? { cartItemId: String(item.id) } : {}),
    ...(product ? { product } : {}),
  };
}

function parseLocalLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const productId = Number(r["productId"]);
      const listingId = Number(r["listingId"]);
      const quantity = Number(r["quantity"]);
      const slug = typeof r["slug"] === "string" ? r["slug"] : `device-${productId}`;
      if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(listingId) || listingId <= 0 || !Number.isFinite(quantity)) return null;
      const product = r["product"] as CatalogProduct | undefined;
      return { slug, productId, listingId, quantity, ...(product ? { product } : {}) };
    })
    .filter((l): l is CartLine => l != null);
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [lineOwner, setLineOwner] = useState<number | null>(null);
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
      if (getSession()?.user.id !== user.id) return;
      const items = data.items ?? [];
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
    const owner = user?.id;
    for (const line of local) {
      if (getSession()?.user.id !== owner) return;
      await addCartItem({ seller_listing_id: line.listingId, quantity: line.quantity });
    }
    if (getSession()?.user.id !== owner) return;
    window.localStorage.removeItem(STORAGE_KEY);
    await refresh();
  }, [refresh, user?.id]);

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
    if (!ready || authLoading) return;
    if (!user) {
      if (lineOwner !== null) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        try { setLines(raw ? parseLocalLines(JSON.parse(raw)) : []); } catch { setLines([]); }
        setLineOwner(null);
      }
      return;
    }
    setLineOwner(user.id);
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
  }, [user?.id, ready, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps -- synchronize when identity changes

  useEffect(() => {
    if (!ready || authLoading || user || lineOwner !== null) return;
    persistLocal(lines);
  }, [lines, ready, authLoading, user, lineOwner, persistLocal]);

  const add = useCallback(
    async (product: CatalogProduct, quantity = 1) => {
      if (product.apiId <= 0 || !product.listingId) {
        toast.error("This product is not available for checkout yet.");
        return;
      }
      const slug = product.slug;
      const productId = product.apiId;
      const listingId = product.listingId;

      const optimistic = (prev: CartLine[]) => {
        const existing = prev.find((l) => l.listingId === listingId);
        if (existing) {
          return prev.map((l) =>
            l.listingId === listingId ? { ...l, quantity: l.quantity + quantity, product } : l,
          );
        }
        return [...prev, { slug, productId, listingId, quantity, product }];
      };

      setLines(optimistic);

      if (!user) return;

      setSyncing(true);
      try {
        await addCartItem({ seller_listing_id: listingId, quantity });
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
