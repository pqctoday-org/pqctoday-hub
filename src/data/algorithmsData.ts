// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSVAsync } from './csvUtils'
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

// Import CSV data dynamically (lazy glob)
const csvModule = import.meta.glob('./algorithms_transitions_*.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmTransition[] | null = null
export let loadedTransitionMetadata: { filename: string; date: Date | null } | null = null

export async function loadAlgorithmsData(): Promise<AlgorithmTransition[]> {
  if (cachedData) return cachedData

  const { data, metadata } = await loadLatestCSVAsync<RawTransitionRow, AlgorithmTransition>(
    csvModule,
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

  loadedTransitionMetadata = metadata
    ? { filename: metadata.filename, date: metadata.lastUpdate }
    : null

  cachedData = data
  return data
}

// For backward compatibility, export the data synchronously
// This will be populated after the first load
export const algorithmsData: AlgorithmTransition[] = []

// Re-export for consumers that use these helpers
export { getDateFromFilename, getRevisionFromFilename }
