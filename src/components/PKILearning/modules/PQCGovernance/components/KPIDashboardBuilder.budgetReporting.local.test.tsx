// SPDX-License-Identifier: AGPL-3.0-only
import Papa from 'papaparse'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { buildDimensions } from '@/data/kpiCatalog'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { KPIDashboardBuilder, buildKpiDashboardMarkdown } from './KPIDashboardBuilder'

const data: ExecutiveModuleData = {
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

describe('finance reporting stays outside governance readiness', () => {
  it('keeps the budget visible for each relevant role and excludes its target and weight', () => {
    for (const persona of ['executive', 'architect', 'ops'] as const) {
      const dimensions = buildDimensions(persona, 'governance', data)
      expect(dimensions.find((d) => d.id === 'budget-utilization')).toMatchObject({
        reportingOnly: true,
        weight: 0,
      })
      expect(dimensions.find((d) => d.id === 'budget-utilization')?.target).toBeUndefined()
      expect(dimensions.find((d) => d.id === 'budget-utilization')?.autoScore).toBeUndefined()
    }
  })

  it('keeps a saved finance override and unknown period out of Markdown readiness', () => {
    const dimensions = buildDimensions('executive', 'governance', data)
    const base = Object.fromEntries(
      dimensions.filter((d) => !d.disabled && !d.reportingOnly).map((d) => [d.id, 50])
    )
    for (const value of [0, 80, 100, 125]) {
      const md = buildKpiDashboardMarkdown(
        dimensions,
        'executive',
        { ...base, 'budget-utilization': value },
        { 'budget-utilization': 1 },
        {}
      )
      expect(md).toContain('**Overall Score: 50/100**')
      expect(md).toContain(`${value}% — reporting only; excluded from readiness`)
      expect(md).toContain('scope: Unknown')
      expect(md).not.toContain('125/100')
    }
  })
})

interface SavedDocument {
  id: string
  type: string
  moduleId: string
  data: string
  inputs: Record<string, unknown>
  createdAt?: number
}
const addExecutiveDocument = vi.fn((document: SavedDocument) => {
  state.artifacts.executiveDocuments = [
    ...state.artifacts.executiveDocuments.filter((existing) => existing.id !== document.id),
    document,
  ]
})
const pushRiskScoreSnapshot = vi.fn()
const state = {
  addExecutiveDocument,
  pushRiskScoreSnapshot,
  kpiHistory: { riskScore: [] },
  artifacts: { executiveDocuments: [] as SavedDocument[] },
}
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (value: typeof state) => unknown) =>
    selector ? selector(state) : state,
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => data }))
vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (selector: (value: { selectedPersona: string }) => unknown) =>
    selector({ selectedPersona: 'executive' }),
}))

beforeEach(() => {
  state.artifacts.executiveDocuments = []
  addExecutiveDocument.mockClear()
  localStorage.clear()
})

it('saves and reopens exact raw finance inputs without adopting an old readiness weight', async () => {
  state.artifacts.executiveDocuments = [
    {
      id: 'sample-saved',
      type: 'kpi-dashboard',
      moduleId: 'pqc-governance',
      data: 'Original sample',
      createdAt: 1,
      inputs: {
        activePersona: 'executive',
        scores: { 'budget-utilization': 80 },
        weights: { 'budget-utilization': 1 },
        valueOrigins: { 'budget-utilization': 'learner-entered' },
        touchedIds: ['budget-utilization'],
      },
    },
  ]
  const view = render(<KPIDashboardBuilder />)
  expect(
    screen.getByRole('spinbutton', { name: 'Budget Utilization reported percent' })
  ).toHaveValue(80)
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Budget Utilization reported percent' }),
    { target: { value: '125' } }
  )
  const row = within(screen.getByTestId('kpi-dim-budget-utilization'))
  fireEvent.click(row.getByText('Sample measure notes'))
  fireEvent.change(row.getByRole('textbox', { name: 'Budget Utilization Reporting period' }), {
    target: { value: '2026 Q4' },
  })
  fireEvent.change(row.getByRole('textbox', { name: 'Reporting scope' }), {
    target: { value: 'Fictional service A' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
  const saved = addExecutiveDocument.mock.calls.at(-1)![0]
  expect(saved.inputs).toMatchObject({
    scores: { 'budget-utilization': 125 },
    weights: { 'budget-utilization': 1 },
    observations: {
      'budget-utilization': { reportingPeriod: '2026 Q4', scope: 'Fictional service A' },
    },
  })
  expect(saved.data).toContain('125% — reporting only; excluded from readiness')
  expect(saved.data).toContain('Fictional service A')
  view.unmount()
  render(<KPIDashboardBuilder />)
  expect(
    screen.getByRole('spinbutton', { name: 'Budget Utilization reported percent' })
  ).toHaveValue(125)
  expect(screen.getByText('Period: 2026 Q4 · Scope: Fictional service A')).toBeInTheDocument()
  expect(screen.getByText('Not yet available')).toBeInTheDocument()

  let exported: Blob | undefined
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    exported = blob as Blob
    return 'blob:finance'
  })
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  try {
    fireEvent.click(screen.getByRole('button', { name: '.csv' }))
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(exported!)
    })
    const parsed = Papa.parse<string[]>(csv, { delimiter: ',', skipEmptyLines: true })
    expect(parsed.errors).toEqual([])
    const headerIndex = parsed.data.findIndex((row) => row.at(0) === 'Dimension ID')
    const headers = parsed.data.at(headerIndex)!
    const values = parsed.data
      .slice(headerIndex + 1)
      .find((row) => row.includes('Budget Utilization'))!
    const record = Object.fromEntries(headers.map((key, i) => [key, values.at(i)]))
    expect(record).toMatchObject({
      Score: '',
      'Raw worksheet value (not an assessed score)': '125',
      'Included in overall calculation': 'false',
      Scope: 'Fictional service A',
      'Reporting Period': '2026 Q4',
    })
  } finally {
    create.mockRestore()
    revoke.mockRestore()
    click.mockRestore()
  }
})
