import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LibraryView } from './LibraryView'
import '@testing-library/jest-dom'

// Mock child components
vi.mock('./LibraryTreeTable', () => ({
  LibraryTreeTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="library-tree-table">Tree Table ({data.length} items)</div>
  ),
}))

describe('LibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Desktop viewport', () => {
    beforeEach(() => {
      global.innerWidth = 1024
      global.innerHeight = 768
    })

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

    it('renders category filter', () => {
      render(<LibraryView />)
      // FilterDropdown should be present
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('shows all categories by default', () => {
      render(<LibraryView />)
      expect(screen.getByText('Digital Signature')).toBeInTheDocument()
      expect(screen.getByText('KEM')).toBeInTheDocument()
    })

    it('displays library tree tables', () => {
      render(<LibraryView />)
      const tables = screen.getAllByTestId('library-tree-table')
      expect(tables.length).toBeGreaterThan(0)
    })
  })

  describe('Mobile viewport', () => {
    beforeEach(() => {
      global.innerWidth = 375
      global.innerHeight = 667
    })

    it('renders on mobile', () => {
      render(<LibraryView />)
      expect(screen.getByText(/PQC Standards Library/i)).toBeInTheDocument()
    })

    it('renders filter on mobile', () => {
      render(<LibraryView />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Category filtering', () => {
    it('shows all categories when "All" is selected', () => {
      render(<LibraryView />)
      expect(screen.getByText('Digital Signature')).toBeInTheDocument()
      expect(screen.getByText('KEM')).toBeInTheDocument()
      expect(screen.getByText('PKI Certificate Management')).toBeInTheDocument()
    })

    it('displays library data in sections', () => {
      render(<LibraryView />)
      const sections = [
        'Digital Signature',
        'KEM',
        'PKI Certificate Management',
        'Protocols',
        'General Recommendations',
      ]

      sections.forEach((section) => {
        expect(screen.getByText(section)).toBeInTheDocument()
      })
    })
  })

  describe('Layout structure', () => {
    it('renders with proper spacing classes', () => {
      const { container } = render(<LibraryView />)
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('space-y-8')
    })

    it('displays tabpanel with proper ARIA attributes', () => {
      render(<LibraryView />)
      const tabpanel = screen.getByRole('tabpanel')
      expect(tabpanel).toBeInTheDocument()
      expect(tabpanel).toHaveAttribute('id', 'panel-All')
    })
  })
})
