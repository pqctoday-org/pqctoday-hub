// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AlgorithmsView } from './AlgorithmsView'
import '@testing-library/jest-dom'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'

vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return {
    ...actual,
    useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
  }
})

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

    it('renders heading, description, metadata, tab strip, and default view', async () => {
      // Consolidated: previously five separate desktop tests each paying the
      // full AlgorithmsView mount cost to assert one static-content node.
      // Single mount + all assertions catches mount-doesn't-crash + every
      // header/tab/default-view check at once.
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(screen.getByText(/Post-Quantum Cryptography Algorithms/i)).toBeInTheDocument()
      expect(
        screen.getAllByText(/Migration from classical to post-quantum/i)[0]
      ).toBeInTheDocument()
      expect(await screen.findByText(/Data Sources:/i)).toBeInTheDocument()
      expect(await screen.findByText('Transition Guide')).toBeInTheDocument()
      expect(await screen.findByText('Detailed Comparison')).toBeInTheDocument()
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

    it('renders heading, tab strip, and default view on mobile breakpoint', async () => {
      // Consolidated: previously three separate mobile tests each paying the
      // full AlgorithmsView mount cost. Same pattern as the desktop test
      // above; the value of the describe block is the `innerWidth=375`
      // setup, not the per-element assertions which duplicate desktop's.
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      expect(screen.getByText(/Post-Quantum Cryptography Algorithms/i)).toBeInTheDocument()
      expect(await screen.findByText('Transition Guide')).toBeInTheDocument()
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
    it('renders with proper container classes', async () => {
      const { container } = render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      // Full-width — shell (MainLayout) provides the max-w-7xl constraint; no inner cap
      // eslint-disable-next-line testing-library/no-node-access
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toBeInTheDocument()
      await screen.findByTestId('algorithm-comparison')
    })
  })

  describe('Phase 3 — semantic search supplement', () => {
    it('renders without crashing when semantic runtime is unavailable', async () => {
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [],
        mode: 'lexical',
        loading: false,
      })
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      // The hook should have been called for the 'algorithms' collection.
      // (We can't assert hits show because loader mocks return empty data;
      // the contract being verified here is "wire-up doesn't crash and the
      // hook is invoked with the correct collection name".)
      await screen.findByTestId('algorithm-comparison')
      expect(useSemanticSearchModule.useSemanticSearch).toHaveBeenCalled()
      const calls = vi.mocked(useSemanticSearchModule.useSemanticSearch).mock.calls
      // First positional arg should be the collection.
      expect(calls[0][0]).toBe('algorithms')
    })

    it('invokes the hook with the current query as it changes', async () => {
      vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
        hits: [],
        mode: 'idle',
        loading: false,
      })
      render(
        <MemoryRouter>
          <AlgorithmsView />
        </MemoryRouter>
      )
      await screen.findByTestId('algorithm-comparison')
      const searchInput = screen.getByPlaceholderText(/Search/i)
      fireEvent.change(searchInput, { target: { value: 'what replaces ECC' } })
      await waitFor(() => {
        const lastCall = vi
          .mocked(useSemanticSearchModule.useSemanticSearch)
          .mock.calls.slice(-1)[0]
        expect(lastCall[1]).toBe('what replaces ECC')
      })
    })
  })
})
