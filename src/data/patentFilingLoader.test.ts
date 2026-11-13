// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import corpus from './archive/patents_09222026.csv?raw'
import type { PatentItem } from '@/types/PatentTypes'
vi.mock('./csvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./csvUtils')>()
  return {
    ...actual,
    loadLatestCSV: (
      _modules: unknown,
      _pattern: unknown,
      transform: (row: Record<string, string>) => PatentItem | null
    ) => {
      const base = Papa.parse<Record<string, string>>(corpus, { header: true }).data.find(
        (r) => r.status !== 'deprecated'
      )!
      const rows = [
        {
          ...base,
          patent_number: '12074985',
          assignee: 'BlackBerry',
          filing_jurisdiction: 'US',
          filing_jurisdiction_application: '18/466336',
          filing_jurisdiction_source_url: 'https://patents.google.com/patent/US12074985B2/en',
        },
        {
          ...base,
          patent_number: '999',
          assignee: 'Entrust Canada',
          filing_jurisdiction: '',
          filing_jurisdiction_application: '',
          filing_jurisdiction_source_url: '',
        },
      ]
      return { data: rows.map(transform).filter(Boolean), metadata: {} }
    },
  }
})
import { patentsData } from './patentsData'
import { filingJurisdictionLabel, filterPatents } from './patentFilters'
it('maps the sourced columns through the actual transform before filtering; display prefixes supply no office', () => {
  expect(patentsData[0]).toMatchObject({
    patentNumber: 'US12074985',
    filingJurisdiction: 'US',
    filingJurisdictionApplication: '18/466336',
    filingJurisdictionSourceUrl: 'https://patents.google.com/patent/US12074985B2/en',
  })
  expect(filingJurisdictionLabel(patentsData[1])).toBe('Unassigned')
  expect(
    filterPatents(patentsData, new URLSearchParams({ region: 'United States (US)' })).map(
      (p) => p.patentNumber
    )
  ).toEqual(['US12074985'])
})
