import { ArrowDownUp, ListFilter } from "lucide-react";
import { useState, type ReactNode } from "react";

export function CatalogueControls({ filters, sort }: { filters?: ReactNode; sort?: ReactNode }) {
  const [open, setOpen] = useState<"filter" | "sort" | null>(null);
  return <div className="relative ml-auto flex justify-end gap-2" onKeyDown={event => {
    if (event.key === "Escape") setOpen(null);
  }}>
    {([["filter", "Filter", ListFilter, filters], ["sort", "Sort", ArrowDownUp, sort]] as const).map(([key, label, Icon, content]) => content && (
      <div key={key}>
        <button type="button" aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold">
          <Icon size={17} aria-hidden="true" />{label}
        </button>
        {open === key && <div className="absolute right-0 top-full z-30 mt-2 grid w-64 max-w-[85vw] gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg">
          {content}
          <button type="button" onClick={() => setOpen(null)} className="justify-self-end text-sm font-semibold text-brand-700">Done</button>
        </div>}
      </div>
    ))}
  </div>;
}
