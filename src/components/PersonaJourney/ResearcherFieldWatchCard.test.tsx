// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResearcherFieldWatchCard } from './ResearcherFieldWatchCard'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import type { FieldWatchRow } from '@/data/researchFieldWatch'

const OLD_VISIT = Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago
const ROW_TIMESTAMP = Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago — after OLD_VISIT, before "now"

const FIXTURE_ROWS: FieldWatchRow[] = [
  {
    referenceId: 'FIX-REVISED',
    algorithmFamily: 'Lattice-based',
    lastUpdateDateMs: ROW_TIMESTAMP,
    isDeprecated: false,
    deprecatedAtMs: null,
  },
  {
    referenceId: 'FIX-DEPRECATED',
    algorithmFamily: 'Lattice-based',
    lastUpdateDateMs: null,
    isDeprecated: true,
    deprecatedAtMs: ROW_TIMESTAMP,
  },
]

// Mock only `loadFieldWatchRows` (the I/O adapter) — keep the real
// `computeResearchFieldWatch` so this test still exercises the real seam
// between the card and the compute module, per repo convention (test the
// seam, not just each half in isolation).
vi.mock('@/data/researchFieldWatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/researchFieldWatch')>()
  return {
    ...actual,
    loadFieldWatchRows: () => FIXTURE_ROWS,
  }
})

function resetStore(overrides: { followedFields?: string[]; lastVisitedAt?: number | null } = {}) {
  useResearchFieldsStore.setState({
    followedFields: overrides.followedFields ?? [],
    lastVisitedAt: overrides.lastVisitedAt ?? null,
  })
}

describe('ResearcherFieldWatchCard', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders the illustrative provenance chip and the title', () => {
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByText(/illustrative/i)).toBeInTheDocument()
    expect(screen.getByText('Changed in your fields since your last visit')).toBeInTheDocument()
  })

  it('empty state: no followed fields yet shows the picker prompt, no data rows', () => {
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByText(/Pick a few fields below to start tracking/i)).toBeInTheDocument()
    expect(screen.queryAllByTestId('field-watch-row')).toHaveLength(0)
    expect(screen.queryByTestId('field-watch-punchline')).toBeNull()
  })

  it('the field picker is shown by default when nothing is followed yet', () => {
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument()
  })

  it('the field picker is collapsed by default once fields are already followed', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)
    expect(screen.queryByTestId('filter-dropdown')).toBeNull()
  })

  it('"Edit your fields" toggles the picker open and closed for a returning user', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)
    expect(screen.queryByTestId('filter-dropdown')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    expect(screen.queryByTestId('filter-dropdown')).toBeNull()
  })

  it('shows one row per followed field with the correct revision count, using the PREVIOUS visit boundary (not "now") even after markVisited() fires on mount', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)

    const row = screen.getByTestId('field-watch-row')
    expect(row).toHaveTextContent('Lattice-based')
    expect(row).toHaveTextContent('1 revision')
  })

  it('shows the corpus-deprecated count and the honest (non-hardcoded) punchline when something WAS deprecated', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)

    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('-1 docs')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(/retracted/i)
    expect(screen.getByTestId('field-watch-punchline')).not.toHaveTextContent(
      'Nothing you cited has been retracted.'
    )
  })

  it('shows the "nothing retracted" punchline when the followed field has no deprecations in range', () => {
    resetStore({ followedFields: ['qkd-quantum'], lastVisitedAt: OLD_VISIT }) // no fixture row maps here
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Nothing you cited has been retracted.'
    )
  })

  it('calls markVisited() on mount, updating the store for the NEXT visit, without changing what THIS visit displays', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)

    const after = useResearchFieldsStore.getState().lastVisitedAt
    expect(after).not.toBe(OLD_VISIT)
    expect(after).toBeGreaterThan(OLD_VISIT)

    // Still showing the count computed against the OLD boundary, not zeroed
    // out by the just-written "now" value.
    expect(screen.getByTestId('field-watch-row')).toHaveTextContent('1 revision')
  })

  it('toggling a new field on via the picker adds it to the store (multi-select reconciliation)', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByRole('option', { name: /^Hash-based$/ }))

    expect(useResearchFieldsStore.getState().followedFields).toContain('lattice-based')
    expect(useResearchFieldsStore.getState().followedFields).toContain('hash-based')
  })

  it('toggling an already-followed field off via the picker removes it from the store', () => {
    resetStore({ followedFields: ['lattice-based'], lastVisitedAt: OLD_VISIT })
    render(<ResearcherFieldWatchCard />)

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByRole('option', { name: /^Lattice-based$/ }))

    expect(useResearchFieldsStore.getState().followedFields).not.toContain('lattice-based')
  })

  it('renders at most 3 field rows even when more are followed', () => {
    resetStore({
      followedFields: ['lattice-based', 'hash-based', 'code-based', 'qkd-quantum'],
      lastVisitedAt: OLD_VISIT,
    })
    render(<ResearcherFieldWatchCard />)
    expect(screen.getAllByTestId('field-watch-row')).toHaveLength(3)
  })
})
