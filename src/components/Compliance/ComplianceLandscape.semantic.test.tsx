// SPDX-License-Identifier: GPL-3.0-only
/**
 * Focused integration test for ComplianceLandscape's Phase 3
 * semantic-search wire-up. Asserts the hook is invoked with the
 * 'compliance' collection and that the current search-filter text
 * flows through to it. Full-render behavioral coverage is provided
 * by ComplianceView.test.tsx (regression layer).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'
import { ComplianceLandscape } from './ComplianceLandscape'

vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return {
    ...actual,
    useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
  }
})

describe('ComplianceLandscape — Phase 3 semantic search', () => {
  beforeEach(() => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockClear()
  })

  it('invokes useSemanticSearch with the compliance collection', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <ComplianceLandscape />
      </MemoryRouter>
    )
    const calls = vi.mocked(useSemanticSearchModule.useSemanticSearch).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][0]).toBe('compliance')
  })

  it('passes the current local search query into the hook', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <ComplianceLandscape />
      </MemoryRouter>
    )
    const inputs = screen.getAllByPlaceholderText(/Search/i)
    const searchInput = inputs[0]
    fireEvent.change(searchInput, { target: { value: 'banking sector resilience' } })
    const calls = vi.mocked(useSemanticSearchModule.useSemanticSearch).mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[1]).toBe('banking sector resilience')
  })
})
