// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { isGuideVisible, REOPEN_GUIDE } from './guideState'

const ready = { loading: false, error: false, touring: false }

describe('Navigate guide visibility', () => {
  it('stays hidden while the Filters panel is open', () => {
    expect(
      isGuideVisible({ ...ready, hasSelectedNode: false, guideDismissed: false, panelOpen: true })
    ).toBe(false)
  })

  it('"About this graph" from inside the open Filters panel shows the guide', () => {
    // The reader picked a record from the list (guide dismissed), closed its
    // drawer, and clicks "About this graph" in the still-open Filters panel.
    const before = { selectedNodeId: 'fips-203', guideDismissed: true, panelOpen: true }
    const after = { ...before, ...REOPEN_GUIDE }
    expect(
      isGuideVisible({
        ...ready,
        hasSelectedNode: after.selectedNodeId !== null,
        guideDismissed: after.guideDismissed,
        panelOpen: after.panelOpen,
      })
    ).toBe(true)
  })

  it('stays hidden during the guided tour, loading or an error', () => {
    const base = { ...ready, hasSelectedNode: false, guideDismissed: false, panelOpen: false }
    expect(isGuideVisible(base)).toBe(true)
    expect(isGuideVisible({ ...base, touring: true })).toBe(false)
    expect(isGuideVisible({ ...base, loading: true })).toBe(false)
    expect(isGuideVisible({ ...base, error: true })).toBe(false)
  })
})
