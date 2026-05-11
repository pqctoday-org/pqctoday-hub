// SPDX-License-Identifier: GPL-3.0-only
import type { Vendor } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'
import { filterActive } from './loaderUtils'

// Glob import to find all matching vendor CSV files
const modules = import.meta.glob('./vendors_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawVendorRow {
  vendor_id: string
  vendor_name: string
  vendor_display_name: string
  website: string
  vendor_type: string
  entity_category: string
  hq_country: string
  pqc_commitment: string
  last_verified_date: string
  lei_code?: string
  lei_legal_name?: string
  lei_entity_status?: string
  gleif_url?: string
  lei_last_verified_date?: string
  lei_coverage_flag?: string
  website_url_quality?: string
  gleif_url_quality?: string
  data_quality_notes?: string
  trusted_source_id?: string
  peer_reviewed?: string
  // DS01 status-column schema (added by DS14 backfill)
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const { data: allVendors, metadata } = loadLatestCSV<RawVendorRow, Omit<Vendor, 'productCount'>>(
  modules,
  /vendors_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorDisplayName: row.vendor_display_name,
    website: row.website,
    vendorType: row.vendor_type,
    entityCategory: (row.entity_category as Vendor['entityCategory']) || 'Commercial Vendor',
    hqCountry: row.hq_country,
    pqcCommitment: (row.pqc_commitment as Vendor['pqcCommitment']) || 'Unknown',
    lastVerifiedDate: row.last_verified_date,
    leiCode: row.lei_code || undefined,
    leiLegalName: row.lei_legal_name || undefined,
    leiEntityStatus: row.lei_entity_status || undefined,
    gleifUrl: row.gleif_url || undefined,
    leiLastVerifiedDate: row.lei_last_verified_date || undefined,
    leiCoverageFlag: row.lei_coverage_flag || undefined,
    websiteUrlQuality: row.website_url_quality || undefined,
    gleifUrlQuality: row.gleif_url_quality || undefined,
    dataQualityNotes: row.data_quality_notes || undefined,
    trustedSourceId: row.trusted_source_id || undefined,
    peerReviewed: (row.peer_reviewed?.toLowerCase() as Vendor['peerReviewed']) || undefined,
    // DS01 status-column schema — null/undefined means pre-DS01 row (treated as active)
    status: row.status as 'active' | 'deprecated' | 'obsolete' | undefined,
    deprecatedAt: row.deprecated_at || undefined,
    deprecatedReason: row.deprecated_reason || undefined,
  })
)

// DS02: filter out deprecated/obsolete rows by default. Cross-ref resolvers
// or audit views can import { partitionByStatus } and access both sets.
const activeVendors = filterActive(allVendors)

/** Vendor lookup map: vendorId → Vendor (active only) */
export const vendorMap: Map<string, Vendor> = activeVendors.reduce((map, vendor) => {
  map.set(vendor.vendorId, { ...vendor, productCount: 0 })
  return map
}, new Map<string, Vendor>())

/** All vendors. */
export const vendors: Vendor[] = Array.from(vendorMap.values())

/** CSV file metadata. */
export const vendorMetadata = metadata
