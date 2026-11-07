import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export function HorizontalRail({
  children,
  label,
  className,
  desktopClassName,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  desktopClassName?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setHasOverflow(rail.scrollWidth > rail.clientWidth + 4);
    setCanBack(rail.scrollLeft > 4);
    setCanForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(rail);
    rail.addEventListener("scroll", updateControls, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateControls);
    };
  }, [updateControls]);

  const scroll = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.78,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative flex flex-col">
      {hasOverflow ? (
        <div
          className="order-2 mt-2 flex justify-end gap-2 md:hidden"
          aria-label={`${label} controls`}
        >
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canBack}
            aria-label={`Previous ${label}`}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Icon name="alt-arrow-left-linear" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canForward}
            aria-label={`Next ${label}`}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Icon name="alt-arrow-right-linear" className="h-5 w-5" />
          </button>
        </div>
      ) : null}
      <div
        ref={railRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scroll(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scroll(1);
          }
        }}
        className={cn(
          "order-1 no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scroll-padding-inline:0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 md:overflow-visible",
          desktopClassName,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
