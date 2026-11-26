// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeliveryConfirmation } from "./DeliveryConfirmation";

const mock = vi.hoisted(() => ({ upload: vi.fn(), submit: vi.fn() }));
vi.mock("@/lib/manual-payments", () => ({
  uploadDeliveryProof: mock.upload,
  DELIVERY_PROOF_TYPES: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
}));
vi.mock("@/integrations/techaven/customer", () => ({ submitDeliveryProof: mock.submit }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
async function mount(order: Record<string, unknown>) {
  const host = document.createElement("div");
  document.body.append(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root = createRoot(host);
    root.render(
      <QueryClientProvider client={client}>
        <DeliveryConfirmation order={{ id: 7, status: "pending", ...order }} />
      </QueryClientProvider>,
    );
  });
  return host;
}
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.clearAllMocks();
});

const shipped = { payment_status: "paid", escrow_status: "held", status: "shipped", dispatched_at: "2026-11-26T08:00:00Z", courier_service: "CTS" };

describe("buyer delivery confirmation", () => {
  it("stays hidden until the order is paid, then waits for the shop", async () => {
    expect((await mount({ payment_status: "unpaid" })).textContent).toBe("");
    await act(async () => root?.unmount());
    const host = await mount({ payment_status: "paid", escrow_status: "held", fulfilment_type: "pickup" });
    expect(host.textContent).toContain("preparing your order for collection");
    expect(host.querySelector('input[type="file"]')).toBeNull();
  });

  it("uploads the proof with progress, then submits its key for review", async () => {
    let finish: (value: { key: string }) => void = () => {};
    mock.upload.mockImplementation((_file: File, onProgress: (n: number) => void) => {
      onProgress(55);
      return new Promise((resolve) => (finish = resolve));
    });
    mock.submit.mockResolvedValue({});
    const host = await mount(shipped);
    expect(host.textContent).toContain("on its way with CTS");
    const submit = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("Confirm I received it"))!;
    expect(submit.disabled).toBe(true);

    const picker = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(picker, "files", { value: [new File(["x"], "parcel.jpg", { type: "image/jpeg" })] });
    await act(async () => picker.dispatchEvent(new Event("change", { bubbles: true })));
    expect(host.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("55");

    await act(async () => finish({ key: "delivery-proofs/u1/a.jpg" }));
    expect(host.textContent).toContain("parcel.jpg");
    expect(submit.disabled).toBe(false);
    await act(async () => {
      submit.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mock.submit).toHaveBeenCalledWith("7", "delivery-proofs/u1/a.jpg");
  });

  it("shows review, rejection and completion states", async () => {
    let host = await mount({ ...shipped, status: "delivered", delivery_proof_status: "pending_review" });
    expect(host.textContent).toContain("checking your proof");
    expect(host.querySelector('input[type="file"]')).toBeNull();
    await act(async () => root?.unmount());

    host = await mount({ ...shipped, delivery_proof_status: "rejected", delivery_proof_rejection_reason: "Photo is blurry" });
    expect(host.textContent).toContain("Photo is blurry");
    expect(host.querySelector('input[type="file"]')).not.toBeNull();
    await act(async () => root?.unmount());

    host = await mount({ ...shipped, status: "delivered", delivery_proof_status: "approved", escrow_status: "released" });
    expect(host.textContent).toContain("Delivery confirmed");
  });
});
