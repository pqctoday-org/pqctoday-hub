// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CostOfInactionAnalyzer } from './CostOfInactionAnalyzer'
import { DELAY_COST_PROFILES } from '../data/businessCaseScenarios'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { BreachOutput, InactionOutput } from '../types'

vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({
    title,
    children,
    formats,
  }: {
    title: string
    children: React.ReactNode
    formats?: string[]
  }) => (
    <div data-testid="exportable" data-formats={(formats ?? []).join(',')}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
}))

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (
    selector: (s: {
      addExecutiveDocument: () => void
      artifacts: { executiveDocuments: never[] }
    }) => unknown
  ) => selector({ addExecutiveDocument: vi.fn(), artifacts: { executiveDocuments: [] } }),
}))

const baseMockData: ExecutiveModuleData = {
  threatsByIndustry: new Map(),
  criticalThreatCount: 0,
  totalThreatCount: 0,
  industryThreats: [],
  vendorsByDomain: new Map(),
  vendorsByLayer: new Map(),
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
  vendorReadinessByLayer: new Map(),
  isAssessmentComplete: false,
  migrationDeadlineYear: 2035,
}

let mockData: ExecutiveModuleData = baseMockData

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => mockData,
}))

const chainedBreachOutput: BreachOutput = {
  industry: 'Finance & Banking',
  classicalCostUSD: 5_560_000,
  quantumCostUSD: 8_000_000,
  deltaUSD: 2_440_000,
  pCrqc: 0.2,
  quantumALEUSD: 1_200_000,
  latestSafeStartYear: 2029,
  alreadyLate: false,
  dataSensitivityClass: 'payment-card',
  yearsOfData: 4,
  hndlFactorPct: 25,
  annualBreachProbPct: 15,
}

describe('CostOfInactionAnalyzer', () => {
  beforeEach(() => {
    mockData = { ...baseMockData }
  })

  it('renders the four controls and the three headline metrics', () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getByText('Industry')).toBeInTheDocument()
    expect(screen.getByLabelText(/Migration delay/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Annual breach probability/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Migration takes/i)).toBeInTheDocument()
    // "Migrate Now" and "Cost of Inaction" each legitimately appear more than
    // once (headline card, table header, export title) — assert on each
    // card's unique caption instead of the ambiguous headline text.
    expect(screen.getByText(/Migration \+ residual HNDL exposure/i)).toBeInTheDocument()
    expect(screen.getByText(/Accumulated exposure \+ delay premium/i)).toBeInTheDocument()
    expect(screen.getByText(/Extra cost from delaying/i)).toBeInTheDocument()
  })

  it("renders Mosca's inequality and the crossover-year panels", () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getAllByText(/Mosca's inequality/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Crossover year/i)).toBeInTheDocument()
  })

  it('shows no chained-source chip when the Breach Simulator has not run', () => {
    render(<CostOfInactionAnalyzer />)
    // The methodology panel always references the Breach Scenario Simulator by
    // name (it shares the same Mosca rule); only the chained-source chip itself
    // is conditional on breachOutput being present.
    expect(
      screen.queryByText(/carried over from the Breach Scenario Simulator/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/ran for .* not/i)).not.toBeInTheDocument()
  })

  it('honors chained Breach Simulator inputs when the industry matches', () => {
    render(<CostOfInactionAnalyzer breachOutput={chainedBreachOutput} />)
    expect(
      screen.getAllByText(/carried over from the Breach Scenario Simulator/i).length
    ).toBeGreaterThan(0)
  })

  it('falls back to the industry baseline and flags a mismatch when industries differ', () => {
    mockData = { ...baseMockData, industry: 'Healthcare' }
    render(
      <CostOfInactionAnalyzer
        breachOutput={{ ...chainedBreachOutput, industry: 'Finance & Banking' }}
      />
    )
    expect(screen.getByText(/ran for Finance & Banking, not Healthcare/i)).toBeInTheDocument()
  })

  it('calls onOutput with the full contract, including Mosca and crossover fields', () => {
    const onOutput = vi.fn<(output: InactionOutput) => void>()
    render(<CostOfInactionAnalyzer onOutput={onOutput} />)
    expect(onOutput).toHaveBeenCalled()
    const lastCall = onOutput.mock.calls[onOutput.mock.calls.length - 1][0]
    expect(typeof lastCall.costOfInactionUSD).toBe('number')
    expect(typeof lastCall.delayYears).toBe('number')
    expect(typeof lastCall.latestSafeStartYear).toBe('number')
    expect(typeof lastCall.alreadyLate).toBe('boolean')
    expect(lastCall.crossoverYear === null || typeof lastCall.crossoverYear === 'number').toBe(true)
  })

  it('updates the cost-of-inaction figure when the delay slider changes', () => {
    const onOutput = vi.fn<(output: InactionOutput) => void>()
    render(<CostOfInactionAnalyzer onOutput={onOutput} />)
    const before = onOutput.mock.calls[onOutput.mock.calls.length - 1][0].costOfInactionUSD

    fireEvent.change(screen.getByLabelText(/Migration delay/i), { target: { value: '7' } })

    const after = onOutput.mock.calls[onOutput.mock.calls.length - 1][0].costOfInactionUSD
    expect(after).not.toBe(before)
  })

  it('offers markdown, PDF, and DOCX export formats', () => {
    render(<CostOfInactionAnalyzer />)
    const exportable = screen.getByTestId('exportable')
    expect(exportable.dataset.formats).toBe('markdown,pdf,docx')
  })

  it('shows the methodology section', () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getByText(/How this is calculated/i)).toBeInTheDocument()
  })

  it('renders without crashing for every industry profile, including the newly added ones', () => {
    for (const p of DELAY_COST_PROFILES) {
      mockData = { ...baseMockData, industry: p.industry }
      const { unmount } = render(<CostOfInactionAnalyzer />)
      expect(screen.getByText(/Extra cost from delaying/i)).toBeInTheDocument()
      unmount()
    }
  })
})
