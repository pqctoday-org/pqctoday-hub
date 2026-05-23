// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { LibraryView } from './LibraryView'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'

// Mock the semantic-search hook so per-test we can simulate runtime
// states (idle / lexical fallback / semantic-with-hits) without
// loading the embedding model.
vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return {
    ...actual,
    useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
  }
})

// Mock react-router-dom — component uses useSearchParams for deep linking.
// Use a stable reference so the useEffect([searchParams]) dep doesn't fire on every render.
const mockSearchParams = new URLSearchParams()
const mockSetSearchParams = vi.fn()
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  useNavigate: () => vi.fn(),
  // The CSWP-39 zone pill in DocumentCard renders <Link> when the document's
  // referenceId is in maturityByRefId. Our 'FIPS 203' fixture intentionally
  // collides with the real maturity CSV so this path is exercised — provide
  // a no-op anchor stand-in to avoid breaking unrelated tests.
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href={typeof to === 'string' ? to : ''} {...props}>
      {children}
    </a>
  ),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Mock child components
vi.mock('./LibraryTreeTable', () => ({
  LibraryTreeTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="library-tree-table">Tree Table ({data.length} items)</div>
  ),
}))

vi.mock('./DocumentAnalysis', () => ({
  DocumentAnalysis: () => <div data-testid="document-analysis" />,
}))

vi.mock('./LibraryDetailPopover', () => ({
  LibraryDetailPopover: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean
    onClose: () => void
    item: unknown
  }) =>
    isOpen ? (
      <Button data-testid="detail-popover" onClick={onClose}>
        Popover
      </Button>
    ) : null,
}))

// Mock enrichment data
vi.mock('../../data/libraryEnrichmentData', () => ({
  libraryEnrichments: {
    'NIST-001': {
      mainTopic: 'Test topic',
      pqcAlgorithms: ['ML-KEM'],
      quantumThreats: [],
      migrationTimeline: null,
      regionsAndBodies: null,
      leadersContributions: [],
      pqcProducts: [],
      protocols: [],
      infrastructureLayers: [],
      standardizationBodies: ['NIST'],
      complianceFrameworks: [],
    },
  },
  hasSubstantiveEnrichment: () => true,
  parseEnrichmentMarkdown: () => ({}),
  mergeEnrichmentFiles: () => ({}),
}))

