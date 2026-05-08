// SPDX-License-Identifier: GPL-3.0-only
/**
 * counterClaimsData — T09 of the Trust Engine implementation plan.
 *
 * Loads `src/data/counter_claims_*.csv` (latest dated). Each row records a
 * Tier-1 source disagreement attached to a specific record (e.g. NSA
 * CNSA 2.0 vs ANSSI hybrid-acceptance on the CNSA-2.0 compliance row).
 *
 * Per §16.3 #11 of trust-engine-explainability.md:
 *   "Counter-claim mode. Allow a record to be flagged with a counter-claim
 *   from another authoritative source and render both side-by-side instead
 *   of resolving to a single value. Honest about disagreement among Tier-1
 *   sources (e.g. NSA vs ANSSI on hybrid-only acceptance)."
 */
import { loadLatestCSV } from './csvUtils'

export type CounterClaimRecordType =
  | 'compliance'
  | 'library'
  | 'timeline'
  | 'migrate'
  | 'threats'
  | 'algorithm'

export interface CounterClaim {
  claimId: string
  recordType: CounterClaimRecordType
  recordId: string
  competingSourceId: string
  competingValue: string
  disagreementSummary: string
  verifiedBy: string
  verifiedDate: string
  peerReviewed?: 'yes' | 'no' | 'partial'
}

interface RawCounterClaimRow {
  claim_id: string
  record_type: string
  record_id: string
  competing_source_id: string
  competing_value: string
  disagreement_summary: string
  verified_by: string
  verified_date: string
  peer_reviewed?: string
}

const modules = import.meta.glob('./counter_claims_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data, metadata } = loadLatestCSV<RawCounterClaimRow, CounterClaim>(
  modules,
  /counter_claims_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    claimId: row.claim_id,
    recordType: row.record_type as CounterClaimRecordType,
    recordId: row.record_id,
    competingSourceId: row.competing_source_id,
    competingValue: row.competing_value,
    disagreementSummary: row.disagreement_summary,
    verifiedBy: row.verified_by,
    verifiedDate: row.verified_date,
    peerReviewed: (row.peer_reviewed?.toLowerCase() as CounterClaim['peerReviewed']) || undefined,
  })
)

/** All counter-claim records. */
export const counterClaims: CounterClaim[] = data

/** CSV file metadata. */
export const counterClaimsMetadata = metadata

/**
 * Lookup: every counter-claim attached to a given (recordType, recordId).
 * A record may have multiple competing sources.
 */
const _index: Map<string, CounterClaim[]> = (() => {
  const m = new Map<string, CounterClaim[]>()
  for (const c of counterClaims) {
    const key = `${c.recordType}:${c.recordId}`
    const list = m.get(key) ?? []
    list.push(c)
    m.set(key, list)
  }
  return m
})()

export function getCounterClaims(
  recordType: CounterClaimRecordType,
  recordId: string
): CounterClaim[] {
  return _index.get(`${recordType}:${recordId}`) ?? []
}

export function hasCounterClaim(recordType: CounterClaimRecordType, recordId: string): boolean {
  return _index.has(`${recordType}:${recordId}`)
}
