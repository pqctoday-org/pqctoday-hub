// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KPITrackerTemplate } from './KPITrackerTemplate'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

const addExecutiveDocument = vi.fn()
const pushRiskScoreSnapshot = vi.fn()

interface ModuleStoreShape {
  addExecutiveDocument: typeof addExecutiveDocument
  pushRiskScoreSnapshot: typeof pushRiskScoreSnapshot
  kpiHistory?: { riskScore: { ts: number; score: number }[] }
}

let mockStoreState: ModuleStoreShape = {
  addExecutiveDocument,
  pushRiskScoreSnapshot,
  kpiHistory: { riskScore: [] },
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
    vendorsByLayer: new Map(),
    fipsValidatedCount: 2,
    pqcReadyCount: 5,
    vendorReadinessWeighted: 0.7,
    vendorReadinessByLayer: new Map(),
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
    hnflRiskWindow: null,
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
    }
    mockData = baseData(null)
    mockPersona = 'ops'
  })

  it('renders ops-specific KPIs (change failure rate, canary)', () => {
    render(<KPITrackerTemplate />)
    expect(screen.getByTestId('kpi-dim-change-failure-rate')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-dim-canary-coverage')).toBeInTheDocument()
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
})
