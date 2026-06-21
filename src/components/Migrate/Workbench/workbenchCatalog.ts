// SPDX-License-Identifier: GPL-3.0-only
//
// Builds a domain → products index from the live catalog once, using the
// audited classifyProductDomain mapping. Every active product lands in exactly
// one domain (guaranteed by migrationAssets.coverage.test.ts), so the
// asset-first IA never hides a product.

import { softwareData } from '@/data/migrateData'
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

/** Count of products per domain (for sidebar/section counts). */
export function domainProductCount(domain: DomainId): number {
  return INDEX.get(domain)?.length ?? 0
}

/** Free-text filter within a product list (name / vendor-ish / category). */
export function filterProducts(items: SoftwareItem[], query: string): SoftwareItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (p) =>
      p.softwareName.toLowerCase().includes(q) ||
      (p.categoryName || '').toLowerCase().includes(q) ||
      (p.vendorId || '').toLowerCase().includes(q)
  )
}
