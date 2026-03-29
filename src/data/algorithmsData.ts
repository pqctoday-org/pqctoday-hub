// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { getDateFromFilename, getRevisionFromFilename } from './pqcAlgorithmsData'

export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature' | 'Hybrid KEM' | 'Hash' | 'Symmetric'
  deprecationDate: string
  standardizationDate: string
}

interface RawTransitionRow {
  'Classical Algorithm': string
  'Key Size': string
  'PQC Replacement': string
  Function: string
  'Deprecation Date': string
  'Standardization Date': string
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
    n.startsWith('fn-dsa')
  )
    return 'Lattice'
  if (n.startsWith('hqc') || n.startsWith('classic-mceliece')) return 'Code-based'
  if (n.startsWith('slh-dsa') || n.startsWith('lms') || n.startsWith('xmss')) return 'Hash-based'
  if (n.includes('mlkem') && (n.startsWith('x25519') || n.startsWith('secp'))) return 'Hybrid'
  if (n.startsWith('sha3') || n.startsWith('hmac-sha') || n.startsWith('aes')) return 'N/A'
  return 'N/A'
}

/** Derive function group from transition's function field */
export function getTransitionFunctionGroup(
  fn: AlgorithmTransition['function']
): 'KEM' | 'Signature' | null {
  if (fn === 'Encryption/KEM' || fn === 'Hybrid KEM') return 'KEM'
  if (fn === 'Signature') return 'Signature'
  return null
}
