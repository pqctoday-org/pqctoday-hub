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
 * MC-5  pqc_certified and has_certification stay inside their vocabularies and
 *       do not contradict each other. Added 2026-09-26 with the columns: the
 *       verdict used to be a prose prefix on pqc_support, where a substring
 *       search could not tell a claim from its denial, and a free-text column
 *       would drift straight back to that.
 *
 * MC-6  A pqc_certified=yes row whose own note places PQC outside the approved
 *       boundary ("non-FIPS operating mode", "non-Approved mode"). The one
 *       false positive of 87 when the column was populated.
 *
 * MC-7  No cell holds its own column name (36 pqc_support cells in 4.124.1).
 *
 * Severity: MC-1, MC-4, MC-5 and MC-7 ERROR (identity / controlled vocabulary).
 * MC-2, MC-3 and MC-6 WARNING: legacy rows and prose heuristics are reported,
 * and the row-level fix goes through review.
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

const PQC_CERTIFIED_VALUES = new Set(['yes', 'partial', 'no', 'none', 'cavp', 'in_progress'])
const HAS_CERTIFICATION_VALUES = new Set([
  'yes',
  'no',
  'unknown',
  'component',
  'cavp',
  'in_progress',
])

/**
 * MC-5 — the two certification verdicts stay inside their vocabularies, and
 * stay consistent with each other.
 *
 * Added 2026-09-26 with the columns themselves. Before them the verdict lived
 * only as a prose prefix on pqc_support, where a substring search for
 * "CMVP"/"FIPS 140" could not distinguish a claim from its denial — a row
 * reading `No (CMVP certificate #5038 … contains no ML-KEM)` counted as
 * claiming a certification. A free-text column would drift back to exactly
 * that, so the vocabulary is pinned here.
 *
 * The consistency rule is deliberately narrow: claiming PQC certification
 * while asserting no certificate exists is a contradiction. Every other
 * pairing is legitimate, including the one these columns were added to
 * express — hasCertification=yes with pqcCertified=no, a product FIPS-validated
 * for classical algorithms only (11 active rows).
 *
 * FIPS 140-3 track stages (added 2026-09-26, user decision): `cavp` = the
 * algorithms are CAVP-validated — the PREREQUISITE, not a certificate;
 * `in_progress` = NIST lists the module as Modules In Process / IUT (never
 * inferred from CAVP); `yes` = a certificate is held. Neither stage is a
 * certification, so a PQC-certification claim (pqc_certified yes/partial)
 * beside either is the same contradiction as beside `no`.
 *
 * `component` (added 2026-09-26, WS-D) means the product relies on a validated
 * module it embeds but holds no certificate itself — a cloud KMS whose HSM is
 * validated. pqcCertified describes the PRODUCT's own certification, so
 * claiming PQC certification alongside `component` is the same contradiction
 * as alongside `no`: a certificate is being claimed that the row says the
 * product does not hold.
 */
export function checkCertificationVerdicts(rows: CsvRow[], file: string): Finding[] {
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    if (!isActive(row)) return
    const pc = (row.pqc_certified || '').trim().toLowerCase()
    const hc = (row.has_certification || '').trim().toLowerCase()
    if (!PQC_CERTIFIED_VALUES.has(pc)) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'pqc_certified',
        value: row.pqc_certified || '',
        message: `${row.product_id}: pqc_certified must be one of ${[...PQC_CERTIFIED_VALUES].join('|')}`,
      })
    }
    if (!HAS_CERTIFICATION_VALUES.has(hc)) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'has_certification',
        value: row.has_certification || '',
        message: `${row.product_id}: has_certification must be one of ${[...HAS_CERTIFICATION_VALUES].join('|')}`,
      })
    }
    if (
      (pc === 'yes' || pc === 'partial') &&
      (hc === 'no' || hc === 'component' || hc === 'cavp' || hc === 'in_progress')
    ) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'pqc_certified',
        value: `${pc} / ${hc}`,
        message:
          hc === 'component'
            ? `${row.product_id}: claims PQC certification (${pc}) but has_certification says only an embedded module is validated`
            : hc === 'cavp' || hc === 'in_progress'
              ? `${row.product_id}: claims PQC certification (${pc}) but has_certification is only the ${hc} stage of FIPS 140-3 — not a certificate`
              : `${row.product_id}: claims PQC certification (${pc}) while has_certification says no certificate exists`,
      })
    }
  })
  return findings
}

