// SPDX-License-Identifier: GPL-3.0-only

export interface CsvColumnConfig<T> {
  header: string
  accessor: (item: T) => string | number | boolean | null | undefined
}

/** RFC 4180 compliant CSV field escaping */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Generate a CSV string from an array of objects and column definitions */
export function generateCsv<T>(data: T[], columns: CsvColumnConfig<T>[]): string {
  const header = columns.map((col) => escapeCsvField(col.header)).join(',')
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = col.accessor(item)
        if (value === null || value === undefined) return ''
        return escapeCsvField(String(value))
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
export function csvFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}-${date}.csv`
}
