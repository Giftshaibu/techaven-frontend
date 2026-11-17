import { techavenRequest } from "@/integrations/techaven/client";
export type ManualConfig = {
  enabled: boolean;
  destinations?: { provider: string; account_name: string; account_number: string; brand: string }[];
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
  items?: { id: number; product_name: string; product_image: string | null; quantity: number; subtotal: number }[];
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
export const submitPaymentProof = (formData: FormData) =>
  techavenRequest<PaymentSubmission>("/api/payment-submissions", {
    method: "POST",
    formData,
    auth: true,
  });
