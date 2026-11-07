// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ShopProductPreview } from "./ShopProductPreview";
const mock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/resolve-catalog", () => ({ fetchShopProducts: mock.fetch }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
    search,
  }: {
    children: ReactNode;
    params: { slug: string };
    search: { listing: number };
  }) => <a href={`/product/${params.slug}?listing=${search.listing}`}>{children}</a>,
}));
vi.mock("./ImageStage", () => ({ ImageStage: ({ alt }: { alt: string }) => <span>{alt}</span> }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root | undefined;
let intersect: IntersectionObserverCallback;
class Observer {
  constructor(callback: IntersectionObserverCallback) {
    intersect = callback;
  }
  observe() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", Observer);
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
async function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root = createRoot(host);
    root.render(
      <QueryClientProvider client={client}>
        <ShopProductPreview shopId={2} name="Shop two" />
      </QueryClientProvider>,
    );
  });
  return host;
}
async function reveal() {
  await act(async () => {
    intersect(
      [{ isIntersecting: true }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.clearAllMocks();
});
it("waits until near the screen and uses only the requested shop offer", async () => {
  mock.fetch.mockResolvedValue({
    products: [
      {
        slug: "phone",
        name: "Phone",
        category: "smartphones",
        offers: [
          { id: 10, shop: { id: 1 }, price: 100, quantity: 1, condition: "new" },
          { id: 20, shop: { id: 2 }, price: 900, quantity: 1, condition: "new" },
        ],
        images: [],
        specs: [],
      },
    ],
  });
  const host = await mount();
  expect(mock.fetch).not.toHaveBeenCalled();
  await reveal();
  expect(mock.fetch).toHaveBeenCalledWith(2, 1, 6);
  expect(host.querySelector("a")?.href).toContain("listing=20");
  expect(host.textContent).toContain("900");
  expect(host.textContent).not.toContain("100");
});
it("shows an empty state without inventing inventory", async () => {
  mock.fetch.mockResolvedValue({ products: [] });
  const host = await mount();
  await reveal();
  expect(host.textContent).toContain("No products available yet");
});
it("keeps a recoverable error instead of a misleading empty shop", async () => {
  mock.fetch.mockRejectedValue(new Error("Offline"));
  const host = await mount();
  await reveal();
  expect(host.textContent).toContain("Products couldn’t load");
  expect(host.textContent).toContain("Try again");
});
