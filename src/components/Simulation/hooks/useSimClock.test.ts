// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { deriveSimClock, type SimClockInput } from './useSimClock'
import { SIM_CRQC_YEAR, COUNTRY_DEADLINE_YEAR, shelfLifeFor } from '@/data/moscaClock'

const base = (over: Partial<SimClockInput> = {}): SimClockInput => ({
  year: 2026,
  q: 1,
  country: 'US',
  sector: 'healthcare',
  size: 'mid',
  crqcShift: 0,
  assessMosca: null,
  ...over,
})

describe('deriveSimClock (PR6 — extracted Mosca derivation)', () => {
  it('quarter-aware fractional current year', () => {
    expect(deriveSimClock(base({ year: 2026, q: 1 })).currentYear).toBe(2026)
    expect(deriveSimClock(base({ year: 2026, q: 3 })).currentYear).toBe(2026.5)
    expect(deriveSimClock(base({ year: 2030, q: 4 })).currentYear).toBe(2030.75)
  })

  it('horizon is the earlier of the CRQC estimate and the country deadline', () => {
    // US has a deadline; horizon must not exceed it
    const us = deriveSimClock(base({ country: 'US' }))
    expect(us.clock.horizonYear).toBe(
      Math.min(SIM_CRQC_YEAR, COUNTRY_DEADLINE_YEAR['US'] ?? SIM_CRQC_YEAR)
    )
  })

  it('a CRQC shift pulls the horizon forward (never moves it later)', () => {
    const a = deriveSimClock(base({ crqcShift: 0 }))
    const b = deriveSimClock(base({ crqcShift: 3 }))
    expect(b.clock.horizonYear).toBeLessThanOrEqual(a.clock.horizonYear)
  })

  it('uses sim sector/size tables when no assessment is present', () => {
    const r = deriveSimClock(base({ assessMosca: null, sector: 'healthcare' }))
    expect(r.simShelfLifeYears).toBe(shelfLifeFor('healthcare'))
  })

  it('prefers assessment-derived X/Y when present', () => {
    const r = deriveSimClock(base({ assessMosca: { shelfLifeYears: 12, migrationYears: 7 } }))
    expect(r.simShelfLifeYears).toBe(12)
    expect(r.simMigrationYears).toBe(7)
    // clock X/Y mirror those inputs
    expect(r.clock.x).toBe(12)
    expect(r.clock.y).toBe(7)
  })

  it('over = X + Y − yearsToHorizon, and atRisk tracks its sign', () => {
    const r = deriveSimClock(base({ assessMosca: { shelfLifeYears: 20, migrationYears: 10 } }))
    expect(r.clock.over).toBeCloseTo(r.clock.x + r.clock.y - r.clock.yearsToHorizon, 6)
    expect(r.clock.atRisk).toBe(r.clock.over > 0)
  })
})
