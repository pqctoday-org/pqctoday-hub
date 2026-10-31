// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { buildKpiDashboardMarkdown, KPIDashboardBuilder } from './KPIDashboardBuilder'
import { buildDimensions } from '@/data/kpiCatalog'
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
  criticalThreatCount: 2,
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
  isAssessmentComplete: false,
  migrationDeadlineYear: 2035,
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
  })

  it('renders the executive-weighted KPI set by default', () => {
    render(<KPIDashboardBuilder />)
    // Executive set must include compliance + HNDL + threat
    expect(screen.getByTestId('kpi-dim-compliance-gaps')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-dim-hndl-horizon')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-dim-threat-exposure')).toBeInTheDocument()
    // Ops-only KPIs should not appear
    expect(screen.queryByTestId('kpi-dim-change-failure-rate')).toBeNull()
  })

  it('switches dimension set when persona selector changes', () => {
    render(<KPIDashboardBuilder />)
    // Switch to architect view — algorithm-migration is heavily weighted
    fireEvent.click(screen.getByTestId('persona-tab-architect'))
    expect(screen.getByTestId('kpi-dim-algorithms-migrated')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-dim-cbom-completeness')).toBeInTheDocument()
    // HNDL is executive-only → should vanish
    expect(screen.queryByTestId('kpi-dim-hndl-horizon')).toBeNull()
  })

  it('renders HNDL coverage as not yet scored until organizational evidence is entered', () => {
    render(<KPIDashboardBuilder />)
    const hndl = screen.getByTestId('kpi-dim-hndl-horizon')
    expect(hndl).toHaveAttribute('data-pending', 'true')
    expect(within(hndl).getByText('Not yet scored')).toBeInTheDocument()
  })

  it('renders country-specific target tick for algorithms-migrated (US exec)', () => {
    render(<KPIDashboardBuilder />)
    // US executive target for algorithms-migrated is 80 (from kpiTargets.ts)
    expect(screen.getByTestId('kpi-target-algorithms-migrated')).toBeInTheDocument()
  })

  it('exposes a weight customisation panel', () => {
    render(<KPIDashboardBuilder />)
    expect(screen.getByText(/Customise Weights/i)).toBeInTheDocument()
  })

  it('stores evidence lineage with the saved dashboard and local snapshot', () => {
    render(<KPIDashboardBuilder />)
    const hndl = screen.getByTestId('kpi-dim-hndl-horizon')
    fireEvent.click(within(hndl).getByText('Evidence details'))
    fireEvent.change(within(hndl).getByLabelText(/Evidence owner/i), {
      target: { value: 'Risk Committee' },
    })
    fireEvent.change(within(hndl).getByLabelText(/Reporting period/i), {
      target: { value: '2026 Q4' },
    })
    fireEvent.change(within(hndl).getByLabelText(/Evidence reference/i), {
      target: { value: 'risk-register-42' },
    })
    fireEvent.change(within(hndl).getByLabelText(/Verification state/i), {
      target: { value: 'owner-reviewed' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(addExecutiveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({
          observations: expect.objectContaining({
            'hndl-horizon': expect.objectContaining({
              owner: 'Risk Committee',
              reportingPeriod: '2026 Q4',
              evidenceReference: 'risk-register-42',
              verificationState: 'owner-reviewed',
            }),
          }),
        }),
      })
    )
    expect(localStorage.getItem('pqctoday-kpi-dashboard-snapshots-v1')).toContain(
      'risk-register-42'
    )
  })

  it('keeps a manual KPI "not yet scored" in the Markdown until it is touched, as on screen', () => {
    const dimensions = buildDimensions('grc', 'governance', mockData, mockData.country)
    const manual = dimensions.filter((d) => d.notYetScored && !d.disabled)
    expect(manual.length).toBeGreaterThan(0)
    const scores = Object.fromEntries(dimensions.map((d) => [d.id, d.autoScore ?? 0]))
    const fresh = buildKpiDashboardMarkdown(dimensions, 'grc', scores, {}, {}, new Set())
    expect(fresh).toContain('_not yet scored_')
    expect(fresh).not.toMatch(/Overall Score: \d+\/100/)
    const touchedAll = buildKpiDashboardMarkdown(
      dimensions,
      'grc',
      scores,
      {},
      {},
      new Set(manual.map((d) => d.id))
    )
    expect(touchedAll).not.toContain('_not yet scored_')
    // Without a touched set (the simulation's generated documents) every score counts as entered.
    expect(buildKpiDashboardMarkdown(dimensions, 'grc', scores, {})).not.toContain(
      '_not yet scored_'
    )
  })

  it('uses the same structured observation in the saved Markdown', () => {
    const dimensions = buildDimensions('executive', 'governance', mockData, mockData.country)
    const markdown = buildKpiDashboardMarkdown(
      dimensions,
      'executive',
      {},
      {},
      {
        'hndl-horizon': {
          numerator: '4',
          denominator: '10',
          unit: 'data stores',
          reportingPeriod: '2026 Q4',
          asOfDate: '2026-10-18',
          owner: 'Risk Committee',
          evidenceReference: 'risk-register-42',
          verificationState: 'owner-reviewed',
        },
      }
    )

    expect(markdown).toContain('2026 Q4 | Risk Committee | risk-register-42 | owner-reviewed')
    expect(markdown).toContain('Raw measure: 4 / 10 data stores; as of 2026-10-18.')
  })
})
