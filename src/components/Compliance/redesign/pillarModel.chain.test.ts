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
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'

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
    const d = buildDrawerDetail(
      framework({ label: 'No-PQC-Mandate Framework', pqcRequirement: 'no' }),
      'comply'
    )
    const chainText = d.chain.map((n) => `${n.value} ${n.sub}`).join(' | ')
    expect(chainText).not.toMatch(/FIPS 140-3 validated/)
    expect(chainText).not.toMatch(/ML-KEM/)
    expect(chainText).not.toMatch(/ML-DSA/)
  })

  it('two different mandates with different deadlines get DIFFERENT chains (not an identical template)', () => {
    const a = buildDrawerDetail(
      framework({
        id: 'a',
        label: 'Mandate A',
        pqcRequirement: 'yes',
        deadline: '2030 hard deadline',
      }),
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

// 2026-07-14 remediation: standardize/certify never got the ACCURACY-0705
// fix — they still hardcoded "Tested by: ACVP / FIPS 140-3" and "Cited by:
// compliance frameworks" / "Required by: compliance frameworks" for every
// single row, plus a tautological "Publishes: Technical standard / technical
// standard" fallback that just repeated the row's own bodyType label. This
// is the same fabrication bug ACCURACY-0705 fixed for 'comply', just in the
// two branches nobody wrote a test for — which is exactly why it shipped.
describe('buildDrawerDetail standardize-pillar chain (2026-07-14 remediation)', () => {
  it('does NOT hardcode "ACVP / FIPS 140-3" or "compliance frameworks" for an arbitrary row', () => {
    const d = buildDrawerDetail(
      framework({ label: 'Some Standards Body', bodyType: 'standardization_body' }),
      'standardize'
    )
    const chainText = d.chain.map((n) => `${n.kind} ${n.value} ${n.sub}`).join(' | ')
    expect(chainText).not.toMatch(/ACVP/)
    expect(chainText).not.toMatch(/FIPS 140-3/)
    expect(chainText).not.toMatch(/compliance frameworks/i)
  })

  it('does not render a tautological Publishes node when no real citation field is populated', () => {
    const d = buildDrawerDetail(
      framework({ label: 'Bare Standard', bodyType: 'technical_standard' }),
      'standardize'
    )
    const chainText = d.chain.map((n) => `${n.value} ${n.sub}`).join(' | ')
    // bodyTypeLabel('technical_standard') === 'Technical standard' — must not
    // appear as if it were real published-standard content.
    expect(chainText).not.toMatch(/Technical standard/)
    expect(d.chain).toHaveLength(1) // just the Body node — honestly short
  })

  it('falls back to libraryRefs when relatedStandards is empty', () => {
    const d = buildDrawerDetail(
      framework({
        label: 'Doc With Library Refs',
        bodyType: 'technical_standard',
        libraryRefs: ['Some Real Library Doc'],
      }),
      'standardize'
    )
    expect(d.chain.some((n) => n.value === 'Some Real Library Doc')).toBe(true)
  })

  it('two different standardize rows get different chains', () => {
    const a = buildDrawerDetail(
      framework({ id: 'a', label: 'Body A', bodyType: 'standardization_body' }),
      'standardize'
    )
    const b = buildDrawerDetail(
      framework({ id: 'b', label: 'Body B', bodyType: 'standardization_body' }),
      'standardize'
    )
    expect(a.chain).not.toEqual(b.chain)
  })

  it('the Body node carries the real per-row label and enforcement body', () => {
    const d = buildDrawerDetail(
      framework({
        label: 'Real Body Name',
        enforcementBody: 'Real Body Enforcement',
        bodyType: 'standardization_body',
      }),
      'standardize'
    )
    expect(d.chain[0].value).toBe('Real Body Name')
    expect(d.chain[0].sub).toBe('Real Body Enforcement')
  })
})

describe('buildDrawerDetail certify-pillar chain (2026-07-14 remediation)', () => {
  it('does NOT hardcode "compliance frameworks" as a "Required by" node for an arbitrary row', () => {
    const d = buildDrawerDetail(
      framework({ label: 'Some Cert Scheme', bodyType: 'certification_body' }),
      'certify'
    )
    const chainText = d.chain.map((n) => `${n.kind} ${n.value} ${n.sub}`).join(' | ')
    expect(chainText).not.toMatch(/Required by.*compliance frameworks/i)
  })

  it('the Scheme node carries the real per-row label and issuer', () => {
    const d = buildDrawerDetail(
      framework({
        label: 'Real Scheme Name',
        enforcementBody: 'Real Issuer',
        bodyType: 'certification_body',
      }),
      'certify'
    )
    expect(d.chain[0].value).toBe('Real Scheme Name')
    expect(d.chain.some((n) => n.kind === 'Issued by' && n.value === 'Real Issuer')).toBe(true)
  })
})

describe('buildDrawerDetail — retired marquee overrides', () => {
  it('a synthetic framework labeled like a former marquee row gets the same honest treatment, not hand-authored text', () => {
    // These labels used to trigger MARQUEE regex matches (CNSA\s*2, FIPS\s*140-3,
    // ^NIST$, ^DORA$) returning hardcoded chains regardless of the row's real
    // fields. A synthetic framework using one of these labels but none of the
    // old hardcoded content must now go through the same field-derived path
    // as every other row.
    const d = buildDrawerDetail(
      framework({ label: 'CNSA 2.0', pqcRequirement: 'guidance', deadline: 'Ongoing' }),
      'comply'
    )
    const chainText = d.chain.map((n) => `${n.value} ${n.sub}`).join(' | ')
    expect(chainText).not.toMatch(/NSA directive — binding/)
    expect(chainText).not.toMatch(/CMVP module certificate/)
    expect(chainText).not.toMatch(/ML-KEM-1024/)
  })
})

describe('buildDrawerDetail — real xwalk data integration (live data)', () => {
  it('the reported NIST NCCoE SP 1800-38 row no longer shows the fabricated ACVP/FIPS 140-3 claim, and surfaces its real merged relationships', () => {
    const row = complianceFrameworks.find((f) => f.id === 'NIST-NCCOE-PQC')
    expect(row).toBeDefined()
    if (!row) return
    const d = buildDrawerDetail(row, 'standardize')
    const chainText = d.chain.map((n) => `${n.kind} ${n.value} ${n.sub}`).join(' | ')
    expect(chainText).not.toMatch(/ACVP/)
    expect(chainText).not.toMatch(/FIPS 140-3/)
    expect(chainText).not.toMatch(/^Publishes Technical standard/)
    // Real relationship merged 2026-07-14 from enrich-compliance-xwalk.py.
    expect(d.chain.some((n) => n.value === 'NIST NCCoE SP 1800-38C')).toBe(true)
  })
})
