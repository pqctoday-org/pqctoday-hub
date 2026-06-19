// SPDX-License-Identifier: GPL-3.0-only
/**
 * Central catalog status accessor — the single source of truth for product PQC
 * status. Learning modules MUST read a product's PQC status from here (by its
 * catalog softwareName) instead of hard-coding their own copy, which drifts.
 * Module-specific teaching details (API examples, FIPS levels, PKCS#11 versions,
 * algorithm breakdowns) stay in the module; only the STATUS comes from here.
 */
import { softwareData } from './migrateData'

export type CatalogAvailability = 'available' | 'partial' | 'roadmap' | 'none' | 'unverified'

/** Map the catalog's canonical PQC status string to a normalized availability. */
export function canonicalToAvailability(canonical: string | undefined): CatalogAvailability {
  const c = (canonical || '').trim().toLowerCase()
  if (c.startsWith('available') || c === 'yes' || c === 'production') return 'available'
  if (c.startsWith('partial') || c === 'in-development') return 'partial'
  if (c.startsWith('roadmap') || c.startsWith('planned')) return 'roadmap'
  if (c === 'none') return 'none'
  return 'unverified'
}

const _byName = new Map(softwareData.map((s) => [s.softwareName, s]))

/**
 * Central catalog PQC status for a product, looked up by exact `softwareName`.
 * Returns null when the product is not in the catalog (the module should treat
 * that as 'unverified' and/or the product should be added to the catalog).
 */
export function getCatalogStatus(
  softwareName: string
): { canonical: string; availability: CatalogAvailability } | null {
  const item = _byName.get(softwareName)
  if (!item) return null
  return {
    canonical: item.pqcStatusCanonical ?? '',
    availability: canonicalToAvailability(item.pqcStatusCanonical),
  }
}

/** True if a product exists in the central catalog. */
export function isInCatalog(softwareName: string): boolean {
  return _byName.has(softwareName)
}
