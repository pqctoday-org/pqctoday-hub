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

  it('optionally rolls back a migrated edge (readiness drops) without moving Q-Day', () => {
    // a link was migrated...
    useSimulationStore.getState().setEdgeDecision('lb-app1-mTLS', 'hybrid')
    const before = useSimulationStore.getState().crqcShift
    expect(useSimulationStore.getState().edgeDecisions['lb-app1-mTLS']).toBe('hybrid')

    // a trap on the migration step reverts exactly that link
    useSimulationStore.getState().applyDecisionSetback(2, 'wrong pilot — rollback', 'lb-app1-mTLS')
    const s = useSimulationStore.getState()
    expect(s.edgeDecisions['lb-app1-mTLS']).toBeUndefined() // re-doable
    expect(s.crqcShift).toBe(before) // Q-Day still fixed
    expect(s.q).toBe(3) // clock still slipped 2 quarters

    // re-doing the migration restores it
    useSimulationStore.getState().setEdgeDecision('lb-app1-mTLS', 'hybrid')
    expect(useSimulationStore.getState().edgeDecisions['lb-app1-mTLS']).toBe('hybrid')
  })

  it('a revert id that was never migrated is a no-op on edges', () => {
    useSimulationStore.getState().applyDecisionSetback(1, 'rework', 'does-not-exist')
    expect(useSimulationStore.getState().edgeDecisions).toEqual({})
  })
})
