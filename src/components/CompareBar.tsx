import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { formatMwk, products } from "@/data/catalog";
import { useCompareSelection } from "@/lib/compare";

export function CompareBar() {
  const { selected, remove } = useCompareSelection();
  const chosen = selected
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is (typeof products)[number] => Boolean(product));

  if (!chosen.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_rgba(5,5,38,0.08)] backdrop-blur md:px-6">
      <div className="shell flex items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {chosen.map((product) => (
            <div key={product.slug} className="flex shrink-0 items-center gap-2 rounded-xl bg-stage px-2 py-1.5">
              <ImageStage category={product.category} className="h-9 w-9 rounded-lg" />
              <div className="max-w-[150px]">
                <p className="truncate text-xs font-semibold text-ink-800">{product.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatMwk(product.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(product.slug)}
                aria-label={`Remove ${product.name} from compare`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-ink-800"
              >
                <Icon name="close-circle-linear" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Link
          to="/compare"
          aria-disabled={chosen.length < 2}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            chosen.length >= 2
              ? "bg-brand-500 text-white hover:bg-brand-700"
              : "pointer-events-none bg-neutral-200 text-muted-foreground"
          }`}
        >
          Compare
          <Icon name="alt-arrow-right-linear" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
