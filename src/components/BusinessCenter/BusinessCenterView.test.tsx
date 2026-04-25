// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BusinessCenterView } from './BusinessCenterView'
import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Mock Recharts to avoid canvas issues in test
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
}))

// ── Store mocks ────────────────────────────────────────────────────────

const mockAssessmentStore = {
  assessmentStatus: 'not-started' as string,
  industry: '',
  country: '',
  currentCrypto: [],
  currentCryptoCategories: [],
  cryptoUnknown: false,
  dataSensitivity: [],
  sensitivityUnknown: false,
  complianceRequirements: [],
  complianceUnknown: false,
  migrationStatus: '' as string,
  migrationUnknown: false,
  cryptoUseCases: [],
  useCasesUnknown: false,
  dataRetention: [],
  retentionUnknown: false,
  credentialLifetime: [],
  credentialLifetimeUnknown: false,
  systemCount: '',
  teamSize: '',
  cryptoAgility: '',
  agilityUnknown: false,
  infrastructure: [] as string[],
  infrastructureUnknown: false,
  infrastructureSubCategories: {},
  vendorDependency: '',
  vendorUnknown: false,
  timelinePressure: '',
  timelineUnknown: false,
  importComplianceSelection: true,
  importProductSelection: true,
  hiddenThreats: [],
  assessmentMode: null,
  currentStep: 0,
  lastResult: null,
  lastWizardUpdate: null,
  completedAt: null as string | null,
  lastModifiedAt: null,
  previousRiskScore: null,
  assessmentHistory: [],
  getInput: vi.fn(() => null),
}

vi.mock('../../store/useAssessmentStore', () => ({
  useAssessmentStore: Object.assign(
    (selector?: (s: typeof mockAssessmentStore) => unknown) =>
      selector ? selector(mockAssessmentStore) : mockAssessmentStore,
    { getState: () => mockAssessmentStore }
  ),
}))

