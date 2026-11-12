// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The P5 effort gate on edge migration, in one place.
 *
 * Completed P5 (Pilots) activities unlock the right to migrate a share of the
 * estate's migratable links: unlocked = floor(p5Frac × migratable). The
 * ArchitecturePanel enforces it; the Decide card and the panel both explain
 * it. 09-28 (content plan decision P5): an architecture step can come up as
 * the "next move" before enough links are unlocked (e.g. 2 of the 4 it needs
 * at L3). The rule stays — the player is TOLD, and pointed at the other P5
 * tasks that unlock more.
 */
import { ARCHITECTURES } from '@/data/simArchitecture'
import type { SimSize } from '@/data/moscaClock'
import { planningForArchitecture, type EdgePlanningProgress } from './edgePlanningProgress'

export interface ArchCapacity {
  planning: EdgePlanningProgress
  vulnerable: number
  migratable: number
  /** migratable links already decided (hybrid or pure) */
  done: number
  /** Exact named selections receiving current effort credit. */
  credited: number
  overCapacity: boolean
  unlocked: number
  /** links that may still be migrated now */
  capacity: number
}

export function archCapacity(
  size: SimSize,
  p5Frac: number,
  edgeDecisions: Record<string, unknown>
): ArchCapacity {
  const arch = ARCHITECTURES[size]
  const vulnerable = arch.edges.filter((e) => e.vulnerable)
  const planning = planningForArchitecture(arch, p5Frac, edgeDecisions)
  return {
    planning,
    vulnerable: vulnerable.length,
    migratable: planning.eligibleKeys.length,
    done: planning.selectedKeys.length,
    credited: planning.creditedKeys.length,
    overCapacity: planning.overCapacity,
    unlocked: planning.unlocked,
    capacity: planning.capacity,
  }
}

/** When an architecture step needs more decisions than are unlocked right now,
 *  what it needs vs what is unlocked; otherwise null. */
export function archStepShortfall(
  size: SimSize,
  p5Frac: number,
  edgeDecisions: Record<string, unknown>,
  minDecisions: number
): { target: number; unlocked: number; done: number } | null {
  const c = archCapacity(size, p5Frac, edgeDecisions)
  const target = Math.min(minDecisions, c.migratable)
  if (c.done >= target || c.unlocked >= target) return null
  return { target, unlocked: c.unlocked, done: c.done }
}
