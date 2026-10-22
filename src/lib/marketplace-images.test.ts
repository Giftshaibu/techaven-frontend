import { describe, expect, it } from "vitest";
import { marketplaceImages } from "./marketplace-images";

describe("stock-first marketplace photography", () => {
  it("shows stock photos before seller boxes/posters, filters videos and deduplicates URLs", () => {
    expect(marketplaceImages({ primary_image_url: "/stock.jpg", media: [
      { url: "/extra-stock.jpg", media_type: "image" },
      { url: "/stock.jpg", media_type: "image", is_primary: true },
      { url: "/video.mp4", media_type: "video" },
    ] }, { images: [{ url: "/poster.jpg" }, { url: "/box.jpg", is_primary: true }] }))
      .toEqual(["/stock.jpg", "/box.jpg", "/poster.jpg", "/extra-stock.jpg"]);
  });
  it("keeps only the selected seller's evidence when offers change", () => {
    const device = { primary_image_url: "/stock.jpg" };
    expect(marketplaceImages(device, { images: [{ url: "/shop-a.jpg" }] })).toEqual(["/stock.jpg", "/shop-a.jpg"]);
    expect(marketplaceImages(device, { images: [{ url: "/shop-b.jpg" }] })).toEqual(["/stock.jpg", "/shop-b.jpg"]);
  });
  it("leaves the unavailable-photo state when only seller evidence exists", () => {
    expect(marketplaceImages({}, { images: [{ url: "/actual-device.jpg" }] })).toEqual([]);
    expect(marketplaceImages(undefined)).toEqual([]);
  });
});
