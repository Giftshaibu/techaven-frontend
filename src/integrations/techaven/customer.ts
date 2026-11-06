import { techavenRequest } from "./client";
import type {
  ApiCategory,
  ApiOrder,
  ApiProduct,
  ApiShop,
  AuthPayload,
  MarketplaceCartItem,
  MarketplaceDevice,
  NotificationItem,
  PlatformSettings,
  PointBalance,
  ShippingAddress,
  TechavenUser,
  WishlistItem,
} from "./types";

// —— Onboarding ——
export function getOnboardingSlides() {
  return techavenRequest<unknown[]>("/api/onboarding/slides", { auth: false });
}

// —— Auth ——
export function registerCustomer(body: {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
}) {
  return techavenRequest<unknown>("/api/v2/auth/register", { method: "POST", body, auth: false });
}

export function login(body: { email: string; password: string }) {
  return techavenRequest<AuthPayload>("/api/v2/auth/login", { method: "POST", body, auth: false });
}

export function googleSignIn(body: { id_token: string; challenge_id: string; nonce: string }) {
  return techavenRequest<AuthPayload | { link_required: true; linking_challenge: string }>("/api/v2/auth/google", { method: "POST", body, auth: false });
}
export function googleChallenge() {
  return techavenRequest<{ challenge_id: string; nonce: string; client_id: string }>("/api/v2/auth/google/challenge", { method: 'POST', body: {} });
}
export function linkGoogle(body: { linking_challenge: string; password: string }) {
  return techavenRequest<AuthPayload>('/api/v2/auth/google/link', { method: 'POST', body });
}

export function sendLoginOtp(body: { email: string }) {
  return techavenRequest<unknown>("/api/auth/send-login-otp", { method: "POST", body, auth: false });
}

export function verifyOtp(body: {
  email: string;
  otp: string;
  type: "signup" | "login" | "password_reset";
}) {
  return techavenRequest<AuthPayload | { success: true }>("/api/v2/auth/verify-otp", {
    method: "POST",
    body,
    auth: false,
  });
}

export function resendOtp(body: { email: string; type: "signup" | "login" | "password_reset" }) {
  return techavenRequest<unknown>("/api/v2/auth/resend-otp", { method: "POST", body, auth: false });
}

export function forgotPassword(body: { email: string }) {
  return techavenRequest<unknown>("/api/v2/auth/forgot-password", { method: "POST", body, auth: false });
}

export function resetPassword(body: {
  email: string;
  otp: string;
  new_password: string;
}) {
  return techavenRequest<unknown>("/api/v2/auth/reset-password", { method: "POST", body, auth: false });
}

export function logout() {
  return techavenRequest<unknown>("/api/v2/auth/logout", { method: "POST", body: {}, auth: false });
}

// —— User ——
export function getProfile() {
  return techavenRequest<TechavenUser>("/api/v2/auth/me", { auth: true });
}

export function updateProfile(body: {
  name?: string;
  email?: string;
  phone_number?: string;
}) {
  return techavenRequest<TechavenUser>("/api/user/profile", { method: "PUT", body, auth: true });
}

export function getPointBalances() {
  return techavenRequest<{
    total_points: number;
    currency: string;
    balances: PointBalance[];
  }>("/api/user/points/balances", { auth: true });
}

export function redeemPoints(body: { shop_id: number; points: number }) {
  return techavenRequest<{
    points_redeemed: number;
    mwk_credited: number;
    wallet_balance: number;
    remaining_points: number;
  }>("/api/user/points/redeem", { method: "POST", body, auth: true });
}

export function uploadAvatar(formData: FormData) {
  return techavenRequest<{ avatar?: string }>("/api/user/avatar", {
    method: "POST",
    formData,
    auth: true,
  });
}

export function changePassword(body: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}) {
  return techavenRequest<unknown>("/api/user/password", { method: "PUT", body, auth: true });
}

export function deleteAccount(body: { password: string; reason?: string }) {
  return techavenRequest<unknown>("/api/user/account", { method: "DELETE", body, auth: true });
}

