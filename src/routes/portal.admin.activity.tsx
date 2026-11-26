import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Icon } from "@/components/Icon";
import {
  EmptyState,
  ErrorBlock,
  inputClass,
  LoadingBlock,
  PageHeader,
  Panel,
  relativeTime,
  StatusPill,
} from "@/components/portal/kit";
import { adminApi } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/activity")({ component: AdminActivity });

const ICONS: Record<string, string> = {
  user: "user-circle-linear",
  order: "bag-4-linear",
  shop: "shop-2-linear",
  withdrawal_request: "wallet-money-linear",
  delivery_job: "delivery-linear",
  delivery_agent: "delivery-linear",
  shipping_address: "map-point-linear",
};

function AdminActivity() {
  const logs = useQuery({ queryKey: ["portal", "admin", "audit"], queryFn: adminApi.auditLogs });
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () =>
      (logs.data ?? []).filter(
        (log) =>
          !search.trim() ||
          `${log.action} ${log.actor?.name ?? ""} ${log.target_type ?? ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [logs.data, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        description="Who did what, and when. Useful for support, fraud checks and compliance."
      />
      <div className="relative md:w-80">
        <Icon
          name="magnifier-linear"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by action or person"
          className={cn(inputClass, "pl-9")}
        />
      </div>
      <Panel bodyClassName="p-0">
        {logs.isLoading ? (
          <div className="p-5">
            <LoadingBlock label="Loading activity" />
          </div>
        ) : logs.error ? (
          <div className="p-5">
            <ErrorBlock error={logs.error} />
          </div>
        ) : !visible.length ? (
          <EmptyState icon="history-linear" title="Nothing logged yet" />
        ) : (
          <ol className="relative divide-y divide-border">
            {visible.map((log) => (
              <li key={log.id} className="flex items-start gap-3 px-4 py-3.5 md:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stage text-brand-500">
                  <Icon
                    name={ICONS[log.target_type ?? ""] ?? "history-linear"}
                    className="h-[18px] w-[18px]"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-800">
                    <code className="rounded bg-stage px-1.5 py-0.5 text-xs">{log.action}</code>
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {log.actor ? `${log.actor.name}` : "System"}
                    {log.target_type
                      ? ` → ${log.target_type.replace(/_/g, " ")} #${log.target_id}`
                      : ""}
                  </p>
                </div>
                {log.actor ? (
                  <StatusPill tone="muted">{log.actor.role.replace("_", " ")}</StatusPill>
                ) : null}
                <time className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                  {relativeTime(log.createdAt ?? log.created_at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
