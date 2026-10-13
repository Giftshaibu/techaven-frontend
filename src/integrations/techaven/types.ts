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
  expires_in?: number;
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

export type MarketplaceOffer = {
  id: number;
  variant_id: number;
  variant_color_id: number | null;
  shop: { id: number; name: string } | null;
  condition: "new" | "used" | "refurbished" | "open_box";
  currency: string;
  price: number;
  quantity: number;
  warranty_months: number | null;
  images: { id: number; url: string; alt_text?: string | null; is_primary: boolean }[];
};

export type MarketplaceVariant = {
  id: number;
  model_number: string | null;
  ram_gb: number | null;
  storage_gb: number | null;
  network_generation: string | null;
  region: string | null;
  sim_type: string | null;
  attributes: Record<string, unknown>;
  colors: { id: number; manufacturer_name: string; slug: string; hex: string | null }[];
};

export type MarketplaceDevice = {
  id: number;
  slug: string;
  name: string;
  brand: { id: number; name: string; slug: string } | null;
  category: { id: number; name: string } | null;
  release_date: string | null;
  soc: string | null;
  battery_mah: number | null;
  os_family: string | null;
  specs: Record<string, unknown>;
  primary_image_url: string | null;
  media: { id: number; url: string; media_type: string; is_primary: boolean }[];
  variant_axes: string[];
  variants: MarketplaceVariant[];
  offers: MarketplaceOffer[];
};

export type ApiCategory = {
  brands?: { slug: string; name: string; image: string | null; product_count: number }[];
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

export type MarketplaceCartItem = {
  id: string;
  seller_listing_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_available: boolean;
  listing: {
    id: number;
    price: number | string;
    quantity: number;
    condition: MarketplaceOffer["condition"];
    currency: string;
    shop: { id: number; name: string };
    images: MarketplaceOffer["images"];
    variant: MarketplaceVariant & { device: Pick<MarketplaceDevice, "id" | "slug" | "name" | "primary_image_url"> };
  };
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
