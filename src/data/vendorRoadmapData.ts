// SPDX-License-Identifier: GPL-3.0-only
import type { VendorRoadmap } from '../types/MigrateTypes'
import { compareDatasets } from '../utils/dataComparison'
import { loadLatestCSV } from './csvUtils'

const modules = import.meta.glob('./migrate_vendor_roadmap_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawRoadmapRow {
  vendor_id: string
  vendor_name: string
  roadmap_url: string
  roadmap_title: string
  roadmap_type: string
  publish_date: string
  last_verified_date: string
  coverage_notes: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const {
  data: currentRoadmaps,
  previousData: previousRoadmaps,
  metadata,
} = loadLatestCSV<RawRoadmapRow, VendorRoadmap>(
  modules,
  /roadmap_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    // Self-containment: skip deprecated rows (carried forward for audit, filtered at load).
    if (row.status && row.status !== 'active') return null
    const roadmapUrl = row.roadmap_url ?? ''
    return {
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      roadmapUrl,
      roadmapTitle: row.roadmap_title ?? '',
      roadmapType: (row.roadmap_type ?? '') as VendorRoadmap['roadmapType'],
      publishDate: row.publish_date ?? '',
      lastVerifiedDate: row.last_verified_date ?? '',
      coverageNotes: row.coverage_notes ?? '',
      compositeId: `${row.vendor_id}|${roadmapUrl}`,
      roadmapStatus: 'active',
    }
  },
  true // withPrevious — enables New/Updated status badges (parity with product catalog)
)

// New/Updated badges vs the previous dated CSV — keyed on compositeId, not
// vendorId, since a vendor can now have more than one active row and
// vendorId alone is no longer unique per row.
const statusMap = previousRoadmaps
  ? compareDatasets(currentRoadmaps, previousRoadmaps, 'compositeId')
  : new Map<string, 'New' | 'Updated' | undefined>()

/** All active vendor roadmap entries, with New/Updated status badges. */
export const vendorRoadmaps: VendorRoadmap[] = currentRoadmaps.map((r) => ({
  ...r,
  status: statusMap.get(r.compositeId) as VendorRoadmap['status'],
}))

/**
 * Lookup map: vendor_id → all of that vendor's active VendorRoadmap rows.
 * A vendor can carry more than one concurrently-active row (e.g. a general
 * roadmap AND a separate, more specific announcement) — callers render one
 * presentational unit per row, not one per vendor.
 */
export const roadmapByVendorId: Map<string, VendorRoadmap[]> = new Map()
for (const r of vendorRoadmaps) {
  const list = roadmapByVendorId.get(r.vendorId)
  if (list) list.push(r)
  else roadmapByVendorId.set(r.vendorId, [r])
}

/** CSV file metadata. */
export const vendorRoadmapMetadata = metadata
