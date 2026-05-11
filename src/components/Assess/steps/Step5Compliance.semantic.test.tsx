// SPDX-License-Identifier: GPL-3.0-only
/**
 * Phase 3 tests for Step5Compliance's free-text business-context
 * rescue: opt-in disclosure that proposes frameworks not visible in
 * the structured tier groups.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'
import { Step5Compliance } from './Step5Compliance'

vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return {
    ...actual,
    useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
  }
})

describe('Step5Compliance — Phase 3 free-text business-context rescue', () => {
  beforeEach(() => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockClear()
  })

  it('renders the disclosure trigger', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/Don.{1,3}t see your framework\? Describe your context/)
    ).toBeInTheDocument()
  })

  it('disclosure is collapsed by default (textarea hidden)', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    // No textarea rendered before expansion.
    expect(screen.queryByPlaceholderText(/Brazilian fintech/i)).not.toBeInTheDocument()
  })

  it('expanding the disclosure reveals the textarea', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    const trigger = screen.getByText(/Don.{1,3}t see your framework\? Describe your context/)
    fireEvent.click(trigger)
    expect(screen.getByPlaceholderText(/Brazilian fintech/i)).toBeInTheDocument()
  })

  it('typing in the textarea drives the useSemanticSearch hook', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Don.{1,3}t see your framework\? Describe your context/))
    const textarea = screen.getByPlaceholderText(/Brazilian fintech/i)
    fireEvent.change(textarea, { target: { value: 'sample context' } })
    const calls = vi.mocked(useSemanticSearchModule.useSemanticSearch).mock.calls
    const sawQuery = calls.some((c) => c[0] === 'compliance' && c[1] === 'sample context')
    expect(sawQuery).toBe(true)
  })

  it('shows a fallback hint when runtime falls back to lexical', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'lexical',
      loading: false,
    })
    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Don.{1,3}t see your framework\? Describe your context/))
    const textarea = screen.getByPlaceholderText(/Brazilian fintech/i)
    fireEvent.change(textarea, { target: { value: 'sample context' } })
    expect(screen.getByText(/Semantic search unavailable/i)).toBeInTheDocument()
  })

  it('renders nothing extra when query is empty and runtime is idle', () => {
    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [],
      mode: 'idle',
      loading: false,
    })
    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Don.{1,3}t see your framework\? Describe your context/))
    // No "Suggested frameworks" header, no "Semantic search unavailable", no loading hint.
    expect(screen.queryByText(/Suggested frameworks/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Loading semantic search/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Semantic search unavailable/i)).not.toBeInTheDocument()
  })
})
