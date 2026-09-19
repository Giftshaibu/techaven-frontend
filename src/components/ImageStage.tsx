import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const categoryIcon: Record<string, string> = {
  smartphones: "smartphone-2-linear",
  laptops: "laptop-minimalistic-linear",
  tablets: "tablet-linear",
  gaming: "gamepad-linear",
  audio: "headphones-round-linear",
  wearables: "smart-watch-linear",
  accessories: "usb-square-linear",
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
}: {
  category?: string | undefined;
  ratio?: "square" | "portrait" | "wide" | undefined;
  className?: string | undefined;
  iconClassName?: string | undefined;
  tone?: "stage" | "brand" | "white" | undefined;
}) {
  const name = (category && categoryIcon[category]) || "bag-4-linear";

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
      <Icon
        name={name}
        className={cn("h-1/3 w-1/3 text-neutral-400", iconClassName)}
      />
    </div>
  );
}
