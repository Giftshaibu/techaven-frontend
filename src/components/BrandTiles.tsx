import { Link } from "@tanstack/react-router";
import type { Category } from "@/data/catalog";

const tones = ["bg-rose-50", "bg-violet-50", "bg-emerald-50", "bg-cyan-50", "bg-indigo-50"];
export function BrandTiles({ category, onNavigate }: { category: Category; onNavigate?: () => void }) {
  return <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:grid-cols-5">
    {(category.brandTiles ?? []).map((brand, index) => <Link key={brand.slug}
      to="/category/$slug" params={{ slug: category.slug }} search={{ brand: brand.slug }} onClick={onNavigate}
      className="group min-w-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
      <div className={`flex h-36 items-end justify-center overflow-hidden rounded-xl px-5 pt-5 lg:h-44 ${tones[index % tones.length]}`}>
        {brand.image ? <img src={brand.image} alt="" loading="lazy" className="h-full w-full object-contain object-bottom transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" /> : <span className="self-center text-xl font-semibold text-ink-800">{brand.name}</span>}
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-800 group-hover:underline">{brand.slug === "apple" && category.name === "Smartphones" ? "iPhone" : brand.slug === "samsung" && category.name === "Smartphones" ? "Samsung Galaxy" : brand.slug === "google" ? "Google Pixel" : brand.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{brand.product_count} available model{brand.product_count === 1 ? "" : "s"}</p>
    </Link>)}
  </div>;
}
