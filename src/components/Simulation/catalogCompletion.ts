// SPDX-License-Identifier: GPL-3.0-only
/**
 * Catalog-step completion helper (C7 Decision 3).
 *
 * A catalog task is earned PER-TASK: SimulationView marks the open task done when
 * the player picks a PQC-capable product while that task's catalog is open (so the
 * four catalog tasks complete independently, not all-at-once). This module owns
 * the one shared, testable predicate that decides "is this product quantum-safe?".
 */
import type { SoftwareItem } from '@/types/MigrateTypes'

/** A product is PQC-capable when its declared support starts with "Yes". */
export function isPqcCapable(item: Pick<SoftwareItem, 'pqcSupport'>): boolean {
  return (item.pqcSupport ?? '').trim().toLowerCase().startsWith('yes')
}
