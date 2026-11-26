import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SIZES = {
  xs: "h-5 w-5",
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-28 w-28",
} as const;

export type LoaderSize = keyof typeof SIZES;

/** The animated Techaven mark on its own: decorative, so the surrounding text carries the meaning. */
export function LoaderMark({ size = "md", className }: { size?: LoaderSize; className?: string }) {
  return (
    <img
      src="/loader.webp"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn(SIZES[size], "select-none object-contain", className)}
    />
  );
}

/** Cycles through messages so a longer wait still feels like progress. */
function useRotating(messages: readonly string[], everyMs = 2200) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), everyMs);
    return () => window.clearInterval(timer);
  }, [messages, everyMs]);
  return messages[index % Math.max(messages.length, 1)] ?? "";
}

/**
 * Centred loader for any area that is waiting on the API.
 * Pass `messages` for a friendly rotating caption, or `label` for a single one.
 */
export function TechavenLoader({
  label = "Loading",
  messages,
  size = "md",
  minHeight,
  className,
}: {
  label?: string;
  messages?: readonly string[];
  size?: LoaderSize;
  /** CSS min-height of the area, so the layout keeps its shape while loading. */
  minHeight?: string;
  className?: string;
}) {
  const rotating = useRotating(messages ?? []);
  const caption = messages?.length ? rotating : label;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("grid w-full place-items-center px-4 py-6", className)}
      style={minHeight ? { minHeight } : undefined}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="relative grid place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-125 rounded-full bg-brand-500/10 blur-xl motion-safe:animate-pulse"
          />
          <LoaderMark size={size} />
        </span>
        {caption ? (
          <span
            key={caption}
            className="text-xs font-semibold tracking-wide text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
          >
            {caption}
            <span aria-hidden="true" className="inline-block w-4 text-left">
              <Dots />
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Dots() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const timer = window.setInterval(() => setCount((c) => (c % 3) + 1), 450);
    return () => window.clearInterval(timer);
  }, []);
  return <>{".".repeat(count)}</>;
}

/** Whole-page wait: fills most of the viewport and centres the loader. */
export function PageLoader(props: Omit<Parameters<typeof TechavenLoader>[0], "minHeight" | "size">) {
  return <TechavenLoader size="lg" minHeight="60vh" {...props} />;
}

const ROUTE_MESSAGES = [
  "Loading",
  "Checking prices with local shops",
  "Polishing the screens",
  "Counting what's in stock",
  "Almost there",
] as const;

/** Shown by the router while a page loads its data. */
export function RoutePendingScreen() {
  return <PageLoader messages={ROUTE_MESSAGES} />;
}
