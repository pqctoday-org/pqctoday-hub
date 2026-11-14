// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { KPIDashboardBuilder } from './KPIDashboardBuilder'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

// ── Module mocks ───────────────────────────────────────────────────────────

const addExecutiveDocument = vi.fn()
const mockModuleState = { addExecutiveDocument, artifacts: { executiveDocuments: [] as unknown[] } }
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: typeof mockModuleState) => unknown) =>
    selector ? selector(mockModuleState) : mockModuleState,
}))

const mockData: ExecutiveModuleData = {
  threatsByIndustry: new Map(),
  criticalThreatCount: 0,
  totalThreatCount: 5,
  industryThreats: [],
  vendorsByDomain: new Map(),
  fipsValidatedCount: 3,
  pqcReadyCount: 4,
  vendorReadinessWeighted: 0.5,
  vendorReadinessByDomain: new Map(),
  totalProducts: 8,
  frameworks: [],
  frameworksByIndustry: [],
  countryDeadlines: [],
  userCountryData: null,
  assessmentResult: null,
  riskScore: null,
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

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => mockData,
}))

let mockPersona: string | null = 'executive'
vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (selector: (s: { selectedPersona: string | null }) => unknown) =>
    selector({ selectedPersona: mockPersona }),
}))

// ── Tests ──────────────────────────────────────────────────────────────────

describe('KPIDashboardBuilder', () => {
  beforeEach(() => {
    addExecutiveDocument.mockReset()
    mockPersona = 'executive'
    localStorage.clear()
    mockModuleState.artifacts.executiveDocuments = []
  })
  const overall = () =>
    screen.getByRole('heading', { name: /KPIs — Overall Score/ }).parentElement!.textContent ?? ''

  it('withholds the score on a fresh worksheet and shows it once the sample baseline is loaded', () => {
    render(<KPIDashboardBuilder />)
    expect(overall()).toMatch(/Not yet available/)
    expect(overall()).toMatch(/coverage: 0%/)

    fireEvent.click(screen.getByRole('button', { name: 'Load sample baseline' }))
    expect(overall()).toMatch(/Overall Score48\/100/)
    expect(overall()).toMatch(/coverage: 100%/)
    expect(screen.getAllByText(/Hub sample baseline value/).length).toBeGreaterThan(0)

    // The same sample values re-weighted by another lens give another score.
    fireEvent.click(screen.getByTestId('persona-tab-architect'))
    expect(overall()).toMatch(/Overall Score37\/100/)

    fireEvent.click(screen.getByRole('button', { name: 'Clear sample baseline' }))
    expect(overall()).toMatch(/Not yet available/)
    fireEvent.click(screen.getByTestId('persona-tab-executive'))
    expect(overall()).toMatch(/Not yet available/)
    expect(screen.getByRole('button', { name: 'Load sample baseline' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const doc = addExecutiveDocument.mock.calls.at(-1)![0] as {
      inputs: { valueOrigins: Record<string, string> }
    }
    expect(Object.values(doc.inputs.valueOrigins)).not.toContain('sample-baseline')
  })

  it('keeps a learner entry when loading the sample, and clearing removes only sample values', () => {
    render(<KPIDashboardBuilder />)
    const slider = within(screen.getByTestId('kpi-dim-systems-inventoried')).getByRole('slider')
    fireEvent.change(slider, { target: { value: '90' } })
    fireEvent.click(screen.getByRole('button', { name: 'Load sample baseline' }))
    expect(
      (
        within(screen.getByTestId('kpi-dim-systems-inventoried')).getByRole(
          'slider'
        ) as HTMLInputElement
      ).value
    ).toBe('90')

    fireEvent.click(screen.getByRole('button', { name: 'Clear sample baseline' }))
    expect(screen.getByRole('button', { name: 'Load sample baseline' })).toBeInTheDocument()
    expect(screen.queryByText(/Hub sample baseline value/)).not.toBeInTheDocument()
    expect(
      (
        within(screen.getByTestId('kpi-dim-systems-inventoried')).getByRole(
          'slider'
        ) as HTMLInputElement
      ).value
    ).toBe('90')
  })

  it('saves sample values with their own origin, not as learner entries', () => {
    render(<KPIDashboardBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample baseline' }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const doc = addExecutiveDocument.mock.calls.at(-1)![0] as {
      data: string
      inputs: { valueOrigins: Record<string, string>; scores: Record<string, number> }
    }
    expect(doc.inputs.valueOrigins['systems-inventoried']).toBe('sample-baseline')
    expect(doc.inputs.scores['systems-inventoried']).toBe(65)
    expect(doc.data).toMatch(/Overall Score: 48\/100/)
    expect(doc.data).toMatch(/Hub sample baseline value/)
  })
  it('keeps a restored score with no recorded origin through Load and Clear', () => {
    mockModuleState.artifacts.executiveDocuments = [
      {
        id: 'old-kpi',
        moduleId: 'pqc-governance',
        type: 'kpi-dashboard',
        title: 'Saved before value origins',
        data: 'Saved example',
        createdAt: 1,
        inputs: { scores: { 'systems-inventoried': 80 } },
      },
    ]
    render(<KPIDashboardBuilder />)
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
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const doc = addExecutiveDocument.mock.calls.at(-1)![0] as {
      inputs: { scores: Record<string, number>; valueOrigins: Record<string, string> }
    }
    expect(doc.inputs.scores['systems-inventoried']).toBe(80)
    expect(doc.inputs.valueOrigins['systems-inventoried']).toBe('unrecorded')
  })
})
