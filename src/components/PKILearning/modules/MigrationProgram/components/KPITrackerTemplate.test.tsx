// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KPITrackerTemplate, buildKpiTrackerMarkdown } from './KPITrackerTemplate'
import { buildDimensions } from '@/data/kpiCatalog'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { ExecutiveDocument } from '@/services/storage/types'

const addExecutiveDocument = vi.fn()
const pushRiskScoreSnapshot = vi.fn()

interface ModuleStoreShape {
  addExecutiveDocument: typeof addExecutiveDocument
  pushRiskScoreSnapshot: typeof pushRiskScoreSnapshot
  kpiHistory?: { riskScore: { ts: number; score: number }[] }
  artifacts: { executiveDocuments: ExecutiveDocument[] }
}

let mockStoreState: ModuleStoreShape = {
  addExecutiveDocument,
  pushRiskScoreSnapshot,
  kpiHistory: { riskScore: [] },
  artifacts: { executiveDocuments: [] },
}

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: ModuleStoreShape) => unknown) =>
    selector ? selector(mockStoreState) : mockStoreState,
}))

let mockData: ExecutiveModuleData = baseData(null)

function baseData(riskScore: number | null): ExecutiveModuleData {
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: 1,
    totalThreatCount: 4,
    industryThreats: [],
    vendorsByDomain: new Map(),
    fipsValidatedCount: 2,
    pqcReadyCount: 5,
    vendorReadinessWeighted: 0.7,
    vendorReadinessByDomain: new Map(),
    totalProducts: 10,
    frameworks: [],
    frameworksByIndustry: [],
    countryDeadlines: [],
    userCountryData: null,
    assessmentResult: null,
    riskScore,
    industry: '',
    country: '',
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
    isAssessmentComplete: false,
    migrationDeadlineYear: null,
  }
}

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => mockData,
}))

let mockPersona: string | null = 'ops'
vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (selector: (s: { selectedPersona: string | null }) => unknown) =>
    selector({ selectedPersona: mockPersona }),
}))

