// SPDX-License-Identifier: GPL-3.0-only
/**
 * Monthly PQC-certification issuance trend (Product Records tab).
 *
 * `referenceDate` is injected rather than read from the clock — same reasoning
 * `progressModel.ts`'s `currentYear` param documents: it keeps the range
 * deterministic for tests and for the page's own "data as of" claim.
 */
import type { ComplianceRecord } from './types'

export interface MonthlyTrendPoint {
  month: string // 'YYYY-MM'
  fips: number
  acvp: number
  cc: number
  total: number
}

const CONFIRMED_PQC_ALGORITHMS = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS', 'HSS', 'XMSS', 'FALCON']

/**
 * True only when `pqcCoverage` names an actual PQC algorithm. Excludes the
 * boolean/empty/"No PQC Mechanisms Detected" cases by construction (none
 * contain a keyword), and deliberately excludes "Potentially PQC (Name
 * Match)" rows — a name-match hit, not a confirmed algorithm in the
 * certificate's validated scope.
 */
export function isConfirmedPqcAlgorithm(pqcCoverage: ComplianceRecord['pqcCoverage']): boolean {
  if (typeof pqcCoverage !== 'string') return false
  const upper = pqcCoverage.toUpperCase()
  return CONFIRMED_PQC_ALGORITHMS.some((keyword) => upper.includes(keyword))
}

/** Rows flagged only as a name-match, not a confirmed algorithm — tallied so the exclusion stays visible. */
export function isAmbiguousPqcMatch(pqcCoverage: ComplianceRecord['pqcCoverage']): boolean {
  return typeof pqcCoverage === 'string' && /potential/i.test(pqcCoverage)
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function nextMonth(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Buckets confirmed-PQC records by month and scheme — FIPS (140-2 and 140-3
 * merged; the raw JSON carries both, though only 140-3 is in `ComplianceType`),
 * ACVP, and CC (Common Criteria and EUCC merged, EUCC being the EU's CC
 * scheme). Zero-fills every month in `[startMonth, referenceDate's month]` so
 * a quiet month reads as zero, not as a gap in the axis.
 */
export function buildMonthlyPqcCertificationTrend(
  records: ComplianceRecord[],
  referenceDate: Date,
  startMonth = '2024-01'
): MonthlyTrendPoint[] {
  const endMonth = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`

  const buckets = new Map<string, MonthlyTrendPoint>()
  for (let ym = startMonth; ym <= endMonth; ym = nextMonth(ym)) {
    buckets.set(ym, { month: ym, fips: 0, acvp: 0, cc: 0, total: 0 })
  }

  for (const record of records) {
    if (!record.date || !isConfirmedPqcAlgorithm(record.pqcCoverage)) continue
    const bucket = buckets.get(monthKey(record.date))
    if (!bucket) continue // outside [startMonth, endMonth]

    if (record.type.startsWith('FIPS')) bucket.fips += 1
    else if (record.type === 'ACVP') bucket.acvp += 1
    else if (record.type === 'Common Criteria' || record.type === 'EUCC') bucket.cc += 1
    else continue

    bucket.total += 1
  }

  return [...buckets.values()]
}
