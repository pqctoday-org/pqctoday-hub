// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  SIM_CONSTANTS,
  type CostModelInputs,
  parametricEstimate,
  bottomUpEstimate,
  scenarioEstimate,
  analogicalEstimate,
  aleReference,
  mulberry32,
  sampleTriangular,
  monteCarloEstimate,
  percentile,
  compareCostModels,
  programCostFor,
  NOMINAL_PROGRAM_YEARS,
} from './costModelSim'

const scenario: CostModelInputs = {
  systems: 250,
  itBudgetAnnual: 50_000_000,
  complexity: 1.0,
  horizonYears: 5,
}

describe('parametricEstimate', () => {
  it('is a share of the multi-year IT budget, independent of system count', () => {
    // 8% × 50M × 5 = 20M
    expect(parametricEstimate(scenario)).toBe(20_000_000)
    const moreSystems = parametricEstimate({ ...scenario, systems: 5000 })
    expect(moreSystems).toBe(20_000_000)
  })
})

describe('bottomUpEstimate', () => {
  it('sums per-system cost and the standing program cost for the horizon', () => {
    // 40k × 1.0 × 250 + (2M/3 × 5) = 10M + 3.333M
    expect(bottomUpEstimate(scenario)).toBeCloseTo(10_000_000 + programCostFor(5), 6)
  })

  it('scales with the horizon, so it estimates the same quantity as the parametric lens', () => {
    // W2-2: only the parametric lens used to read horizonYears, so the spread
    // ratio moved 2.4x -> 26.7x on the slider alone.
    expect(bottomUpEstimate({ ...scenario, horizonYears: 10 })).toBeGreaterThan(
      bottomUpEstimate({ ...scenario, horizonYears: 3 })
    )
  })

  it('scales with complexity', () => {
    const modern = bottomUpEstimate({ ...scenario, complexity: 0.5 })
    const legacy = bottomUpEstimate({ ...scenario, complexity: 2.0 })
    expect(legacy).toBeGreaterThan(modern)
  })
})

describe('scenarioEstimate', () => {
  it('brackets the bottom-up expected value with the O/C multipliers', () => {
    const band = scenarioEstimate(scenario)
    const expected = bottomUpEstimate(scenario)
    expect(band.expected).toBeCloseTo(expected, 6)
    expect(band.optimistic).toBeCloseTo(expected * SIM_CONSTANTS.optimisticFactor, 6)
    expect(band.conservative).toBeCloseTo(expected * SIM_CONSTANTS.conservativeFactor, 6)
    expect(band.optimistic).toBeLessThan(band.expected)
    expect(band.conservative).toBeGreaterThan(band.expected)
  })
})

describe('analogicalEstimate', () => {
  it('prices per system from an illustrative historical rate, plus the standing program cost', () => {
    // 30k × 1.0 × 250 + (2M/3 × 5) = 7.5M + 3.333M
    expect(analogicalEstimate(scenario)).toBeCloseTo(7_500_000 + programCostFor(5), 6)
  })
})

describe('aleReference', () => {
  // W2-1: this used to be `baseline × 2.5 × prob × horizon` — a flat quantum
  // factor assuming a CRQC exists with certainty, which is precisely the
  // assumption breachCostModel.ts was rebuilt to remove, under a comment
  // claiming the lens shared the Simulator's source "no drift". It also read
  // none of the scenario inputs, so a one-system startup and a hundred-system
  // bank were both quoted $4,995,000.

  it('is probability-weighted, not a flat multiple of the baseline', () => {
    // Strictly below the certainty case (baseline × cap × prob × horizon),
    // because a CRQC is not certain to exist within the horizon.
    const certainty =
      SIM_CONSTANTS.breachBaseline * 5 * SIM_CONSTANTS.annualBreachProb * scenario.horizonYears
    expect(aleReference(scenario)).toBeLessThan(certainty)
    expect(aleReference(scenario)).toBeGreaterThan(0)
  })

  it('rises with the horizon, as CRQC-arrival probability accumulates', () => {
    expect(aleReference({ ...scenario, horizonYears: 15 })).toBeGreaterThan(
      aleReference({ ...scenario, horizonYears: 5 })
    )
  })

  it('responds to the size of the estate at risk', () => {
    const small = aleReference({ ...scenario, systems: 1 })
    const large = aleReference({ ...scenario, systems: 1000 })
    expect(large).toBeGreaterThan(small)
    // Damped, not linear — 1000x the systems is not 1000x the breach.
    expect(large / small).toBeLessThan(100)
  })

  it('stays a cost-of-inaction reference, kept out of the migration points', () => {
    const c = compareCostModels(scenario, { seed: 1 })
    expect(c.migrationPoints).not.toContain(c.aleReference)
  })
})

describe('mulberry32 + sampleTriangular', () => {
  it('is deterministic for a fixed seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect(a()).toBe(b())
    expect(a()).toBe(b())
  })

  it('produces values in [0,1)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('keeps triangular samples within [min, max]', () => {
    const rng = mulberry32(123)
    for (let i = 0; i < 500; i++) {
      const v = sampleTriangular(rng, 100, 200, 500)
      expect(v).toBeGreaterThanOrEqual(100)
      expect(v).toBeLessThanOrEqual(500)
    }
  })

  it('returns min when the distribution is degenerate (max <= min)', () => {
    expect(sampleTriangular(mulberry32(1), 100, 100, 100)).toBe(100)
  })
})

describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 50)).toBe(0)
  })

  it('picks the nearest-rank value on a sorted array', () => {
    const sorted = [10, 20, 30, 40, 50]
    expect(percentile(sorted, 10)).toBe(10)
    expect(percentile(sorted, 50)).toBe(30)
    expect(percentile(sorted, 90)).toBe(50)
  })
})

