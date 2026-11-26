import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  CenteredLoader,
  errorMessage,
  Field,
  inputClass,
  PageHeader,
  Panel,
  useStaffSession,
} from "@/components/portal/kit";
import { deliveryApi } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/delivery/profile")({ component: RiderProfile });

const VEHICLES = [
  { value: "motorcycle", label: "Motorbike", icon: "delivery-linear" },
  { value: "bicycle", label: "Bicycle", icon: "bicycling-linear" },
  { value: "car", label: "Car", icon: "wheel-linear" },
  { value: "on_foot", label: "On foot", icon: "walking-linear" },
];
const ZONES = ["Lilongwe", "Blantyre", "Mzuzu", "Zomba"];

function RiderProfile() {
  const session = useStaffSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["portal", "rider", "profile"],
    queryFn: deliveryApi.profile,
    retry: false,
  });
  const [vehicle, setVehicle] = useState("motorcycle");
  const [zone, setZone] = useState("Lilongwe");
  useEffect(() => {
    if (profile.data) {
      setVehicle(profile.data.vehicle_type ?? "motorcycle");
      setZone(profile.data.operating_zone ?? "Lilongwe");
    }
  }, [profile.data]);
  const save = useMutation({
    mutationFn: () => deliveryApi.register({ vehicle_type: vehicle, operating_zone: zone }),
    onSuccess: async () => {
      toast.success("Profile saved");
      const wasNew = profile.isError;
      await queryClient.invalidateQueries({ queryKey: ["portal", "rider"] });
      if (wasNew) void navigate({ to: "/portal/delivery" });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (profile.isLoading) return <CenteredLoader label="Loading your profile" />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        eyebrow="Rider profile"
        title={session?.user.name ?? "Your profile"}
        description={[session?.user.phone_number, session?.user.email].filter(Boolean).join(" · ")}
      />
      <Panel title="How you ride">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          className="space-y-5"
        >
          <fieldset>
            <legend className="text-xs font-semibold text-ink-800">Vehicle</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VEHICLES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={vehicle === item.value}
                  onClick={() => setVehicle(item.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl p-4 text-sm font-semibold ring-1 ring-inset",
                    vehicle === item.value
                      ? "bg-brand-100 text-brand-800 ring-2 ring-brand-500"
                      : "bg-surface text-ink-800 ring-border",
                  )}
                >
                  <Icon name={item.icon} className="h-7 w-7" />
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Operating zone">
            <input
              list="rider-zones"
              required
              value={zone}
              onChange={(event) => setZone(event.target.value)}
              className={inputClass}
            />
            <datalist id="rider-zones">
              {ZONES.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>
          <button
            type="submit"
            disabled={save.isPending}
            className={cn(buttonClass.primary, "w-full py-3")}
          >
            {save.isPending ? "Saving…" : profile.isError ? "Create rider profile" : "Save changes"}
          </button>
        </form>
      </Panel>
      {profile.data ? (
        <Panel title="Reliability">
          <p className="text-sm text-muted-foreground">
            Jobs released: <strong className="text-ink-800">{profile.data.decline_count}</strong>.
            Releasing fewer jobs helps you get offered more.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
