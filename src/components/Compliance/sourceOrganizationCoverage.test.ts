// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { applicableFrameworks } from '@/utils/applicabilityEngine'
import { complianceFrameworks } from '@/data/complianceData'
import { unclassifiedSourceOrganizations } from './sourceOrganizationCoverage'

describe('compliance source-organization reconciliation', () => {
  it('keeps the confirmed US sources out of the unclassified queue', () => {
    const names = new Set(unclassifiedSourceOrganizations().map((entry) => entry.name))
    expect(names.has('NIST NCCoE')).toBe(false)
    expect(names.has('Cybersecurity and Infrastructure Security Agency (CISA)')).toBe(false)
    expect(names.has('National Information Assurance Partnership (NIAP), NSA')).toBe(false)
    expect(names.has('AICPA')).toBe(false)
    expect(names.has('NIST; SRI International')).toBe(false)
    expect(
      names.has(
        'Common Criteria Recognition Arrangement (CCRA) members including ASD, CSE, ANSSI, BSI, IPA, NCCSA, GCSB, NSRI, MAP/CCN, FMV, NCSC, NSA/NIST'
      )
    ).toBe(false)
  })

  it('never emits the unsafe Foreign authority fallback for the active catalogue', () => {
    const profiles = [
      { country: 'United States', industry: 'Technology' },
      { country: 'Australia', industry: 'Government & Defense' },
      { country: 'France', industry: 'Finance & Insurance' },
      { country: 'Germany', industry: 'Technology' },
      { country: 'United Kingdom', industry: 'Technology' },
      { country: 'Canada', industry: 'Government & Defense' },
      { country: 'Japan', industry: 'Technology' },
    ]
    for (const profile of profiles) {
      for (const result of applicableFrameworks(profile, complianceFrameworks)) {
        expect(result.reason).not.toMatch(/Foreign authority/i)
      }
    }
  })

  it('keeps unresolved names in an explicit maintainer queue', () => {
    const queue = unclassifiedSourceOrganizations()
    expect(queue.length).toBeGreaterThan(0)
    expect(queue.every((entry) => entry.frameworkIds.length > 0)).toBe(true)
  })
})
