export interface CsvColumn<T> {
  key: string;
  header: string;
  get: (row: T) => string | number | boolean | null | undefined;
}

const BOM = "\uFEFF"; // UTF-8 BOM so Excel opens CSV with accents correctly

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : String(v);
  // Strip CR/LF and wrap in quotes if the cell contains special chars
  const clean = s.replace(/\r?\n/g, " ");
  if (/[",;]/.test(clean)) return `"${clean.replace(/"/g, '""')}"`;
  return clean;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escapeCell(c.get(r))).join(","))
    .join("\n");
  return `${BOM}${header}\n${body}`;
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = buildCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}`;
}
