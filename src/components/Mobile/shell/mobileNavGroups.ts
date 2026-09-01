// SPDX-License-Identifier: GPL-3.0-only
import {
  getForYouGroups,
  getUngatedGroupablePaths,
  computeGroupDisplayPaths,
  type ForYouGroupId,
} from '@/components/Layout/railNav'

/**
 * '/explore' was dropped from mobile entirely on 2026-08-23 — the built
 * MobileExploreGrid screen and its ExploreView wiring were reverted, and it
 * was filtered out of every mobile-nav tile/crumb below. Restored 2026-08-29
 * (Wave B, bplus-remediation-plan-08292026.md A5): investigating the
 * original commit found it was a broader reading of "skip explore in the
 * mobile ux" than intended — dropping it from mobile reachability entirely,
 * not just deferring a distilled mobile screen for it. desktop's ExploreView
 * already renders fine in mobile chrome (same as every other
 * not-yet-distilled section), so there's a real destination to restore.
 * `/explore` is not special-cased here any more; it flows through the same
 * persona gating every other path already gets (getRailSections /
 * PERSONA_ABSENT_PATHS — see railNav.ts's `if (persona === 'curious')
 * extra.push('/explore')`, unchanged by this file).
 */

/**
 * Real display-position tiles for a group panel, mobile's version of what
 * MainLayout's desktop rail shows via computeGroupDisplayPaths (Business
 * Tools in Practice, Timeline/Threats in Reference, the Workflow reorder) —
 * reusing that exact function rather than re-deriving it, confirmed
 * necessary after a real gap report: mobile's Practice panel was missing
 * Business Tools entirely because this file previously only appended
 * Timeline/Threats to Reference and used raw, unadjusted group.paths
 * everywhere else.
 */
export function mobileGroupDisplayPaths(
  group: { id: ForYouGroupId | 'other'; paths: string[] },
  forYou: string[]
): string[] {
  return computeGroupDisplayPaths(group, forYou)
}

/**
 * Which bottom-bar group (Workflow / Practice / Reference) a route's crumb
 * and group-panel tile belong to — persona-independent, since a page's group
 * membership is structural, not gated (gating is a separate, per-persona
 * concern already handled by getRailSections/PERSONA_ABSENT_PATHS). Reuses
 * getUngatedGroupablePaths() — the same "everything, ungated" set
 * MobileGroupPanel already falls back to with no persona selected — run
 * through computeGroupDisplayPaths so Timeline/Threats/Business Tools (which
 * computeGroupDisplayPaths adds on top of the raw bucketing) get a crumb too.
 */
export function mobileGroupIdForPath(pathname: string): ForYouGroupId | undefined {
  const ungated = getUngatedGroupablePaths()
  const groups = getForYouGroups(ungated)
  for (const group of groups) {
    if (group.id === 'other') continue
    if (mobileGroupDisplayPaths(group, ungated).includes(pathname)) return group.id
  }
  return undefined
}
