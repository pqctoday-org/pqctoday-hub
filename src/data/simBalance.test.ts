// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_BALANCE } from './simBalance'

describe('SIM_BALANCE', () => {
  it('matches the documented baseline (snapshot of tunable balance)', () => {
    expect(SIM_BALANCE).toEqual({
      events: { dangerWhenClassical: 0.6, warning: 0.55, goodNews: 0.5, successVsInfo: 0.5 },
      crqc: { pullForwardPerQuarter: 0.22 },
      ai: { advanceChance: 0.35 },
      budget: { doneWeight: 1, levelWeight: 0 },
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

  it('budget blend weights sum to 1', () => {
    expect(SIM_BALANCE.budget.doneWeight + SIM_BALANCE.budget.levelWeight).toBe(1)
  })
})
