// SPDX-License-Identifier: GPL-3.0-only
import type { VendorRoadmap } from '../types/MigrateTypes'
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
}

const { data: allRoadmaps, metadata } = loadLatestCSV<RawRoadmapRow, VendorRoadmap>(
  modules,
  /roadmap_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    roadmapUrl: row.roadmap_url ?? '',
    roadmapTitle: row.roadmap_title ?? '',
    roadmapType: (row.roadmap_type ?? '') as VendorRoadmap['roadmapType'],
    publishDate: row.publish_date ?? '',
    lastVerifiedDate: row.last_verified_date ?? '',
    coverageNotes: row.coverage_notes ?? '',
  })
)

/** All vendor roadmap entries (including those with no URL). */
export const vendorRoadmaps: VendorRoadmap[] = allRoadmaps

/** Lookup map: vendor_id → VendorRoadmap */
export const roadmapByVendorId: Map<string, VendorRoadmap> = new Map(
  allRoadmaps.map((r) => [r.vendorId, r])
)

/** CSV file metadata. */
export const vendorRoadmapMetadata = metadata
