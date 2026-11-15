// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { daysUntilDeadlineYearEnd } from './useBusinessMetrics'

// Deadline strings below follow the shapes in the compliance data. Years are
// built from the current year so the assertions hold in any year the test runs.
const Y = new Date().getFullYear()

vi.mock('@/data/complianceData', () => {
  const Y = new Date().getFullYear()
  const base = {
    description: '',
    industries: [],
    countries: [],
    requiresPQC: true,
    enforcementBody: '',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'regulatory',
    naicsCodes: [],
    cswp39Tags: [],
  }
  return {
    complianceFrameworks: [
      { ...base, id: 'ASD-ISM', label: 'ASD ISM', deadline: '2030 (ISM-1917 effective ...)' },
      {
        ...base,
        id: 'CNSA-2',
        label: 'CNSA 2.0',
        deadline: `${Y + 1} (NSS begin); ${Y + 4} (web); ${Y + 5} (all)`,
      },
      { ...base, id: 'CRYPTREC', label: 'CRYPTREC', deadline: 'Ongoing (GL-2007-2024)' },
      {
        ...base,
        id: 'NIST-NCCOE-PQC',
        label: 'NCCoE',
        deadline: 'Ongoing (SP 1800-38 ...)',
      },
      { ...base, id: 'BSI-TR-02102', label: 'BSI TR-02102', deadline: 'Ongoing (v2026-01 update)' },
      { ...base, id: 'GSMA-NG116', label: 'GSMA NG.116', deadline: `${Y}-${Y + 2}` },
      {
        ...base,
        id: 'OSFI-B13-PQC',
        label: 'OSFI B-13',
        deadline: `${Y - 1} (B-13 effective), PQC alignment expected by ${Y + 4}`,
      },
      { ...base, id: 'CURRENT-YEAR', label: 'Current year', deadline: `${Y}` },
      { ...base, id: 'PAST-YEAR', label: 'Past year', deadline: `${Y - 1}` },
    ],
  }
})

vi.mock('@/data/migrateData', () => ({ softwareData: [] }))

vi.mock('@/components/PKILearning/moduleData', () => ({
  MODULE_CATALOG: {},
  MODULE_STEP_COUNTS: {},
}))

vi.mock('@/hooks/useThreatsData', () => ({
  useThreatsData: () => ({ data: [], loading: false, error: null }),
}))

const mockComplianceStore = { myFrameworks: [] as string[] }

vi.mock('@/store/useComplianceSelectionStore', () => ({
  useComplianceSelectionStore: () => mockComplianceStore,
}))

vi.mock('@/store/useAssessmentStore', () => {
  const state = {
    industry: '',
    country: '',
    complianceRequirements: [] as string[],
    migrationStatus: '',
    vendorDependency: '',
    cryptoAgility: '',
    vendorUnknown: false,
    infrastructure: [] as string[],
    assessmentStatus: 'not-started',
    assessmentHistory: [],
    previousRiskScore: null,
    completedAt: null,
    getInput: () => null,
  }
  return {
    useAssessmentStore: Object.assign(
      (selector?: (s: typeof state) => unknown) => (selector ? selector(state) : state),
      {
        getState: () => state,
      }
    ),
  }
})

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({
    modules: {},
    artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
    quizMastery: { correctQuestionIds: [] },
  }),
}))

vi.mock('@/store/useMigrateSelectionStore', () => ({
  useMigrateSelectionStore: () => ({ myProducts: [], choice: {} }),
  selectedProductIds: (myProducts: string[]) => myProducts,
}))

vi.mock('@/store/useMigrationWorkflowStore', () => ({
  useMigrationWorkflowStore: () => ({ workflowActive: false, completedPhases: [] }),
}))

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: () => ({
    selectedPersona: 'executive',
    selectedRegion: 'global',
    selectedIndustry: '',
    selectedIndustries: [],
    experienceLevel: 'curious',
  }),
}))

vi.mock('@/hooks/assessmentUtils', () => ({
  computeAssessment: vi.fn(() => null),
}))

vi.mock('@/utils/applicabilityEngine', () => ({
  applicableFrameworks: () => [],
}))

