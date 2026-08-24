// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ComplianceView } from './ComplianceView'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { logComplianceFilter } from '@/utils/analytics'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// Mock the services module
vi.mock('./services', () => ({
  useComplianceRefresh: () => ({
    data: [
      {
        id: 'fips-1',
        type: 'FIPS 140-3',
        vendor: 'Acme Corp',
        moduleName: 'Acme Crypto Module',
        level: '3',
        status: 'Active',
        certNumber: 'FIPS-001',
        source: 'NIST',
        pqcReady: true,
        algorithms: ['ML-KEM-768'],
        reportUrl: 'https://example.com/fips-001',
      },
      {
        id: 'acvp-1',
        type: 'ACVP',
        vendor: 'Test Labs',
        moduleName: 'Test Crypto',
        level: '',
        status: 'Active',
        certNumber: 'ACVP-100',
        source: 'NIST',
        pqcReady: false,
        algorithms: ['AES-256'],
        reportUrl: '',
      },
      {
        id: 'cc-1',
        type: 'Common Criteria',
        vendor: 'EU Vendor',
        moduleName: 'EU HSM',
        level: 'EAL4+',
        status: 'Active',
        certNumber: 'CC-500',
        source: 'CC Portal',
        pqcReady: false,
        algorithms: ['RSA-2048'],
        reportUrl: '',
      },
    ],
    loading: false,
    error: null,
    lastUpdated: new Date('2026-02-17'),
    refresh: vi.fn(),
    enrichRecord: vi.fn(),
  }),
  AUTHORITATIVE_SOURCES: {
    FIPS: 'https://csrc.nist.gov/fips',
    ACVP: 'https://csrc.nist.gov/acvp',
    CC: 'https://www.commoncriteriaportal.org/',
    ANSSI: 'https://cyber.gouv.fr/',
    BSI: 'https://www.bsi.bund.de/',
  },
}))

// Mock the ComplianceTable and MobileComplianceView to avoid testing complex internals here
vi.mock('./ComplianceTable', () => ({
  ComplianceTable: ({
    data,
    selectedRecordId,
  }: {
    data: { id: string }[]
    onRefresh: () => void
    isRefreshing: boolean
    lastUpdated: Date | null
    onEnrich?: (id: string) => void
    selectedRecordId?: string
  }) => (
    <div data-testid="compliance-table">
      Table ({data.length} records){selectedRecordId ? ` · selected: ${selectedRecordId}` : ''}
    </div>
  ),
}))

vi.mock('./MobileComplianceView', () => ({
  MobileComplianceView: ({ data }: { data: { id: string }[] }) => (
    <div data-testid="mobile-compliance-view">Mobile ({data.length} records)</div>
  ),
}))

// Mock analytics — keep this surface small and explicit so we notice when a
// new caller is added. If a referenced symbol is missing, the failing test
// names it in the stack and you add it here.
vi.mock('../../utils/analytics', () => ({
  logComplianceFilter: vi.fn(),
  logPreviewBannerShown: vi.fn(),
  logPreviewBannerDismissed: vi.fn(),
}))

// Mock share/glossary buttons
vi.mock('../ui/ShareButton', () => ({
  ShareButton: () => <Button>Share</Button>,
}))
vi.mock('../ui/GlossaryButton', () => ({
  GlossaryButton: () => <Button>Glossary</Button>,
}))
vi.mock('../ui/UserManualButton', () => ({
  UserManualButton: () => <Button>Guide</Button>,
}))

