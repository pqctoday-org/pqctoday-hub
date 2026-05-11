// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { LibraryView } from './LibraryView'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'

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

// Mock library data
vi.mock('../../data/libraryData', () => ({
  libraryData: [
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

describe('LibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      expect(screen.getByText(/3 documents/)).toBeInTheDocument()
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
