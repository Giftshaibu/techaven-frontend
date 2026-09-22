/** Standard Techaven API JSON envelope */
export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  error?: string;
};

export type TechavenUser = {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  avatar: string | null;
  is_verified: boolean;
  role: string;
  shop_id: number | null;
  points: number;
  member_since: string;
  created_at: string;
};

export type AuthPayload = {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  user: TechavenUser;
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
};

export type ApiProduct = {
  id: number;
  name: string;
  slug?: string;
  price: number;
  original_price?: number | null;
  discount?: number | null;
  image_url?: string | null;
  images_urls?: string[] | null;
  description?: string | null;
  stock?: number;
  rating?: number;
  total_reviews?: number;
  category_id?: number;
  shop_id?: number;
  vendor?: string;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_hot_sale?: boolean;
  is_special_offer?: boolean;
  points?: number;
  variants?: unknown[];
  [key: string]: unknown;
};

export type ApiCategory = {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  slug?: string;
};

export type ApiShop = {
  id: number;
  name: string;
  logo?: string | null;
  location?: string | null;
  is_verified?: boolean;
  followers_count?: number;
  total_products?: number;
  joined_date?: string;
  rating?: number;
  total_reviews?: number;
  points_mwk_per_point?: number | null;
  is_following?: boolean;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type ShippingAddress = {
  id: number;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  region?: string | null;
  is_default: boolean;
};

export type CartItem = {
  id: string;
  product_id: number;
  quantity: number;
  /** Full product when API embeds it */
  product?: ApiProduct;
  /** Flat cart line fields (backend default — same as mobile app) */
  product_name?: string;
  product_image?: string;
  unit_price?: number;
  stock?: number;
  is_available?: boolean;
};

export type ApiOrder = {
  id: number | string;
  order_number?: string;
  reference?: string;
  status: string;
  payment_status?: string;
  subtotal?: number;
  shipping_fee?: number;
  total?: number;
  items?: {
    product_id?: number;
    product_name?: string;
    quantity?: number;
    unit_price?: number;
    [key: string]: unknown;
  }[];
  recipient?: string;
  phone?: string;
  city?: string;
  paid_at?: string | null;
  escrow_status?: string | null;
  courier_tracking_number?: string | null;
  delivery_confirmed_at?: string | null;
  delivery_confirmation_proof_url?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

export type WishlistItem = {
  id: number;
  product_id: number;
  product?: ApiProduct;
};

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  time_ago?: string;
  created_at: string;
};

export type PointBalance = {
  shop_id: number;
  shop_name: string;
  points: number;
  points_mwk_per_point: number | null;
  redeemable_mwk_estimate: number;
};

export type PlatformSettings = {
  seller_commission_percent: number;
  default_points_mwk_per_point: number | null;
};
