import { cn } from "@/lib/utils";

/** Upload progress for a file on its way to storage. Render it only while uploading. */
export function UploadProgressBar({
  percent,
  label = "Uploading",
  className,
}: {
  percent: number;
  label?: string;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{value >= 99 ? "Saving…" : label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-150"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