import { useBusinessMetrics } from './useBusinessMetrics'

const DAY_MS = 1000 * 60 * 60 * 24

describe('daysUntilDeadlineYearEnd', () => {
  it('counts to 31 December of the deadline year', () => {
    // 14 Nov (noon) in the deadline year: about seven weeks to the year end.
    const now = new Date(2026, 10, 14, 12, 0, 0)
    expect(daysUntilDeadlineYearEnd(2026, now)).toBe(47)
  })

  it('never goes negative while the deadline year is running', () => {
    expect(daysUntilDeadlineYearEnd(2026, new Date(2026, 0, 1, 0, 0, 0))).toBeGreaterThan(0)
    expect(daysUntilDeadlineYearEnd(2026, new Date(2026, 11, 31, 23, 0, 0))).toBeGreaterThanOrEqual(
      0
    )
  })

  it('goes negative once the deadline year has ended', () => {
    const now = new Date(2027, 0, 2, 0, 0, 0)
    expect(daysUntilDeadlineYearEnd(2026, now)).toBeLessThan(0)
  })
})

describe('useBusinessMetrics deadline parsing', () => {
  beforeEach(() => {
    mockComplianceStore.myFrameworks = [
      'ASD-ISM',
      'CNSA-2',
      'CRYPTREC',
      'NIST-NCCOE-PQC',
      'BSI-TR-02102',
      'GSMA-NG116',
      'OSFI-B13-PQC',
      'CURRENT-YEAR',
      'PAST-YEAR',
    ]
  })

  function trackedById() {
    const { result } = renderHook(() => useBusinessMetrics())
    return new Map(result.current.trackedFrameworks.map((f) => [f.id, f]))
  }

  it('reads a single stated year (ASD-ISM) and counts to the end of it', () => {
    const fw = trackedById().get('ASD-ISM')!
    expect(fw.daysUntilDeadline).toBeGreaterThan(0)
    // Days to 1 Jan of the year after 2030, measured from now.
    const expected = Math.floor((new Date(2031, 0, 1).getTime() - Date.now()) / DAY_MS)
    expect(Math.abs((fw.daysUntilDeadline ?? 0) - expected)).toBeLessThanOrEqual(1)
  })

  it('takes the next stated milestone (CNSA-2), not the last one', () => {
    const fw = trackedById().get('CNSA-2')!
    const nextYearEnd = Math.floor((new Date(Y + 2, 0, 1).getTime() - Date.now()) / DAY_MS)
    expect(Math.abs((fw.daysUntilDeadline ?? 0) - nextYearEnd)).toBeLessThanOrEqual(1)
    expect(fw.urgency).toBe('critical')
  })

  it.each(['CRYPTREC', 'NIST-NCCOE-PQC', 'BSI-TR-02102'])(
    'gives no year to an "Ongoing (...)" row (%s)',
    (id) => {
      const fw = trackedById().get(id)!
      expect(fw.daysUntilDeadline).toBeNull()
      expect(fw.urgency).toBe('unknown')
    }
  )

  it('treats a year range as its start year when it begins this year (GSMA-NG116)', () => {
    const fw = trackedById().get('GSMA-NG116')!
    expect(fw.daysUntilDeadline).toBeGreaterThan(0)
    expect(fw.urgency).toBe('critical')
  })

  it('uses the next stated year for a note that starts with a past year (OSFI-B13)', () => {
    const fw = trackedById().get('OSFI-B13-PQC')!
    const expected = Math.floor((new Date(Y + 5, 0, 1).getTime() - Date.now()) / DAY_MS)
    expect(Math.abs((fw.daysUntilDeadline ?? 0) - expected)).toBeLessThanOrEqual(1)
    expect(fw.urgency).toBe('safe')
  })

  it('keeps a deadline in the current year counting down, not negative', () => {
    const fw = trackedById().get('CURRENT-YEAR')!
    expect(fw.daysUntilDeadline).toBeGreaterThan(0)
  })

  it('reports a year that has ended as zero or negative days', () => {
    const fw = trackedById().get('PAST-YEAR')!
    expect(fw.daysUntilDeadline).toBeLessThanOrEqual(0)
  })
})
