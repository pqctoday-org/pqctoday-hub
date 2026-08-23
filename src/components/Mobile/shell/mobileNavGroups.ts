// SPDX-License-Identifier: GPL-3.0-only
import {
  getForYouGroups,
  getUngatedGroupablePaths,
  type ForYouGroupId,
} from '@/components/Layout/railNav'

/**
 * '/timeline' and '/threats' are RAIL_ALWAYS_VISIBLE_PATHS on desktop —
 * reachable by every persona, so they're deliberately outside
 * PERSONA_NAV_PATHS and railNav's own FOR_YOU_PATH_GROUP map entirely (see
 * that file's comments). MainLayout.tsx renders them by appending both
 * directly to the Reference rail section
 * (`group.id === 'reference' ? [...group.paths, '/timeline', '/threats'] : ...`)
 * rather than through the gated grouping mechanism.
 *
 * The mobile shell's Reference group panel and page-header crumb both need
 * the same append, or Timeline/Threats are simply unreachable/uncredited on
 * mobile — found by cross-checking the handoff's own screenshots (14-timeline,
 * 15-threats both have dedicated numbered screens, and the README's fixed
 * group table lists both under Reference) against `FOR_YOU_PATH_GROUP`, which
 * has no entry for either path. Kept as one shared constant so
 * MobileGroupPanel (tiles) and MobileHeader (crumb) can never drift from each
 * other on which group these two belong to.
 */
export const MOBILE_REFERENCE_APPEND_PATHS = ['/timeline', '/threats']

/**
 * Which bottom-bar group (Workflow / Practice / Reference) a route's crumb
 * and group-panel tile belong to — persona-independent, since a page's group
 * membership is structural, not gated (gating is a separate, per-persona
 * concern already handled by getRailSections/PERSONA_ABSENT_PATHS). Reuses
 * getUngatedGroupablePaths() — the same "everything, ungated" set
 * MobileGroupPanel already falls back to with no persona selected — so a
 * path's crumb group and its tile group can never disagree.
 */
export function mobileGroupIdForPath(pathname: string): ForYouGroupId | undefined {
  if (MOBILE_REFERENCE_APPEND_PATHS.includes(pathname)) return 'reference'
  const match = getForYouGroups(getUngatedGroupablePaths()).find((g) => g.paths.includes(pathname))
  return match && match.id !== 'other' ? match.id : undefined
}
