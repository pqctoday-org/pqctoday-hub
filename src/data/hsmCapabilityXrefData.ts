// SPDX-License-Identifier: AGPL-3.0-only
import type { HsmAlgorithm, HsmCapabilityFact } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

// Glob import to find all matching HSM capability CSV files
const modules = import.meta.glob('./migrate_hsm_capability_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawHsmCapabilityRow {
  product_id: string
  software_name: string
  algorithm: string
  available: string
  pkcs11_mechanism: string
  mechanism_name: string
  cavp_cert: string
  approved_mode: string
  cmvp_cert_lists_it: string
  cmvp_cert: string
  verified_on: string
  source_url: string
  note: string
  verification_status: string
  status?: string
}

export const HSM_ALGORITHMS: readonly HsmAlgorithm[] = [
  'ML-KEM',
  'ML-DSA',
  'SLH-DSA',
  'LMS',
  'XMSS',
]

/** The closed vocabularies of the enumerated columns (anything else is a data error). */
export const HSM_VOCAB = {
  available: ['yes', 'no', 'preview', 'unknown'],
  pkcs11_mechanism: ['standard', 'vendor-defined', 'none', 'unknown'],
  approved_mode: ['yes', 'no', 'unknown'],
  cmvp_cert_lists_it: ['yes', 'no', 'unknown'],
} as const

/**
 * Columns whose raw value is outside the vocabulary. parseHsmCapabilityRow turns such a
 * value into 'unknown' so the UI never prints it; this reports it so a typo in the data
 * is caught by the data gate instead of being quietly downgraded.
 */
export function hsmVocabularyViolations(row: Record<string, string | undefined>): string[] {
  const bad: string[] = []
  for (const [column, allowed] of Object.entries(HSM_VOCAB)) {
    const v = (row[column] ?? '').trim().toLowerCase()
    if (!(allowed as readonly string[]).includes(v)) bad.push(column)
  }
  const algorithm = (row.algorithm ?? '').trim()
  if (!(HSM_ALGORITHMS as readonly string[]).includes(algorithm)) bad.push('algorithm')
  return bad
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  const v = (value ?? '').trim().toLowerCase()
  return (allowed.find((a) => a === v) ?? fallback) as T
}

/**
 * Raw CSV row to a fact. A value outside the vocabulary becomes 'unknown' rather
 * than passing through, so the UI can never print an unvetted claim; a row for an
 * algorithm outside the five families, or a deprecated row, is dropped.
 */
export function parseHsmCapabilityRow(row: RawHsmCapabilityRow): HsmCapabilityFact | null {
  if (row.status && row.status !== 'active') return null
  const algorithm = HSM_ALGORITHMS.find((a) => a === (row.algorithm ?? '').trim())
  if (!algorithm || !row.product_id) return null
  return {
    productId: row.product_id,
    softwareName: row.software_name,
    algorithm,
    available: oneOf(row.available, ['yes', 'no', 'preview', 'unknown'] as const, 'unknown'),
    pkcs11Mechanism: oneOf(
      row.pkcs11_mechanism,
      ['standard', 'vendor-defined', 'none', 'unknown'] as const,
      'unknown'
    ),
    mechanismName: (row.mechanism_name ?? '').trim(),
    cavpCert: (row.cavp_cert ?? '').trim() || 'unknown',
    approvedMode: oneOf(row.approved_mode, ['yes', 'no', 'unknown'] as const, 'unknown'),
    cmvpCertListsIt: oneOf(row.cmvp_cert_lists_it, ['yes', 'no', 'unknown'] as const, 'unknown'),
    cmvpCert: (row.cmvp_cert ?? '').trim(),
    verifiedOn: (row.verified_on ?? '').trim(),
    sourceUrl: (row.source_url ?? '').trim(),
    note: (row.note ?? '').trim(),
    verificationStatus: (row.verification_status ?? '').trim() || 'Pending Verification',
  }
}

const { data: facts, metadata } = loadLatestCSV<RawHsmCapabilityRow, HsmCapabilityFact>(
  modules,
  /xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  parseHsmCapabilityRow
)

/** All active HSM capability facts. */
export const hsmCapabilityFacts: HsmCapabilityFact[] = facts

/** Facts keyed by catalogue product_id. */
export const hsmFactsByProduct: Map<string, HsmCapabilityFact[]> = facts.reduce((map, fact) => {
  const existing = map.get(fact.productId) ?? []
  existing.push(fact)
  map.set(fact.productId, existing)
  return map
}, new Map<string, HsmCapabilityFact[]>())

/** Facts for a product, optionally for one algorithm; [] when nothing is recorded. */
export function getHsmFacts(productId: string, algorithm?: HsmAlgorithm): HsmCapabilityFact[] {
  const all = hsmFactsByProduct.get(productId) ?? []
  return algorithm ? all.filter((f) => f.algorithm === algorithm) : all
}

/** CSV file metadata. */
export const hsmCapabilityMetadata = metadata
