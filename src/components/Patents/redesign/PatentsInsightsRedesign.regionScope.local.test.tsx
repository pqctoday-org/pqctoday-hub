// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

it('preserves a misleading Canada-name bucket but exposes it as a heuristic and preserves filter action', () => {
  const filter = vi.fn()
  render(
    <PatentsInsightsRedesign
      patents={[
        { ...basePatent, assignee: 'Entrust Canada' },
        { ...basePatent, patentNumber: 'US11000002', assignee: 'BlackBerry' },
      ]}
      onFilter={filter}
    />
  )
  expect(screen.getByRole('region', { name: 'Assignee-name heuristic groups' })).toBeVisible()
  expect(screen.getByText(/Region groups are inferred from assignee names/)).toHaveTextContent(
    'not verified headquarters, nationality or filing jurisdiction'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Europe: 2' }))
  expect(filter).toHaveBeenCalledWith({ region: 'Europe' })
  expect(screen.queryByRole('region', { name: 'Patents by region' })).not.toBeInTheDocument()
})
