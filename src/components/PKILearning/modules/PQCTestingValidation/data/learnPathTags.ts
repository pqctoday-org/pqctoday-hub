// SPDX-License-Identifier: AGPL-3.0-only
import type { SoftwareItem } from '@/types/MigrateTypes'

/** Learn-path ids of this lesson (manifest.ts learnPaths). */
export const NETWORK_PATH = 'network-practitioner'
export const CERTIFICATION_PATH = 'certification-engineer'

/**
 * Products shown on the Tools & Products tab per learn path. A path listed here shows only
 * these catalog products; a path not listed (and the view with no path chosen) shows every
 * product that names the lesson. The certification route is the side-channel (TVLA) part of
 * the lesson, so it lists only the side-channel testing product; nothing is removed from the
 * catalog.
 */
export const TOOLS_ON_PATH: ReadonlyMap<string, readonly string[]> = new Map([
  [CERTIFICATION_PATH, ['keysight-inspector']],
])

/** Filter for ModuleShell's `toolFilter`: keeps the products on the learner's active path. */
export function toolOnPath(item: SoftwareItem, pathId: string | undefined): boolean {
  if (!pathId) return true
  const allowed = TOOLS_ON_PATH.get(pathId)
  return !allowed || allowed.includes(item.productId)
}
