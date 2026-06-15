// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  SIM_BALANCE,
  SIM_PRESETS,
  getBalance,
  SIM_SCENARIOS,
  type DifficultyId,
} from './simBalance'

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

describe('difficulty presets + scenarios (WS-14)', () => {
  const IDS: DifficultyId[] = ['easy', 'realistic', 'hard']

  it('every preset is a valid, complete SimBalance', () => {
    for (const id of IDS) {
      const b = SIM_PRESETS[id]
      const probs = [
        b.events.dangerWhenClassical,
        b.events.warning,
        b.events.goodNews,
        b.events.successVsInfo,
        b.crqc.pullForwardPerQuarter,
        b.ai.advanceChance,
      ]
      for (const p of probs) {
        expect(p, `${id}`).toBeGreaterThanOrEqual(0)
        expect(p, `${id}`).toBeLessThanOrEqual(1)
      }
      expect(b.budget.doneWeight + b.budget.levelWeight, `${id} budget`).toBe(1)
    }
  })

  it('difficulty monotonicity: easy ≤ realistic ≤ hard on danger; AI help inverts', () => {
    expect(SIM_PRESETS.easy.events.dangerWhenClassical).toBeLessThan(
      SIM_PRESETS.hard.events.dangerWhenClassical
    )
    expect(SIM_PRESETS.easy.crqc.pullForwardPerQuarter).toBeLessThan(
      SIM_PRESETS.hard.crqc.pullForwardPerQuarter
    )
    expect(SIM_PRESETS.easy.ai.advanceChance).toBeGreaterThan(SIM_PRESETS.hard.ai.advanceChance)
  })

  it('getBalance resolves ids and falls back to realistic', () => {
    expect(getBalance('hard')).toBe(SIM_PRESETS.hard)
    expect(getBalance('nope' as DifficultyId)).toBe(SIM_PRESETS.realistic)
    expect(SIM_BALANCE).toBe(SIM_PRESETS.realistic)
  })

  it('scenarios reference valid difficulties and set all dials', () => {
    expect(SIM_SCENARIOS.length).toBeGreaterThanOrEqual(2)
    for (const sc of SIM_SCENARIOS) {
      expect(IDS).toContain(sc.difficulty)
      expect(sc.sector).toBeTruthy()
      expect(sc.size).toBeTruthy()
      expect(sc.country).toBeTruthy()
    }
  })
})
