// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CourierDialog } from "./CourierDialog";

const upload = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/techaven/staff", () => ({ uploadStaffImage: upload }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.clearAllMocks();
});

async function open(props: Partial<Parameters<typeof CourierDialog>[0]> = {}) {
  const onSave = vi.fn(async () => {});
  const onOpenChange = vi.fn();
  const host = document.createElement("div");
  document.body.append(host);
  await act(async () => {
    root = createRoot(host);
    root.render(
      <CourierDialog open courier={null} nextSortOrder={3} onSave={onSave} onOpenChange={onOpenChange} {...props} />,
    );
  });
  return { onSave, onOpenChange };
}

const input = (selector: string) => document.body.querySelector<HTMLInputElement>(selector)!;
async function type(element: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const submit = () =>
  act(async () => {
    document.body.querySelector("form")!.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("courier add/edit dialog", () => {
  it("uploads the icon with progress, then saves its URL with the new courier", async () => {
    let finish: (url: string) => void = () => {};
    upload.mockImplementation((_file: File, onProgress: (n: number) => void) => {
      onProgress(37);
      return new Promise((resolve) => (finish = resolve));
    });
    const { onSave, onOpenChange } = await open();
    expect(document.body.textContent).toContain("Add courier");
    await type(input('input[placeholder="e.g. CTS Courier"]'), "  Speedy  ");

    const picker = input('input[type="file"]');
    Object.defineProperty(picker, "files", { value: [new File(["x"], "logo.png", { type: "image/png" })] });
    await act(async () => picker.dispatchEvent(new Event("change", { bubbles: true })));
    expect(document.body.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("37");
    expect(document.body.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);

    await act(async () => finish("https://cdn.example.com/images/logo.png"));
    expect(document.body.querySelector('[role="progressbar"]')).toBeNull();
    expect(input('img[alt="Courier icon"]').getAttribute("src")).toBe("https://cdn.example.com/images/logo.png");

    await submit();
    expect(onSave).toHaveBeenCalledWith({
      name: "Speedy",
      description: null,
      logo_url: "https://cdn.example.com/images/logo.png",
      is_active: true,
      sort_order: 3,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("edits an existing courier, can remove its icon, and keeps the dialog open on failure", async () => {
    const courier = { id: 4, name: "CTS", description: "Reliable", logo_url: "https://cdn.example.com/a.png", is_active: false, sort_order: 2 };
    const onSave = vi.fn().mockRejectedValueOnce(new Error("Courier service not found")).mockResolvedValue(undefined);
    const { onOpenChange } = await open({ courier, onSave });
    expect(document.body.textContent).toContain("Edit CTS");
    expect(input('input[placeholder="e.g. CTS Courier"]').value).toBe("CTS");

    const remove = [...document.body.querySelectorAll("button")].find((b) => b.textContent === "Remove")!;
    await act(async () => remove.click());
    await submit();
    expect(onSave).toHaveBeenLastCalledWith({ ...courier, logo_url: null });
    expect(document.body.textContent).toContain("Courier service not found");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    await submit();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("requires a name and reports upload errors", async () => {
    upload.mockRejectedValue(new Error("Image must be a JPEG, PNG, GIF, or WebP file"));
    const { onSave } = await open();
    await type(input('input[placeholder="e.g. CTS Courier"]'), "   ");
    await submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Enter the courier's name.");

    const picker = input('input[type="file"]');
    Object.defineProperty(picker, "files", { value: [new File(["x"], "a.txt", { type: "text/plain" })] });
    await act(async () => {
      picker.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(document.body.textContent).toContain("Image must be a JPEG");
  });
});
