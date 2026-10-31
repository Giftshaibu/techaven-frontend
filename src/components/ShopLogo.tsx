import { useState } from "react";

export function ShopLogo({ name, src }: { name: string; src?: string | null | undefined }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  return src && src !== failedSrc ? (
    <img
      src={src}
      alt={`${name} logo`}
      onError={() => setFailedSrc(src)}
      className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface object-contain"
    />
  ) : (
    <span
      aria-label={name}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white"
    >
      {initials}
    </span>
  );
}
