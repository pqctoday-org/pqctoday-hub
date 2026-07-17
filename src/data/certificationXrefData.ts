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

const activeXrefs = allXrefs.filter((x) => x.status === 'Active')

/** All certification cross-references (active only). */
export const certificationXrefs: CertificationXref[] = activeXrefs

// FIXED 2026-07-16 (migrate-process remediation Phase 5, U3): this map used
// to be keyed by software_name ONLY — a rename in either the catalog or
// this xref CSV silently dropped the Certifications section for that
// product, with no error (a join that only ever "soft-fails"). The
// maintainer-agent's match_certifications.py now writes product_id on every
// row it generates (2026-07-16 fix), so key by that first — the stable
// identity that survives a rename — and keep the software_name key too so a
// legacy row lacking product_id (a carried-forward historical entry
// pre-dating the fix) is still findable. Callers should look up by
// productId first, falling back to softwareName.
export const certsByProduct: Map<string, CertificationXref[]> = activeXrefs.reduce((map, xref) => {
  for (const key of [xref.productId, xref.softwareName]) {
    if (!key) continue
    const existing = map.get(key) || []
    existing.push(xref)
    map.set(key, existing)
  }
  return map
}, new Map<string, CertificationXref[]>())

/** Look up certifications for a product by productId first, falling back to
 *  softwareName for legacy rows that predate the product_id fix. */
export function getCertsForProduct(productId: string, softwareName: string): CertificationXref[] {
  return certsByProduct.get(productId) ?? certsByProduct.get(softwareName) ?? []
}

/** CSV file metadata. */
export const xrefMetadata = metadata
