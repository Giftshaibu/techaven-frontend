// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ShopLogo } from "./ShopLogo";
import { ImageStage } from "./ImageStage";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root;
let container: HTMLDivElement;
function mount(element: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(element));
}
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.restoreAllMocks();
});

describe("media fallbacks", () => {
  it("shows an image that completed before React attached its load handler", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(624);
    mount(<ImageStage src="/cached-phone.jpg" alt="Phone" />);
    expect(container.querySelector("img")?.className).toContain("opacity-100");
    expect(container.querySelector("svg")).toBeNull();
  });
  it("uses saved logos, falls back after failure, and retries a different seller logo", () => {
    mount(<ShopLogo name="Mnex Electronics" src="/mnex.jpg" />);
    expect(container.querySelector("img")?.alt).toBe("Mnex Electronics logo");
    act(() => container.querySelector("img")!.dispatchEvent(new Event("error")));
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("ME");
    act(() => root.render(<ShopLogo name="Pixie Electronics" src="/pixie.jpg" />));
    expect(container.querySelector("img")?.src).toContain("/pixie.jpg");
    act(() => root.render(<ShopLogo name="B24 Electronics" />));
    expect(container.textContent).toBe("BE");
  });

  it("labels missing and broken photos and renders a replacement after loading", () => {
    mount(<ImageStage />);
    expect(container.textContent).toContain("Photo unavailable");
    act(() => root.render(<ImageStage src="/broken.jpg" alt="Phone" />));
    act(() => container.querySelector("img")!.dispatchEvent(new Event("error")));
    expect(container.textContent).toContain("Photo unavailable");
    act(() => root.render(<ImageStage src="/phone.jpg" alt="Phone" />));
    act(() => container.querySelector("img")!.dispatchEvent(new Event("load")));
    expect(container.textContent).not.toContain("Photo unavailable");
    expect(container.querySelector("img")?.className).toContain("opacity-100");
  });
});
