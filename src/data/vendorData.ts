// SPDX-License-Identifier: GPL-3.0-only
import type { Vendor } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

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
  })
)

/** Vendor lookup map: vendorId → Vendor */
export const vendorMap: Map<string, Vendor> = allVendors.reduce((map, vendor) => {
  map.set(vendor.vendorId, { ...vendor, productCount: 0 })
  return map
}, new Map<string, Vendor>())

/** All vendors. */
export const vendors: Vendor[] = Array.from(vendorMap.values())

/** CSV file metadata. */
export const vendorMetadata = metadata
