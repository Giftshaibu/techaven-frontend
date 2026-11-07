import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

export function SectionHeader({
  title,
  description,
  action,
  editorial,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  editorial?: boolean;
}) {
  return (
    <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2 md:gap-3">
      <div>
        <h2
          className={
            editorial
              ? "font-editorial text-3xl leading-tight text-ink-800 md:text-4xl"
              : "text-xl font-bold leading-tight text-ink-800 md:text-3xl"
          }
        >
          {title}
        </h2>
        {description ? (
          <p className="hidden md:block mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ViewAllLink({
  to,
  params,
  label = "View all",
}: {
  to: string;
  params?: Record<string, string>;
  label?: string;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      params={params as never}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs md:text-sm font-semibold text-brand-500 hover:text-brand-700 hover:underline"
    >
      {label}
      <Icon name="alt-arrow-right-linear" className="h-4 w-4" />
    </Link>
  );
}
