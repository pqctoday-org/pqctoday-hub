// SPDX-License-Identifier: GPL-3.0-only
import Papa from 'papaparse'

// ── Types ────────────────────────────────────────────────────────────────────

interface CSVFileEntry {
  path: string
  date: Date
  revision: number
  content: string
}

export interface CSVMetadata {
  filename: string
  lastUpdate: Date
}

export interface CSVLoadResult<T> {
  data: T[]
  previousData: T[] | null
  metadata: CSVMetadata | null
}

// ── Core loader ──────────────────────────────────────────────────────────────

/**
 * Sorts glob-resolved CSV files by date (descending) then revision (descending),
 * parses the latest (and optionally previous) with PapaParse `header: true`,
 * and transforms each row via a caller-supplied function.
 *
 * @param modules     - Result of `import.meta.glob('...*.csv', { query: '?raw', import: 'default', eager: true })`
 * @param regex       - Filename regex with capture groups: (MM)(DD)(YYYY) and optional (revision).
 *                      Groups must be in that order. Revision group may be absent.
 * @param transform   - Maps a raw PapaParse row (Record<string,string>) to the target type.
 *                      Return `null` to skip a row.
 * @param withPrevious - If `true`, also parse the second-latest file for status-badge comparison.
 */
export function loadLatestCSV<TRaw extends Record<string, string>, T>(
  modules: Record<string, unknown>,
  regex: RegExp,
  transform: (raw: TRaw, index: number) => T | null,
  withPrevious = false,
  expectedHeaders?: (keyof TRaw)[]
): CSVLoadResult<T> {
  const files = sortCSVFiles(modules, regex)

  if (files.length === 0) {
    return { data: [], previousData: null, metadata: null }
  }

  const fname = files[0].path.split('/').pop() || files[0].path
  const headers = expectedHeaders as string[] | undefined
  const data = parseCSV<TRaw, T>(files[0].content, transform, headers, fname)
  const previousData =
    withPrevious && files.length > 1 ? parseCSV<TRaw, T>(files[1].content, transform) : null

  return {
    data,
    previousData,
    metadata: {
      filename: files[0].path.split('/').pop() || files[0].path,
      lastUpdate: files[0].date,
    },
  }
}

/**
 * Async variant for lazy-loaded globs (`eager` omitted / `false`).
 * Loads only the latest file.
 */
export async function loadLatestCSVAsync<TRaw extends Record<string, string>, T>(
  modules: Record<string, unknown>,
  regex: RegExp,
  transform: (raw: TRaw, index: number) => T | null,
  expectedHeaders?: (keyof TRaw)[]
): Promise<CSVLoadResult<T>> {
  const sorted = sortCSVFiles(modules, regex)

  if (sorted.length === 0) {
    return { data: [], previousData: null, metadata: null }
  }

  // For lazy globs the value is a loader function, not the content itself
  const entry = sorted[0]
  const content =
    typeof entry.content === 'string'
      ? entry.content
      : await (modules[entry.path] as () => Promise<string>)()

  const fname = entry.path.split('/').pop() || entry.path
  const headers = expectedHeaders as string[] | undefined
  const data = parseCSV<TRaw, T>(content, transform, headers, fname)

  return {
    data,
    previousData: null,
    metadata: {
      filename: entry.path.split('/').pop() || entry.path,
      lastUpdate: entry.date,
    },
  }
}

// ── Internals ────────────────────────────────────────────────────────────────

function sortCSVFiles(modules: Record<string, unknown>, regex: RegExp): CSVFileEntry[] {
  const files = Object.keys(modules)
    .map((path): CSVFileEntry | null => {
      const match = path.match(regex)
      if (!match) return null

      // Find MM, DD, YYYY groups — always the first 3 numeric capture groups
      const groups = match.slice(1)
      const month = parseInt(groups[0], 10)
      const day = parseInt(groups[1], 10)
      const year = parseInt(groups[2], 10)
      // Revision is the 4th group if present
      const revision = groups[3] ? parseInt(groups[3], 10) : 0

      return {
        path,
        date: new Date(year, month - 1, day),
        revision,
        content: modules[path] as string,
      }
    })
    .filter((f): f is CSVFileEntry => f !== null)

  // Sort by date descending, then revision descending
  files.sort((a, b) => {
    const timeDiff = b.date.getTime() - a.date.getTime()
    if (timeDiff !== 0) return timeDiff
    return b.revision - a.revision
  })

  return files
}

function parseCSV<TRaw extends Record<string, string>, T>(
  content: string,
  transform: (raw: TRaw, index: number) => T | null,
  expectedHeaders?: string[],
  filename?: string
): T[] {
  const { data, meta } = Papa.parse(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  if (import.meta.env.DEV && meta.fields) {
    // Check for blank header columns (trailing commas)
    const blanks = meta.fields.filter((f) => !f.trim())
    if (blanks.length > 0) {
      console.warn('[CSV] Found blank header column(s) — check CSV for trailing commas')
    }

    // Schema validation: check expected vs actual headers
    if (expectedHeaders) {
      const tag = filename ? `[CSV ${filename}]` : '[CSV]'
      const missing = expectedHeaders.filter((h) => !meta.fields!.includes(h))
      const extra = meta.fields.filter((h) => h.trim() && !expectedHeaders.includes(h))
      if (missing.length) console.warn(`${tag} missing columns:`, missing)
      if (extra.length) console.warn(`${tag} unexpected columns:`, extra)
    }
  }

  return (data as TRaw[])
    .map((row, i) => transform(row, i))
    .filter((item): item is T => item !== null)
}

// ── Shared transform helpers ─────────────────────────────────────────────────

/** Split a semicolon-delimited string into a trimmed, non-empty array. */
export function splitSemicolon(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Split a pipe-delimited string into a trimmed, non-empty array. */
export function splitPipe(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Parse "Yes"/"No" string to boolean (case-insensitive, defaults to false). */
export function parseBoolYesNo(val: string | undefined): boolean {
  return val?.toLowerCase() === 'yes'
}

/** Parse a string to integer, returning 0 for unparseable values. */
export function parseIntSafe(val: string | undefined): number {
  if (!val) return 0
  const n = parseInt(val, 10)
  return isNaN(n) ? 0 : n
}

/** Parse a string to integer, returning null for 'N/A' or unparseable values. */
export function parseIntOrNull(val: string | undefined): number | null {
  if (!val || val === 'N/A') return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}
