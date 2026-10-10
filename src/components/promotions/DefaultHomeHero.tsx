import { MegaHeader } from "@/components/MegaHeader";
import { marketplaceMedia } from "@/data/media";

export function DefaultHomeHero() {
  return (
    <MegaHeader
      title="Every electronics shop in one place."
      support="Phones, laptops, audio and home electronics from verified Malawian shops, with comparison, trade-in and buyer protection built in."
      actions={[
        { label: "View all products", to: "/products" },
        { label: "Shop the deals", to: "/deals" },
      ]}
      media={[marketplaceMedia.hero]}
      tone="brand-soft"
    />
  );
}
