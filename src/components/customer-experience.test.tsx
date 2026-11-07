// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CustomerExperience } from "./CustomerExperience";
import { PaymentMethodForm } from "./PaymentMethods";
import { guestPromptKey } from "@/lib/customer-experience";
const mock = vi.hoisted(() => ({
  user: null as null | { id: number },
  loading: false,
  path: "/",
  navigate: vi.fn(),
  setSession: vi.fn(),
  setup: vi.fn(),
  skip: vi.fn(),
  getMethods: vi.fn(),
  addMethod: vi.fn(),
  link: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: mock.user,
    loading: mock.loading,
    setSessionFromAuth: mock.setSession,
    refreshUser: vi.fn(),
  }),
}));
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: mock.path, searchStr: "?q=phone", hash: "" }),
  useNavigate: () => mock.navigate,
}));
vi.mock("@/integrations/techaven/customer", () => ({
  getCustomerSetup: mock.setup,
  skipPaymentSetup: mock.skip,
  getPaymentMethods: mock.getMethods,
  addPaymentMethod: mock.addMethod,
  deletePaymentMethod: vi.fn(),
  linkGoogle: mock.link,
}));
vi.mock("./GoogleSignIn", () => ({
  GoogleSignIn: ({
    onAuth,
    onLink,
  }: {
    onAuth: (session: unknown) => void;
    onLink: (challenge: string) => void;
  }) => (
    <div>
      <button onClick={() => onAuth({ user: { id: 1 } })}>Continue with Google</button>
      <button onClick={() => onLink("challenge")}>Link Google</button>
    </div>
  ),
}));
vi.mock("./ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root | undefined;
async function mount(element = <CustomerExperience />) {
  const host = document.createElement("main");
  document.body.append(host);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await act(async () => {
    root = createRoot(host);
    root.render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  return host;
}
beforeEach(() => {
  sessionStorage.clear();
  mock.user = null;
  mock.loading = false;
  mock.path = "/";
  mock.setup.mockResolvedValue({ requires_address: false, offer_payment_setup: false });
  mock.getMethods.mockResolvedValue({
    payment_methods: [],
    available_providers: [{ id: 1, name: "Airtel Money", slug: "airtel-money" }],
  });
});
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.clearAllMocks();
});
it("prompts on the first scroll, allows browsing and does not prompt twice", async () => {
  const host = await mount();
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => window.dispatchEvent(new Event("scroll")));
  expect(host.textContent).toContain("Continue with Google");
  expect(sessionStorage.getItem(guestPromptKey)).toBe("shown");
  const dismiss = [...host.querySelectorAll("button")].find(
    (button) => button.textContent === "Continue browsing",
  )!;
  await act(async () => dismiss.click());
  await act(async () => window.dispatchEvent(new Event("scroll")));
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});
it.each(["/auth", "/help", "/privacy", "/terms"])("does not prompt on %s", async (path) => {
  mock.path = path;
  const host = await mount();
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    host.click();
  });
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});
it("waits for session restoration before prompting", async () => {
  mock.loading = true;
  const host = await mount();
  await act(async () => window.dispatchEvent(new Event("scroll")));
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});
it("a click-triggered prompt stays dismissed on later clicks and scrolling", async () => {
  const host = await mount();
  const control = document.createElement("button");
  control.textContent = "Shop";
  host.append(control);
  await act(async () => control.click());
  await act(async () =>
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent === "Continue browsing")!
      .click(),
  );
  await act(async () => {
    control.click();
    window.dispatchEvent(new Event("scroll"));
  });
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});
it("keeps the clicked product and seller as the Google return destination", async () => {
  const host = await mount();
  const product = document.createElement("a");
  product.href = "/product/phone?listing=18";
  host.append(product);
  await act(async () => product.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await act(async () =>
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent === "Continue with Google")!
      .click(),
  );
  expect(mock.navigate).toHaveBeenCalledWith({ to: "/product/phone?listing=18" });
});
it("new-account address introduction routes to Account before payment setup", async () => {
  mock.user = { id: 1 };
  mock.setup.mockResolvedValue({ requires_address: true, offer_payment_setup: false });
  const host = await mount();
  expect(host.textContent).toContain("Where should we deliver?");
  expect(host.textContent).not.toContain("Add mobile money?");
  await act(async () =>
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent === "Add my address")!
      .click(),
  );
  expect(mock.navigate).toHaveBeenCalledWith({ to: "/account" });
});
it("optional payment dismissal persists and a failed skip remains recoverable", async () => {
  mock.user = { id: 1 };
  mock.setup.mockResolvedValue({ requires_address: false, offer_payment_setup: true });
  mock.skip.mockRejectedValue(new Error("Please retry"));
  const host = await mount();
  expect(host.textContent).toContain("Add mobile money?");
  await act(async () => {
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent === "Not now")!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(mock.skip).toHaveBeenCalledOnce();
  expect(host.textContent).toContain("Please retry");
  expect(host.querySelector('[role="dialog"]')).not.toBeNull();
});
it("payment form keeps use-for-contact opt-in and reports save failures", async () => {
  mock.user = { id: 1 };
  mock.addMethod.mockRejectedValue(new Error("Invalid number"));
  const host = await mount(<PaymentMethodForm onSaved={vi.fn()} />);
  expect((host.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(false);
  const input = host.querySelector('input[type="tel"]') as HTMLInputElement;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "0983780656");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(mock.addMethod).toHaveBeenCalledWith(
    expect.objectContaining({ use_for_contact: false, provider: "airtel-money" }),
  );
  expect(host.textContent).toContain("Invalid number");
});

it("shows the address introduction even when first sign-in lands on Account", async () => {
  mock.user = { id: 1 };
  mock.path = "/account";
  mock.setup.mockResolvedValue({ requires_address: true, offer_payment_setup: false });
  const host = await mount();
  expect(host.textContent).toContain("Where should we deliver?");
});
