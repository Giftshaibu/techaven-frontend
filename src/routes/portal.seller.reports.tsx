import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import { ErrorBlock, errorMessage, LoadingBlock, PageHeader, Panel, shortDate, StatTile } from "@/components/portal/kit";
import { ChartTooltip, DataTable, ExportMenu, Figures, PeriodFilters } from "@/components/reports/ReportKit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sellerApi, type SellerReport } from "@/integrations/techaven/staff";
import { count, defineTable, exportExcel, exportPdf, money, type ReportMeta, type ReportTable } from "@/lib/report-export";
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

export const Route = createFileRoute("/portal/seller/reports")({ component: SellerReports });

type TabKey = "overview" | "products" | "orders" | "fulfilment" | "payouts";
const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  products: "Products",
  orders: "Orders",
  fulfilment: "Fulfilment",
  payouts: "Payouts",
};

/** Where an order stands, in the seller's words. */
function orderStage(row: SellerReport["orders"][number]) {
  if (row.status === "cancelled") return "Cancelled";
  if (row.payment_status !== "paid") return "Awaiting payment";
  if (row.escrow_status === "released") return "Paid to wallet";
  if (row.delivery_proof_status === "pending_review") return "Awaiting approval";
  if (row.dispatched_at || row.status === "shipped" || row.status === "delivered") return "Waiting for buyer";
  return "To send";
}

function buildTables(report: SellerReport): Record<TabKey, ReportTable[]> {
  const g = report.range.granularity;
  return {
    overview: [
      defineTable({
        title: "Sales over time",
        rows: report.series,
        columns: [
          { header: g === "month" ? "Month" : g === "week" ? "Week" : "Day", value: (r) => bucketLabel(r.bucket, g) },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Items sold", value: (r) => r.items, kind: "number", total: true },
          { header: "Gross sales", value: (r) => r.gross, kind: "money", total: true },
          { header: "Techaven commission", value: (r) => r.commission, kind: "money", total: true },
          { header: "Your earnings", value: (r) => r.net, kind: "money", total: true },
        ],
      }),
    ],
    products: [
      defineTable({
        title: "Products sold",
        rows: report.products,
        columns: [
          { header: "Product", value: (r) => r.product },
          { header: "Quantity", value: (r) => r.quantity, kind: "number", total: true },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Revenue", value: (r) => r.revenue, kind: "money", total: true },
          { header: "Last sold", value: (r) => r.last_sold, kind: "date" },
        ],
      }),
    ],
    orders: [
      defineTable({
        title: "Orders",
        rows: report.orders,
        columns: [
          { header: "Order", value: (r) => r.order_number },
          { header: "Stage", value: (r) => orderStage(r) },
          { header: "Date", value: (r) => r.paid_at ?? r.placed_at, kind: "datetime" },
          { header: "Buyer", value: (r) => r.buyer },
          { header: "Items", value: (r) => r.items, kind: "number", total: true },
          { header: "Total", value: (r) => r.total_amount, kind: "money", total: true },
          { header: "Commission", value: (r) => r.commission, kind: "money", total: true },
          { header: "Your earnings", value: (r) => r.net, kind: "money", total: true },
          { header: "Fulfilment", value: (r) => (r.fulfilment_type === "pickup" ? "Collect at shop" : (r.courier_service ?? "Techaven rider")) },
          { header: "Paid to wallet", value: (r) => r.funds_released_at, kind: "date" },
        ],
      }),
    ],
    fulfilment: [
      defineTable({
        title: "Sales by weekday",
        rows: report.fulfilment.by_weekday,
        columns: [
          { header: "Day", value: (r) => r.day },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Gross sales", value: (r) => r.gross, kind: "money", total: true },
        ],
      }),
      defineTable({
        title: "Delivery vs collection",
        rows: report.fulfilment.by_type,
        columns: [
          { header: "Fulfilment", value: (r) => (r.type === "pickup" ? "Collect at shop" : "Delivery") },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
          { header: "Gross sales", value: (r) => r.gross, kind: "money", total: true },
        ],
      }),
      defineTable({
        title: "Couriers chosen by buyers",
        rows: report.fulfilment.couriers,
        columns: [
          { header: "Courier", value: (r) => r.courier },
          { header: "Orders", value: (r) => r.orders, kind: "number", total: true },
        ],
      }),
    ],
    payouts: [
      defineTable({
        title: "Withdrawals",
        rows: report.withdrawals.rows,
        columns: [
          { header: "Requested", value: (r) => r.requested_at, kind: "datetime" },
          { header: "Status", value: (r) => titleCase(r.status) },
          { header: "Method", value: (r) => titleCase(r.method) },
          { header: "Account", value: (r) => [r.account_name, r.account_number].filter(Boolean).join(" · ") },
          { header: "Amount", value: (r) => r.amount, kind: "money", total: true },
          { header: "Processed", value: (r) => r.processed_at, kind: "datetime" },
          { header: "Note from Techaven", value: (r) => r.admin_notes },
        ],
      }),
    ],
  };
}

