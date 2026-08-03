// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResearcherFieldWatchCard } from './ResearcherFieldWatchCard'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import type { FieldWatchRow } from '@/data/researchFieldWatch'

// The card reports against the CORPUS RELEASE window, not a per-visitor
// timestamp, so the fixtures model a release and a row dated inside its window.
const RELEASE = Date.parse('2026-07-31T00:00:00Z')
const WINDOW_START = RELEASE - 90 * 24 * 60 * 60 * 1000
const ROW_TIMESTAMP = RELEASE - 10 * 24 * 60 * 60 * 1000 // inside the window

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

// A second fixture set with TWO deprecations in the same followed field, used
// only by the plural-punchline test below (the single-deprecation fixture
// above can only ever exercise the singular "1 document ... has been
// retracted" copy, never the plural "N documents ... have been retracted"
// branch).
const MULTI_DEPRECATED_ROWS: FieldWatchRow[] = [
  {
    referenceId: 'FIX-DEPRECATED-1',
    algorithmFamily: 'Lattice-based',
    lastUpdateDateMs: null,
    isDeprecated: true,
    deprecatedAtMs: ROW_TIMESTAMP,
  },
  {
    referenceId: 'FIX-DEPRECATED-2',
    algorithmFamily: 'Lattice-based',
    lastUpdateDateMs: null,
    isDeprecated: true,
    deprecatedAtMs: ROW_TIMESTAMP,
  },
]

let activeFixtureRows = FIXTURE_ROWS

// Mock only `loadFieldWatchCorpus` (the I/O adapter) — keep the real
// `computeResearchFieldWatch` so this test still exercises the real seam
// between the card and the compute module, per repo convention (test the
// seam, not just each half in isolation).
vi.mock('@/data/researchFieldWatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/researchFieldWatch')>()
  return {
    ...actual,
    loadFieldWatchCorpus: () => ({
      rows: activeFixtureRows,
      releaseDateMs: RELEASE,
      windowStartMs: WINDOW_START,
    }),
  }
})

function resetStore(overrides: { followedFields?: string[] } = {}) {
  useResearchFieldsStore.setState({ followedFields: overrides.followedFields ?? [] })
}

describe('ResearcherFieldWatchCard', () => {
  beforeEach(() => {
    resetStore()
    activeFixtureRows = FIXTURE_ROWS
  })

  it('renders the illustrative provenance chip and the title', () => {
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByText(/illustrative/i)).toBeInTheDocument()
    expect(screen.getByText('Changed in your fields')).toBeInTheDocument()
  })

  it('empty state: no followed fields yet shows the picker prompt, no data rows', () => {
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByText(/Pick a few fields/i)).toBeInTheDocument()
    expect(screen.queryAllByTestId('field-watch-row')).toHaveLength(0)
    expect(screen.queryByTestId('field-watch-punchline')).toBeNull()
  })

  it('the field picker is shown by default when nothing is followed yet', () => {
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument()
  })

  it('the field picker is collapsed by default once fields are already followed', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)
    expect(screen.queryByTestId('filter-dropdown')).toBeNull()
  })

  it('"Edit your fields" toggles the picker open and closed for a returning user', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)
    expect(screen.queryByTestId('filter-dropdown')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    expect(screen.queryByTestId('filter-dropdown')).toBeNull()
  })

  it('shows one row per followed field with the count of documents updated inside the release window', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)

    const row = screen.getByTestId('field-watch-row')
    expect(row).toHaveTextContent('Lattice-based')
    expect(row).toHaveTextContent('1 updated')
  })

  it('states the window it is reporting over, so the number is not a bare unexplained count', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('field-watch-window')).toHaveTextContent(
      /In the 90 days to 31 Jul 2026/
    )
  })

  it('shows the field-scoped retracted count and the honest punchline when something WAS retracted', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)

    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('-1 docs')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(/retracted/i)
    expect(screen.getByTestId('field-watch-punchline')).not.toHaveTextContent(
      'Nothing in the fields you follow was retracted.'
    )
  })

  it('uses the plural punchline copy when more than one document was retracted', () => {
    activeFixtureRows = MULTI_DEPRECATED_ROWS
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)

    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('-2 docs')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      '2 documents in the fields you follow were retracted.'
    )
  })

  it('shows the "nothing retracted" punchline when the followed field has no deprecations in range', () => {
    resetStore({ followedFields: ['qkd-quantum'] }) // no fixture row maps here
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Nothing in the fields you follow was retracted.'
    )
  })

  /**
   * REGRESSION (2026-08-02). The punchline used to read "Nothing you cited has
   * been retracted", a claim about a per-user citation list this app has never
   * had — asserted in the headline while the card's own footnote admitted the
   * gap in fine print. Whatever the copy says, it must not claim to know what
   * the researcher cited.
   */
  it('never claims to know what the researcher cited', () => {
    resetStore({ followedFields: ['qkd-quantum'] })
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('field-watch-punchline')).not.toHaveTextContent(/you cited/i)
  })

  it('toggling a new field on via the picker adds it to the store (multi-select reconciliation)', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByRole('option', { name: /^Hash-based$/ }))

    expect(useResearchFieldsStore.getState().followedFields).toContain('lattice-based')
    expect(useResearchFieldsStore.getState().followedFields).toContain('hash-based')
  })

  it('toggling an already-followed field off via the picker removes it from the store', () => {
    resetStore({ followedFields: ['lattice-based'] })
    render(<ResearcherFieldWatchCard />)

    fireEvent.click(screen.getByRole('button', { name: /edit your fields/i }))
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByRole('option', { name: /^Lattice-based$/ }))

    expect(useResearchFieldsStore.getState().followedFields).not.toContain('lattice-based')
  })

  it('renders at most 3 field rows even when more are followed', () => {
    resetStore({
      followedFields: ['lattice-based', 'hash-based', 'code-based', 'qkd-quantum'],
    })
    render(<ResearcherFieldWatchCard />)
    expect(screen.getAllByTestId('field-watch-row')).toHaveLength(3)
  })
})
