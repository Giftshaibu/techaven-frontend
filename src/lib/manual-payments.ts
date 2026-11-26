import { TechavenApiError, techavenRequest } from "@/integrations/techaven/client";
import { ensureSession, getAccessToken, refreshSession } from "@/integrations/techaven/token";
import { uploadFile, UploadError, type UploadProgress } from "@/lib/upload";
export type ManualConfig = {
  enabled: boolean;
  destinations?: {
    provider: string;
    account_name: string;
    account_number: string;
    brand: string;
  }[];
  provider?: string;
  account_name?: string;
  account_number?: string;
  whatsapp?: string;
};
export type PaymentSubmission = {
  id: string;
  amount: string;
  status: "pending_review" | "approved" | "rejected";
  rejection_reason: string | null;
  payment_reference: string;
  whatsapp_url?: string;
};
export type PaymentContext = {
  items?: {
    id: number;
    product_name: string;
    product_image: string | null;
    quantity: number;
    subtotal: number;
  }[];
  orders: {
    id: number;
    reference: string;
    total: string;
    payment_status: string;
    status: string;
  }[];
  deadline?: string | null;
  proof_url?: string | null;
  summary?: string | null;
  expired?: boolean;
  payable_order_ids: number[];
  amount: string;
  submissions: PaymentSubmission[];
};
export const getCommerceConfig = () =>
  techavenRequest<{ manual_payment: ManualConfig; maps: { key: string | null } }>(
    "/api/commerce-config",
  );
export const getPaymentContext = (id: number | string) =>
  techavenRequest<PaymentContext>(`/api/orders/${id}/payment-context`, { auth: true });
export type PaymentProofDetails = {
  submission_key: string;
  order_ids: number[];
  payer_name: string;
  payer_bank: string;
  declared_amount: string;
  payment_reference?: string;
  receipt_key: string;
};
export const submitPaymentProof = (body: PaymentProofDetails) =>
  techavenRequest<PaymentSubmission>("/api/payment-submissions", {
    method: "POST",
    body,
    auth: true,
  });

export const RECEIPT_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

export const DELIVERY_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Uploads the buyer's proof of delivery (photo or PDF) to private storage; returns its key. */
export async function uploadDeliveryProof(file: File, onProgress?: UploadProgress) {
  if (!DELIVERY_PROOF_TYPES.includes(file.type) || !file.size || file.size > RECEIPT_MAX_BYTES) {
    throw new Error("Choose a JPEG, PNG or WebP photo, or a PDF, no larger than 10 MB.");
  }
  const send = async () => {
    await ensureSession();
    const token = getAccessToken();
    if (!token) throw new TechavenApiError("Sign in required", 401);
    return uploadFile<{ key: string }>("/api/uploads/delivery-proof", file, { token, onProgress });
  };
  try {
    return await send();
  } catch (error) {
    if (error instanceof UploadError && error.status === 401 && (await refreshSession())) return send();
    throw error;
  }
}

/** Uploads a bank-transfer receipt to Cloudflare R2 (via the API) and returns its storage key and URL. */
export async function uploadPaymentProof(file: File, onProgress?: UploadProgress) {
  if (!RECEIPT_TYPES.includes(file.type) || !file.size || file.size > RECEIPT_MAX_BYTES) {
    throw new Error("Choose a JPEG, PNG or PDF receipt, no larger than 10 MB.");
  }
  const send = async () => {
    await ensureSession();
    const token = getAccessToken();
    if (!token) throw new TechavenApiError("Sign in required", 401);
    return uploadFile<{ key: string; url: string | null }>("/api/uploads/payment-proof", file, {
      token,
      onProgress,
    });
  };
  try {
    return await send();
  } catch (error) {
    if (error instanceof UploadError && error.status === 401 && (await refreshSession())) {
      return send();
    }
    throw error;
  }
}
