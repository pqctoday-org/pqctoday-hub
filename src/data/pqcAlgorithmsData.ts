// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSVAsync, parseIntOrNull } from './csvUtils'
import { parseStatusTier, tierBadge, type AlgorithmStatusTier } from './algorithmStatusTier'

export const RESEARCH_NEEDED = 'Research needed'

export type EvidenceFieldState =
  'stated' | 'not-applicable' | 'not-specified' | 'not-measured' | 'not-researched'

export interface AlgorithmEvidenceStates {
  publicKey: EvidenceFieldState
  privateKey: EvidenceFieldState
  signatureOrCiphertext: EvidenceFieldState
  sharedSecret: EvidenceFieldState
  keyGeneration: EvidenceFieldState
  signOrEncapsulate: EvidenceFieldState
  verifyOrDecapsulate: EvidenceFieldState
  stackRam: EvidenceFieldState
  /** NIST security category. Optional so older fixtures stay valid. */
  securityLevel?: EvidenceFieldState
  aesEquivalent?: EvidenceFieldState
}

export function evidenceStateLabel(state: EvidenceFieldState): string {
  switch (state) {
    case 'not-applicable':
      return 'Not applicable'
    case 'not-specified':
      return 'Not specified by the source'
    case 'not-measured':
      return 'Not measured'
    case 'not-researched':
      return RESEARCH_NEEDED
    default:
      return ''
  }
}

/**
 * Text for a byte-size field: the stated value, or the field's evidence
 * state. A missing value is never shown as 0 B.
 */
export function formatByteField(
  value: number | null,
  state?: EvidenceFieldState,
  unknown = false
): string {
  if (state && state !== 'stated') return evidenceStateLabel(state)
  if (unknown || value === null || value === 0) return RESEARCH_NEEDED
  return `${value.toLocaleString()} B`
}

export interface AlgorithmDetail {
  /** Stable kebab-case slug of `name` (CSV `algorithm_id`, e.g. 'ml-kem-768') —
   *  the key `?algo=` deep links use, so a link survives a display-name tweak. */
  id: string
  family: string
  name: string
  cryptoFamily: string
  securityLevel: number | null
  aesEquivalent: string
  publicKeySize: number | null
  privateKeySize: number | null
  signatureCiphertextSize: number | null
  sharedSecretSize: number | null
  keyGenCycles: string
  signEncapsCycles: string
  verifyDecapsCycles: string
  stackRAM: number
  /** True when the catalogue gives the stack RAM as an estimate ("~6000"). */
  stackRAMApprox?: boolean
  optimizationTarget: string
  fipsStandard: string
  useCaseNotes: string
  region: string
  status: string
  statusUrl?: string
  trustedSourceId?: string
  peerReviewed?: string
  vettingBody?: string
  statusUrlQuality?: string
  /** Normalized status-maturity tier — see WORKSTREAMS.md §WS-A / algorithmStatusTier.ts. */
  statusTier: AlgorithmStatusTier
  type:
    | 'KEM'
    | 'Signature'
    | 'Hybrid KEM'
    | 'Classical KEM'
    | 'Classical Sig'
    | 'Classical Symmetric'
    | 'Classical Hash'
    | 'Block Cipher'
    | 'Hash'
  /** True when any user-facing field equals "Research needed" — entry is incomplete and not yet researched. */
  hasResearchGap: boolean
  /** True when at least one numeric size field is unknown (parsed as 0 from "Research needed" or similar). */
  sizesUnknown: boolean
  /** True when the cycle/perf strings contain "Research needed". */
  perfUnknown: boolean
  confidenceScore?: number
  /** Why a blank/zero cell is blank. Prevents N/A, unmeasured and missing research
   * from being presented as the same thing. */
  evidenceStates?: AlgorithmEvidenceStates
}

export type CatalogueFreshnessState = 'current' | 'review-due' | 'stale' | 'missing' | 'future'

export interface CatalogueFreshness {
  state: CatalogueFreshnessState
  ageDays: number | null
  label: string
}

/**
 * Snapshot freshness is deliberately not row freshness. The current catalogue
 * has no row-level verification date, reviewer, method, locator or next-review
 * columns, so callers must describe this as the age of the imported file only.
 */
