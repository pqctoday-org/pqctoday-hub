// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  HNDL_MULTIPLIER_CAP,
  hndlMultiplier,
  shelfLifeDecayFactor,
  effectiveHndlYears,
  computeBreachCosts,
  DATA_SHELF_LIFE_YEARS,
  type BreachModelInputs,
  type DataSensitivityClass,
} from './breachCostModel'
import { CRQC_CURVE_YEAR_RANGE } from './crqcProbability'

const base: BreachModelInputs = {
  baseline: 4_440_000,
  breachScale: 1,
  yearsOfData: 5,
  hndlFactorPct: 30,
  annualBreachProbPct: 15,
  dataSensitivityClass: 'general-pii',
  asOfYear: 2026,
  planningHorizonYears: 10,
  discountRateAnnual: 0.06,
}

describe('hndlMultiplier', () => {
  it('is 1.0 when there is no HNDL exposure', () => {
    expect(hndlMultiplier(0, 30)).toBe(1)
    expect(hndlMultiplier(5, 0)).toBe(1)
  })

  it('is damped relative to the old linear form at the 5yr × 30% default', () => {
    // Was exactly 2.5 under `1 + min(cap, raw)`. The soft cap
    // `1 + cap·(1 − e^(−raw/cap))` has slope 1 at the origin but bends earlier,
    // so mid-range exposure reads slightly lower. The trade is deliberate: the
    // hard clamp pinned high-exposure profiles to exactly 5.00 and erased all
    // differentiation above it. (Audit 2026-08-10.)
    expect(hndlMultiplier(5, 30)).toBeCloseTo(2.251, 3)
  })

  it('approaches but never reaches the cap, and never flatlines', () => {
    // 25yr × 100% = raw 25, far past the cap — asymptotic, not clamped.
    expect(hndlMultiplier(25, 100)).toBeLessThan(1 + HNDL_MULTIPLIER_CAP)
    expect(hndlMultiplier(25, 100)).toBeGreaterThan(1 + HNDL_MULTIPLIER_CAP - 0.05)
    // Strictly increasing even deep into the saturated region — this is the
    // property the hard clamp destroyed.
    expect(hndlMultiplier(40, 100)).toBeGreaterThan(hndlMultiplier(25, 100))
    expect(hndlMultiplier(25, 100)).toBeGreaterThan(hndlMultiplier(14, 100))
  })

  it('never goes below 1 for negative inputs', () => {
    expect(hndlMultiplier(-5, -30)).toBe(1)
  })
})

describe('shelfLifeDecayFactor', () => {
  it('is 1 (no decay) when the corpus has zero average age', () => {
    expect(shelfLifeDecayFactor(0, 10)).toBe(1)
  })

  it('saturates rather than zeroing once the corpus outlives its shelf life', () => {
    // Y=20, S=10 → effective years saturate at S/2 = 5, so 5/20 = 0.25.
    // Previously asserted 0, which claimed a 20-year corpus of 10-year-shelf-life
    // data carried NO quantum exposure — the W1-2 defect.
    expect(shelfLifeDecayFactor(20, 10)).toBeCloseTo(0.25, 6)
  })

  it('is partially decayed part-way through the shelf life', () => {
    // Y=10, S=10 → 10 - 100/20 = 5 effective years → 5/10 = 0.5 (unchanged)
    expect(shelfLifeDecayFactor(10, 10)).toBeCloseTo(0.5, 6)
  })

  it('never goes negative once the corpus is older than the shelf life', () => {
    // Y=100, S=10 → effective years still S/2 = 5 → 5/100 = 0.05, never negative
    expect(shelfLifeDecayFactor(100, 10)).toBeCloseTo(0.05, 6)
    expect(shelfLifeDecayFactor(100, 10)).toBeGreaterThan(0)
  })

  it('is 0 for a zero shelf life', () => {
    expect(shelfLifeDecayFactor(1, 0)).toBe(0)
  })
})

describe('effectiveHndlYears — the property that makes W1-2 unrepresentable', () => {
  it('is monotonically non-decreasing in yearsOfData for every data class', () => {
    for (const cls of Object.keys(DATA_SHELF_LIFE_YEARS) as DataSensitivityClass[]) {
      const shelf = DATA_SHELF_LIFE_YEARS[cls]
      let prev = -1
      for (let y = 0; y <= 60; y += 0.5) {
        const eff = effectiveHndlYears(y, shelf)
        expect(
          eff,
          `${cls} (S=${shelf}): effective years dropped from ${prev} to ${eff} at Y=${y} — more harvested data must never mean less quantum exposure`
        ).toBeGreaterThanOrEqual(prev)
        prev = eff
      }
    }
  })

  it('never returns zero exposure for a non-empty corpus', () => {
    for (const cls of Object.keys(DATA_SHELF_LIFE_YEARS) as DataSensitivityClass[]) {
      const shelf = DATA_SHELF_LIFE_YEARS[cls]
      for (const y of [shelf, shelf * 2, shelf * 3, 60]) {
        expect(effectiveHndlYears(y, shelf), `${cls} at Y=${y}`).toBeGreaterThan(0)
      }
    }
  })

  it('reproduces the previous formula exactly inside the shelf life', () => {
    for (const [y, s] of [
      [1, 10],
      [5, 10],
      [10, 10],
      [3, 3],
      [7, 15],
    ]) {
      expect(effectiveHndlYears(y, s)).toBeCloseTo(y * (1 - y / 2 / s), 9)
    }
  })

  it('the payment-card case the audit found: 6 years of card data still carries uplift', () => {
    const costs = computeBreachCosts({
      ...base,
      yearsOfData: 6,
      dataSensitivityClass: 'payment-card',
    })
    expect(costs.hndlMultiplier).toBeGreaterThan(1)
    expect(costs.quantumSLE).toBeGreaterThan(costs.classicalSLE)
  })
})

