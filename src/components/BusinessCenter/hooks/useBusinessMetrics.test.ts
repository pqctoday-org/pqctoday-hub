// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// ── Store mocks (kept minimal — only what the hook reads) ────────────────
// vi.mock factories are hoisted above all top-level code, so we keep the
// mutable mock state inside getter-based hoist-safe variables.

const mockAssessmentStore = {
  industry: 'Finance & Banking',
  country: 'Australia',
  complianceRequirements: [] as string[],
  migrationStatus: '',
  vendorDependency: '',
  cryptoAgility: '',
  vendorUnknown: false,
  infrastructure: [] as string[],
  assessmentStatus: 'complete' as string,
  assessmentHistory: [] as { completedAt: string; riskScore: number; categoryScores?: unknown }[],
  previousRiskScore: null as number | null,
  completedAt: '2026-05-10T00:00:00.000Z',
  getInput: vi.fn(() => null),
}

const mockComplianceStore = {
  myFrameworks: [] as string[],
}

const mockPersonaStore = {
  selectedPersona: 'executive' as string | null,
  selectedRegion: 'apac' as string,
}

vi.mock('@/store/useAssessmentStore', () => ({
  useAssessmentStore: Object.assign(
    (selector?: (s: typeof mockAssessmentStore) => unknown) =>
      selector ? selector(mockAssessmentStore) : mockAssessmentStore,
    { getState: () => mockAssessmentStore }
  ),
}))

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({
    modules: {},
    artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
    quizMastery: { correctQuestionIds: [] },
  }),
}))

vi.mock('@/store/useComplianceSelectionStore', () => ({
  useComplianceSelectionStore: () => mockComplianceStore,
}))

vi.mock('@/store/useMigrateSelectionStore', () => ({
  useMigrateSelectionStore: () => ({ myProducts: [] }),
}))

vi.mock('@/store/useMigrationWorkflowStore', () => ({
  useMigrationWorkflowStore: () => ({ workflowActive: false, completedPhases: [] }),
}))

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: () => mockPersonaStore,
}))

vi.mock('@/hooks/assessmentUtils', () => ({
  computeAssessment: vi.fn(() => null),
}))

// Realistic mini compliance set covering the three jurisdictions in play in the
// Australia-Finance bug screenshot, plus the AU-specific ASD ISM. Inlined into
// the mock factory because vi.mock is hoisted above any top-level fixture.
vi.mock('@/data/complianceData', () => {
  const fixtureFrameworks = [
    {
      id: 'NIS2',
      label: 'NIS2 Directive',
      description: '',
      industries: ['Finance & Banking', 'Energy & Utilities', 'Healthcare'],
      countries: ['European Union'],
      requiresPQC: true,
      deadline: '2030',
      enforcementBody: 'ENISA',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'regulatory',
      naicsCodes: [],
      cswp39Tags: [],
    },
    {
      id: 'ANSSI',
      label: 'ANSSI',
      description: '',
      industries: ['Finance & Banking'],
      countries: ['France'],
      requiresPQC: true,
      deadline: '2030',
      enforcementBody: 'ANSSI',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'regulatory',
      naicsCodes: [],
      cswp39Tags: [],
    },
    {
      id: 'CNSA-2',
      label: 'CNSA 2.0',
      description: '',
      industries: ['Government & Defense'],
      countries: ['United States'],
      requiresPQC: true,
      deadline: '2030',
      enforcementBody: 'NSA',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'regulatory',
      naicsCodes: [],
      cswp39Tags: [],
    },
    {
      id: 'ASD-ISM',
      label: 'ASD ISM',
      description: '',
      industries: ['Finance & Banking', 'Government & Defense'],
      countries: ['Australia'],
      requiresPQC: true,
      deadline: '2030',
      enforcementBody: 'ASD',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'regulatory',
      naicsCodes: [],
      cswp39Tags: [],
    },
  ]
  return { complianceFrameworks: fixtureFrameworks }
})

vi.mock('@/data/migrateData', () => ({ softwareData: [] }))

vi.mock('@/components/PKILearning/moduleData', () => ({
  MODULE_CATALOG: {},
  MODULE_STEP_COUNTS: {},
}))

// Deterministic applicability stub keyed off country/industry membership. The
// real engine has its own test suite; here we exercise the hook's wiring.
vi.mock('@/utils/applicabilityEngine', async () => {
  const data = await import('@/data/complianceData')
  return {
    applicableFrameworks: (profile: { country: string | null; industry: string | null }) => {
      if (!profile.country || !profile.industry) return []
      return data.complianceFrameworks
        .map((fw) => {
          const countryMatch = fw.countries.includes(profile.country!)
          const industryMatch =
            fw.industries.length === 0 || fw.industries.includes(profile.industry!)
          if (countryMatch && industryMatch) {
            return {
              item: fw,
              tier: 'mandatory' as const,
              reason: `Your regulator: ${fw.enforcementBody}`,
            }
          }
          return null
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
    },
  }
})

// ── Subject under test (imported AFTER mocks) ────────────────────────────
import { useBusinessMetrics } from './useBusinessMetrics'

describe('useBusinessMetrics — applicability wiring', () => {
  beforeEach(() => {
    mockAssessmentStore.industry = 'Finance & Banking'
    mockAssessmentStore.country = 'Australia'
    mockAssessmentStore.complianceRequirements = []
    mockComplianceStore.myFrameworks = []
  })

  it('auto-includes Mandatory frameworks for the user context even without explicit stars', () => {
    const { result } = renderHook(() => useBusinessMetrics())
    const ids = result.current.trackedFrameworks.map((f) => f.id)
    expect(ids).toContain('ASD-ISM')
    const asd = result.current.trackedFrameworks.find((f) => f.id === 'ASD-ISM')
    expect(asd?.applicability?.tier).toBe('mandatory')
    expect(asd?.applicability?.reason).toMatch(/Your regulator: ASD/)
    expect(asd?.source).toBe('auto-mandatory')
  })

  it('keeps user-starred frameworks but tags non-applicable ones with applicability=null', () => {
    mockComplianceStore.myFrameworks = ['CNSA-2'] // user starred a US-only framework
    const { result } = renderHook(() => useBusinessMetrics())
    const cnsa = result.current.trackedFrameworks.find((f) => f.id === 'CNSA-2')
    expect(cnsa).toBeDefined()
    expect(cnsa?.applicability).toBeNull()
    expect(cnsa?.source).toBe('compliance')
  })

  it('matches assess-store labels (not just ids) when joining frameworks', () => {
    // /assess stores labels via toggleCompliance(fw.label); the previous filter
    // matched only by id, silently dropping assess-side entries.
    mockAssessmentStore.complianceRequirements = ['NIS2 Directive']
    const { result } = renderHook(() => useBusinessMetrics())
    const nis2 = result.current.trackedFrameworks.find((f) => f.id === 'NIS2')
    expect(nis2).toBeDefined()
    expect(nis2?.source).toBe('assess')
  })

  it('returns empty applicability when no business context is set', () => {
    mockAssessmentStore.industry = ''
    mockAssessmentStore.country = ''
    mockComplianceStore.myFrameworks = ['CNSA-2']
    const { result } = renderHook(() => useBusinessMetrics())
    const cnsa = result.current.trackedFrameworks.find((f) => f.id === 'CNSA-2')
    expect(cnsa?.applicability).toBeNull()
    const auto = result.current.trackedFrameworks.find((f) => f.source === 'auto-mandatory')
    expect(auto).toBeUndefined()
  })
})
