// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { ComplianceFramework } from '../data/complianceData'
import type { ThreatData } from '../data/threatsData'
import {
  applicableFrameworks,
  applicableThreats,
  groupByTier,
  isProfileEmpty,
  type UserProfile,
} from './applicabilityEngine'

// ── Test fixtures ────────────────────────────────────────────────────────

function makeFramework(overrides: Partial<ComplianceFramework> = {}): ComplianceFramework {
  return {
    id: 'TEST',
    label: 'Test Framework',
    description: '',
    industries: [],
    countries: [],
    requiresPQC: true,
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'Test',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...overrides,
  }
}

function makeThreat(overrides: Partial<ThreatData> = {}): ThreatData {
  return {
    industry: 'Government / Defense',
    threatId: 'GOV-001',
    description: '',
    criticality: 'High',
    cryptoAtRisk: '',
    pqcReplacement: '',
    mainSource: '',
    sourceUrl: '',
    relatedModules: [],
    ...overrides,
  }
}

// ── isProfileEmpty ───────────────────────────────────────────────────────

describe('isProfileEmpty', () => {
  it('returns true when all fields are unset', () => {
    expect(isProfileEmpty({ industry: null, country: null, region: null })).toBe(true)
  })

  it('returns true when only "Other"/"Global"/"global" placeholders are set', () => {
    expect(isProfileEmpty({ industry: 'Other', country: 'Global', region: 'global' })).toBe(true)
  })

  it('returns false when industry is set', () => {
    expect(isProfileEmpty({ industry: 'Finance', country: null })).toBe(false)
  })

  it('returns false when country is set', () => {
    expect(isProfileEmpty({ industry: null, country: 'Australia' })).toBe(false)
  })

  it('returns false when region is set', () => {
    expect(isProfileEmpty({ industry: null, country: null, region: 'apac' })).toBe(false)
  })
})

// ── applicableFrameworks — tier classification ──────────────────────────

describe('applicableFrameworks — tier classification', () => {
  const auGovProfile: UserProfile = {
    industry: 'Government & Defense',
    country: 'Australia',
    region: 'apac',
  }

  it('returns [] when profile is empty', () => {
    const fw = makeFramework({ countries: ['Australia'], industries: ['Government & Defense'] })
    expect(applicableFrameworks({ industry: null, country: null }, [fw])).toEqual([])
  })

  it('classifies country+industry match with domestic regulator as Mandatory', () => {
    const fw = makeFramework({
      id: 'ASD-ISM',
      countries: ['Australia'],
      industries: ['Government & Defense'],
      enforcementBody: 'ASD',
    })
    const [result] = applicableFrameworks(auGovProfile, [fw])
    expect(result?.tier).toBe('mandatory')
    expect(result?.reason).toMatch(/Your regulator: ASD/)
  })

  it('classifies country+industry match with foreign Five-Eyes regulator as Recognized', () => {
    // FIPS-140-3 has Australia in its country list but enforcementBody=NIST
    // (foreign). NIST is in the Five Eyes body set → Recognized + affinity reason.
    const fw = makeFramework({
      id: 'FIPS-140-3',
      countries: ['United States', 'Canada', 'Australia'],
      industries: ['Government & Defense', 'Finance & Banking', 'Technology'],
      enforcementBody: 'NIST',
    })
    const [result] = applicableFrameworks(auGovProfile, [fw])
    expect(result?.tier).toBe('recognized')
    expect(result?.reason).toMatch(/Five Eyes affinity/)
    expect(result?.reason).toContain('NIST')
  })

  it('classifies country+industry match with non-Five-Eyes foreign body as plain Recognized', () => {
    // NATO-4774 is enforced by NATO (not Five Eyes) but applies to AU.
    const fw = makeFramework({
      id: 'NATO-4774',
      countries: ['United States', 'European Union', 'Canada', 'Czech Republic', 'Australia'],
      industries: ['Government & Defense'],
      enforcementBody: 'NATO',
    })
    const [result] = applicableFrameworks(auGovProfile, [fw])
    expect(result?.tier).toBe('recognized')
    expect(result?.reason).toMatch(/Foreign authority NATO/)
    expect(result?.reason).not.toMatch(/Five Eyes/)
  })

  it('classifies country match + different industry as Cross-border (regardless of body)', () => {
    const fw = makeFramework({
      id: 'APRA-CPS-234',
      countries: ['Australia'],
      industries: ['Finance & Banking'],
      enforcementBody: 'APRA', // domestic for Finance, but user is Gov
    })
    const [result] = applicableFrameworks(auGovProfile, [fw])
    expect(result?.tier).toBe('cross-border')
  })

  it('classifies global standard for matching industry as Advisory', () => {
    const fw = makeFramework({
      id: 'ISO-IEC-18033',
      countries: ['Global'],
      industries: ['Government & Defense'],
      enforcementBody: 'ISO',
    })
    const [result] = applicableFrameworks(auGovProfile, [fw])
    expect(result?.tier).toBe('advisory')
  })

  it('omits APAC peer (e.g. Japan/Finance) when explicit country differs', () => {
    // With country=Australia set, region fallback is OFF — Japan/Finance has
    // no country or industry overlap, so engine returns no match.
    const fw = makeFramework({
      id: 'JP-FIN',
      countries: ['Japan'],
      industries: ['Finance & Banking'],
    })
    expect(applicableFrameworks(auGovProfile, [fw])).toEqual([])
  })

  it('omits APAC peer with non-matching industry even when only region is set', () => {
    // Tightened engine: a region-only weak signal without industry match is
    // intentionally dropped to keep the panel signal-dense for executives.
    const apacOnly: UserProfile = {
      industry: 'Government & Defense',
      country: null,
      region: 'apac',
    }
    const fw = makeFramework({
      id: 'JP-FIN',
      countries: ['Japan'],
      industries: ['Finance & Banking'],
    })
    expect(applicableFrameworks(apacOnly, [fw])).toEqual([])
  })

  it('omits items with no country or industry overlap', () => {
    const fw = makeFramework({
      id: 'BR-FIN',
      countries: ['Brazil'],
      industries: ['Finance & Banking'],
    })
    expect(applicableFrameworks(auGovProfile, [fw])).toEqual([])
  })

  it('uses EU member fallback for European Union framework with EU-level body', () => {
    const fw = makeFramework({
      id: 'EU-NIS2',
      countries: ['European Union'],
      industries: ['Critical Infrastructure'],
      enforcementBody: 'ENISA/EU Member States',
    })
    const frenchProfile: UserProfile = {
      industry: 'Critical Infrastructure',
      country: 'France',
      region: 'eu',
    }
    const [result] = applicableFrameworks(frenchProfile, [fw])
    expect(result?.tier).toBe('mandatory')
  })

  it('omits region-fallback items without explicit industry match (tighter engine)', () => {
    // Tightened engine: region match alone (without a directIndustryMatch) no
    // longer fires — items are filtered out instead of being shown as advisory
    // noise. This is what reduces the executive panel from 396 → ~32 items.
    const fw = makeFramework({
      id: 'JP-CRYPTREC',
      countries: ['Japan'],
      industries: [],
    })
    const apacOnly: UserProfile = { industry: null, country: null, region: 'apac' }
    expect(applicableFrameworks(apacOnly, [fw])).toEqual([])
  })
})