// Mock library data — 9 items spanning ≥2 preferred categories per persona
// so default-narrowing assertions don't false-pass (plan §Risks #1).
vi.mock('../../data/libraryData', () => ({
  libraryData: [
    // === Original 3 items preserved for legacy test assertions ===
    {
      referenceId: 'NIST-001',
      documentTitle: 'NIST PQC Standard',
      categories: ['Digital Signature'],
      shortDescription: 'Standard for PQC',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-01-15',
      migrationUrgency: 'High',
      regionScope: 'Global',
      downloadUrl: 'https://example.com/nist-001',
      status: 'New',
      children: [],
      citationCount: 0,
    },
    {
      referenceId: 'RFC-1234',
      documentTitle: 'TLS Extensions',
      categories: ['Protocols'],
      shortDescription: 'IETF RFC',
      documentStatus: 'Draft',
      documentStatusBucket: 'Draft',
      lastUpdateDate: '2026-01-10',
      migrationUrgency: '',
      regionScope: 'Global',
      downloadUrl: 'https://example.com/rfc-1234',
      status: 'Updated',
      children: [],
      citationCount: 1,
    },
    {
      referenceId: 'FIPS-203',
      documentTitle: 'ML-KEM Standard',
      categories: ['KEM'],
      shortDescription: 'Key Encapsulation',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2025-12-01',
      migrationUrgency: 'Critical',
      regionScope: 'USA',
      downloadUrl: '',
      children: [],
      citationCount: 3,
    },
    // === Items added so each persona-preferred set has ≥2 mock matches ===
    {
      referenceId: 'CSWP-39',
      documentTitle: 'Cybersecurity Maturity',
      categories: ['Government & Policy', 'Industry & Research'],
      shortDescription: 'Org maturity',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-02-01',
      migrationUrgency: 'High',
      regionScope: 'Global',
      downloadUrl: '',
      children: [],
      citationCount: 2,
    },
    {
      referenceId: 'IR-8547',
      documentTitle: 'PQC Transition Timeline',
      categories: ['Government & Policy', 'Migration Guidance'],
      shortDescription: 'Transition timeline',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-02-15',
      migrationUrgency: 'High',
      regionScope: 'Global',
      downloadUrl: '',
      children: [],
      citationCount: 0,
    },
    {
      referenceId: 'BSI-TR',
      documentTitle: 'German Crypto Guidance',
      categories: ['Government & Policy', 'International Frameworks'],
      shortDescription: 'BSI guidance',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-01-20',
      migrationUrgency: 'Medium',
      regionScope: 'EU',
      downloadUrl: '',
      children: [],
      citationCount: 0,
    },
    {
      referenceId: 'REF-2026',
      documentTitle: 'Reference Spec',
      categories: ['Algorithm Specifications'],
      shortDescription: 'Spec',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-01-05',
      migrationUrgency: 'Low',
      regionScope: 'Global',
      downloadUrl: '',
      children: [],
      citationCount: 0,
    },
    {
      referenceId: 'PKI-001',
      documentTitle: 'PKI Certificate Profile',
      categories: ['PKI Certificate Management'],
      shortDescription: 'PKI',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-01-08',
      migrationUrgency: 'Medium',
      regionScope: 'Global',
      downloadUrl: '',
      children: [],
      citationCount: 0,
    },
    {
      // referenceId matches the LIBRARY_OPS_PICKS allowlist (space form) so the
      // "Cert-relevant" chip filter has exactly one mock target.
      referenceId: 'FIPS 203',
      documentTitle: 'FIPS 203 ML-KEM Spec',
      categories: ['KEM'],
      shortDescription: 'Cert-relevant fixture',
      documentStatus: 'Final',
      documentStatusBucket: 'Published',
      lastUpdateDate: '2026-01-01',
      migrationUrgency: 'Critical',
      regionScope: 'Global',
      downloadUrl: '',
      children: [],
      citationCount: 0,
    },
  ],
  libraryMetadata: {
    filename: 'test_data.csv',
    lastUpdate: new Date('2024-01-01'),
  },
  libraryError: null,
  LIBRARY_CATEGORIES: [
    'Digital Signature',
    'KEM',
    'PKI Certificate Management',
    'Protocols',
    'Government & Policy',
    'NIST Standards',
    'International Frameworks',
    'Migration Guidance',
    'Algorithm Specifications',
    'Industry & Research',
  ],
}))

/** Reset the shared mock URL params + the real persona store so each test
 *  starts from the same clean slate. */
function resetTestEnv() {
  vi.clearAllMocks()
  Array.from(mockSearchParams.keys()).forEach((k) => mockSearchParams.delete(k))
  usePersonaStore.setState({ selectedPersona: null, selectedIndustry: null })
}

