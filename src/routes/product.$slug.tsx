import { useEffect } from "react";
import { recordVisit } from "@/lib/browsing-history";
import { offerFacts } from "@/lib/offer-facts";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { ShopLogo } from "@/components/ShopLogo";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { TrustStrip } from "@/components/TrustStrip";
import { discountPercent, formatMwk } from "@/data/catalog";
import {
  conditionLabel,
  selectMarketplaceOffer,
  type CatalogProduct,
  type CatalogShop,
} from "@/lib/catalog-api";
import {
  fetchCategoryProducts,
  fetchProductsPage,
  resolveProduct,
  resolveShop,
} from "@/lib/resolve-catalog";
import { useCart } from "@/lib/cart";
import { useCompareSelection } from "@/lib/compare";
import { cn } from "@/lib/utils";
import { getPromotions, type Promotion } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";

type ProductPageData = {
  product: CatalogProduct;
  shop: CatalogShop | null;
  shops: (CatalogShop | null)[];
  related: CatalogProduct[];
  promotions: Promotion[];
};

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }): Promise<ProductPageData> => {
    const product = await resolveProduct(params.slug);
    if (!product) throw notFound();
    const shopIds = [
      ...new Set((product.offers ?? []).flatMap((offer) => (offer.shop ? [offer.shop.id] : []))),
    ];
    const shops = await Promise.all(shopIds.map((id) => resolveShop(`shop-${id}`)));
    const shop = shops.find((item) => item?.slug === product.shop) ?? null;
    let related: CatalogProduct[] = [];
    try {
      if (product.categoryId) {
        const data = await fetchCategoryProducts(product.categoryId, 1, 12);
        related = data.products.filter((p) => p.slug !== product.slug).slice(0, 5);
      } else {
        const data = await fetchProductsPage(1, 12);
        related = data.products.filter((p) => p.slug !== product.slug).slice(0, 5);
      }
    } catch {
      related = [];
    }
    const promotions = await getPromotions("product_inline_1");
    return { product, shop, shops, related, promotions };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product unavailable — Techaven" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product, shop } = loaderData;
    const title = `${product.name} — Techaven`;
    const description = `${product.name} from ${shop?.name ?? product.shopName ?? "Techaven"} at ${formatMwk(
      product.price,
    )}. ${product.condition}, ${product.warranty}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const data = Route.useLoaderData();
  useEffect(() => { recordVisit({ kind: "product", slug: data.product.slug, category: data.product.category }); }, [data.product.slug, data.product.category]);
  return <ProductDetails key={data.product.slug} data={data} />;
}

function ProductDetails({ data }: { data: ProductPageData }) {
  const { product, shops, related, promotions } = data;
  const categorySlug = product.category;
  const { add, count } = useCart();
  const { toggle, isSelected } = useCompareSelection();
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedListingId, setSelectedListingId] = useState(product.listingId);
  const selectedOffer =
    product.offers?.find((offer) => offer.id === selectedListingId) ?? product.offers?.[0];
  const selectedProduct = useMemo(
    () => (selectedOffer ? selectMarketplaceOffer(product, selectedOffer) : product),
    [product, selectedOffer],
  );
  const shop = shops.find((item) => item?.apiId === selectedOffer?.shop?.id) ?? null;
  const selectedVariant = product.marketplaceDevice?.variants.find(
    (item) => item.id === selectedOffer?.variant_id,
  );
  const specGroups = selectedProduct.specGroups ?? [
    { title: "Device", rows: selectedProduct.specs },
  ];

  const images =
    selectedProduct.images && selectedProduct.images.length > 0
      ? selectedProduct.images
      : selectedProduct.imageUrl
        ? [selectedProduct.imageUrl]
        : [];
  const shopName = selectedOffer?.shop?.name ?? shop?.name ?? product.shopName ?? "Shop";
  const discount = discountPercent(product);

  return (
    <>
      <div className="shell flex flex-wrap items-center gap-2 py-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-brand-500">
          Techaven
        </Link>
        <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
        {categorySlug ? (
          <>
            <Link
              to="/category/$slug"
              params={{ slug: categorySlug }}
              className="hover:text-brand-500"
            >
              {categorySlug.replace(/^c-\d+$/, "Category").replace(/-/g, " ")}
            </Link>
            <Icon name="alt-arrow-right-linear" className="h-3.5 w-3.5" />
          </>
        ) : null}
        <span className="font-semibold text-ink-800">{product.name}</span>
      </div>

      <section className="shell grid gap-10 pb-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <ImageStage
            category={product.category}
            src={images[activeImage]}
            alt={product.name}
            priority
            className="rounded-2xl"
          />
          {images.length > 1 ? (
            <div className="mt-4 flex gap-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "w-20 rounded-xl border-2 transition-colors",
                    activeImage === i ? "border-brand-500" : "border-transparent",
                  )}
                >
                  <ImageStage
                    category={product.category}
                    src={src}
                    alt=""
                    className="rounded-[10px]"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold tracking-normal text-brand-700">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink-800 md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <Icon name="star-bold" className="h-4 w-4 text-rating" />
              <span className="font-bold text-ink-800">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
            </span>
            <span className="rounded-[6px] bg-success-soft px-2 py-0.5 text-xs font-semibold text-ink-800">
              {selectedProduct.condition}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span
              aria-live="polite"
              className="text-4xl font-extrabold tracking-tight text-ink-800"
            >
              {formatMwk(selectedProduct.price)}
              {selectedProduct.taxExclusive ? <span className="ml-3 text-base font-medium">excl. VAT</span> : null}
            </span>
            {product.oldPrice ? (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatMwk(product.oldPrice)}
                </span>
                <span className="rounded-[6px] bg-ink-900 px-2 py-1 text-xs font-bold text-white">
                  -{discount}%
                </span>
              </>
            ) : null}
          </div>
          {offerFacts(selectedProduct.offers?.find(offer => offer.id === selectedProduct.listingId)?.details).map(fact => <p key={fact} className="mt-3 text-sm leading-relaxed text-ink-800">{fact}</p>)}

          {selectedVariant ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {[
                selectedVariant.ram_gb != null ? `${selectedVariant.ram_gb} GB RAM` : null,
                selectedVariant.storage_gb != null
                  ? `${selectedVariant.storage_gb} GB storage`
                  : null,
                selectedVariant.network_generation,
                  selectedVariant.sim_type,
                  selectedVariant.region,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <ShopLogo name={shopName} src={shop?.logoUrl} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-800">
                  Sold by{" "}
                  {shop ? (
                    <Link
                      to="/shops/$shopSlug"
                      params={{ shopSlug: shop.slug }}
                      className="hover:underline"
                    >
                      {shopName}
                    </Link>
                  ) : (
                    shopName
                  )}
                  {shop?.verified ? (
                    <Icon name="verified-check-bold" className="h-4 w-4 text-brand-500" />
                  ) : null}
                </p>
                {shop ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {shop.location} · {shop.rating.toFixed(1)} rating
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void add(selectedProduct).then(() => setAdded(true));
              }}
              disabled={!selectedProduct.listingId || !selectedProduct.inStock || selectedProduct.taxExclusive}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="cart-large-2-linear" className="h-5 w-5" />
              {selectedProduct.listingId
                ? selectedProduct.inStock
                  ? selectedProduct.taxExclusive ? "Confirm VAT-inclusive price with shop" : "Add to basket"
                  : "Out of stock"
                : "No offer available"}
            </button>
            <Link
              to="/cart"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-stage"
            >
              View basket{count > 0 ? ` (${count})` : ""}
            </Link>
          </div>

          {added ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-ink-800">
              <Icon name="check-circle-bold" className="h-4 w-4 text-brand-500" />
              Added to your basket.
            </p>
          ) : null}

          <ul className="mt-6 space-y-2.5 text-sm">
            {[
              { icon: "box-linear", text: selectedProduct.delivery },
              { icon: "shield-check-linear", text: selectedProduct.warranty },
            ].map((row) => (
              <li key={row.text} className="flex items-center gap-2.5 text-ink-800/80">
                <Icon name={row.icon} className="h-[18px] w-[18px] text-brand-500" />
                {row.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell pb-12">
        <div className="grid gap-8 rounded-3xl bg-surface p-6 md:p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-ink-800">Specifications</h2>
            {product.description ? (
              <p className="mt-4 text-sm leading-relaxed text-ink-800/80">{product.description}</p>
            ) : null}
            {specGroups.map((group) => (
              <div key={group.title} className="mt-6">
                <h3 className="text-sm font-semibold text-ink-800">{group.title}</h3>
                <dl className="mt-2 divide-y divide-border">
                  {group.rows.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-2 gap-6 py-3 text-sm">
                      <dt className="min-w-0 break-words text-muted-foreground">{spec.label}</dt>
                      <dd className="min-w-0 break-words text-right font-semibold text-ink-800">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-800">Good to know</h2>
            <ul className="mt-4 space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-ink-800/80">
                  <Icon
                    name="check-circle-linear"
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-500"
                  />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-info-soft p-5">
              <h3 className="text-base font-bold text-ink-800">Still deciding?</h3>
              <p className="mt-1.5 text-sm text-ink-800/70">
                Compare this with up to three other devices before you buy.
              </p>
              <button
                type="button"
                onClick={() => toggle(product.slug)}
                className="mt-4 inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {isSelected(product.slug) ? "Added to compare" : "Add to compare"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {product.offers?.length ? (
        <section className="shell pb-12" aria-labelledby="offers-heading">
          <h2 id="offers-heading" className="text-2xl font-bold tracking-tight text-ink-800">
            Available offers
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a shop and configuration for your basket.
          </p>
          <div className="mt-5 space-y-3">
            {product.offers.map((offer) => {
              const seller = shops.find((item) => item?.apiId === offer.shop?.id);
              const variant = product.marketplaceDevice?.variants.find(
                (item) => item.id === offer.variant_id,
              );
              const selected = offer.id === selectedOffer?.id;
              const details = [
                variant?.ram_gb != null ? `${variant.ram_gb} GB RAM` : null,
                variant?.storage_gb != null ? `${variant.storage_gb} GB storage` : null,
                variant?.network_generation,
                  variant?.sim_type,
                  variant?.region,
                conditionLabel[offer.condition],
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <div
                  key={offer.id}
                  className={cn(
                    "flex flex-wrap items-center gap-4 rounded-2xl border bg-surface p-4 md:p-5",
                    selected ? "border-brand-500" : "border-border",
                  )}
                >
                  <ShopLogo name={offer.shop?.name ?? "Shop"} src={seller?.logoUrl} />
                  <div className="min-w-0 flex-1 basis-40">
                    {offer.shop ? (
                      <Link
                        to="/shops/$shopSlug"
                        params={{ shopSlug: `shop-${offer.shop.id}` }}
                        className="text-sm font-semibold text-ink-800 hover:underline"
                      >
                        {offer.shop.name}
                      </Link>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">{details}</p>
                  </div>
                  <p className="text-xl font-bold text-ink-800">{formatMwk(offer.price)}</p>
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Select ${offer.shop?.name ?? "shop"} offer: ${details}, ${formatMwk(offer.price)}`}
                    disabled={offer.quantity <= 0}
                    onClick={() => {
                      setSelectedListingId(offer.id);
                      setActiveImage(0);
                      setAdded(false);
                    }}
                    className={cn(
                      "min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                      selected
                        ? "bg-brand-500 text-white"
                        : "border border-border text-ink-800 hover:bg-stage",
                    )}
                  >
                    {offer.quantity <= 0 ? "Out of stock" : selected ? "Selected" : "Select offer"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="shell pb-14">
        <SectionHeader title="You might also like" />
        <ProductGrid products={related} columns={4} />
      </section>

      <PromotionSlot
        placement="product_inline_1"
        promotions={promotions}
        context={{
          categorySlug: product.category,
          brandSlug: product.brand.toLowerCase(),
          ...(shop ? { shopExternalId: String(shop.apiId) } : {}),
        }}
      />

      <TrustStrip />
    </>
  );
}
