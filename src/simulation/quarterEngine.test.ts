// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { runQuarter, type QuarterEngineInput } from './quarterEngine'

// A baseline input: nothing earned yet (levelOf 0), so the AI is eligible to
// advance every phase and beforeCleared is 0. seat '' owns no phase.
const baseInput = (over: Partial<QuarterEngineInput> = {}): QuarterEngineInput => ({
  year: 2026,
  q: 1,
  seed: 12345,
  crqcShift: 0,
  seat: '',
  country: 'DE',
  sectorLabel: 'Healthcare',
  simMigrationYears: 3,
  simShelfLifeYears: 10,
  clockYearsToHorizon: 5,
  checks: { p0: 0, p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, foundations: 0 },
  levelOf: () => 0,
  evidenceLevel: () => 0,
  stepDone: () => false,
  ...over,
})

describe('runQuarter (pure quarter engine, WS-05)', () => {
  it('is deterministic: same seed + inputs → byte-identical result', () => {
    expect(runQuarter(baseInput())).toEqual(runQuarter(baseInput()))
  })

  it('advances the turn (q wraps the year)', () => {
    expect(runQuarter(baseInput({ q: 1 })).quarter).toMatchObject({ year: 2026, q: 2 })
    expect(runQuarter(baseInput({ q: 4 })).quarter).toMatchObject({ year: 2027, q: 1 })
  })

  it('AI writes only tree `auto` keys and never mutates checks', () => {
    const r = runQuarter(baseInput())
    for (const k of r.newAutoKeys) expect(k).toMatch(/^[a-z0-9]+::.+/)
    // checks is passed through untouched (Option A — AI advances the tree)
    expect(r.quarter.checks).toEqual(baseInput().checks)
  })

  it('reports cleared counts from the gating callback (0 when nothing earned)', () => {
    const r = runQuarter(baseInput())
    expect(r.report.clearedFrom).toBe(0)
    expect(r.report.clearedTo).toBeGreaterThanOrEqual(0)
    expect(r.report.from).toBe('Q1 2026')
    expect(r.report.to).toBe('Q2 2026')
    expect(r.report.events.length).toBeGreaterThan(0)
  })

  it('different seeds generally produce different quarters', () => {
    const a = runQuarter(baseInput({ seed: 1 }))
    const b = runQuarter(baseInput({ seed: 999 }))
    // events text or AI picks differ across seeds
    expect(JSON.stringify(a.report)).not.toEqual(JSON.stringify(b.report))
  })

  it('a fully-cleared estate (levelOf >= win) lets the AI do nothing', () => {
    const r = runQuarter(baseInput({ levelOf: () => 4 }))
    expect(r.newAutoKeys).toEqual([])
    expect(r.report.clearedFrom).toBe(8) // all 8 lifecycle phases counted cleared
  })
})
