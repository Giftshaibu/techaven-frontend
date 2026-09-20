import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useSavedSlugs() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["saved-products", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_products")
        .select("product_slug")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((row) => row.product_slug);
    },
  });

  return { slugs: query.data ?? [], isLoading: query.isLoading, signedIn: Boolean(user) };
}

export function useToggleSaved() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, saved }: { slug: string; saved: boolean }) => {
      if (!user) throw new Error("Sign in to save products");
      if (saved) {
        const { error } = await supabase
          .from("saved_products")
          .delete()
          .eq("product_slug", slug)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_products")
          .insert({ product_slug: slug, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-products"] });
    },
  });
}
