// SPDX-License-Identifier: GPL-3.0-only
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
import { ARCHITECTURES, edgeKey, edgeState } from '@/data/simArchitecture'
import type { SimSize } from '@/data/moscaClock'

export interface ArchCapacity {
  vulnerable: number
  migratable: number
  /** migratable links already decided (hybrid or pure) */
  done: number
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
  const migratable = vulnerable.filter((e) => edgeState(arch, e) === 'migratable')
  const done = migratable.filter((e) => Boolean(edgeDecisions[edgeKey(e)])).length
  const unlocked = Math.floor(Math.max(0, Math.min(1, p5Frac)) * migratable.length)
  return {
    vulnerable: vulnerable.length,
    migratable: migratable.length,
    done,
    unlocked,
    capacity: Math.max(0, unlocked - done),
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
