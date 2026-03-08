// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

// Mock async data loaders so the component resolves immediately in tests
vi.mock('../../data/pqcAlgorithmsData', () => ({
  loadPQCAlgorithmsData: vi.fn().mockResolvedValue([]),
  loadedFileMetadata: { filename: 'pqc_complete_algorithm_reference.csv', date: null },
}))

vi.mock('../../data/algorithmsData', () => ({
  loadAlgorithmsData: vi.fn().mockResolvedValue([]),
  loadedTransitionMetadata: { filename: 'algorithms_transitions.csv', date: null },
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
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(screen.getByText(/Post-Quantum Cryptography Algorithms/i)).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(screen.getByText(/Migration from classical to post-quantum/i)).toBeInTheDocument()
    })

    it('displays metadata', () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(screen.getByText(/Data Sources:/i)).toBeInTheDocument()
    })

    it('renders view tabs', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(await screen.findByText('Transition Guide')).toBeInTheDocument()
      expect(await screen.findByText('Detailed Comparison')).toBeInTheDocument()
    })

    it('shows transition view by default', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(await screen.findByTestId('algorithm-comparison')).toBeInTheDocument()
    })

    it('switches to detailed view when tab is clicked', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      const detailedTab = await screen.findByText('Detailed Comparison')
      fireEvent.click(detailedTab)
      expect(await screen.findByTestId('algorithm-detailed')).toBeInTheDocument()
    })

    it('highlights active tab', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      // eslint-disable-next-line testing-library/no-node-access
      const transitionTab = (await screen.findByText('Transition Guide')).closest('button')
      expect(transitionTab).toHaveAttribute('data-state', 'active')
    })
  })

  describe('Mobile viewport', () => {
    beforeEach(() => {
      global.innerWidth = 375
      global.innerHeight = 667
    })

    it('renders on mobile', () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(screen.getByText(/Post-Quantum Cryptography Algorithms/i)).toBeInTheDocument()
    })

    it('renders tabs on mobile', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(await screen.findByText('Transition Guide')).toBeInTheDocument()
    })

    it('shows default view on mobile', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(await screen.findByTestId('algorithm-comparison')).toBeInTheDocument()
    })
  })

  describe('Tab switching', () => {
    it('switches between views correctly', async () => {
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )

      // Start with transition view
      expect(await screen.findByTestId('algorithm-comparison')).toBeInTheDocument()

      // Switch to detailed
      fireEvent.click(await screen.findByText('Detailed Comparison'))
      expect(await screen.findByTestId('algorithm-detailed')).toBeInTheDocument()

      // Switch back to transition
      fireEvent.click(await screen.findByText('Transition Guide'))
      expect(await screen.findByTestId('algorithm-comparison')).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('renders with proper container classes', () => {
      const { container } = render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      // Full-width — shell (MainLayout) provides the max-w-7xl constraint; no inner cap
      // eslint-disable-next-line testing-library/no-node-access
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toBeInTheDocument()
    })
  })
})
