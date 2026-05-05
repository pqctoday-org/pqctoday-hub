// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KPIDashboardBuilder } from './KPIDashboardBuilder'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

// ── Module mocks ───────────────────────────────────────────────────────────

const addExecutiveDocument = vi.fn()
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument }),
}))

const mockData: ExecutiveModuleData = {
  threatsByIndustry: new Map(),
  criticalThreatCount: 2,
  totalThreatCount: 5,
  industryThreats: [],
  vendorsByLayer: new Map(),
  fipsValidatedCount: 3,
  pqcReadyCount: 4,
  vendorReadinessWeighted: 0.5,
  vendorReadinessByLayer: new Map(),
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

  it('renders HNDL as disabled when no assessment is complete', () => {
    render(<KPIDashboardBuilder />)
    const hndl = screen.getByTestId('kpi-dim-hndl-horizon')
    expect(hndl).toHaveAttribute('data-disabled', 'true')
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
})
