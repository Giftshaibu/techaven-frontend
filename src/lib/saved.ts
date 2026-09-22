import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/integrations/techaven/customer";
import { productSlugFromApiId } from "@/lib/catalog-api";
import { useAuth } from "@/lib/auth";

export function useSavedSlugs() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["wishlist", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const data = await getWishlist();
      return (data.items ?? []).map((item) =>
        item.product?.slug && !String(item.product.slug).match(/^\d+$/)
          ? String(item.product.slug)
          : productSlugFromApiId(item.product_id),
      );
    },
  });

  return { slugs: query.data ?? [], isLoading: query.isLoading, signedIn: Boolean(user) };
}

export function useToggleSaved() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      saved,
      productId,
    }: {
      slug: string;
      saved: boolean;
      productId?: number;
    }) => {
      if (!user) throw new Error("Sign in to save products");
      const id =
        productId ??
        (slug.startsWith("p-") ? Number(slug.slice(2)) : Number.isFinite(Number(slug)) ? Number(slug) : NaN);
      if (!Number.isFinite(id)) {
        throw new Error("This product cannot be saved until it is loaded from the shop catalog.");
      }
      if (saved) await removeFromWishlist(id);
      else await addToWishlist({ product_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
