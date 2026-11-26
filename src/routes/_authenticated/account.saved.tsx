import { useQuery } from "@tanstack/react-query";
import { TechavenLoader } from "@/components/TechavenLoader";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";
import { ProductGrid } from "@/components/ProductGrid";
import { getWishlist } from "@/integrations/techaven/customer";
import { resolveProduct } from "@/lib/resolve-catalog";
import { mapApiProductToCatalog } from "@/lib/catalog-api";

export const Route = createFileRoute("/_authenticated/account/saved")({
  head: () => ({
    meta: [
      { title: "Saved products — Techaven" },
      { name: "description", content: "The devices you've saved on Techaven." },
      { property: "og:title", content: "Saved products — Techaven" },
      { property: "og:description", content: "The devices you've saved on Techaven." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const wishlist = useQuery({
    queryKey: ["wishlist", "full", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const data = await getWishlist();
      const products = await Promise.all((data.items ?? []).map((item) =>
        item.device_slug ? resolveProduct(item.device_slug) :
          item.product ? mapApiProductToCatalog(item.product) : null,
      ));
      return [...new Map(products.flatMap((product) => product ? [[product.slug, product] as const] : [])).values()];
    },
  });

  if (wishlist.isLoading) {
    return <TechavenLoader label="Gathering your saved products" minHeight="20rem" />;
  }

  if (!wishlist.data?.length) {
    return (
      <div className="rounded-3xl bg-surface p-10 text-center">
        <h2 className="text-xl font-bold text-ink-800">Nothing saved yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap the heart on any product to keep it here for later.
        </p>
        <Link
          to="/categories"
          className="mt-6 inline-flex rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse categories
        </Link>
      </div>
    );
  }

  return <ProductGrid products={wishlist.data} columns={3} />;
}