function summaryFor(report: SellerReport, tab: TabKey | "all"): ReportMeta["summary"] {
  const s = report.summary;
  const headline = [
    { label: "Your earnings", value: money(s.net_earnings) },
    { label: "Gross sales", value: money(s.gross_sales) },
    { label: "Techaven commission", value: money(s.commission) },
    { label: "Items sold", value: count(s.items_sold) },
    { label: "Orders", value: count(s.orders) },
  ];
  const map: Record<TabKey, ReportMeta["summary"]> = {
    overview: [...headline, { label: "Average order", value: money(s.average_order) }, { label: "Paid to wallet", value: money(s.released) }],
    products: [
      { label: "Items sold", value: count(s.items_sold) },
      { label: "Different products", value: count(s.products_sold) },
      { label: "Gross sales", value: money(s.gross_sales) },
    ],
    orders: [
      { label: "Paid orders", value: count(s.orders) },
      { label: "Buyers", value: count(s.buyers) },
      { label: "Awaiting payment", value: `${count(s.unpaid)} · ${money(s.unpaid_value)}` },
      { label: "Cancelled", value: `${count(s.cancelled)} · ${money(s.cancelled_value)}` },
    ],
    fulfilment: [
      { label: "Orders sent", value: count(report.fulfilment.sent) },
      { label: "Average time to send", value: hours(report.fulfilment.average_hours_to_send) },
      { label: "Sent within 24 hours", value: report.fulfilment.sent_within_a_day == null ? "—" : `${report.fulfilment.sent_within_a_day}%` },
      { label: "Best day", value: s.best_weekday ?? "—" },
    ],
    payouts: [
      { label: "Wallet balance now", value: money(report.now.wallet_balance) },
      { label: "Withdrawn in period", value: money(report.withdrawals.completed_total) },
      { label: "Pending withdrawals", value: money(report.now.pending_withdrawals.amount) },
      { label: "Still in escrow", value: money(report.now.in_escrow) },
    ],
  };
  return tab === "all"
    ? [...headline, { label: "Paid to wallet", value: money(s.released) }, { label: "Still in escrow", value: money(report.now.in_escrow) }, { label: "Wallet balance", value: money(report.now.wallet_balance) }]
    : map[tab];
}

function hours(value: number | null) {
  if (value == null) return "—";
  if (value < 1) return `${Math.max(1, Math.round(value * 60))} min`;
  if (value < 48) return `${value.toFixed(1)} h`;
  return `${(value / 24).toFixed(1)} days`;
}

