// SPDX-License-Identifier: AGPL-3.0-only

export interface CsvColumnConfig<T> {
  header: string
  accessor: (item: T) => string | number | boolean | null | undefined
}

/**
 * Characters that make a spreadsheet treat a cell as a formula (or, for tab
 * and carriage return, can shift the cell into one). A leading apostrophe
 * keeps the text as text without changing what a reader sees.
 */
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

/**
 * RFC 4180 field escaping plus a formula-injection guard: a text cell that
 * starts with = + - @ tab or CR gets a leading apostrophe. Numbers pass
 * through unchanged, so a negative number stays a number.
 */
export function escapeCsvField(value: string | number | boolean): string {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  let text = value
  if (text.length > 0 && FORMULA_TRIGGERS.includes(text[0])) text = `'${text}`
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * One free-text preamble line for the top of an export: a single quoted CSV
 * cell, with the same formula guard as data cells, so text a reader typed
 * (a search query, say) cannot break the file or run as a formula.
 */
export function csvPreambleLine(text: string): string {
  const cell = escapeCsvField(text.replace(/\r?\n/g, ' '))
  return cell.startsWith('"') ? cell : `"${cell}"`
}

/** Generate a CSV string from an array of objects and column definitions */
export function generateCsv<T>(data: T[], columns: CsvColumnConfig<T>[]): string {
  const header = columns.map((col) => escapeCsvField(col.header)).join(',')
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = col.accessor(item)
        if (value === null || value === undefined) return ''
        return escapeCsvField(value)
      })
      .join(',')
  )
  return [header, ...rows].join('\n')
}

/** Download a CSV string as a file. Includes UTF-8 BOM for Excel compatibility. */
export function downloadCsv(csvContent: string, filename: string): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Get a date-stamped filename: `{prefix}-YYYY-MM-DD.csv` */
export function csvFilename(prefix: string, now = new Date()): string {
  // The reader's own calendar date, not UTC (toISOString shifts it a day
  // either side of midnight depending on time zone).
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${prefix}-${y}-${m}-${d}.csv`
}
