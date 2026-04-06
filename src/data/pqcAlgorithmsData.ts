// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSVAsync, parseIntOrNull } from './csvUtils'

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
}

interface RawAlgorithmRow {
  'Algorithm Family': string
  Algorithm: string
  'Cryptographic Family': string
  'NIST Security Level': string
  'AES Equivalent': string
  'Public Key (bytes)': string
  'Private Key (bytes)': string
  'Signature/Ciphertext (bytes)': string
  'Shared Secret (bytes)': string
  'KeyGen (cycles relative)': string
  'Sign/Encaps (cycles relative)': string
  'Verify/Decaps (cycles relative)': string
  'Stack RAM (bytes)': string
  'Optimization Target': string
  'FIPS Standard': string
  'Use Case Notes': string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
  Region: string
  Status: string
  'Status URL': string
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
    (row) => ({
      family: row['Algorithm Family'],
      name: row['Algorithm'],
      cryptoFamily: row['Cryptographic Family'] || '',
      securityLevel: parseIntOrNull(row['NIST Security Level']),
      aesEquivalent: row['AES Equivalent'],
      publicKeySize: parseInt(row['Public Key (bytes)'], 10),
      privateKeySize: parseInt(row['Private Key (bytes)'], 10),
      signatureCiphertextSize: parseIntOrNull(row['Signature/Ciphertext (bytes)']),
      sharedSecretSize: parseIntOrNull(row['Shared Secret (bytes)']),
      keyGenCycles: row['KeyGen (cycles relative)'],
      signEncapsCycles: row['Sign/Encaps (cycles relative)'],
      verifyDecapsCycles: row['Verify/Decaps (cycles relative)'],
      stackRAM: parseInt((row['Stack RAM (bytes)'] || '0').replace(/[~,]/g, ''), 10) || 0,
      optimizationTarget: row['Optimization Target'],
      fipsStandard: row['FIPS Standard'],
      useCaseNotes: row['Use Case Notes'] || '',
      region: row['Region'] || '',
      status: row['Status'] || '',
      statusUrl: row['Status URL'] || undefined,
      type: row['Algorithm Family'] as AlgorithmDetail['type'],
    })
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

export function getPerformanceCategory(cycles: string): 'Fast' | 'Moderate' | 'Slow' {
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

export function getPerformanceColor(category: 'Fast' | 'Moderate' | 'Slow'): string {
  if (category === 'Fast') return 'bg-success/10 text-success border-success/30'
  if (category === 'Moderate') return 'bg-warning/10 text-warning border-warning/30'
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
