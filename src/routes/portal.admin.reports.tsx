import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import {
  ErrorBlock,
  errorMessage,
  LoadingBlock,
  PageHeader,
  Panel,
  StatTile,
} from "@/components/portal/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartTooltip, DataTable, ExportMenu, Figures, PeriodFilters } from "@/components/reports/ReportKit";
import { adminApi, type AdminReport } from "@/integrations/techaven/staff";
import {
  count,
  defineTable,
  exportExcel,
  exportPdf,
  money,
  type ReportMeta,
  type ReportTable,
} from "@/lib/report-export";
import {
  axisTick,
  bucketLabel,
  compactNumber,
  groupingLabel,
  SERIES,
  titleCase,
  useReportPeriod,
} from "@/lib/report-periods";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/reports")({ component: AdminReports });

/* ───────────── Section tables (shared by screen, PDF and Excel) ───────────── */

type TabKey = "overview" | "items" | "escrow" | "payouts" | "requests" | "subscriptions";
const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  items: "Items sold",
  escrow: "Escrow",
  payouts: "Payouts",
  requests: "Payout requests",
  subscriptions: "Subscriptions",
};
function buildTables(report: AdminReport): Record<TabKey, ReportTable[]> {
  const g = report.range.granularity;
  return {
    overview: [
      defineTable({
        title: "Revenue over time",
        rows: report.series,
        columns: [
          { header: g === "month" ? "Month" : g === "week" ? "Week" : "Day", value: (r) => bucketLabel(r.bucket, g) },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Items sold", value: (r) => r.items, kind: "number", total: true },
          { header: "Gross sales", value: (r) => r.gross, kind: "money", total: true },
          { header: "Commission", value: (r) => r.commission, kind: "money", total: true },
          { header: "Subscriptions", value: (r) => r.subscriptions, kind: "money", total: true },
          { header: "Platform revenue", value: (r) => r.commission + r.subscriptions, kind: "money", total: true },
        ],
      }),
    ],
    items: [
      defineTable({
        title: "Items sold by shop",
        rows: report.shops,
        columns: [
          { header: "Shop", value: (r) => r.shop },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Items sold", value: (r) => r.items, kind: "number", total: true },
          { header: "Gross sales", value: (r) => r.gross, kind: "money", total: true },
          { header: "Techaven commission", value: (r) => r.commission, kind: "money", total: true },
          { header: "Seller share", value: (r) => r.seller_share, kind: "money", total: true },
          { header: "Paid out", value: (r) => r.released, kind: "money", total: true },
          { header: "Still in escrow", value: (r) => r.held, kind: "money", total: true },
        ],
      }),
      defineTable({
        title: "Products sold",
        rows: report.products,
        columns: [
          { header: "Product", value: (r) => r.product },
          { header: "Shop", value: (r) => r.shop },
          { header: "Quantity", value: (r) => r.quantity, kind: "number", total: true },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Revenue", value: (r) => r.revenue, kind: "money", total: true },
        ],
      }),
    ],
    escrow: [
      defineTable({
        title: "Escrow by order",
        rows: report.escrow.rows,
        columns: [
          { header: "Order", value: (r) => r.order_number },
          { header: "Shop", value: (r) => r.shop },
          { header: "Buyer", value: (r) => r.buyer },
          { header: "Paid", value: (r) => r.paid_at, kind: "datetime" },
          { header: "Order total", value: (r) => r.total_amount, kind: "money", total: true },
          { header: "Commission", value: (r) => r.commission, kind: "money", total: true },
          { header: "Escrow", value: (r) => r.escrow_amount, kind: "money", total: true },
          { header: "Escrow status", value: (r) => titleCase(r.escrow_status) },
          { header: "Delivery proof", value: (r) => titleCase(r.delivery_proof_status) || "—" },
          { header: "Released", value: (r) => r.funds_released_at, kind: "datetime" },
        ],
      }),
    ],
    payouts: [
      defineTable({
        title: "Completed payouts",
        rows: report.payouts.rows,
        columns: [
          { header: "Paid on", value: (r) => r.processed_at ?? r.requested_at, kind: "datetime" },
          { header: "Shop", value: (r) => r.shop },
          { header: "Seller", value: (r) => r.seller },
          { header: "Method", value: (r) => titleCase(r.method) },
          { header: "Account name", value: (r) => r.account_name },
          { header: "Account number", value: (r) => r.account_number },
          { header: "Amount", value: (r) => r.amount, kind: "money", total: true },
          { header: "Notes", value: (r) => r.admin_notes },
        ],
      }),
    ],
    requests: [
      defineTable({
        title: "Payout requests",
        rows: report.payout_requests.rows,
        columns: [
          { header: "Requested", value: (r) => r.requested_at, kind: "datetime" },
          { header: "Shop", value: (r) => r.shop },
          { header: "Seller", value: (r) => r.seller },
          { header: "Status", value: (r) => titleCase(r.status) },
          { header: "Method", value: (r) => titleCase(r.method) },
          { header: "Account", value: (r) => [r.account_name, r.account_number].filter(Boolean).join(" · ") },
          { header: "Amount", value: (r) => r.amount, kind: "money", total: true },
          { header: "Processed", value: (r) => r.processed_at, kind: "datetime" },
        ],
      }),
    ],
    subscriptions: [
      defineTable({
        title: "Subscriptions by package",
        rows: report.subscriptions.by_package,
        columns: [
          { header: "Package", value: (r) => r.package },
          { header: "Payments", value: (r) => r.count, kind: "number", total: true },
          { header: "Income", value: (r) => r.amount, kind: "money", total: true },
        ],
      }),
      defineTable({
        title: "Subscription payments",
        rows: report.subscriptions.rows,
        columns: [
          { header: "Shop", value: (r) => r.shop },
          { header: "Package", value: (r) => r.package },
          { header: "Billing", value: (r) => titleCase(r.billing_period) },
          { header: "Period start", value: (r) => r.current_period_start, kind: "date" },
          { header: "Period end", value: (r) => r.current_period_end, kind: "date" },
          { header: "Status", value: (r) => titleCase(r.status) },
          { header: "Reference", value: (r) => r.payment_reference },
          { header: "Amount", value: (r) => r.amount, kind: "money", total: true },
        ],
      }),
    ],
  };
}

