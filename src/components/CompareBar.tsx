import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { formatMwk } from "@/data/catalog";
import { useComparedProducts, useCompareSelection } from "@/lib/compare";

export function CompareBar() {
  const { selected, remove, replaceAll } = useCompareSelection();
  const chosen = useComparedProducts(selected, replaceAll);

  if (chosen.length < 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_rgba(5,5,38,0.08)] backdrop-blur md:px-6">
      <div className="shell flex items-center gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:flex">
          {chosen.map((product) => (
            <div key={product.slug} className="flex min-w-0 items-center gap-1 rounded-xl bg-stage px-1.5 py-1.5 sm:gap-2 sm:px-2">
              <ImageStage category={product.category} src={"imageUrl" in product ? product.imageUrl as string : undefined} className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="hidden min-w-0 max-w-[150px] md:block">
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
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Compare
          <Icon name="alt-arrow-right-linear" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
