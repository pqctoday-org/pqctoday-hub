// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { BusinessCenterView } from './BusinessCenterView'
import '@testing-library/jest-dom'
import { CSWP39_ZONE_DETAILS, CSWP39_ZONE_ORDER } from '@/data/cswp39ZoneData'
import { useCommandCenterOnboardingStore } from '@/store/useCommandCenterOnboardingStore'
import { BUSINESS_TOOLS } from './businessToolsRegistry'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

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
      choice: {},
      hiddenProducts: [],
      activeLayer: 'All',
      activeSubCategory: 'All',
      viewMode: 'stack',
      workflowCollapsed: false,
    }
    return selector ? selector(state) : state
  },
  // Cross-page surfaces resolve the effective selection via these; the test
  // exercises the empty-selection path, so a passthrough of myProducts suffices.
  selectedProductIds: (myProducts: string[]) => myProducts,
  useSelectedProductIds: () => [],
}))

vi.mock('../../store/useMigrationWorkflowStore', () => ({
  WORKFLOW_PHASES: [
    { id: 'assess', label: 'Risk Assessment', description: '', route: '/assess' },
    { id: 'comply', label: 'Compliance Review', description: '', route: '/compliance' },
    { id: 'migrate', label: 'Product Selection', description: '', route: '/migrate' },
    { id: 'timeline', label: 'Timeline Review', description: '', route: '/timeline' },
  ],
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

const mockPersonaStore = {
  selectedPersona: 'executive' as string | null,
  selectedRegion: 'global',
  selectedIndustry: '',
  selectedIndustries: [],
  experienceLevel: 'curious' as string | null,
  hasSeenPersonaPicker: true,
  suppressSuggestion: true,
}

vi.mock('../../store/usePersonaStore', () => ({
  usePersonaStore: (selector?: (s: typeof mockPersonaStore) => unknown) =>
    selector ? selector(mockPersonaStore) : mockPersonaStore,
}))

// Mock computeAssessment
vi.mock('../../hooks/assessmentUtils', () => ({
  computeAssessment: vi.fn(() => null),
}))

// Mock data loaders
vi.mock('../../data/complianceData', () => ({
  complianceFrameworks: [],
  complianceDB: {},
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
    mockPersonaStore.selectedPersona = 'executive'
    mockPersonaStore.experienceLevel = 'curious'
  })

  it('renders persona-aware page header for executive', () => {
    renderView()
    // Mock persona is 'executive', so the header reflects the persona-aware
    // headline + tagline from `personaConfig.ts` rather than the generic copy.
    expect(screen.getByRole('heading', { name: 'Crypto Risk — Board View' })).toBeInTheDocument()
    expect(screen.getAllByText(/Quantum-readiness scorecard/)[0]).toBeInTheDocument()
  })

  it('shows welcome state when fully empty', () => {
    renderView()
    expect(screen.getByText('Welcome to your PQC Command Center')).toBeInTheDocument()
    // First-visit primer: the four board-level questions + foregrounded top tools
    // + the secondary explore CTAs.
    expect(screen.getByText("What's at risk?")).toBeInTheDocument()
    expect(screen.getByText('What will it cost?')).toBeInTheDocument()
    expect(screen.getByText('Start with these tools')).toBeInTheDocument()
    expect(screen.getByText('Explore Compliance')).toBeInTheDocument()
    expect(screen.getByText('Start Executive Learning')).toBeInTheDocument()
  })

  it('the welcome state links to the full planning tools list', () => {
    renderView()
    const link = screen.getByRole('link', {
      name: `Browse all ${BUSINESS_TOOLS.length} planning tools →`,
    })
    expect(link).toHaveAttribute('href', '/business/tools')
  })

  it('shows a developer the engineering questions and tools, not board questions', () => {
    mockPersonaStore.selectedPersona = 'developer'
    renderView()
    expect(screen.getByText('Where is the vulnerable crypto?')).toBeInTheDocument()
    expect(screen.getByText('Does the handshake still work?')).toBeInTheDocument()
    expect(screen.queryByText('What will it cost?')).not.toBeInTheDocument()
    expect(screen.queryByText('Who owns it?')).not.toBeInTheDocument()
    expect(screen.queryByText('Start Executive Learning')).not.toBeInTheDocument()
    expect(screen.queryByText(/Watch the guided overview/)).not.toBeInTheDocument()
    expect(screen.getByText('Learn the crypto APIs')).toBeInTheDocument()
  })

  it('shows a researcher the four research questions mapped to existing pages, not board questions', () => {
    mockPersonaStore.selectedPersona = 'researcher'
    renderView()
    const expected: [string, string][] = [
      ['What changed in the standards?', '/library?qv=new&sort=newest'],
      ['Can I reproduce it?', '/playground/drbg-demo'],
      ['How sure is the threat timeline?', '/threats'],
      ['Who holds the patents?', '/patents'],
    ]
    for (const [q, href] of expected) {
      expect(screen.getByText(q).closest('a')).toHaveAttribute('href', href)
    }
    expect(screen.queryByText('What will it cost?')).not.toBeInTheDocument()
    expect(screen.queryByText('Who owns it?')).not.toBeInTheDocument()
    expect(screen.queryByText('Start Executive Learning')).not.toBeInTheDocument()
    expect(screen.queryByText(/Watch the guided overview/)).not.toBeInTheDocument()
    expect(screen.getByText('Read the revision log')).toBeInTheDocument()
    // The tool row is the researcher's own sequence, not the ROI-first generic one.
    expect(screen.getByText('CRQC Scenario Planner')).toBeInTheDocument()
    expect(screen.queryByText('ROI Calculator')).not.toBeInTheDocument()
    // The evidence bundle is offered even with nothing saved.
    expect(screen.getByTestId('evidence-bundle-download')).toHaveTextContent(
      'Download evidence bundle'
    )
    // The research workspace sits under it.
    expect(screen.getByTestId('research-workspace')).toBeInTheDocument()
  })

  it('offers the evidence bundle only to the researcher', () => {
    mockPersonaStore.selectedPersona = 'developer'
    renderView()
    expect(screen.queryByTestId('evidence-bundle')).not.toBeInTheDocument()
    expect(screen.queryByTestId('research-workspace')).not.toBeInTheDocument()
  })

  it('shows the 6 CSWP.39 Fig 3 zones in fixed order when assessment is in progress', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'
    mockAssessmentStore.industry = 'Technology'

    renderView()

    // Should NOT show welcome state
    expect(screen.queryByText('Welcome to your PQC Command Center')).not.toBeInTheDocument()

    // Should show all 6 zone titles in fixed Fig 3 order. Both the diagram
    // (CommandCenterStrategicPlan) and the per-zone panels render headings
    // for each zone, so we filter unique zone titles in order.
    const headings = screen.getAllByRole('heading', { level: 3 })
    const zoneTitles = [
      'Governance',
      'Assets',
      'Management Tools',
      'Data-Centric Risk Management',
      'Mitigation',
      'Migration',
    ]
    const renderedTitles = headings
      .map((h) => h.textContent ?? '')
      .filter((t) => zoneTitles.some((z) => t.startsWith(z)))
    // Each zone title may appear multiple times (diagram tile + panel header),
    // so confirm at least 6 matches and that all 6 zones are represented.
    expect(renderedTitles.length).toBeGreaterThanOrEqual(6)
    for (const zone of zoneTitles) {
      expect(renderedTitles.some((t) => t.startsWith(zone))).toBe(true)
    }

    // Cross-cuts: action items strip + learning bar
    expect(screen.getByText('Executive Learning Path')).toBeInTheDocument()
    expect(screen.getByText('Your next steps')).toBeInTheDocument()
  })

  it('renders the Fig 3 strategic plan diagram heading', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'

    renderView()

    expect(screen.getByText('CSWP.39 Crypto Agility Strategic Plan')).toBeInTheDocument()
    expect(screen.getByText(/Crypto Agility \(iterative loop\)/)).toBeInTheDocument()
  })

  it('shows context banner when industry and country are set', () => {
    mockAssessmentStore.assessmentStatus = 'complete'
    mockAssessmentStore.industry = 'Finance & Banking'
    mockAssessmentStore.country = 'United States'
    mockAssessmentStore.completedAt = '2026-03-01T00:00:00.000Z'

    renderView()

    // Industry + country render in two places: the top context banner AND the
    // GovernanceWire's Business Requirements chips. Both should be present.
    expect(screen.getAllByText('Finance & Banking').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('United States').length).toBeGreaterThanOrEqual(1)
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

  it('renders a §-reference chip on each zone panel', () => {
    mockAssessmentStore.assessmentStatus = 'in-progress'
    // §-ref chips are only shown at intermediate/advanced density.
    // Use developer persona with no experienceLevel override to get advanced density.
    mockPersonaStore.selectedPersona = 'developer'
    mockPersonaStore.experienceLevel = null

    renderView()

    // Each zone panel header shows a "NIST CSWP.39 §..." or "NIST CSWP.39 Fig.3 ..."
    // chip from CSWP39_ZONE_DETAILS[zone].cswpRef. There are six zones, so at least
    // six such chips render in the panel stack below the diagram. (Assets cites
    // Fig.3 per audit M3 — paper has no §5.2 anchor for the Assets element.)
    const refs = screen.getAllByText(/^NIST CSWP\.39 /)
    expect(refs.length).toBeGreaterThanOrEqual(6)
  })

  it('shows welcome state instead of step stack when fully empty', () => {
    mockAssessmentStore.assessmentStatus = 'not-started'

    renderView()

    // When fully empty, welcome state shows (not the §3-§6 section stack).
    expect(screen.getByText('Welcome to your PQC Command Center')).toBeInTheDocument()
  })

  // Mobile UX layer (Phase 8). BusinessCenterView takes no simEmbed-style
  // prop and is never rendered inside the simulation, so unlike Threats/
  // Library/Compliance/Migrate/Assess/Report this needs only the
  // isMobileShell check, no second guard.
  describe('mobile shell guard', () => {
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('renders the mobile screen when isMobileShell is true', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderView()
      // "bc-dashboard-ready" wraps desktop's entire return (both the
      // welcome state and the tiered dashboard) — its absence is the real
      // discriminator, since both branches otherwise share real copy
      // ("Welcome to your PQC Command Center") with the mobile screen's own
      // empty state.
      expect(screen.queryByTestId('bc-dashboard-ready')).not.toBeInTheDocument()
    })
  })
})

// Shows the router's current search string so a test can check the URL.
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

describe('BusinessCenterView ?zone= deep link', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom has no layout engine; the deep link scrolls the zone into view.
    Element.prototype.scrollIntoView = vi.fn()
    mockAssessmentStore.assessmentStatus = 'in-progress'
    mockAssessmentStore.industry = 'Technology'
    mockPersonaStore.selectedPersona = 'executive'
    mockPersonaStore.experienceLevel = 'curious'
  })

  function renderAt(url: string) {
    return render(
      <MemoryRouter initialEntries={[url]}>
        <BusinessCenterView />
        <LocationProbe />
      </MemoryRouter>
    )
  }

  it('opens the deep-linked zone, then lets the user switch to another zone', () => {
    renderAt('/business?zone=mitigation')

    // The linked zone opens on arrival.
    expect(screen.getByRole('button', { name: 'Collapse Mitigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Governance' })).toBeInTheDocument()

    // Selecting another zone moves the open zone; the deep link no longer pins it.
    fireEvent.click(screen.getByRole('button', { name: 'Expand Governance' }))
    expect(screen.getByRole('button', { name: 'Collapse Governance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Mitigation' })).toBeInTheDocument()
  })

  it('lets the user collapse the deep-linked zone', () => {
    renderAt('/business?zone=governance')

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Governance' }))
    expect(screen.getByRole('button', { name: 'Expand Governance' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Collapse / })).not.toBeInTheDocument()
  })

  it('removes zone from the URL and keeps other query params', () => {
    renderAt('/business?foo=bar&zone=assets')

    expect(screen.getByTestId('location-search')).not.toHaveTextContent('zone=')
    expect(screen.getByTestId('location-search')).toHaveTextContent('foo=bar')
    expect(screen.getByRole('button', { name: 'Collapse Assets' })).toBeInTheDocument()
  })
})

