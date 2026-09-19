import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ImageStage } from "@/components/ImageStage";
import { cn } from "@/lib/utils";

export type MegaAction = { label: string; to: string; params?: Record<string, string> };

/**
 * Reusable mega commerce header for categories, shops, catalogs and campaigns.
 * Product stages crop at the right edge so the section reads larger than the viewport.
 */
export function MegaHeader({
  eyebrow,
  title,
  support,
  actions = [],
  stages = [],
  tone = "brand-soft",
  editorial = false,
  aside,
}: {
  eyebrow?: ReactNode;
  title: string;
  support?: string;
  actions?: MegaAction[];
  stages?: string[];
  tone?: "brand-soft" | "dark" | "neutral" | "brand";
  editorial?: boolean;
  aside?: ReactNode;
}) {
  const dark = tone === "dark" || tone === "brand";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        tone === "brand-soft" && "bg-brand-100",
        tone === "neutral" && "bg-stage",
        tone === "dark" && "bg-ink-900 text-white",
        tone === "brand" && "bg-brand-500 text-white",
      )}
    >
      <div className="shell grid items-center gap-8 py-12 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          {eyebrow ? (
            <p
              className={cn(
                "mb-3 text-xs font-semibold uppercase tracking-[0.12em]",
                dark ? "text-white/70" : "text-brand-700",
              )}
            >
              {eyebrow}
            </p>
          ) : null}

          <h1
            className={cn(
              "max-w-2xl leading-[1.05]",
              editorial
                ? "font-editorial text-4xl md:text-6xl"
                : "text-4xl font-extrabold tracking-tight md:text-6xl",
              dark ? "text-white" : "text-ink-800",
            )}
          >
            {title}
          </h1>

          {support ? (
            <p
              className={cn(
                "mt-4 max-w-xl text-[15px] md:text-lg",
                dark ? "text-white/80" : "text-ink-800/70",
              )}
            >
              {support}
            </p>
          ) : null}

          {aside}

          {actions.length ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {actions.map((action, i) => (
                <Link
                  key={action.label}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={action.to as any}
                  params={action.params as never}
                  className={cn(
                    "inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors",
                    i === 0
                      ? dark
                        ? "bg-white text-ink-900 hover:bg-neutral-200"
                        : "bg-brand-500 text-white hover:bg-brand-700"
                      : dark
                        ? "border border-white/30 text-white hover:bg-white/10"
                        : "border border-ink-800/20 text-ink-800 hover:bg-surface",
                  )}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {stages.length ? (
          <div className="relative">
            <div className="flex items-end gap-4 lg:-mr-24">
              {stages.slice(0, 3).map((s, i) => (
                <ImageStage
                  key={`${s}-${i}`}
                  category={s}
                  ratio={i === 0 ? "portrait" : "square"}
                  tone="white"
                  className={cn(
                    "flex-1 rounded-2xl",
                    i === 0 && "z-10 lg:scale-105",
                    i === 1 && "hidden sm:flex",
                    i === 2 && "hidden xl:flex",
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
