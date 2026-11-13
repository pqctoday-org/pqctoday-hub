// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ROICalculator } from './ROICalculator'
import { copyToClipboard } from '@/utils/clipboard'
vi.mock('@/utils/clipboard', () => ({ copyToClipboard: vi.fn(async () => true) }))
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
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => baseMockData }))
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
  frameworksByIndustry: [],
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

beforeEach(() => {
  vi.mocked(copyToClipboard).mockClear()
  baseMockData.isAssessmentComplete = false
  baseMockData.assessmentResult = null
  baseMockData.totalProducts = 10
  vi.useFakeTimers()
  const { artifacts } = useModuleStore.getState()
  useModuleStore.setState({ artifacts: { ...artifacts, executiveDocuments: [] } })
})
afterEach(() => vi.useRealTimers())
const count = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Systems or products in your scenario/i), {
    target: { value },
  })
const docs = () =>
  (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
    (d) => d.type === 'roi-model'
  )
describe('Actual ROI export and persistence pause for unusable count input', () => {
  it.each(['', '0', '1,2', '-1', 'not a count', '1000001'])(
    'does not export or publish a prior count for %j and resumes on correction',
    (invalid) => {
      const output = vi.fn()
      const view = render(
        <MemoryRouter>
          <ROICalculator onOutput={output} />
        </MemoryRouter>
      )
      count('120')
      fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
      expect(docs().at(-1)?.inputs).toEqual(expect.objectContaining({ productsToMigrate: 120 }))
      expect(docs().at(-1)?.data).toContain('| Capital Expenditure | $9.0M |')
      const saved = docs().length
      output.mockClear()
      count(invalid)
      expect(
        screen.getByText(/Reporting paused while the count is being edited/)
      ).toHaveTextContent('last valid count of 120')
      const actions = within(
        screen.getByRole('group', { name: 'ROI report actions' })
      ).getAllByRole('button')
      expect(actions.length).toBeGreaterThanOrEqual(4)
      for (const button of actions) expect(button).toBeDisabled()
      expect(
        screen.queryByText(/Enter a valid count of systems or products before reporting/)
      ).not.toBeInTheDocument()
      // A different editable assumption used to publish a fresh result with the stale count.
      fireEvent.change(screen.getByLabelText('Capex per Product'), { target: { value: '100000' } })
      act(() => vi.advanceTimersByTime(1000))
      expect(docs()).toHaveLength(saved)
      expect(output).not.toHaveBeenCalled()
      count('130')
      expect(screen.queryByText(/Reporting paused while/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /^Saved/ }))
      expect(docs().at(-1)?.inputs).toEqual(expect.objectContaining({ productsToMigrate: 130 }))
      expect(docs().at(-1)?.data).toContain('| Capital Expenditure | $13.0M |')
      expect(output).toHaveBeenLastCalledWith(expect.objectContaining({ productsToMigrate: 130 }))
      view.unmount()
    }
  )
  it('cancels pending valid-count autosave when the count becomes blank, including navigation flush', () => {
    const view = render(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    count('120')
    count('')
    expect(docs()).toHaveLength(0)
    view.unmount()
    act(() => vi.advanceTimersByTime(1000))
    expect(docs()).toHaveLength(0)
  })
})

const estateAssessment = () =>
  ({
    algorithmMigrations: ['RSA', 'ECDSA', 'ECDH'].map((classical) => ({
      classical,
      quantumVulnerable: true,
    })),
    assessmentProfile: {
      systemScale: '200-plus',
      infrastructure: [],
      vendorDependency: 'mixed',
      migrationStatus: 'not-started',
      teamSize: '11-50',
    },
  }) as unknown as NonNullable<ExecutiveModuleData['assessmentResult']>
const enableAssessment = () => {
  baseMockData.isAssessmentComplete = true
  baseMockData.assessmentResult = estateAssessment()
}

