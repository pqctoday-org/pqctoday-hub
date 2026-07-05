// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0705, item 3b: the compliance "comply" pillar's traceability chain
// used to be an IDENTICAL, hardcoded 4-node claim ("Requires FIPS 140-3
// validated" -> "Covers ML-KEM · ML-DSA" -> "Live evidence: CMVP modules") for
// EVERY mandate row, regardless of what that specific mandate requires.
// Verified live: 111 of 115 'comply'-pillar rows hit this generic branch
// (only 4 marquee rows -- CNSA 2.0, FIPS 140-3, NIST, DORA -- get a
// hand-authored chain). ComplianceFramework has no field confirming a
// FIPS-140-3 dependency or that ML-KEM/ML-DSA are specifically named, so the
// claim was fabricated for any mandate that doesn't actually say that.
import { describe, it, expect } from 'vitest'
import { buildDrawerDetail } from './pillarModel'
import type { ComplianceFramework } from '@/data/complianceData'

function framework(overrides: Partial<ComplianceFramework>): ComplianceFramework {
  return {
    id: 'test-framework',
    label: 'Test Framework',
    description: '',
    industries: ['Technology'],
    countries: ['United States'],
    requiresPQC: false,
    pqcRequirement: 'guidance',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'Test Body',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...overrides,
  }
}

describe('buildDrawerDetail comply-pillar chain (ACCURACY-0705)', () => {
  it('does NOT assert "FIPS 140-3 validated" / "ML-KEM · ML-DSA" for a framework with no PQC requirement', () => {
    const d = buildDrawerDetail(framework({ label: 'No-PQC-Mandate Framework', pqcRequirement: 'no' }), 'comply')
    const chainText = d.chain.map((n) => `${n.value} ${n.sub}`).join(' | ')
    expect(chainText).not.toMatch(/FIPS 140-3 validated/)
    expect(chainText).not.toMatch(/ML-KEM/)
    expect(chainText).not.toMatch(/ML-DSA/)
  })

  it('two different mandates with different deadlines get DIFFERENT chains (not an identical template)', () => {
    const a = buildDrawerDetail(
      framework({ id: 'a', label: 'Mandate A', pqcRequirement: 'yes', deadline: '2030 hard deadline' }),
      'comply'
    )
    const b = buildDrawerDetail(
      framework({ id: 'b', label: 'Mandate B', pqcRequirement: 'guidance', deadline: 'Ongoing' }),
      'comply'
    )
    expect(a.chain).not.toEqual(b.chain)
    // The per-row deadline text must actually appear somewhere in ITS OWN chain.
    expect(a.chain.some((n) => n.sub.includes('2030 hard deadline'))).toBe(true)
    expect(b.chain.some((n) => n.sub.includes('Ongoing'))).toBe(true)
  })

  it('a framework with pqcRequirement=no gets a shorter, honest chain (no fabricated migration path)', () => {
    const d = buildDrawerDetail(framework({ pqcRequirement: 'no' }), 'comply')
    expect(d.chain.length).toBe(2)
    expect(d.chain[1].sub).toMatch(/no PQC requirement/i)
  })

  it('the Mandate node still carries the real per-row label and enforcement body', () => {
    const d = buildDrawerDetail(
      framework({ label: 'Real Mandate Name', enforcementBody: 'Real Enforcement Body' }),
      'comply'
    )
    expect(d.chain[0].value).toBe('Real Mandate Name')
    expect(d.chain[0].sub).toBe('Real Enforcement Body')
  })
})
