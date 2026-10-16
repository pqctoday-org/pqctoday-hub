// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Maturity and trust are two different questions, and the Library must not let
 * one be read as the other:
 *  - the card shows the lifecycle chip right beside the trust tag, shaped
 *    differently (rounded chip vs "Trust NN" tag);
 *  - the drawer prints the publisher's own document status on its own line,
 *    apart from the trust section;
 *  - the CSWP 39 filter is named for what it filters, not "Authoritative".
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { libraryData, type LibraryItem } from '@/data/libraryData'
import { getTrustScore } from '@/data/trustScore'
import { LibraryDocumentCard } from './LibraryDocumentCard'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'
import { LibraryControlDeck } from './LibraryControlDeck'
import { publisherStatusText } from './libraryPills'
import { LibraryViewRedesign } from './LibraryViewRedesign'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

const noop = () => undefined

/** A real record that has a trust score, so the card renders its trust tag. */
const scored = libraryData.find((d) => getTrustScore('library', d.referenceId) != null)

function draftWithScore(overrides: Partial<LibraryItem> = {}): LibraryItem {
  if (!scored) throw new Error('no library record carries a trust score')
  return {
    ...scored,
    documentStatus: 'Internet-Draft (RFC Editor Queue)',
    lifecycleLabel: 'Draft',
    priorRevisions: undefined,
    ...overrides,
  }
}

describe('Library card: lifecycle beside trust', () => {
  it('puts the lifecycle chip next to the trust tag, in a different shape', () => {
    render(
      <LibraryDocumentCard
        item={draftWithScore()}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    const meta = screen.getByTestId('library-card-meta')
    const lifecycle = within(meta).getByTestId('library-card-lifecycle')
    const trust = within(meta).getByTestId('library-card-trust')
    expect(lifecycle).toHaveTextContent('Draft')
    expect(trust).toHaveTextContent(/^Trust \d+$/)
    // Same row (both found within it), lifecycle first.
    expect(lifecycle.compareDocumentPosition(trust) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Visually distinct: a rounded chip vs a square-cornered tag.
    expect(lifecycle.className).toMatch(/rounded-full/)
    expect(trust.className).toMatch(/rounded-md/)
    expect(trust.className).not.toMatch(/rounded-full/)
    // The hover text says which question each answers.
    expect(lifecycle).toHaveAttribute(
      'title',
      expect.stringContaining('Internet-Draft (RFC Editor Queue)')
    )
    expect(lifecycle.getAttribute('title')).toMatch(/not a trust rating/)
    expect(trust.getAttribute('title')).toMatch(/does not say how mature/)
  })

  it('never puts the "Unverified — needs review" placeholder in the hover text', () => {
    render(
      <LibraryDocumentCard
        item={draftWithScore({ documentStatus: 'Unverified — needs review' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    const title = screen.getByTestId('library-card-lifecycle').getAttribute('title') ?? ''
    expect(title).not.toMatch(/unverified/i)
    expect(title).toMatch(/^Lifecycle: Draft\./)
  })

  it('shows the lifecycle label exactly once on the card', () => {
    render(
      <LibraryDocumentCard
        item={draftWithScore()}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getAllByText('Draft')).toHaveLength(1)
  })
})

describe('Library drawer: document status on its own line', () => {
  function openDrawer(item: LibraryItem) {
    render(
      <MemoryRouter initialEntries={['/library?ref=x']}>
        <LibraryDetailDrawer
          item={item}
          bookmarked={false}
          onToggleBookmark={noop}
          onClose={noop}
        />
      </MemoryRouter>
    )
    return screen.getByRole('dialog')
  }

  it("prints the publisher's status words apart from the trust section", () => {
    const drawer = openDrawer(draftWithScore())
    const line = within(drawer).getByTestId('drawer-document-status')
    expect(line).toHaveTextContent('Document status: Internet-Draft (RFC Editor Queue)')
    expect(within(drawer).getByTestId('drawer-lifecycle')).toHaveTextContent('Draft')
    // In the header, above (not inside) the trust section.
    const trustHeading = within(drawer).getByText('Trust & evidence')
    expect(
      line.compareDocumentPosition(trustHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      within(drawer).getByText(/Trust rates how well this catalog record is sourced/)
    ).toBeInTheDocument()
  })

  it('leaves the line out when the status only repeats the lifecycle label', () => {
    const drawer = openDrawer(draftWithScore({ documentStatus: 'Draft' }))
    expect(within(drawer).queryByTestId('drawer-document-status')).toBeNull()
  })

  it.each([
    'Unverified — needs review',
    '  unverified — NEEDS review  ',
    'UNVERIFIED — NEEDS REVIEW',
  ])('never shows the "%s" placeholder as a status', (placeholder) => {
    const drawer = openDrawer(draftWithScore({ documentStatus: placeholder }))
    expect(within(drawer).queryByTestId('drawer-document-status')).toBeNull()
    expect(within(drawer).queryByText(/unverified/i)).toBeNull()
  })

  it('leaves the line out when there is no status', () => {
    const drawer = openDrawer(draftWithScore({ documentStatus: '' }))
    expect(within(drawer).queryByTestId('drawer-document-status')).toBeNull()
  })
})

describe('the CSWP 39 filter is named for what it filters', () => {
  it('the Advanced toggle reads "Mapped to NIST CSWP 39", never "Authoritative"', () => {
    render(
      <LibraryControlDeck
        search=""
        onSearch={noop}
        semanticMode="idle"
        semanticLoading={false}
        semanticHitCount={0}
        sortBy="published"
        onSort={noop}
        view="cards"
        onView={noop}
        orgs={['NIST']}
        activeOrg="All"
        onOrg={noop}
        authOnly
        onAuthOnly={noop}
        onReset={noop}
        advancedActive
      />
    )
    const toggle = screen.getByRole('button', { name: 'Mapped to NIST CSWP 39' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText(/Authoritative sources/)).toBeNull()
  })

  it('the active-filter chip for ?cswp39 uses the same name', { timeout: 60_000 }, () => {
    render(
      <MemoryRouter initialEntries={['/library?cswp39=1']}>
        <LibraryViewRedesign />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Mapped to NIST CSWP 39').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Authoritative sources/)).toBeNull()
  })
})

describe('publisherStatusText', () => {
  it('drops blank, placeholder and lifecycle-repeating statuses, keeps real ones', () => {
    expect(publisherStatusText('', 'Draft')).toBe('')
    expect(publisherStatusText(undefined, 'Draft')).toBe('')
    expect(publisherStatusText('Unverified — needs review', 'Released')).toBe('')
    expect(publisherStatusText(' unverified — needs REVIEW ', 'Released')).toBe('')
    expect(publisherStatusText('released', 'Released')).toBe('')
    expect(publisherStatusText(' Proposed Standard ', 'Released')).toBe('Proposed Standard')
  })
})

describe('trust word on the card (trust is not maturity)', () => {
  it('uses the pill thresholds and never says "Authoritative"', async () => {
    const { trustInfo } = await import('./libraryPills')
    const words = new Set<string>()
    for (const item of libraryData) {
      const info = trustInfo(item.referenceId)
      words.add(info.source)
      if (info.score == null) continue
      const expected =
        info.score >= 80 ? 'High trust' : info.score >= 66 ? 'Moderate trust' : 'Needs review'
      expect(info.source, item.referenceId).toBe(expected)
    }
    expect(words.has('Authoritative' as never)).toBe(false)
  })
})
