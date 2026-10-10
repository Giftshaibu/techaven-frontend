import { useState } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const categoryIcon: Record<string, string> = {
  smartphones: "smartphone-2-linear",
  laptops: "laptop-minimalistic-linear",
  tablets: "tablet-linear",
  gaming: "gamepad-linear",
  audio: "headphones-round-linear",
  wearables: "watch-round-linear",
  accessories: "plug-circle-linear",
  "home-electronics": "tv-linear",
};

/**
 * Neutral product stage. Placeholder imagery for now: a calm stage with a
 * category glyph, sized so real photography can drop in later unchanged.
 */
export function ImageStage({
  category,
  ratio = "square",
  className,
  iconClassName,
  tone = "stage",
  src,
  alt = "",
  position = "center",
  sizes,
  priority = false,
  fit = "contain",
  imageClassName,
}: {
  category?: string | undefined;
  ratio?: "square" | "portrait" | "wide" | undefined;
  className?: string | undefined;
  iconClassName?: string | undefined;
  tone?: "stage" | "brand" | "white" | undefined;
  src?: string | undefined;
  alt?: string | undefined;
  position?: string | undefined;
  sizes?: string | undefined;
  priority?: boolean | undefined;
  fit?: "contain" | "cover" | undefined;
  imageClassName?: string | undefined;
}) {
  const name = (category && categoryIcon[category]) || "bag-4-linear";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const failed = Boolean(src) && failedSrc === src;
  const loaded = Boolean(src) && loadedSrc === src;
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl",
        ratio === "square" && "aspect-square",
        ratio === "portrait" && "aspect-[4/5]",
        ratio === "wide" && "aspect-[16/9]",
        tone === "stage" && "bg-stage",
        tone === "brand" && "bg-brand-100",
        tone === "white" && "bg-surface",
        className,
      )}
    >
      {!showImage || !loaded ? (
        <Icon name={name} className={cn("h-1/3 w-1/3 text-neutral-400", iconClassName)} />
      ) : null}
      {showImage ? (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoadedSrc(src ?? null)}
          onError={() => {
            setLoadedSrc(null);
            setFailedSrc(src ?? null);
          }}
          className={cn(
            "absolute inset-0 h-full w-full max-h-full max-w-full transition-opacity duration-200 motion-reduce:transition-none",
            loaded ? "opacity-100" : "opacity-0",
            fit === "contain" ? "object-contain p-[8%]" : "object-cover",
            imageClassName,
          )}
          style={{ objectPosition: position }}
        />
      ) : null}
    </div>
  );
}
