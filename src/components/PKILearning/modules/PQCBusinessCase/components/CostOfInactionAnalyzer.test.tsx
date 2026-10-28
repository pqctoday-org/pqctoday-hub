// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CostOfInactionAnalyzer } from './CostOfInactionAnalyzer'
import { DELAY_COST_PROFILES } from '../data/businessCaseScenarios'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { BreachOutput, InactionOutput } from '../types'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({
    title,
    children,
    formats,
    exportData,
  }: {
    title: string
    children: React.ReactNode
    formats?: string[]
    exportData?: string
  }) => (
    <div data-testid="exportable" data-formats={(formats ?? []).join(',')}>
      <h3>{title}</h3>
      {children}
      <pre data-testid="export-data">{exportData}</pre>
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
    usePersonaStore.setState({ selectedPersona: null })
  })

  it('renders the editable scenario controls and the three headline metrics', () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getByText('Industry')).toBeInTheDocument()
    expect(screen.getByLabelText(/Migration delay/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Annual breach probability/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Migration takes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Migration cost/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Discount rate/i)).toBeInTheDocument()
    // "Migrate Now" and "Cost of Inaction" each legitimately appear more than
    // once (headline card, table header, export title) — assert on each
    // card's unique caption instead of the ambiguous headline text.
    expect(screen.getByText(/Migration \+ residual HNDL exposure/i)).toBeInTheDocument()
    expect(screen.getByText(/Accumulated exposure \+ delay premium/i)).toBeInTheDocument()
    expect(screen.getByText(/Delay scenario minus migrate-now scenario/i)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Scenario assumptions/i })).toBeInTheDocument()
  })

  it("renders Mosca's inequality and the crossover-year panels", () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getAllByText(/Mosca's inequality/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Crossover year/i).length).toBeGreaterThan(0)
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
    expect(lastCall.scenario?.modelVersion).toBe('coi-2')
    expect(lastCall.scenario?.verifiedConsequence.annualUSD).toBe(0)
    expect(lastCall.scenario?.sourceStatus.breachBaseline).toMatch(/one edition behind/i)
  })

  it('does not infer a dollar penalty from framework matches', () => {
    const onOutput = vi.fn<(output: InactionOutput) => void>()
    render(<CostOfInactionAnalyzer onOutput={onOutput} />)
    const lastCall = onOutput.mock.calls.at(-1)?.[0]
    expect(lastCall?.scenario?.verifiedConsequence.annualUSD).toBe(0)
    expect(screen.getByText(/\$0 by default/i)).toBeInTheDocument()
  })

  it('uses an explicitly entered verified consequence and records its source', () => {
    const onOutput = vi.fn<(output: InactionOutput) => void>()
    render(<CostOfInactionAnalyzer onOutput={onOutput} />)
    fireEvent.change(screen.getByLabelText(/Verified annual consequence/i), {
      target: { value: '1000000' },
    })
    fireEvent.change(screen.getByLabelText(/Verified consequence source or owner/i), {
      target: { value: 'Legal memo 2026-10-01' },
    })
    const lastCall = onOutput.mock.calls.at(-1)?.[0]
    expect(lastCall?.scenario?.verifiedConsequence.annualUSD).toBe(1_000_000)
    expect(lastCall?.scenario?.verifiedConsequence.sourceNote).toBe('Legal memo 2026-10-01')
  })

  it('shows an executive decision brief only for the executive runtime role', () => {
    const { rerender } = render(<CostOfInactionAnalyzer />)
    expect(screen.queryByRole('region', { name: /Executive decision brief/i })).toBeNull()
    act(() => usePersonaStore.setState({ selectedPersona: 'executive' }))
    rerender(<CostOfInactionAnalyzer />)
    expect(screen.getByRole('region', { name: /Executive decision brief/i })).toBeInTheDocument()
    expect(screen.getByText(/Before using this result/i)).toBeInTheDocument()
  })

  it('surfaces the stale baseline and CRQC scenario uncertainty beside the result', () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getAllByText(/one edition behind/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/CRQC scenario range/i)).toBeInTheDocument()
    expect(screen.getByText(/not a confidence interval/i)).toBeInTheDocument()
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
    const exported = screen.getByTestId('export-data').textContent ?? ''
    expect(exported).toMatch(/Reproducible scenario inputs \(model coi-2\)/i)
    expect(exported).toMatch(/No framework-derived fine is included automatically/i)
    expect(exported).toMatch(/one edition behind and not independently verified/i)
  })

  it('shows the methodology section', () => {
    render(<CostOfInactionAnalyzer />)
    expect(screen.getByText(/How this is calculated/i)).toBeInTheDocument()
  })

  it('renders without crashing for every industry profile, including the newly added ones', () => {
    for (const p of DELAY_COST_PROFILES) {
      mockData = { ...baseMockData, industry: p.industry }
      const { unmount } = render(<CostOfInactionAnalyzer />)
      expect(screen.getByText(/Delay scenario minus migrate-now scenario/i)).toBeInTheDocument()
      unmount()
    }
  })
})
