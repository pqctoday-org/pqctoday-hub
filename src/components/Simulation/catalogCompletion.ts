// SPDX-License-Identifier: GPL-3.0-only
/**
 * Catalog-step completion (C7 Decision 3) — a catalog step is done when the
 * player has chosen at least one **PQC-capable** product in the in-sim Migrate
 * catalog. This upgrades the old "≥1 product, any product (incl. classical)"
 * rule to "you actually picked a quantum-safe replacement", which is the
 * determinable half of Decision 3.
 *
 * NOTE on "one pick per required category": the full decision wanted each catalog
 * step independently earned via the phase's *required product categories*. The
 * data to do that non-arbitrarily does not exist — the priority-matrix CSV has no
 * phase→category mapping, and the four catalog steps are generic "use the
 * catalog" prompts, not category-specific. Rather than invent a curation that
 * could be wrong, this enforces the PQC-capability requirement (real-data, exact)
 * and leaves per-category independence as a product-curation follow-up.
 */
import type { SoftwareItem } from '@/types/MigrateTypes'

/** A product is PQC-capable when its declared support starts with "Yes". */
export function isPqcCapable(item: Pick<SoftwareItem, 'pqcSupport'>): boolean {
  return (item.pqcSupport ?? '').trim().toLowerCase().startsWith('yes')
}

/**
 * True when at least one of the player's game-scoped picks is a PQC-capable
 * product. Unknown product ids (not in the catalog) never satisfy it.
 */
export function catalogDone(picks: readonly string[], software: readonly SoftwareItem[]): boolean {
  if (picks.length === 0) return false
  const byId = new Map(software.map((s) => [s.productId, s]))
  return picks.some((id) => {
    const item = byId.get(id)
    return !!item && isPqcCapable(item)
  })
}