// ── applicableThreats ────────────────────────────────────────────────────

describe('applicableThreats', () => {
  const auGovProfile: UserProfile = {
    industry: 'Government / Defense',
    country: 'Australia',
    region: 'apac',
  }

  it('classifies AUS-GOV-001 as Recognized for AU government profile', () => {
    // Threats have no enforcement-body authority concept (their `mainSource`
    // is a citation, not a regulator), so country+industry match tops out at
    // Recognized — Mandatory is reserved for frameworks with a domestic
    // regulator. The For-You view still surfaces these as country-specific.
    const t = makeThreat({ threatId: 'AUS-GOV-001', industry: 'Government / Defense' })
    const [result] = applicableThreats(auGovProfile, [t])
    expect(result?.tier).toBe('recognized')
  })

  it('classifies generic GOV-001 (no country prefix) as Advisory by industry', () => {
    // No country prefix → countryUniversal=true (treated as Global). Industry
    // match + global scope → Advisory tier.
    const t = makeThreat({ threatId: 'GOV-001', industry: 'Government / Defense' })
    const [result] = applicableThreats(auGovProfile, [t])
    expect(result?.tier).toBe('advisory')
    expect(result?.reason).toMatch(/Government \/ Defense/)
  })

  it('omits threats for unrelated countries and industries', () => {
    const t = makeThreat({ threatId: 'USA-AERO-001', industry: 'Aerospace / Aviation' })
    expect(applicableThreats(auGovProfile, [t])).toEqual([])
  })
})

// ── groupByTier ──────────────────────────────────────────────────────────

describe('groupByTier', () => {
  it('groups results by tier with stable empty buckets', () => {
    const fw1 = makeFramework({
      countries: ['Australia'],
      industries: ['Government & Defense'],
      enforcementBody: 'ASD',
    })
    const fw2 = makeFramework({
      countries: ['Australia'],
      industries: ['Finance & Banking'],
      enforcementBody: 'APRA',
    })
    const profile: UserProfile = { industry: 'Government & Defense', country: 'Australia' }
    const results = applicableFrameworks(profile, [fw1, fw2])
    const grouped = groupByTier(results)
    expect(grouped.mandatory).toHaveLength(1)
    expect(grouped['cross-border']).toHaveLength(1)
    expect(grouped.recognized).toEqual([])
    expect(grouped.advisory).toEqual([])
    expect(grouped.informational).toEqual([])
  })
})
