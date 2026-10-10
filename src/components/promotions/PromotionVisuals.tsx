import { useEffect, useState, type ReactNode } from "react";
import { HorizontalRail } from "@/components/HorizontalRail";
import { Icon } from "@/components/Icon";
import type { Promotion } from "@/lib/cms/promotions";
import { cn } from "@/lib/utils";
import { PromotionAction, PromotionCopy, PromotionMedia } from "./PromotionPrimitives";
import { themeClass } from "./promotion-theme";

export function PromotionHero({
  promotion,
  heading = "h2",
}: {
  promotion: Promotion;
  heading?: "h1" | "h2";
}) {
  return (
    <PromotionHeroFrame promotion={promotion}>
      <PromotionCopy promotion={promotion} heading={heading} />
    </PromotionHeroFrame>
  );
}

export function PromotionHeroFrame({
  promotion,
  children,
  visual,
}: {
  promotion: Promotion;
  children: ReactNode;
  visual?: ReactNode;
}) {
  const media = promotion.desktopBackground ?? promotion.foregroundImage;
  const [mediaVisible, setMediaVisible] = useState(Boolean(media));
  const dark = promotion.theme === "dark" || promotion.theme === "brand";
  const copyOnRight = promotion.imagePosition === "left";

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        themeClass[promotion.theme],
        mediaVisible && (dark ? "text-white" : "text-ink-900"),
      )}
    >
      {mediaVisible ? (
        <PromotionMedia
          promotion={promotion}
          ratio="none"
          priority
          onUnavailable={() => setMediaVisible(false)}
          className="absolute inset-0 h-full w-full"
          imageClassName="scale-[1.01]"
        />
      ) : null}
      {mediaVisible ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            copyOnRight ? "lg:bg-gradient-to-l" : "lg:bg-gradient-to-r",
            dark
              ? "from-ink-900/95 via-ink-900/70 to-ink-900/10"
              : "from-white/95 via-white/80 to-white/10",
          )}
        />
      ) : null}
      <div className="shell relative z-10 grid min-h-[480px] items-end gap-8 py-10 sm:min-h-[500px] md:py-14 lg:min-h-[520px] lg:grid-cols-2 lg:items-center lg:gap-12">
        <div
          className={cn(
            "max-w-2xl",
            copyOnRight && mediaVisible && visual && "lg:order-2 lg:justify-self-end",
            copyOnRight && mediaVisible && !visual && "lg:col-start-2 lg:justify-self-end",
          )}
        >
          {children}
        </div>
        {visual ? <div className={cn("min-w-0", copyOnRight && "lg:order-1")}>{visual}</div> : null}
      </div>
    </section>
  );
}

export function PromotionBanner({ promotion }: { promotion: Promotion }) {
  const media = promotion.desktopBackground ?? promotion.foregroundImage;
  const [mediaVisible, setMediaVisible] = useState(Boolean(media));
  const background = promotion.presentation === "background_image" && media;
  if (background)
    return (
      <section className="shell py-6 md:py-9">
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-ink-900">
          <PromotionMedia
            promotion={promotion}
            ratio="none"
            className="absolute inset-0 h-full rounded-2xl opacity-55"
          />
          <div className="relative z-10 flex min-h-[320px] max-w-xl items-center p-7 text-white md:p-12">
            <PromotionCopy promotion={promotion} />
          </div>
        </div>
      </section>
    );
  return (
    <section className="shell py-6 md:py-9">
      <div
        className={cn(
          "grid overflow-hidden rounded-2xl",
          themeClass[promotion.theme],
          mediaVisible && "md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]",
        )}
      >
        <div className="flex items-center p-7 md:p-10">
          <PromotionCopy promotion={promotion} />
        </div>
        {mediaVisible ? (
          <PromotionMedia
            promotion={promotion}
            ratio="none"
            onUnavailable={() => setMediaVisible(false)}
            className="aspect-[16/9] min-h-0 rounded-none md:aspect-auto md:min-h-[260px]"
          />
        ) : null}
      </div>
    </section>
  );
}

export function PromotionLifestyleBanner({ promotion }: { promotion: Promotion }) {
  return <PromotionBanner promotion={{ ...promotion, presentation: "background_image" }} />;
}

export function PromotionSplit({ promotions }: { promotions: Promotion[] }) {
  const valid = promotions.slice(0, 2);
  if (!valid.length) return null;
  return (
    <section className="shell py-8 md:py-12">
      <HorizontalRail
        label={`${valid[0]?.headline ?? "Featured"} promotions`}
        desktopClassName={cn("md:grid md:gap-5", valid.length === 2 && "md:grid-cols-2")}
      >
        {valid.map((p) => (
          <article
            key={p.id}
            className={cn(
              "flex min-h-[390px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl md:w-auto md:max-w-none",
              valid.length === 1 ? "w-full" : "w-[86%] max-w-[560px]",
              themeClass[p.theme],
              p.presentation === "image_side" &&
                "lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]",
            )}
          >
            <PromotionMedia
              promotion={p}
              ratio={p.presentation === "image_side" ? "none" : "wide"}
              className={cn(
                "max-h-[260px] rounded-none",
                p.presentation === "image_side" && "h-full max-h-none min-h-[260px]",
              )}
            />
            <div className="flex flex-1 p-6 md:p-8">
              <PromotionCopy promotion={p} heading="h3" compact clamp card />
            </div>
          </article>
        ))}
      </HorizontalRail>
    </section>
  );
}

