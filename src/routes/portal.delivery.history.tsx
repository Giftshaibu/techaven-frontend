import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  mwk,
  PageHeader,
  shortDate,
  StatTile,
  StatusPill,
} from "@/components/portal/kit";
import { deliveryApi } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/delivery/history")({ component: RiderHistory });

function RiderHistory() {
  const jobs = useQuery({ queryKey: ["portal", "rider", "jobs"], queryFn: deliveryApi.jobs });
  const all = jobs.data?.jobs ?? [];
  const done = all.filter((job) => job.status === "delivered");
  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = done.filter(
    (job) => job.delivered_at && new Date(job.delivered_at).getTime() >= weekAgo,
  );
  const total = (list: typeof done) => list.reduce((sum, job) => sum + (job.delivery_fee ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader eyebrow="Your work" title="Earnings & history" />
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          accent
          label="Last 7 days"
          icon="wallet-money-linear"
          value={mwk(total(week), { compact: true })}
          hint={`${week.length} deliveries`}
        />
        <StatTile
          label="All time"
          icon="medal-ribbons-star-linear"
          value={mwk(total(done), { compact: true })}
          hint={`${done.length} deliveries`}
        />
      </div>
      {jobs.isLoading ? (
        <LoadingBlock />
      ) : jobs.error ? (
        <ErrorBlock error={jobs.error} />
      ) : !all.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface">
          <EmptyState icon="routing-2-linear" title="No deliveries yet">
            Accepted and completed jobs appear here.
          </EmptyState>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {all.map((job) => (
            <li key={job.job_id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-800">
                  {job.order_number} · {job.shop_name ?? "Shop"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {job.dropoff_address} · {shortDate(job.delivered_at ?? job.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={job.status} />
                {job.delivery_fee ? (
                  <span className="text-xs font-bold tabular-nums text-ink-800">
                    {mwk(job.delivery_fee)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
