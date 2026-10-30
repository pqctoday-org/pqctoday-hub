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
  })

  it('disables risk-posture when no assessment is complete', () => {
    render(<KPITrackerTemplate />)
    const risk = screen.getByTestId('kpi-dim-risk-posture')
    expect(risk).toHaveAttribute('data-disabled', 'true')
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
