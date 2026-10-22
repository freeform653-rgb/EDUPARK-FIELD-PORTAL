// Export and Reporting Utilities for Edupark Field Portal
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDisplayDate, getLocalDateString } from './calculations';

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any, row: any) => string;
}

/**
 * Clean string for CSV cell (escapes double quotes and commas)
 */
function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export table data to CSV file with UTF-8 BOM
 */
export function exportToCsv(
  title: string,
  columns: ExportColumn[],
  data: any[],
  summaryRows?: Record<string, any>[]
): void {
  const headers = columns.map(c => escapeCsvCell(c.header)).join(',');
  const rows = data.map(row => {
    return columns.map(c => {
      const val = row[c.key];
      const formatted = c.format ? c.format(val, row) : val;
      return escapeCsvCell(formatted);
    }).join(',');
  });

  const metadata = [
    `"Edupark Field Portal - ${title}"`,
    `"Generated On: ${formatDisplayDate(getLocalDateString())} at ${new Date().toLocaleTimeString()}"`,
    `"Total Records: ${data.length}"`,
    ''
  ].join('\r\n');

  let content = `${metadata}\r\n${headers}\r\n${rows.join('\r\n')}`;

  if (summaryRows && summaryRows.length > 0) {
    content += '\r\n';
    summaryRows.forEach(sum => {
      const sumLine = columns.map(c => escapeCsvCell(sum[c.key] ?? '')).join(',');
      content += `\r\n${sumLine}`;
    });
  }

  // Prepend UTF-8 BOM
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to Excel-compatible .xls file
 */
export function exportToExcel(
  title: string,
  columns: ExportColumn[],
  data: any[],
  summaryRows?: Record<string, any>[]
): void {
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${title}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 8px; text-align: left; }
        td { border: 1px solid #cbd5e1; padding: 6px; }
        .title { font-size: 16pt; font-weight: bold; color: #0f172a; }
        .meta { font-size: 10pt; color: #64748b; margin-bottom: 12px; }
        .summary-row { font-weight: bold; background-color: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="title">Edupark Field Portal — ${title}</div>
      <div class="meta">Generated: ${formatDisplayDate(getLocalDateString())} | Total Records: ${data.length}</div>
      <table>
        <thead>
          <tr>
            ${columns.map(c => `<th>${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(c => {
                const val = row[c.key];
                const formatted = c.format ? c.format(val, row) : (val ?? '');
                return `<td>${formatted}</td>`;
              }).join('')}
            </tr>
          `).join('')}
          ${summaryRows ? summaryRows.map(sum => `
            <tr class="summary-row">
              ${columns.map(c => `<td>${sum[c.key] ?? ''}</td>`).join('')}
            </tr>
          `).join('') : ''}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${getLocalDateString()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate client-side PDF document with clean styling
 */
export function exportToPdf(
  title: string,
  columns: ExportColumn[],
  data: any[],
  filterSubtitle?: string
): void {
  const doc = new jsPDF({
    orientation: columns.length > 7 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Navy
  doc.text(`Edupark Field Portal — ${title}`, 14, 15);

  // Subtitle / Filters
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate
  const dateStr = `Generated on: ${formatDisplayDate(getLocalDateString())} at ${new Date().toLocaleTimeString()} | Records: ${data.length}`;
  doc.text(filterSubtitle ? `${filterSubtitle}  |  ${dateStr}` : dateStr, 14, 21);

  // Table Data
  const head = [columns.map(c => c.header)];
  const body = data.map(row => {
    return columns.map(c => {
      const val = row[c.key];
      return c.format ? c.format(val, row) : (val ?? 'N/A');
    });
  });

  autoTable(doc, {
    head,
    body,
    startY: 25,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    margin: { top: 25, left: 14, right: 14, bottom: 15 },
    didDrawPage: (dataInfo) => {
      // Footer page number
      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${dataInfo.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 8
      );
    }
  });

  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${getLocalDateString()}.pdf`);
}

/**
 * Trigger clean browser printing
 */
export function triggerPrint(): void {
  window.print();
}
