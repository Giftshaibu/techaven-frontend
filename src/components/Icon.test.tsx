import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "./Icon";
import { solarIcons } from "@/lib/solar-icons";

describe("local icons", () => {
  it("renders every bundled icon as SVG without fetching remote icon data", () => {
    const fetch = vi.fn(() => {
      throw new Error("External icon requests blocked");
    });
    vi.stubGlobal("fetch", fetch);
    for (const name of Object.keys(solarIcons)) {
      const html = renderToStaticMarkup(<Icon name={name} size={18} />);
      expect(html).toContain("<svg");
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toContain("https://");
    }
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
