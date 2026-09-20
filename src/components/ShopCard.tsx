import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { shopProductCount, type Shop } from "@/data/catalog";
import { marketplaceMedia } from "@/data/media";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      to="/shops/$shopSlug"
      params={{ shopSlug: shop.slug }}
      className="group block rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-brand-300"
    >
      <div className="relative">
        <ImageStage
          category="home-electronics"
          src={marketplaceMedia.shop.src}
          alt=""
          position={marketplaceMedia.shop.position}
          ratio="wide"
          sizes="(max-width: 767px) 82vw, (max-width: 1023px) 50vw, 25vw"
          className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-2 left-2 rounded-md bg-surface/90 px-2 py-1 text-xs font-bold text-brand-800 backdrop-blur-sm">
          {shop.name}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
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
          <p className="truncate text-xs text-muted-foreground">{shop.specialty}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Icon name="star-bold" className="h-3.5 w-3.5 text-rating" />
          <span className="font-semibold text-ink-800">{shop.rating.toFixed(1)}</span>
          <span>({shop.orders.toLocaleString("en-US")} orders)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon name="map-point-linear" className="h-3.5 w-3.5" />
          {shop.location}
        </span>
        <span>{shopProductCount(shop.slug)} products</span>
      </div>
    </Link>
  );
}
