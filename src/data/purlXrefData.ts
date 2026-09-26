// SPDX-License-Identifier: GPL-3.0-only
import type { PurlXref } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

const modules = import.meta.glob('./migrate_purl_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawPurlRow {
  product_id?: string
  software_name: string
  purl: string
  purl_type: string
  purl_namespace: string
  purl_name: string
  match_confidence: string
  status: string
  registry_url: string
  last_verified_date: string
  deprecated_at?: string
}

const { data: allPurlXrefs, metadata } = loadLatestCSV<RawPurlRow, PurlXref>(
  modules,
  /purl_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  // A row carrying deprecated_at (the generator's own retirement mark) is
  // history, not a live identifier.
  (row) =>
    (row.deprecated_at || '').trim()
      ? null
      : {
          productId: row.product_id || '',
          softwareName: row.software_name,
          purl: row.purl,
          purlType: row.purl_type as PurlXref['purlType'],
          purlNamespace: row.purl_namespace,
          purlName: row.purl_name,
          matchConfidence: row.match_confidence as PurlXref['matchConfidence'],
          status: row.status as PurlXref['status'],
          registryUrl: row.registry_url,
          lastVerifiedDate: row.last_verified_date,
        }
)

/** All PURL cross-references (includes not_found rows). */
export const purlXrefs: PurlXref[] = allPurlXrefs

/**
 * Lookup map: productId or softwareName → PurlXref
 * One package URL per product. Only matched entries are useful for display.
 */
export const purlByProduct: Map<string, PurlXref> = allPurlXrefs.reduce((map, xref) => {
  // Keyed by productId (immutable) AND by softwareName (legacy callers).
  // Prefer a matched entry over partial/not_found.
  for (const key of [xref.productId, xref.softwareName]) {
    if (!key) continue
    const existing = map.get(key)
    if (!existing || (existing.status !== 'matched' && xref.status === 'matched')) {
      map.set(key, xref)
    }
  }
  return map
}, new Map<string, PurlXref>())

/** CSV file metadata. */
export const purlXrefMetadata = metadata
