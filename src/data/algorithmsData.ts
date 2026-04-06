// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { getDateFromFilename, getRevisionFromFilename } from './pqcAlgorithmsData'

export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function:
    | 'Encryption/KEM'
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
  region: string
  status: string
  statusUrl?: string
}

interface RawTransitionRow {
  'Classical Algorithm': string
  'Key Size': string
  'PQC Replacement': string
  Function: string
  'Deprecation Date': string
  'Standardization Date': string
  Region: string
  Status: string
  'Status URL': string
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
  (row) => ({
    classical: row['Classical Algorithm'],
    keySize: row['Key Size'],
    pqc: row['PQC Replacement'],
    function: row['Function'] as AlgorithmTransition['function'],
    deprecationDate: row['Deprecation Date'],
    standardizationDate: row['Standardization Date'],
    region: row['Region'] || '',
    status: row['Status'] || '',
    statusUrl: row['Status URL'] || undefined,
  })
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
  if (n.includes('mlkem') && (n.startsWith('x25519') || n.startsWith('secp'))) return 'Hybrid'
  if (n.startsWith('covercrypt') || n.startsWith('hpke-pq')) return 'Hybrid'
  // Composite: contains a PQC name alongside a classical algorithm name
  if (n.includes('ml-dsa') || n.includes('ml-kem')) {
    if (n.includes('rsa') || n.includes('ecdsa') || n.includes('ecdh') || n.includes('ed25519'))
      return 'Hybrid'
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

/** Derive function group from transition's function field */
export function getTransitionFunctionGroup(
  fn: AlgorithmTransition['function']
): 'KEM' | 'Signature' | null {
  if (
    fn === 'Encryption/KEM' ||
    fn === 'Hybrid KEM' ||
    fn === 'Composite KEM' ||
    fn === 'Hybrid KEM (HPKE)' ||
    fn === 'Hybrid KEM with Access Control'
  )
    return 'KEM'
  if (fn === 'Signature' || fn === 'Composite Signature') return 'Signature'
  return null
}