describe('ComplianceView', () => {
  // Render-only "page-title" and "description text" smoke tests deleted —
  // they only asserted that static copy strings appear in the DOM after
  // mount, paid the full ComplianceView mount cost (eager imports of
  // maturityGovernanceData + complianceData + the RAG-corpus init chain),
  // and caught no behaviour. Copy assertions belong in E2E specs; mount-
  // doesn't-crash is implicitly verified by every interaction test below.

  beforeEach(() => {
    window.localStorage.clear()
    vi.mocked(logComplianceFilter).mockClear()
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
  })

  it('lands on the Rules & Standards register, not the catalogue', () => {
    // The register answers "which rules bind me, and why" on arrival. Every
    // other tab asks the visitor to filter 197 rows until relevance falls out,
    // which is what the default used to do.
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    const selected = screen.getAllByRole('tab', { selected: true })
    expect(selected.length).toBeGreaterThan(0)
    expect(selected[0]).toHaveTextContent(/Rules & Standards/i)
  }, 15000)

  // ── Scope comes from the top bar ────────────────────────────────────────
  //
  // These pin the 2026-08-11 fix. The whole defect class here is "renders, but
  // wired to nothing", which every existing test passed straight through: the
  // page read the persona store in a `useState` INITIALIZER, so it snapshotted
  // the scope at mount and never heard about it again. A reader could switch
  // persona in the top bar, watch the chip change, and see the page keep
  // saying "Global / any" with an empty register underneath.

  it('takes its sector from the top bar rather than asking again', () => {
    usePersonaStore.setState({ selectedIndustries: ['Finance & Banking'] })
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    // The sector is shown, not offered — the page used to render its own picker
    // over an uncurated vocabulary read straight off the CSV (raw NAICS codes
    // '22'/'48'/'52' beside duplicate synonyms), competing with the top bar's
    // curated list for the same concept.
    expect(screen.getByText(/Finance & Banking/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Sector:/i })).not.toBeInTheDocument()
  }, 15000)

  it('follows the top bar AFTER mount, not just on it', () => {
    // THE regression. Setting scope before render passes even with the old
    // initializer, so a test that only did that proves nothing — the store has
    // to change while the page is already up.
    usePersonaStore.setState({ selectedIndustries: [] })
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.queryByText(/Healthcare/i)).not.toBeInTheDocument()

    act(() => {
      usePersonaStore.setState({ selectedIndustries: ['Healthcare'] })
    })
    expect(screen.getByText(/Healthcare/i)).toBeInTheDocument()
  }, 15000)

  it('offers exactly one scope control on the page — Country', () => {
    // Country stays here because the top bar carries a region BLOC and has no
    // country, and the tier engine needs one. Everything else that used to
    // filter on this page is gone: the duplicate Country/Sector pair inside the
    // empty-state card, and the free-floating trust-tier box above the tabs.
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('button', { name: /^Country:/i })).toHaveLength(1)
    expect(screen.queryByText(/Trust tier/i)).not.toBeInTheDocument()
  }, 15000)

  it('keeps a ?cert= deep link on Product Records', () => {
    // Regression: the URL->state sync effect hardcoded a 'standards' default and
    // runs on mount, so it overwrote the initializer's correct 'records' choice
    // and `/compliance?cert=` landed on Landscape with the record nowhere on
    // screen. simTree.p6/p7 depend on these links.
    render(
      <MemoryRouter initialEntries={['/compliance?cert=A7285']}>
        <ComplianceView />
      </MemoryRouter>
    )
    const selected = screen.getAllByRole('tab', { selected: true })
    expect(selected[0]).toHaveTextContent(/Product Records/i)
  }, 15000)

  it('no longer stacks onboarding chrome above the tab bar', () => {
    // The About strip, persona hint and deadline dot-plot used to render here.
    // Their content did not disappear: the glossary is a page-header button and
    // the deadlines have their own tab. Only the stack is gone.
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.queryByText(/New to PQC compliance\?/i)).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('compliance-about-strip')).toHaveLength(0)
    expect(screen.queryByTestId('deadline-timeline-narrative')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /Go to Certification Schemes/i })).toHaveLength(
      0
    )
  }, 15000)

  it('shows cert records table when Records tab is clicked', () => {
    // 15s timeout: mounting ComplianceView pulls in maturityGovernanceData +
    // complianceData + the RAG-corpus init chain, which routinely exceeds
    // Vitest's 5s default on GitHub-hosted runners (Ubuntu 2 CPU). Kept this
    // test (vs the two render-only ones deleted above) because it's the only
    // file in this suite that exercises a real interaction (fireEvent.click).
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    // The stable tab bar exposes a "Product Records" tab (role="tab").
    const recordsTabs = screen.getAllByRole('tab', { name: /Product Records/i })
    fireEvent.click(recordsTabs[0])
    expect(recordsTabs[0]).toBeInTheDocument()
    expect(screen.getByTestId('compliance-table')).toBeInTheDocument()
  }, 15000)

  // WP5.5 — the sim's compliance-cert-check embed can't read the page URL, so
  // initialCert seeds the same local-state param the standalone route's real
  // ?cert= reads. Regression guard for the "prop already exists on the view;
  // dropped at the seam" bug the plan called out.
  it('simEmbed + initialCert opens directly on the records tab, cert pre-selected', () => {
    render(
      <MemoryRouter>
        <ComplianceView simEmbed initialTab="records" initialCert="A7285" />
      </MemoryRouter>
    )
    expect(screen.getByTestId('compliance-table')).toHaveTextContent('selected: A7285')
  }, 15000)

  it('shows executive in-body CSV export when persona is executive', () => {
    // ExecutiveTimelineView early-returns to a ProfileEditor when no
    // country/industry is set, so we seed the assessment store before
    // mounting. The CSV button lives inside the populated view body.
    usePersonaStore.setState({
      selectedPersona: 'executive',
      selectedIndustries: ['Finance & Banking'],
    })
    useAssessmentFormStore.setState({
      country: 'United States',
      industry: 'Finance & Banking',
    })
    // useApplicability reads from useAssessmentStore (the wizard answers),
    // NOT useAssessmentFormStore (the inline editor). Seed both so the
    // executive view exits its empty-profile early-return.
    useAssessmentStore.setState({
      country: 'United States',
      industry: 'Finance & Banking',
    })
    // Force ?tab=foryou — the default landing tab is computed by
    // `defaultTabForPersona`, so without this the executive view never mounts
    // and the in-body button can't render. (It used to be computed from the
    // Finance→certification persona hint, which retired with the jump-links.)
    render(
      <MemoryRouter initialEntries={['/compliance?tab=foryou']}>
        <ComplianceView />
      </MemoryRouter>
    )
    const exportButtons = screen.queryAllByRole('button', {
      name: /Export audit-ready summary/i,
    })
    expect(exportButtons.length).toBeGreaterThan(0)
  }, 15000)

  // DELETED 2026-08-12 — 'persona-hint dismissal persists per industry and
  // re-prompts on industry change'. It was skipped pending a cheaper mount, and
  // its TODO named e2e/compliance-persona-overwhelm.spec.ts as the interim
  // coverage for the CTA path. Both the hint and that e2e assertion are now
  // gone: the compliance redesign retired the persona jump-links along with the
  // onboarding stack, and PersonaHintCta.tsx is deleted. Re-enabling it would
  // mean rebuilding the feature first, so it is removed rather than left as a
  // skipped test that reads like debt someone should pay down.

  // Mobile UX layer (Phase 8). ComplianceEmbed.tsx renders this same
  // component inside the simulation at whatever viewport the player is on
  // (simEmbed prop) — simEmbed must win over isMobileShell regardless of
  // viewport width, same as Threats/Library.
  describe('mobile shell guard', () => {
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('renders the mobile screen when isMobileShell is true and not sim-embedded', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <ComplianceView />
        </MemoryRouter>
      )
      expect(screen.getByText('Compliance')).toBeInTheDocument()
      expect(
        screen.queryByText('Standardization, Certification & Compliance')
      ).not.toBeInTheDocument()
    })

    it('still renders the full desktop view when simEmbed is true, even if isMobileShell is true', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <ComplianceView simEmbed />
        </MemoryRouter>
      )
      expect(screen.queryByText('Compliance')).not.toBeInTheDocument()
    })
  })
})
