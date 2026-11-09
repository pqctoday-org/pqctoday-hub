// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('says the figures rest on the example count when the calculator was left on its example', () => {
    renderPitch({
      roiOutput: {
        totalCostUSD: 999,
        roiPercent: 10,
        paybackMonths: 1,
        breachCostSavingsUSD: 1,
        productsToMigrate: 50,
        productsSource: 'example',
      },
    })
    const note = 'example count of 50 systems or products, not your own'
    expect(screen.getAllByText(new RegExp(note)).length).toBeGreaterThan(0) // the banner
    expect(
      screen.getByDisplayValue(new RegExp(`Migration investment: \\$999 \\(${note}\\)`))
    ).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(/Count behind the total: example count of 50/)
    ).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(/Enter your own count in the ROI Calculator/)
    ).toBeInTheDocument()
  })

  it('says nothing about an example when the learner entered the count', () => {
    renderPitch({
      roiOutput: {
        totalCostUSD: 999,
        roiPercent: 10,
        paybackMonths: 1,
        breachCostSavingsUSD: 1,
        productsToMigrate: 120,
        productsSource: 'entered',
      },
    })
    expect(screen.queryByText(/not your own/)).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue(/Count behind the total/)).not.toBeInTheDocument()
    expect(screen.getByDisplayValue(/Migration investment: \$999 \|/)).toBeInTheDocument()
  })

  it('does not say no cost estimate is attached once the amount comes from the ROI model', () => {
    renderPitch({
      roiOutput: { totalCostUSD: 999, roiPercent: 10, paybackMonths: 1, breachCostSavingsUSD: 1 },
    })
    expect(screen.queryByDisplayValue(/No reviewed estate cost estimate is attached/)).toBeNull()
    expect(screen.getByDisplayValue(/comes from the ROI model/)).toBeInTheDocument()
  })

  it('says the total is modelled when products are selected and the amount comes from the ROI model', () => {
    const original = baseMockData.myProducts
    baseMockData.myProducts = [{ productName: 'Example HSM' } as never]
    try {
      renderPitch({
        roiOutput: { totalCostUSD: 999, roiPercent: 10, paybackMonths: 1, breachCostSavingsUSD: 1 },
      })
      expect(
        screen.getByDisplayValue(/comes from the ROI model, which is an illustrative/)
      ).toBeInTheDocument()
      expect(
        screen.getByDisplayValue(/1 selected product types provide dependency context/)
      ).toBeInTheDocument()
    } finally {
      baseMockData.myProducts = original
    }
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
    expect(screen.getByText(/Saved Cost of Inaction scenario/i)).toBeInTheDocument()
  })
})

describe('BoardPitchBuilder — proposal-specific sources', () => {
  beforeEach(() => {
    mockExecutiveDocuments = []
    addExecutiveDocumentMock.mockClear()
  })

  it('exports an explicit missing-basis notice without attributing unrelated datasets', () => {
    renderPitch()
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    const doc = addExecutiveDocumentMock.mock.calls.at(-1)![0]
    expect(doc.data).toContain('Sources and assumptions not recorded')
    expect(doc.data).not.toContain('IBM Cost of a Data Breach')
    expect(doc.data).not.toContain('Cyentia')
    expect(doc.data).not.toContain('Global Risk Institute')
  })

  it('preserves an edited basis in saved inputs, restored fields and preview/export content', () => {
    const basis = 'Fictional effort 90–140 days at $1,000/day; sample tooling and reserve.'
    const view = renderPitch()
    fireEvent.change(screen.getByLabelText('Sources and assumptions used'), {
      target: { value: basis },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    const doc = addExecutiveDocumentMock.mock.calls.at(-1)![0]
    expect(doc.inputs['sources-assumptions'].basis).toBe(basis)
    expect(doc.data).toContain(basis)
    mockExecutiveDocuments = [doc]
    view.unmount()
    renderPitch()
    expect(screen.getByLabelText('Sources and assumptions used')).toHaveValue(basis)
    fireEvent.click(screen.getByRole('button', { name: /^Preview$/ }))
    expect(screen.getByText(basis)).toBeInTheDocument()
    expect(screen.queryByText(/Breach cost baselines/)).not.toBeInTheDocument()
  })

  it('opens older saved drafts without inventing a source attribution', () => {
    mockExecutiveDocuments = [
      {
        id: 'older-board-deck',
        moduleId: 'pqc-business-case',
        type: 'board-deck',
        title: 'Older draft',
        data: 'Old exported content',
        createdAt: 1,
        inputs: { budget: { amount: 'Fictional discovery request' } },
      },
    ]
    renderPitch()
    expect(screen.getByLabelText('Sources and assumptions used')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(addExecutiveDocumentMock.mock.calls.at(-1)![0].data).toContain(
      'Sources and assumptions not recorded'
    )
  })
})
