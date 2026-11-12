// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Button } from '@/components/ui/button'
import { ROICalculator } from './ROICalculator'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

const saved = vi.hoisted(() => ({
  add: vi.fn(),
  inputs: undefined as Record<string, unknown> | undefined,
}))
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
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => saved.inputs }))
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

let mockData: ExecutiveModuleData
beforeEach(() => {
  mockData = { ...baseMockData }
  saved.add.mockClear()
  saved.inputs = undefined
})

const renderCalc = () =>
  render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )

const countField = () => screen.getByLabelText(/Systems or products in your scenario/i)
const enterCount = (value: string) => fireEvent.change(countField(), { target: { value } })
const exportText = () => screen.getByLabelText('ROI export').textContent ?? ''

describe('the learner enters their own count of systems or products', () => {
  it('capex follows the learner count, not the catalogue size', () => {
    mockData = { ...baseMockData, totalProducts: 10 }
    const view = renderCalc()
    enterCount('120')
    expect(exportText()).toContain('Systems or products in scenario (your count): 120')
    expect(exportText()).toContain('| Capital Expenditure | $9.0M |') // 120 x $75K
    view.unmount()

    mockData = { ...baseMockData, totalProducts: 500 }
    renderCalc()
    enterCount('120')
    expect(exportText()).toContain('Systems or products in scenario (your count): 120')
    expect(exportText()).toContain('| Capital Expenditure | $9.0M |')
  })

  it('adding catalogue products changes neither the scenario cost nor the limit of the field', () => {
    mockData = { ...baseMockData, totalProducts: 10 }
    const view = renderCalc()
    const before = exportText()
    expect(countField()).not.toHaveAttribute('max')
    view.unmount()

    mockData = { ...baseMockData, totalProducts: 2000 }
    renderCalc()
    expect(exportText()).toBe(before)
    expect(countField()).not.toHaveAttribute('max')
    // The count stays a number the learner can raise above the catalogue size.
    enterCount('2500')
    expect(exportText()).toContain('Systems or products in scenario (your count): 2,500')
  })

  it('opens with an editable example of 50 that is labelled as an example', () => {
    mockData = { ...baseMockData, totalProducts: 10 }
    renderCalc()
    expect(countField()).toHaveValue('50')
    expect(screen.getByText('Example: change to your own count')).toBeVisible()
    expect(exportText()).toContain('Systems or products in scenario (your count): 50')
    expect(exportText()).toContain('example value, not your count')
    expect(exportText()).toContain('Replace it with your own count')
  })

  it('drops the example tag once the learner types a count, and the export says so', () => {
    renderCalc()
    enterCount('75')
    expect(screen.queryByText('Example: change to your own count')).not.toBeInTheDocument()
    expect(exportText()).toContain('(your count): 75 (entered by you)')
    expect(exportText()).toContain(
      'The count of systems or products is the figure you entered; it is not taken from the Hub catalogue.'
    )
  })

  it('labels the field, names its unit under it and does not limit it by the catalogue', () => {
    renderCalc()
    const field = countField()
    expect(field).toHaveAttribute('inputmode', 'numeric')
    const help = document.getElementById('roi-products-help')!
    expect(field.getAttribute('aria-describedby')).toContain('roi-products-help')
    expect(help).toHaveTextContent('Count of product or system instances you plan to migrate')
    expect(help).toHaveTextContent('This is not the Hub catalogue')
    expect(screen.queryByText(/Products to Migrate/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ of 10\b/)).not.toBeInTheDocument()
  })

  it.each([
    ['blank', ''],
    ['zero', '0'],
    ['negative', '-4'],
    ['not a number', 'abc'],
    ['a decimal', '12.5'],
    ['above the limit', '1000001'],
  ])('a %s entry shows a message, keeps the last valid count and makes no comparison', (_, bad) => {
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
    renderCalc()
    enterCount('120')
    expect(countField()).not.toHaveAttribute('aria-invalid')
    expect(screen.getByText('Per-product model (your count)')).toBeInTheDocument()

    enterCount(bad)
    expect(countField()).toHaveAttribute('aria-invalid', 'true')
    const message = document.getElementById('roi-products-message')!
    expect(message).toHaveAttribute('role', 'status')
    expect(message).toHaveAttribute('aria-live', 'polite')
    expect(message).toHaveTextContent('The figures on this page still use 120.')
    expect(message).not.toHaveTextContent('below')
    expect(exportText()).toContain('ROI report unavailable')
    expect(exportText()).not.toContain('Systems or products in scenario (your count): 120')
    expect(exportText()).not.toContain('| Capital Expenditure |')
    expect(screen.getByRole('button', { name: 'Save sample report' })).toBeDisabled()
    expect(screen.getByText(/Reporting paused while the count is being edited/)).toHaveTextContent(
      'last valid count of 120'
    )
    expect(screen.queryByText('Per-product model (your count)')).not.toBeInTheDocument()
    expect(screen.getByTestId('roi-cross-check-waiting')).toHaveTextContent('Not assessed')

    enterCount('130') // a valid entry clears the message and the comparison returns
    expect(countField()).not.toHaveAttribute('aria-invalid')
    expect(document.getElementById('roi-products-message')).toBeEmptyDOMElement()
    expect(screen.getByText('Per-product model (your count)')).toBeInTheDocument()
  })

  it('does not announce a half-typed number with commas while the field has focus, and says why after it loses focus', () => {
    renderCalc()
    const field = countField()
    const message = () => document.getElementById('roi-products-message')!
    fireEvent.focus(field)
    // Typing 1,200 passes through "1," "1,2" and "1,20", none of which is a mistake yet.
    for (const partial of ['1,', '1,2', '1,20']) {
      enterCount(partial)
      expect(message()).toBeEmptyDOMElement()
      expect(field).not.toHaveAttribute('aria-invalid')
    }
    enterCount('1,200')
    expect(message()).toBeEmptyDOMElement()
    expect(exportText()).toContain('(your count): 1,200')

    // Leaving the field with a half-typed number explains the real cause, the comma.
    enterCount('1,2')
    fireEvent.blur(field)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(message()).toHaveTextContent('Commas are fine')
    // Back in the field, finishing the number clears it.
    fireEvent.focus(field)
    enterCount('1,200')
    expect(field).not.toHaveAttribute('aria-invalid')
    expect(message()).toBeEmptyDOMElement()
  })

  it('does not announce a cleared field while it has focus, only after it loses focus', () => {
    renderCalc()
    const field = countField()
    fireEvent.focus(field)
    enterCount('')
    expect(document.getElementById('roi-products-message')).toBeEmptyDOMElement()
    expect(field).not.toHaveAttribute('aria-invalid')
    fireEvent.blur(field)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(document.getElementById('roi-products-message')).toHaveTextContent(
      'Enter the number of systems or products in your scenario'
    )
  })

  it('announces a mistake that typing cannot fix, such as letters, at once even with focus', () => {
    renderCalc()
    const field = countField()
    fireEvent.focus(field)
    enterCount('12a')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(document.getElementById('roi-products-message')).toHaveTextContent('Commas are fine')
  })

  it('accepts thousands separators and the largest count of 1,000,000', () => {
    renderCalc()
    enterCount('1,200')
    expect(exportText()).toContain('(your count): 1,200')
    enterCount('1000000')
    expect(countField()).not.toHaveAttribute('aria-invalid')
    expect(exportText()).toContain('(your count): 1,000,000')
  })

  it('says the comparison is not assessed while the example count is in place', () => {
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
    renderCalc()
    expect(screen.getByTestId('roi-cross-check-waiting')).toHaveTextContent(
      'Not assessed until you enter your own count.'
    )
    expect(screen.queryByText('Within sample comparison band.')).not.toBeInTheDocument()
    expect(screen.queryByText('Outside sample comparison band.')).not.toBeInTheDocument()
    expect(exportText()).toContain('Not assessed until you enter your own count')
    expect(exportText()).not.toContain('Per-product model')
  })

  it('reads the comparison from the learner count once it is entered', () => {
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
    renderCalc()
    enterCount('8')
    const card = screen.getByText('Per-product model (your count)').parentElement!
    expect(card).toHaveTextContent('$600K') // 8 x $75K
    expect(card).toHaveTextContent('8 systems or products')
    expect(screen.queryByTestId('roi-cross-check-waiting')).not.toBeInTheDocument()
    expect(exportText()).toContain('| Per-product model (your count) | $600K |')
  })

  it('restores an old saved model without the marker with its count labelled, not as an inventory', () => {
    saved.inputs = { productsToMigrate: 10, costPerProduct: 75_000 } // saved before the count was the learner's
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
    renderCalc()
    expect(countField()).toHaveValue('10')
    expect(
      screen.getByText(
        'Count from your saved model; it was set against the Hub catalogue, not your inventory. Confirm or change it.'
      )
    ).toBeVisible()
    expect(exportText()).toContain('restored from your saved model, not confirmed')
    expect(screen.getByTestId('roi-cross-check-waiting')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use 10 as my count' }))
    expect(screen.queryByText(/Count from your saved model/)).not.toBeInTheDocument()
    expect(exportText()).toContain('(your count): 10 (entered by you)')
    expect(screen.getByText('Per-product model (your count)')).toBeInTheDocument()
  })

  it('confirming a restored count puts that count back in the field, replacing unusable text', () => {
    saved.inputs = { productsToMigrate: 10, costPerProduct: 75_000 }
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
    renderCalc()
    enterCount('abc')
    expect(countField()).toHaveAttribute('aria-invalid', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Use 10 as my count' }))
    expect(countField()).toHaveValue('10')
    expect(countField()).not.toHaveAttribute('aria-invalid')
    expect(document.getElementById('roi-products-message')).toBeEmptyDOMElement()
    // The capex line, the field and the comparison now agree.
    expect(exportText()).toContain('(your count): 10 (entered by you)')
    expect(screen.getByText('Per-product model (your count)')).toBeInTheDocument()
  })

  it('restores a model saved with the marker as the learner count', () => {
    saved.inputs = { productsToMigrate: 300, productsSource: 'entered' }
    renderCalc()
    expect(countField()).toHaveValue('300')
    expect(screen.queryByText(/Count from your saved model/)).not.toBeInTheDocument()
    expect(exportText()).toContain('(your count): 300 (entered by you)')
  })

  it('falls back to the example when a saved model holds an unusable count', () => {
    saved.inputs = { productsToMigrate: 0 }
    renderCalc()
    expect(countField()).toHaveValue('50')
    expect(screen.getByText('Example: change to your own count')).toBeVisible()
  })

  it('the export and the saved report carry the count, its unit and its source, with no catalogue total', () => {
    renderCalc()
    enterCount('120')
    const md = screen.getByLabelText('ROI export')
    expect(md).toHaveTextContent(
      'Systems or products in scenario (your count): 120 (entered by you)'
    )
    expect(md).toHaveTextContent('it is not taken from the Hub catalogue')
    expect(md).toHaveTextContent(
      'agreement or spread does not establish calibration, accuracy or confidence'
    )
    expect(md).not.toHaveTextContent('Catalogue products in selected scenario')
    expect(md).not.toHaveTextContent('catalogue-count scenario')
    fireEvent.click(screen.getByRole('button', { name: 'Save sample report' }))
    const doc = saved.add.mock.lastCall?.[0]
    expect(doc.inputs.productsToMigrate).toBe(120)
    expect(doc.inputs.productsSource).toBe('entered')
    expect(doc.output.productsToMigrate).toBe(120)
    expect(doc.output.productsSource).toBe('entered')
    expect(doc.data).toContain('Systems or products in scenario (your count): 120')
    expect(doc.data).not.toContain('Catalogue products in selected scenario')
  })

  it('does not list products from /migrate as a source of the count', () => {
    mockData = {
      ...baseMockData,
      industry: 'Finance & Banking',
      // @ts-expect-error — only the length is read by the banner
      myProducts: [{}, {}, {}],
    }
    renderCalc()
    expect(screen.queryByText(/products? from \/migrate/)).not.toBeInTheDocument()
  })

  it('"Clear all" on the restored-model banner returns the count to the example', () => {
    saved.inputs = { productsToMigrate: 300, productsSource: 'entered' }
    renderCalc()
    const banner = screen
      .getByText(/Restored your last saved ROI assumptions/)
      .closest('[role="status"]')!
    fireEvent.click(within(banner as HTMLElement).getByRole('button', { name: 'Clear all' }))
    expect(countField()).toHaveValue('50')
    expect(screen.getByText('Example: change to your own count')).toBeVisible()
  })
})

describe('the comparison wording', () => {
  it('describes close and divergent numerical results without implying matched scope or confidence', () => {
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: assessment }
    renderCalc()
    enterCount('10')
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
    const floorAssessment = {
      algorithmMigrations: [],
      assessmentProfile: {},
    } as unknown as NonNullable<ExecutiveModuleData['assessmentResult']>
    mockData = { ...baseMockData, isAssessmentComplete: true, assessmentResult: floorAssessment }
    renderCalc()
    enterCount('10')
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

  it('still invites the assessment when none is complete, whatever the count', () => {
    renderCalc()
    expect(
      screen.getByText(/to generate a separate assessment-derived scenario estimate/)
    ).toBeVisible()
    expect(screen.getByText(/agreement is not calibrated confidence/)).toBeInTheDocument()
  })
})