/**
 * MC-6 — a full PQC certification claim whose own note places PQC OUTSIDE the
 * approved boundary.
 *
 * `Marvell LiquidSecurity 2` read "Yes (ML-KEM, ML-DSA in non-FIPS operating
 * mode; field-upgradable per CMVP #4703)" and was derived as
 * `pqc_certified=yes` purely because the note opens "Yes" and mentions CMVP —
 * 1 false positive in 87 when the column was first populated (2026-09-26). Its
 * sibling row `LS2 HSM Family`, describing the same hardware, was already
 * `partial`. Certificate #4703 correctly reports no PQC, because the PQC is
 * outside its boundary.
 *
 * WARNING rather than ERROR: this is a prose heuristic, and a legitimate note
 * could mention a non-approved mode in passing while still claiming approved
 * PQC elsewhere. It asks a question; it does not assert a defect.
 */
export function checkApprovedBoundaryClaims(rows: CsvRow[], file: string): Finding[] {
  const OUTSIDE = /non-?FIPS|non-?Approved|non-compliant service/i
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    if (!isActive(row)) return
    if ((row.pqc_certified || '').trim().toLowerCase() !== 'yes') return
    if (!OUTSIDE.test(row.pqc_support || '')) return
    findings.push({
      csv: file,
      row: i + 2,
      field: 'pqc_certified',
      value: 'yes',
      message: `${row.product_id}: pqc_certified=yes but the note places PQC outside the approved boundary — should this be partial?`,
    })
  })
  return findings
}

/**
 * MC-7 — no cell holds its own column name.
 *
 * Release 4.124.1 (2026-09-26) shipped 36 active rows whose pqc_support read
 * literally "pqc_support": the R3-16 review parser took the first backticked
 * token of "Corrected `pqc_support`: `Yes (…)`" — the column name — instead of
 * the value after the colon. Every other check passed, because "pqc_support"
 * is a non-empty string. A header value in a data cell is never data.
 */
export function checkColumnNameCells(rows: CsvRow[], file: string): Finding[] {
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    for (const [col, value] of Object.entries(row)) {
      if (col && (value || '').trim() === col) {
        findings.push({
          csv: file,
          row: i + 2,
          field: col,
          value,
          message: `${row.product_id}: ${col} holds its own column name — a writer put the header where the value belongs`,
        })
      }
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

/**
 * MC-8 — a product name should not be the title of a web page (R3-9/R3-11).
 * M5 asked "is this row a duplicate?", never "is this row a product?", so a
 * uniquely wrong row — one scraped page title, no twin — passed. Warning, not
 * error: some real products have awkward names, and an error would need an
 * allowlist of its own. The patterns found all 6 cases in _r23 and 0 false
 * positives in _r5; tune them as false positives appear.
 */
const PAGE_TITLE_PATTERNS: [RegExp, string][] = [
  [/^(What is|How to|Why)\b/, 'article phrasing'],
  [/ - And /, 'article phrasing'],
  [/^Dashboard\b/, 'page section'],
  [/:\s*(Intro|Introduction|Overview|Getting Started)\b/, 'page section'],
  [/Info ?Hub/, 'hub/portal page'],
  [/Roadmap$/, 'roadmap page'],
  [/ & .* - /, 'mangled dual name'],
  [/\b(Blog|Press Release|White ?[Pp]aper)\b/, 'publication word'],
]

export function checkNameShape(rows: CsvRow[], file: string): Finding[] {
  const findings: Finding[] = []
  rows.forEach((row, i) => {
    if (!isActive(row)) return
    const name = (row.software_name || '').trim()
    const hit = PAGE_TITLE_PATTERNS.find(([re]) => re.test(name))
    if (hit) {
      findings.push({
        csv: file,
        row: i + 2,
        field: 'software_name',
        value: name,
        message: `${row.product_id}: software_name looks like a page title (${hit[1]}) — is this row a product?`,
      })
    }
  })
  return findings
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
    result(
      'MC-5',
      'Certification verdicts use their controlled vocabulary and agree with each other',
      'ERROR',
      file,
      checkCertificationVerdicts(rows, file)
    ),
    result(
      'MC-6',
      'No pqc_certified=yes row places its PQC outside the approved boundary',
      'WARNING',
      file,
      checkApprovedBoundaryClaims(rows, file)
    ),
    result(
      'MC-7',
      'No migrate catalogue cell holds its own column name',
      'ERROR',
      file,
      checkColumnNameCells(rows, file)
    ),
    result(
      'MC-8',
      'An active migrate software_name is a product name, not a scraped page title',
      'WARNING',
      file,
      checkNameShape(rows, file)
    ),
  ]
}
