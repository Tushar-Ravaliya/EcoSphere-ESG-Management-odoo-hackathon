import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Response } from "express";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportSection {
  title: string;
  rows: Record<string, string | number | null>[];
}

export interface ReportData {
  title: string;
  generatedAt: string;
  filters: Record<string, string>;
  sections: ReportSection[];
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const BRAND = "#2E7D32"; // dark green
const HEADER_BG = "2E7D32";
const ROW_ALT = "F1F8E9";

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function sendPDF(res: Response, data: ReportData): void {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${slugify(data.title)}.pdf"`);
  doc.pipe(res);

  // Cover header
  doc.rect(0, 0, doc.page.width, 70).fill(BRAND);
  doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text(data.title, 40, 20);
  doc.fontSize(9).font("Helvetica").text(`Generated: ${data.generatedAt}`, 40, 48);

  // Filters
  const filterStr = Object.entries(data.filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("  |  ");
  if (filterStr) {
    doc.moveDown(2).fillColor("#444444").fontSize(8).text(`Filters — ${filterStr}`, { align: "right" });
  }

  doc.moveDown(1.5);

  for (const section of data.sections) {
    if (section.rows.length === 0) continue;

    // Section heading
    doc
      .fillColor(BRAND)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(section.title, { underline: false });
    doc.moveDown(0.4);

    const cols = Object.keys(section.rows[0]);
    const colWidth = (doc.page.width - 80) / cols.length;
    const tableTop = doc.y;

    // Draw header row
    doc.rect(40, tableTop, doc.page.width - 80, 18).fill(BRAND);
    cols.forEach((col, i) => {
      doc
        .fillColor("#ffffff")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(col, 42 + i * colWidth, tableTop + 4, { width: colWidth - 4, ellipsis: true });
    });

    // Draw data rows
    section.rows.forEach((row, rowIdx) => {
      const y = tableTop + 18 + rowIdx * 16;

      // page break check
      if (y + 16 > doc.page.height - 50) {
        doc.addPage();
      }

      const bg = rowIdx % 2 === 0 ? "#ffffff" : `#${ROW_ALT}`;
      doc.rect(40, y, doc.page.width - 80, 16).fill(bg);

      cols.forEach((col, i) => {
        const val = row[col];
        doc
          .fillColor("#222222")
          .fontSize(7.5)
          .font("Helvetica")
          .text(val === null || val === undefined ? "-" : String(val), 42 + i * colWidth, y + 3, {
            width: colWidth - 4,
            ellipsis: true,
          });
      });
    });

    doc.y = tableTop + 18 + section.rows.length * 16 + 16;
    doc.moveDown(1.2);
  }

  doc.end();
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export async function sendExcel(res: Response, data: ReportData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EcoSphere";
  workbook.created = new Date();

  // Summary sheet
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ width: 28 }, { width: 40 }];
  summary.addRow([data.title]).font = { bold: true, size: 14, color: { argb: "FF" + HEADER_BG } };
  summary.addRow(["Generated", data.generatedAt]);
  summary.addRow([]);

  const filterEntries = Object.entries(data.filters).filter(([, v]) => v);
  if (filterEntries.length) {
    summary.addRow(["── Filters ──"]).font = { bold: true };
    filterEntries.forEach(([k, v]) => summary.addRow([k, v]));
    summary.addRow([]);
  }

  // One sheet per section
  for (const section of data.sections) {
    if (section.rows.length === 0) continue;

    const sheetName = section.title.slice(0, 31); // Excel 31-char limit
    const ws = workbook.addWorksheet(sheetName);

    const cols = Object.keys(section.rows[0]);
    ws.columns = cols.map((c) => ({ header: c, key: c, width: 22 }));

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + HEADER_BG } };
    headerRow.alignment = { vertical: "middle" };
    headerRow.height = 20;

    // Add data with alternating fills
    section.rows.forEach((row, idx) => {
      const dataRow = ws.addRow(row);
      if (idx % 2 === 1) {
        dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + ROW_ALT } };
      }
    });

    // Auto-filter on header
    ws.autoFilter = { from: "A1", to: { row: 1, column: cols.length } };
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${slugify(data.title)}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function fmt(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined) return "-";
  return val.toFixed(decimals);
}
