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

  it('reset restores the seed', () => {
    s().setSel('p7')
    s().reset()
    expect(s().sel).toBe('p0')
  })
})
