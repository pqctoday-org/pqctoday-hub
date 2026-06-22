// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeThreatLevels,
  portfolioFor,
  portfolioValue,
  programBudgetTarget,
  assetAtRisk,
  exposeAssets,
  criticalExposedValue,
  insuranceCoverage,
  EXPOSURE_PCT,
  INSURANCE_POLICY,
  QC_FIRST_YEAR,
  QC_BROAD_YEAR,
  SECTOR_SEEDS,
  TIER_SENSITIVITY_SCORE,
  type OrgSize,
} from './simAssets'
import { SECTORS } from './moscaClock'
import { industrySensitivityConfigs } from './industryAssessConfig'

const SIZES: OrgSize[] = ['small', 'mid', 'large', 'global']

describe('simAssets — date-driven threat', () => {
  it('TNFL ramps very-low → high across 2026–2029, critical by 2035', () => {
    const tnfl = (y: number) =>
      computeThreatLevels({ currentYear: y, shelfLifeYears: 10 }).tnfl.label
    expect(tnfl(2026)).toBe('Very low')
    expect(tnfl(2027)).toBe('Low')
    expect(tnfl(2028)).toBe('Medium')
    expect(tnfl(2029)).toBe('High')
    expect(tnfl(2035)).toBe('Critical')
  })

  it('HNDL is already high for long-shelf-life data well before Q-Day', () => {
    // 15y healthcare data captured in 2026 is decryptable past the 2029 Q-Day
    const hndl = computeThreatLevels({ currentYear: 2026, shelfLifeYears: 15 }).hndl
    expect(hndl.score).toBeGreaterThanOrEqual(3)
  })

  it('short-shelf data carries low HNDL risk before Q-Day', () => {
    const hndl = computeThreatLevels({ currentYear: 2026, shelfLifeYears: 1 }).hndl
    expect(hndl.score).toBeLessThanOrEqual(1)
  })

  it('an accelerating-CRQC shift pulls Q-Day (and risk) earlier', () => {
    const base = computeThreatLevels({ currentYear: 2027, shelfLifeYears: 10 })
    const shifted = computeThreatLevels({ currentYear: 2027, shelfLifeYears: 10, crqcShift: 2 })
    expect(shifted.qcFirst).toBe(QC_FIRST_YEAR - 2)
    expect(shifted.tnfl.score).toBeGreaterThan(base.tnfl.score)
  })
})

describe('simAssets — asset risk timeline', () => {
  it('critical assets are at risk from 2029, low only by 2035', () => {
    expect(assetAtRisk('critical', QC_FIRST_YEAR)).toBe(true)
    expect(assetAtRisk('critical', QC_FIRST_YEAR - 1)).toBe(false)
    expect(assetAtRisk('low', QC_FIRST_YEAR)).toBe(false)
    expect(assetAtRisk('low', QC_BROAD_YEAR)).toBe(true)
  })
})

describe('simAssets — portfolio & budget', () => {
  it('portfolios are grounded, sorted critical-first, and scale with size', () => {
    const mid = portfolioFor('healthcare', 'mid')
    expect(mid.length).toBeGreaterThan(0)
    expect(mid[0].tier).toBe('critical') // sorted
    expect(mid.some((a) => a.id === 'phi')).toBe(true) // real assess-engine asset
    // value scales up with org size
    expect(portfolioValue('healthcare', 'global')).toBeGreaterThan(
      portfolioValue('healthcare', 'mid')
    )
  })

  it('every size has an insurance policy and a positive budget target', () => {
    for (const size of SIZES) {
      expect(INSURANCE_POLICY[size]).toBeGreaterThan(0)
      expect(programBudgetTarget('financial', size)).toBeGreaterThan(0)
    }
  })

  it('unknown sector falls back to the general portfolio', () => {
    expect(portfolioFor('does-not-exist', 'mid').length).toBe(portfolioFor('general', 'mid').length)
  })
})

describe('simAssets — exposure & insurance', () => {
  it('exposure weights value by the threat level (20/40/60/80/100%)', () => {
    expect(EXPOSURE_PCT[0]).toBe(0.2)
    expect(EXPOSURE_PCT[4]).toBe(1.0)
    const assets = portfolioFor('healthcare', 'mid')
    // critical HNDL level (4) + very-low TNFL level (0)
    const ex = exposeAssets(assets, 4, 0)
    for (const r of ex.rows) {
      const expectedPct = r.exposure === 'HNDL' ? 1.0 : 0.2
      expect(r.exposurePct).toBe(expectedPct)
      expect(r.exposedM).toBeCloseTo(Math.round(r.valueM * expectedPct * 10) / 10, 5)
    }
    expect(ex.totalM).toBeGreaterThan(0)
  })

  it('exposed value rises as threat scores rise', () => {
    const assets = portfolioFor('financial', 'large')
    const low = exposeAssets(assets, 0, 0).totalM
    const high = exposeAssets(assets, 4, 4).totalM
    expect(high).toBeGreaterThan(low)
  })

  it('insurance covers at least the exposed critical-asset value', () => {
    // mid healthcare in 2026: HNDL critical (100%), TNFL very-low (20%)
    const { hndl, tnfl } = computeThreatLevels({ currentYear: 2026, shelfLifeYears: 15 })
    const ex = exposeAssets(portfolioFor('healthcare', 'mid'), hndl.score, tnfl.score)
    // PKI keys (TNFL, €30M × 20% = €6M) + genomic (HNDL, €30M × 100% = €30M) = €36M
    expect(criticalExposedValue(ex.rows)).toBeCloseTo(36, 5)
    expect(insuranceCoverage('mid', ex.rows)).toBeGreaterThanOrEqual(criticalExposedValue(ex.rows))
  })
})

// #6 — the assess-engine CSV (pqcassessment_*.csv) is the documented source of
// truth for sensitivity; SECTOR_SEEDS is a hand-curated, sector-keyed view of it.
// These guards catch the two real drifts (a sim sector with no seeds → silent
// 'general' fallback; the CSV introducing a sensitivity level the sim's tiers
// don't model) WITHOUT pinning the tuned gameplay values.
describe('simAssets — single source of truth (assess CSV consistency guard)', () => {
  it('every sim sector has its own seeded portfolio (no silent general fallback)', () => {
    for (const s of SECTORS) {
      expect(
        SECTOR_SEEDS[s.id],
        `sector "${s.id}" has no asset seeds → falls back to general`
      ).toBeDefined()
      expect(SECTOR_SEEDS[s.id].length, `sector "${s.id}" has empty seeds`).toBeGreaterThan(0)
    }
  })

  it("the sim's sensitivity tiers cover every sensitivity score the assess CSV defines", () => {
    expect(industrySensitivityConfigs.length, 'CSV sensitivity catalogue is empty').toBeGreaterThan(
      0
    )
    const simScores = new Set(Object.values(TIER_SENSITIVITY_SCORE)) // {25,15,5,0}
    for (const score of new Set(industrySensitivityConfigs.map((c) => c.sensitivityScore))) {
      expect(
        simScores.has(score),
        `CSV sensitivity score ${score} maps to no sim tier — update TIER_SENSITIVITY_SCORE / SECTOR_SEEDS`
      ).toBe(true)
    }
  })

  it('every tier used by SECTOR_SEEDS is a known sim sensitivity tier', () => {
    const usedTiers = new Set(
      Object.values(SECTOR_SEEDS)
        .flat()
        .map((a) => a.tier)
    )
    for (const tier of usedTiers) {
      expect(TIER_SENSITIVITY_SCORE[tier], `tier "${tier}" is not a known sim tier`).toBeDefined()
    }
  })
})
