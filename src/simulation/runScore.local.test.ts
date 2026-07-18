// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeRunScore } from './runScore'
import { PAR_QUARTERS } from '@/data/simBalance'

describe('computeRunScore', () => {
  it('grades a perfect run A with a full 100 breakdown', () => {
    const s = computeRunScore({
      quartersUsed: PAR_QUARTERS.realistic,
      difficulty: 'realistic',
      trapsThisRun: 0,
      compliancePct: 100,
      objectivesOnTime: 4,
      objectivesTotal: 4,
    })
    expect(s.grade).toBe('A')
    expect(s.overall).toBe(100)
    expect(s.paceScore).toBe(100)
    expect(s.trapScore).toBe(100)
    expect(s.complianceScore).toBe(100)
    expect(s.onTimeScore).toBe(100)
  })

  it('finishing under par still scores full pace (no bonus, no penalty)', () => {
    const s = computeRunScore({
      quartersUsed: PAR_QUARTERS.realistic - 4,
      difficulty: 'realistic',
      trapsThisRun: 0,
      compliancePct: 100,
      objectivesOnTime: 1,
      objectivesTotal: 1,
    })
    expect(s.paceScore).toBe(100)
  })

  it('going over par costs 5 points per quarter', () => {
    const s = computeRunScore({
      quartersUsed: PAR_QUARTERS.realistic + 4,
      difficulty: 'realistic',
      trapsThisRun: 0,
      compliancePct: 100,
      objectivesOnTime: 1,
      objectivesTotal: 1,
    })
    expect(s.paceScore).toBe(80)
  })

  it('every trap this run costs 15 points, floored at 0', () => {
    expect(computeRunScore(baseInput({ trapsThisRun: 2 })).trapScore).toBe(70)
    expect(computeRunScore(baseInput({ trapsThisRun: 20 })).trapScore).toBe(0)
  })

  it('a careless Hard run (many traps, over par, poor compliance) grades D; a careful one grades better', () => {
    const careless = computeRunScore({
      quartersUsed: PAR_QUARTERS.hard + 20,
      difficulty: 'hard',
      trapsThisRun: 8,
      compliancePct: 40,
      objectivesOnTime: 0,
      objectivesTotal: 4,
    })
    const careful = computeRunScore({
      quartersUsed: PAR_QUARTERS.hard,
      difficulty: 'hard',
      trapsThisRun: 0,
      compliancePct: 100,
      objectivesOnTime: 4,
      objectivesTotal: 4,
    })
    expect(careless.grade).toBe('D')
    expect(careful.overall).toBeGreaterThan(careless.overall)
  })

  it('zero objectives never divides by zero — treated as fully on-time', () => {
    const s = computeRunScore(baseInput({ objectivesOnTime: 0, objectivesTotal: 0 }))
    expect(s.onTimeScore).toBe(100)
    expect(Number.isFinite(s.overall)).toBe(true)
  })

  it('parQuarters echoes the difficulty-adjusted par table, not a hardcoded number', () => {
    expect(computeRunScore(baseInput({ difficulty: 'easy' })).parQuarters).toBe(PAR_QUARTERS.easy)
    expect(computeRunScore(baseInput({ difficulty: 'hard' })).parQuarters).toBe(PAR_QUARTERS.hard)
  })
})

function baseInput(overrides: Partial<Parameters<typeof computeRunScore>[0]> = {}) {
  return {
    quartersUsed: PAR_QUARTERS.realistic,
    difficulty: 'realistic' as const,
    trapsThisRun: 0,
    compliancePct: 100,
    objectivesOnTime: 1,
    objectivesTotal: 1,
    ...overrides,
  }
}
