import { useQuery } from "@tanstack/react-query";
import { ProductGrid, ProductRail } from "@/components/ProductGrid";
import { ShopCard } from "@/components/ShopCard";
import { HorizontalRail } from "@/components/HorizontalRail";
import type { Promotion } from "@/lib/cms/promotions";
import { resolvePromotionProducts, resolvePromotionShops } from "@/lib/promotion-commerce";

export function CampaignProducts({
  campaign,
  secondary = false,
}: {
  campaign: Promotion;
  secondary?: boolean;
}) {
  const refs = secondary ? campaign.secondaryProductRefs : campaign.productRefs;
  const products =
    useQuery({
      queryKey: ["campaign-products", campaign.id, secondary],
      queryFn: () => resolvePromotionProducts(refs.map((r) => r.externalId)),
      enabled: refs.length > 0,
    }).data ?? [];
  if (products.length < 2) return null;
  return (
    <section className="shell py-10 md:py-14">
      <h2 className="mb-6 text-2xl font-bold text-ink-800 md:text-3xl">
        {secondary ? "More from this campaign" : "Campaign picks"}
      </h2>
      {secondary ? (
        <ProductGrid products={products} />
      ) : (
        <ProductRail products={products} label="Campaign picks" />
      )}
    </section>
  );
}
export function CampaignShops({ campaign }: { campaign: Promotion }) {
  const shops =
    useQuery({
      queryKey: ["campaign-shops", campaign.id],
      queryFn: () => resolvePromotionShops(campaign.shopRefs.map((r) => r.externalId)),
      enabled: campaign.shopRefs.length > 0,
    }).data ?? [];
  if (shops.length < 2) return null;
  return (
    <section className="shell py-10 md:py-14">
      <h2 className="mb-6 text-2xl font-bold text-ink-800 md:text-3xl">Participating shops</h2>
      <HorizontalRail
        label="Participating shops"
        desktopClassName="md:grid md:grid-cols-3 md:gap-5"
      >
        {shops.map((s) => (
          <div key={s.slug} className="w-[82%] max-w-[320px] shrink-0 snap-start md:w-auto">
            <ShopCard shop={s} />
          </div>
        ))}
      </HorizontalRail>
    </section>
  );
}
