// SPDX-License-Identifier: GPL-3.0-only
/**
 * CommandPalette — the three visibility fixes: per-group cap with "Show N more",
 * the Authoritative-only hidden-results hint, and the loading status line.
 * The search stack is mocked; ranking is covered by the UnifiedSearchService tests.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { SearchResult } from '@/services/search/SearchIndex'
import type { PaletteHiddenHit } from '@/services/search/UnifiedSearchService'
import { CommandPalette } from './CommandPalette'

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

type Out = { results: SearchResult[]; hidden: PaletteHiddenHit[] }
const mocks = vi.hoisted(() => ({
  searchWithHidden: vi.fn(),
  getSearchIndex: vi.fn(),
}))
vi.mock('@/services/search/SearchIndex', () => mocks)

function hit(id: string, source: string, title = id): SearchResult {
  return { id, source, title, content: `${title} content`, score: 1, match: {} }
}

/** 16 Learn Q&A hits ahead of the Glossary hit, like "purdue model for OT". */
const PURDUE: Out = {
  results: [
    ...Array.from({ length: 16 }, (_, i) => hit(`qa-${i}`, 'module-qa', `QA ${i}`)),
    hit('glossary-383', 'glossary', 'Purdue Model'),
  ],
  hidden: [],
}

function renderPalette() {
  return render(
    <MemoryRouter>
      <CommandPalette isOpen onClose={vi.fn()} />
    </MemoryRouter>
  )
}

async function type(q: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), { target: { value: q } })
}

const options = () => screen.queryAllByRole('option')

beforeEach(() => {
  // jsdom has no layout, so no scrollIntoView (the palette calls it on the active row).
  Element.prototype.scrollIntoView = vi.fn()
  localStorage.clear()
  mocks.searchWithHidden.mockReset()
  mocks.getSearchIndex.mockReset()
  mocks.getSearchIndex.mockResolvedValue({})
})

