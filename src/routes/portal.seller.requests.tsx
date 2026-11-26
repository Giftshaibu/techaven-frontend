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
  PageHeader,
  Panel,
  relativeTime,
  StatusPill,
  storage,
} from "@/components/portal/kit";
import { sellerApi } from "@/integrations/techaven/staff";

export const Route = createFileRoute("/portal/seller/requests")({ component: SellerRequests });

const empty = {
  brand: "",
  model: "",
  model_number: "",
  ram_gb: "",
  storage_gb: "",
  network_generation: "",
  notes: "",
};

function SellerRequests() {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["portal", "seller", "requests"],
    queryFn: sellerApi.productRequests,
  });
  const [form, setForm] = useState(empty);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["portal", "seller", "requests"] });
  const create = useMutation({
    mutationFn: () =>
      sellerApi.createProductRequest({
        ...form,
        ram_gb: form.ram_gb ? Number(form.ram_gb) : null,
        storage_gb: form.storage_gb ? Number(form.storage_gb) : null,
      }),
    onSuccess: () => {
      toast.success("Request sent to Techaven");
      setForm(empty);
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => sellerApi.deleteProductRequest(id),
    onSuccess: () => {
      toast.success("Request withdrawn");
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Device requests"
        description="Can't find a model or configuration in the catalogue? Ask Techaven to add it, then list it once approved."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="Request a device">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Brand">
              <input
                required
                value={form.brand}
                onChange={set("brand")}
                placeholder="Infinix"
                className={inputClass}
              />
            </Field>
            <Field label="Model">
              <input
                required
                value={form.model}
                onChange={set("model")}
                placeholder="Hot 50 Pro"
                className={inputClass}
              />
            </Field>
            <Field label="RAM (GB)">
              <input
                type="number"
                min={1}
                value={form.ram_gb}
                onChange={set("ram_gb")}
                className={inputClass}
              />
            </Field>
            <Field label="Storage (GB)">
              <input
                type="number"
                min={1}
                value={form.storage_gb}
                onChange={set("storage_gb")}
                className={inputClass}
              />
            </Field>
            <Field label="Network">
              <select
                value={form.network_generation}
                onChange={set("network_generation")}
                className={inputClass}
              >
                <option value="">Unknown</option>
                <option>5G</option>
                <option>4G</option>
              </select>
            </Field>
            <Field label="Model number">
              <input
                value={form.model_number}
                onChange={set("model_number")}
                placeholder="Optional"
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes" hint="Colours, region, a link to the manufacturer page…">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={set("notes")}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className={`${buttonClass.primary} sm:col-span-2`}
            >
              <Icon name="plain-linear" className="h-4 w-4" />
              Send request
            </button>
          </form>
        </Panel>
        <Panel title="Your requests" bodyClassName="p-0">
          {requests.isLoading ? (
            <div className="p-5">
              <LoadingBlock rows={2} label="Loading requests" />
            </div>
          ) : requests.error ? (
            <div className="p-5">
              <ErrorBlock error={requests.error} />
            </div>
          ) : !requests.data?.length ? (
            <EmptyState icon="document-add-linear" title="No requests yet">
              Requests you send appear here with their review status.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {requests.data.map((request) => (
                <li key={request.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {request.brand} {request.model}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        request.ram_gb ? `${request.ram_gb} GB RAM` : null,
                        request.storage_gb ? storage(request.storage_gb) : null,
                        request.network_generation,
                        relativeTime(request.createdAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusPill status={request.status} />
                  {request.status === "pending" ? (
                    <button
                      type="button"
                      className={buttonClass.ghost}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(request.id)}
                      aria-label="Withdraw request"
                    >
                      <Icon name="trash-bin-trash-linear" className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
