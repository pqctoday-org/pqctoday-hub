// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { filingJurisdictionLabel, filterPatents } from './patentFilters'
import { patentsData } from './patentsData'

const bound = (office: string) => ({
  ...patentsData[0],
  filingJurisdiction: office,
  filingJurisdictionApplication: '18/466336',
  filingJurisdictionSourceUrl: 'https://patents.google.com/patent/US12074985B2/en',
})
describe('publication filing office', () => {
  it('does not use Canadian assignees, family countries or US display prefixes as evidence', () => {
    for (const assignee of ['Entrust Canada', 'BlackBerry', '01 Communique']) {
      const sourced = { ...bound('US'), assignee }
      expect(filingJurisdictionLabel(sourced)).toBe('United States (US)')
      const missing = { ...bound(''), assignee }
      expect(filingJurisdictionLabel(missing)).toBe('Unassigned')
    }
    expect(filingJurisdictionLabel({ ...bound('US'), filingJurisdictionApplication: '' })).toBe(
      'Unassigned'
    )
    expect(filingJurisdictionLabel({ ...bound('US'), filingJurisdictionSourceUrl: '' })).toBe(
      'Unassigned'
    )
  })
  it('keeps regional and international offices distinct from countries and family coverage', () => {
    expect(filingJurisdictionLabel(bound('EP'))).toBe('European Patent Office (EP)')
    expect(filingJurisdictionLabel(bound('WO'))).toBe('PCT international publication (WO)')
    const population = ['US', 'CA', 'EP', 'WO', ''].map(bound)
    const selected = population.flatMap((p) =>
      filterPatents(population, new URLSearchParams({ region: filingJurisdictionLabel(p) }))
    )
    expect(selected).toEqual(population)
    expect(filterPatents(population, new URLSearchParams({ region: 'Europe' }))).toEqual([])
  })
  it('does not manufacture jurisdiction when loading the old generation without sourced columns', () => {
    expect(patentsData.length).toBeGreaterThan(0)
    for (const p of patentsData) {
      if (
        !p.filingJurisdiction ||
        !p.filingJurisdictionApplication ||
        !p.filingJurisdictionSourceUrl
      ) {
        expect(filingJurisdictionLabel(p)).toBe('Unassigned')
      }
    }
  })
})
