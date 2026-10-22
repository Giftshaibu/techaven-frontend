export type OfferDetails = {
  tax_exclusive?: boolean;
  extended_ram_gb?: number | null;
  advertised_ram_gb?: number | null;
  warranty_available?: boolean;
  swap_plus_cash?: boolean;
  condition_details?: { battery_health_percent?: number; battery_health_above_percent?: number; battery_health_options_percent?: number[]; fingerprint_reader?: string } | null;
};

export function offerFacts(details?: OfferDetails): string[] {
  if (!details) return [];
  const unit = details.condition_details;
  return [
    details.tax_exclusive ? 'Price excludes VAT. Confirm the final VAT-inclusive price with the shop.' : null,
    unit?.fingerprint_reader === 'not_working' ? 'Fingerprint reader does not work.' : null,
    unit?.battery_health_percent != null ? `Battery health: ${unit.battery_health_percent}%.` : null,
    unit?.battery_health_above_percent != null ? `Battery health: above ${unit.battery_health_above_percent}%.` : null,
    unit?.battery_health_options_percent?.length ? `Battery health: ${unit.battery_health_options_percent.join('% or ')}%; confirm the selected unit.` : null,
    details.extended_ram_gb ? `${details.extended_ram_gb} GB extended RAM (uses storage).` : null,
    details.advertised_ram_gb && !details.extended_ram_gb ? `${details.advertised_ram_gb} GB advertised memory; physical RAM is not specified.` : null,
    details.warranty_available ? 'Warranty available; ask the shop for terms.' : null,
    details.swap_plus_cash ? 'Swap plus cash accepted.' : null,
  ].filter((fact): fact is string => Boolean(fact));
}

export function configurationFacts(attributes?: Record<string, unknown> | null): { label: string; value: string }[] {
  const config = attributes?.configuration;
  if (!config || typeof config !== "object" || Array.isArray(config)) return [];
  return Object.entries(config).filter(([, value]) => typeof value === "string" || typeof value === "number").map(([key, value]) => ({ label: key.replaceAll("_", " "), value: String(value) }));
}
