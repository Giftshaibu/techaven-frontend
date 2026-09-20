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

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
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
    rail.scrollBy({ left: direction * rail.clientWidth * 0.78, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2 md:hidden" aria-label={`${label} controls`}>
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
      <div
        ref={railRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scroll-padding-inline:0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 md:overflow-visible",
          desktopClassName,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