export function PromotionServiceGrid({ promotions }: { promotions: Promotion[] }) {
  const valid = promotions.slice(0, 3);
  if (!valid.length) return null;
  return (
    <section className="shell py-10 md:py-14">
      <h2 className="mb-7 font-editorial text-3xl text-ink-800 md:text-4xl">
        More ways Techaven helps
      </h2>
      <HorizontalRail
        label="More ways Techaven helps"
        desktopClassName={cn("md:grid md:gap-5", valid.length > 1 && "md:grid-cols-3")}
      >
        {valid.map((p) => (
          <article
            key={p.id}
            className={cn(
              "flex min-h-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl md:w-auto md:max-w-none",
              valid.length === 1 ? "w-full" : "w-[82%] max-w-[360px]",
              themeClass[p.theme],
            )}
          >
            <PromotionMedia promotion={p} ratio="wide" className="max-h-[210px] rounded-none" />
            <div className="flex flex-1 p-6">
              <PromotionCopy promotion={p} heading="h3" compact clamp card />
            </div>
          </article>
        ))}
      </HorizontalRail>
    </section>
  );
}

export function PromotionCardRail({
  promotions,
  title = "Other ways to save",
}: {
  promotions: Promotion[];
  title?: string;
}) {
  const valid = promotions.slice(0, 4);
  if (!valid.length) return null;
  return (
    <section className="shell py-10 md:py-14">
      <h2 className="mb-7 font-editorial text-3xl text-ink-800 md:text-4xl">{title}</h2>
      <HorizontalRail
        label={title}
        desktopClassName={cn(
          "md:grid md:gap-5",
          valid.length === 2 && "md:grid-cols-2",
          valid.length === 3 && "md:grid-cols-3",
          valid.length >= 4 && "md:grid-cols-4",
        )}
      >
        {valid.map((p) => (
          <article
            key={p.id}
            className={cn(
              "flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl md:w-auto md:max-w-none",
              valid.length === 1 ? "w-full" : "w-[78%] max-w-[320px]",
              themeClass[p.theme],
            )}
          >
            <PromotionMedia promotion={p} ratio="wide" className="max-h-[190px] rounded-none" />
            <div className="flex flex-1 p-5">
              <PromotionCopy promotion={p} heading="h3" compact clamp card />
            </div>
          </article>
        ))}
      </HorizontalRail>
    </section>
  );
}

function remaining(end: string | null) {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86400000),
    hours = Math.floor((ms % 86400000) / 3600000),
    minutes = Math.floor((ms % 3600000) / 60000),
    seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}
export function PromotionCountdown({ promotion }: { promotion: Promotion }) {
  const [time, setTime] = useState(() => remaining(promotion.schedule.endsAt));
  useEffect(() => {
    const id = window.setInterval(() => setTime(remaining(promotion.schedule.endsAt)), 1000);
    return () => window.clearInterval(id);
  }, [promotion.schedule.endsAt]);
  if (!promotion.showCountdown || !time) return null;
  return (
    <div
      className="mt-5 flex gap-2"
      aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes remaining`}
    >
      {Object.entries(time).map(([label, value]) => (
        <div
          key={label}
          className="min-w-14 rounded-xl bg-white/90 px-2 py-2 text-center text-ink-900"
        >
          <strong className="block text-lg tabular-nums">{String(value).padStart(2, "0")}</strong>
          <span className="text-[11px] capitalize">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function PromotionCoupon({ promotion }: { promotion: Promotion }) {
  const [copied, setCopied] = useState(false);
  const steps = promotion.coupon.instructions;
  if (!promotion.coupon.code && steps.length < 2) return null;
  return (
    <section className="shell py-8">
      <div
        className={cn(
          "grid gap-7 rounded-2xl p-7 md:grid-cols-[0.8fr_1.2fr] md:p-10",
          themeClass[promotion.theme],
        )}
      >
        <div>
          <PromotionCopy promotion={promotion} />
          {promotion.coupon.code ? (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(promotion.coupon.code ?? "");
                setCopied(true);
              }}
              className="mt-5 inline-flex min-h-11 items-center gap-3 rounded-lg bg-white px-4 py-2 font-semibold text-ink-900 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="copy-linear" className="h-5 w-5" />
              <span>{promotion.coupon.code}</span>
              <span className="text-xs text-ink-700">{copied ? "Copied" : "Copy code"}</span>
            </button>
          ) : null}
        </div>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-6">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
