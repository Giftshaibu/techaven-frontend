/**
 * Curated, fixed Unsplash assets used for illustrative marketplace surfaces.
 * Unsplash images are free for commercial use under https://unsplash.com/license.
 * These are intentionally shared campaign/category images, not exact SKU photography.
 */
const unsplash = (id: string, width = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=82&w=${width}`;

export const marketplaceMedia = {
  hero: {
    src: unsplash("photo-1498049794561-7780e7231661", 1800),
    alt: "A curated collection of modern electronics on display",
    position: "center",
  },
  smartphones: {
    src: unsplash("photo-1511707171634-5f897ff02aa9", 1000),
    alt: "Modern smartphone held in one hand",
    position: "center",
  },
  laptops: {
    src: unsplash("photo-1496181133206-80ce9b88a853", 1200),
    alt: "Open laptop on a clean desk",
    position: "center",
  },
  audio: {
    src: unsplash("photo-1505740420928-5e560c06d30e", 1000),
    alt: "Over-ear headphones on a neutral background",
    position: "center",
  },
  shop: {
    src: unsplash("photo-1550009158-9ebf69173e03", 1200),
    alt: "Electronics displayed inside a technology shop",
    position: "center",
  },
  workspace: {
    src: unsplash("photo-1593642532400-2682810df593", 1200),
    alt: "Laptop and accessories arranged in a modern workspace",
    position: "center",
  },
  compare: {
    src: unsplash("photo-1523206489230-c012c64b2b48", 1000),
    alt: "A selection of smartphones shown side by side",
    position: "center",
  },
  tradeIn: {
    src: unsplash("photo-1601784551446-20c9e07cdbdb", 1000),
    alt: "A smartphone ready to be reused or traded in",
    position: "center",
  },
} as const;

export type MarketplaceMedia = (typeof marketplaceMedia)[keyof typeof marketplaceMedia];
