// SPDX-License-Identifier: AGPL-3.0-only
import type { CertificationXref, CertRelationship } from '../types/MigrateTypes'
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
  /** pqc_cert_present | no_pqc_cert_classical_only (blank on rows written before 2026-09-27) */
  pqc_cert_flag?: string
  /** same_release | earlier_release | platform_specific | module_of_product (blank when not recorded) */
  cert_relationship?: string
  /** Free text: the certified module, platform and release (blank when not recorded) */
  cert_covers?: string
}

export const CERT_RELATIONSHIPS: readonly CertRelationship[] = [
  'same_release',
  'earlier_release',
  'platform_specific',
  'module_of_product',
]

/** The relationship named in the file; undefined when blank or not a known value. */
export function parseCertRelationship(raw: string | undefined): CertRelationship | undefined {
  const value = (raw ?? '').trim().toLowerCase()
  return CERT_RELATIONSHIPS.find((r) => r === value)
}

/** What one certificate covers, worded once for the page, the phone sheet and the export. */
export interface CertCoverage {
  /** The certified module, platform and release as the file records them; null when blank. */
  covers: string | null
  /** One plain sentence on how it relates to the catalogue release; null when not recorded. */
  sentence: string | null
  /** True when the sentence says the certificate does not cover the catalogue release or product as a whole. */
  limited: boolean
}

/**
 * The coverage lines for one certificate. A blank relationship adds no sentence
 * and is never read as "same release"; a blank `cert_covers` adds no coverage
 * line. `catalogueRelease` is the catalogue's latest version of the product.
 */
export function certCoverageText(
  cert: Pick<CertificationXref, 'certCovers' | 'certRelationship'>,
  catalogueRelease?: string
): CertCoverage {
  const covers = cert.certCovers?.trim() || null
  const release = catalogueRelease?.trim()
  switch (cert.certRelationship) {
    case 'earlier_release':
      return {
        covers,
        sentence: `Covers an earlier release than the catalogue's latest${release ? ` (${release})` : ''}`,
        limited: true,
      }
    case 'platform_specific':
      return { covers, sentence: 'Covers named hardware platforms only', limited: true }
    case 'module_of_product':
      return {
        covers,
        sentence: 'Covers a validated module the product uses, not the whole product',
        limited: true,
      }
    case 'same_release':
      return { covers, sentence: 'Matches the catalogue release', limited: false }
    default:
      return { covers, sentence: null, limited: false }
  }
}

/** True when the file says this certificate does not cover the catalogue release or product as a whole. */
export function certIsLimited(cert: Pick<CertificationXref, 'certRelationship'>): boolean {
  return certCoverageText({ certRelationship: cert.certRelationship }).limited
}

/**
 * True when a certificate covers no post-quantum algorithm. Reads the matcher's
 * flag, and falls back to the scrape's own phrase for rows written before the
 * flag existed — both mean the same thing, so neither may be counted as PQC.
 */
export function isClassicalOnlyCert(flag: string | undefined, pqcAlgorithms: string): boolean {
  if (flag === 'no_pqc_cert_classical_only') return true
  if (flag === 'pqc_cert_present') return false
  return /no pqc mechanisms detected/i.test(pqcAlgorithms ?? '')
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
    classicalOnly: isClassicalOnlyCert(row.pqc_cert_flag, row.pqc_algorithms),
    ...(row.cert_covers?.trim() ? { certCovers: row.cert_covers.trim() } : {}),
    ...(parseCertRelationship(row.cert_relationship)
      ? { certRelationship: parseCertRelationship(row.cert_relationship) }
      : {}),
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
/**
 * One certificate's identity within a product: its scheme and number. Two rows with the
 * same identity are the same certificate; different numbers (or the same number in a
 * different scheme) are different certificates. A row with no number cannot be told apart
 * from another by id, so it is identified by its other fields and never merged away.
 */
export function certificateIdentity(x: CertificationXref): string {
  return x.certId
    ? `${x.certType}|${x.certId}`
    : `${x.certType}|${x.certProduct}|${x.certDate}|${x.certLink}`
}

/**
 * Index certificates by product id and by software name (see the note above).
 *
 * Each row is indexed once per distinct key: when a product's id and display name are the
 * same string, the row must not be added to that key twice. Within one key, a certificate
 * that appears in more than one row is listed once, so counts and badges show each
 * distinct certificate once and never merge different certificates.
 */
export function indexCertsByProduct(xrefs: CertificationXref[]): Map<string, CertificationXref[]> {
  const index = new Map<string, CertificationXref[]>()
  const seen = new Map<string, Set<string>>()
  for (const xref of xrefs) {
    for (const key of new Set([xref.productId, xref.softwareName])) {
      if (!key) continue
      const identities = seen.get(key) ?? new Set<string>()
      const identity = certificateIdentity(xref)
      if (identities.has(identity)) continue
      identities.add(identity)
      seen.set(key, identities)
      const existing = index.get(key)
      if (existing) existing.push(xref)
      else index.set(key, [xref])
    }
  }
  return index
}

export const certsByProduct: Map<string, CertificationXref[]> = indexCertsByProduct(activeXrefs)

/** Look up certifications for a product by productId first, falling back to
 *  softwareName for legacy rows that predate the product_id fix. */
export function getCertsForProduct(productId: string, softwareName: string): CertificationXref[] {
  return certsByProduct.get(productId) ?? certsByProduct.get(softwareName) ?? []
}

/** CSV file metadata. */
export const xrefMetadata = metadata
