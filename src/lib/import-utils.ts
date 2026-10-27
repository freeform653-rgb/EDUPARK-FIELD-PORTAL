import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch {
  // Ignore in SSR
}

export interface ParsedStudentRow {
  id: string; // Temporary ID for preview selection
  full_name: string;
  batch: string;
  phone_number?: string | null;
  isValid: boolean;
  isDuplicate?: boolean;
  error?: string;
  selected: boolean;
}

/**
 * Downloads a sample pre-formatted Excel template for easy student onboarding
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    { 'Student Name': 'Muhammed Rayan', 'Batch': 'plus one A', 'Phone Number': '9876543210' },
    { 'Student Name': 'Fathima Zahra', 'Batch': 'plus one B', 'Phone Number': '9876543211' },
    { 'Student Name': 'Ahmed Bilal', 'Batch': 'Batch 13', 'Phone Number': '9876543212' },
    { 'Student Name': 'Aysha Mariyam', 'Batch': 'plus one A', 'Phone Number': '9876543213' },
    { 'Student Name': 'Zayan Kabeer', 'Batch': 'plus one B', 'Phone Number': '9876543214' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 26 }, // Student Name
    { wch: 18 }, // Batch
    { wch: 18 }  // Phone Number
  ];

  XLSX.writeFile(workbook, 'Edupark_Student_Import_Template.xlsx');
}

/**
 * Parse Excel / CSV ArrayBuffer into parsed student rows
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer,
  defaultBatch: string = 'plus one A',
  existingNames: Set<string> = new Set()
): ParsedStudentRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse raw rows as 2D array to detect header row dynamically
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) return [];

  // Find header row (first row containing 'name' or 'student')
  let headerRowIndex = -1;
  let nameCol = 0;
  let batchCol = 1;
  let phoneCol = 2;

  for (let r = 0; r < Math.min(rawRows.length, 6); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    const nIndex = row.findIndex((c: any) => /name|student|candidate/i.test(String(c)));
    if (nIndex !== -1) {
      headerRowIndex = r;
      nameCol = nIndex;
      const bIndex = row.findIndex((c: any) => /batch|class|division|standard|grade/i.test(String(c)));
      if (bIndex !== -1) batchCol = bIndex;
      const pIndex = row.findIndex((c: any) => /phone|mobile|contact|cell|tel/i.test(String(c)));
      if (pIndex !== -1) phoneCol = pIndex;
      break;
    }
  }

  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
  const results: ParsedStudentRow[] = [];

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawName = String(row[nameCol] ?? '').trim();
    if (!rawName || /^(name|student\s*name|full\s*name|sl\s*no)$/i.test(rawName)) continue;

    const rawBatch = row[batchCol] !== undefined ? String(row[batchCol]).trim() : '';
    const batch = rawBatch.length > 0 ? rawBatch : defaultBatch;

    const rawPhone = row[phoneCol] !== undefined ? String(row[phoneCol]).trim() : '';
    const phone_number = rawPhone ? rawPhone.replace(/[^\d+]/g, '') : null;

    const isDuplicate = existingNames.has(rawName.toLowerCase());

    results.push({
      id: `row-${r}-${Date.now()}`,
      full_name: rawName,
      batch,
      phone_number: phone_number || null,
      isValid: rawName.length >= 2,
      isDuplicate,
      error: rawName.length < 2 ? 'Name too short' : undefined,
      selected: !isDuplicate && rawName.length >= 2
    });
  }

  return results;
}

/**
 * Parse PDF ArrayBuffer into parsed student rows
 */
export async function parsePdfBuffer(
  buffer: ArrayBuffer,
  defaultBatch: string = 'plus one A',
  existingNames: Set<string> = new Set()
): Promise<ParsedStudentRow[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const rawLines: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by vertical position (Y coordinate) to form coherent lines
    const lineMap = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of textContent.items as any[]) {
      const text = item.str?.trim();
      if (!text) continue;

      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);

      // Allow a small vertical delta (3 units) to merge slightly offset text on same line
      let matchedY = y;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 4) {
          matchedY = existingY;
          break;
        }
      }

      if (!lineMap.has(matchedY)) {
        lineMap.set(matchedY, []);
      }
      lineMap.get(matchedY)!.push({ x, text });
    }

    // Sort lines by Y descending (top of page to bottom)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const items = lineMap.get(y)!;
      // Sort items within line by X ascending (left to right)
      items.sort((a, b) => a.x - b.x);
      const lineText = items.map(i => i.text).join('   ').trim();
      if (lineText.length > 0) {
        rawLines.push(lineText);
      }
    }
  }

  const results: ParsedStudentRow[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Filter out common PDF headers, footers, pagination
    if (/^(page\s*\d+|sl\s*no|roll\s*no|student\s*list|edupark|date:)/i.test(line)) {
      continue;
    }

    // Extract phone number (Indian 10-digit or +91 standard)
    const phoneMatch = line.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const phoneNumber = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : null;

    let lineWithoutPhone = phoneMatch ? line.replace(phoneMatch[0], '') : line;

    // Detect batch pattern (plus one A, plus one B, Batch 13, etc.)
    let batch = defaultBatch;
    if (/plus\s*one\s*A/i.test(lineWithoutPhone)) {
      batch = 'plus one A';
      lineWithoutPhone = lineWithoutPhone.replace(/plus\s*one\s*A/i, '');
    } else if (/plus\s*one\s*B/i.test(lineWithoutPhone)) {
      batch = 'plus one B';
      lineWithoutPhone = lineWithoutPhone.replace(/plus\s*one\s*B/i, '');
    } else if (/Batch\s*13/i.test(lineWithoutPhone)) {
      batch = 'Batch 13';
      lineWithoutPhone = lineWithoutPhone.replace(/Batch\s*13/i, '');
    }

    // Clean up student name: remove leading numbers like "1.", "1 -", "01"
    const cleanName = lineWithoutPhone
      .replace(/^[\d\.\-\)\s|,]+/, '')
      .replace(/[|,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Skip empty lines or lone symbols
    if (!cleanName || cleanName.length < 2) continue;

    // Skip headers
    if (/^(name|student|candidate|batch|phone|mobile|status|action)$/i.test(cleanName)) continue;

    const isDuplicate = existingNames.has(cleanName.toLowerCase());

    results.push({
      id: `pdf-row-${i}-${Date.now()}`,
      full_name: cleanName,
      batch,
      phone_number: phoneNumber,
      isValid: cleanName.length >= 2,
      isDuplicate,
      error: cleanName.length < 2 ? 'Name too short' : undefined,
      selected: !isDuplicate && cleanName.length >= 2
    });
  }

  return results;
}