function summaryFor(report: AdminReport, tab: TabKey | "all"): ReportMeta["summary"] {
  const s = report.summary;
  const platform = [
    { label: "Platform revenue", value: money(s.platform_revenue) },
    { label: "Commission", value: money(s.commission) },
    { label: "Subscription income", value: money(s.subscription_income) },
    { label: "Gross sales", value: money(s.gross_sales) },
    { label: "Items sold", value: count(s.items_sold) },
  ];
  const map: Record<TabKey, ReportMeta["summary"]> = {
    overview: [...platform, { label: "Orders", value: count(s.orders) }, { label: "Average order", value: money(s.average_order) }],
    items: [
      { label: "Items sold", value: count(s.items_sold) },
      { label: "Orders", value: count(s.orders) },
      { label: "Shops selling", value: count(s.selling_shops) },
      { label: "Gross sales", value: money(s.gross_sales) },
      { label: "Seller share", value: money(s.seller_share) },
    ],
    escrow: [
      { label: "Held now", value: money(report.escrow.held_now) },
      { label: "Orders held now", value: count(report.escrow.held_orders_now) },
      { label: "Awaiting approval", value: count(report.escrow.awaiting_approval_now) },
      { label: "Released in period", value: money(report.escrow.released) },
      { label: "Refunded in period", value: money(report.escrow.refunded) },
    ],
    payouts: [
      { label: "Paid out", value: money(report.payouts.total) },
      { label: "Payouts", value: count(report.payouts.count) },
    ],
    requests: [
      { label: "Requests in period", value: count(report.payout_requests.count) },
      { label: "Pending now", value: `${count(report.payout_requests.pending_now.count)} · ${money(report.payout_requests.pending_now.amount)}` },
      ...Object.entries(report.payout_requests.by_status).map(([status, n]) => ({ label: titleCase(status), value: count(n) })),
    ],
    subscriptions: [
      { label: "Subscription income", value: money(report.subscriptions.income) },
      { label: "Payments", value: count(report.subscriptions.payments) },
      { label: "Active now", value: count(report.subscriptions.active_now) },
      { label: "Past due now", value: count(report.subscriptions.past_due_now) },
    ],
  };
  return tab === "all" ? [...platform, { label: "Escrow held now", value: money(report.escrow.held_now) }, { label: "Paid out", value: money(report.payouts.total) }, { label: "Pending payout requests", value: money(report.payout_requests.pending_now.amount) }, { label: "Active subscriptions", value: count(report.subscriptions.active_now) }] : map[tab];
}

