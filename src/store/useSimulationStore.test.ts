// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './useSimulationStore'

const s = () => useSimulationStore.getState()

beforeEach(() => s().reset())

describe('useSimulationStore', () => {
  it('seeds a coherent starting scenario', () => {
    expect(s().country).toBe('DE')
    expect(s().sel).toBe('p0')
    expect(s().checks.p0).toBe(0) // levels are earned via gating, nothing pre-set
  })

  it('setLevel ticks up and un-ticks when clicking the current level', () => {
    s().setLevel('p4', 2)
    expect(s().checks.p4).toBe(2)
    s().setLevel('p4', 2) // click current → un-tick
    expect(s().checks.p4).toBe(1)
  })

  it('applyQuarter advances the turn and prepends events (capped at 30)', () => {
    const many = Array.from({ length: 35 }, (_, i) => ({
      sev: 'info' as const,
      t: 'Q1 2027',
      txt: `e${i}`,
    }))
    s().applyQuarter({
      checks: { ...s().checks, p4: 1 },
      crqcShift: 1,
      year: 2026,
      q: 4,
      newEvents: many,
    })
    expect(s().q).toBe(4)
    expect(s().crqcShift).toBe(1)
    expect(s().events.length).toBe(30)
    expect(s().events[0].txt).toBe('e0')
  })

  it('markRefVisited records a reference once (idempotent)', () => {
    s().markRefVisited('timeline')
    s().markRefVisited('timeline')
    expect(s().visitedRefs).toEqual(['timeline'])
  })

  it('togglePick adds and removes a game-scoped product pick', () => {
    s().togglePick('prod-a')
    s().togglePick('prod-b')
    expect(s().picks.sort()).toEqual(['prod-a', 'prod-b'])
    s().togglePick('prod-a') // toggle off
    expect(s().picks).toEqual(['prod-b'])
  })

  it('markCatalogStepDone records a catalog task once (idempotent)', () => {
    s().markCatalogStepDone('discovery')
    s().markCatalogStepDone('discovery')
    s().markCatalogStepDone('pilots')
    expect(s().catalogCompleted.sort()).toEqual(['discovery', 'pilots'])
  })

  it('reset restores the seed (and clears game-scoped picks + catalog completion)', () => {
    s().setSel('p7')
    s().togglePick('prod-a')
    s().markCatalogStepDone('discovery')
    s().reset()
    expect(s().sel).toBe('p0')
    expect(s().picks).toEqual([])
    expect(s().catalogCompleted).toEqual([])
  })

  it('auto-completion delegates steps and can be cancelled per phase', () => {
    s().autoCompleteSteps(['p4::/learn/migration-program', 'p4::/business/tools/roadmap-builder'])
    s().autoCompleteSteps(['p5::/learn/hybrid-crypto'])
    expect(s().auto).toContain('p4::/learn/migration-program')
    expect(s().auto).toContain('p5::/learn/hybrid-crypto')
    // idempotent
    s().autoCompleteSteps(['p4::/learn/migration-program'])
    expect(s().auto.filter((k) => k === 'p4::/learn/migration-program')).toHaveLength(1)
    // cancel only p4 — p5 delegation survives
    s().clearAuto('p4')
    expect(s().auto.some((k) => k.startsWith('p4::'))).toBe(false)
    expect(s().auto).toContain('p5::/learn/hybrid-crypto')
  })

  // WS-08 — durable save: export → wipe → import restores the run.
  it('export → import round-trips the full run', () => {
    s().setSector('financial')
    s().setSize('global')
    s().autoCompleteSteps(['p1::/learn/data-asset-sensitivity'])
    s().applyQuarter({
      checks: { ...s().checks, p0: 2 },
      crqcShift: 1,
      year: 2028,
      q: 3,
      newEvents: [],
    })
    const saved = s().exportSave()

    s().reset() // simulate a cache-clear / fresh state
    expect(s().sector).not.toBe('financial')

    expect(s().importSave(saved)).toBe(true)
    expect(s().sector).toBe('financial')
    expect(s().size).toBe('global')
    expect(s().year).toBe(2028)
    expect(s().q).toBe(3)
    expect(s().crqcShift).toBe(1)
    expect(s().checks.p0).toBe(2)
    expect(s().auto).toContain('p1::/learn/data-asset-sensitivity')
  })

  // WS-14 — difficulty preset selection round-trips through a save.
  it('setDifficulty sets state and round-trips through a save', () => {
    s().setDifficulty('hard')
    s().setSector('financial')
    expect(s().difficulty).toBe('hard')
    const saved = s().exportSave()
    s().reset()
    expect(s().difficulty).toBe('realistic')
    s().importSave(saved)
    expect(s().difficulty).toBe('hard')
    expect(s().sector).toBe('financial')
  })

  // WS-12 — the onboarding flag is remembered and survives a run reset.
  it('markTourSeen persists and reset does not re-show the tour', () => {
    useSimulationStore.setState({ tourSeen: false })
    s().markTourSeen()
    expect(s().tourSeen).toBe(true)
    s().reset()
    expect(s().tourSeen).toBe(true) // reset clears the run, not the onboarding flag
  })

  it('importSave rejects malformed / foreign input without throwing', () => {
    expect(s().importSave('not json')).toBe(false)
    expect(s().importSave('{}')).toBe(false)
    expect(s().importSave(JSON.stringify({ kind: 'something-else', state: {} }))).toBe(false)
    // a wrong-kind payload must not mutate state
    const before = s().sector
    s().importSave('{"kind":"x"}')
    expect(s().sector).toBe(before)
  })
})
