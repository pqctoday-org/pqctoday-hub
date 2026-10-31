// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { getDateFromFilename, getRevisionFromFilename } from './pqcAlgorithmsData'
import type { AlgorithmStatusTier } from './algorithmStatusTier'

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
  Deprecation_Date_ISO: string
  Standardization_Date_ISO: string
  data_quality_notes: string
  /** Row lifecycle (DS01): blank/absent = active; 'deprecated' rows are kept for id history only. */
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

/**
 * Transitions-CSV Status → tier lookup (WORKSTREAMS.md §WS-A). Every raw
 * Status value except `'Candidate'` is unambiguous on its own — enumerated
 * by hand against `algorithms_transitions_06252026.csv`. `'Candidate'`
 * covers several genuinely different tiers (HQC, FN-DSA, the hybrid-TLS
 * IETF groups, the KpqC winners, and NIST Additional-Sig Round 2 candidates
 * all share the literal string), so it's resolved via the second table
 * below, keyed on the exact `pqc_replacement` value.
 */
const TRANSITION_STATUS_TIER_LOOKUP: Record<string, AlgorithmStatusTier> = {
  'FIPS 180-4': 'final',
  'FIPS 197': 'final',
  'FIPS 198-1': 'final',
  'FIPS 202': 'final',
  'FIPS 203': 'final',
  'FIPS 204': 'final',
  'FIPS 205': 'final',
  'SP 800-208': 'final',
  'ISO 18033-2 Amd2': 'final', // ISO/IEC 18033-2:2006/Amd 2 (published June 2026) covers Classic McEliece (BSI note); FrodoKEM and ML-KEM not confirmed against the amendment's scope text
  'ETSI TS 104 015': 'final', // Covercrypt
  'BSI TR-02102-1': 'regional', // Classic McEliece
  'KpqC Round 2': 'regional', // SMAUG-T/NTRU+/HAETAE/AIMer — final KpqC winners (Jan 2025)
  'KpqC final selection (January 2025)': 'regional', // same rows, corrected label (kpqc.or.kr, 16 Jan 2025)
  'Round 2': 'round2-candidate', // MAYO
  'Round 3': 'round2-candidate', // MAYO — NIST Additional Signatures Round 3 since 14 May 2026; the UI labels this tier Round 3
  Withdrawn: 'eliminated', // HAWK — withdrawn by its submitters, 29 Jul 2026
  'RFC 10024': 'final', // TLS 1.3 hybrid groups (X25519MLKEM768 etc.), Aug 2026
  'Round 4': 'round4-not-selected', // BIKE, Classic-McEliece (NIST-track view)
  'Not selected by NIST (Round 4 concluded March 2025)': 'round4-not-selected', // BIKE, Classic-McEliece (NIST IR 8545)
  // This file's Region column tags all 'Draft' rows 'IETF', including the
  // SLH-DSA-*-24 rows the reference CSV correctly attributes to SP 800-230
  // — a data mismatch between the two files (flagged, not corrected here).
  // Both are non-final either way, so the tier choice doesn't change filter
  // or badge behavior.
  Draft: 'ietf-draft',
  Research: 'unverified', // Aigis (CN)
  'To Be Checked': 'unverified',
  // Regional-standards grounding audit additions (2026-07-28/29) — all
  // 'regional' per the existing BSI TR-02102-1/KpqC Round 2 convention:
  // final, published documents within their own jurisdiction, not
  // FIPS-certified.
  'BSI TR-02102-1 v2026-01': 'regional',
  'ANSSI-PG-083 v3.00': 'regional',
  'ECCG ACM v2.0': 'regional',
  'ETSI TS 119 312 V2.1.1': 'regional',
  'ASD ISM - Guidelines for Cryptography': 'regional',
  'CRYPTREC LS-0001-2022R2': 'regional',
  'ACN Linee Guida Funzioni Crittografiche - TLS v2.0': 'regional',
  'CCN-TEC 009 / BP-37': 'regional',
  'CCN-STIC 221 (Nov 2024)': 'regional',
}

/** Second-level disambiguation for Status === 'Candidate', keyed on the
 *  exact pqc_replacement string (not a substring match). */
