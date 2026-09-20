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
}) {
  const name = (category && categoryIcon[category]) || "bag-4-linear";
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl",
        ratio === "square" && "aspect-square",
        ratio === "portrait" && "aspect-[4/5]",
        ratio === "wide" && "aspect-[16/9]",
        tone === "stage" && "bg-stage",
        tone === "brand" && "bg-brand-100",
        tone === "white" && "bg-surface",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={{ objectPosition: position }}
        />
      ) : (
        <Icon name={name} className={cn("h-1/3 w-1/3 text-neutral-400", iconClassName)} />
      )}
    </div>
  );
}
