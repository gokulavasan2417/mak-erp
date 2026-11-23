// MAK Tours & Travels ERP - Professional Excel (.xlsx) Report Generation Service
import ExcelJS from 'exceljs';

/**
 * Generates formatted Excel workbook buffer
 * @param {string} title - Report title
 * @param {Array<{header: string, key: string, width?: number}>} columns - Column definitions
 * @param {Array<Object>} rows - Data rows
 * @param {Object} [summary] - Optional summary / totals row
 * @returns {Promise<Buffer>}
 */
export async function generateReportExcelBuffer(title, columns, rows, summary = null) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MAK Tours & Travels ERP';
  workbook.created = new Date();

  // Excel sheet name max length is 31 chars
  const safeSheetName = (title || 'Report').replace(/[*?:/\\\[\]]/g, '').slice(0, 31);
  const sheet = workbook.addWorksheet(safeSheetName);

  const colCount = Math.max(1, columns.length);
  const lastColLetter = String.fromCharCode(64 + Math.min(colCount, 26));

  // 1. Report Title Row
  sheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 32;

  // 2. Subtitle / Timestamp Row
  sheet.mergeCells(`A2:${lastColLetter}2`);
  const subCell = sheet.getCell('A2');
  subCell.value = `Generated on ${new Date().toLocaleString('en-IN')} | MAK Tours & Travels ERP SaaS`;
  subCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 18;

  // Blank spacing row
  sheet.addRow([]);

  // 3. Column Headers
  const headerValues = columns.map((c) => c.header);
  const headerRow = sheet.addRow(headerValues);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E293B' } }
    };
  });

  // Set Column widths
  columns.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = col.width || 20;
  });

  // 4. Data Rows
  rows.forEach((r, idx) => {
    const rowValues = columns.map((c) => {
      let val = r[c.key] ?? '';
      if (typeof val === 'string' && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(val)) {
        const ymd = val.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (ymd) return `${String(ymd[3]).padStart(2, '0')}-${String(ymd[2]).padStart(2, '0')}-${ymd[1]}`;
      }
      return val;
    });
    const dataRow = sheet.addRow(rowValues);
    dataRow.height = 20;

    const isEven = idx % 2 === 0;
    dataRow.eachCell((cell, colIdx) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
      if (!isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }
      };

      // Right-align numbers and currency
      const colDef = columns[colIdx - 1];
      if (colDef?.isNumber || typeof cell.value === 'number') {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  // 5. Summary Row if provided
  if (summary) {
    const summaryValues = columns.map((c, i) => (i === 0 ? 'TOTAL / SUMMARY' : summary[c.key] ?? ''));
    const summaryRow = sheet.addRow(summaryValues);
    summaryRow.height = 24;
    summaryRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export default { generateReportExcelBuffer };
