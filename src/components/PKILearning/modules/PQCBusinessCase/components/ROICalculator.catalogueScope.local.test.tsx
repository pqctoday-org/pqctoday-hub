// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Button } from '@/components/ui/button'
import { ROICalculator } from './ROICalculator'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
const saved = vi.hoisted(() => ({ add: vi.fn() }))
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
  ReferenceLine: () => null,
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <>
      <pre aria-label="ROI export">{exportData}</pre>
      <Button onClick={onExport}>Save sample report</Button>
    </>
  ),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: { addExecutiveDocument: typeof saved.add }) => unknown) =>
    selector({ addExecutiveDocument: saved.add }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => mockData }))
const baseMockData: ExecutiveModuleData = {
  threatsByIndustry: new Map(),
  criticalThreatCount: 0,
  totalThreatCount: 0,
  industryThreats: [],
  vendorsByDomain: new Map(),
  fipsValidatedCount: 0,
  pqcReadyCount: 0,
  vendorReadinessWeighted: 0,
  totalProducts: 10,
  frameworks: [],
  // @ts-expect-error — tests only need length; full ComplianceFramework shape isn't required
  frameworksByIndustry: [{}, {}, {}, {}, {}], // 5 frameworks
  countryDeadlines: [],
  userCountryData: null,
  assessmentResult: null,
  riskScore: null,
  industry: 'Finance & Banking',
  country: 'United States',
  complianceSelections: [],
  preBoostScore: null,
  boosts: [],
  hndlRiskWindow: null,
  tnflRiskWindow: null,
  categoryScores: null,
  categoryDrivers: null,
  migrationEffort: [],
  algorithmMigrations: [],
  keyFindings: [],
  assessmentProfile: null,
  myFrameworks: [],
  myProductIds: [],
  myProducts: [],
  myThreatIds: [],
  myThreats: [],
  myTimelineCountries: [],
  myTimelineCountryData: [],
  vendorReadinessByDomain: new Map(),
  isAssessmentComplete: false,
  migrationDeadlineYear: 2035,
}

let mockData: ExecutiveModuleData
beforeEach(() => {
  mockData = { ...baseMockData }
  saved.add.mockClear()
})
it('preserves catalogue-driven counts but identifies their scope in displayed, exported and saved report', () => {
  render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )
  const slider = screen.getByLabelText(/Products to Migrate/i)
  expect(slider).toHaveAttribute('max', '10')
  fireEvent.change(slider, { target: { value: '5' } })
  const md = screen.getByLabelText('ROI export')
  expect(md).toHaveTextContent('Catalogue products in selected scenario: 5 of 10')
  expect(md).toHaveTextContent('Product counts use the filtered Hub catalogue, not an inventory')
  expect(md).toHaveTextContent(
    'agreement or spread does not establish calibration, accuracy or confidence'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save sample report' }))
  expect(saved.add.mock.lastCall?.[0].inputs.productsToMigrate).toBe(5)
  expect(saved.add.mock.lastCall?.[0].data).toContain(
    'Catalogue products in selected scenario: 5 of 10'
  )
  expect(saved.add.mock.lastCall?.[0].data).toContain('not an inventory of your organisation')
})
it('changing the catalogue changes the existing count ceiling without calling it an organisation estate', () => {
  mockData = { ...baseMockData, totalProducts: 20 }
  render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )
  expect(screen.getByLabelText(/Products to Migrate/i)).toHaveAttribute('max', '20')
  expect(screen.getByLabelText('ROI export')).toHaveTextContent('20 of 20')
  expect(screen.getByLabelText('ROI export')).not.toHaveTextContent('full estate')
  expect(
    screen.getByText(/to generate a separate assessment-derived scenario estimate/)
  ).toBeVisible()
  expect(screen.getByText(/agreement is not calibrated confidence/)).toBeInTheDocument()
})

it('describes close and divergent numerical results without implying matched scope or confidence', () => {
  const assessment = {
    riskScore: 60,
    riskLevel: 'medium',
    algorithmMigrations: [],
    complianceImpacts: [],
    recommendedActions: [],
    narrative: '',
    generatedAt: '',
    assessmentProfile: { infrastructure: ['Hardware', 'Cloud'], systemScale: '51-200' },
  } as unknown as NonNullable<ExecutiveModuleData['assessmentResult']>
  mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
  render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )
  fireEvent.change(screen.getByLabelText(/Capex per Product/i), { target: { value: '25000' } })
  expect(screen.getByText('Within sample comparison band.')).toBeInTheDocument()
  expect(screen.getByLabelText('ROI export')).toHaveTextContent('Within sample comparison band')
  expect(screen.getByLabelText('ROI export')).toHaveTextContent('scope not reconciled')
  fireEvent.change(screen.getByLabelText(/Capex per Product/i), { target: { value: '200000' } })
  expect(screen.getByText('Outside sample comparison band.')).toBeInTheDocument()
  expect(screen.getByLabelText('ROI export')).not.toHaveTextContent('independent second estimate')
  expect(screen.getByText(/Agreement is not calibration/)).toBeInTheDocument()
})

it('describes an actual returned floor without diagnosing profile completeness or universal model reliability', () => {
  const assessment = { algorithmMigrations: [], assessmentProfile: {} } as unknown as NonNullable<
    ExecutiveModuleData['assessmentResult']
  >
  mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
  render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )
  expect(
    screen.getByText(/The assessment-derived calculation returned the sample cost floor/, {
      selector: 'p',
    })
  ).toHaveTextContent('does not establish whether the profile is incomplete')
  expect(screen.getByLabelText('ROI export')).toHaveTextContent('returned the sample cost floor')
  expect(screen.getByLabelText('ROI export')).not.toHaveTextContent('profile too thin')
  expect(screen.queryByText(/No single method is reliable/)).not.toBeInTheDocument()
  expect(screen.getByText(/Results depend on scope and assumptions/)).toBeInTheDocument()
})
