// SPDX-License-Identifier: GPL-3.0-only
/**
 * Build RFC-4180 CSV from a 2D array of cells.
 *
 * Tools that offer a `.csv` export must produce structured rows from their own
 * data model and pass the result as `csvData` to `ExportableArtifact` — NOT
 * rely on the markdown export being saved with a `.csv` extension (which opens
 * in a spreadsheet as a single column of `| a | b |` pipe text).
 *
 * Quoting rules (RFC-4180): a cell is wrapped in double quotes iff it contains
 * a comma, a double quote, CR, or LF; embedded double quotes are doubled. Rows
 * are terminated with CRLF.
 */
export function rowsToCsv(rows: ReadonlyArray<ReadonlyArray<string | number>>): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

function csvCell(value: string | number): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
