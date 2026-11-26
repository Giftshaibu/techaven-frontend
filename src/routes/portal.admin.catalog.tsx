import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  CenteredLoader,
  EmptyState,
  ErrorBlock,
  errorMessage,
  Field,
  inputClass,
  PageHeader,
  Panel,
  StatusPill,
  storage,
} from "@/components/portal/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminApi,
  catalogApi,
  type CatalogDevice,
  type Variant,
  type VariantColor,
} from "@/integrations/techaven/staff";
import { LoaderMark } from "@/components/TechavenLoader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/catalog")({ component: VariantStudio });

const ram = (value: Variant["ram_gb"]) => (value == null ? null : Number(value));

/** Debounces a fast-changing value (the search box) so the API is asked once typing pauses. */
function useDebounced<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const PAGE_SIZE = 50;

function VariantStudio() {
  const [search, setSearch] = useState("");
  const term = useDebounced(search.trim());
  // The catalogue has tens of thousands of devices: the server searches and pages them
  // (50 at a time) instead of the browser downloading the whole table.
  const devices = useInfiniteQuery({
    queryKey: ["portal", "admin", "devices", term],
    queryFn: ({ pageParam }) => adminApi.devicesPage({ page: pageParam, limit: PAGE_SIZE, search: term }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const [selected, setSelected] = useState<CatalogDevice | null>(null);
  const [newDevice, setNewDevice] = useState(false);
  const list = useMemo(() => devices.data?.pages.flatMap((page) => page.devices) ?? [], [devices.data]);
  const total = devices.data?.pages[0]?.pagination.total ?? 0;
  const searching = devices.isFetching && !devices.isFetchingNextPage;

  useEffect(() => {
    if (!selected && list.length) setSelected(list[0]!);
  }, [selected, list]);

  // Load the next page when the end of the list scrolls into view.
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !devices.hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !devices.isFetchingNextPage) void devices.fetchNextPage();
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [devices, list.length]);

  const groups = useMemo(() => {
    const map = new Map<string, CatalogDevice[]>();
    for (const device of list) {
      const key = device.brand?.name ?? "Other";
      map.set(key, [...(map.get(key) ?? []), device]);
    }
    return [...map.entries()];
  }, [list]);

  const catalogueEmpty = !term && devices.isSuccess && total === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Variant studio"
        description="Every device is sold as variants — a RAM × storage configuration in specific manufacturer colours. Sellers can only list variants that exist here."
        actions={
          <button type="button" className={buttonClass.primary} onClick={() => setNewDevice(true)}>
            <Icon name="add-circle-linear" className="h-4 w-4" />
            New device
          </button>
        }
      />

      {devices.isLoading ? (
        <CenteredLoader label="Loading catalogue" />
      ) : devices.error && !devices.data ? (
        <ErrorBlock error={devices.error} onRetry={() => devices.refetch()} />
      ) : catalogueEmpty ? (
        <Panel>
          <EmptyState
            icon="layers-linear"
            title="The catalogue is empty"
            action={
              <button
                type="button"
                className={buttonClass.primary}
                onClick={() => setNewDevice(true)}
              >
                Add the first device
              </button>
            }
          >
            Run <code className="rounded bg-stage px-1">npm run seed:variants:apply</code> on the
            API server to load verified manufacturer variants, or add a device by hand.
          </EmptyState>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Panel bodyClassName="p-0" className="lg:sticky lg:top-6 lg:self-start">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Icon
                  name="magnifier-linear"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={term ? "Search devices" : `Search ${total.toLocaleString("en-GB")} devices`}
                  aria-label="Search devices by name or brand"
                  className={cn(inputClass, "pl-9 pr-9")}
                />
                {searching ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoaderMark size="xs" />
                  </span>
                ) : null}
              </div>
              <p className="mt-2 px-1 text-[11px] text-muted-foreground" aria-live="polite">
                {term
                  ? `${total.toLocaleString("en-GB")} match${total === 1 ? "" : "es"} for “${term}”`
                  : `Showing ${list.length.toLocaleString("en-GB")} of ${total.toLocaleString("en-GB")}, A–Z`}
              </p>
            </div>
            <div
              className={cn(
                "max-h-[32vh] overflow-y-auto p-2 transition-opacity lg:max-h-[68vh]",
                searching && "opacity-60",
              )}
            >
              {!list.length ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No devices match “{term}”. Try a brand or model, e.g. “samsung a55”.
                </p>
              ) : null}
              {groups.map(([brand, items], index) => (
                <div key={`${brand}-${index}`} className="mb-2">
                  <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {brand}
                  </p>
                  {items.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => setSelected(device)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                        device.id === selected?.id
                          ? "bg-brand-100 font-semibold text-brand-800"
                          : "text-ink-800 hover:bg-stage",
                        !device.is_active && "opacity-50",
                      )}
                    >
                      <span className="truncate">{device.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {device.category?.name}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              {devices.hasNextPage ? (
                <div ref={sentinel} className="px-2 py-2">
                  <button
                    type="button"
                    className={cn(buttonClass.secondary, "w-full")}
                    disabled={devices.isFetchingNextPage}
                    onClick={() => void devices.fetchNextPage()}
                  >
                    {devices.isFetchingNextPage ? (
                      <>
                        <LoaderMark size="xs" />
                        Loading more…
                      </>
                    ) : (
                      "Load more devices"
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </Panel>
          {selected ? <DeviceWorkbench key={selected.id} device={selected} /> : null}
        </div>
      )}

      <NewDeviceDialog
        open={newDevice}
        onOpenChange={setNewDevice}
        onCreated={(device) => {
          setSelected(device);
          setSearch(device.name);
        }}
      />
    </div>
  );
}

function DeviceWorkbench({ device }: { device: CatalogDevice }) {
  const queryClient = useQueryClient();
  const variants = useQuery({
    queryKey: ["portal", "admin", "variants", device.id],
    queryFn: () => adminApi.variants(device.id),
  });
  const publicDevice = useQuery({
    queryKey: ["portal", "catalog", "device", device.id],
    queryFn: () => catalogApi.device(device.id),
    retry: false,
  });
  const [variantId, setVariantId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ ram_gb: string; storage_gb: string } | null>(null);

  const colorsByVariant = useMemo(
    () =>
      new Map((publicDevice.data?.variants ?? []).map((variant) => [variant.id, variant.colors])),
    [publicDevice.data],
  );
  const list = variants.data ?? [];
  const rams = [...new Set(list.map((variant) => ram(variant.ram_gb)))].sort(
    (a, b) => (a ?? 0) - (b ?? 0),
  );
  const storages = [...new Set(list.map((variant) => variant.storage_gb))].sort(
    (a, b) => (a ?? 0) - (b ?? 0),
  );
  const network = list.find((variant) => variant.network_generation)?.network_generation ?? "";
  const selected = list.find((variant) => variant.id === variantId) ?? null;
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["portal", "admin", "variants", device.id] }),
      queryClient.invalidateQueries({ queryKey: ["portal", "catalog", "device", device.id] }),
    ]);

  const image = device.primary_image_url ?? publicDevice.data?.media?.[0]?.url;

  return (
    <div className="min-w-0 space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-stage">
            {image ? (
              <img src={image} alt="" className="h-full w-full object-contain p-1.5" />
            ) : (
              <Icon
                name={device.category?.name === "Laptops" ? "laptop-linear" : "smartphone-linear"}
                className="h-9 w-9 text-muted-foreground"
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-brand-500">
              {device.brand?.name} · {device.category?.name}
            </p>
            <h2 className="text-xl font-extrabold tracking-tight text-ink-800">{device.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                device.soc,
                device.os_family,
                device.release_date && `Released ${device.release_date}`,
              ]
                .filter(Boolean)
                .join(" · ") || "No spec summary"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={device.verification_status} />
            <span className="text-xs text-muted-foreground">{list.length} variants</span>
          </div>
        </div>
      </Panel>

      <Panel
        title="Configuration matrix"
        description="Rows are memory, columns are storage. Click a variant to edit it, or a + cell to create that configuration."
        actions={
          <button
            type="button"
            className={buttonClass.secondary}
            onClick={() => setDraft({ ram_gb: "", storage_gb: "" })}
          >
            <Icon name="add-circle-linear" className="h-4 w-4" />
            Custom variant
          </button>
        }
      >
        {variants.isLoading ? (
          <CenteredLoader size="sm" label="Loading variants" />
        ) : variants.error ? (
          <ErrorBlock error={variants.error} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="widget-add-linear"
            title="No variants yet"
            action={
              <button
                type="button"
                className={buttonClass.primary}
                onClick={() => setDraft({ ram_gb: "", storage_gb: "" })}
              >
                Create the first variant
              </button>
            }
          >
            Add each RAM and storage combination the manufacturer sells.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-2 text-sm">
              <thead>
                <tr>
                  <th className="w-20 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    RAM ╲ Storage
                  </th>
                  {storages.map((size) => (
                    <th key={String(size)} className="text-center text-xs font-bold text-ink-800">
                      {storage(size)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rams.map((memory) => (
                  <tr key={String(memory)}>
                    <th className="text-left text-xs font-bold text-ink-800">
                      {memory == null ? "—" : `${memory} GB`}
                    </th>
                    {storages.map((size) => {
                      const cell = list.filter(
                        (variant) => ram(variant.ram_gb) === memory && variant.storage_gb === size,
                      );
                      if (!cell.length) {
                        return (
                          <td key={String(size)}>
                            <button
                              type="button"
                              onClick={() =>
                                setDraft({
                                  ram_gb: memory == null ? "" : String(memory),
                                  storage_gb: size == null ? "" : String(size),
                                })
                              }
                              className="grid h-[76px] w-full min-w-[120px] place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-brand-300 hover:text-brand-500"
                              aria-label={`Create ${memory ?? "?"} GB / ${storage(size)} variant`}
                            >
                              <Icon name="add-circle-linear" className="h-5 w-5" />
                            </button>
                          </td>
                        );
                      }
                      return (
                        <td key={String(size)} className="align-top">
                          <div className="space-y-1.5">
                            {cell.map((variant) => (
                              <VariantCell
                                key={variant.id}
                                variant={variant}
                                colors={colorsByVariant.get(variant.id) ?? []}
                                selected={variant.id === variantId}
                                onSelect={() =>
                                  setVariantId(variant.id === variantId ? null : variant.id)
                                }
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected ? (
        <VariantEditor
          key={selected.id}
          variant={selected}
          colors={colorsByVariant.get(selected.id) ?? []}
          onChanged={refresh}
          onClose={() => setVariantId(null)}
        />
      ) : null}

      <NewVariantDialog
        device={device}
        draft={draft}
        defaultNetwork={network}
        onClose={() => setDraft(null)}
        onCreated={async (variant) => {
          await refresh();
          setVariantId(variant.id);
        }}
      />
    </div>
  );
}

function VariantCell({
  variant,
  colors,
  selected,
  onSelect,
}: {
  variant: Variant;
  colors: VariantColor[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "block h-[76px] w-full min-w-[120px] rounded-xl border p-2.5 text-left transition",
        selected
          ? "border-brand-500 bg-brand-100/60 ring-2 ring-brand-500/20"
          : "border-border bg-surface hover:border-brand-300",
        !variant.is_active && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-bold text-ink-800">
          {variant.network_generation ?? "Wi-Fi"}
          {variant.region && variant.region !== "global" ? ` · ${variant.region}` : ""}
        </span>
        {variant.verification_status === "verified" ? (
          <Icon name="verified-check-bold" className="h-4 w-4 text-brand-500" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-amber-400" title="Unverified" />
        )}
      </div>
      <div className="mt-2 flex -space-x-1">
        {colors.slice(0, 6).map((color) => (
          <span
            key={color.id}
            title={color.manufacturer_name}
            className="h-5 w-5 rounded-full ring-2 ring-surface"
            style={{ background: color.hex ?? "#ccc" }}
          />
        ))}
        {colors.length > 6 ? (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-stage text-[9px] font-bold ring-2 ring-surface">
            +{colors.length - 6}
          </span>
        ) : null}
        {!colors.length ? (
          <span className="text-[11px] text-muted-foreground">
            {variant.is_active ? "No colours" : "Inactive"}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function VariantEditor({
  variant,
  colors,
  onChanged,
  onClose,
}: {
  variant: Variant;
  colors: VariantColor[];
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const families = useQuery({ queryKey: ["portal", "admin", "colors"], queryFn: adminApi.colors });
  const [colorForm, setColorForm] = useState({
    color_id: "",
    manufacturer_name: "",
    hex: "#404DFE",
  });
  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminApi.updateVariant(variant.id, body),
    onSuccess: async () => {
      toast.success("Variant updated");
      await onChanged();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const addColor = useMutation({
    mutationFn: () =>
      adminApi.assignColor(variant.id, {
        color_id: Number(colorForm.color_id),
        manufacturer_name: colorForm.manufacturer_name.trim() || undefined,
        hex_override: colorForm.hex,
        verified: true,
      }),
    onSuccess: async () => {
      toast.success("Colour added");
      setColorForm({ color_id: "", manufacturer_name: "", hex: "#404DFE" });
      await onChanged();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const removeColor = useMutation({
    mutationFn: (assignmentId: number) => adminApi.removeColor(variant.id, assignmentId),
    onSuccess: async () => {
      toast.success("Colour removed");
      await onChanged();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function submitColor(event: FormEvent) {
    event.preventDefault();
    if (colorForm.color_id) addColor.mutate();
  }

  return (
    <Panel
      title={`${ram(variant.ram_gb) ?? "?"} GB RAM · ${storage(variant.storage_gb)}${variant.network_generation ? ` · ${variant.network_generation}` : ""}`}
      description={variant.canonical_key}
      actions={
        <button
          type="button"
          onClick={onClose}
          className={buttonClass.ghost}
          aria-label="Close editor"
        >
          <Icon name="close-circle-linear" className="h-4 w-4" />
          Close
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass.secondary}
              disabled={update.isPending}
              onClick={() => update.mutate({ is_active: !variant.is_active })}
            >
              <Icon
                name={variant.is_active ? "pause-circle-linear" : "play-circle-linear"}
                className="h-4 w-4"
              />
              {variant.is_active ? "Deactivate" : "Activate"}
            </button>
            <button
              type="button"
              className={buttonClass.secondary}
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  verification_status:
                    variant.verification_status === "verified" ? "unverified" : "verified",
                })
              }
            >
              <Icon name="verified-check-linear" className="h-4 w-4" />
              {variant.verification_status === "verified" ? "Mark unverified" : "Mark verified"}
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-stage p-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-0.5">
                <StatusPill status={variant.is_active ? "active" : "inactive"} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Verification</dt>
              <dd className="mt-0.5">
                <StatusPill status={variant.verification_status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">SIM</dt>
              <dd className="font-semibold text-ink-800">{variant.sim_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Region</dt>
              <dd className="font-semibold capitalize text-ink-800">{variant.region ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Model number</dt>
              <dd className="font-semibold text-ink-800">{variant.model_number ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Manufacturer colours
          </p>
          {!variant.is_active ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Activate this variant to see and edit its colours.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {colors.map((color) => (
                <li
                  key={color.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-1.5 text-xs font-semibold text-ink-800"
                >
                  <span
                    className="h-6 w-6 rounded-full ring-1 ring-black/10"
                    style={{ background: color.hex ?? "#ccc" }}
                  />
                  {color.manufacturer_name}
                  <button
                    type="button"
                    aria-label={`Remove ${color.manufacturer_name}`}
                    disabled={removeColor.isPending}
                    onClick={() => removeColor.mutate(color.id)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-danger-soft hover:text-rose-700"
                  >
                    <Icon name="close-circle-linear" className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {!colors.length ? (
                <li className="text-sm text-muted-foreground">No colours yet.</li>
              ) : null}
            </ul>
          )}
          <form onSubmit={submitColor} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
            <select
              required
              value={colorForm.color_id}
              className={inputClass}
              aria-label="Colour family"
              onChange={(event) => {
                const family = families.data?.find(
                  (item) => String(item.id) === event.target.value,
                );
                setColorForm((form) => ({
                  ...form,
                  color_id: event.target.value,
                  hex: family?.default_hex ?? form.hex,
                }));
              }}
            >
              <option value="">Colour family…</option>
              {families.data?.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
            <input
              value={colorForm.manufacturer_name}
              onChange={(event) =>
                setColorForm((form) => ({ ...form, manufacturer_name: event.target.value }))
              }
              placeholder="Marketing name, e.g. Cosmic Orange"
              className={inputClass}
              aria-label="Manufacturer colour name"
            />
            <input
              type="color"
              value={colorForm.hex}
              onChange={(event) => setColorForm((form) => ({ ...form, hex: event.target.value }))}
              className="h-[42px] w-12 cursor-pointer rounded-xl border border-border bg-surface p-1"
              aria-label="Swatch colour"
            />
            <button
              type="submit"
              disabled={addColor.isPending || !variant.is_active}
              className={buttonClass.primary}
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </Panel>
  );
}

function NewVariantDialog({
  device,
  draft,
  defaultNetwork,
  onClose,
  onCreated,
}: {
  device: CatalogDevice;
  draft: { ram_gb: string; storage_gb: string } | null;
  defaultNetwork: string;
  onClose: () => void;
  onCreated: (variant: Variant) => Promise<void>;
}) {
  const [form, setForm] = useState({
    ram_gb: "",
    storage_gb: "",
    network_generation: "",
    region: "global",
    sim_type: "",
    model_number: "",
  });
  useEffect(() => {
    if (draft)
      setForm({
        ram_gb: draft.ram_gb,
        storage_gb: draft.storage_gb,
        network_generation: defaultNetwork,
        region: "global",
        sim_type: "",
        model_number: "",
      });
  }, [draft, defaultNetwork]);
  const create = useMutation({
    mutationFn: () =>
      adminApi.createVariant({
        device_id: device.id,
        ram_gb: form.ram_gb ? Number(form.ram_gb) : null,
        storage_gb: form.storage_gb ? Number(form.storage_gb) : null,
        network_generation: form.network_generation || null,
        region: form.region || "global",
        sim_type: form.sim_type || null,
        model_number: form.model_number || null,
        verification_status: "unverified",
      }),
    onSuccess: async (variant) => {
      toast.success("Variant created");
      onClose();
      await onCreated(variant);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New variant · {device.name}</DialogTitle>
          <DialogDescription>
            New variants start unverified until you confirm them against the manufacturer.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="RAM (GB)">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={form.ram_gb}
              onChange={set("ram_gb")}
              className={inputClass}
            />
          </Field>
          <Field label="Storage (GB)" hint="1 TB = 1024">
            <input
              type="number"
              min="1"
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
              <option value="">None (Wi-Fi only)</option>
              <option>5G</option>
              <option>4G</option>
              <option>3G</option>
            </select>
          </Field>
          <Field label="Region">
            <input value={form.region} onChange={set("region")} className={inputClass} />
          </Field>
          <Field label="SIM">
            <input
              value={form.sim_type}
              onChange={set("sim_type")}
              placeholder="Nano-SIM + eSIM"
              className={inputClass}
            />
          </Field>
          <Field label="Model number">
            <input
              value={form.model_number}
              onChange={set("model_number")}
              placeholder="Optional"
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={buttonClass.secondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className={buttonClass.primary}>
              {create.isPending ? "Creating…" : "Create variant"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewDeviceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (device: CatalogDevice) => void;
}) {
  const queryClient = useQueryClient();
  const brands = useQuery({
    queryKey: ["portal", "admin", "brands"],
    queryFn: adminApi.brands,
    enabled: open,
  });
  const categories = useQuery({
    queryKey: ["portal", "admin", "categories"],
    queryFn: adminApi.categories,
    enabled: open,
  });
  const [form, setForm] = useState({
    brand_id: "",
    new_brand: "",
    category_id: "",
    name: "",
    soc: "",
    os_family: "",
    release_date: "",
  });
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const create = useMutation({
    mutationFn: async () => {
      const brandId =
        form.brand_id === "new"
          ? (await adminApi.createBrand(form.new_brand.trim())).id
          : Number(form.brand_id);
      return adminApi.createDevice({
        brand_id: brandId,
        category_id: Number(form.category_id),
        name: form.name.trim(),
        soc: form.soc || null,
        os_family: form.os_family || null,
        release_date: form.release_date || null,
      });
    },
    onSuccess: async (device) => {
      toast.success(`${device.name} added`);
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
      onCreated(device);
      onOpenChange(false);
      setForm({
        brand_id: "",
        new_brand: "",
        category_id: "",
        name: "",
        soc: "",
        os_family: "",
        release_date: "",
      });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a device</DialogTitle>
          <DialogDescription>
            Create the model first, then add its variants in the matrix.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Brand">
            <select
              required
              value={form.brand_id}
              onChange={set("brand_id")}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {brands.data?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
              <option value="new">+ New brand</option>
            </select>
          </Field>
          {form.brand_id === "new" ? (
            <Field label="Brand name">
              <input
                required
                value={form.new_brand}
                onChange={set("new_brand")}
                className={inputClass}
              />
            </Field>
          ) : (
            <Field label="Category">
              <select
                required
                value={form.category_id}
                onChange={set("category_id")}
                className={inputClass}
              >
                <option value="">Choose…</option>
                {categories.data
                  ?.filter((category) => category.status === "approved" && category.shop_id == null)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {form.brand_id === "new" ? (
            <Field label="Category">
              <select
                required
                value={form.category_id}
                onChange={set("category_id")}
                className={inputClass}
              >
                <option value="">Choose…</option>
                {categories.data
                  ?.filter((category) => category.status === "approved" && category.shop_id == null)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </Field>
          ) : null}
          <div className="sm:col-span-2">
            <Field label="Model name">
              <input
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Galaxy S25 FE"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Chipset">
            <input value={form.soc} onChange={set("soc")} className={inputClass} />
          </Field>
          <Field label="OS family">
            <input
              value={form.os_family}
              onChange={set("os_family")}
              placeholder="Android"
              className={inputClass}
            />
          </Field>
          <Field label="Release date">
            <input
              type="date"
              value={form.release_date}
              onChange={set("release_date")}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              className={buttonClass.secondary}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className={buttonClass.primary}>
              {create.isPending ? "Saving…" : "Add device"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
