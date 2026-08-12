// SPDX-License-Identifier: GPL-3.0-only
/**
 * A scenario is only useful if it actually FILLS the wizard. A value that no
 * longer matches an option is not a type error — these are `string[]` fields —
 * it is a silently half-filled form that produces a confident report from a
 * partial premise, which is the exact failure the scenario mode exists to fix.
 */
import { describe, it, expect } from 'vitest'
import { REFERENCE_ESTATES, findReferenceEstate } from './assessmentScenarios'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_COMPLIANCE,
  AVAILABLE_USE_CASES,
  AVAILABLE_INFRASTRUCTURE,
  AVAILABLE_DATA_RETENTION,
  AVAILABLE_CREDENTIAL_LIFETIME,
  DATA_SENSITIVITY_SCORES,
} from '@/hooks/assessmentData'

describe('REFERENCE_ESTATES', () => {
  it('has at least two, with unique ids', () => {
    expect(REFERENCE_ESTATES.length).toBeGreaterThanOrEqual(2)
    expect(new Set(REFERENCE_ESTATES.map((e) => e.id)).size).toBe(REFERENCE_ESTATES.length)
  })

  it.each(REFERENCE_ESTATES.map((e) => [e.id, e] as const))(
    '%s: every answer is a real option the wizard offers',
    (_id, estate) => {
      const a = estate.answers
      expect(AVAILABLE_INDUSTRIES).toContain(a.industry)
      for (const c of a.complianceRequirements) expect(AVAILABLE_COMPLIANCE).toContain(c)
      for (const u of a.cryptoUseCases) expect(AVAILABLE_USE_CASES).toContain(u)
      for (const i of a.infrastructure) expect(AVAILABLE_INFRASTRUCTURE).toContain(i)
      for (const r of a.dataRetention) expect(AVAILABLE_DATA_RETENTION).toContain(r)
      for (const l of a.credentialLifetime) expect(AVAILABLE_CREDENTIAL_LIFETIME).toContain(l)
      for (const s of a.dataSensitivity) expect(Object.keys(DATA_SENSITIVITY_SCORES)).toContain(s)
    }
  )

  it.each(REFERENCE_ESTATES.map((e) => [e.id, e] as const))(
    '%s: says what it is drawn from, and carries a caveat the report can print',
    (_id, estate) => {
      // The basis is what lets a researcher judge the profile instead of
      // trusting it, and the caveat is what stops an exported PDF being read as
      // a finding about a real organisation. Both are load-bearing, so both are
      // required to be substantial rather than a placeholder.
      expect(estate.basis.length).toBeGreaterThan(80)
      expect(estate.basis).toMatch(/not modelled on any named/i)
      expect(estate.caveat).toMatch(/reference estate/i)
      expect(estate.caveat).toMatch(/not a finding about any real/i)
    }
  )

  it('resolves by id, and returns undefined rather than a default for an unknown one', () => {
    expect(findReferenceEstate('retail-bank')?.label).toBe('Mid-size retail bank')
    expect(findReferenceEstate('nope')).toBeUndefined()
    expect(findReferenceEstate(null)).toBeUndefined()
  })
})
