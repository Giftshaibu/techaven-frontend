import { Link, useNavigate } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { discountPercent, formatMwk, getShop, type Product } from "@/data/catalog";
import type { CatalogProduct } from "@/lib/catalog-api";
import { useCompareSelection } from "@/lib/compare";
import { useSavedSlugs, useToggleSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product | CatalogProduct;
  compact?: boolean;
}) {
  const catalogProduct = product as CatalogProduct;
  const shop = getShop(product.shop);
  const shopLabel = catalogProduct.shopName ?? shop?.name ?? product.shop;
  const discount = discountPercent(product);
  const navigate = useNavigate();
  const { slugs, signedIn } = useSavedSlugs();
  const toggleSaved = useToggleSaved();
  const saved = slugs.includes(product.slug);
  const { toggle, isSelected } = useCompareSelection();
  const compared = isSelected(product.slug);

  return (
    <article className="group relative">
      <div className="relative">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={product.name}
        >
          <ImageStage
            category={product.category}
            src={catalogProduct.imageUrl}
            alt={product.name}
            ratio="square"
            imageClassName="transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.025]"
          />
        </Link>

        <div className="absolute right-2 top-2 flex gap-1.5">
          {!catalogProduct.marketplaceDevice ? <button
            type="button"
            aria-label={
              saved ? `Remove ${product.name} from saved` : `Save ${product.name} to your list`
            }
            aria-pressed={saved}
            onClick={() => {
              if (!signedIn) {
                navigate({ to: "/auth", search: { redirect: "/account/saved" } });
                return;
              }
              toggleSaved.mutate({
                slug: product.slug,
                saved,
                productId: catalogProduct.apiId,
              });
            }}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full bg-surface/90 transition-colors hover:text-brand-500",
              saved ? "text-brand-500" : "text-ink-800",
            )}
          >
            <Icon name={saved ? "heart-bold" : "heart-linear"} className="h-[18px] w-[18px]" />
          </button> : null}

          <button
            type="button"
            aria-label={
              compared ? `Remove ${product.name} from compare` : `Add ${product.name} to compare`
            }
            aria-pressed={compared}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggle(product.slug);
            }}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full bg-surface/90 transition-colors hover:text-brand-500",
              compared ? "text-brand-500" : "text-ink-800",
            )}
          >
            <Icon
              name={compared ? "scale-broken-linear" : "scale-linear"}
              className="h-[18px] w-[18px]"
            />
          </button>
        </div>

        {discount > 0 ? (
          <span className="absolute left-2 top-2 rounded-[6px] bg-ink-900 px-2 py-1 text-[11px] font-bold tracking-wide text-white">
            -{discount}%
          </span>
        ) : null}
      </div>

      <div className={cn("mt-3", compact && "mt-2.5")}>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-800">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {product.shopsCount > 1 ? (
            <>
              {shopLabel} · {product.shopsCount} shops
            </>
          ) : (
            <>Sold by {shopLabel}</>
          )}
          {shop?.verified ? (
            <span className="ml-1 inline-flex items-center gap-0.5 text-brand-500">
              <Icon name="verified-check-bold" className="inline h-3.5 w-3.5" />
            </span>
          ) : null}
        </p>

        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Icon name="star-bold" className="h-3.5 w-3.5 text-rating" />
          <span className="font-semibold text-ink-800">{product.rating.toFixed(1)}</span>
          <span>({product.reviews})</span>
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-extrabold tracking-tight text-ink-800">
            {formatMwk(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatMwk(product.oldPrice)}
            </span>
          ) : null}
        </div>

        {product.condition !== "New" ? (
          <p className="mt-1.5 inline-block rounded-[6px] bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-ink-800">
            {product.condition}
          </p>
        ) : null}
      </div>
    </article>
  );
}
