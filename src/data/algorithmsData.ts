// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { getDateFromFilename, getRevisionFromFilename } from './pqcAlgorithmsData'
import { parseStatusTier, type AlgorithmStatusTier } from './algorithmStatusTier'
import {
  standardizationDateEvidence,
  deprecationDateEvidence,
  type TransitionDateEvidence,
} from './transitionDates'

export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function:
    | 'Encryption/KEM'
    | 'Key Agreement'
    | 'Signature'
    | 'Hybrid KEM'
    | 'Hash'
    | 'Symmetric'
    | 'Composite Signature'
    | 'Composite KEM'
    | 'Hybrid KEM (HPKE)'
    | 'Hybrid KEM with Access Control'
  deprecationDate: string
  standardizationDate: string
  deprecationDateISO?: string
  standardizationDateISO?: string
  standardizationDateEvidence?: TransitionDateEvidence
  deprecationDateEvidence?: TransitionDateEvidence
  region: string
  status: string
  statusUrl?: string
  dataQualityNotes?: string
  /** Normalized status-maturity tier — see WORKSTREAMS.md §WS-A / algorithmStatusTier.ts. */
  statusTier: AlgorithmStatusTier
  evidenceStates?: {
    replacement: 'stated' | 'not-researched'
    deprecationDate: 'stated' | 'not-specified'
    standardizationDate: 'stated' | 'not-specified'
    source: 'stated' | 'not-specified'
  }
}

interface RawTransitionRow {
  classical_algorithm: string
  key_size: string
  pqc_replacement: string
  Function: string
  Deprecation_Date_Label: string
  Standardization_Date_Label: string
  Region: string
  Status: string
  status_url: string
  /** Status maturity tier — the data's own classification of the Status text. */
  status_tier?: string
  Deprecation_Date_ISO: string
  Standardization_Date_ISO: string
  data_quality_notes: string
  /** Row lifecycle (DS01): blank/absent = active; 'deprecated' rows are kept for id history only. */
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

// Eager glob — data available synchronously at module load time
const csvModules = import.meta.glob('./algorithms_transitions_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data, metadata } = loadLatestCSV<RawTransitionRow, AlgorithmTransition>(
  csvModules,
  /algorithms_transitions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    const lifecycle = (row.status ?? '').trim().toLowerCase()
    if (lifecycle && lifecycle !== 'active') return null // deprecated/obsolete: id history only
    const publication = standardizationDateEvidence(
      row.Standardization_Date_Label || row.Standardization_Date_ISO || '',
      row.Standardization_Date_ISO || undefined
    )
    const policy = deprecationDateEvidence(
      row.Deprecation_Date_Label || row.Deprecation_Date_ISO || '',
      row.Deprecation_Date_ISO || undefined,
      row.Region || ''
    )
    return {
      classical: row.classical_algorithm,
      keySize: row.key_size,
      pqc: row.pqc_replacement,
      function: row.Function as AlgorithmTransition['function'],
      deprecationDate: policy.label,
      standardizationDate: publication.label,
      deprecationDateISO: policy.iso,
      standardizationDateISO: publication.iso,
      standardizationDateEvidence: publication,
      deprecationDateEvidence: policy,
      region: row.Region || '',
      status: row.Status || '',
      statusUrl: row.status_url || undefined,
      dataQualityNotes: row.data_quality_notes || undefined,
      statusTier: parseStatusTier(
        row.status_tier,
        `algorithms transitions ${row.classical_algorithm} -> ${row.pqc_replacement}`
      ),
      evidenceStates: {
        replacement: row.pqc_replacement?.trim() ? 'stated' : 'not-researched',
        deprecationDate:
          row.Deprecation_Date_Label?.trim() || row.Deprecation_Date_ISO?.trim()
            ? 'stated'
            : 'not-specified',
        standardizationDate:
          row.Standardization_Date_Label?.trim() || row.Standardization_Date_ISO?.trim()
            ? 'stated'
            : 'not-specified',
        source: row.status_url?.trim() ? 'stated' : 'not-specified',
      },
    }
  }
)

export const algorithmsData: AlgorithmTransition[] = data

export const loadedTransitionMetadata: { filename: string; date: Date | null } | null = metadata
  ? { filename: metadata.filename, date: metadata.lastUpdate }
  : null

/** Backward-compatible async wrapper — returns the already-loaded data */
export async function loadAlgorithmsData(): Promise<AlgorithmTransition[]> {
  return algorithmsData
}

// Re-export for consumers that use these helpers
export { getDateFromFilename, getRevisionFromFilename }

// A construction that joins a post-quantum algorithm to a classical one (a hybrid KEM, a
// composite signature) is classified as a construction, whatever order or punctuation the
// name uses: "ML-DSA-44-RSA2048-PSS", "MLDSA44-RSA2048-PSS", "ML-KEM-768-ECDH-P256",
// "X25519MLKEM768" and "ML-KEM (hybrid with ECDHE)" are all Composite. The post-quantum name
// is read with punctuation removed, and the whole test runs BEFORE the single-primitive prefix
// rules below, so a leading "ml-kem" or "ml-dsa" cannot turn a compound name into a plain
// lattice scheme.
const PQ_NAME_TOKEN =
  /(mlkem|mldsa|slhdsa|fndsa|falcon|dilithium|kyber|frodokem|hqc|mceliece|sphincs)/
