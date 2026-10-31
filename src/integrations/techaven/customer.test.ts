import { beforeEach, describe, expect, it, vi } from "vitest";
import { techavenRequest } from "./client";
import { getShop, getShops } from "./customer";

vi.mock("./client", () => ({ techavenRequest: vi.fn() }));
const request = vi.mocked(techavenRequest);

describe("marketplace shop counts", () => {
  beforeEach(() => request.mockReset());

  it("shows marketplace devices when the legacy product count is zero", async () => {
    request.mockResolvedValueOnce([{ id: 1, name: "Mnex", total_products: 0 }]);
    request.mockResolvedValueOnce({ devices: [], pagination: { total_items: 80 } });
    expect((await getShops())[0].total_products).toBe(80);
    expect(request).toHaveBeenLastCalledWith("/api/v2/marketplace/devices?shop_id=1&limit=1", { auth: false });
  });

  it("keeps shop details available when the marketplace endpoint fails", async () => {
    request.mockResolvedValueOnce({ id: 2, name: "Pixie", total_products: 3 });
    request.mockRejectedValueOnce(new Error("Marketplace unavailable"));
    expect(await getShop(2)).toEqual({ id: 2, name: "Pixie", total_products: 3 });
  });
});
