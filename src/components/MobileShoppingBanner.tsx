import { ctaHref, type Promotion } from "@/lib/cms/promotions";
import { ImageStage } from "./ImageStage";

export function MobileShoppingBanner({ promotions }: { promotions: Promotion[] }) {
  const promotion = promotions.find(
    (p) => p.placement === "home_banner_1" || p.placement === "home_hero",
  );
  const image =
    promotion?.foregroundImage ?? promotion?.mobileBackground ?? promotion?.desktopBackground;
  const href = promotion?.cta ? ctaHref(promotion.cta) || "/products" : "/products";
  return (
    <div className="shell pt-4 md:hidden">
      <a
        href={href}
        className="flex h-28 items-center justify-between gap-4 overflow-hidden rounded-2xl bg-brand-100 px-4 text-ink-900"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-800">
            Explore Techaven
          </p>
          <p className="mt-1 line-clamp-2 text-lg font-bold leading-tight">
            {promotion?.headline || "Your next device starts here"}
          </p>
          <span className="mt-2 inline-block text-xs font-semibold text-brand-800">
            Shop products →
          </span>
        </div>
        {image ? (
          <ImageStage
            src={image.url}
            alt=""
            sizes="80px"
            className="h-20 w-20 shrink-0 !bg-transparent"
          />
        ) : null}
      </a>
    </div>
  );
}
