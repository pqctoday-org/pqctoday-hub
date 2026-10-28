// SPDX-License-Identifier: AGPL-3.0-only
/**
 * When the /navigate "Explore how the hub connects" guide is shown, and what
 * "About this graph" changes to bring it back. Kept pure so the rule is tested
 * without the 3D scene: the guide is hidden while the Filters panel is open,
 * so reopening it from inside that panel must also close the panel, or the
 * button does nothing a reader can see.
 */

export interface GuideVisibilityInput {
  loading: boolean
  error: boolean
  hasSelectedNode: boolean
  guideDismissed: boolean
  touring: boolean
  panelOpen: boolean
}

export function isGuideVisible(s: GuideVisibilityInput): boolean {
  return (
    !s.loading && !s.error && !s.hasSelectedNode && !s.guideDismissed && !s.touring && !s.panelOpen
  )
}

/** The view-state changes "About this graph" makes: no record selected, guide not dismissed, panel closed. */
export const REOPEN_GUIDE = {
  selectedNodeId: null,
  guideDismissed: false,
  panelOpen: false,
} as const
