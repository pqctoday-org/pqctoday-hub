// SPDX-License-Identifier: GPL-3.0-only
/**
 * Focused integration test for MigrateView's Phase 3 semantic-search
 * wire-up. The full MigrateView is heavy (many child components +
 * data loaders); rather than reproduce its existing SoftwareTable
 * test mocks, this file mocks the hook and asserts the wire-up
 * contract directly via mock spies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'
import { MigrateView } from './MigrateView'

vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return {
    ...actual,
    useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
  }
})

describe('MigrateView — Phase 3 semantic search', () => {
  beforeEach(() => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockClear()
  })

  it('invokes useSemanticSearch with the migrate collection', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <MigrateView />
      </MemoryRouter>
    )
    const calls = vi.mocked(useSemanticSearchModule.useSemanticSearch).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][0]).toBe('migrate')
  })

  it('passes the search input value into the hook after the debounce settles', async () => {
    vi.useFakeTimers()
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <MigrateView />
      </MemoryRouter>
    )
    const inputs = screen.getAllByPlaceholderText(/Search/i)
    const searchInput = inputs[0]
    fireEvent.change(searchInput, { target: { value: 'quantum-safe VPN' } })
    // MigrateView debounces filterText via lodash debounce(200ms).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    const calls = vi.mocked(useSemanticSearchModule.useSemanticSearch).mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[1]).toBe('quantum-safe VPN')
    vi.useRealTimers()
  })
})
