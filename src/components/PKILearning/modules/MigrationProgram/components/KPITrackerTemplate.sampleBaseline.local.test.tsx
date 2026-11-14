// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { KPITrackerTemplate } from './KPITrackerTemplate'
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

describe('KPITrackerTemplate sample baseline', () => {
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
  const overall = () =>
    screen.getByRole('heading', { name: /Tracker — Overall Score/ }).parentElement!.textContent ??
    ''

  it('withholds the score on a fresh tracker and shows it once the sample baseline is loaded', () => {
    mockPersona = 'executive'
    render(<KPITrackerTemplate />)
    expect(overall()).toMatch(/Not yet available/)

    fireEvent.click(screen.getByRole('button', { name: 'Load sample baseline' }))
    const executive = overall().match(/Overall Score(\d+)\/100/)?.[1]
    expect(executive).toBeDefined()
    expect(overall()).toMatch(/coverage: 100%/)

    fireEvent.click(screen.getByTestId('persona-tab-ops'))
    const ops = overall().match(/Overall Score(\d+)\/100/)?.[1]
    expect(ops).toBeDefined()
    expect(ops).not.toBe(executive)

    fireEvent.click(screen.getByRole('button', { name: 'Clear sample baseline' }))
    expect(overall()).toMatch(/Not yet available/)
    // No stale sample origin survives Clear, including ids of the lens not on
    // screen (the executive KPIs filled before the switch to ops).
    expect(screen.getByRole('button', { name: 'Load sample baseline' })).toBeInTheDocument()
    expect(screen.queryByText(/Hub sample baseline value/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('persona-tab-executive'))
    expect(overall()).toMatch(/Not yet available/)
    expect(screen.getByRole('button', { name: 'Load sample baseline' })).toBeInTheDocument()
  })
  it('keeps a restored score with no recorded origin through Load and Clear', () => {
    mockPersona = 'executive'
    mockStoreState.artifacts.executiveDocuments = [
      {
        id: 'old-tracker',
        moduleId: 'migration-program',
        type: 'kpi-tracker',
        title: 'Saved before value origins',
        data: 'Saved example',
        createdAt: 1,
        inputs: { userScores: { 'systems-inventoried': 80 } },
      } as unknown as ExecutiveDocument,
    ]
    render(<KPITrackerTemplate />)
    const value = () =>
      (
        within(screen.getByTestId('kpi-dim-systems-inventoried')).getByRole(
          'slider'
        ) as HTMLInputElement
      ).value
    expect(value()).toBe('80')
    fireEvent.click(screen.getByRole('button', { name: 'Load sample baseline' }))
    expect(value()).toBe('80')
    fireEvent.click(screen.getByRole('button', { name: 'Clear sample baseline' }))
    expect(value()).toBe('80')
  })
})
