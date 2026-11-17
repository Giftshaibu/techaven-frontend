const brandDomains: Readonly<Record<string, string>> = {
  "nbs-bank": "nbs.mw",
  "national-bank-malawi": "natbank.co.mw",
  "standard-bank": "standardbank.co.mw",
  ecobank: "ecobank.com",
  "airtel-money": "airtel.africa",
  "fdh-bank": "fdh.co.mw",
  acer: "acer.com",
  aiwa: "aiwa.com",
  apple: "apple.com",
  dell: "dell.com",
  google: "google.com",
  hisense: "hisense.com",
  hp: "hp.com",
  huawei: "huawei.com",
  infinix: "infinixmobility.com",
  itel: "itel-life.com",
  jbl: "jbl.com",
  lenovo: "lenovo.com",
  lg: "lg.com",
  microsoft: "microsoft.com",
  nokia: "nokia.com",
  oppo: "oppo.com",
  oraimo: "oraimo.com",
  oscal: "oscal.hk",
  samsung: "samsung.com",
  sony: "sony.com",
  tecno: "tecno-mobile.com",
  toshiba: "toshiba.com",
  vivo: "vivo.com",
  xiaomi: "mi.com",
};

export function brandLogoUrl(slug: string): string | undefined {
  const key = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY?.trim();
  const domain = Object.hasOwn(brandDomains, slug) ? brandDomains[slug] : undefined;
  if (!key?.startsWith("pk_") || !domain) return undefined;

  const query = new URLSearchParams({ token: key, fallback: "404", size: "256" });
  return `https://img.logo.dev/${domain}?${query}`;
}
