// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BoardPitchBuilder } from './BoardPitchBuilder'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { ExecutiveDocument } from '@/services/storage/types'

// BoardPitchBuilder renders <Link to="/report"> / <Link to="/assess">.
const renderPitch = (props?: React.ComponentProps<typeof BoardPitchBuilder>) =>
  render(
    <MemoryRouter>
      <BoardPitchBuilder {...props} />
    </MemoryRouter>
  )

// ── Mocks ──────────────────────────────────────────────────────────────────

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
  migrationDeadlineYear: null,
}

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => baseMockData,
}))

// Controlled per-test: the saved executive documents the store should report.
// Reassigned in each test rather than via beforeEach so it stays a plain
// array read lazily by the mock closure below (matches the mockData pattern
// used in ROICalculator.test.tsx).
let mockExecutiveDocuments: ExecutiveDocument[] = []
const addExecutiveDocumentMock = vi.fn()

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      addExecutiveDocument: addExecutiveDocumentMock,
      artifacts: { executiveDocuments: mockExecutiveDocuments },
    }
    return selector ? selector(state) : state
  },
}))

describe('BoardPitchBuilder — cross-tool output chaining', () => {
  beforeEach(() => {
    mockExecutiveDocuments = []
    addExecutiveDocumentMock.mockClear()
  })

  it('renders without crashing and with no ROI data available', () => {
    renderPitch()
    expect(screen.queryByText(/ROI data/i)).not.toBeInTheDocument()
  })

  it('uses the ROI Calculator prop when passed (linear wizard path)', () => {
    renderPitch({
      roiOutput: { totalCostUSD: 999, roiPercent: 10, paybackMonths: 1, breachCostSavingsUSD: 1 },
    })
    expect(screen.getByText(/ROI data from Step 2/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/Migration investment: \$999/)).toBeInTheDocument()
  })

  it('falls back to the last saved ROI Calculator artifact when no prop is passed', () => {
    mockExecutiveDocuments = [
      {
        id: 'roi-model-1',
        moduleId: 'pqc-business-case',
        type: 'roi-model',
        title: 'PQC ROI Analysis',
        data: '',
        createdAt: Date.now(),
        inputs: {},
        output: {
          totalCostUSD: 1_600_000,
          roiPercent: 250,
          paybackMonths: 14,
          breachCostSavingsUSD: 500_000,
        },
      },
    ]
    renderPitch()
    expect(screen.getByText(/ROI data from your last ROI Calculator export/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/Migration investment: \$1\.6M/)).toBeInTheDocument()
  })

  it('prefers the live prop over a saved artifact when both are present', () => {
    mockExecutiveDocuments = [
      {
        id: 'roi-model-1',
        moduleId: 'pqc-business-case',
        type: 'roi-model',
        title: 'PQC ROI Analysis',
        data: '',
        createdAt: Date.now(),
        inputs: {},
        output: {
          totalCostUSD: 1_600_000,
          roiPercent: 250,
          paybackMonths: 14,
          breachCostSavingsUSD: 500_000,
        },
      },
    ]
    renderPitch({
      roiOutput: { totalCostUSD: 999, roiPercent: 10, paybackMonths: 1, breachCostSavingsUSD: 1 },
    })
    expect(screen.getByText(/ROI data from Step 2/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/Migration investment: \$999/)).toBeInTheDocument()
    expect(screen.queryByDisplayValue(/Migration investment: \$1\.6M/)).not.toBeInTheDocument()
  })

  it('falls back to the last saved Breach Scenario Simulator artifact when no prop is passed', () => {
    mockExecutiveDocuments = [
      {
        id: 'breach-scenario-1',
        moduleId: 'pqc-business-case',
        type: 'breach-scenario',
        title: 'Breach Scenario',
        data: '',
        createdAt: Date.now(),
        inputs: {},
        output: {
          industry: 'Finance & Banking',
          classicalCostUSD: 4_000_000,
          quantumCostUSD: 8_000_000,
          deltaUSD: 4_000_000,
          pCrqc: 0.3,
          quantumALEUSD: 500_000,
          latestSafeStartYear: 2029,
          alreadyLate: false,
          dataSensitivityClass: 'general-pii',
          yearsOfData: 5,
          hndlFactorPct: 30,
          annualBreachProbPct: 9,
        },
      },
    ]
    renderPitch()
    expect(
      screen.getByText(/Breach scenario data from your last Breach Scenario Simulator export/i)
    ).toBeInTheDocument()
  })

  it('falls back to the last saved Cost of Inaction artifact when no prop is passed', () => {
    mockExecutiveDocuments = [
      {
        id: 'cost-of-inaction-1',
        moduleId: 'pqc-business-case',
        type: 'cost-of-inaction',
        title: 'Cost of Inaction',
        data: '',
        createdAt: Date.now(),
        inputs: {},
        output: {
          costOfInactionUSD: 2_000_000,
          delayYears: 2,
          crossoverYear: 2031,
          latestSafeStartYear: 2029,
          alreadyLate: false,
        },
      },
    ]
    renderPitch()
    expect(
      screen.getByText(/Cost of inaction from your last Cost of Inaction Analyzer export/i)
    ).toBeInTheDocument()
  })
})
