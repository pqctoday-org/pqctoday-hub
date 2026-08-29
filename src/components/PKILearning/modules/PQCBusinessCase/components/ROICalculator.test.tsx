// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ROICalculator } from './ROICalculator'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { AssessmentProfile } from '@/hooks/assessmentTypes'

// The calculator renders <Link> in its cross-check panel, so tests need a Router.
const renderCalc = () =>
  render(
    <MemoryRouter>
      <ROICalculator />
    </MemoryRouter>
  )

// ── Mocks ──────────────────────────────────────────────────────────────────

// Recharts needs a mock because jsdom can't measure the SVG container.
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tornado-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ReferenceLine: () => null,
}))

// Avoid exercising the heavy PDF/DOCX/PPTX export services in component tests.
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
  // @ts-expect-error — tests only need length; full ComplianceFramework shape isn't required
  frameworksByIndustry: [{}, {}, {}, {}, {}], // 5 frameworks
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ROICalculator', () => {
  beforeEach(() => {
    mockData = { ...baseMockData }
  })

  it('renders the executive framing banner and all four KPI cards', () => {
    renderCalc()
    expect(screen.getByText(/Board-ready business case/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Cost \(3yr\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Cost of Inaction \(3yr\)/i)).toBeInTheDocument()
    expect(screen.getByText(/NPV @ 10%/i)).toBeInTheDocument()
    expect(screen.getByText(/Payback Period/i)).toBeInTheDocument()
  })

  it('offers markdown, PDF, and DOCX export formats', () => {
    renderCalc()
    const exportable = screen.getByTestId('exportable')
    expect(exportable.dataset.formats).toBe('markdown,pdf,docx')
  })

  it('renders the three decomposed quantum-multiplier sliders (HNDL, CRQC, detection)', () => {
    renderCalc()
    expect(screen.getByLabelText(/HNDL Exposure/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Post-CRQC Attacker Uplift/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Detection-Timeline Uplift/i)).toBeInTheDocument()
  })

  it('renders the annual opex and discount-rate inputs', () => {
    renderCalc()
    expect(screen.getByLabelText(/Annual Opex \(% of capex\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Discount Rate \(WACC\)/i)).toBeInTheDocument()
  })

  it('shows the methodology section explaining NPV, payback, and sensitivity', () => {
    renderCalc()
    expect(screen.getByText(/Calculation Methodology/i)).toBeInTheDocument()
    // The methodology accordion contains these concepts (text may appear elsewhere too,
    // so we just verify their presence somewhere in the rendered component).
    expect(
      screen.getByText(/Σ \(netAnnualBenefit \/ \(1 \+ WACC\)\^t\) − capex/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/capex \/ \(netAnnualBenefit \/ 12\)/i)).toBeInTheDocument()
    expect(screen.getByText(/varied ±30%/i)).toBeInTheDocument()
  })

  it('uses the mandated compliance count as the default when assessment is complete', () => {
    mockData = {
      ...baseMockData,
      assessmentResult: {
        riskScore: 60,
        riskLevel: 'medium',
        algorithmMigrations: [],
        complianceImpacts: [
          { framework: 'GDPR', requiresPQC: true, deadline: '2030', notes: '' },
          { framework: 'HIPAA', requiresPQC: true, deadline: '2030', notes: '' },
          { framework: 'SOC 2', requiresPQC: false, deadline: '2030', notes: '' },
        ],
        recommendedActions: [],
        narrative: '',
        generatedAt: '',
      },
    }
    renderCalc()
    const frameworksSlider = screen.getByLabelText(/Applicable Frameworks/i) as HTMLInputElement
    // Only 2 of the 3 compliance impacts have requiresPQC=true; default should be 2.
    expect(frameworksSlider.value).toBe('2')
  })

  it('falls back to complianceSelections length when no mandated impacts exist', () => {
    mockData = {
      ...baseMockData,
      complianceSelections: ['ISO 27001', 'FedRAMP', 'SOC 2'],
    }
    renderCalc()
    const frameworksSlider = screen.getByLabelText(/Applicable Frameworks/i) as HTMLInputElement
    expect(frameworksSlider.value).toBe('3')
  })

  it('falls back to industry frameworks length when neither assessment nor selections exist', () => {
    // baseMockData has 5 frameworksByIndustry and empty complianceSelections
    renderCalc()
    const frameworksSlider = screen.getByLabelText(/Applicable Frameworks/i) as HTMLInputElement
    expect(frameworksSlider.value).toBe('5')
  })

  it('recomputes the quantum multiplier when the HNDL slider changes', () => {
    renderCalc()
    const hndlSlider = screen.getByLabelText(/HNDL Exposure/i) as HTMLInputElement
    // Default 50/50/50 = 2.5x — rendered in a <span> next to "quantum amp".
    expect(screen.getByText(/^2\.50×$/)).toBeInTheDocument()
    fireEvent.change(hndlSlider, { target: { value: '100' } })
    // 100% HNDL + 50% CRQC + 50% detection = 3.0×
    expect(screen.getByText(/^3\.00×$/)).toBeInTheDocument()
  })

  it('exposes a tornado chart for sensitivity analysis', () => {
    renderCalc()
    // The recharts mock replaces BarChart with a div carrying testId "tornado-chart".
    expect(screen.getByTestId('tornado-chart')).toBeInTheDocument()
    expect(screen.getByText(/Sensitivity — NPV impact at ±30%/i)).toBeInTheDocument()
  })

  it('cross-checks the per-product model against the assessment-derived estimate', () => {
    mockData = {
      ...baseMockData,
      isAssessmentComplete: true,
      assessmentResult: {
        riskScore: 60,
        riskLevel: 'medium',
        algorithmMigrations: [
          {
            classical: 'RSA-2048',
            quantumVulnerable: true,
            replacement: 'ML-KEM-768',
            urgency: 'near-term',
            notes: '',
          },
          {
            classical: 'ECDSA',
            quantumVulnerable: true,
            replacement: 'ML-DSA-65',
            urgency: 'near-term',
            notes: '',
          },
        ],
        complianceImpacts: [],
        recommendedActions: [],
        narrative: '',
        generatedAt: '',
        // Partial profile is enough — computeMigrationCostFromProfile reads fields
        // defensively with defaults.
        assessmentProfile: {
          infrastructure: ['Hardware', 'Cloud'],
          systemScale: '51-200',
        } as unknown as AssessmentProfile,
      },
    }
    renderCalc()
    expect(screen.getByText(/Cross-check vs your assessment/i)).toBeInTheDocument()
    expect(screen.getByText(/Assessment-derived estimate/i)).toBeInTheDocument()
    // The reconciliation renders exactly one verdict (aligned or divergent).
    expect(screen.getByText(/Aligned\.|Divergent\./)).toBeInTheDocument()
  })

  it('shows the selected-scope cost in the cross-check panel once Products to Migrate is below the full estate', () => {
    mockData = {
      ...baseMockData,
      isAssessmentComplete: true,
      assessmentResult: {
        riskScore: 60,
        riskLevel: 'medium',
        algorithmMigrations: [],
        complianceImpacts: [],
        recommendedActions: [],
        narrative: '',
        generatedAt: '',
        assessmentProfile: {
          infrastructure: ['Hardware', 'Cloud'],
          systemScale: '51-200',
        } as unknown as AssessmentProfile,
      },
    }
    renderCalc()
    // Default productsToMigrate = min(totalProducts, 50) = totalProducts here (10),
    // so the selected-scope line shouldn't render — it would just repeat the
    // full-estate number.
    expect(screen.queryByText(/At your selected scope/i)).not.toBeInTheDocument()

    const productsSlider = screen.getByLabelText(/Products to Migrate/i) as HTMLInputElement
    fireEvent.change(productsSlider, { target: { value: '5' } })

    expect(
      screen.getByText(/At your selected scope \(5 of 10 products above\)/i)
    ).toBeInTheDocument()
  })

  it('prompts to run the assessment when none is complete (cross-check empty state)', () => {
    // baseMockData has isAssessmentComplete=false and assessmentResult=null.
    renderCalc()
    expect(screen.getByText(/Cross-check vs your assessment/i)).toBeInTheDocument()
    expect(screen.getByText(/generate a second, independent cost estimate/i)).toBeInTheDocument()
  })
})
