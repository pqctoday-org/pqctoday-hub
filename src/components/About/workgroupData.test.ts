// SPDX-License-Identifier: AGPL-3.0-only
//
// workgroupData.test.ts — the workgroup records must type each entry (a guidance document or a
// joint statement is not a standing group), cite dates only where the source states them, keep
// unknowns as unknowns, and not attach the wrong source or region to an organization.
import { describe, it, expect } from 'vitest'
import { PQC_WORKGROUPS, WORKGROUP_REGIONS } from './workgroupData'

const TYPE_LABELS = [
  'Industry open-source initiative',
  'Industry consortium working group',
  'Industry consortium',
  'Coalition',
  'Standards-body work area',
  'EU agency topic area',
  'Cooperation-group work stream',
  'Government guidance document',
  'Government agency topic area',
  'Government agency guidance',
  'Government agency program',
  'Government agency',
  'Government evaluation project',
  'Government research-funding program',
  'Capacity-building program',
  'Competition',
]

const byShort = (shortName: string) => {
  const w = PQC_WORKGROUPS.find((x) => x.shortName === shortName)
  if (!w) throw new Error(`no workgroup "${shortName}"`)
  return w
}

describe('workgroup records', () => {
  it('every record starts its description with what kind of body or document it is', () => {
    for (const w of PQC_WORKGROUPS) {
      expect(
        TYPE_LABELS.some((label) => w.description.startsWith(label)),
        `${w.shortName}: ${w.description.slice(0, 50)}`
      ).toBe(true)
    }
  })

  it('every region is one of the listed regions and short names are unique', () => {
    const regions = new Set<string>(WORKGROUP_REGIONS)
    for (const w of PQC_WORKGROUPS) expect(regions.has(w.region), w.shortName).toBe(true)
    const names = PQC_WORKGROUPS.map((w) => w.shortName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('guidance documents and statements are not given a founding year', () => {
    for (const short of ['NCSC PQC', 'CCCS', 'BSI PQC', 'NIS PQC', 'IMDA QSN', 'KpqC']) {
      expect(byShort(short).founded, short).toMatch(/^n\/a \(/)
    }
    // the dated fact is in the record, not an invented founding date
    expect(byShort('NCSC PQC').founded).toContain('20 March 2025')
    expect(byShort('CCCS').founded).toContain('23 June 2025')
    expect(byShort('BSI PQC').founded).toContain('November 2024')
    expect(byShort('NIS PQC').founded).toContain('23 June 2025')
  })

  it('a bare founding year appears only when the description cites that year', () => {
    for (const w of PQC_WORKGROUPS) {
      if (/^\d{4}$/.test(w.founded)) {
        expect(w.description, w.shortName).toContain(w.founded)
      }
    }
  })

  it('an entry that says it is not verified keeps its date unknown unless the text cites one', () => {
    const unverified = PQC_WORKGROUPS.filter((w) => /not verified here/i.test(w.description))
    expect(unverified.length).toBeGreaterThan(5)
    for (const w of unverified) {
      if (/^\d{4}$/.test(w.founded)) expect(w.description, w.shortName).toContain(w.founded)
      else expect(w.founded, w.shortName).toMatch(/not verified|^n\/a \(/)
    }
  })

  it('does not name individuals or claim a leader or mandate the sources do not state', () => {
    for (const w of PQC_WORKGROUPS) {
      const t = `${w.description} ${w.keyMembers}`
      expect(t, w.shortName).not.toMatch(/chaired by|\bchair:|Campagna/i)
      expect(t, w.shortName).not.toMatch(/mandat(e|ory|ing)/i)
      expect(t, w.shortName).not.toMatch(/leads the joint/i)
    }
  })

  it('states the BSI joint statement as published with partners, and counts them consistently', () => {
    const t = byShort('BSI PQC').description
    expect(t).toMatch(/17 other European states/)
    expect(t).toMatch(/three more European states/)
    expect(byShort('BSI PQC').keyMembers).toMatch(/17 other European states/)
  })

  it('places EU-level and US-registered bodies under the right region', () => {
    expect(byShort('NIS PQC').region).toBe('European Union')
    expect(byShort('PKI Consortium').region).toBe('United States')
  })

  it('the Korean competition links to its own site, not a participating team’s site', () => {
    expect(new URL(byShort('KpqC').url).hostname).toBe('kpqc.or.kr')
    expect(byShort('KpqC').description).toMatch(/AIMer/)
    expect(byShort('KpqC').description).toMatch(/SMAUG-T/)
  })

  it('CRYPTREC members match the organizations that run it', () => {
    const t = byShort('CRYPTREC').keyMembers
    for (const org of ['Digital Agency', 'MIC', 'METI', 'NICT', 'IPA']) expect(t).toContain(org)
    expect(t).not.toMatch(/NCSB|National Cyber Security Bureau/)
  })
})
