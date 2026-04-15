// SPDX-License-Identifier: GPL-3.0-only
import type { CertificationXref } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

// Glob import to find all matching xref CSV files
const modules = import.meta.glob('./migrate_certification_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawXrefRow {
  product_id?: string
  software_name: string
  cert_type: string
  cert_id: string
  cert_vendor: string
  cert_product: string
  pqc_algorithms: string
  certification_level: string
  status: string
  cert_date: string
  cert_link: string
}

const { data: allXrefs, metadata } = loadLatestCSV<RawXrefRow, CertificationXref>(
  modules,
  /xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    productId: row.product_id || '',
    softwareName: row.software_name,
    certType: row.cert_type as CertificationXref['certType'],
    certId: row.cert_id,
    certVendor: row.cert_vendor,
    certProduct: row.cert_product,
    pqcAlgorithms: row.pqc_algorithms,
    certificationLevel: row.certification_level,
    status: row.status,
    certDate: row.cert_date,
    certLink: row.cert_link,
  })
)

/** All certification cross-references. */
export const certificationXrefs: CertificationXref[] = allXrefs

/** Lookup map: software_name → CertificationXref[] */
export const certsByProduct: Map<string, CertificationXref[]> = allXrefs.reduce((map, xref) => {
  const existing = map.get(xref.softwareName) || []
  existing.push(xref)
  map.set(xref.softwareName, existing)
  return map
}, new Map<string, CertificationXref[]>())

/** CSV file metadata. */
export const xrefMetadata = metadata
