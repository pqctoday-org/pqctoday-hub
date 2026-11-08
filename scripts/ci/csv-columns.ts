#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * scripts/ci/csv-columns.ts — every data CSV parses, and every row has as many
 * columns as its header.
 *
 * WHY. A quiz row with an unquoted comma in a text field has one column more
 * than the header. Nothing rejected it, so the extra column shifted every later
 * field in that row. This check reads each file with a real CSV parser
 * (papaparse, the parser the site uses), so quoted commas and quoted line
 * breaks count correctly, and reports the rows that do not fit.
 *
 * WHAT IT CHECKS. Every `.csv` under `src/data`, except `src/data/archive`
 * (frozen older versions that are kept as they were). Per file: the header
 * line is the first non-empty row; every later non-empty row must have the
 * same number of columns; the parser must not report a quoting error.
 *
 * OUTPUT. File, line (the line the row starts on), expected and actual column
 * counts. It never prints the cell text.
 *
 * Usage:
 *   tsx scripts/ci/csv-columns.ts            # scans src/data, exits 1 on any problem
 *   tsx scripts/ci/csv-columns.ts <dir>...   # scans the given folders instead
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import Papa from 'papaparse'

export interface CsvProblem {
  file: string
  /** 1-based line the offending row starts on. */
  line: number
  kind: 'columns' | 'parse'
  expected?: number
  actual?: number
  /** Parser error code, for `parse` problems. */
  code?: string
}

/** Folders under the scanned root that are skipped (frozen older versions). */
const SKIPPED_DIRS = new Set(['archive'])

/** Start offset of every line, so a character offset maps to a line number. */
function lineStarts(text: string): number[] {
  const starts = [0]
  const newline = /\r\n|\n|\r/g
  let m: RegExpExecArray | null
  while ((m = newline.exec(text)) !== null) starts.push(m.index + m[0].length)
  return starts
}

function lineAt(starts: number[], offset: number): number {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo + 1
}

/** Checks one CSV text. `file` is only a label for the report. */
export function checkCsvText(rawText: string, file: string): CsvProblem[] {
  const text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText
  const starts = lineStarts(text)
  const problems: CsvProblem[] = []
  let expected = -1
  let rowStart = 0

  Papa.parse<string[]>(text, {
    delimiter: ',',
    step: (result) => {
      const startLine = lineAt(starts, rowStart)
      rowStart = result.meta.cursor
      for (const err of result.errors) {
        problems.push({ file, line: startLine, kind: 'parse', code: err.code })
      }
      const row = result.data
      // A blank line is not a row (the site skips them too).
      if (row.length === 1 && row[0] === '') return
      if (expected < 0) {
        expected = row.length
        return
      }
      if (row.length !== expected) {
        problems.push({ file, line: startLine, kind: 'columns', expected, actual: row.length })
      }
    },
  })
  return problems
}

function isSkipped(name: string): boolean {
  return SKIPPED_DIRS.has(name)
}

/** Every `.csv` under `dir`, skipping archive folders, in a stable order. */
export function listCsvFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (current: string): void => {
    const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    for (const entry of entries) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) {
        if (!isSkipped(entry.name)) walk(path)
      } else if (entry.isFile() && entry.name.endsWith('.csv')) {
        out.push(path)
      }
    }
  }
  walk(dir)
  return out
}

/** Checks every CSV under `dir`; problem files are labelled relative to `base`. */
export function checkCsvTree(dir: string, base: string = process.cwd()): CsvProblem[] {
  const problems: CsvProblem[] = []
  for (const path of listCsvFiles(dir)) {
    problems.push(...checkCsvText(readFileSync(path, 'utf8'), relative(base, path)))
  }
  return problems
}

export function formatProblem(p: CsvProblem): string {
  if (p.kind === 'columns') {
    return `${p.file}:${p.line}: expected ${p.expected} columns, found ${p.actual}`
  }
  return `${p.file}:${p.line}: CSV parse error (${p.code})`
}

function main(): void {
  const roots = process.argv.slice(2)
  const targets = roots.length > 0 ? roots : ['src/data']
  const problems = targets.flatMap((t) => checkCsvTree(t))
  if (problems.length === 0) {
    console.log(`csv-columns: every row has the header's column count (${targets.join(', ')})`)
    return
  }
  for (const p of problems) console.error(formatProblem(p))
  console.error(`csv-columns: ${problems.length} problem(s)`)
  process.exit(1)
}

if (process.argv[1] && /csv-columns\.ts$/.test(process.argv[1])) main()