vi.mock('../../store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      modules: {},
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
      quizMastery: { correctQuestionIds: [] },
      deleteExecutiveDocument: vi.fn(),
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('../../store/useComplianceSelectionStore', () => ({
  useComplianceSelectionStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      myFrameworks: [],
      showOnlyMine: false,
      hasSeededFromCountry: false,
      addFrameworks: vi.fn(),
      markSeededFromCountry: vi.fn(),
      toggleMyFramework: vi.fn(),
      clearMyFrameworks: vi.fn(),
      setShowOnlyMine: vi.fn(),
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('../../store/useMigrateSelectionStore', () => ({
  useMigrateSelectionStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      myProducts: [],
      hiddenProducts: [],
      activeLayer: 'All',
      activeSubCategory: 'All',
      viewMode: 'stack',
      workflowCollapsed: false,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('../../store/useMigrationWorkflowStore', () => ({
  useMigrationWorkflowStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      workflowActive: false,
      currentPhase: 'assess',
      completedPhases: [],
      startedAt: null,
      completedAt: null,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('../../store/usePersonaStore', () => ({
  usePersonaStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      selectedPersona: 'executive',
      selectedRegion: 'global',
      selectedIndustry: '',
      selectedIndustries: [],
      experienceLevel: 'curious',
      hasSeenPersonaPicker: true,
      suppressSuggestion: true,
    }
    return selector ? selector(state) : state
  },
}))

// Mock computeAssessment
vi.mock('../../hooks/assessmentUtils', () => ({
  computeAssessment: vi.fn(() => null),
}))

// Mock data loaders
vi.mock('../../data/complianceData', () => ({
  complianceFrameworks: [],
}))

vi.mock('../../data/migrateData', () => ({
  softwareData: [],
}))

vi.mock('../../components/PKILearning/moduleData', () => ({
  MODULE_CATALOG: {
    'exec-quantum-impact': { title: 'Executive Quantum Impact Briefing' },
    'pqc-business-case': { title: 'PQC Business Case' },
    'pqc-governance': { title: 'PQC Governance & Policy' },
    'pqc-risk-management': { title: 'PQC Risk Management' },
    'compliance-strategy': { title: 'Compliance & Regulatory Strategy' },
    'vendor-risk': { title: 'Vendor & Supply Chain Risk' },
  },
  MODULE_STEP_COUNTS: {
    'exec-quantum-impact': 3,
    'pqc-business-case': 3,
    'pqc-governance': 3,
    'pqc-risk-management': 3,
    'compliance-strategy': 3,
    'vendor-risk': 4,
  },
}))

// Mock ROI baselines (used by ROICalculatorSection)
vi.mock('../../data/roiBaselines', () => ({
  INDUSTRY_BREACH_BASELINES: { Other: 4_000_000 },
  FRAMEWORK_PENALTY_BASELINES: {},
  DEFAULT_FRAMEWORK_PENALTY: 2_000_000,
  INFRA_LAYER_COST: {},
  DEFAULT_INFRA_LAYER_COST: 50_000,
}))

// ── Tests ──────────────────────────────────────────────────────────────

function renderView() {
  return render(
    <MemoryRouter initialEntries={['/business']}>
      <BusinessCenterView />
    </MemoryRouter>
  )
}

describe('BusinessCenterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAssessmentStore.assessmentStatus = 'not-started'
    mockAssessmentStore.industry = ''
    mockAssessmentStore.country = ''
    mockAssessmentStore.completedAt = null
    mockAssessmentStore.complianceRequirements = []
    mockAssessmentStore.vendorDependency = ''
    mockAssessmentStore.vendorUnknown = false
    mockAssessmentStore.infrastructure = []
    mockAssessmentStore.cryptoAgility = ''
    mockAssessmentStore.migrationStatus = ''
    mockAssessmentStore.assessmentHistory = []
    mockAssessmentStore.previousRiskScore = null
    mockAssessmentStore.getInput.mockReturnValue(null)
  })

  it('renders page header with title and description', () => {
    renderView()
    // Note: 'Command Center' also appears in the WorkflowBreadcrumb; use heading role to disambiguate.
    expect(screen.getByRole('heading', { name: 'Command Center' })).toBeInTheDocument()
    expect(screen.getAllByText(/Your PQC readiness command center/)[0]).toBeInTheDocument()
  })

  it('shows welcome state when fully empty', () => {
    renderView()
    expect(screen.getByText('Welcome to your PQC Command Center')).toBeInTheDocument()
    expect(screen.getByText('Run Risk Assessment')).toBeInTheDocument()
    expect(screen.getByText('Explore Compliance')).toBeInTheDocument()
    expect(screen.getByText('Start Executive Learning')).toBeInTheDocument()
  })

  it('shows 5 CSWP.39 step sections in fixed order when assessment is in progress', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'
    mockAssessmentStore.industry = 'Technology'

    renderView()

    // Should NOT show welcome state
    expect(screen.queryByText('Welcome to your PQC Command Center')).not.toBeInTheDocument()

    // Should show all 5 CSWP.39 step titles in fixed order
    const headings = screen.getAllByRole('heading', { level: 3 })
    const stepTitles = ['Govern', 'Inventory', 'Identify Gaps', 'Prioritise', 'Implement']
    const renderedTitles = headings
      .map((h) => h.textContent ?? '')
      .filter((t) => stepTitles.some((s) => t.startsWith(s)))
    expect(renderedTitles.length).toBe(5)
    stepTitles.forEach((s, i) => {
      expect(renderedTitles[i].startsWith(s)).toBe(true)
    })

    // Cross-cuts: action items strip, cyber insurance toggle, learning bar
    expect(screen.getByText('Executive Learning Path')).toBeInTheDocument()
    expect(screen.getByText('Next Steps')).toBeInTheDocument()
    // Toggle button label appears (panel content may also use the same heading
    // when expanded — accept either).
    expect(screen.getAllByText('Cyber Insurance Lens').length).toBeGreaterThanOrEqual(1)
  })

  it('shows context banner when industry and country are set', () => {
    mockAssessmentStore.assessmentStatus = 'complete'
    mockAssessmentStore.industry = 'Finance & Banking'
    mockAssessmentStore.country = 'United States'
    mockAssessmentStore.completedAt = '2026-03-01T00:00:00.000Z'

    renderView()

    expect(screen.getByText('Finance & Banking')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()
  })

  it('shows action items for in-progress assessment', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'

    renderView()

    expect(screen.getByText('Finish your risk assessment')).toBeInTheDocument()
  })

  it('shows compact learning bar when assessment is in-progress', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'

    renderView()

    expect(screen.getByText('Executive Learning Path')).toBeInTheDocument()
    expect(screen.getByText('0/6 modules')).toBeInTheDocument()
  })

  it('renders the cross-walk badge for each CSWP.39 step', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'

    renderView()

    // Each step card shows its CSWP.39 section reference (e.g. "CSWP.39 §5.1–5.4").
    expect(screen.getAllByText(/CSWP\.39 §/).length).toBe(5)
  })

  it('shows welcome state instead of step stack when fully empty', () => {
    mockAssessmentStore.assessmentStatus = 'not-started'

    renderView()

    // When fully empty, welcome state shows (not the 5-step stack).
    expect(screen.getByText('Welcome to your PQC Command Center')).toBeInTheDocument()
    expect(screen.queryByText('Cyber Insurance Lens')).not.toBeInTheDocument()
  })
})
