// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './useSimulationStore'

// I1: a wrong in-sim decision costs the player N quarters of rework — their OWN
// clock slips toward the FIXED Q-Day, shrinking the Mosca runway. The player has
// no influence on Q-Day, so crqcShift must never move here.
describe('applyDecisionSetback (I1 sticky time penalty)', () => {
  beforeEach(() => useSimulationStore.getState().reset())

  it('advances the player clock by N quarters, with year rollover', () => {
    // seed turn is Q1 2026
    useSimulationStore.getState().applyDecisionSetback(2, 'rework')
    expect(useSimulationStore.getState().q).toBe(3)
    expect(useSimulationStore.getState().year).toBe(2026)

    // Q3 + 3 quarters = Q6 -> Q2 of the next year
    useSimulationStore.getState().applyDecisionSetback(3, 'more rework')
    expect(useSimulationStore.getState().q).toBe(2)
    expect(useSimulationStore.getState().year).toBe(2027)
  })

  it('does NOT move Q-Day (crqcShift) and logs a sticky danger event', () => {
    const before = useSimulationStore.getState().crqcShift
    useSimulationStore.getState().applyDecisionSetback(2, 'skipped discovery scan')
    const s = useSimulationStore.getState()
    expect(s.crqcShift).toBe(before)
    expect(s.events[0].sev).toBe('danger')
    expect(s.events[0].txt).toBe('skipped discovery scan')
  })
})
