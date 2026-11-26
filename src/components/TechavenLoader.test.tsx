// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoadingBlock } from "./portal/kit";
import { RoutePendingScreen, TechavenLoader } from "./TechavenLoader";

vi.mock("@/integrations/techaven/staff", () => ({ getStaffSession: () => null, subscribeStaffSession: () => () => {} }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
async function mount(element: React.ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  await act(async () => {
    root = createRoot(host);
    root.render(element);
  });
  return host;
}
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("Techaven loader", () => {
  it("announces its label as a status and shows the animated mark decoratively", async () => {
    const host = await mount(<TechavenLoader label="Loading orders" minHeight="12rem" />);
    const status = host.querySelector('[role="status"]')!;
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.textContent).toContain("Loading orders");
    expect((status as HTMLElement).style.minHeight).toBe("12rem");
    const img = host.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/loader.webp");
    expect(img.getAttribute("aria-hidden")).toBe("true");
  });

  it("rotates route messages while a page loads", async () => {
    vi.useFakeTimers();
    const host = await mount(<RoutePendingScreen />);
    const first = host.querySelector('[role="status"]')!.textContent;
    await act(async () => {
      vi.advanceTimersByTime(2300);
    });
    expect(host.querySelector('[role="status"]')!.textContent).not.toBe(first);
  });

  it("portal LoadingBlock keeps roughly the height of the rows it replaces", async () => {
    const host = await mount(<LoadingBlock rows={4} label="Loading users" />);
    const status = host.querySelector<HTMLElement>('[role="status"]')!;
    expect(status.style.minHeight).toBe("15rem");
    expect(status.textContent).toContain("Loading users");
  });
});
