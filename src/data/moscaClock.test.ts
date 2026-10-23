// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeSimMosca,
  horizonYearFor,
  shelfLifeFor,
  SIM_CRQC_YEAR,
  SIZE_MIGRATION_YEARS,
  DEFAULT_SHELF_LIFE_YEARS,
  COUNTRY_DEADLINE_YEAR,
  COUNTRY_DEADLINE_PROVENANCE,
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
    expect(horizonYearFor('DE')).toBe(Math.min(SIM_CRQC_YEAR, 2030)) // sooner of CRQC / BSI mandate
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

  // Deadlines are DERIVED from the timeline CSV (the is_sim_deadline-tagged row),
  // not hardcoded. The 10 REVIEWED tagged jurisdictions resolve (AU and KR were
  // settled by the user on 2026-09-25 after the Claude + Codex review; DE and UK
  // were re-reviewed and published again on 2026-10-22); SG
  // (guidance-only, no tagged row) falls back to the Q-Day anchor.
  it('derives per-country deadlines from the timeline CSV (tagged rows)', () => {
    for (const c of ['US', 'FR', 'EU', 'CA', 'KR', 'JP', 'AU', 'IN', 'DE', 'UK'] as const) {
      expect(typeof COUNTRY_DEADLINE_YEAR[c], `${c} deadline`).toBe('number')
      expect(COUNTRY_DEADLINE_PROVENANCE[c], `${c} provenance`).toBe('planning')
    }
    // FR's first hard gate (2027) falls before Q-Day → it binds the horizon.
    expect(horizonYearFor('FR')).toBe(2027)
    // JP's deadline (2035) is after Q-Day → falls back to the Q-Day anchor.
    expect(horizonYearFor('JP')).toBe(SIM_CRQC_YEAR)
    // DE and UK were withdrawn to Unverified on 2026-09-25 (the cited guidance
    // used future-target language). The 2026-10-22 timeline review re-read both
    // documents and published them again as reviewed recommendations
    // (binding_force: recommendation, tagged as simulator deadlines): BSI's end of
    // 2030 for very-high-protection applications, and the NCSC's indicative 2035.
    expect(COUNTRY_DEADLINE_YEAR.DE).toBe(2030)
    expect(COUNTRY_DEADLINE_YEAR.UK).toBe(2035)
    // Guidance-only jurisdictions have no national deadline milestone → fall back to Q-Day.
    for (const c of ['SG'] as const) {
      expect(COUNTRY_DEADLINE_YEAR[c], `${c} absent`).toBeUndefined()
      expect(horizonYearFor(c), `${c} fallback`).toBe(SIM_CRQC_YEAR)
    }
  })

  it('tagged jurisdictions at/after Q-Day resolve Z to the Q-Day anchor', () => {
    for (const c of ['EU', 'CA', 'KR', 'US', 'JP', 'AU'] as const) {
      expect(horizonYearFor(c), `${c} horizon`).toBe(SIM_CRQC_YEAR)
    }
    // IN's CII deadline (2027) falls before Q-Day → binds the horizon directly.
    expect(horizonYearFor('IN'), 'IN horizon').toBe(2027)
    // DE and UK bind only if their date is sooner than Q-Day.
    expect(horizonYearFor('DE'), 'DE horizon').toBe(Math.min(SIM_CRQC_YEAR, 2030))
    expect(horizonYearFor('UK'), 'UK horizon').toBe(Math.min(SIM_CRQC_YEAR, 2035))
  })
})