// A classical name made of letters alone is only read when no other letter runs into it from
// the left ("universal" and "traversal" contain "rsa" but name no algorithm); a name that
// carries digits cannot be part of an ordinary word and is read from the compact form.
const CLASSICAL_WORD_TOKEN = /(rsa|ecdsa|ecdh)/
const CLASSICAL_CODED_TOKEN = /(ed25519|ed448|x25519|x448|secp\d|p256|p384|p521)/
// eslint-disable-next-line security/detect-non-literal-regexp -- built only from the constants above
const CLASSICAL_AFTER_BOUNDARY = new RegExp(
  `(?:(?<![a-z])|(?<=${PQ_NAME_TOKEN.source}))${CLASSICAL_WORD_TOKEN.source}`
)

function isCompoundConstruction(name: string): boolean {
  const lower = name.toLowerCase()
  const compact = lower.replace(/[^a-z0-9]/g, '')
  return (
    PQ_NAME_TOKEN.test(compact) &&
    (CLASSICAL_CODED_TOKEN.test(compact) || CLASSICAL_AFTER_BOUNDARY.test(lower))
  )
}

/** Derive cryptographic family from a PQC Replacement name in transitions CSV */
export function getCryptoFamilyFromPQCName(pqcName: string): string {
  const n = pqcName.toLowerCase()
  if (isCompoundConstruction(n)) return 'Composite'
  if (
    n.startsWith('ml-kem') ||
    n.startsWith('frodokem') ||
    n.startsWith('ml-dsa') ||
    n.startsWith('fn-dsa') ||
    n.startsWith('aigis') ||
    n.startsWith('lac') ||
    n.startsWith('smaug') ||
    n.startsWith('ntru+') ||
    n.startsWith('ntruplus') ||
    n.startsWith('haetae') ||
    n.startsWith('hawk')
  )
    return 'Lattice'
  if (
    n.startsWith('hqc') ||
    n.startsWith('classic-mceliece') ||
    n.startsWith('cross') ||
    n.startsWith('less')
  )
    return 'Code-based'
  if (
    n.startsWith('slh-dsa') ||
    n.startsWith('lms') ||
    n.startsWith('xmss') ||
    n.startsWith('aimer') ||
    n.startsWith('faest')
  )
    return 'Hash-based'
  if (n.startsWith('uov') || n.startsWith('mayo') || n.startsWith('snova')) return 'Multivariate'
  if (n.startsWith('sqisign')) return 'Isogeny'
  // P2.1: 'Hybrid' math family renamed to 'Composite' to disambiguate from
  // protocol-level "hybrid signature". The crypto family for X25519+ML-KEM
  // etc. is a Composite math construction.
  if (n.includes('mlkem') && (n.startsWith('x25519') || n.startsWith('secp'))) return 'Composite'
  if (n.startsWith('covercrypt') || n.startsWith('hpke-pq')) return 'Composite'
  // Composite: contains a PQC name alongside a classical algorithm name
  if (n.includes('ml-dsa') || n.includes('ml-kem')) {
    if (n.includes('rsa') || n.includes('ecdsa') || n.includes('ecdh') || n.includes('ed25519'))
      return 'Composite'
  }
  if (
    n.startsWith('sha3') ||
    n.startsWith('hmac-sha') ||
    n.startsWith('aes') ||
    n.startsWith('sha-256') ||
    n.startsWith('sha-') ||
    n.startsWith('sha256')
  )
    return 'N/A'
  return 'N/A'
}

/**
 * Derive function group from transition's function field. Key agreement
 * (ECDH, DH) rows are key establishment, so they share the KEM group and the
 * "KEM (key establishment)" filter.
 */
export function getTransitionFunctionGroup(
  fn: AlgorithmTransition['function']
): 'KEM' | 'Signature' | null {
  if (
    fn === 'Encryption/KEM' ||
    fn === 'Key Agreement' ||
    fn === 'Hybrid KEM' ||
    fn === 'Composite KEM' ||
    fn === 'Hybrid KEM (HPKE)' ||
    fn === 'Hybrid KEM with Access Control'
  )
    return 'KEM'
  if (fn === 'Signature' || fn === 'Composite Signature') return 'Signature'
  return null
}

/**
 * Reader-facing words for a transition row's function. The data's
 * "Encryption/KEM" reads as public-key encryption; these rows are key
 * encapsulation used for key establishment.
 */
export function transitionFunctionLabel(fn: AlgorithmTransition['function']): string {
  if (fn === 'Encryption/KEM') return 'KEM (key establishment)'
  if (fn === 'Key Agreement') return 'Key agreement'
  return fn
}
