// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
import { BrandTiles } from "./BrandTiles";
vi.mock("@tanstack/react-router", () => ({ Link: ({ params, search, children }: any) => <a href={`/category/${params.slug}?brand=${search.brand}`}>{children}</a> }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
test("brand tiles navigate with canonical slugs and retain live imagery", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<BrandTiles category={{ slug: "c-1", name: "Smartphones", icon: "", blurb: "", brands: [], subcategories: [], brandTiles: [{ slug: "apple", name: "Apple", image: "https://example.com/iphone.png", product_count: 26 }] }} />));
  expect(container.querySelector("a")?.getAttribute("href")).toBe("/category/c-1?brand=apple");
  expect(container.textContent).toContain("iPhone");
  expect(container.textContent).toContain("26 available models");
  expect(container.querySelector("img")?.getAttribute("src")).toBe("https://example.com/iphone.png");
  act(() => root.unmount());
});