const TRANSITION_CANDIDATE_PQC_TIER_LOOKUP: Record<string, AlgorithmStatusTier> = {
  'HQC-128 (NIST Level 1)': 'fips-draft',
  'HQC-192 (NIST Level 3)': 'fips-draft',
  'HQC-256 (NIST Level 5)': 'fips-draft',
  'X25519MLKEM768 (Hybrid Level 3)': 'ietf-draft',
  'SecP256r1MLKEM768 (Hybrid Level 3)': 'ietf-draft',
  'SecP384r1MLKEM1024 (Hybrid Level 5)': 'ietf-draft',
  'FN-DSA-512 (NIST Level 1)': 'fips-draft',
  'FN-DSA-1024 (NIST Level 5)': 'fips-draft',
  'SMAUG-T (KpqC Level 1)': 'regional',
  'NTRU+ (KpqC Level 3)': 'regional',
  'HAETAE (KpqC Lattice Signature)': 'regional',
  'AIMer (KpqC Symmetric Signature)': 'regional',
  // Keys are the CSV's literal pqc_replacement text; the tier id is historical — the UI
  // labels it Round 3. The Round 2 names below are the deprecated rows kept in the CSV so
  // their ids stay resolvable (revision records cite them); the loader drops those rows, but
  // the drift guard maps every raw row, so the keys stay.
  'UOV (NIST Sig Round 2 — Multivariate)': 'round2-candidate',
  'MAYO (NIST Sig Round 2 — Multivariate)': 'round2-candidate',
  'SQIsign (NIST Sig Round 2 — Isogeny)': 'round2-candidate',
  'CROSS (NIST Sig Round 2 — Code-based)': 'eliminated',
  'LESS (NIST Sig Round 2 — Code-based)': 'eliminated',
  'FAEST (NIST Sig Round 2 — Hash-based)': 'round2-candidate',
  'HAWK (NIST Sig Round 2 — Lattice)': 'eliminated',
  'SNOVA (NIST Sig Round 2 — Multivariate)': 'round2-candidate',
  'UOV (NIST Sig Round 3 — Multivariate)': 'round2-candidate',
  'MAYO (NIST Sig Round 3 — Multivariate)': 'round2-candidate',
  'SQIsign (NIST Sig Round 3 — Isogeny)': 'round2-candidate',
  'CROSS (NIST Sig Round 2 — Code-based, did not advance)': 'eliminated', // not advanced to Round 3 (NIST, 14 May 2026)
  'LESS (NIST Sig Round 2 — Code-based, did not advance)': 'eliminated', // not advanced to Round 3 (NIST, 14 May 2026)
  'FAEST (NIST Sig Round 3 — Hash-based)': 'round2-candidate',
  'HAWK (NIST Sig Round 3 — Lattice, withdrawn)': 'eliminated', // entered Round 3, withdrawn 29 Jul 2026
  'SNOVA (NIST Sig Round 3 — Multivariate)': 'round2-candidate',
  'ML-DSA-44-RSA2048-PSS (IETF Composite Sig)': 'ietf-draft',
  'ML-DSA-44-ECDSA-P256 (IETF Composite Sig)': 'ietf-draft',
  'ML-DSA-44-Ed25519 (IETF Composite Sig)': 'ietf-draft',
  'ML-KEM-768-ECDH-P256 (IETF Composite KEM)': 'ietf-draft',
  'ML-KEM-768-RSA-OAEP-2048 (IETF Composite KEM)': 'ietf-draft',
  'HPKE-PQ (ML-KEM-768 + X25519, IETF)': 'ietf-draft',
}

/** Throws on any Status (or, for 'Candidate', pqc_replacement) not in the
 *  lookup tables above — fail closed instead of silently defaulting a new
 *  status string to "Certified". */
export function mapTransitionStatusToTier(
  status: string,
  pqcReplacement: string
): AlgorithmStatusTier {
  if (status === 'Candidate') {
    const tier = TRANSITION_CANDIDATE_PQC_TIER_LOOKUP[pqcReplacement]
    if (!tier) {
      throw new Error(
        `[algorithmsData] Unrecognized pqc_replacement for status 'Candidate': ${JSON.stringify(pqcReplacement)}. ` +
          'Add it to TRANSITION_CANDIDATE_PQC_TIER_LOOKUP in algorithmsData.ts.'
      )
    }
    return tier
  }
  const tier = TRANSITION_STATUS_TIER_LOOKUP[status]
  if (!tier) {
    throw new Error(
      `[algorithmsData] Unrecognized Status: ${JSON.stringify(status)}. ` +
        'Add it to TRANSITION_STATUS_TIER_LOOKUP in algorithmsData.ts.'
    )
  }
  return tier
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
    return {
      classical: row.classical_algorithm,
      keySize: row.key_size,
      pqc: row.pqc_replacement,
      function: row.Function as AlgorithmTransition['function'],
      deprecationDate: row.Deprecation_Date_Label || row.Deprecation_Date_ISO || '',
      standardizationDate: row.Standardization_Date_Label || row.Standardization_Date_ISO || '',
      deprecationDateISO: row.Deprecation_Date_ISO || undefined,
      standardizationDateISO: row.Standardization_Date_ISO || undefined,
      region: row.Region || '',
      status: row.Status || '',
      statusUrl: row.status_url || undefined,
      dataQualityNotes: row.data_quality_notes || undefined,
      statusTier: mapTransitionStatusToTier(row.Status || '', row.pqc_replacement || ''),
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

/** Derive cryptographic family from a PQC Replacement name in transitions CSV */
export function getCryptoFamilyFromPQCName(pqcName: string): string {
  const n = pqcName.toLowerCase()
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
