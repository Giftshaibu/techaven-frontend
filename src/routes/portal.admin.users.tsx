import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/Icon";
import {
  buttonClass,
  EmptyState,
  ErrorBlock,
  errorMessage,
  Field,
  FilterChips,
  inputClass,
  LoadingBlock,
  PageHeader,
  Panel,
  shortDate,
  StatusPill,
} from "@/components/portal/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/integrations/techaven/staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/admin/users")({ component: AdminUsers });

type Role = "" | "customer" | "seller" | "delivery_agent" | "admin";
const ROLE_LABEL: Record<string, string> = {
  customer: "Shopper",
  seller: "Seller",
  delivery_agent: "Rider",
  admin: "Admin",
};

function AdminUsers() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role>("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const users = useQuery({
    queryKey: ["portal", "admin", "users", role, term, page],
    queryFn: () => adminApi.users({ role: role || undefined, search: term || undefined, page }),
    placeholderData: keepPreviousData,
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.setUserActive(id, active),
    onSuccess: (_data, { active }) => {
      toast.success(active ? "Account reactivated" : "Account deactivated");
      void queryClient.invalidateQueries({ queryKey: ["portal", "admin", "users"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const pagination = users.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="People"
        description="Shoppers, sellers, riders and admins. Create staff accounts and manage access."
        actions={
          <button type="button" className={buttonClass.primary} onClick={() => setCreating(true)}>
            <Icon name="user-plus-linear" className="h-4 w-4" />
            Add account
          </button>
        }
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
          options={[
            { value: "", label: "Everyone" },
            { value: "customer", label: "Shoppers" },
            { value: "seller", label: "Sellers" },
            { value: "delivery_agent", label: "Riders" },
            { value: "admin", label: "Admins" },
          ]}
        />
        <div className="relative md:w-72">
          <Icon
            name="magnifier-linear"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email or phone"
            className={cn(inputClass, "pl-9")}
          />
        </div>
      </div>

      <Panel bodyClassName="p-0">
        {users.isLoading ? (
          <div className="p-5">
            <LoadingBlock />
          </div>
        ) : users.error ? (
          <div className="p-5">
            <ErrorBlock error={users.error} onRetry={() => users.refetch()} />
          </div>
        ) : !users.data?.users.length ? (
          <EmptyState icon="users-group-rounded-linear" title="Nobody matches">
            Try another role or search term.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {users.data.users.map((user) => (
              <li
                key={user.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3 md:px-5",
                  !user.is_active && "bg-stage/60",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {user.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[user.email, user.phone_number].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="brand">{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                  {user.shop ? <StatusPill tone="muted">{user.shop.name}</StatusPill> : null}
                  {!user.is_active ? (
                    <StatusPill status="inactive" />
                  ) : !user.is_verified ? (
                    <StatusPill status="unverified" />
                  ) : null}
                  <span className="hidden text-xs text-muted-foreground lg:inline">
                    Joined {shortDate(user.createdAt ?? user.created_at)}
                  </span>
                  <button
                    type="button"
                    className={buttonClass.ghost}
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate({ id: user.id, active: !user.is_active })}
                  >
                    {user.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pagination && pagination.total_pages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {pagination.current_page} of {pagination.total_pages} · {pagination.total_items}{" "}
              people
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className={buttonClass.secondary}
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className={buttonClass.secondary}
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </Panel>
      <CreateUserDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const shops = useQuery({
    queryKey: ["portal", "admin", "shops"],
    queryFn: adminApi.shops,
    enabled: open,
  });
  const empty = {
    name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "delivery_agent",
    shop_id: "",
  };
  const [form, setForm] = useState(empty);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const create = useMutation({
    mutationFn: () =>
      adminApi.createUser({
        ...form,
        shop_id: form.role === "seller" && form.shop_id ? Number(form.shop_id) : undefined,
        is_verified: true,
      }),
    onSuccess: () => {
      toast.success("Account created");
      setForm(empty);
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["portal", "admin", "users"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an account</DialogTitle>
          <DialogDescription>
            Staff accounts are verified immediately and can sign in at /portal.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Field label="Full name">
              <input required value={form.name} onChange={set("name")} className={inputClass} />
            </Field>
          </div>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone_number}
              onChange={set("phone_number")}
              placeholder="+265…"
              className={inputClass}
            />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={set("role")} className={inputClass}>
              <option value="delivery_agent">Rider (delivery agent)</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
              <option value="customer">Shopper</option>
            </select>
          </Field>
          <Field label="Temporary password" hint="At least 6 characters">
            <input
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={set("password")}
              className={inputClass}
            />
          </Field>
          {form.role === "seller" ? (
            <div className="sm:col-span-2">
              <Field label="Shop">
                <select value={form.shop_id} onChange={set("shop_id")} className={inputClass}>
                  <option value="">No shop yet</option>
                  {shops.data?.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              className={buttonClass.secondary}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className={buttonClass.primary}>
              {create.isPending ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
