// @vitest-environment happy-dom
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { defineTable, exportExcel, exportPdf, fileName, formatCell, totals, type ReportMeta } from "./report-export";

const meta: ReportMeta = {
  title: "Items sold report",
  from: "2026-11-01",
  to: "2026-11-30",
  granularity: "daily",
  timezone: "Africa/Blantyre (UTC+2)",
  generatedAt: "2026-11-26T08:00:00Z",
  summary: [{ label: "Items sold", value: "7" }],
  notes: ["Paid, non-cancelled orders dated by payment time."],
};
const shops = defineTable({
  title: "Items sold by shop",
  rows: [
    { shop: "Alpha Phones", items: 6, gross: 1500 },
    { shop: "Beta Tech", items: 1, gross: 2000 },
  ],
  columns: [
    { header: "Shop", value: (r) => r.shop },
    { header: "Items sold", value: (r) => r.items, kind: "number", total: true },
    { header: "Gross sales", value: (r) => r.gross, kind: "money", total: true },
  ],
});
const empty = defineTable({ title: "Payout requests", rows: [] as { amount: number }[], columns: [{ header: "Amount", value: (r) => r.amount, kind: "money", total: true }] });

/** Captures what the export would download. */
function captureDownload() {
  const files: { name: string; blob: Blob }[] = [];
  const created = vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    files.push({ name: "", blob: blob as Blob });
    return "blob:fixture";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    files[files.length - 1]!.name = this.download;
  });
  return { files, created };
}
afterEach(() => vi.restoreAllMocks());

describe("report export", () => {
  it("formats cells and totals", () => {
    expect(formatCell("money", 1234567)).toBe("MK 1,234,567");
    expect(formatCell("number", 7)).toBe("7");
    expect(formatCell("date", "2026-11-10T23:30:00Z")).toBe("11 Nov 2026");
    expect(totals(shops)).toEqual(["Total", 7, 3500]);
    expect(fileName(meta, "pdf")).toBe("techaven-items-sold-report-2026-11-01-to-2026-11-30.pdf");
  });

  it("writes an Excel workbook with a summary sheet, real numbers and a totals row", async () => {
    const { files } = captureDownload();
    await exportExcel(meta, [shops, empty]);
    expect(files[0]!.name).toBe("techaven-items-sold-report-2026-11-01-to-2026-11-30.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await files[0]!.blob.arrayBuffer());
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Summary", "Items sold by shop", "Payout requests"]);
    const sheet = workbook.getWorksheet("Items sold by shop")!;
    expect(sheet.getRow(1).values).toEqual([undefined, "Shop", "Items sold", "Gross sales"]);
    expect(sheet.getRow(2).values).toEqual([undefined, "Alpha Phones", 6, 1500]);
    expect(sheet.getRow(4).values).toEqual([undefined, "Total", 7, 3500]);
    expect(sheet.getColumn(3).numFmt).toBe('"MK "#,##0');
    expect(workbook.getWorksheet("Summary")!.getRow(5).values).toEqual([undefined, "Items sold", "7"]);
  });

  it("writes a PDF", async () => {
    const { files } = captureDownload();
    await exportPdf(meta, [shops, empty]);
    expect(files[0]!.name).toMatch(/\.pdf$/);
    const head = new TextDecoder().decode((await files[0]!.blob.arrayBuffer()).slice(0, 5));
    expect(head).toBe("%PDF-");
    expect(files[0]!.blob.size).toBeGreaterThan(3000);
  });
});