/* ───────────── Page ───────────── */

function AdminReports() {
  const period = useReportPeriod("month");
  const { range } = period;
  const [tab, setTab] = useState<TabKey>("overview");
  const [exporting, setExporting] = useState<string | null>(null);

  const report = useQuery({
    queryKey: ["portal", "admin", "report", range],
    queryFn: () => adminApi.report(range),
    placeholderData: keepPreviousData,
  });
  const data = report.data;
  const tables = useMemo(() => (data ? buildTables(data) : null), [data]);

  async function runExport(kind: "pdf" | "xlsx", scope: TabKey | "all") {
    if (!data || !tables) return;
    const key = `${kind}-${scope}`;
    setExporting(key);
    try {
      const meta: ReportMeta = {
        title: scope === "all" ? "Platform report" : `${TAB_LABELS[scope]} report`,
        from: data.range.from,
        to: data.range.to,
        granularity: groupingLabel(data.range.granularity),
        timezone: data.range.timezone,
        generatedAt: data.range.generated_at,
        summary: summaryFor(data, scope),
        notes: Object.values(data.basis),
      };
      const sections = scope === "all" ? (Object.keys(TAB_LABELS) as TabKey[]).flatMap((k) => tables[k]) : tables[scope];
      await (kind === "pdf" ? exportPdf(meta, sections) : exportExcel(meta, sections));
      toast.success(`${kind === "pdf" ? "PDF" : "Excel"} downloaded`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Sales by shop, escrow, payouts and subscription income, with what Techaven earned. Export any tab, or the whole report, as PDF or Excel."
        actions={
          <ExportMenu
            label="Export report"
            busy={exporting?.endsWith("-all") ?? false}
            disabled={!data}
            onPdf={() => void runExport("pdf", "all")}
            onExcel={() => void runExport("xlsx", "all")}
          />
        }
      />

      <PeriodFilters period={period} updating={report.isFetching && Boolean(data)} />

      {report.isLoading ? (
        <LoadingBlock rows={6} label="Building your report" />
      ) : report.error && !data ? (
        <ErrorBlock error={report.error} onRetry={() => void report.refetch()} />
      ) : data && tables ? (
        <div className={cn("space-y-6 transition-opacity", report.isFetching && "opacity-70")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile accent label="Platform revenue" icon="graph-up-linear" value={money(data.summary.platform_revenue)} hint={`${money(data.summary.commission)} commission + ${money(data.summary.subscription_income)} subscriptions`} />
            <StatTile label="Gross sales" icon="bag-4-linear" value={money(data.summary.gross_sales)} hint={`${count(data.summary.orders)} paid orders · avg ${money(data.summary.average_order)}`} />
            <StatTile label="Items sold" icon="box-linear" value={count(data.summary.items_sold)} hint={`${count(data.summary.selling_shops)} shops · ${count(data.summary.buyers)} buyers`} />
            <StatTile label="Escrow held now" icon="safe-square-linear" value={money(data.escrow.held_now)} hint={`${count(data.escrow.awaiting_approval_now)} deliveries awaiting approval`} />
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList className="h-auto flex-wrap justify-start">
                {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {TAB_LABELS[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ExportMenu
                label={`Export ${TAB_LABELS[tab].toLowerCase()}`}
                busy={exporting?.endsWith(`-${tab}`) ?? false}
                onPdf={() => void runExport("pdf", tab)}
                onExcel={() => void runExport("xlsx", tab)}
              />
            </div>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <Panel title="Platform revenue" description={`Commission and subscription income per ${data.range.granularity}, in MWK`}>
                <RevenueChart report={data} />
              </Panel>
              <DataTable table={tables.overview[0]!} />
            </TabsContent>

            <TabsContent value="items" className="mt-4 space-y-6">
              <Panel title="Top shops by items sold">
                <TopShopsChart report={data} />
              </Panel>
              {tables.items.map((table) => (
                <DataTable key={table.title} table={table} />
              ))}
            </TabsContent>

            <TabsContent value="escrow" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Held now", money(data.escrow.held_now), `${count(data.escrow.held_orders_now)} orders`],
                  ["Awaiting approval", count(data.escrow.awaiting_approval_now), "Proofs of delivery to review"],
                  ["Released in period", money(data.escrow.released), `${count(data.escrow.released_orders)} orders`],
                  ["Refunded in period", money(data.escrow.refunded), "Returned to buyers"],
                ]}
              />
              <DataTable table={tables.escrow[0]!} />
            </TabsContent>

            <TabsContent value="payouts" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Paid out to sellers", money(data.payouts.total), `${count(data.payouts.count)} completed payouts`],
                  ["Released from escrow", money(data.escrow.released), "Credited to seller wallets"],
                ]}
              />
              <DataTable table={tables.payouts[0]!} />
            </TabsContent>

            <TabsContent value="requests" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Pending now", money(data.payout_requests.pending_now.amount), `${count(data.payout_requests.pending_now.count)} waiting for you`],
                  ["Requested in period", count(data.payout_requests.count), "All statuses"],
                  ["Completed", count(data.payout_requests.by_status["completed"] ?? 0), "In this period"],
                  ["Rejected", count(data.payout_requests.by_status["rejected"] ?? 0), "In this period"],
                ]}
              />
              <DataTable table={tables.requests[0]!} />
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Subscription income", money(data.subscriptions.income), `${count(data.subscriptions.payments)} payments`],
                  ["Active now", count(data.subscriptions.active_now), "Shops on a paid plan"],
                  ["Past due now", count(data.subscriptions.past_due_now), "Need renewal"],
                  ["Ended", count(data.subscriptions.ended), "Expired or cancelled"],
                ]}
              />
              {tables.subscriptions.map((table) => (
                <DataTable key={table.title} table={table} />
              ))}
            </TabsContent>
          </Tabs>
          {data.truncated ? (
            <p className="text-xs text-muted-foreground">Some lists hit the 5,000-row limit. Narrow the dates to see every record.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ───────────── Charts (validated categorical slots 1–2: blue, orange) ───────────── */


function RevenueChart({ report }: { report: AdminReport }) {
  const rows = report.series.map((row) => ({ ...row, label: bucketLabel(row.bucket, report.range.granularity) }));
  if (!rows.some((row) => row.commission || row.subscriptions)) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No platform revenue in this period yet.</p>;
  }
  return (
    <div className="h-72 w-full" role="img" aria-label="Stacked bars of commission and subscription income per period; values are in the table below.">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => compactNumber.format(v)} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--stage)", opacity: 0.6 }} />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string) => <span className="text-ink-800">{value}</span>}
          />
          <Bar dataKey="commission" name="Commission" stackId="revenue" fill={SERIES.first} stroke="var(--surface)" strokeWidth={2} maxBarSize={36} />
          <Bar dataKey="subscriptions" name="Subscriptions" stackId="revenue" fill={SERIES.second} stroke="var(--surface)" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopShopsChart({ report }: { report: AdminReport }) {
  const rows = [...report.shops].sort((a, b) => b.items - a.items).slice(0, 10);
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">No items sold in this period.</p>;
  return (
    <div className="w-full" style={{ height: Math.max(160, rows.length * 34 + 40) }} role="img" aria-label="Bar chart of the top shops by items sold; values are in the table below.">
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="shop" tick={axisTick} tickLine={false} axisLine={false} width={140} />
          <Tooltip
            cursor={{ fill: "var(--stage)", opacity: 0.6 }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-ink-800">{payload[0].payload.shop}</p>
                  <p className="mt-1 text-ink-800">{count(payload[0].payload.items)} items · {money(payload[0].payload.gross)}</p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="items" name="Items sold" fill={SERIES.first} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
