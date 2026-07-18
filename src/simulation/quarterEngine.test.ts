// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { runQuarter, type QuarterEngineInput } from './quarterEngine'
import { SIM_PRESETS } from '@/data/simBalance'

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
  balance: SIM_PRESETS.realistic,
  levelOf: () => 0,
  evidenceLevel: () => 0,
  stepDone: () => false,
  hndlExposure: 0.5,
  securedBudget: 0,
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

  it('AI advances progress only via tree `auto` keys (one progression representation)', () => {
    const r = runQuarter(baseInput())
    for (const k of r.newAutoKeys) expect(k).toMatch(/^[a-z0-9]+::.+/)
    // the quarter payload carries no separate progression counter — just the turn/clock
    expect(r.quarter).not.toHaveProperty('checks')
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
    // all 9 played lifecycle phases (P0–P7 + verify-close) counted cleared
    expect(r.report.clearedFrom).toBe(9)
    expect(r.report.totalPhases).toBe(9)
  })

  // WP4.1 — event consequences. Pinned seeds (found via a scratch brute-force
  // search over seeds 1-300 against realistic balance) so each assertion
  // exercises a real, reproducible roll rather than a mocked RNG.
  describe('WP4.1 — event consequences', () => {
    it('a danger event above the exposure threshold applies a setback + incident cost', () => {
      const r = runQuarter(baseInput({ seed: 4, hndlExposure: 0.9 }))
      expect(r.quarter.effects).toMatchObject({ setbackQuarters: 1, budgetCostM: 5 })
      expect(r.report.effects).toEqual(r.quarter.effects)
    })

    it('a danger event below the exposure threshold has no teeth (no effect at all for that seed)', () => {
      const above = runQuarter(baseInput({ seed: 4, hndlExposure: 0.9 })).quarter.effects
      const below = runQuarter(baseInput({ seed: 4, hndlExposure: 0.05 })).quarter.effects
      expect(above?.setbackQuarters).toBe(1)
      expect(below?.setbackQuarters).toBeUndefined()
    })

    it('a good-news event always grants a credit, independent of exposure', () => {
      const r = runQuarter(baseInput({ seed: 1, hndlExposure: 0.05 }))
      expect(r.quarter.effects).toMatchObject({ budgetCreditM: 1.5 })
      expect(r.quarter.effects?.setbackQuarters).toBeUndefined()
    })

    it('both a setback and a credit can land in the same quarter (independent rolls)', () => {
      const r = runQuarter(baseInput({ seed: 2, hndlExposure: 0.9 }))
      expect(r.quarter.effects).toMatchObject({
        setbackQuarters: 1,
        budgetCostM: 5,
        budgetCreditM: 1.5,
      })
    })

    it('a quiet seed with no qualifying event has no effects object at all', () => {
      const r = runQuarter(baseInput({ seed: 6, hndlExposure: 0.9 }))
      expect(r.quarter.effects).toBeUndefined()
      expect(r.report.effects).toBeUndefined()
    })

    it('difficulty scales consequence severity (Hard costs more per incident than Easy)', () => {
      expect(SIM_PRESETS.hard.consequences.incidentCostM).toBeGreaterThan(
        SIM_PRESETS.easy.consequences.incidentCostM
      )
      expect(SIM_PRESETS.hard.consequences.hndlExposureThreshold).toBeLessThan(
        SIM_PRESETS.easy.consequences.hndlExposureThreshold
      )
    })

    it('a critically-low budget with P0 still open outranks every other recommendation', () => {
      const r = runQuarter(baseInput({ securedBudget: 0, levelOf: () => 0 }))
      expect(r.report.recommend).toMatch(/Phase 0 budget case/)
    })

    it('is still byte-identical for the same seed + hndlExposure/securedBudget (WS-02 preserved)', () => {
      const a = runQuarter(baseInput({ seed: 2, hndlExposure: 0.9, securedBudget: 3 }))
      const b = runQuarter(baseInput({ seed: 2, hndlExposure: 0.9, securedBudget: 3 }))
      expect(a).toEqual(b)
    })
  })

  // WS-14 — difficulty is a pure config swap: the balance changes outcomes.
  it('difficulty balance changes outcomes deterministically (config swap)', () => {
    const easy = runQuarter(baseInput({ balance: SIM_PRESETS.easy }))
    const hard = runQuarter(baseInput({ balance: SIM_PRESETS.hard }))
    expect(JSON.stringify(easy.report)).not.toEqual(JSON.stringify(hard.report))
    // a balance with no AI help → the AI completes nothing, regardless of seed
    const noAi = runQuarter(
      baseInput({
        balance: {
          ...SIM_PRESETS.realistic,
          ai: { advanceChance: 0, delegationCostPerStepM: 1 },
        },
      })
    )
    expect(noAi.newAutoKeys).toEqual([])
  })
})
