// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  HNDL_MULTIPLIER_CAP,
  hndlMultiplier,
  computeBreachCosts,
  type BreachModelInputs,
} from './breachCostModel'

const base: BreachModelInputs = {
  baseline: 4_880_000,
  breachScale: 1,
  yearsOfData: 5,
  hndlFactorPct: 30,
  annualBreachProbPct: 15,
}

describe('hndlMultiplier', () => {
  it('is 1.0 when there is no HNDL exposure', () => {
    expect(hndlMultiplier(0, 30)).toBe(1)
    expect(hndlMultiplier(5, 0)).toBe(1)
  })

  it('defaults 5yr × 30% to 2.5×', () => {
    expect(hndlMultiplier(5, 30)).toBeCloseTo(2.5, 6)
  })

  it('caps the amplification so long retention cannot run away', () => {
    // 25yr × 100% = 25 → capped at HNDL_MULTIPLIER_CAP
    expect(hndlMultiplier(25, 100)).toBe(1 + HNDL_MULTIPLIER_CAP)
  })

  it('never goes below 1 for negative inputs', () => {
    expect(hndlMultiplier(-5, -30)).toBe(1)
  })
})

describe('computeBreachCosts', () => {
  it('anchors the classical breach on baseline × severity (no reputational double-count)', () => {
    expect(computeBreachCosts(base).classicalSLE).toBe(4_880_000)
    expect(computeBreachCosts({ ...base, breachScale: 2 }).classicalSLE).toBe(9_760_000)
  })

  it('applies only the HNDL multiplier for the quantum breach', () => {
    const c = computeBreachCosts(base)
    // quantum = classical × 2.5
    expect(c.quantumSLE).toBeCloseTo(4_880_000 * 2.5, 0)
    expect(c.delta).toBeCloseTo(c.quantumSLE - c.classicalSLE, 6)
    expect(c.hndlMultiplier).toBeCloseTo(2.5, 6)
  })

  it('stays realistic — quantum is a small multiple of classical, never 10×+', () => {
    const c = computeBreachCosts({ ...base, yearsOfData: 25, hndlFactorPct: 100 })
    // Worst case is (1 + cap) = 5×, not tens of ×.
    expect(c.quantumSLE / c.classicalSLE).toBeLessThanOrEqual(1 + HNDL_MULTIPLIER_CAP)
  })

  it('separates impact (SLE) from expected annual loss (ALE = SLE × probability)', () => {
    const c = computeBreachCosts(base)
    expect(c.classicalALE).toBeCloseTo(c.classicalSLE * 0.15, 6)
    expect(c.quantumALE).toBeCloseTo(c.quantumSLE * 0.15, 6)
  })

  it('yields zero expected loss at zero probability', () => {
    const c = computeBreachCosts({ ...base, annualBreachProbPct: 0 })
    expect(c.classicalALE).toBe(0)
    expect(c.quantumALE).toBe(0)
    // but the per-event cost is unchanged
    expect(c.classicalSLE).toBe(4_880_000)
  })
})
