import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import type { Category } from "@/data/catalog";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group flex flex-col items-center gap-3 rounded-2xl bg-surface p-4 text-center transition-colors hover:bg-brand-100/60"
    >
      <span className="grid h-16 w-16 place-items-center rounded-full bg-stage text-ink-800 transition-colors group-hover:bg-surface">
        <Icon name={category.icon} className="h-7 w-7" />
      </span>
      <span className="text-[13px] font-semibold leading-snug text-ink-800">{category.name}</span>
    </Link>
  );
}

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand-300"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-800">
        <Icon name={category.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink-800 group-hover:underline">{category.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{category.blurb}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {category.subcategories.slice(0, 3).join(" · ")}
      </p>
    </Link>
  );
}
