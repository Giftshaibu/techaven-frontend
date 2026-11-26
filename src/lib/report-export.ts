/**
 * PDF and Excel export for the admin Reports page. The libraries are loaded on demand, so they
 * cost nothing until someone clicks Export.
 */
export type CellKind = "text" | "money" | "number" | "date" | "datetime";
export type Column<Row> = {
  header: string;
  // Method syntax keeps tables of different row types assignable to ReportTable<unknown>.
  value(row: Row): string | number | null | undefined;
  kind?: CellKind;
  /** Summed into a "Total" row on export and in the on-screen table. */
  total?: boolean;
};
export type ReportTable<Row = unknown> = {
  /** Sheet name / section heading. */
  title: string;
  columns: Column<Row>[];
  rows: Row[];
};
/** Declares a table with its row type inferred from `rows`, for use in a list of mixed tables. */
export const defineTable = <Row,>(table: ReportTable<Row>): ReportTable<unknown> => table as ReportTable<unknown>;

export type ReportMeta = {
  title: string;
  from: string;
  to: string;
  granularity: string;
  timezone: string;
  generatedAt: string;
  /** Headline figures printed at the top of the PDF / on the Summary sheet. */
  summary: { label: string; value: string }[];
  notes?: string[];
};

const MWK = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
export const money = (value: unknown) => `MK ${MWK.format(Number(value) || 0)}`;
export const count = (value: unknown) => MWK.format(Number(value) || 0);
export const date = (value: unknown) =>
  value ? new Date(String(value)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Blantyre" }) : "";
export const dateTime = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Blantyre" })
    : "";

export function formatCell(kind: CellKind | undefined, value: unknown) {
  if (value == null || value === "") return "";
  if (kind === "money") return money(value);
  if (kind === "number") return count(value);
  if (kind === "date") return date(value);
  if (kind === "datetime") return dateTime(value);
  return String(value);
}

export function totals<Row>(table: ReportTable<Row>) {
  if (!table.columns.some((column) => column.total)) return null;
  return table.columns.map((column, index) =>
    column.total
      ? table.rows.reduce((sum, row) => sum + (Number(column.value(row)) || 0), 0)
      : index === 0
        ? "Total"
        : "",
  );
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const fileName = (meta: ReportMeta, extension: string) =>
  `techaven-${slug(meta.title)}-${meta.from}-to-${meta.to}.${extension}`;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const BRAND: [number, number, number] = [42, 120, 214];
const INK: [number, number, number] = [31, 35, 41];
const MUTED: [number, number, number] = [110, 116, 126];

/** A4 landscape PDF: title block, headline figures, then one table per section. */
export async function exportPdf(meta: ReportMeta, tables: ReportTable<unknown>[]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 36;

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, width, 6, "F");
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`Techaven · ${meta.title}`, margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `${date(meta.from + "T12:00:00Z")} – ${date(meta.to + "T12:00:00Z")} · grouped ${meta.granularity} · ${meta.timezone} · generated ${dateTime(meta.generatedAt)}`,
    margin,
    56,
  );

  // Headline figures as a row of boxes.
  let y = 72;
  if (meta.summary.length) {
    const perRow = Math.min(meta.summary.length, 5);
    const gap = 8;
    const boxWidth = (width - margin * 2 - gap * (perRow - 1)) / perRow;
    meta.summary.forEach((item, index) => {
      const col = index % perRow;
      const row = Math.floor(index / perRow);
      const x = margin + col * (boxWidth + gap);
      const top = y + row * 50;
      doc.setDrawColor(225, 228, 232);
      doc.setFillColor(248, 249, 251);
      doc.roundedRect(x, top, boxWidth, 42, 4, 4, "FD");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(item.label.toUpperCase(), x + 8, top + 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...INK);
      doc.text(item.value, x + 8, top + 32);
      doc.setFont("helvetica", "normal");
    });
    y += Math.ceil(meta.summary.length / perRow) * 50 + 8;
  }

  for (const table of tables) {
    const head = [table.columns.map((column) => column.header)];
    const body = table.rows.map((row) => table.columns.map((column) => formatCell(column.kind, column.value(row))));
    const sum = totals(table);
    const foot = sum
      ? [sum.map((value, index) => (typeof value === "number" ? formatCell(table.columns[index]!.kind, value) : value))]
      : undefined;
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(`${table.title} (${table.rows.length})`, margin, y + 12);
    autoTable(doc, {
      startY: y + 20,
      head,
      body: body.length ? body : [[{ content: "No records for this period", colSpan: head[0]!.length }]],
      ...(foot && body.length ? { foot } : {}),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 4, textColor: INK, lineColor: [230, 232, 236], lineWidth: 0.5 },
      headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [240, 242, 246], textColor: INK, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: Object.fromEntries(
        table.columns.map((column, index) => [index, column.kind === "money" || column.kind === "number" ? { halign: "right" } : {}]),
      ),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  }

  if (meta.notes?.length) {
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    meta.notes.forEach((note, index) => doc.text(`• ${note}`, margin, y + index * 11));
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${page} of ${pages}`, width - margin, doc.internal.pageSize.getHeight() - 16, { align: "right" });
    doc.text("Techaven · confidential", margin, doc.internal.pageSize.getHeight() - 16);
  }
  download(doc.output("blob"), fileName(meta, "pdf"));
}

/** Excel workbook: a Summary sheet, then one sheet per section with real numbers and dates. */
export async function exportExcel(meta: ReportMeta, tables: ReportTable<unknown>[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Techaven";
  workbook.created = new Date(meta.generatedAt);

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ width: 34 }, { width: 28 }];
  summary.addRow([`Techaven · ${meta.title}`]).font = { bold: true, size: 14 };
  summary.addRow([`${meta.from} to ${meta.to}`, `Grouped ${meta.granularity}`]);
  summary.addRow([meta.timezone, `Generated ${dateTime(meta.generatedAt)}`]);
  summary.addRow([]);
  for (const item of meta.summary) {
    const row = summary.addRow([item.label, item.value]);
    row.getCell(1).font = { color: { argb: "FF6E747E" } };
    row.getCell(2).font = { bold: true };
  }
  if (meta.notes?.length) {
    summary.addRow([]);
    for (const note of meta.notes) summary.addRow([note]).font = { italic: true, color: { argb: "FF6E747E" } };
  }

  const used = new Set<string>(["Summary"]);
  for (const table of tables) {
    let name = table.title.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
    for (let n = 2; used.has(name); n++) name = `${table.title.slice(0, 28)} ${n}`;
    used.add(name);
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = table.columns.map((column) => ({
      header: column.header,
      width: Math.max(12, Math.min(40, column.header.length + 6)),
      style:
        column.kind === "money"
          ? { numFmt: '"MK "#,##0' }
          : column.kind === "number"
            ? { numFmt: "#,##0" }
            : column.kind === "date"
              ? { numFmt: "dd mmm yyyy" }
              : column.kind === "datetime"
                ? { numFmt: "dd mmm yyyy hh:mm" }
                : {},
    }));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A78D6" } };
    for (const row of table.rows) {
      sheet.addRow(
        table.columns.map((column) => {
          const value = column.value(row);
          if (value == null || value === "") return null;
          if (column.kind === "money" || column.kind === "number") return Number(value) || 0;
          if (column.kind === "date" || column.kind === "datetime") return new Date(String(value));
          return String(value);
        }),
      );
    }
    const sum = totals(table);
    if (sum && table.rows.length) {
      const row = sheet.addRow(sum.map((value) => (value === "" ? null : value)));
      row.font = { bold: true };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F2F6" } };
    }
    if (table.rows.length) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: table.columns.length } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  download(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    fileName(meta, "xlsx"),
  );
}
