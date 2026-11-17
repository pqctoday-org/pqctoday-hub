// SPDX-License-Identifier: AGPL-3.0-only
import { rowsToCsv } from './csvExport'
/** Structured path/value export of the tool's actual input/result model.
 * Arrays retain their positions; narrative and source notes remain separate fields.
 */
export function decisionModelToCsv(model: Record<string, unknown>): string {
  const rows: (string | number)[][] = [['Field', 'Value']]
  function append(path: string, value: unknown): void {
    if (Array.isArray(value)) {
      if (!value.length) rows.push([path, '[]'])
      value.forEach((item, index) => append(`${path}[${index}]`, item))
    } else if (value !== null && typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => append(path ? `${path}.${key}` : key, item))
    } else {
      const cell = typeof value === 'number' ? value : value == null ? '' : String(value)
      rows.push([path, typeof cell === 'string' && /^[=+@\t\r-]/.test(cell) ? `'${cell}` : cell])
    }
  }
  append('', model)
  return rowsToCsv(rows)
}
