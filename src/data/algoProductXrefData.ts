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

/** Strip parenthetical suffix: "ML-KEM-768 (NIST Level 3)" → "ML-KEM-768" */
export function baseAlgoName(pqcName: string): string {
  return pqcName.split('(')[0].trim()
}

/** Also try the family prefix: "ML-KEM-768" → "ML-KEM" as a fallback key */
export function algoFamilyPrefix(name: string): string | null {
  const idx = name.lastIndexOf('-')
  if (idx < 4) return null
  return name.substring(0, idx)
}

/**
 * Resolve every known implementation/reference for an algorithm name, falling
 * back to its family prefix (e.g. "SLH-DSA" covers all SLH-DSA-* variants).
 * Shared by the Implementations modal and the Browse table's "no known
 * implementation" indicator — both need the exact same match logic so a
 * badge and its drilldown never disagree.
 */
export function resolveAlgoXrefs(algorithmName: string): AlgoProductXref[] {
  const base = baseAlgoName(algorithmName)
  const direct = implsByAlgorithm.get(base)
  if (direct && direct.length > 0) return direct

  const prefix = algoFamilyPrefix(base)
  if (!prefix) return []
  const accumulated: AlgoProductXref[] = []
  for (const [key, xrefs] of implsByAlgorithm) {
    if (key.startsWith(prefix + '-') || key === prefix) {
      for (const x of xrefs) {
        if (!accumulated.some((a) => a.implementationName === x.implementationName)) {
          accumulated.push(x)
        }
      }
    }
  }
  return accumulated
}
