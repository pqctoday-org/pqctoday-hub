// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobileHeader } from './MobileHeader'
import { useVersionStore } from '@/store/useVersionStore'
import { usePersonaStore } from '@/store/usePersonaStore'

function renderHeader(
  initialPath: string,
  persona: Parameters<typeof MobileHeader>[0]['persona'] = null
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <MobileHeader
              persona={persona}
              onOpenPageActions={vi.fn()}
              onOpenRoleSwitch={vi.fn()}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  useVersionStore.getState().resetForTesting()
  usePersonaStore.getState().setPersona(null)
})

describe('MobileHeader', () => {
  it('shows the brand wordmark on Home, not a back button', () => {
    renderHeader('/')
    expect(screen.getByText('PQC Today')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('shows a back button and the real page title on a non-home route', () => {
    renderHeader('/timeline')
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByText('Timeline')).toBeInTheDocument()
  })

  it('shows the Guide button only on a route with a registered page id', () => {
    renderHeader('/timeline')
    expect(screen.getByRole('button', { name: 'Guide' })).toBeInTheDocument()
  })

  it('omits Guide on a route with no registered page id', () => {
    renderHeader('/some-route-with-no-manual-entry')
    expect(screen.queryByRole('button', { name: 'Guide' })).not.toBeInTheDocument()
  })

  it('shows "Everyone" when no persona is selected', () => {
    renderHeader('/', null)
    expect(screen.getByRole('button', { name: /currently Everyone/ })).toBeInTheDocument()
  })

  it('shows the real persona label when one is selected', () => {
    renderHeader('/', 'executive')
    expect(screen.getByRole('button', { name: /currently Executive/ })).toBeInTheDocument()
  })

  // 2026-10-23: at 390 px the pill's text left the page title 25-45 px ("PQ…"). Below 430 px
  // the pill shows its icon only; the role still reads from the aria-label, and the label
  // text stays in the DOM for wider phones. (jsdom has no layout, so this pins the classes.)
  it('keeps the role label for wider phones and drops it visually on narrow ones', () => {
    renderHeader('/learn/cc-eucc-certification', 'cert-engineer')
    const pill = screen.getByRole('button', { name: /currently/ })
    expect(pill).toHaveClass('max-[429px]:w-8', 'max-[429px]:px-0')
    const label = pill.querySelector('span')
    expect(label).toHaveClass('max-[429px]:sr-only')
    expect(label?.textContent).toBeTruthy()
  })

  it('always renders Search and More', () => {
    useVersionStore.getState().markAllSeen()
    renderHeader('/assess')
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
  })

  it("shows the More button's unread dot when there are real unseen changelog entries", () => {
    useVersionStore.getState().resetForTesting()
    renderHeader('/assess')
    expect(screen.getByRole('button', { name: 'More — unread updates' })).toBeInTheDocument()
    // 2026-08-24 audit R5: this dot used to be a hand-inlined span duplicating
    // MobileBadge's own plain-dot rendering — now the shared primitive itself.
    expect(screen.getByTestId('mobile-header-more-unread-dot')).toBeInTheDocument()
  })

  it('hides the unread dot once the version is marked seen', () => {
    useVersionStore.getState().markAllSeen()
    renderHeader('/assess')
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More — unread updates' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-header-more-unread-dot')).not.toBeInTheDocument()
  })
})

describe('MobileHeader: the title is plain text, not a heading', () => {
  // Every phone page carries its own level-one heading, so a header heading as well made two on
  // 196 of 199 pages. The title stays visible as text.
  it.each([
    ['/', 'PQC Today'],
    ['/timeline', 'Timeline'],
    ['/some-route-with-no-title', 'PQC Today'],
  ])('on %s the title is text, and the header has no heading', (path, text) => {
    renderHeader(path)
    expect(screen.getByTestId('mobile-header-title')).toHaveTextContent(text)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
