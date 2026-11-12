// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ROICalculator } from './ROICalculator'
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
