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
  it('sums per-system cost and the fixed program cost', () => {
    // 40k × 1.0 × 250 + 2M = 12M
    expect(bottomUpEstimate(scenario)).toBe(12_000_000)
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
    expect(band.expected).toBe(12_000_000)
    expect(band.optimistic).toBeCloseTo(12_000_000 * SIM_CONSTANTS.optimisticFactor, 6)
    expect(band.conservative).toBeCloseTo(12_000_000 * SIM_CONSTANTS.conservativeFactor, 6)
    expect(band.optimistic).toBeLessThan(band.expected)
    expect(band.conservative).toBeGreaterThan(band.expected)
  })
})

describe('analogicalEstimate', () => {
  it('prices per system from an illustrative historical rate', () => {
    // 30k × 1.0 × 250 = 7.5M
    expect(analogicalEstimate(scenario)).toBe(7_500_000)
  })
})

describe('aleReference', () => {
  it('is a cost-of-inaction figure independent of the migration scope', () => {
    // 4.44M × 2.5 × 0.15 × 5 = 8.325M
    expect(aleReference(scenario)).toBeCloseTo(8_325_000, 0)
    // Does not depend on system count (it is not a migration-cost method).
    expect(aleReference({ ...scenario, systems: 9999 })).toBeCloseTo(8_325_000, 0)
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
