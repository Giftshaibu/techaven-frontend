import { useState } from "react";

/** Report periods use Malawi calendar days (Africa/Blantyre, UTC+2), matching the API. */
export type ReportGranularity = "day" | "week" | "month";
export type ReportRange = { from: string; to: string; granularity: ReportGranularity };

export const malawiToday = () => new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10);
const shift = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const monday = (day: string) => shift(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

export type Preset = "today" | "week" | "7d" | "month" | "last-month" | "30d" | "year" | "custom";
export function presetRange(preset: Preset, today = malawiToday()): ReportRange {
  const firstOfMonth = `${today.slice(0, 8)}01`;
  switch (preset) {
    case "today":
      return { from: today, to: today, granularity: "day" };
    case "week":
      return { from: monday(today), to: today, granularity: "day" };
    case "7d":
      return { from: shift(today, -6), to: today, granularity: "day" };
    case "30d":
      return { from: shift(today, -29), to: today, granularity: "day" };
    case "last-month": {
      const lastDay = shift(firstOfMonth, -1);
      return { from: `${lastDay.slice(0, 8)}01`, to: lastDay, granularity: "day" };
    }
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today, granularity: "month" };
    default:
      return { from: firstOfMonth, to: today, granularity: "day" };
  }
}

export const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "7d", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "Year to date" },
  { value: "custom", label: "Custom" },
];
export const GROUPING: { value: ReportGranularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];
export const groupingLabel = (value: string) =>
  GROUPING.find((g) => g.value === value)?.label.toLowerCase() ?? value;

/** Period picker state: a preset, or custom dates, plus the grouping. */
export function useReportPeriod(initial: Preset = "month") {
  const [preset, setPreset] = useState<Preset>(initial);
  const [range, setRange] = useState<ReportRange>(() => presetRange(initial));
  return {
    preset,
    range,
    choosePreset: (value: Preset) => {
      setPreset(value);
      if (value !== "custom") setRange(presetRange(value));
    },
    setCustom: (patch: Partial<Pick<ReportRange, "from" | "to">>) => {
      setPreset("custom");
      setRange((current) => ({ ...current, ...patch }));
    },
    setGranularity: (granularity: ReportGranularity) => setRange((current) => ({ ...current, granularity })),
  };
}
export type ReportPeriod = ReturnType<typeof useReportPeriod>;

export const titleCase = (text: string | null | undefined) =>
  text ? text.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

export function bucketLabel(bucket: string, granularity: ReportGranularity) {
  if (granularity === "month") {
    return new Date(`${bucket}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
  const day = new Date(`${bucket}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return granularity === "week" ? `Week of ${day}` : day;
}

/** Validated categorical slots 1–2 (blue, orange) and shared axis styling for report charts. */
export const SERIES = { first: "#2a78d6", second: "#eb6834" };
export const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
export const compactNumber = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });
