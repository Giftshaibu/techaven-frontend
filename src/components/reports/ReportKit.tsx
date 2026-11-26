import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { buttonClass, inputClass, Panel } from "@/components/portal/kit";
import { LoaderMark } from "@/components/TechavenLoader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { count, formatCell, money, totals, type ReportTable } from "@/lib/report-export";
import { GROUPING, malawiToday, PRESETS, type ReportPeriod } from "@/lib/report-periods";
import { cn } from "@/lib/utils";

/** Shared building blocks for the admin and seller Reports pages. */

/** Period presets, custom From–To dates and daily / weekly / monthly grouping. */
export function PeriodFilters({ period, updating = false }: { period: ReportPeriod; updating?: boolean }) {
  return (
        <Panel bodyClassName="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-0 basis-full">
            <p className="mb-1.5 text-xs font-semibold text-ink-800">Period</p>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Report period">
              {PRESETS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={period.preset === option.value}
                  onClick={() => period.choosePreset(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    period.preset === option.value ? "bg-brand-500 text-white" : "bg-stage text-ink-800 hover:bg-brand-100",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <label className="text-xs font-semibold text-ink-800">
            From
            <input type="date" value={period.range.from} max={period.range.to} onChange={(e) => e.target.value && period.setCustom({ from: e.target.value })} className={cn(inputClass, "mt-1.5 w-40")} />
          </label>
          <label className="text-xs font-semibold text-ink-800">
            To
            <input type="date" value={period.range.to} min={period.range.from} max={malawiToday()} onChange={(e) => e.target.value && period.setCustom({ to: e.target.value })} className={cn(inputClass, "mt-1.5 w-40")} />
          </label>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-800">Group by</p>
            <div className="inline-flex rounded-xl bg-stage p-1" role="radiogroup" aria-label="Group by">
              {GROUPING.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={period.range.granularity === option.value}
                  onClick={() => period.setGranularity(option.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold",
                    period.range.granularity === option.value ? "bg-surface text-ink-800 shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {updating ? (
            <span className="inline-flex items-center gap-2 pb-2 text-xs text-muted-foreground">
              <LoaderMark size="xs" /> Updating…
            </span>
          ) : null}
        </Panel>
  );
}

export function ExportMenu({
  label,
  busy,
  disabled,
  onPdf,
  onExcel,
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  onPdf: () => void;
  onExcel: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={buttonClass.secondary} disabled={disabled || busy}>
          {busy ? <LoaderMark size="xs" /> : <Icon name="download-minimalistic-linear" className="h-4 w-4" />}
          {busy ? "Preparing…" : label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Download as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onPdf}>
          <Icon name="document-text-linear" className="mr-2 h-4 w-4" /> PDF document
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExcel}>
          <Icon name="file-text-linear" className="mr-2 h-4 w-4" /> Excel spreadsheet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Figures({ items }: { items: [string, ReactNode, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([label, value, hint]) => (
        <div key={label} className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-xl font-extrabold tabular-nums text-ink-800">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}

const SCREEN_ROWS = 200;
export function DataTable({ table }: { table: ReportTable }) {
  const sum = totals(table);
  const shown = table.rows.slice(0, SCREEN_ROWS);
  return (
    <Panel title={table.title} description={`${count(table.rows.length)} record${table.rows.length === 1 ? "" : "s"}`} bodyClassName="p-0">
      {!table.rows.length ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No records for this period.</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-stage text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {table.columns.map((column) => (
                  <th
                    key={column.header}
                    scope="col"
                    className={cn("whitespace-nowrap px-4 py-2.5 font-semibold", (column.kind === "money" || column.kind === "number") && "text-right")}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((row, index) => (
                <tr key={index} className="hover:bg-stage/60">
                  {table.columns.map((column) => (
                    <td
                      key={column.header}
                      className={cn(
                        "px-4 py-2.5 text-ink-800",
                        column.kind === "money" || column.kind === "number" ? "whitespace-nowrap text-right tabular-nums" : "max-w-[18rem] truncate",
                      )}
                    >
                      {formatCell(column.kind, column.value(row)) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {sum ? (
              <tfoot className="sticky bottom-0 bg-surface font-bold">
                <tr className="border-t-2 border-border">
                  {sum.map((value, index) => (
                    <td key={index} className={cn("whitespace-nowrap px-4 py-2.5 text-ink-800", typeof value === "number" && "text-right tabular-nums")}>
                      {typeof value === "number" ? formatCell(table.columns[index]!.kind, value) : value}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
          {table.rows.length > SCREEN_ROWS ? (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Showing the first {SCREEN_ROWS} of {count(table.rows.length)}. Totals cover every record; export to see them all.
            </p>
          ) : null}
        </div>
      )}
    </Panel>
  );
}

/** Chart tooltip listing each series in MWK, with a total when there is more than one. */
export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-ink-800">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="mt-1 flex items-center gap-2 text-ink-800">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.name}: <span className="ml-auto pl-3 font-semibold tabular-nums">{money(item.value)}</span>
        </p>
      ))}
      {payload.length > 1 ? (
        <p className="mt-1 border-t border-border pt-1 font-semibold text-ink-800">Total: {money(total)}</p>
      ) : null}
    </div>
  );
}
