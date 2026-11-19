// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { CLASSIFY_CARDS, COVERAGE_GRID, ORGANIZATIONS, ORG_TYPE_LABELS } from './data'
import ragSummary from './rag-summary.md?raw'

describe('Standards Bodies: ENISA role classification', () => {
  it('classifies ENISA as a governmental agency rather than a regulator or certification body', () => {
    const enisa = ORGANIZATIONS.find((organization) => organization.id === 'enisa')!
    const card = CLASSIFY_CARDS.find((entry) => entry.id === 'enisa')!
    expect(enisa.type).toBe('governmental-agency')
    expect(card.correctType).toBe('governmental-agency')
    expect(card.hint).toContain('not the certifying body')
    expect(ORG_TYPE_LABELS['governmental-agency']).toBe('Government Agency')
    expect(ORG_TYPE_LABELS['regulatory-agency']).toBe('Regulatory Agency')
  })

  it('places ENISA in the EU governmental-agency coverage category and aligns retrieval text', () => {
    expect(COVERAGE_GRID.eu['governmental-agency'].orgs).toContain('ENISA')
    expect(COVERAGE_GRID.eu['regulatory-agency'].orgs).not.toContain('ENISA')
    expect(COVERAGE_GRID.eu['certification-body'].orgs).not.toContain('ENISA (publishes)')
    expect(ragSummary).toContain('not an EUCC regulator or certification body')
    expect(ragSummary).toContain('not automatically a regulator or certification body')
  })

  it('classifies CCRA as a recognition arrangement rather than a certification body', () => {
    const ccra = ORGANIZATIONS.find((organization) => organization.id === 'common-criteria')!
    const card = CLASSIFY_CARDS.find((entry) => entry.id === 'common-criteria')!
    expect(ccra.type).toBe('mutual-recognition-arrangement')
    expect(ccra.founded).toBe('1998')
    expect(ccra.mission).toContain('does not evaluate products or issue product certificates')
    expect(card.correctType).toBe('mutual-recognition-arrangement')
    expect(COVERAGE_GRID.global['mutual-recognition-arrangement'].orgs).toContain('CCRA')
    expect(COVERAGE_GRID.global['certification-body'].orgs).not.toContain('CCRA')
    expect(ragSummary).toContain('It does not evaluate products or issue product certificates')
  })
})
