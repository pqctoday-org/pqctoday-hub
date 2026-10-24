// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from './types'

const minutesOf = (duration: string | undefined): number | null => {
  const m = /^(\d+)\s*min$/.exec((duration ?? '').trim())
  return m ? Number(m[1]) : null
}

/**
 * The duration the module header shows when the learner is on no path.
 *
 * A module's own number can be shorter than one of its paths (Common Criteria
 * says 66 min while its Common Criteria path takes 76), so a header that names
 * the module's number alone contradicts the picker beside it. In that case the
 * range of the paths is shown instead; otherwise the module's own number stands.
 */
export function moduleDurationLabel(
  manifest: Pick<ModuleManifest, 'duration' | 'learnPaths'>
): string | undefined {
  const own = manifest.duration
  const paths = (manifest.learnPaths ?? [])
    .map((p) => minutesOf(p.duration))
    .filter((n): n is number => n !== null)
  const ownMinutes = minutesOf(own)
  if (paths.length < 2 || ownMinutes === null) return own
  const longest = Math.max(...paths)
  if (ownMinutes >= longest) return own
  const shortest = Math.min(...paths)
  return shortest === longest ? own : `${shortest}–${longest} min, depending on your path`
}
