// SPDX-License-Identifier: GPL-3.0-only
import type { VendorPartner } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

const modules = import.meta.glob('./vendor_partners_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawPartnerRow {
  software_name: string
  partner_vendor_id: string
  partner_name: string
  role: string
  last_updated: string
}

const { data: allPartners, metadata } = loadLatestCSV<RawPartnerRow, VendorPartner>(
  modules,
  /vendor_partners_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    softwareName: row.software_name,
    partnerVendorId: row.partner_vendor_id,
    partnerName: row.partner_name,
    role: (row.role === 'primary' ? 'primary' : 'partner') as VendorPartner['role'],
    lastUpdated: row.last_updated,
  })
)

/** All vendor partnership rows. One product can have multiple partners. */
export const vendorPartners: VendorPartner[] = allPartners

/** Lookup: software_name → all partners for that product. */
export const partnersByProduct: Map<string, VendorPartner[]> = allPartners.reduce((map, p) => {
  const existing = map.get(p.softwareName) ?? []
  existing.push(p)
  map.set(p.softwareName, existing)
  return map
}, new Map<string, VendorPartner[]>())

/** CSV file metadata. */
export const vendorPartnersMetadata = metadata
