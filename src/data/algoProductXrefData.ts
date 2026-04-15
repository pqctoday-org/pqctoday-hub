// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

export interface AlgoProductXref {
  productId: string
  algorithmName: string
  implementationName: string
  /** Catalog software_name FK — empty string when no catalog entry exists */
  softwareName: string
  implementationType: 'Reference' | 'Library'
  implementationUrl: string
  verificationStatus: 'Verified' | 'Pending Verification'
  notes: string
}

interface RawXrefRow {
  product_id?: string
  algorithm_name: string
  implementation_name: string
  software_name: string
  implementation_type: string
  implementation_url: string
  verification_status: string
  notes: string
}

const modules = import.meta.glob('./algo_product_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: allXrefs, metadata } = loadLatestCSV<RawXrefRow, AlgoProductXref>(
  modules,
  /xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    productId: row.product_id || '',
    algorithmName: row.algorithm_name,
    implementationName: row.implementation_name,
    softwareName: row.software_name ?? '',
    implementationType: (row.implementation_type === 'Reference'
      ? 'Reference'
      : 'Library') as AlgoProductXref['implementationType'],
    implementationUrl: row.implementation_url ?? '',
    verificationStatus: (row.verification_status === 'Pending Verification'
      ? 'Pending Verification'
      : 'Verified') as AlgoProductXref['verificationStatus'],
    notes: row.notes ?? '',
  })
)

/** All algorithm–implementation cross-references (open-source libraries only). */
export const algoProductXrefs: AlgoProductXref[] = allXrefs

/**
 * Lookup map: algorithmName → AlgoProductXref[]
 * O(1) access for the modal — built once at module load.
 */
export const implsByAlgorithm: Map<string, AlgoProductXref[]> = allXrefs.reduce((map, xref) => {
  const existing = map.get(xref.algorithmName)
  if (existing) {
    existing.push(xref)
  } else {
    map.set(xref.algorithmName, [xref])
  }
  return map
}, new Map<string, AlgoProductXref[]>())

/** CSV file metadata (filename + date). */
export const xrefAlgoMetadata = metadata
