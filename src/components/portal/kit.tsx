import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import { Icon } from "@/components/Icon";
import { getStaffSession, subscribeStaffSession, type Money } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export function useStaffSession() {
  return useSyncExternalStore(subscribeStaffSession, getStaffSession, () => null);
}

export const toNumber = (value: Money) => (value == null || value === "" ? 0 : Number(value) || 0);

export function mwk(value: Money, { compact = false } = {}) {
  const amount = toNumber(value);
  if (compact && Math.abs(amount) >= 1_000_000)
    return `MK ${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`;
  if (compact && Math.abs(amount) >= 10_000) return `MK ${Math.round(amount / 1000)}K`;
  return `MK ${amount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export function shortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(value?: string | null) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : shortDate(value);
}

export const storage = (gb: number | null | undefined) =>
  gb == null ? "—" : gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}

const TONES = {
  good: "bg-success-soft text-emerald-800 ring-emerald-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  bad: "bg-danger-soft text-rose-800 ring-rose-200",
  info: "bg-info-soft text-sky-800 ring-sky-200",
  brand: "bg-brand-100 text-brand-800 ring-brand-300/40",
  muted: "bg-stage text-muted-foreground ring-border",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  active: "good",
  approved: "good",
  completed: "good",
  delivered: "good",
  paid: "good",
  verified: "good",
  released: "good",
  pending: "warn",
  pending_review: "warn",
  processing: "warn",
  draft: "muted",
  paused: "muted",
  held: "info",
  unverified: "warn",
  accepted: "brand",
  assigned: "brand",
  picked_up: "info",
  in_transit: "info",
  shipped: "info",
  rejected: "bad",
  cancelled: "bad",
  inactive: "bad",
  archived: "muted",
  failed: "bad",
  declined: "bad",
};

export function StatusPill({
  status,
  tone,
  children,
}: {
  status?: string | null;
  tone?: keyof typeof TONES;
  children?: ReactNode;
}) {
  const key = String(status ?? "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        TONES[tone ?? STATUS_TONE[key] ?? "muted"],
      )}
    >
      {children ?? key.replace(/_/g, " ")}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-500">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-800 md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 md:p-5",
        accent
          ? "border-transparent bg-gradient-to-br from-brand-500 to-brand-800 text-white"
          : "border-border bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            accent ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            accent ? "bg-white/15" : "bg-brand-100 text-brand-700",
          )}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight md:text-[28px]">
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-1 text-xs", accent ? "text-white/75" : "text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 md:px-5">
          <div>
            <h2 className="text-sm font-bold text-ink-800">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-stage text-brand-500">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <p className="mt-4 text-sm font-bold text-ink-800">{title}</p>
      {children ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-xl bg-stage" />
      ))}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-rose-900"
    >
      <span className="flex items-center gap-2">
        <Icon name="danger-triangle-linear" className="h-4 w-4" />
        {errorMessage(error)}
      </span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-stage disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-stage disabled:cursor-not-allowed disabled:opacity-50",
};

export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-muted-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-800">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

/** Segmented filter chips with counts. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            value === option.value
              ? "bg-ink-800 text-white"
              : "bg-surface text-ink-800 ring-1 ring-inset ring-border hover:bg-stage",
          )}
        >
          {option.label}
          {option.count != null ? (
            <span
              className={cn(
                "rounded-full px-1.5 tabular-nums",
                value === option.value ? "bg-white/20" : "bg-stage",
              )}
            >
              {option.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