describe('monteCarloEstimate', () => {
  it('is deterministic for a fixed seed', () => {
    const a = monteCarloEstimate(scenario, { seed: 42, draws: 1000 })
    const b = monteCarloEstimate(scenario, { seed: 42, draws: 1000 })
    expect(a.p50).toBe(b.p50)
    expect(a.p10).toBe(b.p10)
    expect(a.p90).toBe(b.p90)
  })

  it('orders the percentiles p10 <= p50 <= p90', () => {
    const r = monteCarloEstimate(scenario, { seed: 42 })
    expect(r.p10).toBeLessThanOrEqual(r.p50)
    expect(r.p50).toBeLessThanOrEqual(r.p90)
  })

  it('brackets the bottom-up expected value inside the band', () => {
    const r = monteCarloEstimate(scenario, { seed: 42 })
    const expected = bottomUpEstimate(scenario)
    expect(r.p10).toBeLessThanOrEqual(expected)
    expect(r.p90).toBeGreaterThanOrEqual(expected)
  })

  it('returns the requested number of samples', () => {
    const r = monteCarloEstimate(scenario, { seed: 1, draws: 200 })
    expect(r.samples).toHaveLength(200)
  })
})

describe('compareCostModels', () => {
  it('reports all lenses and a spread ratio >= 1', () => {
    const c = compareCostModels(scenario, { seed: 42 })
    expect(c.migrationPoints).toHaveLength(5)
    expect(c.spreadRatio).toBeGreaterThanOrEqual(1)
    // The five methods genuinely disagree on this scenario.
    expect(c.spreadRatio).toBeGreaterThan(1)
  })

  it('keeps the ALE reference separate from the migration points', () => {
    const c = compareCostModels(scenario, { seed: 42 })
    expect(c.migrationPoints).not.toContain(c.aleReference)
  })
})

// ── W2-2 regression guard (audit 2026-08-10) ────────────────────────────────
describe('spread ratio is a property of the methods, not the horizon slider', () => {
  it('does not blow up as the horizon grows, at any estate size', () => {
    // Checked across estate sizes on purpose: with only the parametric lens
    // horizon-aware, the swing from a 1-year to a 20-year horizon was ~7-11x
    // whatever the estate. It is now 0.14x-3.13x, and which way it leans
    // depends on the estate rather than on the slider. The parametric lens is
    // still the most horizon-sensitive by construction (it is a % of annual
    // budget per year), so this is a bound, not an invariance claim.
    for (const systems of [10, 50, 100, 250, 1000]) {
      const at = (horizonYears: number) =>
        compareCostModels({ ...scenario, systems, horizonYears }, { seed: 1 }).spreadRatio
      const swing = at(20) / at(1)
      expect(swing, `systems=${systems}`).toBeLessThan(4)
    }
  })

  it('every migration lens responds to the horizon', () => {
    const a = compareCostModels({ ...scenario, horizonYears: 3 }, { seed: 1 })
    const b = compareCostModels({ ...scenario, horizonYears: 12 }, { seed: 1 })
    expect(b.parametric).toBeGreaterThan(a.parametric)
    expect(b.bottomUp).toBeGreaterThan(a.bottomUp)
    expect(b.analogical).toBeGreaterThan(a.analogical)
    expect(b.scenario.expected).toBeGreaterThan(a.scenario.expected)
    expect(b.monteCarlo.p50).toBeGreaterThan(a.monteCarlo.p50)
  })
})

/**
 * The Cost Model Explorer duplicates monteCarloEstimate's sampling loop, so it
 * can reveal draws in generation order for its animation — the model returns
 * them sorted. A duplicate is defensible; a duplicate that drifts is not.
 *
 * It drifted. When the standing programme cost became horizon-scaled on
 * 2026-08-11 (W2-2), monteCarloEstimate moved to programCostFor(horizon) and
 * the component's copy kept the flat SIM_CONSTANTS.fixedProgramCost. The two
 * agreed at the nominal 3-year horizon by construction and nowhere else: the
 * histogram and percentiles disagreed with the Monte-Carlo bar directly above
 * them by $4.67M at a 10-year horizon and $11.33M at 20.
 *
 * This pins the shared term. If the model's programme cost changes again, this
 * fails and points at the component that has to follow.
 */
describe('Monte-Carlo programme cost is shared, not copied', () => {
  it('scales with the horizon rather than sitting at the nominal figure', () => {
    // The flat constant is only correct at NOMINAL_PROGRAM_YEARS.
    expect(programCostFor(NOMINAL_PROGRAM_YEARS)).toBe(SIM_CONSTANTS.fixedProgramCost)
    expect(programCostFor(10)).toBeGreaterThan(SIM_CONSTANTS.fixedProgramCost)
    expect(programCostFor(1)).toBeLessThan(SIM_CONSTANTS.fixedProgramCost)
  })

  it('moves every Monte-Carlo sample by exactly the programme-cost delta', () => {
    const base = { systems: 100, itBudgetAnnual: 5_000_000, complexity: 1 }
    const short = monteCarloEstimate({ ...base, horizonYears: 3 }, { seed: 42, draws: 200 })
    const long = monteCarloEstimate({ ...base, horizonYears: 10 }, { seed: 42, draws: 200 })
    const delta = programCostFor(10) - programCostFor(3)
    // Same seed, same per-system draws: the whole distribution shifts by the
    // programme-cost difference and nothing else.
    for (let i = 0; i < short.samples.length; i++) {
      expect(long.samples[i] - short.samples[i]).toBeCloseTo(delta, 6)
    }
  })
})
