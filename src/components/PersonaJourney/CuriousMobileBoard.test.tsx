// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import '@testing-library/jest-dom'
import { CuriousMobileBoard } from './CuriousMobileBoard'
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

const TestTimeline = () => <div>Timeline Page</div>
const TestThreats = () => <div>Threats Page</div>
const TestLearn = () => <div>Learn Page</div>
const TestFaq = () => <div>FAQ Page</div>

function renderBoard(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<CuriousMobileBoard />} />
        <Route path="/timeline" element={<TestTimeline />} />
        <Route path="/threats" element={<TestThreats />} />
        <Route path="/learn" element={<TestLearn />} />
        <Route path="/faq" element={<TestFaq />} />
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
      expect(screen.getByText('About 6 minutes · nothing to install')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'What actually breaks, and when.' })
      ).toBeInTheDocument()
      expect(screen.getByText(/The padlock in your browser relies on maths/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Show me' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'I have 30 seconds' })).toBeInTheDocument()
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
      expect(rowLabels).toEqual(['Data captured today', 'Must stay secret for', 'Machine arrives'])

      const rowValues = within(card)
        .getAllByRole('definition')
        .map((el) => el.textContent)
      expect(rowValues).toEqual(['readable later', '12 years', '~2032'])

      expect(screen.getByText('The deadline already passed for some data.')).toBeInTheDocument()
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
  })
})
