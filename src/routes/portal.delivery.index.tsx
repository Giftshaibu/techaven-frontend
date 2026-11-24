import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  LoadingBlock,
  mwk,
  relativeTime,
  StatusPill,
} from "@/components/portal/kit";
import { StaffApiError, deliveryApi, type DeliveryJob } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/delivery/")({ component: RiderJobs });

const ACTIVE = new Set(["accepted", "picked_up", "in_transit"]);
const mapsLink = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

function RiderJobs() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["portal", "rider", "profile"],
    queryFn: deliveryApi.profile,
    retry: false,
  });
  const jobs = useQuery({
    queryKey: ["portal", "rider", "jobs"],
    queryFn: deliveryApi.jobs,
    enabled: profile.isSuccess,
    refetchInterval: 30_000,
  });
  const online = profile.data?.is_available ?? false;
  const available = useQuery({
    queryKey: ["portal", "rider", "available"],
    queryFn: deliveryApi.available,
    enabled: profile.isSuccess && online,
    refetchInterval: 20_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "rider"] });

  const availability = useMutation({
    mutationFn: (next: boolean) => deliveryApi.setAvailability(next),
    onSuccess: (data) => {
      toast.success(data.is_available ? "You're online — jobs will appear here" : "You're offline");
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const act = useMutation({
    mutationFn: ({
      job,
      kind,
    }: {
      job: DeliveryJob;
      kind: "accept" | "decline" | "pickup" | "deliver";
    }) => deliveryApi[kind](job.job_id),
    onSuccess: (_data, { kind }) => {
      toast.success(
        {
          accept: "Job accepted — head to the pickup",
          decline: "Job released",
          pickup: "Picked up — the buyer has been told it's on the way",
          deliver: "Delivered! Nice work.",
        }[kind],
      );
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (profile.isLoading) return <LoadingBlock rows={3} />;
  if (profile.error) {
    if (profile.error instanceof StaffApiError && profile.error.status === 404) {
      return (
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Icon name="delivery-linear" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-ink-800">Set up your rider profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us your vehicle and the zone you cover, then go online to receive jobs.
          </p>
          <Link to="/portal/delivery/profile" className={cn(buttonClass.primary, "mt-5 w-full")}>
            Set up profile
          </Link>
        </div>
      );
    }
    return <ErrorBlock error={profile.error} onRetry={() => profile.refetch()} />;
  }

  const mine = jobs.data?.jobs ?? [];
  const current = mine.filter((job) => ACTIVE.has(job.status));
  const deliveredToday = mine.filter(
    (job) =>
      job.status === "delivered" &&
      job.delivered_at &&
      new Date(job.delivered_at).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Online switch hero */}
      <section
        className={cn(
          "relative overflow-hidden rounded-3xl p-5 text-white transition-colors md:p-6",
          online ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-ink-800",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
        />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
              {profile.data?.operating_zone || "Your zone"} ·{" "}
              {profile.data?.vehicle_type || "vehicle"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold">
              {online ? "You're online" : "You're offline"}
            </h1>
            <p className="text-sm text-white/75">
              {online
                ? "New jobs near you show up below."
                : "Go online to start receiving delivery jobs."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            aria-label="Online"
            disabled={availability.isPending}
            onClick={() => availability.mutate(!online)}
            className={cn(
              "relative h-14 w-24 shrink-0 rounded-full transition-colors",
              online ? "bg-white/30" : "bg-white/15",
            )}
          >
            <span
              className={cn(
                "absolute top-1.5 grid h-11 w-11 place-items-center rounded-full bg-white text-ink-800 shadow-lg transition-all",
                online ? "left-[calc(100%-50px)]" : "left-1.5",
              )}
            >
              <Icon
                name="power-linear"
                className={cn("h-5 w-5", online ? "text-emerald-600" : "text-muted-foreground")}
              />
            </span>
          </button>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ["Active", current.length],
            ["Today", deliveredToday.length],
            [
              "Earned today",
              mwk(
                deliveredToday.reduce((sum, job) => sum + (job.delivery_fee ?? 0), 0),
                { compact: true },
              ),
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-white/10 px-2 py-2.5">
              <p className="text-lg font-extrabold tabular-nums">{value}</p>
              <p className="text-[11px] text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Current jobs */}
      {current.map((job) => (
        <ActiveJob
          key={job.job_id}
          job={job}
          busy={act.isPending}
          onAct={(kind) => act.mutate({ job, kind })}
        />
      ))}

      {/* Job board */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink-800">Jobs near you</h2>
          {online ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          ) : null}
        </div>
        {!online ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface">
            <EmptyState icon="moon-sleep-linear" title="You're offline">
              Flip the switch above when you're ready to ride.
            </EmptyState>
          </div>
        ) : available.isLoading ? (
          <LoadingBlock rows={2} />
        ) : available.error ? (
          <ErrorBlock error={available.error} />
        ) : !available.data?.jobs.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface">
            <EmptyState icon="radar-2-linear" title="No jobs right now">
              We check for new jobs every 20 seconds.
            </EmptyState>
          </div>
        ) : (
          <ul className="space-y-3">
            {available.data.jobs.map((job) => (
              <li key={job.job_id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-500">
                      {job.shop_name ?? "Techaven shop"}
                    </p>
                    <p className="text-sm font-bold text-ink-800">
                      {job.parcel_summary ?? "Parcel"}
                    </p>
                  </div>
                  {job.delivery_fee ? (
                    <p className="text-lg font-extrabold tabular-nums text-emerald-700">
                      {mwk(job.delivery_fee)}
                    </p>
                  ) : null}
                </div>
                <Route2 pickup={job.pickup_address} dropoff={job.dropoff_address} />
                <button
                  type="button"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ job, kind: "accept" })}
                  className={cn(buttonClass.primary, "mt-4 w-full py-3 text-base")}
                >
                  Accept job
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Route2({ pickup, dropoff }: { pickup: string; dropoff: string }) {
  return (
    <ol className="relative mt-3 space-y-3 pl-6 text-sm">
      <span
        aria-hidden
        className="absolute bottom-3 left-[7px] top-3 w-0.5 border-l-2 border-dashed border-border"
      />
      <li className="relative">
        <span className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-4 border-brand-500 bg-surface" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Pickup
        </p>
        <p className="text-ink-800">{pickup}</p>
      </li>
      <li className="relative">
        <span className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Drop-off
        </p>
        <p className="text-ink-800">{dropoff}</p>
      </li>
    </ol>
  );
}

const STEPS = [
  { key: "accepted", label: "Accepted" },
  { key: "in_transit", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

function ActiveJob({
  job,
  busy,
  onAct,
}: {
  job: DeliveryJob;
  busy: boolean;
  onAct: (kind: "decline" | "pickup" | "deliver") => void;
}) {
  const index = job.status === "accepted" ? 0 : 1;
  const target = index === 0 ? job.pickup_address : job.dropoff_address;
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-brand-500 bg-surface shadow-xl shadow-brand-500/10">
      <div className="flex items-center justify-between bg-brand-100 px-5 py-3">
        <p className="text-sm font-extrabold text-brand-800">Current job · {job.order_number}</p>
        <StatusPill status={job.status} />
      </div>
      <div className="p-5">
        <ol className="flex items-center gap-2">
          {STEPS.map((step, position) => (
            <li key={step.key} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  position <= index ? "bg-brand-500 text-white" : "bg-stage text-muted-foreground",
                )}
              >
                {position < index ? (
                  <Icon name="check-read-linear" className="h-4 w-4" />
                ) : (
                  position + 1
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  position <= index ? "text-ink-800" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {position < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded",
                    position < index ? "bg-brand-500" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs font-semibold text-brand-500">
          {job.shop_name ?? "Techaven shop"} · accepted {relativeTime(job.accepted_at)}
        </p>
        <p className="text-sm font-bold text-ink-800">{job.parcel_summary}</p>
        <Route2 pickup={job.pickup_address} dropoff={job.dropoff_address} />
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
          <a
            href={mapsLink(target)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonClass.secondary, "py-3")}
            aria-label="Navigate"
          >
            <Icon name="map-arrow-right-linear" className="h-5 w-5" />
            Navigate
          </a>
          {index === 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAct("pickup")}
              className={cn(buttonClass.primary, "py-3 text-base")}
            >
              I've picked it up
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Confirm the parcel was handed to the buyer?")) onAct("deliver");
              }}
              className={cn(
                buttonClass.primary,
                "bg-emerald-600 py-3 text-base hover:bg-emerald-700",
              )}
            >
              Mark delivered
            </button>
          )}
        </div>
        {index === 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Release this job to another rider?")) onAct("decline");
            }}
            className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground hover:text-rose-700"
          >
            Can't do this job? Release it
          </button>
        ) : null}
      </div>
    </section>
  );
}
