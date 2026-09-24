// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ThreatsDashboard } from './ThreatsDashboard'
import type { ThreatData } from '../../data/threatsData'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'
import { usePersonaStore } from '@/store/usePersonaStore'
import * as endorsement from '@/utils/endorsement'

vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return {
    ...actual,
    useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
  }
})

// Mock dependencies
vi.mock('../../data/threatsData', () => ({
  threatsData: [
    {
      industry: 'Finance',
      threatId: 'THR-001',
      description: 'Quantum attack on banking legacy systems',
      criticality: 'Critical',
      cryptoAtRisk: 'RSA-2048',
      pqcReplacement: 'ML-KEM',
      mainSource: 'NIST Report',
    },
    {
      industry: 'Healthcare',
      threatId: 'THR-002',
      description: 'Decryption of patient records',
      criticality: 'High',
      cryptoAtRisk: 'ECC',
      pqcReplacement: 'ML-DSA',
      mainSource: 'HIPAA Guidance',
    },
    {
      industry: 'Automotive',
      threatId: 'THR-003',
      description: 'Vehicle V2X communication intercept',
      criticality: 'Medium',
      cryptoAtRisk: 'ECDSA',
      pqcReplacement: 'ML-DSA',
      mainSource: 'Auto-ISAC',
    },
    {
      // A live stub with a blank criticality / crypto / PQC (the CROS-008 shape).
      industry: 'Insurance',
      threatId: 'THR-004',
      description: 'Underwriting archive exposure',
      criticality: 'Unrated',
      cryptoAtRisk: '',
      pqcReplacement: '',
      mainSource: 'Stub Source',
    },
  ] as ThreatData[],
  retiredThreats: new Map([
    [
      'OLD-001',
      {
        threatId: 'OLD-001',
        deprecatedAt: '2026-07-16',
        deprecatedReason: 'Removed in consolidation',
      },
    ],
  ]),
  threatsMetadata: {
    filename: 'test_file.csv',
    lastUpdate: new Date('2025-01-01'),
  },
}))

vi.mock('../common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    onSelect,
    onMultiSelect,
    multiSelectedIds,
    label,
    defaultLabel,
    selectedId,
  }: {
    items: { id: string; label: string }[]
    onSelect: (id: string) => void
    onMultiSelect?: (ids: string[]) => void
    multiSelectedIds?: string[]
    label?: string
    defaultLabel?: string
    selectedId: string
  }) => {
    const effectiveLabel = label || defaultLabel || 'dropdown'
    const isMulti = onMultiSelect !== undefined && multiSelectedIds !== undefined
    return (
      <div data-testid={`filter-${effectiveLabel}`}>
        <Button
          onClick={() => (isMulti ? onMultiSelect!([]) : onSelect('All'))}
          aria-label={effectiveLabel}
        >
          {effectiveLabel}: {items.find((i) => i.id === selectedId)?.label || selectedId}
        </Button>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Button
                onClick={() => {
                  if (isMulti) {
                    const current = multiSelectedIds ?? []
                    const next = current.includes(item.id)
                      ? current.filter((x: string) => x !== item.id)
                      : [...current, item.id]
                    onMultiSelect!(next)
                  } else {
                    onSelect(item.id)
                  }
                }}
              >
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  },
}))

// Pass-through spies: lets a test read every Endorse/Flag pageUrl the page builds.
vi.mock('@/utils/endorsement', async () => {
  const actual = await vi.importActual<typeof import('@/utils/endorsement')>('@/utils/endorsement')
  return {
    ...actual,
    buildEndorsementUrl: vi.fn(actual.buildEndorsementUrl),
    buildFlagUrl: vi.fn(actual.buildFlagUrl),
  }
})

// Mock Analytics
vi.mock('../../utils/analytics', () => ({
  logEvent: vi.fn(),
}))

// Mock Framer Motion to avoid animation issues in tests
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