export function getCatalogueFreshness(
  snapshotDate: Date | null | undefined,
  now = new Date(),
  reviewDays = 90,
  staleDays = 180
): CatalogueFreshness {
  if (!snapshotDate || Number.isNaN(snapshotDate.getTime())) {
    return { state: 'missing', ageDays: null, label: 'Snapshot date not recorded' }
  }

  const ageDays = Math.floor((now.getTime() - snapshotDate.getTime()) / 86_400_000)
  if (ageDays < 0) {
    return { state: 'future', ageDays, label: 'Snapshot date is in the future' }
  }
  const age = `${ageDays} ${ageDays === 1 ? 'day' : 'days'} old`
  if (ageDays > staleDays) {
    return { state: 'stale', ageDays, label: `Snapshot is ${age}` }
  }
  if (ageDays > reviewDays) {
    return { state: 'review-due', ageDays, label: `Snapshot review is due (${age})` }
  }
  return { state: 'current', ageDays, label: `Snapshot is ${age}` }
}

/**
 * A snapshot date as YYYY-MM-DD in the calendar it was parsed in. Snapshot
 * dates are built at local midnight from the file name, so toISOString()
 * would move them a day earlier east of UTC. Null when there is no date.
 */
export function formatSnapshotDate(date: Date | null | undefined): string | null {
  if (!date || Number.isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * True when the raw CSV cell indicates the value has not been researched yet.
 * Used to display "Research needed" in the UI instead of NaN/0/empty.
 */
export function isResearchNeeded(rawValue: string | undefined | null): boolean {
  if (!rawValue) return false
  return rawValue.trim().toLowerCase() === RESEARCH_NEEDED.toLowerCase()
}

/** Blank evidence is missing evidence too. Keep this separate from
 * isResearchNeeded because some blank CSV cells are legitimately not
 * applicable and need family-aware handling in the loader. */
export function isMissingEvidence(rawValue: string | undefined | null): boolean {
  return !rawValue?.trim() || isResearchNeeded(rawValue)
}

function statedOr(raw: string | undefined, missing: EvidenceFieldState): EvidenceFieldState {
  if (isResearchNeeded(raw)) return 'not-researched'
  return raw?.trim() ? 'stated' : missing
}

interface RawAlgorithmRow {
  algorithm_family: string
  algorithm: string
  cryptographic_family: string
  nist_security_level: string
  aes_equivalent: string
  public_key_bytes: string
  private_key_bytes: string
  signature_ciphertext_bytes: string
  shared_secret_bytes: string
  keygen_cycles_relative: string
  sign_encaps_cycles_relative: string
  verifydecaps_cycles_relative: string
  stack_ram_bytes: string
  optimization_target: string
  fips_standard: string
  use_case_notes: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
  region: string
  status: string
  status_url: string
  /** Status maturity tier — the data's own classification of the status text. */
  status_tier?: string
  status_url_quality: string
  confidence_score?: string
  algorithm_id?: string
}

/**
 * Deterministic `algorithm_id` slug for an algorithm name — the scheme the
 * CSV's `algorithm_id` column was generated with (09292026): lowercase, `+`
 * spelled out as `-plus-` (so NTRU+-768 doesn't collapse onto a plain NTRU
 * id), every other run of non-alphanumerics → one `-`, trimmed.
 * 'ML-KEM-768' → 'ml-kem-768', 'LMS-SHA256 (H20/W8)' → 'lms-sha256-h20-w8'.
 * Used as the loader's fallback for snapshots predating the column and by
 * screens that only hold a name (the mobile registry).
 */
export function algorithmIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\+/g, '-plus-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Resolve a `?algo=` value: the stable `algorithm_id` first, then an exact
 * case-insensitive algorithm name (links minted before the id column).
 */
export function findAlgorithmByRef<T extends { id: string; name: string }>(
  algorithms: T[],
  ref: string | null | undefined
): T | undefined {
  const q = ref?.trim().toLowerCase()
  if (!q) return undefined
  return algorithms.find((a) => a.id === q) ?? algorithms.find((a) => a.name.toLowerCase() === q)
}

const POST_QUANTUM_FAMILIES = new Set(['KEM', 'Signature', 'Hybrid KEM'])

// ── One text per field, for every surface ────────────────────────────────
// The table, drawer, compare views and CSV export all read these helpers so
// a field shows the same value, or the same missing-data words, everywhere.

export type AlgorithmSizeField =
  'publicKey' | 'privateKey' | 'signatureOrCiphertext' | 'sharedSecret'

function sizeValue(algo: AlgorithmDetail, field: AlgorithmSizeField): number | null {
  switch (field) {
    case 'publicKey':
      return algo.publicKeySize
    case 'privateKey':
      return algo.privateKeySize
    case 'signatureOrCiphertext':
      return algo.signatureCiphertextSize
    case 'sharedSecret':
      return algo.sharedSecretSize
  }
}

/** The evidence state of one size field, judged on that field alone. */
export function algorithmSizeState(
  algo: AlgorithmDetail,
  field: AlgorithmSizeField
): EvidenceFieldState {
  // eslint-disable-next-line security/detect-object-injection -- field is a typed union, not user input
  const state = algo.evidenceStates?.[field]
  if (state && state !== 'stated') return state
  const value = sizeValue(algo, field)
  // Records built without evidence states fall back to the row-level flag.
  if (!algo.evidenceStates && algo.sizesUnknown && field !== 'sharedSecret') {
    return 'not-researched'
  }
  if (value === null || value === 0) {
    return field === 'sharedSecret' ? 'not-specified' : 'not-researched'
  }
  return 'stated'
}

/** The stated size in bytes, or null when the field is missing. */
export function algorithmSizeBytes(
  algo: AlgorithmDetail,
  field: AlgorithmSizeField
): number | null {
  return algorithmSizeState(algo, field) === 'stated' ? sizeValue(algo, field) : null
}

/** The variable-length entries marked with an asterisk in RFC 10073 Table 6. */
function isCompositeMaximum(algo: AlgorithmDetail, field: AlgorithmSizeField): boolean {
  if (algo.fipsStandard !== 'RFC 10073') return false
  if (algo.id === 'id-mldsa44-rsa2048-pss-sha256') {
    return field === 'publicKey' || field === 'privateKey'
  }
  return algo.id === 'id-mldsa44-ecdsa-p256-sha256' && field === 'signatureOrCiphertext'
}

/** "1,184 B", or the field's missing-data words. */
export function formatAlgorithmSize(algo: AlgorithmDetail, field: AlgorithmSizeField): string {
  const state = algorithmSizeState(algo, field)
  if (state !== 'stated') return evidenceStateLabel(state)
  const text = formatByteField(sizeValue(algo, field), 'stated')
  return isCompositeMaximum(algo, field) ? `Up to ${text}` : text
}

/** Export cell: the number of bytes, or the field's missing-data words. */
export function exportAlgorithmSize(
  algo: AlgorithmDetail,
  field: AlgorithmSizeField
): string | number {
  const state = algorithmSizeState(algo, field)
  if (state !== 'stated') return evidenceStateLabel(state)
  const value = sizeValue(algo, field)
  if (value === null) return RESEARCH_NEEDED
  return isCompositeMaximum(algo, field) ? `Up to ${value}` : value
}

export function stackRamState(algo: AlgorithmDetail): EvidenceFieldState {
  const state = algo.evidenceStates?.stackRam
  if (state && state !== 'stated') return state
  if (algo.stackRAM > 0) return 'stated'
  // A cell that was filled in but held no usable number is still a gap.
  return state === 'stated' ? 'not-researched' : 'not-measured'
}

/** "~6,000 B" (estimate), "6,000 B", or the field's missing-data words. */
export function formatStackRam(algo: AlgorithmDetail): string {
  const state = stackRamState(algo)
  if (state !== 'stated') return evidenceStateLabel(state)
  return `${algo.stackRAMApprox ? '~' : ''}${algo.stackRAM.toLocaleString()} B`
}

/** Export cell: "~6000" for an estimate, 6000 when exact, or the missing-data words. */
export function exportStackRam(algo: AlgorithmDetail): string | number {
  const state = stackRamState(algo)
  if (state !== 'stated') return evidenceStateLabel(state)
  return algo.stackRAMApprox ? `~${algo.stackRAM}` : algo.stackRAM
}

export function securityLevelState(algo: AlgorithmDetail): EvidenceFieldState {
  if (algo.securityLevel !== null) return 'stated'
  const state = algo.evidenceStates?.securityLevel
  return state && state !== 'stated' ? state : 'not-specified'
}

/** "Level 3", or the field's missing-data words. */
export function formatSecurityLevel(algo: AlgorithmDetail): string {
  const state = securityLevelState(algo)
  return state === 'stated' ? `Level ${algo.securityLevel}` : evidenceStateLabel(state)
}

/** The AES-equivalent text, or the field's missing-data words. */
export function formatAesEquivalent(algo: AlgorithmDetail): string {
  const state = algo.evidenceStates?.aesEquivalent
  if (state && state !== 'stated') return evidenceStateLabel(state)
  if (isResearchNeeded(algo.aesEquivalent)) return RESEARCH_NEEDED
  return algo.aesEquivalent?.trim() || evidenceStateLabel('not-specified')
}

export const LINK_QUALITY_NOT_ASSESSED = 'Not assessed'

export function formatLinkQuality(algo: AlgorithmDetail): string {
  return algo.statusUrlQuality?.trim() || LINK_QUALITY_NOT_ASSESSED
}

/**
 * Reader-facing words for a maturity tier — the status filter's own labels,
 * never the internal id (e.g. 'round2-candidate').
 */
export function statusTierLabel(tier: AlgorithmStatusTier): string {
  if (tier === 'final') return 'Published standard'
  if (tier === 'regional') return 'Regional recommendation or selection'
  return tierBadge(tier)?.label ?? tier
}

// Import CSV data dynamically (lazy glob)
const csvModule = import.meta.glob('./pqc_complete_algorithm_reference_*.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmDetail[] | null = null
export let loadedFileMetadata: { filename: string; date: Date | null } | null = null

/** Rows the loader withheld from the latest catalogue file, by reason. */
export interface WithheldCatalogueRows {
  /** Rows with no name, algorithm family or cryptographic family. */
  unclassified: number
  /** Program-track placeholders with no algorithm selected yet. */
  placeholder: number
}
let withheldRows: WithheldCatalogueRows = { unclassified: 0, placeholder: 0 }

/** Withheld-row counts from the last load, so the page can disclose them. */
export function getWithheldCatalogueRows(): WithheldCatalogueRows {
  return { ...withheldRows }
}

// Helper to extract date from filename — exported for use by algorithmsData.ts
export function getDateFromFilename(path: string): Date | null {
  const match = path.match(/_(\d{8})(?:_r\d+)?\.csv$/)
  if (!match) return null

  const dateStr = match[1]
  const month = parseInt(dateStr.substring(0, 2)) - 1 // JS months are 0-indexed
  const day = parseInt(dateStr.substring(2, 4))
  const year = parseInt(dateStr.substring(4, 8))

  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

export function getRevisionFromFilename(path: string): number {
  const match = path.match(/_\d{8}_r(\d+)\.csv$/)
  return match ? parseInt(match[1], 10) : 0
}

export async function loadPQCAlgorithmsData(): Promise<AlgorithmDetail[]> {
  if (cachedData) return cachedData

  const withheld: WithheldCatalogueRows = { unclassified: 0, placeholder: 0 }
  const { data, metadata } = await loadLatestCSVAsync<RawAlgorithmRow, AlgorithmDetail>(
    csvModule,
    /pqc_complete_algorithm_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    (row) => {
      // A nameless or unclassified row cannot teach a defensible comparison.
      // Withhold it instead of rendering an apparently valid zero-filled row.
      if (
        isMissingEvidence(row.algorithm) ||
        isMissingEvidence(row.algorithm_family) ||
        isMissingEvidence(row.cryptographic_family)
      ) {
        withheld.unclassified += 1
        return null
      }
      const statusTier = parseStatusTier(row.status_tier, `algorithm ${row.algorithm}`)
      // NGCC-BC/NGCC-CH are a program track name with no algorithm selected
      // yet (confirmed by the CSV's own data-quality note) — not a real
      // algorithm to show in a user-facing comparison. Drop the row rather
      // than badge it, per WORKSTREAMS.md §WS-A step 4.
      if (statusTier === 'placeholder') {
        withheld.placeholder += 1
        return null
      }

      const carriesAsymmetricObjects = [
        'KEM',
        'Signature',
        'Hybrid KEM',
        'Classical KEM',
        'Classical Sig',
      ].includes(row.algorithm_family)
      const carriesSharedSecret = ['KEM', 'Hybrid KEM', 'Classical KEM'].includes(
        row.algorithm_family
      )
      // Classical key agreement (ECDH, X25519, X448, DH) has no ciphertext:
      // each side sends a public key. A blank cell there is "not applicable",
      // not a research gap. RSA rows in the same family state a ciphertext.
      const ciphertextMissingMeans: EvidenceFieldState =
        row.algorithm_family === 'Classical KEM' ? 'not-applicable' : 'not-researched'
      // NIST security categories are defined for post-quantum schemes; the
      // catalogue leaves them blank for classical and symmetric primitives.
      const levelMissingMeans: EvidenceFieldState = POST_QUANTUM_FAMILIES.has(row.algorithm_family)
        ? 'not-specified'
        : 'not-applicable'
      const evidenceStates: AlgorithmEvidenceStates = {
        publicKey: carriesAsymmetricObjects
          ? statedOr(row.public_key_bytes, 'not-researched')
          : 'not-applicable',
        privateKey: carriesAsymmetricObjects
          ? statedOr(row.private_key_bytes, 'not-researched')
          : 'not-applicable',
        signatureOrCiphertext: carriesAsymmetricObjects
          ? statedOr(row.signature_ciphertext_bytes, ciphertextMissingMeans)
          : 'not-applicable',
        sharedSecret: carriesSharedSecret
          ? statedOr(row.shared_secret_bytes, 'not-specified')
          : 'not-applicable',
        keyGeneration: statedOr(row.keygen_cycles_relative, 'not-measured'),
        signOrEncapsulate: statedOr(row.sign_encaps_cycles_relative, 'not-measured'),
        verifyOrDecapsulate: statedOr(row.verifydecaps_cycles_relative, 'not-measured'),
        stackRam: statedOr(row.stack_ram_bytes, 'not-measured'),
        securityLevel: statedOr(row.nist_security_level, levelMissingMeans),
        aesEquivalent: statedOr(row.aes_equivalent, 'not-specified'),
      }
      const sizesUnknown =
        carriesAsymmetricObjects &&
        (evidenceStates.publicKey !== 'stated' ||
          evidenceStates.privateKey !== 'stated' ||
          (evidenceStates.signatureOrCiphertext !== 'stated' &&
            evidenceStates.signatureOrCiphertext !== 'not-applicable'))
      const perfUnknown =
        isMissingEvidence(row.keygen_cycles_relative) ||
        isMissingEvidence(row.sign_encaps_cycles_relative) ||
        isMissingEvidence(row.verifydecaps_cycles_relative)
      const hasResearchGap =
        Object.values(evidenceStates).includes('not-researched') ||
        isResearchNeeded(row.nist_security_level) ||
        isResearchNeeded(row.aes_equivalent) ||
        isResearchNeeded(row.stack_ram_bytes) ||
        isResearchNeeded(row.optimization_target) ||
        isResearchNeeded(row.shared_secret_bytes)

      return {
        id: row.algorithm_id?.trim() || algorithmIdFromName(row.algorithm),
        family: row.algorithm_family,
        name: row.algorithm,
        // P2.1 (2026-05-22): bare 'Hybrid' was renamed to 'Composite' to
        // disambiguate from protocol-level "hybrid signature" (different
        // concept). Older CSV snapshots ship with 'Hybrid', so the loader
        // normalises both spellings to the canonical 'Composite' value.
        // Compound labels (e.g. 'Hybrid (KEM + ABE)', 'Framework (Hybrid
        // PKE)') are unaffected — only the exact 'Hybrid' string is mapped.
        cryptoFamily:
          row.cryptographic_family === 'Hybrid' ? 'Composite' : row.cryptographic_family || '',
        securityLevel: parseIntOrNull(row.nist_security_level),
        aesEquivalent: row.aes_equivalent,
        publicKeySize: parseIntOrNull(row.public_key_bytes),
        privateKeySize: parseIntOrNull(row.private_key_bytes),
        signatureCiphertextSize: parseIntOrNull(row.signature_ciphertext_bytes),
        sharedSecretSize: parseIntOrNull(row.shared_secret_bytes),
        keyGenCycles: row.keygen_cycles_relative,
        signEncapsCycles: row.sign_encaps_cycles_relative,
        verifyDecapsCycles: row.verifydecaps_cycles_relative,
        stackRAM: parseInt((row.stack_ram_bytes || '0').replace(/[~,]/g, ''), 10) || 0,
        stackRAMApprox: /^\s*~/.test(row.stack_ram_bytes || ''),
        optimizationTarget: row.optimization_target,
        fipsStandard: row.fips_standard,
        useCaseNotes: row.use_case_notes || '',
        region: row.region || '',
        status: row.status || '',
        statusUrl: row.status_url || undefined,
        trustedSourceId: row.trusted_source_id || undefined,
        peerReviewed: row.peer_reviewed || undefined,
        vettingBody: row.vetting_body || undefined,
        statusUrlQuality: row.status_url_quality || undefined,
        statusTier,
        type: row.algorithm_family as AlgorithmDetail['type'],
        hasResearchGap,
        sizesUnknown,
        perfUnknown,
        confidenceScore: row.confidence_score ? Number(row.confidence_score) : undefined,
        evidenceStates,
      }
    }
  )

  loadedFileMetadata = metadata ? { filename: metadata.filename, date: metadata.lastUpdate } : null
  withheldRows = withheld

  cachedData = data
  return data
}

// Helper functions for categorization
export function isPQC(algo: AlgorithmDetail): boolean {
  return algo.family === 'KEM' || algo.family === 'Signature'
}

export function isHybrid(algo: AlgorithmDetail): boolean {
  return algo.family === 'Hybrid KEM'
}

export function isClassical(algo: AlgorithmDetail): boolean {
  return (
    algo.family === 'Classical KEM' ||
    algo.family === 'Classical Sig' ||
    algo.family === 'Classical Symmetric' ||
    algo.family === 'Classical Hash'
  )
}

/** "Baseline" → 1, "Nx" / "Nx Sign" / "Nx Verify" → N. Incompatible or
 * missing forms return null; they must never become a successful baseline. */
export function getPerformanceMultiplier(cycles: string): number | null {
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 1
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  return match ? parseFloat(match[1]) : null
}

export function getPerformanceCategory(cycles: string): 'Fast' | 'Moderate' | 'Slow' | 'Unknown' {
  if (!cycles.trim() || isResearchNeeded(cycles)) return 'Unknown'
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 'Moderate'

  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  if (!match) return 'Unknown'

  const multiplier = parseFloat(match[1])

  if (multiplier <= 1) return 'Fast'
  if (multiplier <= 10) return 'Moderate'
  return 'Slow'
}

export function getSecurityLevelColor(level: number | null): string {
  if (level === null) return 'bg-muted/50 text-muted-foreground border-border'
  if (level === 1) return 'bg-primary/10 text-primary border-primary/30'
  if (level === 2) return 'bg-accent/10 text-accent border-accent/30'
  if (level === 3) return 'bg-success/10 text-success border-success/30'
  if (level === 4) return 'bg-warning/10 text-warning border-warning/30'
  return 'bg-destructive/10 text-destructive border-destructive/30' // Level 5
}

export function getPerformanceColor(category: 'Fast' | 'Moderate' | 'Slow' | 'Unknown'): string {
  if (category === 'Fast') return 'bg-success/10 text-success border-success/30'
  if (category === 'Moderate') return 'bg-warning/10 text-warning border-warning/30'
  if (category === 'Unknown') return 'bg-muted/50 text-muted-foreground border-border italic'
  return 'bg-destructive/10 text-destructive border-destructive/30'
}

export function getCryptoFamilyColor(family: string): string {
  switch (family) {
    case 'Lattice':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'Code-based':
      return 'bg-accent/10 text-accent border-accent/30'
    case 'Hash-based':
      return 'bg-success/10 text-success border-success/30'
    case 'Composite':
      return 'bg-warning/10 text-warning border-warning/30'
    case 'Classical':
      return 'bg-muted/50 text-muted-foreground border-border'
    default:
      return 'bg-muted/50 text-muted-foreground border-border'
  }
}

/** Determine the functional group of an algorithm: 'KEM' or 'Signature' */
export function getFunctionGroup(
  algo: AlgorithmDetail
): 'KEM' | 'Signature' | 'Hash' | 'Symmetric' | null {
  if (algo.family === 'KEM' || algo.family === 'Classical KEM' || algo.family === 'Hybrid KEM')
    return 'KEM'
  if (algo.family === 'Signature' || algo.family === 'Classical Sig') return 'Signature'
  if (algo.family === 'Classical Hash') return 'Hash'
  if (algo.family === 'Classical Symmetric') return 'Symmetric'
  return null
}
