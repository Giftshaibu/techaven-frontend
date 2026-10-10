import type { Promotion } from "@/lib/cms/promotions";

export const themeClass: Record<Promotion["theme"], string> = {
  light: "bg-white text-ink-800",
  neutral: "bg-stage text-ink-800",
  brand_soft: "bg-brand-100 text-brand-800",
  brand: "bg-brand-500 text-white",
  dark: "bg-ink-900 text-white",
};