describe('Same fictional estate in actual reports and autosaves', () => {
  it('uses count-selected band boundaries and persists the one-time comparison, including the coarse top band', () => {
    enableAssessment()
    const before = JSON.stringify(baseMockData.assessmentResult)
    const view = render(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    for (const [n, band, cost] of [
      [10, '1–10', '$90K'],
      [11, '11–50', '$117K'],
      [50, '11–50', '$117K'],
      [51, '51–200', '$162K'],
      [200, '51–200', '$162K'],
      [201, '201 or more', '$270K'],
      [1000000, '201 or more', '$270K'],
    ] as const) {
      count(String(n))
      act(() => vi.advanceTimersByTime(900))
      const report = docs().at(-1)!
      expect(report.inputs).toMatchObject({ productsToMigrate: n, productsSource: 'entered' })
      expect(report.data).toContain(
        `same fictional estate of ${n.toLocaleString('en-US')} systems or products`
      )
      expect(report.data).toContain(`Profile scale band: ${band}`)
      expect(report.data).toContain(`| Assessment-derived | ${cost} |`)
      expect(report.data).toContain('One-time migration cost')
      expect(report.data).toContain('not linear per instance')
    }
    expect(screen.getByTestId('roi-estate-assumptions')).toHaveTextContent('including 1,000,000')
    expect(JSON.stringify(baseMockData.assessmentResult)).toBe(before)
    view.unmount()
  })
  it('updates adopted attributes in visible output and actual autosave without using catalogue totals or ongoing costs', () => {
    enableAssessment()
    const view = render(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    count('51')
    act(() => vi.advanceTimersByTime(900))
    expect(docs().at(-1)!.data).toContain('| Assessment-derived | $162K |')
    baseMockData.assessmentResult = {
      ...baseMockData.assessmentResult!,
      assessmentProfile: {
        ...baseMockData.assessmentResult!.assessmentProfile!,
        vendorDependency: 'heavy-vendor',
      },
    }
    view.rerender(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    act(() => vi.advanceTimersByTime(900))
    expect(docs().at(-1)!.data).toContain('| Assessment-derived | $227K |')
    expect(screen.getByTestId('roi-estate-assumptions')).toHaveTextContent('heavy-vendor (1.4×)')
    const report = docs().at(-1)!.data
    baseMockData.totalProducts = 100000
    view.rerender(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    act(() => vi.advanceTimersByTime(900))
    expect(docs().at(-1)!.data).toBe(report)
    fireEvent.change(screen.getByLabelText('Planning Horizon (years)'), { target: { value: '9' } })
    fireEvent.change(screen.getByLabelText('Annual Opex (% of capex)'), { target: { value: '25' } })
    act(() => vi.advanceTimersByTime(900))
    expect(docs().at(-1)!.data).toContain('| Assessment-derived | $227K |')
    expect(docs().at(-1)!.data).toContain('excluding recurring opex and horizon benefits')
    count('0')
    act(() => vi.advanceTimersByTime(900))
    expect(screen.getByTestId('roi-cross-check-waiting')).toHaveTextContent('Not assessed')
    const saved = docs().at(-1)!.data
    baseMockData.assessmentResult = estateAssessment()
    view.rerender(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    act(() => vi.advanceTimersByTime(900))
    expect(docs().at(-1)!.data).toBe(saved)
    view.unmount()
  })
})

it('copies the actual current Markdown export with count and adopted attributes; invalid input cannot copy a stale report', async () => {
  enableAssessment()
  const view = render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )
  count('11')
  const initialCopy = screen.getByRole('button', { name: /^Copy/ })
  await act(async () => {
    initialCopy.click()
  })
  const first = vi.mocked(copyToClipboard).mock.calls.at(-1)![0]
  expect(first).toContain('same fictional estate of 11 systems or products')
  expect(first).toContain('| Assessment-derived | $117K |')
  baseMockData.assessmentResult = {
    ...baseMockData.assessmentResult!,
    assessmentProfile: {
      ...baseMockData.assessmentResult!.assessmentProfile!,
      vendorDependency: 'heavy-vendor',
    },
  }
  view.rerender(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )
  const updatedCopy = screen.getByRole('button', { name: /^Copied|^Copy/ })
  await act(async () => {
    updatedCopy.click()
  })
  const second = vi.mocked(copyToClipboard).mock.calls.at(-1)![0]
  expect(second).toContain('heavy-vendor (1.4×)')
  expect(second).toContain('| Assessment-derived | $164K |')
  expect(second).not.toBe(first)
  const copied = vi.mocked(copyToClipboard).mock.calls.length
  count('')
  expect(screen.getByRole('button', { name: /^Copied|^Copy/ })).toBeDisabled()
  screen.getByRole('button', { name: /^Copied|^Copy/ }).click()
  expect(vi.mocked(copyToClipboard)).toHaveBeenCalledTimes(copied)
  view.unmount()
})
