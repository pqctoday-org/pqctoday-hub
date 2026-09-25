// SPDX-License-Identifier: GPL-3.0-only
/**
 * migrate-catalog-integrity.ts — MC-1 … MC-3
 *
 * Row-level integrity checks for the /migrate product catalogue, added by the
 * migrate remediation plan r2 (pqctoday-priv/nextfeature/
 * product-migrate-maintenance-remediation-plan-09242026-r2.md, Horizon 1 M0).
 *
 * MC-1  product_id is unique among ACTIVE rows, compared case-insensitively.
 *       D6 only checks software_name, and add_row.py compared ids
 *       case-sensitively, so two distinct NESLIB products whose ids differed
 *       only by case shipped side by side. The Workbench selection store keys
 *       products by a lower-cased id (migrateKey()), so a case-only pair
 *       collides there even though every exact-match check passes.
 *
 * MC-2  release_date is a real date and not in the future. Three active rows
 *       carried "2027-01-01", "2026-10-01" and "Continuous"; the trust score's
 *       temporal-freshness dimension takes the newest of its dates, so a future
 *       release date inflated it.
 *
 * MC-3  A row whose proof VALIDATED the absence of PQC (validation_result
 *       VALIDATED_NO_PQC) must not also claim PQC exists
 *       (pqc_status_canonical available/partial/roadmap/planned). One of the
 *       two fields is wrong, and the UI shows the no-PQC badge next to a PQC
 *       status.
 *
 * MC-4  A product whose software_name changed since the previous catalogue
 *       generation carries its old name in former_names. Saved selections,
 *       share links and search chunks store names; the loader resolves every
 *       former name to the product_id, so a correction never detaches them.
 *       (Plan r2 W-B1: no rename before the name joins are safe.)
 *
 * Severity: MC-1 and MC-4 ERROR (identity). MC-2 and MC-3 WARNING: legacy
 * rows are reported, and the row-level fix goes through review.
 */

import fs from 'fs'
import path from 'path'
import { getDataDir, loadCSV, readCSV } from './data-loader.js'
import type { CheckResult, CsvRow, Finding } from './types.js'

const PQC_CLAIMING = new Set(['available', 'partial', 'roadmap', 'planned'])

function isActive(row: CsvRow): boolean {
  const s = (row.status || '').trim().toLowerCase()
  return s === '' || s === 'active'
}

function result(
  id: string,
  description: string,
  severity: CheckResult['severity'],
  file: string,
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: id === 'MC-1' ? 'duplicate' : 'structure',
    description,
    sourceA: file || 'pqc_product_catalog_*.csv',
    sourceB: null,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

/** MC-1 — case-insensitive product_id uniqueness among active rows. */
export function checkProductIdUniqueness(rows: CsvRow[], file: string): Finding[] {
  const seen = new Map<string, { row: number; id: string }>()
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    const id = (row.product_id || '').trim()
    if (!id || !isActive(row)) return
    const key = id.toLowerCase()
    const first = seen.get(key)
    if (first) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'product_id',
        value: id,
        message:
          first.id === id
            ? `Duplicate active product_id "${id}" (first at row ${first.row})`
            : `Active product_id "${id}" differs only by case from "${first.id}" (row ${first.row})`,
      })
    } else {
      seen.set(key, { row: i + 2, id })
    }
  })
  return findings
}

/** YYYY, YYYY-MM or YYYY-MM-DD, digits only. */
function isPartialIsoDate(v: string): boolean {
  const [y, m, d, ...rest] = v.split('-')
  const digits = (p: string | undefined, n: number) =>
    p === undefined || (p.length === n && /^\d+$/.test(p))
  return rest.length === 0 && y.length === 4 && digits(y, 4) && digits(m, 2) && digits(d, 2)
}

/** MC-2 — release_date must parse as YYYY[-MM[-DD]] and not lie after `today`. */
export function checkReleaseDates(rows: CsvRow[], file: string, today: string): Finding[] {
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    const v = (row.release_date || '').trim()
    if (!v || !isActive(row)) return
    if (!isPartialIsoDate(v)) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'release_date',
        value: v,
        message: `release_date "${v}" is not a date (row ${row.product_id})`,
      })
    } else if (v > today) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'release_date',
        value: v,
        message: `release_date "${v}" is in the future (row ${row.product_id}) — an expected date is not a release`,
      })
    }
  })
  return findings
}

/** MC-3 — VALIDATED_NO_PQC must not coexist with a PQC-claiming canonical status. */
export function checkNoPqcConsistency(rows: CsvRow[], file: string): Finding[] {
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    if (!isActive(row)) return
    const vr = (row.validation_result || '').trim().toUpperCase()
    const status = (row.pqc_status_canonical || '').trim().toLowerCase()
    if (vr === 'VALIDATED_NO_PQC' && PQC_CLAIMING.has(status)) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'pqc_status_canonical',
        value: status,
        message: `${row.product_id}: proof validated NO PQC but pqc_status_canonical says "${status}"`,
      })
    }
  })
  return findings
}

/** MC-4 — a changed software_name must appear in the new row's former_names. */
export function checkRenamesKeepFormerNames(
  previous: CsvRow[],
  current: CsvRow[],
  file: string
): Finding[] {
  const before = new Map(
    previous.filter((r) => r.product_id).map((r) => [r.product_id, (r.software_name || '').trim()])
  )
  const findings: Finding[] = []
  current.forEach((row, i) => {
    if (!isActive(row)) return
    const old = before.get(row.product_id)
    const now = (row.software_name || '').trim()
    if (!old || old === now) return
    const former = (row.former_names || '').split(';').map((n) => n.trim())
    if (!former.includes(old)) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'former_names',
        value: row.former_names || '',
        message: `${row.product_id}: software_name changed from "${old}" to "${now}" but "${old}" is not in former_names`,
      })
    }
  })
  return findings
}

/** The generation before the latest pqc_product_catalog file, by date then _rN. */
function previousCatalog(): CsvRow[] {
  const prefix = 'pqc_product_catalog_'
  const dir = getDataDir()
  const gens = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
    .map((f) => {
      const [date, rev = ''] = f.slice(prefix.length, -'.csv'.length).split('_r')
      return { f, date, rev }
    })
    .filter(({ date, rev }) => /^\d{8}$/.test(date) && /^\d*$/.test(rev))
    .map(({ f, date, rev }) => ({
      f,
      key: `${date.slice(4)}${date.slice(0, 4)}-${rev.padStart(3, '0')}`,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
  const prev = gens.at(-2)
  return prev ? readCSV(path.join(dir, prev.f)) : []
}

export function runMigrateCatalogIntegrity(
  today: string = new Date().toISOString().slice(0, 10)
): CheckResult[] {
  const { rows, file } = loadCSV('pqc_product_catalog_')
  return [
    result(
      'MC-1',
      'Active migrate product_id values are unique, case-insensitively',
      'ERROR',
      file,
      checkProductIdUniqueness(rows, file)
    ),
    result(
      'MC-2',
      'Active migrate release_date values are dates and not in the future',
      'WARNING',
      file,
      checkReleaseDates(rows, file, today)
    ),
    result(
      'MC-4',
      'A renamed migrate product keeps its old name in former_names',
      'ERROR',
      file,
      checkRenamesKeepFormerNames(previousCatalog(), rows, file)
    ),
    result(
      'MC-3',
      'No active migrate row is both VALIDATED_NO_PQC and PQC-claiming',
      'WARNING',
      file,
      checkNoPqcConsistency(rows, file)
    ),
  ]
}
