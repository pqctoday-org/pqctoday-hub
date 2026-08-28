// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StakeholderCommsPlanner } from './StakeholderCommsPlanner'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { ExecutiveDocument } from '@/services/storage/types'
import type { RoadmapOutput } from '../types'

const baseMockData: ExecutiveModuleData = {
  threatsByIndustry: new Map(),
  criticalThreatCount: 0,
  totalThreatCount: 0,
  industryThreats: [],
  vendorsByDomain: new Map(),
  fipsValidatedCount: 0,
  pqcReadyCount: 0,
  vendorReadinessWeighted: 0,
  totalProducts: 0,
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
  vendorReadinessByDomain: new Map(),
  isAssessmentComplete: false,
  migrationDeadlineYear: null,
}

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => baseMockData,
}))

const addExecutiveDocument = vi.fn()
let mockExecutiveDocuments: ExecutiveDocument[] = []

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      addExecutiveDocument,
      artifacts: { executiveDocuments: mockExecutiveDocuments },
    }
    return selector ? selector(state) : state
  },
}))

const sampleRoadmapOutput: RoadmapOutput = {
  milestones: [{ label: 'Inventory complete', year: 2027, phaseId: 'p1' }],
  earliestYear: 2027,
}

describe('StakeholderCommsPlanner — roadmap output chaining', () => {
  beforeEach(() => {
    mockExecutiveDocuments = []
    addExecutiveDocument.mockClear()
  })

  it('renders without a roadmap banner when no output is available anywhere', () => {
    render(<StakeholderCommsPlanner />)
    expect(screen.queryByText(/roadmap milestone/i)).not.toBeInTheDocument()
  })

  it('shows the roadmap banner when roadmapOutput is passed as a live prop', () => {
    render(<StakeholderCommsPlanner roadmapOutput={sampleRoadmapOutput} />)
    expect(screen.getByText(/1 roadmap milestone from Step 1/i)).toBeInTheDocument()
  })

  it('falls back to the last saved Roadmap Builder artifact when no prop is passed', () => {
    mockExecutiveDocuments = [
      {
        id: 'migration-roadmap-1',
        moduleId: 'migration-program',
        type: 'migration-roadmap',
        title: 'PQC Migration Roadmap',
        data: '',
        createdAt: Date.now(),
        inputs: {},
        output: sampleRoadmapOutput,
      },
    ]
    render(<StakeholderCommsPlanner />)
    expect(
      screen.getByText(/1 roadmap milestone from your last Roadmap Builder export/i)
    ).toBeInTheDocument()
  })
})
