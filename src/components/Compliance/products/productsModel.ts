// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Products model — "which of the things I run are certified, and under which
 * scheme?"
 *
 * The chain is already in the repo; this only assembles it:
 *
 *   pqc_product_catalog  ->  migrate_certification_xref  ->  CMVP / ACVP / CC
 *      (what you run)         (product -> certificate)        (the evidence)
 *
 * Two rules, both learned the hard way on this data:
 *
 *  1. **Coverage is three-state.** One product can hold PQC and classical-only
 *     certificates at once — Thales Luna and Entrust nShield both carry PQC via
 *     ACVP while their FIPS 140-3 certificate covers classical algorithms only.
 *     Collapsing that to a yes/no would report either as "PQC validated" or as
 *     "not validated", and both readings are wrong.
 *
 *  2. **Count certificates, not rows.** Until 2026-08-11 the same certificate
 *     could appear under two ids, so a naive row count double-counted coverage.
 *     That is fixed in the data, but counting distinct certIds here means a
 *     future recurrence shows up as a stable number rather than an inflated one.
 */
import type { CertificationXref } from '@/types/MigrateTypes'

export type Coverage = 'pqc' | 'mixed' | 'classical' | 'none'

export interface ProductCertification {
  productId: string
  softwareName: string
  certificates: CertificationXref[]
  /** Distinct schemes with a count, e.g. `ACVP ×3`. */
  schemes: { scheme: string; count: number }[]
  pqcCount: number
  /** Evaluation records that name PQC but do not validate the algorithm or module. */
  evaluatedClaimCount: number
  classicalCount: number
  coverage: Coverage
}

export type PqcEvidenceKind =
  'algorithm-validation' | 'module-validation' | 'evaluated-claim' | 'none'

/** Classify what a named algorithm means under the record's actual scheme. */
export function pqcEvidenceKind(cert: CertificationXref): PqcEvidenceKind {
  const algos = (cert.pqcAlgorithms ?? '').trim()
  if (!algos || /no pqc mechanisms detected/i.test(algos)) return 'none'
  if (cert.certType === 'ACVP') return 'algorithm-validation'
  if (cert.certType === 'FIPS 140-3') return 'module-validation'
  return 'evaluated-claim'
}

export function pqcEvidenceLabel(cert: CertificationXref): string {
  switch (pqcEvidenceKind(cert)) {
    case 'algorithm-validation':
      return 'Algorithm implementation validated'
    case 'module-validation':
      return 'PQC listed by the validated module'
    case 'evaluated-claim':
      return 'PQC named in evaluated product documentation — not algorithm validation'
    default:
      return 'No PQC mechanisms recorded'
  }
}

/** True only for algorithm- or module-validation evidence, never a CC/PSA claim. */
export function isPqcCertificate(cert: CertificationXref): boolean {
  const kind = pqcEvidenceKind(cert)
  return kind === 'algorithm-validation' || kind === 'module-validation'
}

/**
 * Three-state coverage.
 *
 * `mixed` is the interesting one and the reason this is not a boolean: a
 * product whose HSM is PQC-validated under ACVP but whose FIPS certificate
 * predates PQC is neither "validated" nor "not validated".
 */
export function coverageOf(pqcCount: number, classicalCount: number): Coverage {
  if (pqcCount === 0 && classicalCount === 0) return 'none'
  if (pqcCount > 0 && classicalCount > 0) return 'mixed'
  return pqcCount > 0 ? 'pqc' : 'classical'
}

/**
 * Builds one row per product from its certificates.
 *
 * De-duplicates by `certId` first: one certificate covering a product twice is
 * one piece of evidence, not two.
 */
export function summarizeProduct(
  productId: string,
  softwareName: string,
  certs: CertificationXref[]
): ProductCertification {
  const seen = new Set<string>()
  const unique: CertificationXref[] = []
  for (const cert of certs) {
    if (seen.has(cert.certId)) continue
    seen.add(cert.certId)
    unique.push(cert)
  }

  const pqcCount = unique.filter(isPqcCertificate).length
  const evaluatedClaimCount = unique.filter(
    (cert) => pqcEvidenceKind(cert) === 'evaluated-claim'
  ).length
  const classicalCount = unique.length - pqcCount - evaluatedClaimCount

  const bySchemeCount = new Map<string, number>()
  for (const cert of unique) {
    bySchemeCount.set(cert.certType, (bySchemeCount.get(cert.certType) ?? 0) + 1)
  }

  return {
    productId,
    softwareName,
    // PQC evidence first — it is what the reader came for.
    certificates: [...unique].sort((a, b) => {
      const ap = isPqcCertificate(a) ? 0 : 1
      const bp = isPqcCertificate(b) ? 0 : 1
      return ap !== bp ? ap - bp : a.certType.localeCompare(b.certType)
    }),
    schemes: [...bySchemeCount.entries()]
      .map(([scheme, count]) => ({ scheme, count }))
      .sort((a, b) => a.scheme.localeCompare(b.scheme)),
    pqcCount,
    evaluatedClaimCount,
    classicalCount,
    coverage: coverageOf(pqcCount, classicalCount),
  }
}

/**
 * Groups certificates into product rows.
 *
 * `certsByProduct` deliberately stores every certificate under TWO keys — the
 * productId and the softwareName — so a legacy row lacking a productId is
 * still findable (see certificationXrefData.ts). Iterating the map therefore
 * visits each product twice, and a first version of this function duly listed
 * "Alibaba Cloud Crypto" and "Android 16" twice each on screen. De-duplicate
 * on a stable product identity, not on the map key.
 */
export function buildProductRows(
  certsByProduct: Map<string, CertificationXref[]>,
  ownedKeys?: ReadonlySet<string>
): ProductCertification[] {
  const byIdentity = new Map<
    string,
    { productId: string; name: string; certs: CertificationXref[] }
  >()

  for (const [key, certs] of certsByProduct) {
    if (certs.length === 0) continue
    if (ownedKeys && !ownedKeys.has(key) && !ownedKeys.has(certs[0].softwareName)) continue
    const productId = certs[0].productId || key
    const name = certs[0].softwareName || key
    // productId when present, name otherwise — the same choice the lookup makes.
    const identity = productId || name
    const entry = byIdentity.get(identity)
    if (entry) entry.certs.push(...certs)
    else byIdentity.set(identity, { productId, name, certs: [...certs] })
  }

  return [...byIdentity.values()]
    .map((e) => summarizeProduct(e.productId, e.name, e.certs))
    .sort((a, b) => a.softwareName.localeCompare(b.softwareName))
}

/** Headline counts. Products, certificates — never a percentage. */
export function summarizeCoverage(rows: ProductCertification[]): {
  products: number
  certificates: number
  evaluatedClaims: number
  byCoverage: Record<Coverage, number>
} {
  const byCoverage: Record<Coverage, number> = { pqc: 0, mixed: 0, classical: 0, none: 0 }
  let certificates = 0
  let evaluatedClaims = 0
  for (const row of rows) {
    byCoverage[row.coverage] += 1
    certificates += row.certificates.length
    evaluatedClaims += row.evaluatedClaimCount
  }
  return { products: rows.length, certificates, evaluatedClaims, byCoverage }
}

/**
 * A row's `?prod=` value — the same identity buildProductRows de-duplicates
 * on, so it is unique per row: the catalogue product id, or the name for a
 * certificate with no catalogue product.
 */
export function productKey(row: Pick<ProductCertification, 'productId' | 'softwareName'>): string {
  return row.productId || row.softwareName
}