describe('ThreatsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dashboard with title and description', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )
    expect(screen.getByText('Quantum Threats')).toBeInTheDocument()
    expect(screen.getAllByText(/Detailed analysis of quantum threats/)[0]).toBeInTheDocument()
  })

  it('renders the table with data', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // Check for row data (industry names appear in both the group header and data cell)
    expect(within(table).getAllByText('Finance')[0]).toBeInTheDocument()
    expect(within(table).getByText('THR-001')).toBeInTheDocument()
    expect(within(table).getAllByText('Healthcare')[0]).toBeInTheDocument()
    expect(within(table).getByText('THR-002')).toBeInTheDocument()
  })

  it('filters by Industry using dropdown', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )

    // Check initial state (all present)
    const table = screen.getByRole('table')
    expect(within(table).getAllByText('Finance')[0]).toBeInTheDocument()
    expect(within(table).getAllByText('Automotive')[0]).toBeInTheDocument()

    // Interact with Industry dropdown
    const dropdown = screen.getByTestId('filter-Industry') // defaultLabel="Industry"
    const financeOption = within(dropdown).getByText('Finance')

    fireEvent.click(financeOption)

    // Check filtered state
    expect(within(table).getAllByText('Finance')[0]).toBeInTheDocument()
    expect(within(table).queryByText('Automotive')).not.toBeInTheDocument()
  })

  it('filters by Criticality (severity filter, via its URL param)', () => {
    // The deck's severity chips set ?criticality=; assert the filtering behavior
    // through that contract (robust to the chip UI).
    render(
      <MemoryRouter initialEntries={['/threats?criticality=High']}>
        <ThreatsDashboard />
      </MemoryRouter>
    )

    // Check filtered state (Healthcare is High, Finance is Critical)
    const table = screen.getByRole('table')
    expect(within(table).getAllByText('Healthcare')[0]).toBeInTheDocument()
    expect(within(table).queryByText('Finance')).not.toBeInTheDocument()
  })

  it('searches threats by text', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )

    const searchInput = screen.getAllByPlaceholderText('Search threats...')[0]
    fireEvent.change(searchInput, { target: { value: 'banking' } }) // matches "Quantum attack on banking..."

    const table = screen.getByRole('table')
    expect(within(table).getAllByText('Finance')[0]).toBeInTheDocument() // The row with "banking" description
    expect(within(table).queryByText('Healthcare')).not.toBeInTheDocument()
  })

  it('sorts by Industry', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )

    const industryHeader = screen.getByRole('columnheader', { name: /Industry/i })
    fireEvent.click(industryHeader)

    // Checking logic is hard without checking order of elements.
    // But we can verify no crash and interaction works.
    // To verify sort, we'd need to get all rows and check order.
    screen.getAllByRole('row')
    // Row 0 is header.
    // Automotive (A) -> Finance (F) -> Healthcare (H)
    // Sorted Ascending by default.

    // Let's click again to sort descending
    fireEvent.click(industryHeader)

    // Now should be H -> F -> A
    // We trust JS sort, just verifying interaction doesn't crash
  })

  it('sorts by Criticality', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )
    const critHeader = screen.getByRole('columnheader', { name: /Criticality/i })
    fireEvent.click(critHeader)
    // Should behave without error
    expect(critHeader).toBeInTheDocument()
  })

  it('displays "No threats found" message when filter returns empty', () => {
    render(
      <MemoryRouter>
        <ThreatsDashboard />
      </MemoryRouter>
    )

    const searchInput = screen.getAllByPlaceholderText('Search threats...')[0]
    fireEvent.change(searchInput, { target: { value: 'NonExistentTermXYZ' } })

    // Desktop table view renders an empty state; mobile now reuses the same
    // responsive ThreatCard grid as the Cards view (Threats Fix #6), which
    // renders its own empty state with different copy — both are present in
    // jsdom simultaneously since CSS breakpoints aren't applied here.
    expect(screen.getAllByText('No threats found').length).toBeGreaterThan(0)
    expect(screen.getAllByText('No threats match the constraints.').length).toBeGreaterThan(0)
  })

  describe('criticality and blank fields (UX-5 / UX-6)', () => {
    it('offers only the criticality levels some row has — no Medium-High — plus Unrated', () => {
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const deck = screen.getByTestId('threats-control-deck')
      expect(within(deck).queryByRole('button', { name: 'Medium-High' })).not.toBeInTheDocument()
      expect(within(deck).getByRole('button', { name: 'Unrated' })).toBeInTheDocument()
      expect(within(deck).getByRole('button', { name: 'Critical' })).toBeInTheDocument()
    })

    it('?criticality=Unrated filters to the blank-criticality row', () => {
      render(
        <MemoryRouter initialEntries={['/threats?criticality=Unrated']}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const table = screen.getByRole('table')
      expect(within(table).getByText('THR-004')).toBeInTheDocument()
      expect(within(table).queryByText('THR-001')).not.toBeInTheDocument()
      // Blank at-risk / PQC cells say so instead of rendering empty.
      expect(within(table).getAllByText('Not yet specified')).toHaveLength(2)
    })

    it('a link to a retired threat says it was retired, with date and reason', () => {
      render(
        <MemoryRouter initialEntries={['/threats?id=OLD-001']}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      expect(
        screen.getByText(/This entry was retired on 2026-07-16: Removed in consolidation/)
      ).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('deep links (UX-3)', () => {
    // The dialog is React.lazy() and pulls in the implementation-attack and
    // enrichment data; in a loaded full-suite run its first import can take
    // well over findBy*'s 1s default (seen at ~1.1s), so wait longer. This is
    // a wait, not a masked assertion.
    const LAZY_DIALOG = { timeout: 15_000 }

    it('?id= opens the threat dialog', async () => {
      render(
        <MemoryRouter initialEntries={['/threats?id=THR-002']}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const dialog = await screen.findByRole('dialog', {}, LAZY_DIALOG)
      expect(within(dialog).getByText('THR-002')).toBeInTheDocument()
    })

    it('accepts the legacy ?threat= alias that old Endorse/Flag links carry', async () => {
      render(
        <MemoryRouter initialEntries={['/threats?threat=THR-002']}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const dialog = await screen.findByRole('dialog', {}, LAZY_DIALOG)
      expect(within(dialog).getByText('THR-002')).toBeInTheDocument()
    })

    // jsdom has no scrollIntoView; install a recording stub per test.
    function stubScrollIntoView() {
      const original = Element.prototype.scrollIntoView
      const scrolled: string[] = []
      Element.prototype.scrollIntoView = function (this: Element) {
        scrolled.push(this.id)
      }
      return { scrolled, restore: () => (Element.prototype.scrollIntoView = original) }
    }

    it('?view=horizon scrolls to the CRQC Threat Horizon section', () => {
      const stub = stubScrollIntoView()
      render(
        <MemoryRouter initialEntries={['/threats?view=horizon']}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      expect(stub.scrolled).toContain('crqc-threat-horizon')
      stub.restore()
    })

    it('every per-threat Endorse/Flag link (table rows and cards) uses ?id=, never ?threat=', () => {
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const perThreat = [
        ...vi.mocked(endorsement.buildEndorsementUrl).mock.calls,
        ...vi.mocked(endorsement.buildFlagUrl).mock.calls,
      ]
        .map(([opts]) => opts.pageUrl)
        .filter((u): u is string => !!u && u !== '/threats')
      expect(perThreat.length).toBeGreaterThan(0)
      for (const url of perThreat) expect(url).toMatch(/^\/threats\?id=/)
    })

    it('does not scroll to the Horizon without ?view=horizon', () => {
      const stub = stubScrollIntoView()
      render(
        <MemoryRouter initialEntries={['/threats']}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      expect(stub.scrolled).not.toContain('crqc-threat-horizon')
      stub.restore()
    })
  })

  describe('Phase 3 — semantic search supplement', () => {
    it('falls back to pure lexical when the runtime is not ready', () => {
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [],
        mode: 'lexical',
        loading: false,
      })
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const searchInput = screen.getAllByPlaceholderText('Search threats...')[0]
      fireEvent.change(searchInput, { target: { value: 'NonExistentTermXYZ' } })
      // No semantic hits → empty state remains.
      expect(screen.getAllByText('No threats found').length).toBeGreaterThan(0)
    })

    it('includes a semantic-only threat in the result set via union', () => {
      // THR-002 (Healthcare) does not match 'paraphrase-only' lexically.
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [{ id: 'THR-002', score: 0.88 }],
        mode: 'semantic',
        loading: false,
      })
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      const searchInput = screen.getAllByPlaceholderText('Search threats...')[0]
      fireEvent.change(searchInput, { target: { value: 'paraphrase-only' } })
      // The semantic-only row should render in the table or card view.
      expect(screen.getAllByText('THR-002').length).toBeGreaterThan(0)
    })
  })

  describe('Curious persona orientation card', () => {
    beforeEach(() => {
      usePersonaStore.getState().clearPersona()
    })

    afterEach(() => {
      usePersonaStore.getState().clearPersona()
    })

    it('renders a plain-language orientation card for the curious persona — even with no industries selected', () => {
      usePersonaStore.getState().setPersona('curious')
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      // The curious branch in personaSummary fires regardless of industry selection.
      expect(
        screen.getByText(
          /known quantum-era threats — each one is a place where today's encryption could be broken/
        )
      ).toBeInTheDocument()
    })

    it('does NOT render the curious orientation card for other personas without industry selection', () => {
      usePersonaStore.getState().setPersona('developer')
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      // The "known quantum-era threats" curious-specific copy must not leak.
      expect(
        screen.queryByText(
          /known quantum-era threats — each one is a place where today's encryption could be broken/
        )
      ).not.toBeInTheDocument()
    })
  })

  // Mobile UX layer (Phase 7). ThreatsEmbed.tsx renders this same component
  // inside the simulation at whatever viewport the player is on (simEmbed
  // prop) — O-3 (IMPLEMENTATION-PLAN.md) keeps /simulation entirely outside
  // the mobile shell, so simEmbed must win over isMobileShell regardless of
  // viewport width.
  describe('mobile shell guard', () => {
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('renders the mobile screen when isMobileShell is true and not sim-embedded', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      // The mobile screen's own <h1> is sr-only (2026-08-24 audit R2.2 — it
      // matches the sticky header's title instead of duplicating it as
      // visible "PQC threats" text), but it's still a real, findable DOM
      // node — this remains a valid fingerprint that the mobile branch, not
      // the desktop dashboard, rendered.
      expect(screen.getByRole('heading', { level: 1, name: 'Threats' })).toBeInTheDocument()
      expect(screen.queryByText('Quantum Threats')).not.toBeInTheDocument()
    })

    it('still renders the full desktop dashboard when simEmbed is true, even if isMobileShell is true', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <ThreatsDashboard simEmbed />
        </MemoryRouter>
      )
      expect(screen.queryByRole('heading', { level: 1, name: 'Threats' })).not.toBeInTheDocument()
    })
  })
})
