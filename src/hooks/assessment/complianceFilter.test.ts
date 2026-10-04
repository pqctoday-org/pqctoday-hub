// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { filterComplianceRequirements, splitComplianceRequirements } from './complianceFilter'
import { computeAssessment, computeAssessmentAsync } from './orchestrator'
import { industryComplianceConfigs } from '../../data/industryAssessConfig'
import { AVAILABLE_INDUSTRIES } from '../assessmentData'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '../../data/exampleReport'
import type { AssessmentInput } from '../assessmentTypes'

// The wizard words industries one way ("Finance & Banking") and the framework
// config another ("Finance & Insurance"). Before the shared filter, an exact
// string match silently dropped PCI DSS for a bank, HIPAA for a hospital and
// FERPA for a school from the report's compliance section. These are the
// reference estates that must keep working.

const DORA = 'DORA (EU Digital Operational Resilience)'

const kept = (industry: string, country: string, framework: string) =>
  filterComplianceRequirements([framework], industry, country).length === 1

describe('filterComplianceRequirements — reference estates', () => {
  it.each([
    ['Finance & Banking', 'United States', 'PCI DSS'],
    ['Retail & E-Commerce', 'United States', 'PCI DSS'],
    ['Healthcare', 'United States', 'HIPAA'],
    ['Education', 'United States', 'FERPA'],
    ['Telecommunications', 'Global', 'GSMA PQ.03 (Post-Quantum Guidelines for Telecom Use Cases)'],
    // An EU regulation applies in every member state, not only under the label "European Union".
    ['Finance & Banking', 'Germany', DORA],
    ['Finance & Banking', 'European Union', DORA],
    // These matched before as well and must keep matching.
    ['Energy & Utilities', 'United States', 'NERC CIP'],
    ['Government & Defense', 'United States', 'FedRAMP'],
  ])('%s in %s keeps %s', (industry, country, framework) => {
    expect(kept(industry, country, framework)).toBe(true)
  })

  it.each([
    // A framework for another industry is still left out.
    ['Healthcare', 'United States', 'PCI DSS'],
    ['Finance & Banking', 'United States', 'HIPAA'],
    ['Other', 'United States', 'PCI DSS'],
    // So is one for another country.
    ['Healthcare', 'Germany', 'HIPAA'],
    ['Finance & Banking', 'United States', DORA],
    ['Finance & Banking', 'Japan', DORA],
  ])('%s in %s does not keep %s', (industry, country, framework) => {
    expect(kept(industry, country, framework)).toBe(false)
  })

  it('never drops a framework that is not in the config', () => {
    expect(kept('Finance & Banking', 'United States', 'DORA')).toBe(true)
  })

  it('only ever adds: whatever an exact-name match kept is still kept', () => {
    type Cfg = { label: string; industries: string[]; countries: string[] }
    const configs = industryComplianceConfigs as unknown as Cfg[]
    const labels = configs.map((c) => c.label)
    const exactCountry = (c: Cfg, country: string) =>
      country === 'Global' ||
      c.countries.length === 0 ||
      c.countries.includes('Global') ||
      c.countries.includes(country)
    for (const industry of AVAILABLE_INDUSTRIES) {
      for (const country of ['Global', 'United States', 'Germany', 'European Union', 'Japan']) {
        const exactMatch = configs
          .filter(
            (c) =>
              (c.industries.includes(industry) || c.industries.length >= 3) &&
              exactCountry(c, country)
          )
          .map((c) => c.label)
        const now = new Set(filterComplianceRequirements(labels, industry, country))
        expect(
          exactMatch.filter((label) => !now.has(label)),
          `${industry} / ${country}`
        ).toEqual([])
      }
    }
  })
})

describe('both assessment paths use the shared filter', () => {
  const bank: AssessmentInput = {
    ...EXAMPLE_REPORT_SHARE_PAYLOAD,
    complianceRequirements: ['PCI DSS', 'ISO 27001', 'FIPS 140-3'],
  }

  it('computeAssessment keeps PCI DSS for a Finance & Banking estate', () => {
    const frameworks = computeAssessment(bank).complianceImpacts.map((c) => c.framework)
    expect(frameworks).toEqual(expect.arrayContaining(['PCI DSS', 'ISO 27001', 'FIPS 140-3']))
  })

  it('computeAssessmentAsync keeps the same frameworks', async () => {
    const frameworks = (await computeAssessmentAsync(bank)).complianceImpacts.map(
      (c) => c.framework
    )
    expect(frameworks).toEqual(expect.arrayContaining(['PCI DSS', 'ISO 27001', 'FIPS 140-3']))
  })

  it("the app's own example report no longer loses the PCI DSS it selects", () => {
    const frameworks = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD).complianceImpacts.map(
      (c) => c.framework
    )
    expect(frameworks).toContain('PCI DSS')
  })
})

describe('splitComplianceRequirements — what was left out', () => {
  const selected = ['PCI DSS', DORA, 'HIPAA', 'ISO 27001']

  it('names the selected frameworks that do not apply to a US bank', () => {
    const { kept, omitted } = splitComplianceRequirements(
      selected,
      'Finance & Banking',
      'United States'
    )
    expect(kept).toEqual(['PCI DSS', 'ISO 27001'])
    expect(omitted).toEqual([DORA, 'HIPAA'])
  })

  it('keeps DORA for a bank in an EU member country and leaves out only HIPAA', () => {
    const { kept, omitted } = splitComplianceRequirements(selected, 'Finance & Banking', 'Germany')
    expect(kept).toEqual(['PCI DSS', DORA, 'ISO 27001'])
    expect(omitted).toEqual(['HIPAA'])
  })

  it('reports nothing left out when everything applies, and never drops an unknown label', () => {
    const { kept, omitted } = splitComplianceRequirements(
      ['PCI DSS', 'A framework we do not list'],
      'Finance & Banking',
      'United States'
    )
    expect(kept).toEqual(['PCI DSS', 'A framework we do not list'])
    expect(omitted).toEqual([])
  })

  it('kept and omitted together are exactly the selection, and filter returns the kept ones', () => {
    for (const country of ['United States', 'Germany', 'Japan']) {
      const { kept, omitted } = splitComplianceRequirements(selected, 'Healthcare', country)
      expect([...kept, ...omitted].sort()).toEqual([...selected].sort())
      expect(filterComplianceRequirements(selected, 'Healthcare', country)).toEqual(kept)
    }
  })
})

describe('the result carries what was left out', () => {
  const usBank: AssessmentInput = {
    ...EXAMPLE_REPORT_SHARE_PAYLOAD,
    complianceRequirements: ['PCI DSS', DORA, 'ISO 27001'],
  }

  it('computeAssessment lists the omitted frameworks by name', () => {
    expect(computeAssessment(usBank).omittedCompliance).toEqual([DORA])
  })

  it('computeAssessmentAsync lists the same ones', async () => {
    expect((await computeAssessmentAsync(usBank)).omittedCompliance).toEqual([DORA])
  })

  it('has no omittedCompliance field at all when nothing was left out', async () => {
    const all: AssessmentInput = { ...usBank, complianceRequirements: ['PCI DSS', 'ISO 27001'] }
    expect('omittedCompliance' in computeAssessment(all)).toBe(false)
    expect('omittedCompliance' in (await computeAssessmentAsync(all))).toBe(false)
  })
})