describe('CommandPalette — per-group cap', () => {
  it('shows 5 rows of a 16-hit group, then "Show 11 more", then the next group', async () => {
    mocks.searchWithHidden.mockResolvedValue(PURDUE)
    renderPalette()
    await type('zzz')
    await screen.findByText('Purdue Model')

    const rows = options()
    // 5 Learn rows + the control + the glossary row
    expect(rows).toHaveLength(7)
    expect(rows[5]).toHaveAccessibleName('Show 11 more Learn results')
    expect(rows[6]).toHaveTextContent('Purdue Model')
    expect(screen.queryByText('QA 5')).toBeNull()
    // header still reports the full group size
    expect(screen.getByText('Learn (16)')).toBeInTheDocument()
  })

  it('expands a group in place and leaves other groups alone', async () => {
    mocks.searchWithHidden.mockResolvedValue(PURDUE)
    renderPalette()
    await type('zzz')
    fireEvent.click(await screen.findByTestId('cmdk-show-more'))

    expect(options()).toHaveLength(17)
    expect(screen.queryByTestId('cmdk-show-more')).toBeNull()
    expect(screen.getByText('QA 15')).toBeInTheDocument()
    expect(screen.getByText('Purdue Model')).toBeInTheDocument()
  })

  it('keyboard: ArrowDown reaches the control, Enter expands it and keeps the cursor on the first new row', async () => {
    mocks.searchWithHidden.mockResolvedValue(PURDUE)
    renderPalette()
    await type('zzz')
    await screen.findByTestId('cmdk-show-more')
    const dialog = screen.getByRole('dialog')

    for (let i = 0; i < 5; i++) fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    expect(screen.getByTestId('cmdk-show-more')).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(dialog, { key: 'Enter' })

    await waitFor(() => expect(options()).toHaveLength(17))
    expect(screen.getByText('QA 5').closest('[role="option"]')).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('keyboard never walks past the last visible row', async () => {
    mocks.searchWithHidden.mockResolvedValue(PURDUE)
    renderPalette()
    await type('zzz')
    await screen.findByText('Purdue Model')
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 40; i++) fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    const selected = options().filter((o) => o.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent('Purdue Model')
  })
})

describe('CommandPalette — Authoritative-only hint', () => {
  const FILTERED: Out = {
    results: [hit('lib-1', 'library', 'NIST SP 800-208')],
    hidden: [
      { id: 'g1', source: 'glossary' },
      { id: 'g2', source: 'glossary' },
      { id: 'q1', source: 'module-qa' },
    ],
  }

  it('shows the count, the sources and a button that turns the filter off', async () => {
    localStorage.setItem('pqc-cmdk-authoritative-only', '1')
    mocks.searchWithHidden.mockResolvedValue(FILTERED)
    renderPalette()
    await type('zzz')

    const hint = await screen.findByTestId('cmdk-hidden-hint')
    expect(hint).toHaveAttribute('aria-live', 'polite')
    expect(hint).toHaveTextContent(
      '3 more results hidden by Authoritative only (e.g. Glossary, Learn)'
    )
    expect(mocks.searchWithHidden.mock.calls[0][1]).toMatchObject({ authoritativeOnly: true })

    mocks.searchWithHidden.mockResolvedValue({ results: [], hidden: [] })
    fireEvent.click(within(hint).getByRole('button', { name: /turn it off/i }))

    await waitFor(() =>
      expect(mocks.searchWithHidden.mock.calls.at(-1)![1]).toMatchObject({
        authoritativeOnly: false,
      })
    )
    expect(screen.queryByTestId('cmdk-hidden-hint')).toBeNull()
    expect(localStorage.getItem('pqc-cmdk-authoritative-only')).toBe('0')
    expect(screen.getByTestId('cmdk-authoritative-toggle')).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not appear when nothing was hidden', async () => {
    localStorage.setItem('pqc-cmdk-authoritative-only', '1')
    mocks.searchWithHidden.mockResolvedValue({ results: FILTERED.results, hidden: [] })
    renderPalette()
    await type('zzz')
    await screen.findByText('NIST SP 800-208')
    expect(screen.queryByTestId('cmdk-hidden-hint')).toBeNull()
  })

  it('does not appear when the filter is off', async () => {
    mocks.searchWithHidden.mockResolvedValue({ results: FILTERED.results, hidden: FILTERED.hidden })
    renderPalette()
    await type('zzz')
    await screen.findByText('NIST SP 800-208')
    expect(screen.queryByTestId('cmdk-hidden-hint')).toBeNull()
  })

  it('stays alongside the "No results" message when everything was hidden', async () => {
    localStorage.setItem('pqc-cmdk-authoritative-only', '1')
    mocks.searchWithHidden.mockResolvedValue({ results: [], hidden: FILTERED.hidden })
    renderPalette()
    await type('zzz')
    expect(await screen.findByTestId('cmdk-hidden-hint')).toBeInTheDocument()
    expect(screen.getByText(/No results for/)).toBeInTheDocument()
  })

  it('the footer toggle shows an explicit ON state', async () => {
    localStorage.setItem('pqc-cmdk-authoritative-only', '1')
    renderPalette()
    const toggle = screen.getByTestId('cmdk-authoritative-toggle')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveTextContent('Authoritative only: ON')
  })
})

describe('CommandPalette — loading line', () => {
  it('shows a polite "Loading search index…" status while the index builds, then the results', async () => {
    let resolve!: (o: Out) => void
    mocks.getSearchIndex.mockReturnValue(new Promise(() => undefined))
    mocks.searchWithHidden.mockReturnValue(new Promise<Out>((r) => (resolve = r)))
    renderPalette()
    await type('zzz')

    const status = await screen.findByText('Loading search index…')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByText(/No results for/)).toBeNull()

    resolve({ results: [hit('glossary-383', 'glossary', 'Purdue Model')], hidden: [] })
    await screen.findByText('Purdue Model')
    expect(screen.queryByText('Loading search index…')).toBeNull()
  })

  it('keeps the real no-results message for a genuinely empty result', async () => {
    mocks.searchWithHidden.mockResolvedValue({ results: [], hidden: [] })
    renderPalette()
    await type('zzzzqqqq')
    expect(await screen.findByText(/No results for/)).toBeInTheDocument()
    expect(screen.queryByText('Loading search index…')).toBeNull()
  })
})
