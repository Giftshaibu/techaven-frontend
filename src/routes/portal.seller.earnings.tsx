import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  Field,
  inputClass,
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  shortDate,
  StatTile,
  StatusPill,
} from "@/components/portal/kit";
import { sellerApi } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/seller/earnings")({ component: SellerEarnings });

const METHODS = [
  {
    value: "mobile_money",
    label: "Mobile money",
    icon: "smartphone-linear",
    account: "Airtel / TNM number",
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
    icon: "card-transfer-linear",
    account: "Account number",
  },
  {
    value: "cash_pickup",
    label: "Cash pickup",
    icon: "wallet-money-linear",
    account: "ID or phone",
  },
] as const;

function SellerEarnings() {
  const queryClient = useQueryClient();
  const earnings = useQuery({
    queryKey: ["portal", "seller", "earnings"],
    queryFn: sellerApi.earnings,
  });
  const history = useQuery({
    queryKey: ["portal", "seller", "withdrawals"],
    queryFn: sellerApi.withdrawals,
  });
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("mobile_money");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const available = earnings.data?.available_balance ?? 0;

  const withdraw = useMutation({
    mutationFn: () =>
      sellerApi.withdraw({
        amount: Number(amount),
        withdrawal_method: method,
        account_number: accountNumber,
        account_name: accountName,
      }),
    onSuccess: () => {
      toast.success("Withdrawal requested. Techaven will confirm when it's sent.");
      setAmount("");
      void queryClient.invalidateQueries({ queryKey: ["portal", "seller"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Earnings"
        description="Buyer payments are held in escrow and released to you once delivery is confirmed."
      />
      {earnings.error ? <ErrorBlock error={earnings.error} /> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          accent
          label="Available"
          icon="wallet-money-linear"
          value={mwk(available)}
          hint="Can be withdrawn now"
        />
        <StatTile
          label="In escrow"
          icon="shield-check-linear"
          value={mwk(earnings.data?.pending_escrow)}
          hint={`${earnings.data?.orders_in_escrow?.length ?? 0} orders`}
        />
        <StatTile
          label="Released to date"
          icon="graph-up-linear"
          value={mwk(earnings.data?.total_released)}
        />
      </div>

      {/* Escrow journey */}
      <Panel title="How your money moves">
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            ["bag-4-linear", "Buyer pays", "Money enters escrow"],
            ["delivery-linear", "Order delivered", "Rider drops it off"],
            ["check-circle-linear", "Buyer confirms", "Or 72 hours pass"],
            ["wallet-money-linear", "You withdraw", "Funds become available"],
          ].map(([icon, title, note], index) => (
            <li key={title} className="relative flex gap-3 rounded-xl bg-stage p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-brand-500">
                <Icon name={icon!} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-800">
                  {index + 1}. {title}
                </p>
                <p className="text-xs text-muted-foreground">{note}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="Request a withdrawal" description="Minimum MK 1,000">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              withdraw.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={method === item.value}
                  onClick={() => setMethod(item.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold ring-1 ring-inset",
                    method === item.value
                      ? "bg-brand-100 text-brand-800 ring-2 ring-brand-500"
                      : "bg-surface text-ink-800 ring-border",
                  )}
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
            <Field label="Amount (MWK)">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1000}
                  max={available || undefined}
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  className={buttonClass.secondary}
                  onClick={() => setAmount(String(available))}
                  disabled={!available}
                >
                  Max
                </button>
              </div>
            </Field>
            <Field label={METHODS.find((item) => item.value === method)!.account}>
              <input
                required
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Account holder name">
              <input
                required
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={withdraw.isPending || !earnings.data?.can_withdraw}
              className={cn(buttonClass.primary, "w-full")}
            >
              {earnings.data?.can_withdraw
                ? withdraw.isPending
                  ? "Requesting…"
                  : "Request withdrawal"
                : "No funds available yet"}
            </button>
          </form>
        </Panel>

        <Panel title="Withdrawal history" bodyClassName="p-0">
          {history.isLoading ? (
            <div className="p-5">
              <LoadingBlock rows={2} />
            </div>
          ) : !history.data?.withdrawals.length ? (
            <EmptyState icon="history-linear" title="No withdrawals yet" />
          ) : (
            <ul className="divide-y divide-border">
              {history.data.withdrawals.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold tabular-nums text-ink-800">
                      {mwk(item.amount)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.withdrawal_method.replace(/_/g, " ")} ·{" "}
                      {shortDate(item.createdAt ?? item.created_at)}
                      {item.admin_notes ? ` · ${item.admin_notes}` : ""}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {earnings.data?.orders_in_escrow?.length ? (
        <Panel title="Orders in escrow" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {earnings.data.orders_in_escrow.map((order) => (
              <li
                key={order.order_id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm md:px-5"
              >
                <span className="font-semibold text-ink-800">{order.order_number}</span>
                <StatusPill status={order.order_status} />
                <span className="font-bold tabular-nums">{mwk(order.escrow_amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
