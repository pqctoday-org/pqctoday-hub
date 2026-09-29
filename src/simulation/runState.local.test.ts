// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP2) — "has this run started?" has one definition, and
 * difficulty can only change in place on a fresh run. Mid-run, the Mode dial
 * used to be a hidden undo (Easy's free retry on a stuck wrong pick) and could
 * game the difficulty the run score reads.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { hasRunStarted, type RunStartedFields } from './runState'
import { useSimulationStore, RUN_START } from '@/store/useSimulationStore'

const fresh: RunStartedFields = {
  year: RUN_START.year,
  q: RUN_START.q,
  crqcShift: 0,
  events: [],
  attempts: {},
  evidence: [],
  visitedRefs: [],
  visitedWorkshops: [],
  visitedScenarios: [],
  edgeDecisions: {},
  picks: [],
  catalogCompleted: [],
  auto: [],
  spentBudgetM: 0,
  trapsThisRun: 0,
  objectiveAchievedYears: {},
  runCompleteSeen: false,
}

describe('hasRunStarted', () => {
  it('is false for a fresh run', () => {
    expect(hasRunStarted(fresh, RUN_START)).toBe(false)
  })

  it.each<[string, Partial<RunStartedFields>]>([
    ['a quarter elapsed', { q: RUN_START.q + 1 }],
    ['a year elapsed', { year: RUN_START.year + 1 }],
    ['CRQC shifted', { crqcShift: 0.2 }],
    ['an event', { events: [{}] }],
    ['a decision attempt', { attempts: { k: {} } }],
    ['run evidence', { evidence: [{}] }],
    ['a visited reference', { visitedRefs: ['r'] }],
    ['a visited workshop', { visitedWorkshops: ['w'] }],
    ['a completed scenario', { visitedScenarios: ['s'] }],
    ['an edge decision', { edgeDecisions: { e: 'hybrid' } }],
    ['a catalog pick', { picks: ['p'] }],
    ['a catalog completion', { catalogCompleted: ['c'] }],
    ['a delegated step', { auto: ['a'] }],
    ['budget spent', { spentBudgetM: 1 }],
    ['a trap picked', { trapsThisRun: 1 }],
    ['an objective achieved', { objectiveAchievedYears: { critical: 2030 } }],
    ['the run-complete ceremony', { runCompleteSeen: true }],
  ])('is true after %s', (_label, patch) => {
    expect(hasRunStarted({ ...fresh, ...patch }, RUN_START)).toBe(true)
  })
})

describe('difficulty lock (store)', () => {
  beforeEach(() => useSimulationStore.getState().reset())

  it('setDifficulty changes a fresh run', () => {
    useSimulationStore.getState().setDifficulty('hard')
    expect(useSimulationStore.getState().difficulty).toBe('hard')
  })

  it('setDifficulty is a no-op once the run has started', () => {
    const st = useSimulationStore.getState()
    st.setDifficulty('realistic')
    st.recordAttempt('p0:0.1:/learn/x', 1, false)
    st.setDifficulty('easy')
    expect(useSimulationStore.getState().difficulty).toBe('realistic')
  })

  it('restartWithDifficulty starts a clean run on the chosen difficulty, keeping the profile', () => {
    const st = useSimulationStore.getState()
    st.setSize('large')
    st.setCountry('DE')
    st.setSector('financial')
    st.markTourSeen()
    st.markConceptPeekSeen('hndl')
    st.recordAttempt('p0:0.1:/learn/x', 1, false)
    st.markRefVisited('ref-1')
    st.incrementTrapsThisRun()
    const seedBefore = useSimulationStore.getState().seed

    useSimulationStore.getState().restartWithDifficulty('easy')
    const after = useSimulationStore.getState()
    expect(after.difficulty).toBe('easy')
    expect(hasRunStarted(after, RUN_START)).toBe(false)
    expect(after.attempts).toEqual({})
    expect(after.visitedRefs).toEqual([])
    expect(after.trapsThisRun).toBe(0)
    expect(after.seed).not.toBe(seedBefore)
    // kept
    expect(after.size).toBe('large')
    expect(after.country).toBe('DE')
    expect(after.sector).toBe('financial')
    expect(after.tourSeen).toBe(true)
    expect(after.seenConceptPeeks).toContain('hndl')
  })
})
