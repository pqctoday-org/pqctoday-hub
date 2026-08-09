// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import '@testing-library/jest-dom'
import { CuriousMobileBoard } from './CuriousMobileBoard'
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { PERSONA_JOURNEY_BOARD_VARIANTS, resolveRoleBoardVariant } from '@/data/personaConfig'

/**
 * The board this surface shows by default. Every assertion below reads from
 * this rather than from a copy literal: until 2026-08-09 the component's
 * eyebrow, headline, sub, both CTA LABELS, side-card rows and punchline were
 * hardcoded, and these tests froze those literals in place — so the tests
 * agreed with the component while both disagreed with the CSV that is supposed
 * to own the copy.
 */
const DEFAULT_BOARD = PERSONA_JOURNEY_BOARD_VARIANTS.curious[0].board

const TestTimeline = () => <div>Timeline Page</div>
const TestThreats = () => <div>Threats Page</div>
const TestLearn = () => <div>Learn Page</div>
const TestFaq = () => <div>FAQ Page</div>
// Destination page for the hero's primary CTA — routed at whatever
// PERSONA_JOURNEY_BOARD.curious.ctaPrimaryHref actually is (not hardcoded),
// so this test tracks the real data source instead of assuming its value.
const TestCtaPrimaryDestination = () => <div>CTA Primary Destination Page</div>
// Same treatment for the secondary. Hardcoding it broke twice on 2026-08-02 as
// the boards were de-duplicated (/timeline -> /faq -> /tools/breach-simulator);
// routing at the real configured href tracks the data instead of the guess.
const TestCtaSecondaryDestination = () => <div>CTA Secondary Destination Page</div>

function renderBoard(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<CuriousMobileBoard />} />
        <Route path="/timeline" element={<TestTimeline />} />
        <Route path="/threats" element={<TestThreats />} />
        <Route path="/learn" element={<TestLearn />} />
        <Route path="/faq" element={<TestFaq />} />
        <Route path={DEFAULT_BOARD.ctaPrimaryHref} element={<TestCtaPrimaryDestination />} />
        <Route path={DEFAULT_BOARD.ctaSecondaryHref} element={<TestCtaSecondaryDestination />} />
      </Routes>
    </MemoryRouter>
  )
}

function getBottomNav() {
  return screen.getByRole('navigation', { name: /curious mobile navigation/i })
}

