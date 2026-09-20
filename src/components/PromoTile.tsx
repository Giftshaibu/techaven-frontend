import { Link } from "@tanstack/react-router";
import { ImageStage } from "@/components/ImageStage";
import { cn } from "@/lib/utils";

type Theme = "neutral" | "brand" | "brand-soft" | "dark" | "info" | "success";

const themeClasses: Record<Theme, { wrap: string; body: string; cta: string }> = {
  neutral: {
    wrap: "bg-stage",
    body: "text-ink-800",
    cta: "bg-ink-900 text-white hover:bg-ink-800",
  },
  brand: {
    wrap: "bg-brand-500",
    body: "text-white",
    cta: "bg-white text-brand-700 hover:bg-brand-100",
  },
  "brand-soft": {
    wrap: "bg-brand-100",
    body: "text-brand-800",
    cta: "bg-brand-500 text-white hover:bg-brand-700",
  },
  dark: {
    wrap: "bg-ink-900",
    body: "text-white",
    cta: "bg-white text-ink-900 hover:bg-neutral-200",
  },
  info: {
    wrap: "bg-info-soft",
    body: "text-ink-800",
    cta: "bg-brand-500 text-white hover:bg-brand-700",
  },
  success: {
    wrap: "bg-success-soft",
    body: "text-ink-800",
    cta: "bg-ink-900 text-white hover:bg-ink-800",
  },
};

export type Promo = {
  headline: string;
  support: string;
  cta: string;
  to: string;
  params?: Record<string, string>;
  theme: Theme;
  stageCategory?: string;
  editorial?: boolean;
  media?: { src: string; alt: string; position?: string };
};

export function PromoTile({ promo }: { promo: Promo }) {
  const t = themeClasses[promo.theme];

  return (
    <div className={cn("flex flex-col gap-5 rounded-3xl p-6 md:p-8", t.wrap, t.body)}>
      <ImageStage
        category={promo.stageCategory}
        src={promo.media?.src}
        alt={promo.media?.alt}
        position={promo.media?.position}
        sizes="(max-width: 1023px) 100vw, 50vw"
        ratio="wide"
        tone={promo.theme === "brand" || promo.theme === "dark" ? "white" : "white"}
        className="w-full"
        iconClassName="text-neutral-400"
      />
      <div>
        <h3
          className={cn(
            "text-2xl leading-tight md:text-3xl",
            promo.editorial ? "font-editorial" : "font-bold",
          )}
        >
          {promo.headline}
        </h3>
        <p className="mt-2 max-w-md text-sm opacity-90 md:text-[15px]">{promo.support}</p>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to={promo.to as any}
          params={promo.params as never}
          className={cn(
            "mt-5 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
            t.cta,
          )}
        >
          {promo.cta}
        </Link>
      </div>
    </div>
  );
}

export function InlinePromo({ promo }: { promo: Promo }) {
  const t = themeClasses[promo.theme];
  return (
    <div className={cn("flex flex-col justify-between rounded-2xl p-5", t.wrap, t.body)}>
      <div>
        <h3 className="text-lg font-bold leading-snug">{promo.headline}</h3>
        <p className="mt-2 text-sm opacity-90">{promo.support}</p>
      </div>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={promo.to as any}
        params={promo.params as never}
        className={cn(
          "mt-5 inline-flex w-fit items-center rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
          t.cta,
        )}
      >
        {promo.cta}
      </Link>
    </div>
  );
}
