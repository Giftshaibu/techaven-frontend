// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ApiCategory, ApiShop } from "@/integrations/techaven/types";
import { Header } from "./Header";

const state = vi.hoisted(() => ({
  categories: undefined as ApiCategory[] | undefined,
  shops: undefined as ApiShop[] | undefined,
  loading: false,
  error: null as Error | null,
}));
vi.mock("@/lib/techaven-hooks", () => ({
  useTechavenCategories: () => ({
    data: state.categories,
    isLoading: state.loading,
    error: state.error,
  }),
  useTechavenShops: () => ({ data: state.shops, isLoading: state.loading, error: state.error }),
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: [] }) }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/cart", () => ({ useCart: () => ({ count: 0 }) }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({
    children,
    to,
    onClick,
    className,
    ...props
  }: {
    children?: ReactNode;
    to: string;
    onClick?: () => void;
    className?: string;
    "aria-controls"?: string;
    "aria-expanded"?: boolean;
  }) => (
    <a
      href={to}
      onClick={onClick}
      className={className}
      aria-controls={props["aria-controls"]}
      aria-expanded={props["aria-expanded"]}
    >
      {children}
    </a>
  ),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  state.categories = undefined;
  state.shops = undefined;
  state.loading = false;
  state.error = null;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("live header", () => {
  it("returns keyboard focus to the category trigger when Escape closes a live menu", () => {
    state.categories = [{ id: 1, name: "Smartphones" }];
    state.shops = [{ id: 1, name: "Mnex Electronics" }];
    act(() => root.render(<Header />));
    const trigger = container.querySelector<HTMLAnchorElement>('a[aria-controls="mega-menu-c-1"]')!;
    act(() => trigger.focus());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const seller = Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).find(
      (a) => a.textContent === "Mnex Electronics",
    )!;
    act(() => seller.focus());
    act(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps an empty category menu as a plain navigation link", () => {
    state.categories = [{ id: 1, name: "Smartphones" }];
    state.shops = [];
    act(() => root.render(<Header />));
    expect(container.querySelector('[aria-controls="mega-menu-c-1"]')).toBeNull();
    expect(container.querySelector('[role="region"]')).toBeNull();
  });
  it.each(["loading", "error", "empty"])(
    "keeps navigation without inventing catalogue data during %s",
    (mode) => {
      state.loading = mode === "loading";
      state.error = mode === "error" ? new Error("Unavailable") : null;
      if (mode === "empty") {
        state.categories = [];
        state.shops = [];
      }
      act(() => root.render(<Header />));
      expect(container.querySelector("input")?.placeholder).toBe("Search products");
      expect(container.textContent).toContain("Products");
      expect(container.textContent).not.toMatch(
        /Digital World|ABC Electronics|Popular brands|Track order|Sell on Techaven|iPhone 15|4K TV/,
      );
      expect(container.querySelector('[role="region"]')).toBeNull();
    },
  );
});