// —— Products ——
export type ProductsQuery = {
  page?: number;
  limit?: number;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
};

export function getProducts(params: ProductsQuery = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) q.set(k, String(v));
  });
  const qs = q.toString();
  return techavenRequest<{ products: ApiProduct[]; pagination: unknown }>(
    `/api/products${qs ? `?${qs}` : ""}`,
    { auth: false },
  );
}

export function getProduct(id: number | string) {
  return techavenRequest<ApiProduct>(`/api/products/${id}`, { auth: false });
}

export function getProductReviews(productId: number | string, page = 1, limit = 10) {
  return techavenRequest<unknown>(
    `/api/products/${productId}/reviews?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function addProductReview(
  productId: number | string,
  body: { rating: number; title?: string; comment?: string; images?: string[] },
) {
  return techavenRequest<unknown>(`/api/products/${productId}/reviews`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function searchProducts(q: string, params: Omit<ProductsQuery, "sort"> = {}) {
  const search = new URLSearchParams({ q });
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.category_id) search.set("category_id", String(params.category_id));
  return techavenRequest<{ products: ApiProduct[]; pagination: unknown }>(
    `/api/products/search?${search}`,
    { auth: false },
  );
}

export function getSearchSuggestions(q: string) {
  return techavenRequest<unknown>(`/api/search/suggestions?q=${encodeURIComponent(q)}`, {
    auth: false,
  });
}

// —— Subscription packages (public) ——
export function getSubscriptionPackages() {
  return techavenRequest<unknown[]>("/api/subscription-packages", { auth: false });
}

// —— Categories ——
export function getCategories() {
  return techavenRequest<ApiCategory[]>("/api/categories", { auth: false });
}

export type MarketplaceQuery = {
  page?: number;
  limit?: number;
  category_id?: number;
  brand?: string;
  search?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  shop_id?: number;
  ids?: number[];
};

export function getMarketplaceDevices(params: MarketplaceQuery = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([field, value]) => {
    if (value === undefined || value === "") return;
    query.set(field, Array.isArray(value) ? value.join(",") : String(value));
  });
  return techavenRequest<{ devices: MarketplaceDevice[]; missing_ids?: number[]; pagination: unknown }>(
    `/api/v2/marketplace/devices${query.size ? `?${query}` : ""}`,
    { auth: false },
  );
}

export function getMarketplaceDevice(idOrSlug: number | string) {
  return techavenRequest<MarketplaceDevice>(
    `/api/v2/marketplace/devices/${encodeURIComponent(String(idOrSlug))}`,
    { auth: false },
  );
}

export function getCategoryProducts(categoryId: number | string, page = 1, limit = 30) {
  return techavenRequest<{ products: ApiProduct[]; pagination: unknown }>(
    `/api/categories/${categoryId}/products?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

// —— Cart ——
export function getCart() {
  return techavenRequest<{ items?: MarketplaceCartItem[]; summary?: Record<string, unknown> }>(
    "/api/v2/cart",
    {
      auth: true,
    },
  );
}

export function addCartItem(body: { seller_listing_id: number; quantity: number }) {
  return techavenRequest<unknown>("/api/v2/cart/items", { method: "POST", body, auth: true });
}

export function updateCartItem(itemId: string, body: { quantity: number }) {
  return techavenRequest<unknown>(`/api/v2/cart/items/${itemId}`, {
    method: "PUT",
    body,
    auth: true,
  });
}

export function removeCartItem(itemId: string) {
  return techavenRequest<unknown>(`/api/v2/cart/items/${itemId}`, { method: "DELETE", auth: true });
}

export function clearCart() {
  return techavenRequest<unknown>("/api/v2/cart", { method: "DELETE", auth: true });
}

// —— Courier ——
export function getCourierServices() {
  return techavenRequest<
    { id: number; name: string; description?: string; logo_url?: string }[]
  >("/api/courier-services", { auth: false });
}

// —— Orders ——
export function createOrder(body: {
  payment_method?: string;
  shipping_address_id: number;
  courier_service_id?: number;
  items: { seller_listing_id: number; quantity: number }[];
  notes?: string;
}) {
  return techavenRequest<{ orders: ApiOrder[] }>("/api/v2/orders", { method: "POST", body, auth: true });
}

export function getOrders(params: { page?: number; limit?: number; status?: string } = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const qs = q.toString();
  return techavenRequest<{ orders?: ApiOrder[]; pagination?: unknown } | ApiOrder[]>(
    `/api/orders${qs ? `?${qs}` : ""}`,
    { auth: true },
  );
}

export function getMyPaidOrders() {
  return techavenRequest<ApiOrder[]>("/api/orders/mine/paid", { auth: true });
}

export function getOrder(orderId: number | string) {
  return techavenRequest<ApiOrder>(`/api/orders/${orderId}`, { auth: true });
}

export function payOrderAirtel(orderId: number | string, body: { msisdn: string }) {
  return techavenRequest<unknown>(`/api/orders/${orderId}/pay/airtel`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function getOrderAirtelStatus(orderId: number | string) {
  return techavenRequest<unknown>(`/api/orders/${orderId}/pay/airtel/status`, { auth: true });
}

export function payOrderPaychangu(orderId: number | string, body: { tx_ref: string }) {
  return techavenRequest<unknown>(`/api/orders/${orderId}/pay/paychangu`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function cancelOrder(orderId: number | string) {
  return techavenRequest<unknown>(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    body: {},
    auth: true,
  });
}

export function completeOrderPayment(
  orderId: number | string,
  body: { payment_reference: string; payment_proof?: string },
) {
  return techavenRequest<unknown>(`/api/orders/${orderId}/payment/complete`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function confirmOrderDelivery(
  orderId: number | string,
  body?: { file_url?: string; proof_url?: string },
) {
  return techavenRequest<unknown>(`/api/orders/${orderId}/delivery/confirm`, {
    method: "POST",
    body: body ?? {},
    auth: true,
  });
}

// —— Wishlist ——
export function getWishlist() {
  return techavenRequest<{ items: WishlistItem[]; total_items: number }>("/api/wishlist", {
    auth: true,
  });
}

export function addToWishlist(body: { product_id: number }) {
  return techavenRequest<{ wishlist_item_id: number; total_items: number }>("/api/wishlist", {
    method: "POST",
    body,
    auth: true,
  });
}

export function checkWishlistProduct(productId: number) {
  return techavenRequest<{ is_favorited: boolean; favorite_id: number | null }>(
    `/api/wishlist/${productId}`,
    { auth: true },
  );
}

export function removeFromWishlist(productId: number) {
  return techavenRequest<{ total_items: number }>(`/api/wishlist/${productId}`, {
    method: "DELETE",
    auth: true,
  });
}

// —— Addresses ——
export function getShippingAddresses() {
  return techavenRequest<ShippingAddress[]>("/api/shipping-addresses", { auth: true });
}

export function addShippingAddress(body: {
  latitude?: number | null; longitude?: number | null; location_accuracy?: number | null; delivery_notes?: string | null;
  label?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  region?: string;
  is_default?: boolean;
}) {
  return techavenRequest<ShippingAddress>("/api/shipping-addresses", {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateShippingAddress(
  id: number,
  body: Partial<{
    latitude: number | null; longitude: number | null; location_accuracy: number | null; delivery_notes: string | null;
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    is_default: boolean;
  }>,
) {
  return techavenRequest<ShippingAddress>(`/api/shipping-addresses/${id}`, {
    method: "PUT",
    body,
    auth: true,
  });
}

export function deleteShippingAddress(id: number) {
  return techavenRequest<unknown>(`/api/shipping-addresses/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function setDefaultShippingAddress(id: number) {
  return techavenRequest<unknown>(`/api/shipping-addresses/${id}/set-default`, {
    method: "POST",
    body: {},
    auth: true,
  });
}

// —— Wallet ——
export function getWalletBalance() {
  return techavenRequest<{ balance: number; currency: string }>("/api/wallet/balance", {
    auth: true,
  });
}

export function getWalletTransactions() {
  return techavenRequest<
    { id: number; type: string; amount: number; description: string; status: string; created_at: string }[]
  >("/api/wallet/transactions", { auth: true });
}

// —— Payment methods ——
export function getPaymentMethods() {
  return techavenRequest<{ available_providers?: unknown[] }>("/api/payment-methods", {
    auth: true,
  });
}

export function addPaymentMethod(body: {
  type: string;
  provider: string;
  phone_number: string;
  is_default?: boolean;
}) {
  return techavenRequest<unknown>("/api/payment-methods", { method: "POST", body, auth: true });
}

export function deletePaymentMethod(id: string) {
  return techavenRequest<unknown>(`/api/payment-methods/${id}`, { method: "DELETE", auth: true });
}

// —— Notifications ——
export function getNotifications() {
  return techavenRequest<NotificationItem[]>("/api/notifications", { auth: true });
}

export function getUnreadNotificationCount() {
  return techavenRequest<{ count: number }>("/api/notifications/unread-count", { auth: true });
}

export function markNotificationRead(id: number) {
  return techavenRequest<unknown>(`/api/notifications/${id}/read`, {
    method: "POST",
    body: {},
    auth: true,
  });
}

export function markAllNotificationsRead() {
  return techavenRequest<unknown>("/api/notifications/mark-all-read", {
    method: "POST",
    body: {},
    auth: true,
  });
}

export function deleteNotification(id: number) {
  return techavenRequest<unknown>(`/api/notifications/${id}`, { method: "DELETE", auth: true });
}

export function registerPushDevice(body: { device_token: string; platform: string }) {
  return techavenRequest<unknown>("/api/notifications/register-device", {
    method: "POST",
    body,
    auth: true,
  });
}

// —— Shops ——
async function withMarketplaceProductCount(shop: ApiShop): Promise<ApiShop> {
  try {
    const marketplace = await getMarketplaceDevices({ shop_id: shop.id, limit: 1 });
    const pagination = marketplace.pagination as { total_items?: unknown } | null;
    const count = pagination?.total_items;
    return typeof count === "number" && Number.isFinite(count) && count >= 0
      ? { ...shop, total_products: count }
      : shop;
  } catch {
    return shop;
  }
}

export async function getShops() {
  const shops = await techavenRequest<ApiShop[]>("/api/shops", { auth: false });
  return Promise.all(shops.map(withMarketplaceProductCount));
}

export async function getShop(id: number | string) {
  const shop = await techavenRequest<ApiShop>(`/api/shops/${id}`, { auth: "optional" });
  return withMarketplaceProductCount(shop);
}

export function getShopProducts(shopId: number | string, page = 1, limit = 30) {
  return techavenRequest<{ products: ApiProduct[]; pagination: unknown }>(
    `/api/shops/${shopId}/products?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function followShop(shopId: number | string) {
  return techavenRequest<{ shop_id: number; is_following: boolean; followers_count: number }>(
    `/api/shops/${shopId}/follow`,
    { method: "POST", body: {}, auth: true },
  );
}

export function unfollowShop(shopId: number | string) {
  return techavenRequest<{ is_following: boolean; followers_count: number }>(
    `/api/shops/${shopId}/follow`,
    { method: "DELETE", auth: true },
  );
}

// —— Banners ——
export function getBanners() {
  return techavenRequest<unknown[]>("/api/banners", { auth: false });
}

// —— Help ——
export function getHelpTopics() {
  return techavenRequest<unknown>("/api/help/topics", { auth: false });
}

export function getFaqs() {
  return techavenRequest<unknown>("/api/help/faqs", { auth: false });
}

export function submitSupportTicket(body: {
  subject: string;
  category: string;
  message: string;
  order_id?: string;
  attachments?: string[];
}) {
  return techavenRequest<unknown>("/api/help/tickets", { method: "POST", body, auth: true });
}

// —— App ——
export function getAppInfo() {
  return techavenRequest<unknown>("/api/app/info", { auth: false });
}

export function getPlatformSettings() {
  return techavenRequest<PlatformSettings>("/api/platform-settings", { auth: false });
}
