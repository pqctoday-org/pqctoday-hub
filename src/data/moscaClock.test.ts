// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeSimMosca,
  horizonYearFor,
  shelfLifeFor,
  SIM_CRQC_YEAR,
  SIZE_MIGRATION_YEARS,
  DEFAULT_SHELF_LIFE_YEARS,
} from './moscaClock'

describe('moscaClock', () => {
  it('flags at-risk when X + Y exceeds the window', () => {
    const c = computeSimMosca({
      migrationYears: 6,
      shelfLifeYears: 5,
      horizonYear: 2030,
      currentYear: 2026,
    })
    expect(c.yearsToHorizon).toBe(4)
    expect(c.over).toBe(7) // (5 + 6) − 4
    expect(c.atRisk).toBe(true)
  })

  it('is on track when the window is wide and the org is small', () => {
    const c = computeSimMosca({
      migrationYears: SIZE_MIGRATION_YEARS.small,
      shelfLifeYears: 5,
      horizonYear: 2035,
      currentYear: 2026,
    })
    expect(c.yearsToHorizon).toBe(9)
    expect(c.over).toBe(-2) // (5 + 2) − 9
    expect(c.atRisk).toBe(false)
  })

  it('uses the sooner of the CRQC estimate and the country deadline as Z', () => {
    expect(horizonYearFor('DE')).toBe(2030) // mandate pulls it in
    expect(horizonYearFor('UK')).toBe(Math.min(SIM_CRQC_YEAR, 2035))
    expect(horizonYearFor('XX')).toBe(SIM_CRQC_YEAR) // unknown → CRQC baseline
  })

  it('bigger organisations migrate slower (larger Y)', () => {
    expect(SIZE_MIGRATION_YEARS.global).toBeGreaterThan(SIZE_MIGRATION_YEARS.small)
  })

  it('sector sets the data shelf-life X (longest for government, shortest for retail)', () => {
    expect(shelfLifeFor('government')).toBe(20)
    expect(shelfLifeFor('retail')).toBe(3)
    expect(shelfLifeFor('unknown-sector')).toBe(DEFAULT_SHELF_LIFE_YEARS)
    expect(shelfLifeFor('government')).toBeGreaterThan(shelfLifeFor('retail'))
  })
})