describe('LibraryView', () => {
  beforeEach(() => {
    resetTestEnv()
  })

  describe('Page header', () => {
    it('renders the main heading', () => {
      render(<LibraryView />)
      expect(screen.getByText(/PQC Library/i)).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(<LibraryView />)
      expect(
        screen.getAllByText(/Explore the latest Post-Quantum Cryptography standards/i)[0]
      ).toBeInTheDocument()
    })

    it('displays metadata', () => {
      render(<LibraryView />)
      expect(screen.getByText(/Updated:/i)).toBeInTheDocument()
    })
  })

  describe('Activity Feed', () => {
    it('renders the activity feed with recent updates', () => {
      render(<LibraryView />)
      expect(screen.getByText('Recent Updates')).toBeInTheDocument()
    })

    it('shows items with New or Updated status', () => {
      render(<LibraryView />)
      // The activity feed should show NIST-001 (New) and RFC-1234 (Updated)
      expect(screen.getAllByText('NIST-001').length).toBeGreaterThan(0)
      expect(screen.getAllByText('RFC-1234').length).toBeGreaterThan(0)
    })
  })

  describe('Category Sidebar', () => {
    it('renders category sidebar with all categories', () => {
      render(<LibraryView />)
      const nav = screen.getByRole('navigation', { name: /Library categories/i })
      expect(nav).toBeInTheDocument()
    })

    it('shows All button in sidebar', () => {
      render(<LibraryView />)
      // Sidebar has an "All" button
      const allButtons = screen.getAllByRole('button', { name: /^All/i })
      expect(allButtons.length).toBeGreaterThan(0)
    })
  })

  describe('View Toggle', () => {
    it('renders view toggle with Cards and Table options', () => {
      render(<LibraryView />)
      const radiogroup = screen.getByRole('radiogroup', { name: /View mode/i })
      expect(radiogroup).toBeInTheDocument()
    })

    it('defaults to Cards view', () => {
      render(<LibraryView />)
      const cardsRadio = screen.getByRole('radio', { name: /Cards/i })
      expect(cardsRadio).toHaveAttribute('aria-checked', 'true')
    })

    it('switches to Table view when clicked', () => {
      render(<LibraryView />)
      const tableRadio = screen.getByRole('radio', { name: /Table/i })
      fireEvent.click(tableRadio)
      expect(tableRadio).toHaveAttribute('aria-checked', 'true')

      // Table view should show tree tables
      expect(screen.getAllByTestId('library-tree-table').length).toBeGreaterThan(0)
    })
  })

  describe('Card View', () => {
    it('displays document cards by default', () => {
      render(<LibraryView />)
      // Cards show reference IDs
      expect(screen.getAllByText('NIST-001').length).toBeGreaterThan(0)
    })

    it('shows document count', () => {
      render(<LibraryView />)
      expect(screen.getByText(/9 documents/)).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<LibraryView />)
      expect(screen.getByPlaceholderText('Search standards and drafts...')).toBeInTheDocument()
    })

    it('filters items by title', async () => {
      vi.useFakeTimers()
      render(<LibraryView />)
      const searchInput = screen.getByPlaceholderText('Search standards and drafts...')

      fireEvent.change(searchInput, { target: { value: 'NIST' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })

      // Should show 1 document matching
      expect(screen.getByText(/1 document(?!s)/)).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('shows no results message when search matches nothing', async () => {
      vi.useFakeTimers()
      render(<LibraryView />)
      const searchInput = screen.getByPlaceholderText('Search standards and drafts...')

      fireEvent.change(searchInput, { target: { value: 'XYZ123' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })

      expect(screen.getByText(/No documents found matching your filters/)).toBeInTheDocument()
      vi.useRealTimers()
    })
  })

  describe('Table View', () => {
    it('renders tree tables in table mode', () => {
      render(<LibraryView />)
      // Switch to table view
      const tableRadio = screen.getByRole('radio', { name: /Table/i })
      fireEvent.click(tableRadio)

      const tables = screen.getAllByTestId('library-tree-table')
      expect(tables.length).toBeGreaterThan(0)
    })

    it('shows category section headings in table mode', () => {
      render(<LibraryView />)
      const tableRadio = screen.getByRole('radio', { name: /Table/i })
      fireEvent.click(tableRadio)

      // In table mode, category headings appear as h3 elements
      const headings = screen.getAllByRole('heading', { level: 3 })
      const headingTexts = headings.map((h) => h.textContent)
      expect(headingTexts).toContain('Digital Signature')
      expect(headingTexts).toContain('Protocols')
    })
  })

  describe('Layout structure', () => {
    it('renders with proper spacing classes', () => {
      const { container } = render(<LibraryView />)
      // eslint-disable-next-line testing-library/no-node-access
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('space-y-6')
    })
  })

  describe('Phase 3 — semantic search supplement', () => {
    it('falls back to pure lexical when the runtime is not ready', async () => {
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [],
        mode: 'lexical',
        loading: false,
      })
      vi.useFakeTimers()
      render(<LibraryView />)
      const input = screen.getByPlaceholderText('Search standards and drafts...')
      // 'wibble' doesn't lexically match any of the 3 fixture items.
      fireEvent.change(input, { target: { value: 'wibble' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })
      expect(screen.getByText(/0 documents/)).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('includes semantic-only items in the result set via union', async () => {
      // FIPS-203 (ML-KEM Standard) does not lexically match 'paraphrase-only'.
      // Mock the hook to claim it as a top semantic hit anyway.
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [{ id: 'FIPS-203', score: 0.91 }],
        mode: 'semantic',
        loading: false,
      })
      vi.useFakeTimers()
      render(<LibraryView />)
      const input = screen.getByPlaceholderText('Search standards and drafts...')
      fireEvent.change(input, { target: { value: 'paraphrase-only' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })
      // Semantic-only item should appear in the rendered list.
      expect(screen.getAllByText('FIPS-203').length).toBeGreaterThan(0)
      // Result count includes the semantic-only item.
      expect(screen.getByText(/1 document(?!s)/)).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('renders the semantic-search hint when mode is semantic with hits', async () => {
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [{ id: 'FIPS-203', score: 0.91 }],
        mode: 'semantic',
        loading: false,
      })
      vi.useFakeTimers()
      render(<LibraryView />)
      const input = screen.getByPlaceholderText('Search standards and drafts...')
      fireEvent.change(input, { target: { value: 'paraphrase' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })
      expect(screen.getByText(/Expanded with semantically/i)).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('does not render the hint when query is empty even if mode is semantic', () => {
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [],
        mode: 'idle',
        loading: false,
      })
      render(<LibraryView />)
      expect(screen.queryByText(/Expanded with semantically/i)).not.toBeInTheDocument()
    })
  })
})

/**
 * Persona-overwhelm-p0 remediation — plan §Tests/Unit AC-1…AC-5 + chips + sort.
 * The 9-item mock above is deliberately constructed so each persona narrows to a
 * different count, distinguishing real predicate evaluation from a false-pass.
 */
describe('LibraryView — persona-overwhelm-p0', () => {
  beforeEach(() => {
    resetTestEnv()
  })

  /** Expected `filteredItems.length` per persona when the URL is silent and the
   *  sidebar selection is the default "All". Researcher has an empty preferred
   *  array (no narrowing) so it sees the full 9-item corpus. */
  const NARROWING: Record<PersonaId, number> = {
    executive: 3,
    developer: 5,
    architect: 5,
    ops: 6,
    curious: 3,
    researcher: 9,
  }

  describe('AC-1 / AC-5 — persona narrowing predicate', () => {
    for (const persona of ['executive', 'developer', 'architect', 'ops', 'curious'] as const) {
      it(`narrows the corpus for persona=${persona} and renders the matched banner`, () => {
        usePersonaStore.setState({ selectedPersona: persona })
        // Curious persona collapses the shell (PR 4); seed ?expand=1 so the
        // matched-banner is visible without simulating a click first.
        if (persona === 'curious') mockSearchParams.set('expand', '1')
        render(<LibraryView />)
        const expectedCount = NARROWING[persona]
        expect(
          screen.getByText(new RegExp(`Showing ${expectedCount} documents? matched to your role`))
        ).toBeInTheDocument()
      })
    }

    it('researcher persona sees the full corpus and NO matched banner (AC-5)', () => {
      usePersonaStore.setState({ selectedPersona: 'researcher' })
      render(<LibraryView />)
      expect(screen.queryByText(/matched to your role/)).not.toBeInTheDocument()
      // Bare results count reads "9 documents" with no banner wrapper.
      expect(screen.getByText(/9 documents/)).toBeInTheDocument()
    })
  })

  describe('?prefs=off escape hatch and explicit ?cat= override', () => {
    it('?prefs=off short-circuits the persona narrowing and shows the full corpus', () => {
      usePersonaStore.setState({ selectedPersona: 'executive' })
      mockSearchParams.set('prefs', 'off')
      render(<LibraryView />)
      // Banner gone; bare "9 documents" reading instead of "Showing 3 ... matched"
      expect(screen.queryByText(/matched to your role/)).not.toBeInTheDocument()
      expect(screen.getByText(/9 documents/)).toBeInTheDocument()
    })

    it('explicit ?cat=KEM overrides the persona-preferred set', () => {
      usePersonaStore.setState({ selectedPersona: 'executive' })
      mockSearchParams.set('cat', 'KEM')
      render(<LibraryView />)
      // KEM bucket has 2 items in the mock (FIPS-203 + 'FIPS 203'). Banner is
      // gone because activeCategory !== 'All'.
      expect(screen.queryByText(/matched to your role/)).not.toBeInTheDocument()
      expect(screen.getByText(/2 documents in KEM/)).toBeInTheDocument()
    })
  })

  describe('Picks panel persona switch', () => {
    const cases: Array<{ persona: PersonaId; testid: string | null; title: string | null }> = [
      { persona: 'curious', testid: 'persona-picks-curious', title: 'Start here' },
      { persona: 'executive', testid: 'persona-picks-executive', title: 'Boardroom set' },
      { persona: 'ops', testid: 'persona-picks-ops', title: 'Cert-relevant set' },
      { persona: 'developer', testid: null, title: null },
      { persona: 'architect', testid: null, title: null },
      { persona: 'researcher', testid: null, title: null },
    ]
    for (const c of cases) {
      it(`renders ${c.testid ?? 'no picks panel'} for persona=${c.persona}`, () => {
        usePersonaStore.setState({ selectedPersona: c.persona })
        render(<LibraryView />)
        if (c.testid) {
          expect(screen.getByTestId(c.testid)).toBeInTheDocument()
          expect(screen.getByText(c.title!)).toBeInTheDocument()
        } else {
          // No persona-picks panel of any flavor should render.
          expect(document.querySelector('[data-testid^=persona-picks-]')).toBeNull()
        }
      })
    }
  })

  describe('Default sort per persona', () => {
    const expected: Record<PersonaId, string> = {
      executive: 'Newest first',
      developer: 'Reference ID',
      architect: 'Urgency',
      researcher: 'Most cited',
      ops: 'Urgency',
      curious: 'Newest first',
    }
    for (const persona of Object.keys(expected) as PersonaId[]) {
      it(`uses the ${expected[persona]} default for persona=${persona}`, () => {
        usePersonaStore.setState({ selectedPersona: persona })
        // Curious shell-collapse hides the SortControl until expanded.
        if (persona === 'curious') mockSearchParams.set('expand', '1')
        render(<LibraryView />)
        // SortControl renders the active option label inside its button. There
        // are two SortControls in the DOM (desktop + mobile-in-drawer); both
        // carry the same label, so getAllByRole at least once.
        const buttons = screen.getAllByRole('button', {
          name: new RegExp(expected[persona]),
        })
        expect(buttons.length).toBeGreaterThan(0)
      })
    }
  })

  describe('Lifecycle pill chip (P1.e)', () => {
    it('clicking "Final" filters to documentStatusBucket === Published', () => {
      // No persona — full 9-item corpus; clicking Final hides RFC-1234 (the only
      // Draft fixture) so 8 documents remain.
      render(<LibraryView />)
      expect(screen.getByText(/9 documents/)).toBeInTheDocument()
      const finalChip = screen.getByRole('radio', { name: 'Final' })
      fireEvent.click(finalChip)
      expect(screen.getByText(/8 documents/)).toBeInTheDocument()
    })
  })

  describe('Cert-relevant chip (P1.e)', () => {
    it('filters to the LIBRARY_OPS_PICKS allowlist intersection with the corpus', () => {
      render(<LibraryView />)
      // The only mock item whose referenceId appears in LIBRARY_OPS_PICKS is the
      // "FIPS 203" (space) fixture, so the chip narrows to 1 doc.
      const certChip = screen.getByRole('button', { name: /Cert-relevant \(/ })
      fireEvent.click(certChip)
      expect(screen.getByText(/1 document(?!s)/)).toBeInTheDocument()
    })
  })

  describe('Accessibility polish (Gap #4)', () => {
    it('matched-banner container is an aria-live status region', () => {
      usePersonaStore.setState({ selectedPersona: 'executive' })
      render(<LibraryView />)
      // The results-count wrapper carries role="status" + aria-live="polite"
      // so screen readers announce persona-narrowing count changes.
      const status = screen
        .getByText(/Showing 3 documents matched to your role/)
        .closest('[role="status"]')
      expect(status).not.toBeNull()
      expect(status).toHaveAttribute('aria-live', 'polite')
    })

    it('lifecycle radiogroup applies roving tabindex (only one tabbable pill)', () => {
      render(<LibraryView />)
      const radios = screen.getAllByRole('radio', {
        name: /Final|Draft|Expired|Withdrawn/,
      })
      // 4 pills + the View Toggle's Cards/Table radios — filter to lifecycle.
      const lifecyclePills = radios.filter((r) =>
        ['Final', 'Draft', 'Expired', 'Withdrawn'].includes(r.textContent ?? '')
      )
      expect(lifecyclePills.length).toBe(4)
      const tabbable = lifecyclePills.filter((p) => p.getAttribute('tabindex') === '0')
      expect(tabbable.length).toBe(1)
    })

    it('arrow key navigates the lifecycle radiogroup and activates the next pill', () => {
      render(<LibraryView />)
      const lifecyclePills = screen
        .getAllByRole('radio')
        .filter((r) => ['Final', 'Draft', 'Expired', 'Withdrawn'].includes(r.textContent ?? ''))
      // Focus + activate the first pill so the keyboard handler has a starting
      // position. (jsdom doesn't auto-focus on render.)
      ;(lifecyclePills[0] as HTMLElement).focus()
      fireEvent.click(lifecyclePills[0])
      expect(lifecyclePills[0]).toHaveAttribute('aria-checked', 'true')
      // ArrowRight from "Final" should move to "Draft" + activate it.
      fireEvent.keyDown(lifecyclePills[0].parentElement!, { key: 'ArrowRight' })
      expect(lifecyclePills[1]).toHaveAttribute('aria-checked', 'true')
    })

    it('Advanced expander wires aria-controls to the advanced drawer region', () => {
      usePersonaStore.setState({ selectedPersona: 'executive' })
      render(<LibraryView />)
      // Open the Filters drawer first so the Advanced button is rendered.
      const filtersBtn = screen.getByRole('button', { name: /Filters/i })
      fireEvent.click(filtersBtn)
      const advanced = screen.getByRole('button', { name: /Advanced \(Sector, Trust tier\)/ })
      expect(advanced).toHaveAttribute('aria-controls', 'library-advanced-drawer')
      expect(advanced).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Curious minimum-viable mode (PR 4 / plan §P2)', () => {
    it('hides the sidebar + results until "Browse the full library" is clicked', () => {
      usePersonaStore.setState({ selectedPersona: 'curious' })
      render(<LibraryView />)
      // Header + Start-here picks are visible…
      expect(screen.getByTestId('persona-picks-curious')).toBeInTheDocument()
      // …but the sidebar, search input, and results count are NOT.
      expect(screen.queryByRole('navigation', { name: /Library categories/i })).toBeNull()
      expect(screen.queryByPlaceholderText('Search standards and drafts...')).toBeNull()
      expect(screen.queryByText(/matched to your role/)).toBeNull()

      const browse = screen.getByRole('button', { name: 'Browse the full library' })
      fireEvent.click(browse)

      // After click: sidebar + controls bar render; the browse CTA disappears.
      expect(screen.getByRole('navigation', { name: /Library categories/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search standards and drafts...')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Browse the full library' })
      ).not.toBeInTheDocument()
    })
  })
})
