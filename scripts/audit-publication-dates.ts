#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-publication-dates.ts
 *
 * Guards the three columns that mean "the date the SOURCE DOCUMENT was
 * published" against being filled with the date we ingested the row instead.
 *
 * The incident this exists to prevent recurring: pqctoday-priv's add_row.py
 * wrote `datetime.now()` into library's initial_publication_date, timeline's
 * SourceDate and vendor-roadmaps' publish_date at row-creation time, and no
 * enrichment script ever revisited the value. On 2026-08-11 that left a 2000
 * ISO standard, a 2005 ARINC report and a 2016 NIST SP all claiming to have
 * been published on their intake day. Nothing failed. The Library's ordering
 * and every freshness signal derived from these columns were quietly wrong for
 * as long as the rows existed — the stalest documents in the catalog scored as
 * the freshest, because "published today" is what the data said.
 *
 * Two checks, both deliberately cheap and offline:
 *
 *   1. NO_FUTURE — a publication date after today is impossible. This is the
 *      one that catches a stamp written by a clock ahead of the CSV's own date.
 *   2. NO_INTAKE_CLUSTER — a source document's publication date is a property
 *      of the document, so dates should scatter. When many rows in one source
 *      share a single exact day, that day is almost always an ingest batch. The
 *      threshold is generous: real same-day clusters exist (an RFC batch, a
 *      standards body publishing a multi-part spec), so this fails only on
 *      clusters well beyond what publishing produces, and every allowed cluster
 *      must be listed in KNOWN_CLUSTERS with a reason.
 *
 * Usage:
 *   npx tsx scripts/audit-publication-dates.ts          # human report
 *   npx tsx scripts/audit-publication-dates.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — no future dates, no unexplained same-day cluster
 *   1 — at least one violation
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')

/** Above this many active rows sharing one exact day, a cluster is reported. */
export const CLUSTER_THRESHOLD = 12

interface SourceSpec {
  name: string
  prefix: string
  dateColumn: string
  idColumn: string
}

const SOURCES: SourceSpec[] = [
  {
    name: 'library',
    prefix: 'library_',
    dateColumn: 'initial_publication_date',
    idColumn: 'reference_id',
  },
  { name: 'timeline', prefix: 'timeline_', dateColumn: 'SourceDate', idColumn: 'event_id' },
  {
    name: 'vendor-roadmaps',
    prefix: 'migrate_vendor_roadmap_',
    dateColumn: 'publish_date',
    idColumn: 'vendor_id',
  },
]

/**
 * Same-day clusters that are genuine publishing events, not ingest batches.
 * Add an entry only after checking the rows actually share a publisher and a
 * release — never to silence a batch that turned out to be stamped.
 */
export const KNOWN_CLUSTERS: Record<string, string> = {}

/** Minimal RFC 4180 reader — enough for these files, no dependency. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') field += ch
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const header = rows.shift()
  if (!header) return []
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

function latestCsv(prefix: string): string | null {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
    .sort()
  return files.length ? path.join(DATA_DIR, files[files.length - 1]) : null
}

export interface Violation {
  source: string
  kind: 'NO_FUTURE' | 'NO_INTAKE_CLUSTER'
  detail: string
  ids: string[]
}

export function auditSource(spec: SourceSpec, today: string): Violation[] {
  const file = latestCsv(spec.prefix)
  if (!file) return []
  const rows = parseCsv(fs.readFileSync(file, 'utf8')).filter(
    (r) => (r.status || 'active').trim() === 'active'
  )
  const violations: Violation[] = []

  const future = rows.filter((r) => {
    const v = (r[spec.dateColumn] || '').trim()
    return v.length >= 4 && v > today
  })
  if (future.length) {
    violations.push({
      source: spec.name,
      kind: 'NO_FUTURE',
      detail: `${future.length} row(s) claim a publication date after today (${today})`,
      ids: future.map((r) => `${r[spec.idColumn]} = ${r[spec.dateColumn]}`),
    })
  }

  // Only full YYYY-MM-DD values can form an ingest cluster; a month or year is
  // a precision statement, and many documents legitimately share one.
  const byDay = new Map<string, string[]>()
  for (const r of rows) {
    const v = (r[spec.dateColumn] || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) continue
    byDay.set(v, [...(byDay.get(v) ?? []), String(r[spec.idColumn])])
  }
  for (const [day, ids] of byDay) {
    if (ids.length <= CLUSTER_THRESHOLD) continue
    if (KNOWN_CLUSTERS[`${spec.name}:${day}`]) continue
    violations.push({
      source: spec.name,
      kind: 'NO_INTAKE_CLUSTER',
      detail:
        `${ids.length} active rows share the exact date ${day} — publication dates ` +
        `scatter, ingest batches do not. Verify against each document, or add ` +
        `"${spec.name}:${day}" to KNOWN_CLUSTERS with a reason.`,
      ids: ids.slice(0, 15),
    })
  }
  return violations
}

function main(): void {
  const json = process.argv.includes('--json')
  const today = new Date().toISOString().slice(0, 10)
  const violations = SOURCES.flatMap((s) => auditSource(s, today))

  if (json) {
    console.log(JSON.stringify({ today, violations }, null, 2))
  } else if (!violations.length) {
    console.log(
      `PASS publication dates: no future dates and no unexplained same-day cluster ` +
        `across ${SOURCES.map((s) => s.name).join(', ')}`
    )
  } else {
    console.error(`FAIL ${violations.length} publication-date violation(s):\n`)
    for (const v of violations) {
      console.error(`  [${v.kind}] ${v.source} — ${v.detail}`)
      for (const id of v.ids) console.error(`      ${id}`)
      console.error('')
    }
    console.error(
      "These columns mean the SOURCE DOCUMENT's publication date, never our ingest date.\n" +
        'Re-derive with: pqctoday-priv/scripts/extract-publication-dates.py --source <name>\n'
    )
  }
  process.exit(violations.length ? 1 : 0)
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main()
