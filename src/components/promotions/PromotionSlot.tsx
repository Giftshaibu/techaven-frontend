import { Component, useEffect, useRef, type ReactNode } from "react";
import type { Placement, Promotion, PromotionContext } from "@/lib/cms/promotions";
import { matchesTarget } from "@/lib/cms/promotions";
import { selectPromotions } from "./promotion-placements";
import {
  PromotionHeroProduct,
  PromotionProducts,
  PromotionShops,
  PromotionFlashDeals,
} from "./PromotionCommerce";
import {
  PromotionBanner,
  PromotionCardRail,
  PromotionCoupon,
  PromotionHero,
  PromotionLifestyleBanner,
  PromotionServiceGrid,
  PromotionSplit,
} from "./PromotionVisuals";

class PromotionErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static override getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn("Promotion section skipped", error);
  }
  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

function Renderer({
  promotions,
  heroHeading,
}: {
  promotions: Promotion[];
  heroHeading: "h1" | "h2";
}) {
  const promotion = promotions[0];
  if (!promotion) return null;
  const isPageTopHero = promotion.placement.endsWith("_hero");
  if (isPageTopHero) {
    if (promotion.layout === "hero_product")
      return <PromotionHeroProduct promotion={promotion} heading={heroHeading} />;
    if (["hero", "banner", "lifestyle_banner"].includes(promotion.layout))
      return <PromotionHero promotion={promotion} heading={heroHeading} />;
  }
  switch (promotion.layout) {
    case "hero":
      return <PromotionHero promotion={promotion} heading={heroHeading} />;
    case "hero_product":
      return <PromotionHeroProduct promotion={promotion} heading={heroHeading} />;
    case "split":
      return <PromotionSplit promotions={promotions} />;
    case "banner":
    case "editorial":
    case "announcement":
      return <PromotionBanner promotion={promotion} />;
    case "lifestyle_banner":
      return <PromotionLifestyleBanner promotion={promotion} />;
    case "product_rail":
      return <PromotionProducts promotion={promotion} />;
    case "product_grid":
      return <PromotionProducts promotion={promotion} grid />;
    case "shop_rail":
      return <PromotionShops promotion={promotion} />;
    case "service_grid":
      return <PromotionServiceGrid promotions={promotions} />;
    case "card_rail":
      return <PromotionCardRail promotions={promotions} />;
    case "flash_deals":
      return <PromotionFlashDeals promotion={promotion} />;
    case "coupon":
      return <PromotionCoupon promotion={promotion} />;
    default:
      return null;
  }
}

function PromotionImpression({
  promotions,
  children,
}: {
  promotions: Promotion[];
  children: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        try {
          for (const promotion of promotions) {
            window.dispatchEvent(
              new CustomEvent("techaven:promotion_impression", {
                detail: {
                  id: promotion.id,
                  slug: promotion.slug,
                  placement: promotion.placement,
                  layout: promotion.layout,
                },
              }),
            );
          }
        } finally {
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [promotions]);
  return (
    <div ref={element} className="contents">
      {children}
    </div>
  );
}

export function PromotionSlot({
  placement,
  promotions,
  context,
  exclude,
  fallback,
  heroHeading,
}: {
  placement: Placement;
  promotions: Promotion[];
  context?: PromotionContext;
  exclude?: string[];
  fallback?: ReactNode;
  heroHeading?: "h1" | "h2";
}) {
  const eligible = promotions.filter((p) => matchesTarget(p, context));
  const selected = selectPromotions(eligible, placement, exclude);
  if (!selected.length) return <>{fallback ?? null}</>;
  return (
    <PromotionErrorBoundary fallback={fallback}>
      <PromotionImpression promotions={selected}>
        <Renderer promotions={selected} heroHeading={heroHeading ?? "h2"} />
      </PromotionImpression>
    </PromotionErrorBoundary>
  );
}
