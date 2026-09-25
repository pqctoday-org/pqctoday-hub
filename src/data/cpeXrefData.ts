// SPDX-License-Identifier: GPL-3.0-only
import type { CpeXref } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

const modules = import.meta.glob('./migrate_cpe_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawCpeRow {
  product_id?: string
  software_name: string
  cpe_uri: string
  cpe_vendor: string
  cpe_product: string
  match_confidence: string
  status: string
  nvd_url: string
  last_verified_date: string
  deprecated_at?: string
}

const { data: allCpeXrefs, metadata } = loadLatestCSV<RawCpeRow, CpeXref>(
  modules,
  /cpe_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  // A row carrying deprecated_at (the generator's own retirement mark) is
  // history, not a live identifier.
  (row) =>
    (row.deprecated_at || '').trim()
      ? null
      : {
          productId: row.product_id || '',
          softwareName: row.software_name,
          cpeUri: row.cpe_uri,
          cpeVendor: row.cpe_vendor,
          cpeProduct: row.cpe_product,
          matchConfidence: row.match_confidence as CpeXref['matchConfidence'],
          status: row.status as CpeXref['status'],
          nvdUrl: row.nvd_url,
          lastVerifiedDate: row.last_verified_date,
        }
)

/** All CPE cross-references (includes not_found rows). */
export const cpeXrefs: CpeXref[] = allCpeXrefs

/**
 * Lookup map: productId or softwareName → CpeXref
 * One CPE identity per product. Only matched/partial entries are useful for display,
 * but all rows are in the map so gaps are visible.
 */
export const cpeByProduct: Map<string, CpeXref> = allCpeXrefs.reduce((map, xref) => {
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
}, new Map<string, CpeXref>())

/** CSV file metadata. */
export const cpeXrefMetadata = metadata
