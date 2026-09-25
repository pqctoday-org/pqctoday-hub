// SPDX-License-Identifier: GPL-3.0-only
import type { CmvpApprovedAlgorithm, ComplianceRecord } from './types'

/**
 * CMVP certificate-page fields carried on FIPS records of
 * public/data/compliance-data.json (WS-4b, 2026-09-24). The private pipeline
 * parses them from each record's own CMVP certificate page
 * (pqctoday-priv scripts/enrich-cmvp-certificate-details.py); this module is
 * the Hub's reader-side contract.
 *
 * Every field is optional and nullable. `undefined` = the page was never
 * read; `null` = it was read and does not state the field. A value of the
 * wrong shape is read as `null`, never coerced into a guess, so the UI can
 * say "not stated" and link out to the certificate page instead.
 */
export const CMVP_DETAIL_FIELDS = [
  'sunsetDate',
  'overallLevel',
  'caveat',
  'embodiment',
  'moduleType',
  'operationalEnvironments',
  'cmvpStandard',
  'cmvpStatus',
  'cmvpHistoricalReason',
  'cmvpApprovedAlgorithms',
] as const

export type CmvpDetailField = (typeof CMVP_DETAIL_FIELDS)[number]

export interface CmvpDetails {
  sunsetDate: string | null
  overallLevel: number | null
  caveat: string | null
  embodiment: string | null
  moduleType: string | null
  operationalEnvironments: string[] | null
  cmvpStandard: string | null
  cmvpStatus: string | null
  cmvpHistoricalReason: string | null
  cmvpApprovedAlgorithms: CmvpApprovedAlgorithm[] | null
  /** UTC ISO timestamp of the page fetch, when the record carries one. */
  fetchedAt: string | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null

const nonEmptyStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((o) => typeof o === 'string' && o.trim() !== '')

const approvedList = (v: unknown): CmvpApprovedAlgorithm[] | null => {
  if (!Array.isArray(v)) return null
  const ok = v.every(
    (a) =>
      a !== null &&
      typeof a === 'object' &&
      typeof (a as CmvpApprovedAlgorithm).name === 'string' &&
      (a as CmvpApprovedAlgorithm).name.trim() !== '' &&
      Array.isArray((a as CmvpApprovedAlgorithm).cavpRefs) &&
      (a as CmvpApprovedAlgorithm).cavpRefs.every((r) => typeof r === 'string')
  )
  return ok
    ? (v as CmvpApprovedAlgorithm[]).map((a) => ({
        name: a.name.trim(),
        cavpRefs: [...a.cavpRefs],
      }))
    : null
}

/** True when the record carries any CMVP certificate-page field or the fetch stamp. */
export function hasCmvpDetails(record: Partial<ComplianceRecord>): boolean {
  return (
    record.cmvpDetailsFetchedAt !== undefined ||
    CMVP_DETAIL_FIELDS.some((f) => f in record && record[f as keyof ComplianceRecord] !== undefined)
  )
}

/** The record's CMVP page fields, reduced to the contract; null when it carries none. */
export function readCmvpDetails(record: Partial<ComplianceRecord>): CmvpDetails | null {
  if (!hasCmvpDetails(record)) return null
  const sunset = str(record.sunsetDate)
  const level = record.overallLevel
  const oes = record.operationalEnvironments
  const stamp = record.cmvpDetailsFetchedAt
  return {
    sunsetDate: sunset !== null && ISO_DATE.test(sunset) ? sunset : null,
    overallLevel:
      typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 4
        ? level
        : null,
    caveat: str(record.caveat),
    embodiment: str(record.embodiment),
    moduleType: str(record.moduleType),
    operationalEnvironments: nonEmptyStrings(oes) ? oes.map((o) => o.trim()) : null,
    cmvpStandard: str(record.cmvpStandard),
    cmvpStatus: str(record.cmvpStatus),
    cmvpHistoricalReason: str(record.cmvpHistoricalReason),
    cmvpApprovedAlgorithms: approvedList(record.cmvpApprovedAlgorithms),
    fetchedAt: typeof stamp === 'string' && ISO_TIMESTAMP.test(stamp) ? stamp : null,
  }
}

/**
 * Loader step: the record with its CMVP page fields reduced to the contract
 * above (malformed values become null). A record carrying none of them —
 * every non-FIPS record, and a FIPS record the pipeline has not reached — is
 * returned unchanged, so compliance-data.json files without the fields load
 * exactly as before.
 */
export function normalizeCmvpDetails<T extends Partial<ComplianceRecord>>(record: T): T {
  const details = readCmvpDetails(record)
  if (!details) return record
  const { fetchedAt, ...fields } = details
  const out: T = { ...record, ...fields }
  if (fetchedAt !== null) out.cmvpDetailsFetchedAt = fetchedAt
  else delete out.cmvpDetailsFetchedAt
  return out
}