describe('KPITrackerTemplate', () => {
  beforeEach(() => {
    addExecutiveDocument.mockReset()
    pushRiskScoreSnapshot.mockReset()
    mockStoreState = {
      addExecutiveDocument,
      pushRiskScoreSnapshot,
      kpiHistory: { riskScore: [] },
      artifacts: { executiveDocuments: [] },
    }
    mockData = baseData(null)
    mockPersona = 'ops'
  })

  it('renders ops-specific KPIs (change failure rate, canary)', () => {
    render(<KPITrackerTemplate />)
    expect(screen.getByTestId('kpi-dim-change-failure-rate')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-dim-canary-coverage')).toBeInTheDocument()
  })

  it('withholds an empty executive score on screen and in the saved report', () => {
    mockPersona = 'executive'
    render(<KPITrackerTemplate />)
    expect(
      screen.getByText(/enter organization-specific evidence before interpreting/i)
    ).toBeInTheDocument()
    const markdown = buildKpiTrackerMarkdown({
      dimensions: buildDimensions('executive', 'migration', mockData),
      activePersona: 'executive',
      riskHistory: [],
      userScores: {},
      userWeights: {},
      touchedIds: new Set(),
    })
    expect(markdown).toContain('Overall Score: not available — evidence coverage 0%')
    expect(markdown).not.toContain('Overall Migration Progress: 0/100')
    expect(screen.queryByText(/Tracker auto-scored from/)).not.toBeInTheDocument()
  })

  it('does not turn one entered KPI into a complete migration score', () => {
    const dimensions = buildDimensions('executive', 'migration', mockData)
    const buildReport = (touched: Set<string>) =>
      buildKpiTrackerMarkdown({
        dimensions,
        activePersona: 'executive',
        riskHistory: [],
        userScores: Object.fromEntries(dimensions.map((d) => [d.id, 0])),
        userWeights: {},
        touchedIds: touched,
      })
    expect(buildReport(new Set([dimensions[0].id]))).toContain('Overall Score: not available')
    // A real entered zero counts as a value; it is different from missing input.
    const complete = buildReport(new Set(dimensions.filter((d) => !d.disabled).map((d) => d.id)))
    expect(complete).toContain('Overall Score: 0/100')
    expect(complete).toContain('not verified migration progress')
  })

  it('restores a saved empty scorecard without treating mirrored zeros as entered evidence', () => {
    mockPersona = 'executive'
    const dimensions = buildDimensions('executive', 'migration', mockData)
    mockStoreState.artifacts.executiveDocuments = [
      {
        id: 'kpi-tracker-empty',
        moduleId: 'migration-program',
        type: 'kpi-tracker',
        title: 'Empty planning worksheet',
        data: '',
        createdAt: Date.now(),
        inputs: {
          personaOverride: 'executive',
          startYear: null,
          userScores: Object.fromEntries(dimensions.map((d) => [d.id, 0])),
          userWeights: {},
          touchedIds: [],
        },
      },
    ]
    render(<KPITrackerTemplate />)
    expect(screen.getByText(/Evidence coverage: 0%/)).toBeInTheDocument()
    expect(screen.getByText(/Not yet available/)).toBeInTheDocument()
    expect(screen.queryByText(/weights sum to 0%/i)).not.toBeInTheDocument()
  })

  it('disables risk-posture when no assessment is complete', () => {
    render(<KPITrackerTemplate />)
    const risk = screen.getByTestId('kpi-dim-risk-posture')
    expect(risk).toHaveAttribute('data-disabled', 'true')
  })

  it('restores, edits, saves and exports measurement evidence with its denominator', () => {
    mockPersona = 'executive'
    mockStoreState.artifacts.executiveDocuments = [
      {
        id: 'bank-kpis',
        moduleId: 'migration-program',
        type: 'kpi-tracker',
        title: 'Bank case',
        data: '',
        createdAt: 1,
        inputs: {
          personaOverride: 'executive',
          startYear: 2027,
          userScores: { 'systems-inventoried': 40 },
          userWeights: {},
          touchedIds: ['systems-inventoried'],
          observations: {
            'systems-inventoried': {
              numerator: '100',
              denominator: '250',
              reportingPeriod: '2027 Q1',
              owner: 'Inventory Lead',
              evidenceReference: 'CASE-INV-001',
              verificationState: 'not-verified',
            },
          },
        },
      },
    ]
    const view = render(<KPITrackerTemplate />)
    fireEvent.click(screen.getAllByText('Evidence details', { exact: true })[0])
    expect(screen.getByLabelText('Systems Inventoried Denominator')).toHaveValue('250')
    fireEvent.change(screen.getByLabelText('Systems Inventoried Evidence owner'), {
      target: { value: 'Reviewed Inventory Team' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    const saved = addExecutiveDocument.mock.calls.at(-1)?.[0] as ExecutiveDocument
    expect(saved.data).toContain('100 | 250')
    expect(saved.data).toContain('2027 Q1')
    expect(saved.data).toContain('Reviewed Inventory Team')
    expect(saved.data).toContain('CASE-INV-001')
    expect(saved.data).toContain('not-verified')
    view.unmount()
    mockStoreState.artifacts.executiveDocuments = [saved]
    render(<KPITrackerTemplate />)
    expect(screen.getByLabelText('Systems Inventoried Evidence owner')).toHaveValue(
      'Reviewed Inventory Team'
    )
    expect(screen.getByLabelText('Systems Inventoried Numerator')).toHaveValue('100')
  })

  it('counts only unlocked KPIs toward the coverage rule, so a fresh GRC worksheet can reach a combined score', () => {
    const dimensions = buildDimensions('grc', 'migration', mockData)
    const unlocked = dimensions.filter((d) => !d.disabled)
    // On a fresh worksheet the locked KPIs hold more than 30% of the intended weight.
    expect(dimensions.some((d) => d.disabled)).toBe(true)
    const report = buildKpiTrackerMarkdown({
      dimensions,
      activePersona: 'grc',
      riskHistory: [],
      userScores: Object.fromEntries(unlocked.map((d) => [d.id, 50])),
      userWeights: {},
      touchedIds: new Set(unlocked.map((d) => d.id)),
    })
    expect(report).toContain('Overall Score: 50/100')
    // Scoring only one of them is still below the threshold.
    const partial = buildKpiTrackerMarkdown({
      dimensions,
      activePersona: 'grc',
      riskHistory: [],
      userScores: { [unlocked[0].id]: 50 },
      userWeights: {},
      touchedIds: new Set([unlocked[0].id]),
    })
    expect(partial).toContain('Overall Score: not available')
  })

  it('does not let a stored score for an untouched KPI outrank its live auto score', () => {
    mockPersona = 'executive'
    mockData = { ...baseData(60), isAssessmentComplete: true }
    mockStoreState.artifacts.executiveDocuments = [
      {
        id: 'stale-auto',
        moduleId: 'migration-program',
        type: 'kpi-tracker',
        title: 'Earlier worksheet',
        data: '',
        createdAt: 1,
        inputs: {
          personaOverride: 'executive',
          startYear: null,
          userScores: { 'risk-posture': 99 },
          userWeights: {},
          touchedIds: [],
        },
      },
    ]
    render(<KPITrackerTemplate />)
    fireEvent.click(screen.getAllByText('Evidence details', { exact: true })[0])
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    const saved = addExecutiveDocument.mock.calls.at(-1)?.[0] as ExecutiveDocument
    expect(saved.data).not.toContain('99/100')
    expect(
      (saved.inputs as { userScores: Record<string, number> }).userScores['risk-posture']
    ).not.toBe(99)
  })

  it('restores a save made before touched ids were stored without throwing', () => {
    mockPersona = 'executive'
    mockStoreState.artifacts.executiveDocuments = [
      {
        id: 'old-shape',
        moduleId: 'migration-program',
        type: 'kpi-tracker',
        title: 'Old worksheet',
        data: '',
        createdAt: 1,
        inputs: {
          personaOverride: 'executive',
          startYear: null,
          userScores: { 'risk-posture': 50 },
          userWeights: {},
        },
      },
    ]
    expect(() => render(<KPITrackerTemplate />)).not.toThrow()
  })

  it('does not push a snapshot when riskScore is null', () => {
    render(<KPITrackerTemplate />)
    expect(pushRiskScoreSnapshot).not.toHaveBeenCalled()
  })

  it('pushes a risk-score snapshot when assessment has a value', () => {
    mockData = baseData(42)
    render(<KPITrackerTemplate />)
    expect(pushRiskScoreSnapshot).toHaveBeenCalledWith(42)
  })

  it('switches to researcher set when persona tab clicked', () => {
    render(<KPITrackerTemplate />)
    fireEvent.click(screen.getByTestId('persona-tab-researcher'))
    expect(screen.getByTestId('kpi-dim-algorithm-diversity')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-dim-standards-coverage')).toBeInTheDocument()
    // Ops-only should vanish
    expect(screen.queryByTestId('kpi-dim-change-failure-rate')).toBeNull()
  })

  it('shows the start-year banner from a live roadmapOutput prop', () => {
    render(<KPITrackerTemplate roadmapOutput={{ milestones: [], earliestYear: 2027 }} />)
    expect(screen.getByText(/Start year set to 2027.*Step 1/i)).toBeInTheDocument()
  })

  it('falls back to the last saved Roadmap Builder artifact when no prop is passed', () => {
    mockStoreState = {
      ...mockStoreState,
      artifacts: {
        executiveDocuments: [
          {
            id: 'migration-roadmap-1',
            moduleId: 'migration-program',
            type: 'migration-roadmap',
            title: 'PQC Migration Roadmap',
            data: '',
            createdAt: Date.now(),
            inputs: {},
            output: { milestones: [], earliestYear: 2028 },
          },
        ],
      },
    }
    render(<KPITrackerTemplate />)
    expect(
      screen.getByText(/Start year set to 2028.*last Roadmap Builder export/i)
    ).toBeInTheDocument()
  })
})
