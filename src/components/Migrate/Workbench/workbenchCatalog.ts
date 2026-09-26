// SPDX-License-Identifier: GPL-3.0-only
//
// Builds a domain → products index from the live catalog once, using the
// audited classifyProductDomain mapping. Every active product lands in exactly
// one domain (guaranteed by migrationAssets.coverage.test.ts), so the
// asset-first IA never hides a product.

import { softwareData, vendorMap } from '@/data/migrateData'
import { classifyProductDomain, type DomainId } from '@/data/migrationAssets'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { PQC_STATUS_RANK, productPqcStatus } from './productStatus'

const INDEX = new Map<DomainId, SoftwareItem[]>()

for (const item of softwareData) {
  const domain = classifyProductDomain(item.categoryName, item.infrastructureLayer)
  if (!domain) continue // coverage test forbids this for active rows
  const list = INDEX.get(domain)
  if (list) list.push(item)
  else INDEX.set(domain, [item])
}

// Pre-sort each domain: GA → Partial → Roadmap → None, then FIPS-validated up,
// then by name for stability.
for (const list of INDEX.values()) {
  list.sort((a, b) => {
    const ra = PQC_STATUS_RANK[productPqcStatus(a).status]
    const rb = PQC_STATUS_RANK[productPqcStatus(b).status]
    if (ra !== rb) return ra - rb
    const fa = (a.fipsValidated || '').toLowerCase().startsWith('yes') ? 0 : 1
    const fb = (b.fipsValidated || '').toLowerCase().startsWith('yes') ? 0 : 1
    if (fa !== fb) return fa - fb
    return a.softwareName.localeCompare(b.softwareName)
  })
}

/** Products whose domain === the given domain id (already status-sorted). */
export function productsForDomain(domain: DomainId): SoftwareItem[] {
  return INDEX.get(domain) ?? []
}

// vendorId → products index (status-sorted), for the vendor-roadmap tab.
const VENDOR_INDEX = new Map<string, SoftwareItem[]>()
for (const item of softwareData) {
  if (!item.vendorId) continue
  const list = VENDOR_INDEX.get(item.vendorId)
  if (list) list.push(item)
  else VENDOR_INDEX.set(item.vendorId, [item])
}
for (const list of VENDOR_INDEX.values()) {
  list.sort((a, b) => {
    const ra = PQC_STATUS_RANK[productPqcStatus(a).status]
    const rb = PQC_STATUS_RANK[productPqcStatus(b).status]
    return ra - rb || a.softwareName.localeCompare(b.softwareName)
  })
}

/** Products belonging to a vendor (already status-sorted). */
export function productsForVendor(vendorId: string): SoftwareItem[] {
  return VENDOR_INDEX.get(vendorId) ?? []
}

/** Count of products per domain (for sidebar/section counts). */
export function domainProductCount(domain: DomainId): number {
  return INDEX.get(domain)?.length ?? 0
}

/** Free-text filter within a product list (name / vendor-ish / category). */
/** `productIds`, when given, is an EXACT membership filter (by SoftwareItem.productId)
 * that takes over from the free-text `query` entirely — added 2026-07-30 for the
 * leader-detail "view N open-source projects" deep link, which already knows the
 * exact product ids (leader.migrateCatalogRefs) and shouldn't re-derive them via a
 * fuzzy text match the way the plain `query` path does. */
export function filterProducts(
  items: SoftwareItem[],
  query: string,
  productIds?: string[]
): SoftwareItem[] {
  if (productIds && productIds.length > 0) {
    const wanted = new Set(productIds)
    return items.filter((p) => wanted.has(p.productId))
  }
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (p) =>
      p.softwareName.toLowerCase().includes(q) ||
      (p.categoryName || '').toLowerCase().includes(q) ||
      (p.vendorId || '').toLowerCase().includes(q) ||
      p.productId.toLowerCase() === q
  )
}

/** Facet filters on the product list (migrate remediation r2 J2). 'all' = no filter. */
export interface ProductFacets {
  population: 'all' | 'pqc_relevant' | 'migration_baseline'
  pqc: 'all' | 'available' | 'partial' | 'planned' | 'none' | 'unknown'
  certified: 'all' | 'linked' | 'none'
}

export const NO_FACETS: ProductFacets = { population: 'all', pqc: 'all', certified: 'all' }

/**
 * Narrow a product list by population, canonical PQC status and whether the
 * product has any certification link. `hasCert` is injected so this stays a
 * pure function (the certification xref loader is a separate module).
 */
export function applyProductFacets(
  items: SoftwareItem[],
  facets: ProductFacets,
  hasCert: (item: SoftwareItem) => boolean
): SoftwareItem[] {
  return items.filter((p) => {
    if (facets.population !== 'all' && p.cataloguePopulation !== facets.population) return false
    if (facets.pqc !== 'all') {
      const s = (p.pqcStatusCanonical || '').toLowerCase()
      const bucket =
        s === 'available' || s === 'partial' || s === 'none'
          ? s
          : s === 'roadmap' || s === 'planned'
            ? 'planned'
            : 'unknown'
      if (bucket !== facets.pqc) return false
    }
    if (facets.certified !== 'all' && hasCert(p) !== (facets.certified === 'linked')) return false
    return true
  })
}

export interface ProductSearchHit {
  domain: DomainId
  product: SoftwareItem
  vendorName?: string
}

/**
 * Cross-domain product/vendor-name search for the top-level "Search what you
 * run" box in AssetList — that box previously only matched the ~18 asset and
 * foundation-category LABELS (e.g. "TLS key exchange"), so a real product
 * name like "Qinsight" always returned "No matches" even though the product
 * is in the catalog, just filed under a category the user hadn't picked yet.
 * This searches every product's name and vendor name (not just its raw
 * vendorId code) across ALL domains at once. Capped via `limit` so the
 * sidebar stays a quick jump-to, not a second full product browser — the
 * in-domain filter box (`filterProducts`) is still the right place to browse
 * a whole category.
 */
export function searchProducts(query: string, limit = 6): ProductSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: ProductSearchHit[] = []
  for (const [domain, items] of INDEX) {
    for (const product of items) {
      const vendorName = product.vendorId ? vendorMap.get(product.vendorId)?.vendorName : undefined
      if (
        product.softwareName.toLowerCase().includes(q) ||
        (vendorName || '').toLowerCase().includes(q) ||
        product.productId.toLowerCase() === q
      ) {
        hits.push({ domain, product, vendorName })
      }
    }
  }
  hits.sort((a, b) => a.product.softwareName.localeCompare(b.product.softwareName))
  return hits.slice(0, limit)
}
