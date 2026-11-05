// SPDX-License-Identifier: AGPL-3.0-only
import Papa from 'papaparse'
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
    expect(screen.getByText(/enter sample values before interpreting/i)).toBeInTheDocument()
    const markdown = buildKpiTrackerMarkdown({
      dimensions: buildDimensions('executive', 'migration', mockData),
      activePersona: 'executive',
      riskHistory: [],
      userScores: {},
      userWeights: {},
      touchedIds: new Set(),
    })
    expect(markdown).toContain('Overall Score: not available — scored-value coverage 0%')
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
    expect(screen.getByText(/Scored-value coverage: 0%/)).toBeInTheDocument()
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
    fireEvent.click(screen.getAllByText('Sample measure notes', { exact: true })[0])
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

  it('preserves a legacy snapshot as unknown until current calculation is explicitly chosen', () => {
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
    fireEvent.click(screen.getAllByText('Sample measure notes', { exact: true })[0])
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    const saved = addExecutiveDocument.mock.calls.at(-1)?.[0] as ExecutiveDocument
    expect(saved.data).toContain('99/100 — not assessed for current use')
    expect(saved.data).toContain('Value origin not recorded')
    expect(
      (saved.inputs as { userScores: Record<string, number> }).userScores['risk-posture']
    ).toBe(99)
    expect((saved.inputs as { originalSavedInputs: unknown }).originalSavedInputs).toEqual(
      mockStoreState.artifacts.executiveDocuments[0].inputs
    )
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Saved · edited since' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use current calculation (40)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Saved · edited since' }))
    const updated = addExecutiveDocument.mock.calls.at(-1)?.[0] as ExecutiveDocument
    expect(
      (updated.inputs as { userScores: Record<string, number> }).userScores['risk-posture']
    ).toBe(40)
    expect(
      (updated.inputs as { valueOrigins: Record<string, string> }).valueOrigins['risk-posture']
    ).toBe('calculated-current')
    expect((updated.inputs as { originalSavedInputs: unknown }).originalSavedInputs).toEqual(
      mockStoreState.artifacts.executiveDocuments[0].inputs
    )
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
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
  it('exports actual CSV with unknown saved values outside the active Score column', async () => {
    mockPersona = 'executive'
    mockData = { ...baseData(60), isAssessmentComplete: true }
    mockStoreState.artifacts.executiveDocuments = [
      {
        id: 'csv-kpis',
        moduleId: 'migration-program',
        type: 'kpi-tracker',
        title: 'Fictional CSV example',
        data: '',
        createdAt: 1,
        inputs: {
          personaOverride: 'executive',
          startYear: null,
          userScores: {
            'systems-inventoried': 99,
            'compliance-gaps': 0,
            'risk-posture': 40,
            'threat-exposure': 0,
            'fips-validated': 77,
          },
          userWeights: {},
          touchedIds: [],
          valueOrigins: {
            'compliance-gaps': 'learner-entered',
            'risk-posture': 'calculated-current',
            'threat-exposure': 'not-entered',
            'fips-validated': 'calculated-current',
          },
        },
      },
    ]
    let exported: Blob | undefined
    const NativeURL = URL
    vi.stubGlobal(
      'URL',
      class extends NativeURL {
        static createObjectURL(blob: Blob) {
          exported = blob
          return 'blob:sample-tracker'
        }
        static revokeObjectURL() {}
      }
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      render(<KPITrackerTemplate />)
      fireEvent.click(screen.getByRole('button', { name: 'Use current calculation (40)' }))
      fireEvent.click(screen.getByRole('button', { name: '.csv' }))
      expect(exported?.type).toBe('text/csv')
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(exported!)
      })
      const parsed = Papa.parse<string[]>(text, {
        delimiter: ',',
        skipEmptyLines: true,
      })
      expect(parsed.errors).toEqual([])
      const index = parsed.data.findIndex((row) => row[0] === 'KPI')
      const headers = parsed.data[index]
      const records = parsed.data
        .slice(index + 1)
        .map((row) => Object.fromEntries(headers.map((key, i) => [key, row[i]])))
      const byLabel = Object.fromEntries(records.map((row) => [row.KPI, row]))
      expect(byLabel['Systems Inventoried']).toMatchObject({
        Score: '',
        'Raw worksheet value (not an assessed score)': '99',
        'Original saved snapshot value': '99',
        'Included in overall calculation': 'false',
      })
      const compliance = records.find(
        (row) => row['Value origin'] === 'Learner-entered sample value'
      )!
      expect(compliance).toMatchObject({ Score: '0', 'Included in overall calculation': 'true' })
      const current = records.find(
        (row) => row['Value origin'] === 'Calculated from current selected sample inputs'
      )!
      expect(current).toMatchObject({ Score: '40', 'Included in overall calculation': 'true' })
      expect(
        records
          .filter((row) => row['Included in overall calculation'] === 'false')
          .every((row) => row.Score === '')
      ).toBe(true)
    } finally {
      click.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})
