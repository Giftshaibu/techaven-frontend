import { ShopProductPreview } from "./ShopProductPreview";
import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { shopProductCount, type Shop } from "@/data/catalog";
import { type CatalogShop } from "@/lib/catalog-api";
import { marketplaceMedia } from "@/data/media";

export function ShopCard({ shop }: { shop: Shop | CatalogShop }) {
  const catalogShop = shop as CatalogShop;
  const listed = catalogShop.productCount ?? shopProductCount(shop.slug);
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
      <Link
        to="/shops/$shopSlug"
        params={{ shopSlug: shop.slug }}
        className="group grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 h-[128px] md:h-auto md:min-h-[278px] md:block bg-surface p-3 transition-colors hover:border-brand-300"
      >
        <div className="relative min-w-0">
          <ImageStage
            category="home-electronics"
            src={catalogShop.logoUrl ?? marketplaceMedia.shop.src}
            fit={catalogShop.logoUrl ? "contain" : "cover"}
            alt=""
            position={marketplaceMedia.shop.position}
            ratio="wide"
            sizes="(max-width: 767px) 82vw, (max-width: 1023px) 50vw, 25vw"
            className="!aspect-square md:!aspect-[16/9] rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="hidden md:block absolute bottom-2 left-2 rounded-md bg-surface/90 px-2 py-1 text-xs font-bold text-brand-800 backdrop-blur-sm">
            {shop.name}
          </span>
        </div>

        <div className="min-w-0 md:mt-3 flex items-start gap-2.5">
          <span className="hidden md:grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
            {shop.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1 text-[15px] font-semibold text-ink-800">
              <span className="truncate group-hover:underline">{shop.name}</span>
              {shop.verified ? (
                <Icon name="verified-check-bold" className="h-4 w-4 shrink-0 text-brand-500" />
              ) : null}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {catalogShop.address || shop.location}
            </p>
          </div>
        </div>

        <div className="col-start-2 mt-1 md:mt-3 flex h-8 items-center gap-x-3 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <Icon name="map-point-linear" className="h-3.5 w-3.5" />
            {shop.location}
          </span>
          <span className="shrink-0">{listed} products</span>
        </div>
      </Link>
      <ShopProductPreview shopId={catalogShop.apiId ?? 0} name={shop.name} />
    </article>
  );
}
