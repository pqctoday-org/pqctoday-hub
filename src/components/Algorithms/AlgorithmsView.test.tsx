import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlgorithmsView } from './AlgorithmsView'
import '@testing-library/jest-dom'

// Mock child components
vi.mock('./AlgorithmComparison', () => ({
  AlgorithmComparison: () => <div data-testid="algorithm-comparison">Algorithm Comparison</div>,
}))

vi.mock('./AlgorithmDetailedComparison', () => ({
  AlgorithmDetailedComparison: () => (
    <div data-testid="algorithm-detailed">Detailed Comparison</div>
  ),
}))

describe('AlgorithmsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Desktop viewport', () => {
    beforeEach(() => {
      global.innerWidth = 1024
      global.innerHeight = 768
    })

    it('renders the main heading', () => {
      render(<AlgorithmsView />)
      expect(screen.getByText(/Post-Quantum Cryptography Algorithms/i)).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(<AlgorithmsView />)
      expect(screen.getByText(/Migration from classical to post-quantum/i)).toBeInTheDocument()
    })

    it('displays metadata', () => {
      render(<AlgorithmsView />)
      expect(screen.getByText(/Data Sources:/i)).toBeInTheDocument()
    })

    it('renders view tabs', () => {
      render(<AlgorithmsView />)
      expect(screen.getByText('Transition Guide')).toBeInTheDocument()
      expect(screen.getByText('Detailed Comparison')).toBeInTheDocument()
    })

    it('shows transition view by default', () => {
      render(<AlgorithmsView />)
      expect(screen.getByTestId('algorithm-comparison')).toBeInTheDocument()
    })

    it('switches to detailed view when tab is clicked', () => {
      render(<AlgorithmsView />)
      const detailedTab = screen.getByText('Detailed Comparison')
      fireEvent.click(detailedTab)
      expect(screen.getByTestId('algorithm-detailed')).toBeInTheDocument()
    })

    it('highlights active tab', () => {
      render(<AlgorithmsView />)
      // eslint-disable-next-line testing-library/no-node-access
      const transitionTab = screen.getByText('Transition Guide').closest('button')
      expect(transitionTab).toHaveClass('border-primary')
    })
  })

  describe('Mobile viewport', () => {
    beforeEach(() => {
      global.innerWidth = 375
      global.innerHeight = 667
    })

    it('renders on mobile', () => {
      render(<AlgorithmsView />)
      expect(screen.getByText(/Post-Quantum Cryptography Algorithms/i)).toBeInTheDocument()
    })

    it('renders tabs on mobile', () => {
      render(<AlgorithmsView />)
      expect(screen.getByText('Transition Guide')).toBeInTheDocument()
    })

    it('shows default view on mobile', () => {
      render(<AlgorithmsView />)
      expect(screen.getByTestId('algorithm-comparison')).toBeInTheDocument()
    })
  })

  describe('Tab switching', () => {
    it('switches between views correctly', () => {
      render(<AlgorithmsView />)

      // Start with transition view
      expect(screen.getByTestId('algorithm-comparison')).toBeInTheDocument()

      // Switch to detailed
      fireEvent.click(screen.getByText('Detailed Comparison'))
      expect(screen.getByTestId('algorithm-detailed')).toBeInTheDocument()

      // Switch back to transition
      fireEvent.click(screen.getByText('Transition Guide'))
      expect(screen.getByTestId('algorithm-comparison')).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('renders with proper container classes', () => {
      const { container } = render(<AlgorithmsView />)
      // eslint-disable-next-line testing-library/no-node-access
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('max-w-7xl', 'mx-auto', 'px-4')
    })
  })
})
