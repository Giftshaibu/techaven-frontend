import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Icon } from "@/components/Icon";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  relativeTime,
  StatTile,
  StatusPill,
  useStaffSession,
} from "@/components/portal/kit";
import { adminApi } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/admin/")({ component: AdminOverview });

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

const describeAction = (action: string) =>
  action.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdminOverview() {
  const session = useStaffSession();
  const dashboard = useQuery({
    queryKey: ["portal", "admin", "dashboard"],
    queryFn: adminApi.dashboard,
  });
  const shops = useQuery({ queryKey: ["portal", "admin", "shops"], queryFn: adminApi.shops });
  const withdrawals = useQuery({
    queryKey: ["portal", "admin", "withdrawals"],
    queryFn: adminApi.withdrawals,
  });

  const pendingShops = (shops.data ?? []).filter((shop) => shop.application_status === "pending");
  const pendingPayouts = (withdrawals.data?.withdrawals ?? []).filter(
    (item) => item.status === "pending" || item.status === "processing",
  );
  const data = dashboard.data;
  const periods = data?.sales_analytics.periods;
  const byShop = (data?.sales_analytics.by_shop.all_time ?? [])
    .slice(0, 8)
    .map((row) => ({ ...row, label: row.shop_name }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={`${greeting()}, ${session?.user.name?.split(" ")[0] ?? "admin"}`}
        description="Here's the pulse of the Techaven mall right now."
      />

      {/* Attention queue */}
      {pendingShops.length > 0 || pendingPayouts.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {pendingShops.length > 0 ? (
            <Link
              to="/portal/admin/shops"
              className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <Icon name="shop-2-linear" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-950">
                  {pendingShops.length} shop application{pendingShops.length === 1 ? "" : "s"}{" "}
                  waiting
                </p>
                <p className="text-xs text-amber-800">Review and approve new sellers</p>
              </div>
              <Icon
                name="alt-arrow-right-linear"
                className="h-5 w-5 text-amber-800 transition group-hover:translate-x-1"
              />
            </Link>
          ) : null}
          {pendingPayouts.length > 0 ? (
            <Link
              to="/portal/admin/payouts"
              className="group flex items-center gap-4 rounded-2xl border border-sky-200 bg-info-soft p-4 transition hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-800">
                <Icon name="wallet-money-linear" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-sky-950">
                  {pendingPayouts.length} payout request{pendingPayouts.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-sky-800">Sellers waiting on their money</p>
              </div>
              <Icon
                name="alt-arrow-right-linear"
                className="h-5 w-5 text-sky-800 transition group-hover:translate-x-1"
              />
            </Link>
          ) : null}
        </div>
      ) : null}

      {dashboard.isLoading ? (
        <LoadingBlock rows={3} />
      ) : dashboard.error ? (
        <ErrorBlock error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : data && periods ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              accent
              label="Revenue · month"
              icon="graph-up-linear"
              value={mwk(periods.month_to_date.revenue_mwk, { compact: true })}
              hint={`${periods.month_to_date.order_count} paid orders`}
            />
            <StatTile
              label="Revenue · year"
              icon="chart-2-linear"
              value={mwk(periods.year_to_date.revenue_mwk, { compact: true })}
              hint={`${periods.year_to_date.order_count} orders · this week ${mwk(periods.week_to_date.revenue_mwk, { compact: true })}`}
            />
            <StatTile
              label="Shops"
              icon="shop-2-linear"
              value={data.overview.shops.total}
              hint={`${data.overview.shops.active} active · ${data.overview.shops.verified} verified`}
            />
            <StatTile
              label="People"
              icon="users-group-rounded-linear"
              value={
                data.overview.users.customers +
                data.overview.users.sellers +
                data.overview.users.admins
              }
              hint={`${data.overview.users.customers} shoppers · ${data.overview.users.sellers} sellers`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Panel title="Revenue by shop" description="All-time paid order revenue, MWK">
              {byShop.some((row) => row.revenue_mwk > 0) ? (
                <div
                  className="h-72"
                  role="img"
                  aria-label="Horizontal bar chart of all-time revenue per shop"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={byShop}
                      layout="vertical"
                      margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                      barCategoryGap={10}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--neutral-200)" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => mwk(value, { compact: true })}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={130}
                        tick={{ fontSize: 12, fill: "var(--ink-800)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--stage)" }}
                        formatter={(value: number, _name, item) => [
                          `${mwk(value)} · ${item.payload.order_count} orders`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid var(--neutral-200)",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="revenue_mwk"
                        fill="var(--brand-500)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon="chart-2-linear" title="No paid orders yet">
                  Revenue appears here as soon as shoppers pay for orders.
                </EmptyState>
              )}
              {byShop.length ? (
                <table className="sr-only">
                  <caption>Revenue by shop</caption>
                  <tbody>
                    {byShop.map((row) => (
                      <tr key={row.shop_id}>
                        <th>{row.shop_name}</th>
                        <td>{mwk(row.revenue_mwk)}</td>
                        <td>{row.order_count} orders</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </Panel>

            <Panel
              title="Live activity"
              description="Latest actions across the platform"
              bodyClassName="p-0"
            >
              <ol className="max-h-80 divide-y divide-border overflow-y-auto">
                {data.recent.activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 px-4 py-3 md:px-5">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-800">
                        {describeAction(activity.action)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activity.actor
                          ? `${activity.actor.name} · ${activity.actor.role.replace("_", " ")}`
                          : "System"}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(activity.created_at)}
                    </time>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Catalogue health">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Legacy products</dt>
                  <dd className="text-xl font-extrabold text-ink-800">
                    {data.overview.products.total}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Categories</dt>
                  <dd className="text-xl font-extrabold text-ink-800">
                    {data.overview.categories.total}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Featured</dt>
                  <dd className="text-xl font-extrabold text-ink-800">
                    {data.overview.products.featured}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Hot sale</dt>
                  <dd className="text-xl font-extrabold text-ink-800">
                    {data.overview.products.hot}
                  </dd>
                </div>
              </dl>
              <Link
                to="/portal/admin/catalog"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline"
              >
                Open variant studio <Icon name="arrow-right-linear" className="h-4 w-4" />
              </Link>
            </Panel>
            <Panel title="Subscriptions this month">
              <p className="text-3xl font-extrabold tabular-nums text-ink-800">
                {mwk(data.monthly_income.subscription_payments_mwk)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.monthly_income.subscription_transaction_count} shop subscription payments
              </p>
            </Panel>
            <Panel title="Newest shops" bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {data.recent.shops.map((shop) => (
                  <li
                    key={shop.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 md:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-800">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {relativeTime(shop.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={shop.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}