function SellerReports() {
  const period = useReportPeriod("month");
  const [tab, setTab] = useState<TabKey>("overview");
  const [exporting, setExporting] = useState<string | null>(null);
  const report = useQuery({
    queryKey: ["portal", "seller", "report", period.range],
    queryFn: () => sellerApi.report(period.range),
    placeholderData: keepPreviousData,
  });
  const data = report.data;
  const tables = useMemo(() => (data ? buildTables(data) : null), [data]);

  async function runExport(kind: "pdf" | "xlsx", scope: TabKey | "all") {
    if (!data || !tables) return;
    setExporting(`${kind}-${scope}`);
    try {
      const meta: ReportMeta = {
        title: scope === "all" ? "Sales report" : `${TAB_LABELS[scope]} report`,
        from: data.range.from,
        to: data.range.to,
        granularity: groupingLabel(data.range.granularity),
        timezone: data.range.timezone,
        generatedAt: data.range.generated_at,
        summary: summaryFor(data, scope),
        notes: Object.values(data.basis),
      };
      const sections = scope === "all" ? (Object.keys(TAB_LABELS) as TabKey[]).flatMap((key) => tables[key]) : tables[scope];
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
        title="Sales report"
        description="What you sold, what you earned after commission, what's been paid to your wallet, and how quickly you send orders. Export any tab or the whole report."
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
        <LoadingBlock rows={6} label="Adding up your sales" />
      ) : report.error && !data ? (
        <ErrorBlock error={report.error} onRetry={() => void report.refetch()} />
      ) : data && tables ? (
        <div className={cn("space-y-6 transition-opacity", report.isFetching && "opacity-70")}>
          <ActionStrip report={data} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              accent
              label="Your earnings"
              icon="wallet-money-linear"
              value={money(data.summary.net_earnings)}
              hint={`${money(data.summary.gross_sales)} sales − ${money(data.summary.commission)} commission`}
            />
            <StatTile label="Items sold" icon="box-linear" value={count(data.summary.items_sold)} hint={`${count(data.summary.orders)} orders · ${count(data.summary.buyers)} buyers`} />
            <StatTile label="Average order" icon="bag-4-linear" value={money(data.summary.average_order)} hint={`${count(data.summary.products_sold)} different products`} />
            <StatTile label="Paid to wallet" icon="safe-square-linear" value={money(data.summary.released)} hint={`${count(data.summary.released_orders)} orders completed in this period`} />
          </div>

          <Insights report={data} />

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
              <Panel title="Sales" description={`Your earnings and Techaven commission per ${data.range.granularity}, in MWK`}>
                <SalesChart report={data} />
              </Panel>
              <DataTable table={tables.overview[0]!} />
            </TabsContent>

            <TabsContent value="products" className="mt-4 space-y-6">
              <Panel title="Best sellers" description="Top 10 products by quantity">
                <TopProductsChart report={data} />
              </Panel>
              <DataTable table={tables.products[0]!} />
            </TabsContent>

            <TabsContent value="orders" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Paid orders", count(data.summary.orders), `${money(data.summary.gross_sales)} in sales`],
                  ["Awaiting payment", count(data.summary.unpaid), `${money(data.summary.unpaid_value)} placed, not yet paid`],
                  ["Cancelled", count(data.summary.cancelled), money(data.summary.cancelled_value)],
                  ["Buyers", count(data.summary.buyers), "Different customers"],
                ]}
              />
              <DataTable table={tables.orders[0]!} />
            </TabsContent>

            <TabsContent value="fulfilment" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Average time to send", hours(data.fulfilment.average_hours_to_send), "From payment to marked as sent"],
                  ["Sent within 24 hours", data.fulfilment.sent_within_a_day == null ? "—" : `${data.fulfilment.sent_within_a_day}%`, `${count(data.fulfilment.sent)} orders sent`],
                  ["Best day", data.summary.best_weekday ?? "—", "Highest sales by weekday"],
                  ["Collected at shop", count(data.fulfilment.by_type.find((t) => t.type === "pickup")?.orders ?? 0), "Orders buyers picked up"],
                ]}
              />
              <Panel title="Sales by weekday" description="Gross sales per day of the week, in MWK">
                <WeekdayChart report={data} />
              </Panel>
              <div className="grid gap-6 lg:grid-cols-2">
                <DataTable table={tables.fulfilment[1]!} />
                <DataTable table={tables.fulfilment[2]!} />
              </div>
            </TabsContent>

            <TabsContent value="payouts" className="mt-4 space-y-6">
              <Figures
                items={[
                  ["Wallet balance", money(data.now.wallet_balance), "Available to withdraw"],
                  ["Still in escrow", money(data.now.in_escrow), "Released once delivery is approved"],
                  ["Withdrawn in period", money(data.withdrawals.completed_total), `${count(data.withdrawals.by_status["completed"] ?? 0)} completed`],
                  ["Pending withdrawals", money(data.now.pending_withdrawals.amount), `${count(data.now.pending_withdrawals.count)} being processed`],
                ]}
              />
              <DataTable table={tables.payouts[0]!} />
            </TabsContent>
          </Tabs>

          {data.plan ? (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Icon name="card-linear" className="h-4 w-4" />
              Plan: <strong className="text-ink-800">{data.plan.package ?? "—"}</strong> · {titleCase(data.plan.status)}
              {data.plan.current_period_end ? ` · renews ${shortDate(data.plan.current_period_end)}` : ""}
              <Link to="/portal/seller/plan" className="font-semibold text-brand-500 hover:underline">
                Manage plan
              </Link>
            </p>
          ) : null}
          {data.truncated ? (
            <p className="text-xs text-muted-foreground">Some lists hit the 5,000-row limit. Narrow the dates to see every record.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Current to-dos that hold up the seller's money, linked to where they are handled. */
function ActionStrip({ report }: { report: SellerReport }) {
  const items = [
    {
      count: report.now.to_send,
      label: "to send",
      hint: "Paid and waiting for you",
      to: "/portal/seller/orders" as const,
      icon: "delivery-linear",
      urgent: true,
    },
    {
      count: report.now.awaiting_buyer,
      label: "with buyers",
      hint: "Waiting for them to confirm",
      to: "/portal/seller/orders" as const,
      icon: "clock-circle-linear",
    },
    {
      count: report.now.awaiting_approval,
      label: "being approved",
      hint: `${money(report.now.approval_amount)} on its way to your wallet`,
      to: "/portal/seller/orders" as const,
      icon: "check-circle-linear",
    },
    {
      count: null,
      label: money(report.now.wallet_balance),
      hint: "In your wallet now",
      to: "/portal/seller/earnings" as const,
      icon: "wallet-money-linear",
    },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-stage",
            item.urgent && item.count ? "border-amber-300 bg-amber-50" : "border-border bg-surface",
          )}
        >
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", item.urgent && item.count ? "bg-amber-100 text-amber-800" : "bg-brand-100 text-brand-700")}>
            <Icon name={item.icon} className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink-800">
              {item.count == null ? item.label : `${count(item.count)} ${item.label}`}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** One-line takeaways so the numbers say something. */
function Insights({ report }: { report: SellerReport }) {
  const s = report.summary;
  const top = report.products[0];
  const lines = [
    top ? `Best seller: ${top.product} (${count(top.quantity)} sold).` : null,
    s.best_weekday ? `${s.best_weekday} is your strongest day.` : null,
    s.best_period ? `Busiest ${report.range.granularity}: ${bucketLabel(s.best_period.bucket, report.range.granularity)} with ${money(s.best_period.gross)}.` : null,
    report.fulfilment.average_hours_to_send != null
      ? `You send orders in about ${hours(report.fulfilment.average_hours_to_send)} on average${report.fulfilment.sent_within_a_day != null ? `, ${report.fulfilment.sent_within_a_day}% within a day` : ""}.`
      : null,
    s.unpaid ? `${count(s.unpaid)} order${s.unpaid === 1 ? " is" : "s are"} still waiting for payment (${money(s.unpaid_value)}).` : null,
  ].filter(Boolean);
  if (!lines.length) {
    return <p className="rounded-2xl bg-stage px-4 py-3 text-sm text-muted-foreground">No sales in this period yet. Try a longer period, or check your listings are live.</p>;
  }
  return (
    <ul className="grid gap-2 rounded-2xl bg-brand-100/40 px-4 py-3 text-sm text-ink-800 md:grid-cols-2">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <Icon name="lightbulb-linear" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          {line}
        </li>
      ))}
    </ul>
  );
}