// An empty profile (nothing saved, not started) that arrives on a zone link, or
// that opens the zone map on purpose, sees the zone map rather than only the
// welcome screen.
describe('BusinessCenterView empty profile with zone links', () => {
  const WELCOME = 'Welcome to your PQC Command Center'

  function renderEmptyAt(url: string) {
    return render(
      <MemoryRouter initialEntries={[url]}>
        <BusinessCenterView />
        <LocationProbe />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
    mockAssessmentStore.assessmentStatus = 'not-started'
    mockAssessmentStore.industry = ''
    mockAssessmentStore.country = ''
    mockAssessmentStore.completedAt = null
    mockPersonaStore.selectedPersona = 'executive'
    mockPersonaStore.experienceLevel = 'curious'
    useCommandCenterOnboardingStore.setState({ hasSeenExecWalkthrough: true })
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('shows the zone map with the linked zone open for ?zone= on an empty profile', () => {
    renderEmptyAt('/business?zone=mitigation')

    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Mitigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Governance' })).toBeInTheDocument()
  })

  it('keeps the zone map after ?zone= is stripped from the URL', () => {
    renderEmptyAt('/business?zone=mitigation')

    // The param is removed by the page; the map and the open zone stay.
    expect(screen.getByTestId('location-search')).not.toHaveTextContent('zone=')
    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Mitigation' })).toBeInTheDocument()
  })

  it('shows the zone map with the linked zone open for a #zone- hash on an empty profile', () => {
    window.history.replaceState(null, '', '/business#zone-mitigation')
    renderEmptyAt('/business#zone-mitigation')

    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Mitigation' })).toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('maps a legacy #step- hash to its zone on an empty profile', () => {
    window.history.replaceState(null, '', '/business#step-implement')
    renderEmptyAt('/business#step-implement')

    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Migration' })).toBeInTheDocument()
  })

  it('keeps the welcome screen for a zone link that names no real zone', () => {
    window.history.replaceState(null, '', '/business#zone-nonsense')
    renderEmptyAt('/business?zone=bogus')

    expect(screen.getByText(WELCOME)).toBeInTheDocument()
  })

  it('shows the welcome screen with no link, and "Explore the six zones" shows the six zones', () => {
    renderEmptyAt('/business')

    expect(screen.getByText(WELCOME)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Explore the six zones' }))

    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
    for (const zone of CSWP39_ZONE_ORDER) {
      // eslint-disable-next-line security/detect-object-injection -- zone is a ZoneId, a closed union
      const title = CSWP39_ZONE_DETAILS[zone].title
      expect(
        screen.getByRole('button', {
          name: (name) => name === `Expand ${title}` || name === `Collapse ${title}`,
        })
      ).toBeInTheDocument()
    }
  })

  it('still switches zones after the map has been opened from the welcome screen', () => {
    renderEmptyAt('/business')
    fireEvent.click(screen.getByRole('button', { name: 'Explore the six zones' }))

    // An executive's lens opens Governance by default; a click moves the open zone.
    expect(screen.getByRole('button', { name: 'Collapse Governance' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Assets' }))
    expect(screen.getByRole('button', { name: 'Collapse Assets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Governance' })).toBeInTheDocument()
  })

  it('still switches zones after a ?zone= link opened the map', () => {
    renderEmptyAt('/business?zone=mitigation')

    fireEvent.click(screen.getByRole('button', { name: 'Expand Governance' }))
    expect(screen.getByRole('button', { name: 'Collapse Governance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Mitigation' })).toBeInTheDocument()
  })

  it('the walkthrough jump link reveals the zone map on an empty profile', () => {
    useCommandCenterOnboardingStore.setState({ hasSeenExecWalkthrough: false })
    renderEmptyAt('/business')

    fireEvent.click(
      screen.getByRole('button', { name: 'jump straight to the full zone map below' })
    )

    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
    // The executive's lens zone (Governance) is the one that opens.
    expect(screen.getByRole('button', { name: 'Collapse Governance' })).toBeInTheDocument()
  })
})

// Which zone opens on arrival follows the role's own lens (lib/lensZone.ts),
// at any density. Curious, or no role, opens Assets. A switch of role moves the
// open zone, and the footer names the zone that opens.
describe('BusinessCenterView open zone by role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
    mockAssessmentStore.assessmentStatus = 'in-progress'
    mockAssessmentStore.industry = 'Technology'
    mockPersonaStore.selectedPersona = 'executive'
    mockPersonaStore.experienceLevel = null
  })

  function renderAt(url = '/business') {
    return render(
      <MemoryRouter initialEntries={[url]}>
        <BusinessCenterView />
        <LocationProbe />
      </MemoryRouter>
    )
  }

  const openTitles = () =>
    CSWP39_ZONE_ORDER.filter((z) =>
      screen.queryByRole('button', { name: `Collapse ${CSWP39_ZONE_DETAILS[z].title}` })
    ).map((z) => CSWP39_ZONE_DETAILS[z].title)

  it('an executive opens Governance at basic density', () => {
    mockPersonaStore.experienceLevel = 'curious'
    renderAt()
    expect(openTitles()).toEqual(['Governance'])
  })

  it('an executive still opens Governance at advanced density', () => {
    mockPersonaStore.experienceLevel = 'expert'
    renderAt()
    expect(openTitles()).toEqual(['Governance'])
  })

  it('a developer opens Migration, the zone of their lens', () => {
    mockPersonaStore.selectedPersona = 'developer'
    mockPersonaStore.experienceLevel = null
    renderAt()
    expect(openTitles()).toEqual(['Migration'])
  })

  it('curious opens Assets', () => {
    mockPersonaStore.selectedPersona = 'curious'
    mockPersonaStore.experienceLevel = 'curious'
    renderAt()
    expect(openTitles()).toEqual(['Assets'])
  })

  it('no role picked opens Assets', () => {
    mockPersonaStore.selectedPersona = null
    mockPersonaStore.experienceLevel = null
    renderAt()
    expect(openTitles()).toEqual(['Assets'])
  })

  it('switching role moves the open zone to the new role default', () => {
    mockPersonaStore.selectedPersona = 'executive'
    mockPersonaStore.experienceLevel = null
    const { rerender } = renderAt()
    expect(openTitles()).toEqual(['Governance'])

    mockPersonaStore.selectedPersona = 'ops'
    rerender(
      <MemoryRouter initialEntries={['/business']}>
        <BusinessCenterView />
        <LocationProbe />
      </MemoryRouter>
    )
    expect(openTitles()).toEqual(['Migration'])
  })

  it('the footer names the zone that opens for the role', () => {
    mockPersonaStore.selectedPersona = 'executive'
    renderAt()
    expect(screen.getByText(/Your executive lens/).closest('div')).toHaveTextContent(
      `opens the ${CSWP39_ZONE_DETAILS.governance.title} zone`
    )
    expect(openTitles()).toEqual([CSWP39_ZONE_DETAILS.governance.title])
  })

  it('a zone deep link still opens its zone on arrival, over the role default', () => {
    mockPersonaStore.selectedPersona = 'executive'
    renderAt('/business?zone=mitigation')
    expect(openTitles()).toEqual(['Mitigation'])
  })
})
