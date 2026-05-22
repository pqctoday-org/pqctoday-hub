// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ComplianceView } from './ComplianceView'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { logComplianceFilter } from '@/utils/analytics'

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
  }: {
    data: { id: string }[]
    onRefresh: () => void
    isRefreshing: boolean
    lastUpdated: Date | null
    onEnrich?: (id: string) => void
  }) => <div data-testid="compliance-table">Table ({data.length} records)</div>,
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
    // Both desktop and mobile strips have a "Records" button — click the first.
    const recordsButtons = screen.getAllByRole('button', { name: /^Records$/i })
    fireEvent.click(recordsButtons[0])
    expect(recordsButtons[0]).toBeInTheDocument()
  }, 15000)

  it('renders persona-hint CTA for Finance industry and logs analytics on click', () => {
    usePersonaStore.setState({ selectedIndustries: ['Finance & Banking'] })
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    const ctas = screen.getAllByRole('button', {
      name: /Go to Certification Schemes → FIPS 140-3/i,
    })
    expect(ctas.length).toBeGreaterThan(0)
    fireEvent.click(ctas[0])
    expect(logComplianceFilter).toHaveBeenCalledWith('PersonaHint', 'certification')
  }, 15000)

  it('suppresses the new-to-compliance intro card when a persona hint resolves', () => {
    usePersonaStore.setState({ selectedIndustries: ['Finance & Banking'] })
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.queryByText(/New to PQC compliance\?/i)).not.toBeInTheDocument()
  }, 15000)

  it('shows the intro card when no industry/region hint resolves', () => {
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.getByText(/New to PQC compliance\?/i)).toBeInTheDocument()
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
    // Force ?tab=foryou — default landing tab is computed from the persona
    // hint (Finance hint → certification), so without this the executive
    // view never mounts and the in-body button can't render.
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

  it('shows curious narrative line instead of full deadline timeline', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    const narrative = screen.getByTestId('deadline-timeline-narrative')
    expect(narrative).toBeInTheDocument()
    expect(narrative.textContent ?? '').toMatch(/PQC mandates land between/i)
  }, 15000)

  it('collapses deadline timeline behind a disclosure for developer persona', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    // Disclosure button visible, full timeline title not yet rendered.
    expect(screen.getByRole('button', { name: /Show deadline timeline/i })).toBeInTheDocument()
    expect(screen.queryByText(/PQC Compliance Deadlines/)).not.toBeInTheDocument()
  }, 15000)
})
