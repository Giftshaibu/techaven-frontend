import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  relativeTime,
  StatTile,
  StatusPill,
  toNumber,
  useStaffSession,
} from "@/components/portal/kit";
import { sellerApi, subscriptionApi } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/seller/")({ component: SellerToday });

function SellerToday() {
  const session = useStaffSession();
  const shopId = session?.user.shop_id ?? 0;
  const dashboard = useQuery({
    queryKey: ["portal", "seller", "dashboard"],
    queryFn: sellerApi.dashboard,
  });
  const listings = useQuery({
    queryKey: ["portal", "seller", "listings", shopId],
    queryFn: () => sellerApi.listings(shopId),
    enabled: !!shopId,
  });
  const orders = useQuery({ queryKey: ["portal", "seller", "orders"], queryFn: sellerApi.orders });
  const subscription = useQuery({
    queryKey: ["portal", "seller", "subscription", shopId],
    queryFn: () => subscriptionApi.current(shopId),
    enabled: !!shopId,
  });

  const shop = dashboard.data?.shop;
  const balance = dashboard.data?.overview.balance;
  const all = listings.data ?? [];
  const live = all.filter((listing) => listing.status === "active");
  const lowStock = live.filter((listing) => listing.quantity <= 2);
  const stockValue = live.reduce(
    (sum, listing) => sum + toNumber(listing.price) * listing.quantity,
    0,
  );
  const awaiting = (orders.data ?? []).filter(
    (order) => !order.seller_accepted_at && order.status !== "cancelled",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={shop?.name ?? "Your shop"}
        title="Today in your shop"
        description="Orders to accept, stock to top up and money on its way to you."
        actions={
          <Link to="/portal/seller/listings" search={{ new: true }} className={buttonClass.primary}>
            <Icon name="add-circle-linear" className="h-4 w-4" />
            List a device
          </Link>
        }
      />

      {dashboard.error ? (
        <ErrorBlock error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : null}

      {subscription.isSuccess && !subscription.data.subscription?.subscribed ? (
        <Link
          to="/portal/seller/plan"
          className="group flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50/70 p-4 transition hover:shadow-md"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700">
            <Icon name="card-linear" className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-800">
              {subscription.data.subscription?.status === "pending_payment"
                ? "Finish paying for your plan"
                : "Your shop needs an active plan"}
            </p>
            <p className="text-xs text-muted-foreground">Pay in seconds with Airtel Money</p>
          </div>
          <Icon
            name="alt-arrow-right-linear"
            className="h-5 w-5 text-red-700 transition group-hover:translate-x-1"
          />
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          accent
          label="Available to withdraw"
          icon="wallet-money-linear"
          value={mwk(balance?.available_balance, { compact: true })}
          hint={balance?.can_withdraw ? "Ready for payout" : "Released after delivery"}
        />
        <StatTile
          label="In escrow"
          icon="shield-check-linear"
          value={mwk(balance?.pending_escrow, { compact: true })}
          hint="Held until buyers confirm"
        />
        <StatTile
          label="Live listings"
          icon="tag-price-linear"
          value={live.length}
          hint={`${all.length} total · ${mwk(stockValue, { compact: true })} stock`}
        />
        <StatTile
          label="To accept"
          icon="bell-linear"
          value={awaiting.length}
          hint={awaiting.length ? "Buyers are waiting" : "You're all caught up"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Orders waiting for you"
          actions={
            <Link
              to="/portal/seller/orders"
              className="text-xs font-semibold text-brand-500 hover:underline"
            >
              All orders
            </Link>
          }
          bodyClassName="p-0"
        >
          {orders.isLoading ? (
            <div className="p-5">
              <LoadingBlock rows={2} label="Loading orders" />
            </div>
          ) : awaiting.length === 0 ? (
            <EmptyState icon="bag-check-linear" title="No orders to accept">
              New orders will appear here. Accepted orders are handed to a rider.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {awaiting.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <Icon name="bag-4-linear" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-800">{order.order_number}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.buyer?.name ?? "Buyer"} · {relativeTime(order.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{mwk(order.total_amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Running low"
          description="Live listings with 2 or fewer units"
          bodyClassName="p-0"
        >
          {listings.isLoading ? (
            <div className="p-5">
              <LoadingBlock rows={2} label="Loading listings" />
            </div>
          ) : lowStock.length === 0 ? (
            <EmptyState
              icon="box-linear"
              title={live.length ? "Stock looks healthy" : "Nothing listed yet"}
              action={
                live.length ? undefined : (
                  <Link
                    to="/portal/seller/listings"
                    search={{ new: true }}
                    className={buttonClass.primary}
                  >
                    Create your first listing
                  </Link>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((listing) => (
                <li key={listing.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {listing.variant?.device?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{mwk(listing.price)}</p>
                  </div>
                  <StatusPill tone={listing.quantity === 0 ? "bad" : "warn"}>
                    {listing.quantity} left
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {shop ? (
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-xl font-extrabold text-brand-700">
              {shop.logo ? (
                <img src={shop.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                shop.name[0]
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-base font-bold text-ink-800">
                {shop.name}
                {shop.is_verified ? (
                  <Icon name="verified-check-bold" className="h-4 w-4 text-brand-500" />
                ) : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {[shop.location, shop.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Link to="/portal/seller/shop" className={buttonClass.secondary}>
              Edit shop profile
            </Link>
          </div>
        </Panel>
      ) : dashboard.isLoading ? (
        <LoadingBlock rows={1} label="Loading your shop" />
      ) : null}
    </div>
  );
}
