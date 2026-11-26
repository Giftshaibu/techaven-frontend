/**
 * Staff (admin / seller / delivery agent) API client.
 *
 * The v2 cookie session is customer-only, so staff portals sign in through the legacy
 * `/api/auth/login` endpoint, which returns a bearer token. The token is kept in
 * sessionStorage (or localStorage when "keep me signed in" is chosen), separate from the
 * customer session, so a shopper and a staff member never share credentials.
 */
import { uploadFile, UploadError, type UploadProgress } from "@/lib/upload";

import { getTechavenApiBaseUrl } from "./env";

export type StaffRole = "admin" | "seller" | "delivery_agent";

export type StaffUser = {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  role: StaffRole | string;
  shop_id: number | null;
  is_verified?: boolean;
};

export type StaffSession = { token: string; user: StaffUser };

const KEY = "techaven.staff.session";
const listeners = new Set<() => void>();
let cached: StaffSession | null | undefined;

function stores(): Storage[] {
  if (typeof window === "undefined") return [];
  const result: Storage[] = [];
  try {
    result.push(window.sessionStorage);
  } catch {
    /* unavailable */
  }
  try {
    result.push(window.localStorage);
  } catch {
    /* unavailable */
  }
  return result;
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  if (cached !== undefined) return cached;
  cached = null;
  for (const store of stores()) {
    try {
      const raw = store.getItem(KEY);
      if (raw) {
        cached = JSON.parse(raw) as StaffSession;
        break;
      }
    } catch {
      /* ignore corrupt values */
    }
  }
  return cached;
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeStaffSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setStaffSession(session: StaffSession, remember: boolean) {
  clearStaffSession(false);
  const [sessionStore, localStore] = [stores()[0], stores()[1]];
  try {
    (remember ? localStore : sessionStore)?.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage full or blocked */
  }
  cached = session;
  emit();
}

export function clearStaffSession(notify = true) {
  for (const store of stores()) {
    try {
      store.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  cached = null;
  if (notify) emit();
}

export class StaffApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "StaffApiError";
  }
}

type Options = { method?: string; body?: unknown; auth?: boolean; formData?: FormData };

export async function staffRequest<T>(
  path: string,
  { method = "GET", body, auth = true, formData }: Options = {},
): Promise<T> {
  const headers = new Headers();
  if (body !== undefined && !formData) headers.set("Content-Type", "application/json");
  if (auth) {
    const session = getStaffSession();
    if (!session) throw new StaffApiError("Sign in to continue", 401);
    headers.set("Authorization", `Bearer ${session.token}`);
  }
  const response = await fetch(`${getTechavenApiBaseUrl()}${path}`, {
    method,
    headers,
    body: formData ?? (body === undefined ? null : JSON.stringify(body)),
  });
  const parsed = (response.headers.get("content-type") ?? "").includes("application/json")
    ? ((await response.json()) as { success?: boolean; message?: string; data?: unknown })
    : null;
  if (!response.ok || parsed?.success === false) {
    if (auth && response.status === 401) clearStaffSession();
    throw new StaffApiError(
      parsed?.message || `Request failed (${response.status})`,
      response.status,
    );
  }
  return (parsed && "data" in parsed ? parsed.data : parsed) as T;
}

async function staffBlob(path: string): Promise<Blob> {
  const session = getStaffSession();
  if (!session) throw new StaffApiError("Sign in to continue", 401);
  const response = await fetch(`${getTechavenApiBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!response.ok) {
    if (response.status === 401) clearStaffSession();
    throw new StaffApiError(`Receipt could not be loaded (${response.status})`, response.status);
  }
  return response.blob();
}

export const ROLE_HOME: Record<StaffRole, string> = {
  admin: "/portal/admin",
  seller: "/portal/seller",
  delivery_agent: "/portal/delivery",
};

export async function staffLogin(
  email: string,
  password: string,
  remember: boolean,
): Promise<StaffSession> {
  const data = await staffRequest<{ access_token: string; user: StaffUser }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  if (!(data.user.role in ROLE_HOME)) {
    throw new StaffApiError(
      "This account is a shopper account. Use the storefront sign-in instead.",
      403,
    );
  }
  const session = { token: data.access_token, user: data.user };
  setStaffSession(session, remember);
  return session;
}

/**
 * Uploads a JPEG/PNG/GIF/WebP image (admin & seller only) to Cloudflare R2 and returns
 * its public URL, which callers save in their payloads. Reports progress (0–100).
 */
export async function uploadStaffImage(file: File, onProgress?: UploadProgress): Promise<string> {
  const session = getStaffSession();
  if (!session) throw new StaffApiError("Sign in to continue", 401);
  try {
    const data = await uploadFile<{ url: string; key: string }>("/api/uploads/image", file, {
      token: session.token,
      onProgress,
    });
    return data.url;
  } catch (error) {
    if (error instanceof UploadError) {
      if (error.status === 401) clearStaffSession();
      throw new StaffApiError(error.message, error.status);
    }
    throw error;
  }
}

/* ───────────────────────── Shared shapes ───────────────────────── */

export type Money = number | string | null | undefined;

export type Shop = {
  id: number;
  name: string;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  logo?: string | null;
  status: string;
  application_status: string;
  is_verified: boolean;
  total_products?: number;
  total_sales?: number;
  createdAt?: string;
  owners?: { id: number; name: string; email: string | null }[];
};

/** Fields an admin sets on a shop. Empty strings clear optional fields. */
export type ShopInput = {
  shop_name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  logo_url?: string;
  status?: "active" | "inactive";
  is_verified?: boolean;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  shop_id: number | null;
  createdAt?: string;
  created_at?: string;
  shop?: { id: number; name: string } | null;
};

export type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: Money;
  escrow_status?: string | null;
  delivery_method?: string | null;
  shipping_address?: string | null;
  shipping_phone?: string | null;
  createdAt?: string;
  created_at?: string;
  seller_accepted_at?: string | null;
  delivery_agent_name?: string | null;
  escrow_amount?: Money;
  /** "delivery" (courier / rider) or "pickup" (collect at the shop). */
  fulfilment_type?: "delivery" | "pickup" | string;
  courier_service?: string | null;
  courier_tracking_number?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  delivery_proof_status?: "pending_review" | "approved" | "rejected" | null;
  delivery_proof_submitted_at?: string | null;
  delivery_proof_rejection_reason?: string | null;
  funds_released_at?: string | null;
  user?: { id: number; name: string; email?: string | null } | null;
  buyer?: { id: number; name: string; email?: string | null } | null;
  items?: {
    id?: number;
    product_name?: string;
    quantity?: number;
    price?: Money;
    subtotal?: Money;
  }[];
};

export type ReportGranularity = "day" | "week" | "month";
export type AdminReport = {
  range: { from: string; to: string; granularity: ReportGranularity; timezone: string; generated_at: string };
  basis: Record<string, string>;
  summary: {
    orders: number;
    items_sold: number;
    gross_sales: number;
    commission: number;
    seller_share: number;
    subscription_income: number;
    platform_revenue: number;
    average_order: number;
    buyers: number;
    selling_shops: number;
  };
  series: { bucket: string; orders: number; items: number; gross: number; commission: number; subscriptions: number }[];
  shops: { shop_id: number | null; shop: string; orders: number; items: number; gross: number; commission: number; seller_share: number; released: number; held: number }[];
  products: { product: string; shop: string; quantity: number; revenue: number; orders: number }[];
  escrow: {
    held_now: number;
    held_orders_now: number;
    awaiting_approval_now: number;
    released: number;
    released_orders: number;
    refunded: number;
    rows: {
      id: number; order_number: string; shop: string; buyer: string | null; total_amount: number; escrow_amount: number;
      commission: number; escrow_status: string; status: string; delivery_proof_status: string | null;
      paid_at: string | null; funds_released_at: string | null;
    }[];
  };
  payouts: { total: number; count: number; rows: PayoutRow[] };
  payout_requests: {
    count: number;
    by_status: Record<string, number>;
    pending_now: { amount: number; count: number };
    rows: (PayoutRow & { status: string })[];
  };
  subscriptions: {
    income: number;
    payments: number;
    active_now: number;
    past_due_now: number;
    ended: number;
    by_package: { package: string; count: number; amount: number }[];
    rows: {
      id: number; shop: string | null; package: string | null; billing_period: string | null; amount: number;
      status: string; payment_reference: string | null; current_period_start: string | null; current_period_end: string | null;
    }[];
  };
  truncated: boolean;
};
export type SellerReport = {
  range: AdminReport["range"];
  basis: Record<string, string>;
  summary: {
    orders: number;
    items_sold: number;
    products_sold: number;
    gross_sales: number;
    commission: number;
    net_earnings: number;
    average_order: number;
    buyers: number;
    released: number;
    released_orders: number;
    cancelled: number;
    cancelled_value: number;
    unpaid: number;
    unpaid_value: number;
    best_weekday: string | null;
    best_period: { bucket: string; gross: number } | null;
  };
  now: {
    in_escrow: number;
    to_send: number;
    awaiting_buyer: number;
    awaiting_approval: number;
    approval_amount: number;
    wallet_balance: number;
    pending_withdrawals: { amount: number; count: number };
  };
  series: { bucket: string; orders: number; items: number; gross: number; net: number; commission: number }[];
  products: { product: string; quantity: number; revenue: number; orders: number; last_sold: string | null }[];
  orders: {
    id: number; order_number: string; buyer: string | null; placed_at: string; paid_at: string | null; items: number;
    total_amount: number; commission: number; net: number; status: string; payment_status: string; escrow_status: string;
    fulfilment_type: string | null; courier_service: string | null; dispatched_at: string | null;
    delivery_proof_status: string | null; funds_released_at: string | null;
  }[];
  fulfilment: {
    sent: number;
    average_hours_to_send: number | null;
    sent_within_a_day: number | null;
    by_type: { type: string; orders: number; gross: number }[];
    couriers: { courier: string; orders: number }[];
    by_weekday: { day: string; orders: number; gross: number }[];
  };
  withdrawals: {
    by_status: Record<string, number>;
    completed_total: number;
    rows: { id: number; amount: number; status: string; method: string; account_name: string | null; account_number: string | null; admin_notes: string | null; requested_at: string; processed_at: string | null }[];
  };
  plan: { package: string | null; price: number; billing_period: string | null; status: string; current_period_end: string | null } | null;
  truncated: boolean;
};

export type PayoutRow = {
  id: number; amount: number; currency: string; method: string; account_name: string | null; account_number: string | null;
  admin_notes: string | null; processed_at: string | null; requested_at: string; seller: string | null; shop: string;
};

export type DeliveryReview = Order & {
  shop_name?: string | null;
  has_proof_file: boolean;
  /** Legacy proof link from the mobile app, when no file was uploaded here. */
  delivery_confirmation_proof_url?: string | null;
  createdAt?: string;
  user?: { id: number; name: string; phone_number?: string | null } | null;
};

export type Withdrawal = {
  id: number;
  amount: Money;
  currency?: string;
  status: string;
  withdrawal_method: string;
  account_number?: string | null;
  account_name?: string | null;
  admin_notes?: string | null;
  createdAt?: string;
  created_at?: string;
  user?: { id: number; name: string; email?: string | null } | null;
};

export type Courier = {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
};
export type CourierInput = Omit<Courier, "id">;

export type PaymentProofStatus ="pending_review" | "approved" | "rejected";
export type PaymentProof = {
  id: string;
  order_ids: number[];
  order_references: string[];
  amount: string;
  currency: string;
  payer_name: string;
  payer_bank?: string | null;
  declared_amount?: string | null;
  payment_reference: string | null;
  payment_date: string;
  status: PaymentProofStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: number;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  actor?: { id: number; name: string; role: string } | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  created_at?: string;
};

export type Brand = { id: number; name: string; slug: string; is_active: boolean };
export type CatalogDevice = {
  id: number;
  name: string;
  slug: string;
  brand_id: number;
  category_id: number;
  soc?: string | null;
  os_family?: string | null;
  release_date?: string | null;
  verification_status: string;
  is_active: boolean;
  primary_image_url?: string | null;
  brand?: Brand | null;
  category?: { id: number; name: string } | null;
};
export type Variant = {
  id: number;
  device_id: number;
  ram_gb: number | string | null;
  storage_gb: number | null;
  network_generation: string | null;
  region: string | null;
  sim_type: string | null;
  model_number: string | null;
  verification_status: string;
  is_active: boolean;
  canonical_key: string;
};
export type VariantColor = {
  id: number;
  manufacturer_name: string;
  slug: string;
  hex: string | null;
  color: { id: number; name: string } | null;
};
export type ColorFamily = { id: number; name: string; slug: string; default_hex: string | null };
export type PublicVariant = {
  id: number;
  ram_gb: number | null;
  storage_gb: number | null;
  network_generation: string | null;
  region: string | null;
  sim_type: string | null;
  model_number: string | null;
  colors: VariantColor[];
};
export type PublicDevice = {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  primary_image_url: string | null;
  media?: { id: number; url: string }[];
  variants: PublicVariant[];
};

export type Listing = {
  id: number;
  shop_id: number;
  device_variant_id: number;
  device_variant_color_id: number | null;
  merchant_sku: string | null;
  condition: "new" | "used" | "refurbished" | "open_box";
  currency: string;
  price: Money;
  quantity: number;
  warranty_months: number | null;
  status: "draft" | "active" | "paused" | "archived";
  createdAt?: string;
  images?: { id: number; url: string; is_primary: boolean }[];
  variant?: (Variant & { device?: CatalogDevice & { brand?: Brand } }) | null;
  variant_color?: { id: number; manufacturer_name: string; hex_override: string | null } | null;
};

export type DeliveryJob = {
  job_id: number;
  order_id: number;
  order_number?: string;
  shop_name: string | null;
  pickup_address: string;
  dropoff_address: string;
  parcel_summary: string | null;
  delivery_fee?: number;
  status: string;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
};

/* ───────────────────────── Admin ───────────────────────── */

const q = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
};

export const adminApi = {
  dashboard: () => staffRequest<AdminDashboard>("/api/admin/dashboard"),
  shops: () => staffRequest<Shop[]>("/api/admin/shops"),
  createShop: (body: ShopInput) => staffRequest<Shop>("/api/admin/shops", { method: "POST", body }),
  /** Refused (409) when the shop has sellers, listings, orders or subscriptions; suspend those instead. */
  deleteShop: (id: number) => staffRequest(`/api/admin/shops/${id}`, { method: "DELETE" }),
  approveShop: (id: number) =>
    staffRequest(`/api/admin/shops/${id}/approve`, { method: "POST", body: {} }),
  rejectShop: (id: number, reason: string) =>
    staffRequest(`/api/admin/shops/${id}/reject`, { method: "POST", body: { reason } }),
  updateShop: (id: number, body: Record<string, unknown>) =>
    staffRequest(`/api/admin/shops/${id}`, { method: "PATCH", body }),
  users: (params: { role?: string | undefined; search?: string | undefined; page?: number }) =>
    staffRequest<{
      users: AdminUser[];
      pagination?: { total_items: number; total_pages: number; current_page: number };
    }>(`/api/admin/users${q({ ...params, limit: 25 })}`),
  createUser: (body: Record<string, unknown>) =>
    staffRequest<AdminUser>("/api/admin/users", { method: "POST", body }),
  setUserActive: (id: number, active: boolean) =>
    staffRequest(`/api/admin/users/${id}/${active ? "activate" : "deactivate"}`, {
      method: "PATCH",
      body: {},
    }),
  orders: () => staffRequest<Order[]>("/api/admin/orders"),
  /** Sales, escrow, payouts, payout requests and subscription income for a Malawi-time date range. */
  report: (params: { from: string; to: string; granularity: ReportGranularity }) =>
    staffRequest<AdminReport>(`/api/admin/reports${q(params)}`),
  deliveryProofs: (status: "pending_review" | "approved" | "rejected", page = 1) =>
    staffRequest<{ orders: DeliveryReview[]; total: number; page: number }>(
      `/api/admin/delivery-proofs${q({ status, page })}`,
    ),
  /** Approving releases the order's escrow to the seller's wallet. */
  approveDelivery: (id: number) =>
    staffRequest<Order>(`/api/admin/orders/${id}/delivery/approve`, { method: "POST", body: {} }),
  rejectDelivery: (id: number, reason: string) =>
    staffRequest<Order>(`/api/admin/orders/${id}/delivery/reject`, {
      method: "POST",
      body: { reason },
    }),
  deliveryProofFile: (id: number) => staffBlob(`/api/orders/${id}/delivery/proof`),
  updateOrderStatus: (id: number, status: string) =>
    staffRequest(`/api/admin/orders/${id}/status`, { method: "PATCH", body: { status } }),
  withdrawals: () => staffRequest<{ withdrawals: Withdrawal[] }>("/api/admin/withdrawals"),
  processWithdrawal: (id: number, status: "completed" | "rejected", admin_notes: string) =>
    staffRequest(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      body: { status, admin_notes },
    }),
  paymentProofs: (status: PaymentProofStatus, page: number) =>
    staffRequest<{ submissions: PaymentProof[]; total: number; page: number }>(
      `/api/admin/payment-submissions${q({ status, page })}`,
    ),
  reviewPaymentProof: (id: string, decision: "approve" | "reject", reason = "") =>
    staffRequest<PaymentProof>(`/api/admin/payment-submissions/${id}/${decision}`, {
      method: "POST",
      body: { reason },
    }),
  /** Receipts are private, so they are fetched with the staff token rather than linked. */
  paymentReceipt: (id: string) => staffBlob(`/api/payment-submissions/${id}/receipt`),
  auditLogs: () => staffRequest<AuditLog[]>("/api/admin/audit-logs"),
  settings: () =>
    staffRequest<{
      seller_commission_percent: number;
      default_points_mwk_per_point: number | null;
      updated_at?: string;
    }>("/api/admin/platform-settings"),
  updateSettings: (body: Record<string, unknown>) =>
    staffRequest("/api/admin/platform-settings", { method: "PATCH", body }),
  couriers: () => staffRequest<Courier[]>("/api/admin/courier-services"),
  createCourier: (body: CourierInput) =>
    staffRequest<Courier>("/api/admin/courier-services", { method: "POST", body }),
  updateCourier: (id: number, body: Partial<CourierInput>) =>
    staffRequest<Courier>(`/api/admin/courier-services/${id}`, { method: "PATCH", body }),
  deleteCourier: (id: number) =>
    staffRequest(`/api/admin/courier-services/${id}`, { method: "DELETE" }),
  categories: () =>
    staffRequest<{ id: number; name: string; status: string; shop_id: number | null }[]>(
      "/api/admin/categories",
    ),
  brands: () => staffRequest<Brand[]>("/api/v2/admin/catalog/brands"),
  createBrand: (name: string) =>
    staffRequest<Brand>("/api/v2/admin/catalog/brands", { method: "POST", body: { name } }),
  /** One page of devices (sorted by name), optionally filtered by a search over name and brand. */
  devicesPage: (params: { page: number; limit?: number; search?: string; brand_id?: number }) =>
    staffRequest<{
      devices: CatalogDevice[];
      pagination: { page: number; limit: number; total: number; total_pages: number; has_more: boolean };
    }>(
      `/api/v2/admin/catalog/devices${q({
        page: params.page,
        limit: params.limit ?? 50,
        search: params.search || undefined,
        brand_id: params.brand_id,
      })}`,
    ),
  createDevice: (body: Record<string, unknown>) =>
    staffRequest<CatalogDevice>("/api/v2/admin/catalog/devices", { method: "POST", body }),
  variants: (deviceId: number) =>
    staffRequest<Variant[]>(`/api/v2/admin/catalog/variants${q({ device_id: deviceId })}`),
  createVariant: (body: Record<string, unknown>) =>
    staffRequest<Variant>("/api/v2/admin/catalog/variants", { method: "POST", body }),
  updateVariant: (id: number, body: Record<string, unknown>) =>
    staffRequest<Variant>(`/api/v2/admin/catalog/variants/${id}`, { method: "PATCH", body }),
  colors: () => staffRequest<ColorFamily[]>("/api/v2/admin/catalog/colors"),
  assignColor: (variantId: number, body: Record<string, unknown>) =>
    staffRequest(`/api/v2/admin/catalog/variants/${variantId}/colors`, { method: "POST", body }),
  removeColor: (variantId: number, assignmentId: number) =>
    staffRequest(`/api/v2/admin/catalog/variants/${variantId}/colors/${assignmentId}`, {
      method: "DELETE",
    }),
};

export type Period = { revenue_mwk: number; order_count: number; label?: string };
export type AdminDashboard = {
  overview: {
    shops: {
      total: number;
      active: number;
      inactive: number;
      verified: number;
      unverified: number;
    };
    products: { total: number; featured: number; hot: number; special: number };
    categories: { total: number };
    users: {
      total: number;
      admins: number;
      sellers: number;
      customers: number;
      verified: number;
      unverified: number;
    };
    invitations?: { pending: number; accepted: number };
    sales: { total: number; paid_orders_revenue_mwk: number; paid_orders_count: number };
  };
  sales_analytics: {
    periods: {
      week_to_date: Period;
      month_to_date: Period;
      year_to_date: Period;
      all_time: Period;
    };
    by_shop: {
      all_time: { shop_id: number; shop_name: string; revenue_mwk: number; order_count: number }[];
    };
  };
  monthly_income: { subscription_payments_mwk: number; subscription_transaction_count: number };
  recent: {
    activities: {
      id: number;
      action: string;
      target_type: string | null;
      actor: { name: string; role: string } | null;
      created_at: string;
    }[];
    shops: { id: number; name: string; status: string; is_verified: boolean; createdAt: string }[];
  };
};

/* ───────────────────────── Public catalogue (used by sellers & admins) ───────────────────────── */

export const catalogApi = {
  searchDevices: (search: string) =>
    staffRequest<{ devices: PublicDevice[] }>(
      `/api/v2/catalog/devices${q({ search, limit: 24 })}`,
      { auth: false },
    ),
  device: (id: number) =>
    staffRequest<PublicDevice>(`/api/v2/catalog/devices/${id}`, { auth: false }),
};

/* ───────────────────────── Seller ───────────────────────── */

export type SellerDashboard = {
  shop: Shop;
  overview: {
    products: { total: number; low_stock: number };
    notifications: { total: number; unread: number };
    sales: { total: number };
    balance: { available_balance: number; pending_escrow: number; can_withdraw: boolean };
  };
};

export type SellerEarnings = {
  available_balance: number;
  pending_escrow: number;
  total_released: number;
  currency: string;
  can_withdraw: boolean;
  orders_in_escrow?: {
    order_id: number;
    order_number: string;
    escrow_amount: number;
    order_status: string;
    paid_at: string;
  }[];
};

export type ProductRequest = {
  id: number;
  brand: string;
  model: string;
  model_number: string | null;
  ram_gb: number | null;
  storage_gb: number | null;
  network_generation: string | null;
  notes: string | null;
  status: string;
  createdAt?: string;
};

export const sellerApi = {
  status: () =>
    staffRequest<{ onboarding_status: string; shop: Shop | null }>("/api/sellers/status"),
  dashboard: () => staffRequest<SellerDashboard>("/api/sellers/dashboard"),
  orders: () => staffRequest<Order[]>("/api/sellers/orders"),
  /** Marks a paid order as sent (delivery) or handed over at the shop (pickup). */
  dispatchOrder: (id: number, tracking_number?: string) =>
    staffRequest<Order>(`/api/sellers/orders/${id}/dispatch`, {
      method: "POST",
      body: tracking_number ? { tracking_number } : {},
    }),
  rejectOrder: (id: number, reason: string) =>
    staffRequest(`/api/sellers/orders/${id}/reject`, { method: "POST", body: { reason } }),
  earnings: () => staffRequest<SellerEarnings>("/api/sellers/earnings"),
  /** The signed-in seller's own sales report for a Malawi-time date range. */
  report: (params: { from: string; to: string; granularity: ReportGranularity }) =>
    staffRequest<SellerReport>(`/api/sellers/reports${q(params)}`),
  withdrawals: () => staffRequest<{ withdrawals: Withdrawal[] }>("/api/sellers/withdrawals"),
  withdraw: (body: Record<string, unknown>) =>
    staffRequest("/api/sellers/withdraw", { method: "POST", body }),
  listings: (shopId: number) => staffRequest<Listing[]>(`/api/v2/sellers/${shopId}/listings`),
  createListing: (shopId: number, body: Record<string, unknown>) =>
    staffRequest<Listing>(`/api/v2/sellers/${shopId}/listings`, { method: "POST", body }),
  updateListing: (shopId: number, id: number, body: Record<string, unknown>) =>
    staffRequest<Listing>(`/api/v2/sellers/${shopId}/listings/${id}`, { method: "PATCH", body }),
  archiveListing: (shopId: number, id: number) =>
    staffRequest(`/api/v2/sellers/${shopId}/listings/${id}`, { method: "DELETE" }),
  productRequests: () => staffRequest<ProductRequest[]>("/api/v2/catalog/product-requests"),
  createProductRequest: (body: Record<string, unknown>) =>
    staffRequest<ProductRequest>("/api/v2/catalog/product-requests", { method: "POST", body }),
  deleteProductRequest: (id: number) =>
    staffRequest(`/api/v2/catalog/product-requests/${id}`, { method: "DELETE" }),
  updateShop: (shopId: number, body: Record<string, unknown>) =>
    staffRequest<Shop>(`/api/sellers/${shopId}/shop`, { method: "PATCH", body }),
};

/* ───────────────────────── Subscriptions (seller plans, paid with Airtel Money) ───────────────────────── */

export type SubscriptionPackage = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_mwk: number;
  currency: string;
  billing_period: "monthly" | "quarterly" | "yearly" | "custom";
  duration_days: number;
  trial_days: number;
  features: string[];
  limits: Record<string, number | null>;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type ShopSubscription = {
  id: number;
  shop_id: number;
  shop_name: string | null;
  shop: { id: number; name: string } | null;
  seller: { id: number; name: string; email: string | null; phone_number: string | null } | null;
  package_id: number;
  package: SubscriptionPackage | null;
  status: "pending_payment" | "trialing" | "active" | "past_due" | "canceled" | "expired" | string;
  effective_status: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  subscribed: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  auto_renew: boolean;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
};

export type AirtelPayState = "not_started" | "pending" | "paid" | "failed" | "error";
export type AirtelPayResult = {
  state: AirtelPayState;
  airtel_status?: string | null;
  transaction_id?: string;
  subscription: ShopSubscription;
};

export const subscriptionApi = {
  packages: () =>
    staffRequest<{ packages: SubscriptionPackage[] }>("/api/subscription-packages", {
      auth: false,
    }),
  current: (shopId: number) =>
    staffRequest<{
      subscription: ShopSubscription | null;
      recent_subscriptions: ShopSubscription[];
    }>(`/api/sellers/${shopId}/subscription`),
  subscribe: (shopId: number, packageId: number, replaceExisting: boolean) =>
    staffRequest<{ subscription: ShopSubscription }>(
      `/api/sellers/${shopId}/subscription/subscribe`,
      {
        method: "POST",
        body: { package_id: packageId, replace_existing: replaceExisting, auto_renew: true },
      },
    ),
  payWithAirtel: (shopId: number, subscriptionId: number, msisdn: string) =>
    staffRequest<AirtelPayResult>(`/api/sellers/${shopId}/subscription/pay/airtel`, {
      method: "POST",
      body: { subscription_id: subscriptionId, msisdn },
    }),
  airtelStatus: (shopId: number, subscriptionId: number) =>
    staffRequest<AirtelPayResult>(
      `/api/sellers/${shopId}/subscription/pay/airtel/status?subscription_id=${subscriptionId}`,
    ),
  cancel: (shopId: number, immediately = false) =>
    staffRequest<{ subscription: ShopSubscription }>(`/api/sellers/${shopId}/subscription/cancel`, {
      method: "POST",
      body: { immediately },
    }),
  resume: (shopId: number) =>
    staffRequest<{ subscription: ShopSubscription }>(`/api/sellers/${shopId}/subscription/resume`, {
      method: "POST",
      body: {},
    }),
};

export const adminSubscriptionApi = {
  packages: () =>
    staffRequest<{ packages: SubscriptionPackage[] }>("/api/admin/subscription-packages"),
  createPackage: (body: Record<string, unknown>) =>
    staffRequest<SubscriptionPackage>("/api/admin/subscription-packages", { method: "POST", body }),
  updatePackage: (id: number, body: Record<string, unknown>) =>
    staffRequest<SubscriptionPackage>(`/api/admin/subscription-packages/${id}`, {
      method: "PATCH",
      body,
    }),
  subscriptions: (params: { status?: string | undefined; payment_status?: string | undefined }) =>
    staffRequest<{ subscriptions: ShopSubscription[] }>(
      `/api/admin/shop-subscriptions${q({ ...params, limit: 100 })}`,
    ),
  updateSubscription: (id: number, body: Record<string, unknown>) =>
    staffRequest<ShopSubscription>(`/api/admin/shop-subscriptions/${id}`, {
      method: "PATCH",
      body,
    }),
};

/* ───────────────────────── Delivery agent ───────────────────────── */

export type AgentProfile = {
  id: number;
  user: { id: number; name: string; email: string | null; phone_number: string | null };
  vehicle_type: string | null;
  operating_zone: string | null;
  is_available: boolean;
  decline_count: number;
};

export const deliveryApi = {
  profile: () => staffRequest<AgentProfile>("/api/delivery-agents/profile"),
  register: (body: { vehicle_type: string; operating_zone: string }) =>
    staffRequest("/api/delivery-agents/register", { method: "POST", body }),
  setAvailability: (is_available: boolean) =>
    staffRequest<{ is_available: boolean }>("/api/delivery-agents/availability", {
      method: "PATCH",
      body: { is_available },
    }),
  jobs: () => staffRequest<{ jobs: DeliveryJob[] }>("/api/delivery-agents/jobs"),
  available: () => staffRequest<{ jobs: DeliveryJob[] }>("/api/delivery-agents/jobs/available"),
  accept: (id: number) =>
    staffRequest(`/api/delivery-agents/jobs/${id}/accept`, { method: "POST", body: {} }),
  decline: (id: number) =>
    staffRequest(`/api/delivery-agents/jobs/${id}/decline`, { method: "POST", body: {} }),
  pickup: (id: number) =>
    staffRequest(`/api/delivery-agents/jobs/${id}/pickup`, { method: "POST", body: {} }),
  deliver: (id: number) =>
    staffRequest(`/api/delivery-agents/jobs/${id}/deliver`, { method: "POST", body: {} }),
};
