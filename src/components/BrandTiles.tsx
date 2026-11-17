import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Category } from "@/data/catalog";
import { brandLogoUrl } from "@/lib/brand-logos";

function BrandTileImage({ slug, name, image }: { slug: string; name: string; image?: string | null | undefined }) {
  const logo = brandLogoUrl(slug);
  const [failed, setFailed] = useState<string[]>([]);
  const src = [logo, image].find(url => url && !failed.includes(url));
  if (!src) return <span className="self-center text-xs font-semibold text-ink-800">{name}</span>;

  return <img
    src={src}
    alt=""
    loading="lazy"
    onError={() => setFailed(urls => urls.includes(src) ? urls : [...urls, src])}
    className={src === logo
      ? "m-auto h-11 w-11 rounded-xl object-contain"
      : "h-full w-full object-contain object-bottom transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"}
  />;
}

export function BrandTiles({ category, onNavigate }: { category: Category; onNavigate?: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (direction: number) => rail.current?.scrollBy({
    left: direction * rail.current.clientWidth * 0.8,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
  return <div className="relative flex items-center gap-2">
    <button type="button" aria-label="Previous brands" onClick={() => move(-1)} className="min-h-11 min-w-11 rounded-full border border-border bg-surface">‹</button>
    <div ref={rail} tabIndex={0} aria-label="Brands" className="flex flex-1 snap-x gap-3 overflow-x-auto py-1">
    {(category.brandTiles ?? []).map((brand) => <Link key={brand.slug}
      to="/category/$slug" params={{ slug: category.slug }} search={{ brand: brand.slug }} onClick={onNavigate}
      className="group w-24 shrink-0 snap-start text-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
      <div className="flex h-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface px-2">
        <BrandTileImage slug={brand.slug} name={brand.name} image={brand.image} />
      </div>
      <p className="mt-1 text-xs font-semibold text-ink-800 group-hover:underline">{brand.slug === "apple" && category.name === "Smartphones" ? "iPhone" : brand.slug === "samsung" && category.name === "Smartphones" ? "Samsung Galaxy" : brand.slug === "google" ? "Google Pixel" : brand.name}</p>
    </Link>)}
    </div>
    <button type="button" aria-label="Next brands" onClick={() => move(1)} className="min-h-11 min-w-11 rounded-full border border-border bg-surface">›</button>
  </div>;
}
