import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LibraryView } from './LibraryView'
import '@testing-library/jest-dom'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  type MotionProps = React.PropsWithChildren<Record<string, unknown>>
  const stripMotionProps = (props: MotionProps) => {
    const { children, initial, animate, transition, whileHover, ...rest } = props
    void [initial, animate, transition, whileHover]
    return { children, rest }
  }
  return {
    motion: {
      article: (props: MotionProps) => {
        const { children, rest } = stripMotionProps(props)
        return <article {...rest}>{children}</article>
      },
      button: (props: MotionProps) => {
        const { children, rest } = stripMotionProps(props)
        return <button {...rest}>{children}</button>
      },
      div: (props: MotionProps) => {
        const { children, rest } = stripMotionProps(props)
        return <div {...rest}>{children}</div>
      },
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  }
})

// Mock child components
vi.mock('./LibraryTreeTable', () => ({
  LibraryTreeTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="library-tree-table">Tree Table ({data.length} items)</div>
  ),
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
      <button data-testid="detail-popover" onClick={onClose}>
        Popover
      </button>
    ) : null,
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
    'General Recommendations',
  ],
}))

describe('LibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page header', () => {
    it('renders the main heading', () => {
      render(<LibraryView />)
      expect(screen.getByText(/PQC Standards Library/i)).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(<LibraryView />)
      expect(
        screen.getByText(/Explore the latest Post-Quantum Cryptography standards/i)
      ).toBeInTheDocument()
    })

    it('displays metadata', () => {
      render(<LibraryView />)
      expect(screen.getByText(/Data Source:/i)).toBeInTheDocument()
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
      expect(screen.getByPlaceholderText('Search standards...')).toBeInTheDocument()
    })

    it('filters items by title', async () => {
      vi.useFakeTimers()
      render(<LibraryView />)
      const searchInput = screen.getByPlaceholderText('Search standards...')

      fireEvent.change(searchInput, { target: { value: 'NIST' } })
      await vi.advanceTimersByTimeAsync(250)

      // Should show 1 document matching
      expect(screen.getByText(/1 document(?!s)/)).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('shows no results message when search matches nothing', async () => {
      vi.useFakeTimers()
      render(<LibraryView />)
      const searchInput = screen.getByPlaceholderText('Search standards...')

      fireEvent.change(searchInput, { target: { value: 'XYZ123' } })
      await vi.advanceTimersByTimeAsync(250)

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
})