describe('CuriousMobileBoard', () => {
  beforeEach(() => {
    useCommandPaletteStore.setState({ isOpen: false })
    useRightPanelStore.setState({ isOpen: false, activeTab: 'chat', isMinimized: false })
  })

  describe('Hero', () => {
    it('renders the eyebrow, headline, sub-copy and both CTAs', () => {
      renderBoard()
      expect(screen.getByText(DEFAULT_BOARD.heroEyebrow)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: DEFAULT_BOARD.headline })).toBeInTheDocument()
      expect(screen.getByText(DEFAULT_BOARD.sub)).toBeInTheDocument()
      // The CTA LABELS come from the board too. They used to be the literals
      // 'Show me' and 'I have 30 seconds' — and the second one was actively
      // wrong: it promised the 30-second board while navigating to
      // ctaSecondaryHref, the breach-cost tool.
      expect(screen.getByRole('button', { name: DEFAULT_BOARD.ctaPrimary })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: DEFAULT_BOARD.ctaSecondary })).toBeInTheDocument()
    })

    // 2026-08-02 bug fix: both hero CTAs rendered as inert <Button>s with no
    // click behavior at all — the mobile-only counterpart of the desktop bug
    // already fixed 2026-08-01 (see PersonaBoardView.test.tsx). Presence
    // checks alone (above) don't catch this; these assert the click actually
    // navigates, to whatever PERSONA_JOURNEY_BOARD.curious's own hrefs are.
    it("tapping the primary CTA navigates to the board's configured ctaPrimaryHref", () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: DEFAULT_BOARD.ctaPrimary }))
      expect(screen.getByText('CTA Primary Destination Page')).toBeInTheDocument()
    })

    it("tapping the secondary CTA navigates to the board's configured ctaSecondaryHref", () => {
      // Routed at whatever the curious board's real ctaSecondaryHref is, so this
      // tracks the data rather than a literal. The href changed twice on
      // 2026-08-02 (/timeline -> /faq -> /tools/breach-simulator) as the 18
      // boards were given non-overlapping destinations.
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: DEFAULT_BOARD.ctaSecondary }))
      expect(screen.getByText('CTA Secondary Destination Page')).toBeInTheDocument()
    })
  })

  describe('HNDL card', () => {
    it('renders all three rows in the stacked order given, plus the punchline', () => {
      renderBoard()
      const card = screen.getByTestId('hndl-card')
      // <dt>/<dd> carry implicit ARIA roles "term"/"definition" — query those
      // instead of raw DOM traversal to confirm both content AND DOM order.
      const rowLabels = within(card)
        .getAllByRole('term')
        .map((el) => el.textContent)
      expect(rowLabels).toEqual(DEFAULT_BOARD.sideCard.rows.map((r) => r.label))

      const rowValues = within(card)
        .getAllByRole('definition')
        .map((el) => el.textContent)
      expect(rowValues).toEqual(DEFAULT_BOARD.sideCard.rows.map((r) => r.value))

      expect(screen.getByText(DEFAULT_BOARD.sideCard.punchline)).toBeInTheDocument()
    })
  })

  /**
   * The defect these cover: this board read `PERSONA_JOURNEY_BOARD.curious` —
   * the order-1 board alone — so every other curious board was unreachable
   * below `lg`. Two of three were invisible on mobile; at six it would have
   * been five of six.
   */
  describe('Board options', () => {
    it('renders a chip for every curious board, not just the default', () => {
      renderBoard()
      const chips = within(screen.getByTestId('board-variant-chips')).getAllByRole('radio')
      expect(chips).toHaveLength(PERSONA_JOURNEY_BOARD_VARIANTS.curious.length)
      expect(chips.map((c) => c.textContent)).toEqual(
        PERSONA_JOURNEY_BOARD_VARIANTS.curious.map((v) => v.chipLabel)
      )
    })

    it('marks exactly the active board as checked', () => {
      const target = PERSONA_JOURNEY_BOARD_VARIANTS.curious[1]
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<CuriousMobileBoard variantId={target.id} />} />
          </Routes>
        </MemoryRouter>
      )
      const checked = within(screen.getByTestId('board-variant-chips'))
        .getAllByRole('radio')
        .filter((c) => c.getAttribute('aria-checked') === 'true')
      expect(checked).toHaveLength(1)
      expect(checked[0]).toHaveTextContent(target.chipLabel)
    })

    it('renders the requested board, and its copy actually changes with it', () => {
      const target = PERSONA_JOURNEY_BOARD_VARIANTS.curious[1]
      const other = resolveRoleBoardVariant('curious', undefined).board
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<CuriousMobileBoard variantId={target.id} />} />
          </Routes>
        </MemoryRouter>
      )
      // Selecting a board has to change the WORDS, not just the CTA targets.
      // With the copy hardcoded, switching option would have moved the
      // destinations while every visible string stayed put.
      expect(screen.getByRole('heading', { name: target.board.headline })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: other.headline })).not.toBeInTheDocument()
      expect(screen.getByText(target.board.sideCard.punchline)).toBeInTheDocument()
    })

    it('reports the chosen board id to its parent', () => {
      const seen: string[] = []
      const target = PERSONA_JOURNEY_BOARD_VARIANTS.curious[2]
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<CuriousMobileBoard onSelectVariant={(id) => seen.push(id)} />}
            />
          </Routes>
        </MemoryRouter>
      )
      fireEvent.click(screen.getByTestId(`board-variant-chip-${target.id}`))
      expect(seen).toEqual([target.id])
    })

    it('falls back to the default board when given an id that no longer exists', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<CuriousMobileBoard variantId="deleted-long-ago" />} />
          </Routes>
        </MemoryRouter>
      )
      // A stale persisted id or a hand-typed ?variant= must be harmless, not blank.
      expect(screen.getByRole('heading', { name: DEFAULT_BOARD.headline })).toBeInTheDocument()
    })
  })

  describe('Labs-gating box', () => {
    it('renders the honest, non-error callout text', () => {
      renderBoard()
      const box = screen.getByTestId('labs-gating')
      expect(box).toHaveTextContent('Want the hands-on labs?')
      expect(box).toHaveTextContent(
        /They run real cryptography and need a laptop\. We.ll send you a link — or carry on reading here\. Nothing is locked\./
      )
    })
  })

  describe('Bottom tab bar', () => {
    it('renders exactly 5 tabs, each with a real lucide icon component (not a text glyph)', () => {
      renderBoard()
      const nav = getBottomNav()

      // Each icon carries a data-testid on the actual <svg> lucide renders —
      // asserting tagName === 'svg' proves a real icon component mounted,
      // not a unicode glyph (which would just be text content).
      expect(screen.getByTestId('icon-tab-start').tagName.toLowerCase()).toBe('svg')
      expect(screen.getByTestId('icon-tab-timeline').tagName.toLowerCase()).toBe('svg')
      expect(screen.getByTestId('icon-tab-threats').tagName.toLowerCase()).toBe('svg')
      expect(screen.getByTestId('icon-tab-learn').tagName.toLowerCase()).toBe('svg')
      expect(screen.getByTestId('icon-tab-search').tagName.toLowerCase()).toBe('svg')

      expect(within(nav).getByText('Start')).toBeInTheDocument()
      expect(within(nav).getByText('Timeline')).toBeInTheDocument()
      expect(within(nav).getByText('Threats')).toBeInTheDocument()
      expect(within(nav).getByText('Learn')).toBeInTheDocument()
      expect(within(nav).getByText('Search')).toBeInTheDocument()
    })

    // Each tab is a NavLink (<a>) wrapping a <Button> (<button>) that carries
    // the "X view" aria-label — same nested link->button pattern MainLayout's
    // own rail rows use. The accessible NAME of the outer <a> is computed
    // from its rendered text ("Timeline"), not the inner button's aria-label
    // ("Timeline view") — so, exactly like MainLayout.test.tsx, we query the
    // inner `button` role for the "X view" name, then let the click bubble to
    // the enclosing NavLink to actually navigate.
    it('tapping Timeline navigates to /timeline', () => {
      renderBoard()
      fireEvent.click(within(getBottomNav()).getByRole('button', { name: /timeline view/i }))
      expect(screen.getByText('Timeline Page')).toBeInTheDocument()
    })

    it('tapping Threats navigates to /threats', () => {
      renderBoard()
      fireEvent.click(within(getBottomNav()).getByRole('button', { name: /threats view/i }))
      expect(screen.getByText('Threats Page')).toBeInTheDocument()
    })

    it('tapping Learn navigates to /learn', () => {
      renderBoard()
      fireEvent.click(within(getBottomNav()).getByRole('button', { name: /learn view/i }))
      expect(screen.getByText('Learn Page')).toBeInTheDocument()
    })

    it('the Start tab links to "/"', () => {
      renderBoard()
      // The Start tab's enclosing NavLink has no distinguishing accessible
      // name of its own (its name-from-content is the inner button's visible
      // text, not its aria-label) — find it among the nav's links by href
      // instead of DOM-traversing up from the button.
      const links = within(getBottomNav()).getAllByRole('link')
      const startLink = links.find((el) => el.getAttribute('href') === '/')
      expect(startLink).toBeDefined()
    })

    it('tapping the Search tab opens the command palette (no route change)', () => {
      renderBoard()
      expect(useCommandPaletteStore.getState().isOpen).toBe(false)
      fireEvent.click(within(getBottomNav()).getByRole('button', { name: /search view/i }))
      expect(useCommandPaletteStore.getState().isOpen).toBe(true)
    })
  })

  describe('Header search entry point', () => {
    it('opens the command palette when the search field is clicked', () => {
      renderBoard()
      expect(useCommandPaletteStore.getState().isOpen).toBe(false)
      fireEvent.click(screen.getByRole('searchbox', { name: /search pqc today/i }))
      expect(useCommandPaletteStore.getState().isOpen).toBe(true)
    })

    it('also opens the command palette on focus (e.g. tabbing in), not just click', () => {
      renderBoard()
      expect(useCommandPaletteStore.getState().isOpen).toBe(false)
      fireEvent.focus(screen.getByRole('searchbox', { name: /search pqc today/i }))
      expect(useCommandPaletteStore.getState().isOpen).toBe(true)
    })
  })

  describe('"More" menu', () => {
    it('opens a menu with Assistant, Journey and FAQ entries', () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: /more menu/i }))
      const dialog = screen.getByRole('dialog', { name: /more/i })
      expect(within(dialog).getByRole('button', { name: /assistant/i })).toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: /journey/i })).toBeInTheDocument()
      expect(within(dialog).getByRole('link', { name: /faq/i })).toBeInTheDocument()
    })

    it('Assistant entry opens the right panel on the chat tab', () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: /more menu/i }))
      fireEvent.click(screen.getByRole('button', { name: /assistant/i }))
      expect(useRightPanelStore.getState().isOpen).toBe(true)
      expect(useRightPanelStore.getState().activeTab).toBe('chat')
    })

    it('Journey entry opens the right panel on the history tab', () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: /more menu/i }))
      fireEvent.click(screen.getByRole('button', { name: /journey/i }))
      expect(useRightPanelStore.getState().isOpen).toBe(true)
      expect(useRightPanelStore.getState().activeTab).toBe('history')
    })

    it('FAQ entry navigates to /faq', () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: /more menu/i }))
      fireEvent.click(screen.getByRole('link', { name: /faq/i }))
      expect(screen.getByText('FAQ Page')).toBeInTheDocument()
    })

    it('closes via the backdrop click, without firing any of the entry actions', () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: /more menu/i }))
      expect(screen.getByRole('dialog', { name: /more/i })).toBeInTheDocument()

      // The backdrop is decorative (aria-hidden, no accessible role/name) —
      // query it the same testid-based way the rest of this file already
      // queries other non-accessible decorative elements (hndl-card,
      // labs-gating, icon-*).
      fireEvent.click(screen.getByTestId('more-menu-backdrop'))
      expect(screen.queryByRole('dialog', { name: /more/i })).toBeNull()
      expect(useRightPanelStore.getState().isOpen).toBe(false)
    })

    it('closes via the explicit "Close menu" button', () => {
      renderBoard()
      fireEvent.click(screen.getByRole('button', { name: /more menu/i }))
      expect(screen.getByRole('dialog', { name: /more/i })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
      expect(screen.queryByRole('dialog', { name: /more/i })).toBeNull()
    })
  })
})