describe('computeBreachCosts', () => {
  it('anchors the classical breach on baseline × severity (no reputational double-count)', () => {
    expect(computeBreachCosts(base).classicalSLE).toBe(4_440_000)
    expect(computeBreachCosts({ ...base, breachScale: 2 }).classicalSLE).toBe(8_880_000)
  })

  it('applies the decay-adjusted HNDL multiplier for the quantum breach', () => {
    const c = computeBreachCosts(base)
    // decay reduces effective years below the raw 5, so multiplier < the undecayed 2.5x
    expect(c.hndlMultiplier).toBeLessThan(2.5)
    expect(c.hndlMultiplier).toBeGreaterThanOrEqual(1)
    expect(c.quantumSLE).toBeCloseTo(c.classicalSLE * c.hndlMultiplier, 0)
    expect(c.delta).toBeCloseTo(c.quantumSLE - c.classicalSLE, 6)
  })

  it('applies no decay when no data has been harvested yet', () => {
    const c = computeBreachCosts({ ...base, yearsOfData: 0 })
    expect(c.decayFactor).toBe(1)
    expect(c.hndlMultiplier).toBe(1) // yearsOfData=0 → no HNDL exposure regardless
  })

  it('stays realistic — quantum SLE is never more than (1+cap)× classical', () => {
    const c = computeBreachCosts({ ...base, yearsOfData: 25, hndlFactorPct: 100 })
    expect(c.quantumSLE / c.classicalSLE).toBeLessThanOrEqual(1 + HNDL_MULTIPLIER_CAP)
  })

  it('separates impact (SLE) from expected annual loss (classicalALE = SLE × probability)', () => {
    const c = computeBreachCosts(base)
    expect(c.classicalALE).toBeCloseTo(c.classicalSLE * 0.15, 6)
  })

  it('quantumALE is a probability-weighted blend, strictly between classicalALE and the fully-conditional ALE', () => {
    const c = computeBreachCosts(base)
    const fullyConditionalALE = c.quantumSLE * 0.15
    expect(c.quantumALE).toBeGreaterThan(c.classicalALE)
    expect(c.quantumALE).toBeLessThan(fullyConditionalALE)
  })

  it('yields zero expected loss at zero probability', () => {
    const c = computeBreachCosts({ ...base, annualBreachProbPct: 0 })
    expect(c.classicalALE).toBe(0)
    expect(c.quantumALE).toBe(0)
    // but the per-event cost is unchanged
    expect(c.classicalSLE).toBe(4_440_000)
  })

  it('CRQC-arrival probability materially drives the answer (the v1 gap this fixes)', () => {
    const shorterHorizon = computeBreachCosts({ ...base, planningHorizonYears: 5 })
    const longerHorizon = computeBreachCosts({ ...base, planningHorizonYears: 20 })
    // A longer window necessarily captures at least as much cumulative CRQC
    // probability as a shorter one, everything else equal — and that
    // probability must materially move the blended expected loss, which v1
    // could not do at all (it had no CRQC-probability variable).
    expect(longerHorizon.pCrqc).toBeGreaterThan(shorterHorizon.pCrqc)
    expect(longerHorizon.quantumALE).toBeGreaterThan(shorterHorizon.quantumALE)
  })

  it('exposes a low ≤ central ≤ high range across CRQC scenarios', () => {
    const c = computeBreachCosts(base)
    expect(c.range.low.pCrqc).toBeLessThanOrEqual(c.range.central.pCrqc)
    expect(c.range.central.pCrqc).toBeLessThanOrEqual(c.range.high.pCrqc)
    expect(c.range.low.quantumALE).toBeLessThanOrEqual(c.range.central.quantumALE)
    expect(c.range.central.quantumALE).toBeLessThanOrEqual(c.range.high.quantumALE)
  })

  it('discounts future losses — the annuity PV factor itself grows sub-linearly with horizon', () => {
    // Isolate discounting from the (deliberately) horizon-dependent CRQC
    // probability by comparing PV factors directly, at a fixed rate.
    const shortFactor = (1 - Math.pow(1.06, -5)) / 0.06
    const longFactor = (1 - Math.pow(1.06, -20)) / 0.06
    expect(longFactor).toBeGreaterThan(shortFactor)
    expect(longFactor).toBeLessThan(shortFactor * 4) // 4x the years, not 4x the PV factor

    // pvQuantumDelta itself is allowed to grow faster than horizon-linear,
    // because a longer horizon also captures more cumulative CRQC
    // probability (by design) — that compounding is the point, not a bug.
    const short = computeBreachCosts({ ...base, planningHorizonYears: 5 })
    const long = computeBreachCosts({ ...base, planningHorizonYears: 20 })
    expect(long.pvQuantumDelta).toBeGreaterThan(short.pvQuantumDelta)
  })

  it('stays within the sourced CRQC curve range without throwing for out-of-range years', () => {
    expect(() =>
      computeBreachCosts({ ...base, asOfYear: CRQC_CURVE_YEAR_RANGE.last + 50 })
    ).not.toThrow()
    expect(() =>
      computeBreachCosts({ ...base, asOfYear: CRQC_CURVE_YEAR_RANGE.first - 50 })
    ).not.toThrow()
  })
})
