// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_BALANCE } from './simBalance'

describe('SIM_BALANCE', () => {
  it('matches the documented baseline (snapshot of tunable balance)', () => {
    expect(SIM_BALANCE).toEqual({
      events: { dangerWhenClassical: 0.6, warning: 0.55, goodNews: 0.5, successVsInfo: 0.5 },
      crqc: { pullForwardPerQuarter: 0.22 },
      ai: { advanceChance: 0.35 },
      readiness: { l3: 1, l2: 0.6, l1: 0.25, l0: 0.05 },
      budget: { doneWeight: 0.5, levelWeight: 0.5 },
    })
  })

  it('keeps every probability in [0, 1]', () => {
    const probs = [
      SIM_BALANCE.events.dangerWhenClassical,
      SIM_BALANCE.events.warning,
      SIM_BALANCE.events.goodNews,
      SIM_BALANCE.events.successVsInfo,
      SIM_BALANCE.crqc.pullForwardPerQuarter,
      SIM_BALANCE.ai.advanceChance,
    ]
    for (const p of probs) {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('readiness fractions are monotonic non-decreasing by level and within [0,1]', () => {
    const { l0, l1, l2, l3 } = SIM_BALANCE.readiness
    expect(l0).toBeLessThanOrEqual(l1)
    expect(l1).toBeLessThanOrEqual(l2)
    expect(l2).toBeLessThanOrEqual(l3)
    expect(l3).toBeLessThanOrEqual(1)
    expect(l0).toBeGreaterThanOrEqual(0)
  })

  it('budget blend weights sum to 1', () => {
    expect(SIM_BALANCE.budget.doneWeight + SIM_BALANCE.budget.levelWeight).toBe(1)
  })
})
