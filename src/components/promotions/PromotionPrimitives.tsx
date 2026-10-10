import { useState, type ReactNode } from "react";
import { ctaHref, type Promotion } from "@/lib/cms/promotions";
import { cn } from "@/lib/utils";

export function PromotionAction({
  promotion,
  secondary = false,
}: {
  promotion: Promotion;
  secondary?: boolean;
}) {
  const cta = secondary ? promotion.secondaryCta : promotion.cta;
  if (!cta) return null;
  const href = ctaHref(cta);
  if (!href) return null;
  return (
    <a
      href={href}
      onClick={() => {
        try {
          window.dispatchEvent(
            new CustomEvent("techaven:promotion_click", {
              detail: {
                id: promotion.id,
                slug: promotion.slug,
                placement: promotion.placement,
                layout: promotion.layout,
                target: href,
              },
            }),
          );
        } catch {
          /* non-blocking */
        }
      }}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        secondary
          ? "border border-current/25 hover:bg-black/5"
          : promotion.theme === "dark" || promotion.theme === "brand"
            ? "bg-white text-ink-900 hover:bg-neutral-100"
            : "bg-ink-900 text-white hover:bg-ink-800",
      )}
    >
      {cta.label}
    </a>
  );
}

export function PromotionMedia({
  promotion,
  className,
  ratio = "wide",
  fit = "cover",
  imageClassName,
  onUnavailable,
  priority = false,
}: {
  promotion: Promotion;
  className?: string;
  ratio?: "wide" | "square" | "portrait" | "hero" | "compact" | "none";
  fit?: "cover" | "contain";
  imageClassName?: string;
  onUnavailable?: () => void;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const media = promotion.desktopBackground ?? promotion.foregroundImage;
  if (!media || failed) return null;
  return (
    <picture
      className={cn(
        "block min-w-0 overflow-hidden",
        ratio === "wide" && "aspect-[16/9]",
        ratio === "square" && "aspect-square",
        ratio === "portrait" && "aspect-[4/5]",
        ratio === "hero" && "aspect-[4/3] lg:aspect-[5/4]",
        ratio === "compact" && "aspect-[16/7]",
        className,
      )}
    >
      {promotion.mobileBackground ? (
        <source media="(max-width: 767px)" srcSet={promotion.mobileBackground.url} />
      ) : null}
      <img
        src={media.url}
        alt={media.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onError={() => {
          setFailed(true);
          onUnavailable?.();
        }}
        className={cn(
          "h-full w-full",
          fit === "contain" ? "object-contain p-[7%]" : "object-cover",
          imageClassName,
        )}
        style={{
          objectPosition:
            promotion.imagePosition === "left"
              ? "left center"
              : promotion.imagePosition === "right"
                ? "right center"
                : "center",
        }}
      />
    </picture>
  );
}

export function PromotionCopy({
  promotion,
  heading = "h2",
  compact = false,
  clamp = false,
  card = false,
}: {
  promotion: Promotion;
  heading?: "h1" | "h2" | "h3";
  compact?: boolean;
  clamp?: boolean;
  card?: boolean;
}) {
  const Heading = heading;
  const hasActions = Boolean(promotion.cta || promotion.secondaryCta);
  const actions = hasActions ? (
    <div className="flex flex-wrap gap-3">
      <PromotionAction promotion={promotion} />
      <PromotionAction promotion={promotion} secondary />
    </div>
  ) : null;
  return (
    <div className={cn("max-w-[68ch]", card && "flex h-full w-full flex-col")}>
      <div>
        {promotion.badge ? (
          <span className="mb-3 inline-flex rounded-md bg-ink-900 px-2 py-1 text-xs font-bold text-white">
            {promotion.badge}
          </span>
        ) : null}
        <Heading
          className={cn(
            promotion.presentation === "dark_editorial"
              ? "font-editorial"
              : "font-sans font-extrabold",
            compact
              ? "text-xl leading-tight md:text-2xl"
              : "text-3xl leading-[1.05] tracking-[-0.03em] md:text-5xl",
            clamp && "line-clamp-2",
          )}
        >
          {promotion.headline}
        </Heading>
        {promotion.subheadline ? (
          <p
            className={cn(
              "mt-3 leading-relaxed opacity-80",
              clamp && "line-clamp-3",
              compact ? "text-sm" : "text-base md:text-lg",
            )}
          >
            {promotion.subheadline}
          </p>
        ) : null}
        {promotion.body ? (
          <p
            className={cn(
              "mt-4 max-w-[68ch] text-sm leading-6 opacity-75",
              clamp && "line-clamp-3",
            )}
          >
            {promotion.body}
          </p>
        ) : null}
      </div>
      {card ? (
        promotion.finePrint || actions ? (
          <div className="mt-auto pt-6">
            {promotion.finePrint ? (
              <p className="mb-4 text-xs leading-5 opacity-65">{promotion.finePrint}</p>
            ) : null}
            {actions}
          </div>
        ) : null
      ) : (
        <>
          {actions ? <div className="mt-6">{actions}</div> : null}
          {promotion.finePrint ? (
            <p className="mt-4 text-xs leading-5 opacity-65">{promotion.finePrint}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function SectionBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
