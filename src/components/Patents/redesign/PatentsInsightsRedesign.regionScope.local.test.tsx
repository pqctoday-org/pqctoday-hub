// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PatentDetail } from '../PatentDetail'
import { Button } from '@/components/ui/button'
import { PatentsInsightsRedesign } from './PatentsInsightsRedesign'
import type { PatentItem } from '@/types/PatentTypes'
vi.mock('@/components/Patents/PatentsFilingYearChart', () => ({
  PatentsFilingYearChart: () => null,
}))
vi.mock('@/components/Patents/PatentsInsights', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/Patents/PatentsInsights')>()
  return {
    ...actual,
    BarChart: () => null,
    DonutChart: () => null,
    PieCard: ({
      title,
      data,
      onFilter,
    }: {
      title: string
      data: { label: string; value: number }[]
      onFilter?: (label: string) => void
    }) => (
      <section aria-label={title}>
        {data.map((row) => (
          <Button key={row.label} onClick={() => onFilter?.(row.label)}>
            {row.label}: {row.value}
          </Button>
        ))}
      </section>
    ),
  }
})
const basePatent: PatentItem = {
  patentNumber: 'US11000001',
  title: 'Lattice-Based Key Encapsulation Method',
  inventors: 'Test Inventor',
  assignee: 'TestCo',
  priorityDate: '2020-01-01',
  issueDate: '2022-06-01',
  filingDate: '2020-01-01',
  cpcCodes: '',
  summary: 'A sample summary.',
  primaryInventiveClaim: 'A sample claim.',
  cryptoAgilityMode: 'hybrid',
  migrationStrategy: 'hybrid',
  quantumRelevance: 'core_invention',
  quantumSafeBasis: 'pqc_algorithm',
  quantumNotes: '',
  protocols: [],
  classicalAlgorithms: [],
  pqcAlgorithms: [],
  quantumTechnology: [],
  keyManagementOps: [],
  hardwareComponents: [],
  authenticationFactors: [],
  standardsReferenced: [],
  threatModel: [],
  entropySource: [],
  primitiveTypes: [],
  applicationDomain: [],
  independentClaimSubjects: [],
  performanceClaims: [],
  dataTypesProtected: [],
  complianceTargets: [],
  citationGraph: [],
  claimDependencies: [],
  nistRoundStatus: [],
  pqcMigrationScore: 5,
  pqcMigrationReason: '',
  impactScore: 50,
  impactLevel: 'Medium',
  priorityYear: 2020,
  filingYear: 2020,
}

it('counts sourced filing offices and drills into exactly the same record population', () => {
  const filter = vi.fn()
  render(
    <PatentsInsightsRedesign
      patents={[
        {
          ...basePatent,
          assignee: 'Entrust Canada',
          filingJurisdiction: 'US',
          filingJurisdictionApplication: '18/073159',
          filingJurisdictionSourceUrl: 'https://patents.google.com/patent/US12407526B2/en',
        },
        {
          ...basePatent,
          patentNumber: 'US12074985',
          assignee: 'BlackBerry',
          filingJurisdiction: 'US',
          filingJurisdictionApplication: '18/466336',
          filingJurisdictionSourceUrl: 'https://patents.google.com/patent/US12074985B2/en',
        },
        { ...basePatent, patentNumber: 'US3', assignee: '01 Communique' },
      ]}
      onFilter={filter}
    />
  )
  expect(screen.getByRole('region', { name: 'Records by filing office' })).toBeVisible()
  expect(screen.getByText(/Chart and filters count the same displayed records/)).toHaveTextContent(
    'They do not count every family filing, assignee headquarters or grant status'
  )
  fireEvent.click(screen.getByRole('button', { name: 'United States (US): 2' }))
  expect(filter).toHaveBeenCalledWith({ region: 'United States (US)' })
  expect(screen.getByRole('button', { name: 'Unassigned: 1' })).toBeVisible()
  expect(screen.queryByRole('button', { name: /Europe:/ })).not.toBeInTheDocument()
})

it('shows the sourced application and bibliography in the shared desktop/phone detail', () => {
  render(
    <MemoryRouter>
      <PatentDetail
        patent={{
          ...basePatent,
          assignee: 'BlackBerry Limited',
          patentNumber: 'US12074985',
          filingJurisdiction: 'US',
          filingJurisdictionApplication: '18/466336',
          filingJurisdictionSourceUrl:
            'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12074985',
        }}
        inCorpusIds={new Set(['US12074985'])}
        onClose={() => {}}
        onNavigate={() => {}}
      />
    </MemoryRouter>
  )
  expect(screen.getByText(/Filing office:/)).toHaveTextContent(
    'United States (US) · Application 18/466336'
  )
  expect(screen.getByRole('link', { name: 'Bibliographic source' })).toHaveAttribute(
    'href',
    'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12074985'
  )
})
