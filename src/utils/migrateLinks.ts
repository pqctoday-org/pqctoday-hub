// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical in-app links into /migrate. The page reads `product` (a
 * product_id, or an exact/former name), `productIds`, `domain` (a workbench
 * DomainId) and `vendor`; the older `q` / `layer` / `cat` / `category` /
 * `highlight` / `industry` forms are only tolerated for old links, so new
 * links are built here.
 */
import { classifyProductDomain, type DomainId } from '@/data/migrationAssets'

/**
 * Workbench domain for a catalog infrastructure layer ("Hardware", "Network",
 * "Security Stack", …), via the catalog classifier's own layer fallback — the
 * same bucket a product on that layer with no more specific category lands in.
 */
export function migrateDomainForLayer(layer: string): DomainId | null {
  return classifyProductDomain('', layer)
}

/** `/migrate?domain=<id>`, or bare `/migrate` when no domain is known. */
export function migrateDomainHref(domain: DomainId | null | undefined): string {
  return domain ? `/migrate?domain=${encodeURIComponent(domain)}` : '/migrate'
}

/** `/migrate?domain=<id>` for a catalog infrastructure layer. */
export function migrateLayerHref(layer: string): string {
  return migrateDomainHref(migrateDomainForLayer(layer))
}

/** `/migrate?product=<product_id>` — opens and expands that one product. */
export function migrateProductHref(productIdOrName: string): string {
  return `/migrate?product=${encodeURIComponent(productIdOrName)}`
}
