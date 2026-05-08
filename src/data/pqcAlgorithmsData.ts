// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSVAsync, parseIntOrNull } from './csvUtils'

export const RESEARCH_NEEDED = 'Research needed'

export interface AlgorithmDetail {
  family: string
  name: string
  cryptoFamily: string
  securityLevel: number | null
  aesEquivalent: string
  publicKeySize: number
  privateKeySize: number
  signatureCiphertextSize: number | null
  sharedSecretSize: number | null
  keyGenCycles: string
  signEncapsCycles: string
  verifyDecapsCycles: string
  stackRAM: number
  optimizationTarget: string
  fipsStandard: string
  useCaseNotes: string
  region: string
  status: string
  statusUrl?: string
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
}

/**
 * True when the raw CSV cell indicates the value has not been researched yet.
 * Used to display "Research needed" in the UI instead of NaN/0/empty.
 */
export function isResearchNeeded(rawValue: string | undefined | null): boolean {
  if (!rawValue) return false
  return rawValue.trim().toLowerCase() === RESEARCH_NEEDED.toLowerCase()
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
  status_url_quality: string
  confidence_score?: string
}

// Import CSV data dynamically (lazy glob)
const csvModule = import.meta.glob('./pqc_complete_algorithm_reference_*.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmDetail[] | null = null
export let loadedFileMetadata: { filename: string; date: Date | null } | null = null

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

  const { data, metadata } = await loadLatestCSVAsync<RawAlgorithmRow, AlgorithmDetail>(
    csvModule,
    /pqc_complete_algorithm_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    (row) => {
      const sizesUnknown =
        isResearchNeeded(row.public_key_bytes) ||
        isResearchNeeded(row.private_key_bytes) ||
        isResearchNeeded(row.signature_ciphertext_bytes)
      const perfUnknown =
        isResearchNeeded(row.keygen_cycles_relative) ||
        isResearchNeeded(row.sign_encaps_cycles_relative) ||
        isResearchNeeded(row.verifydecaps_cycles_relative)
      const hasResearchGap =
        sizesUnknown ||
        perfUnknown ||
        isResearchNeeded(row.nist_security_level) ||
        isResearchNeeded(row.aes_equivalent) ||
        isResearchNeeded(row.stack_ram_bytes) ||
        isResearchNeeded(row.optimization_target) ||
        isResearchNeeded(row.shared_secret_bytes)

      return {
        family: row.algorithm_family,
        name: row.algorithm,
        cryptoFamily: row.cryptographic_family || '',
        securityLevel: parseIntOrNull(row.nist_security_level),
        aesEquivalent: row.aes_equivalent,
        publicKeySize: parseInt(row.public_key_bytes, 10) || 0,
        privateKeySize: parseInt(row.private_key_bytes, 10) || 0,
        signatureCiphertextSize: parseIntOrNull(row.signature_ciphertext_bytes),
        sharedSecretSize: parseIntOrNull(row.shared_secret_bytes),
        keyGenCycles: row.keygen_cycles_relative,
        signEncapsCycles: row.sign_encaps_cycles_relative,
        verifyDecapsCycles: row.verifydecaps_cycles_relative,
        stackRAM: parseInt((row.stack_ram_bytes || '0').replace(/[~,]/g, ''), 10) || 0,
        optimizationTarget: row.optimization_target,
        fipsStandard: row.fips_standard,
        useCaseNotes: row.use_case_notes || '',
        region: row.region || '',
        status: row.status || '',
        statusUrl: row.status_url || undefined,
        type: row.algorithm_family as AlgorithmDetail['type'],
        hasResearchGap,
        sizesUnknown,
        perfUnknown,
        confidenceScore: row.confidence_score ? Number(row.confidence_score) : undefined,
      }
    }
  )

  loadedFileMetadata = metadata ? { filename: metadata.filename, date: metadata.lastUpdate } : null

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

export function getPerformanceCategory(cycles: string): 'Fast' | 'Moderate' | 'Slow' | 'Unknown' {
  if (isResearchNeeded(cycles)) return 'Unknown'
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 'Moderate'

  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  if (!match) return 'Moderate'

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
    case 'Hybrid':
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
