// SPDX-License-Identifier: GPL-3.0-only
/**
 * Synchronous loader for the algorithm reference CSV, exposing only the
 * trust-relevant fields (peer review, vetting body, FIPS standard) needed
 * by `trustScoreData.ts`. The full algorithm detail loader in
 * `pqcAlgorithmsData.ts` is async and cannot be consumed by the eagerly-
 * initialised trust-score module.
 */
import { loadLatestCSV } from './csvUtils'
import type { PeerReviewStatus } from './trustScore/types'

const modules = import.meta.glob('./pqc_complete_algorithm_reference_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawAlgorithmTrustRow {
  algorithm: string
  fips_standard: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
}

export interface AlgorithmTrustFields {
  peerReviewed?: PeerReviewStatus
  vettingBody: string[]
  fipsStandard: string
  trustedSourceId: string
}

function normalisePeerReview(raw: string): PeerReviewStatus | undefined {
  const v = (raw || '').trim().toLowerCase()
  if (v === 'yes' || v === 'no' || v === 'partial') return v
  return undefined
}

function splitVettingBody(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const { data: rows } = loadLatestCSV<RawAlgorithmTrustRow, AlgorithmTrustFields & { name: string }>(
  modules,
  /pqc_complete_algorithm_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    name: row.algorithm,
    peerReviewed: normalisePeerReview(row.peer_reviewed),
    vettingBody: splitVettingBody(row.vetting_body),
    fipsStandard: (row.fips_standard || '').trim(),
    trustedSourceId: (row.trusted_source_id || '').trim(),
  })
)

/** Lookup: algorithm name → trust-relevant fields. */
export const algorithmTrustByName: Map<string, AlgorithmTrustFields> = new Map(
  rows.map((r) => [r.name, r])
)
