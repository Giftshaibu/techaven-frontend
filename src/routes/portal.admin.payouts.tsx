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
  LoadingBlock,
  mwk,
  PageHeader,
  Panel,
  shortDate,
  StatTile,
  StatusPill,
  toNumber,
} from "@/components/portal/kit";
import { ReasonDialog } from "@/components/portal/ReasonDialog";
import { adminApi, type Withdrawal } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/admin/payouts")({ component: AdminPayouts });

const METHOD: Record<string, string> = {
  mobile_money: "Mobile money",
  bank_transfer: "Bank transfer",
  cash_pickup: "Cash pickup",
};

function AdminPayouts() {
  const queryClient = useQueryClient();
  const withdrawals = useQuery({
    queryKey: ["portal", "admin", "withdrawals"],
    queryFn: adminApi.withdrawals,
  });
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  const [approving, setApproving] = useState<Withdrawal | null>(null);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["portal", "admin", "withdrawals"] });

  const list = withdrawals.data?.withdrawals ?? [];
  const pending = list.filter((item) => item.status === "pending" || item.status === "processing");
  const paid = list.filter((item) => item.status === "completed");

  const process = useMutation({
    mutationFn: ({
      item,
      status,
      note,
    }: {
      item: Withdrawal;
      status: "completed" | "rejected";
      note: string;
    }) => adminApi.processWithdrawal(item.id, status, note),
    onSuccess: (_data, { status }) => {
      toast.success(status === "completed" ? "Payout marked as sent" : "Payout rejected");
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Seller payouts"
        description="Sellers can only withdraw funds released from escrow after delivery is confirmed."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          accent
          label="Waiting"
          icon="clock-circle-linear"
          value={mwk(
            pending.reduce((sum, item) => sum + toNumber(item.amount), 0),
            { compact: true },
          )}
          hint={`${pending.length} requests`}
        />
        <StatTile
          label="Paid out"
          icon="check-circle-linear"
          value={mwk(
            paid.reduce((sum, item) => sum + toNumber(item.amount), 0),
            { compact: true },
          )}
          hint={`${paid.length} payouts`}
        />
        <StatTile label="All requests" icon="wallet-money-linear" value={list.length} />
      </div>
      <Panel title="Requests" bodyClassName="p-0">
        {withdrawals.isLoading ? (
          <div className="p-5">
            <LoadingBlock />
          </div>
        ) : withdrawals.error ? (
          <div className="p-5">
            <ErrorBlock error={withdrawals.error} />
          </div>
        ) : !list.length ? (
          <EmptyState icon="wallet-money-linear" title="No payout requests">
            When sellers request withdrawals they will queue here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-4 md:px-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-stage text-brand-500">
                  <Icon name="card-transfer-linear" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-800">
                    {mwk(item.amount)}{" "}
                    <span className="font-normal text-muted-foreground">
                      to {item.user?.name ?? "seller"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {METHOD[item.withdrawal_method] ?? item.withdrawal_method} ·{" "}
                    {item.account_name || "—"}{" "}
                    {item.account_number ? `· ${item.account_number}` : ""} ·{" "}
                    {shortDate(item.createdAt ?? item.created_at)}
                  </p>
                  {item.admin_notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">Note: {item.admin_notes}</p>
                  ) : null}
                </div>
                <StatusPill status={item.status} />
                {item.status === "pending" || item.status === "processing" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={buttonClass.primary}
                      onClick={() => setApproving(item)}
                    >
                      Mark sent
                    </button>
                    <button
                      type="button"
                      className={buttonClass.danger}
                      onClick={() => setRejecting(item)}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <ReasonDialog
        open={!!approving}
        onOpenChange={(open) => !open && setApproving(null)}
        tone="primary"
        title={`Confirm ${mwk(approving?.amount)} was sent`}
        description="Only confirm once the money has left the platform account."
        reasonLabel="Reference or note (optional)"
        confirmLabel="Confirm payout"
        onConfirm={(note) =>
          approving
            ? process.mutateAsync({ item: approving, status: "completed", note })
            : undefined
        }
      />
      <ReasonDialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Reject this payout?"
        description="The seller sees the rejection and your reason on their earnings page."
        reasonLabel="Reason"
        requireReason
        confirmLabel="Reject payout"
        onConfirm={(note) =>
          rejecting ? process.mutateAsync({ item: rejecting, status: "rejected", note }) : undefined
        }
      />
    </div>
  );
}
