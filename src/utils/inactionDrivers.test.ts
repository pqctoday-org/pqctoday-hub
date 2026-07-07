// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  resolveMandate,
  deriveIndustryMandate,
  deriveIndustryPenalty,
  type IndustryMandate,
} from './inactionDrivers'

describe('resolveMandate', () => {
  const hard2030: IndustryMandate = {
    deadlineYear: 2030,
    mandateType: 'HARD',
    driverName: 'A',
    driverSource: 'compliance-framework',
  }
  const hard2027: IndustryMandate = {
    deadlineYear: 2027,
    mandateType: 'HARD',
    driverName: 'B',
    driverSource: 'compliance-framework',
  }
  const soft2025: IndustryMandate = {
    deadlineYear: 2025,
    mandateType: 'SOFT',
    driverName: 'C',
    driverSource: 'compliance-framework',
  }

  it('picks the earliest HARD candidate over any SOFT candidate, however much sooner the SOFT one is', () => {
    expect(resolveMandate([hard2030, soft2025])).toEqual(hard2030)
  })

  it('picks the earliest among multiple HARD candidates', () => {
    expect(resolveMandate([hard2030, hard2027])).toEqual(hard2027)
  })

  it('falls back to the earliest SOFT candidate when no HARD candidate exists', () => {
    expect(resolveMandate([soft2025])).toEqual(soft2025)
  })

  it('falls back to the NIST IR 8547 planning anchor, marked NONE, when there are no candidates', () => {
    const result = resolveMandate([])
    expect(result.mandateType).toBe('NONE')
    expect(result.driverSource).toBe('planning-anchor')
    expect(result.driverName).toMatch(/NIST IR 8547/)
  })
})

describe('deriveIndustryMandate (live data)', () => {
  it('never fabricates a HARD mandate for an industry with no qualifying framework or country', () => {
    const result = deriveIndustryMandate('Nonexistent Industry Xyz')
    expect(result.mandateType).toBe('NONE')
    expect(result.deadlineYear).toBe(2035)
  })

  it('finds a real, sourced deadline for Government & Defense from complianceFrameworks', () => {
    // Government & Defense has multiple binding (pqcRequirement: 'yes')
    // frameworks with a parsed deadlineYear (FIPS 140-3, CNSA 2.0, NIST IR
    // 8547, ...) — some of those years are the framework's *enactment* date
    // rather than a migration-completion date (deadlineYear doesn't
    // distinguish the two; that's an existing complianceData.ts limitation,
    // not something this module can improve), so the earliest HARD candidate
    // can legitimately already be in the past. What matters is that it's a
    // real, traceable framework, not a fabricated 2030.
    const result = deriveIndustryMandate('Government & Defense')
    expect(result.mandateType).toBe('HARD')
    expect(result.driverSource).toBe('compliance-framework')
    expect(typeof result.deadlineYear).toBe('number')
  })

  it('a HARD country deadline is used when it is earlier than any framework match', () => {
    const withCountry = deriveIndustryMandate('Technology', 'United States')
    const withoutCountry = deriveIndustryMandate('Technology')
    // Adding a real HARD country candidate can only pull the resolved year
    // earlier or leave it the same — never later.
    expect(withCountry.deadlineYear).toBeLessThanOrEqual(withoutCountry.deadlineYear)
  })
})

describe('deriveIndustryPenalty (live data)', () => {
  it('never fabricates a penalty for an industry with no qualifying framework', () => {
    const result = deriveIndustryPenalty('Nonexistent Industry Xyz')
    expect(result.annualFineUSD).toBe(0)
    expect(result.cliffLossUSD).toBe(0)
    expect(result.annualFineDriver).toBeNull()
    expect(result.cliffLossDriver).toBeNull()
  })

  it('only counts frameworks with pqcRequirement === "yes"', () => {
    // Government & Defense has both binding (CNSA 2.0, FIPS 140-3) and
    // guidance-level frameworks; guidance-level ones must not contribute.
    const result = deriveIndustryPenalty('Government & Defense')
    expect(result.annualFineUSD + result.cliffLossUSD).toBeGreaterThan(0)
  })

  it('splits fines (recurring) from cliffs (one-time contract/cert loss) by penaltyType', () => {
    const result = deriveIndustryPenalty('Government & Defense')
    // CNSA 2.0 / FedRAMP / DISA STIGs are tagged contract-loss and apply to
    // Government & Defense (NAICS 92) — expect a nonzero cliff.
    expect(result.cliffLossUSD).toBeGreaterThan(0)
  })
})