function SalesChart({ report }: { report: SellerReport }) {
  const rows = report.series.map((row) => ({ ...row, label: bucketLabel(row.bucket, report.range.granularity) }));
  if (!rows.some((row) => row.gross)) return <p className="py-10 text-center text-sm text-muted-foreground">No sales in this period yet.</p>;
  return (
    <div className="h-72 w-full" role="img" aria-label="Stacked bars of your earnings and Techaven commission per period; values are in the table below.">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => compactNumber.format(v)} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--stage)", opacity: 0.6 }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span className="text-ink-800">{value}</span>} />
          <Bar dataKey="net" name="Your earnings" stackId="sales" fill={SERIES.first} stroke="var(--surface)" strokeWidth={2} maxBarSize={36} />
          <Bar dataKey="commission" name="Techaven commission" stackId="sales" fill={SERIES.second} stroke="var(--surface)" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopProductsChart({ report }: { report: SellerReport }) {
  const rows = report.products.slice(0, 10);
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">No products sold in this period.</p>;
  return (
    <div className="w-full" style={{ height: Math.max(160, rows.length * 34 + 40) }} role="img" aria-label="Bar chart of your top products by quantity sold; values are in the table below.">
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="product" tick={axisTick} tickLine={false} axisLine={false} width={170} />
          <Tooltip
            cursor={{ fill: "var(--stage)", opacity: 0.6 }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-ink-800">{payload[0].payload.product}</p>
                  <p className="mt-1 text-ink-800">{count(payload[0].payload.quantity)} sold · {money(payload[0].payload.revenue)}</p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="quantity" name="Quantity" fill={SERIES.first} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeekdayChart({ report }: { report: SellerReport }) {
  const rows = report.fulfilment.by_weekday.map((row) => ({ ...row, label: row.day.slice(0, 3) }));
  if (!rows.some((row) => row.gross)) return <p className="py-10 text-center text-sm text-muted-foreground">No sales in this period yet.</p>;
  return (
    <div className="h-56 w-full" role="img" aria-label="Bar chart of gross sales by weekday; values are in the exported report.">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => compactNumber.format(v)} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--stage)", opacity: 0.6 }} />
          <Bar dataKey="gross" name="Gross sales" fill={SERIES.first} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
