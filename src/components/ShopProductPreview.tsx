import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { fetchShopProducts } from "@/lib/resolve-catalog";
import { selectMarketplaceOffer } from "@/lib/catalog-api";
import { formatMwk } from "@/data/catalog";
import { ImageStage } from "./ImageStage";

export function ShopProductPreview({ shopId, name }: { shopId: number; name: string }) {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [edges, setEdges] = useState({ back: false, next: false });
  const products = useQuery({
    queryKey: ["shop-product-previews", shopId],
    enabled: visible && shopId > 0,
    staleTime: 300000,
    queryFn: async () => {
      const data = await fetchShopProducts(shopId, 1, 6);
      return data.products.flatMap((product) => {
        const offer = product.offers
          ?.filter((o) => o.shop?.id === shopId && o.quantity > 0)
          .sort((a, b) => a.price - b.price || a.id - b.id)[0];
        return offer ? [selectMarketplaceOffer(product, offer)] : [];
      });
    },
  });
  useEffect(() => {
    if (!root.current) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () =>
      setEdges({
        back: element.scrollLeft > 3,
        next: element.scrollLeft + element.clientWidth < element.scrollWidth - 3,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [products.data]);
  function move(direction: number) {
    rail.current?.scrollBy({
      left: direction * 145,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }
  return (
    <div ref={root} className="min-w-0 border-t border-border px-3 pb-3" data-shop-preview={shopId}>
      <div className="flex h-11 items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-800">In this shop</p>
        <div className="flex" aria-label={`${name} product controls`}>
          <button
            type="button"
            aria-label={`Previous products from ${name}`}
            disabled={!edges.back}
            onClick={() => move(-1)}
            className="h-11 w-11 rounded-lg text-xl disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={`Next products from ${name}`}
            disabled={!edges.next}
            onClick={() => move(1)}
            className="h-11 w-11 rounded-lg text-xl disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>
      <div className="h-[182px]">
        {products.isError ? (
          <div
            role="status"
            className="flex h-full flex-col justify-center gap-2 text-xs text-muted-foreground"
          >
            <p>Products couldn’t load.</p>
            <button
              onClick={() => void products.refetch()}
              className="min-h-11 self-start font-semibold text-brand-500"
            >
              Try again
            </button>
          </div>
        ) : products.data?.length === 0 || shopId <= 0 ? (
          <p className="flex h-full items-center text-xs text-muted-foreground">
            No products available yet.
          </p>
        ) : !products.data ? (
          <div aria-label="Loading shop products" className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[170px] w-28 shrink-0 rounded-xl bg-stage" />
            ))}
          </div>
        ) : (
          <div
            ref={rail}
            role="region"
            aria-label={`Products from ${name}`}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                event.stopPropagation();
                move(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
            className="no-scrollbar flex h-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain"
          >
            {products.data.map((product) => (
              <Link
                key={product.listingId}
                to="/product/$slug"
                params={{ slug: product.slug }}
                search={product.listingId ? { listing: product.listingId } : {}}
                className="w-28 shrink-0 snap-start"
              >
                <ImageStage
                  src={product.imageUrl}
                  category={product.category}
                  alt={product.name}
                  sizes="112px"
                  className="h-[100px] w-28 !aspect-auto"
                />
                <p className="mt-2 line-clamp-2 h-8 text-xs leading-4 text-ink-800">
                  {product.name}
                </p>
                <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-ink-800">
                  {formatMwk(product.price)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
