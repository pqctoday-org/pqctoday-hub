// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PERSONAS } from '../../data/learningPersonas'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MainLayout } from './MainLayout'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'

vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('../../hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// WhatsNewModal is React.lazy in MainLayout (precache-budget: its
// dataFingerprint dependency statically imports nine full datasets). In this
// worker, evaluating that chunk mid-test parses megabytes of CSV on the same
// thread findBy* polls on, starving the mobile shell's own lazy chunks past
// their 1s findByRole window. The modal is irrelevant to what this file
// tests (mobile chrome isolation), so mock it out — same spirit as the
// useIsMobileShell mock above.
// The module has a second export: MobileHeader (via mobileWhatsNew.ts) calls
// getUnseenChangelogSections for its unread badge, so the stub must provide
// it or the mobile header itself crashes on render.
vi.mock('../ui/WhatsNewModal', () => ({
  WhatsNewModal: () => null,
  getUnseenChangelogSections: () => [],
}))

function renderLayout(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/timeline" element={<div>Timeline Page</div>} />
          <Route path="/threats" element={<div>Threats Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('MainLayout — mobile UX layer isolation (Rule 1)', () => {
  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
    usePersonaStore.getState().setPersona(null)
    usePersonaStore.setState({ hasSkippedPersonalization: false, hasSeenPersonaPicker: false })
  })

  it('flag off: renders the legacy mobile nav row, not the new mobile header/bottom bar', async () => {
    mockUseIsMobileShell.mockReturnValue(false)
    usePersonaStore.getState().setPersona('executive')
    renderLayout('/timeline')
    expect(await screen.findByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument()
  })

  // The mobile shell components are React.lazy() (IMPLEMENTATION-PLAN.md's
  // precache-budget finding: a static import measurably grew the eager
  // bundle for every desktop visitor even with the flag off). findBy* waits
  // for the lazy chunk to resolve — the real reason this needs to be async,
  // not a workaround for anything flaky.
  it('flag on, persona already chosen: renders the new mobile header and bottom bar, not the legacy chrome', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('executive')
    renderLayout('/timeline')
    expect(await screen.findByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Home/ })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Learn/ })).toBeInTheDocument()
  })

  it('flag on, first run: the disclaimer sits in flow below the role picker, not fixed over it (UX-17)', async () => {
    useDisclaimerStore.getState().resetForTesting()
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/')
    const picker = await screen.findByText("Who's asking?")
    const banner = screen.getByRole('alert', { name: 'Welcome to PQC Today' })
    expect(banner.className).not.toMatch(/\bfixed\b/)
    // Document order: the picker comes first, the disclaimer after it.
    expect(picker.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByRole('alert', { name: 'Welcome to PQC Today' })).toHaveLength(1)
  })

  it('flag on, no persona chosen and not skipped: shows the first-run role picker WITH the header and bottom nav still visible', async () => {
    // Real gap found by the user directly ("i dont see the top bar and
    // bottom bar"): an earlier version rendered the picker as a fixed
    // full-viewport overlay and suppressed the header/nav entirely during
    // first run. Fixed to match the target design, which shows both.
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/')
    expect(await screen.findByText("Who's asking?")).toBeInTheDocument()
    // findBy*, not getBy*: the header and bottom bar are React.lazy() (see the
    // comment above the previous test), and they resolve as SEPARATE chunks
    // from the picker awaited on the line above — so awaiting the picker says
    // nothing about whether these two have mounted yet.
    //
    // This is the defect behind the "flaky MainLayout.mobileShell" reports
    // (2026-09-21/22, fixed 2026-09-22). Under no load every chunk lands in
    // the same microtask flush and the synchronous lookups happened to find
    // them; in a full-suite run (7.5k tests, ~2600 s of import time) they land
    // at different times and the lookup ran before the header existed. That is
    // also why running this file alone "proved" it passed — isolation removes
    // the very condition that triggers it, so an isolation run is not evidence
    // here.
    expect(await screen.findByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Home/ })).toBeInTheDocument()
  })

  // UX-9: a shared threat link used to land a first-time phone visitor on the
  // role picker instead of the threat they were sent.
  it('flag on, no persona chosen: a /threats deep link shows the page, not the first-run picker', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/threats?id=FIN-001')
    expect(await screen.findByText('Threats Page')).toBeInTheDocument()
    expect(screen.queryByText("Who's asking?")).not.toBeInTheDocument()
  })

  it('flag on, no persona chosen: plain /threats shows the page too, with a prompt instead of the picker', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/threats')
    expect(await screen.findByText('Threats Page')).toBeInTheDocument()
    expect(await screen.findByTestId('mobile-role-prompt')).toBeInTheDocument()
    expect(screen.queryByText("Who's asking?")).not.toBeInTheDocument()
  })

  it('flag on, personalization explicitly skipped: shows the normal mobile chrome, not the picker again', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().skipPersonalization()
    renderLayout('/timeline')
    expect(await screen.findByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.queryByText("Who's asking?")).not.toBeInTheDocument()
  })

  // 2026-08-24 audit R2.1: `.container` (index.css) carries its own
  // `px-4 md:px-8`, so this element's classes were stacking with every
  // Mobile/* screen's own `px-4` — 32px of side padding on a 402px viewport
  // instead of the handoff's 16px. <main> must contribute zero padding on
  // mobile (screens own it) while staying byte-identical on desktop.
  it('flag off: <main> keeps its container/padding classes (desktop untouched)', async () => {
    mockUseIsMobileShell.mockReturnValue(false)
    usePersonaStore.getState().setPersona('executive')
    renderLayout('/timeline')
    const main = await screen.findByRole('main')
    expect(main.className).toContain('container')
    expect(main.className).toContain('px-4')
    expect(main.className).toContain('py-4')
  })

  it('flag on: <main> contributes no container/padding classes — screens own their own spacing', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().skipPersonalization()
    renderLayout('/timeline')
    const main = await screen.findByRole('main')
    expect(main.className).not.toContain('container')
    expect(main.className).not.toContain('px-4')
    expect(main.className).not.toContain('py-4')
  })
})

// The role picker used to replace EVERY page on a phone for a visitor with no stored role, which is
// also what a search crawler is: it got the picker, not the page. It now takes over the home page only.
describe('MainLayout, phone: the role picker is for the home page; every other page renders', () => {
  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
    usePersonaStore.getState().setPersona(null)
    usePersonaStore.setState({ hasSkippedPersonalization: false, hasSeenPersonaPicker: false })
    window.localStorage.clear()
  })

  it.each(['/timeline', '/threats'])(
    'first run on %s: the page and its text, the header, a one-line prompt, no picker',
    async (path) => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderLayout(path)
      expect(
        await screen.findByText(path === '/timeline' ? 'Timeline Page' : 'Threats Page')
      ).toBeInTheDocument()
      expect(await screen.findByTestId('mobile-role-prompt')).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: 'Search' })).toBeInTheDocument()
      expect(screen.queryByText("Who's asking?")).not.toBeInTheDocument()
    }
  )

  it('first run on the home page: the picker, and no prompt', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/')
    expect(await screen.findByText("Who's asking?")).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-role-prompt')).not.toBeInTheDocument()
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument()
  })

  it('"Pick your role" opens the role sheet, and choosing a role keeps the page and is remembered', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/timeline')
    await userEvent.click(await screen.findByRole('button', { name: 'Pick your role' }))
    expect(await screen.findByText('Change role')).toBeInTheDocument()
    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(PERSONAS.developer.label) })
    )
    expect(usePersonaStore.getState().selectedPersona).toBe('developer')
    expect(usePersonaStore.getState().hasSeenPersonaPicker).toBe(true)
    expect(window.localStorage.getItem('pqc-learning-persona')).toContain(
      '"selectedPersona":"developer"'
    )
    expect(screen.getByText('Timeline Page')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-role-prompt')).not.toBeInTheDocument()
  })

  it('dismissing the prompt is remembered: the page stays and the prompt does not come back', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    const { unmount } = renderLayout('/timeline')
    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByTestId('mobile-role-prompt')).not.toBeInTheDocument()
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(true)
    expect(window.localStorage.getItem('pqc-learning-persona')).toContain(
      '"hasSkippedPersonalization":true'
    )
    unmount()
    renderLayout('/threats')
    expect(await screen.findByText('Threats Page')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-role-prompt')).not.toBeInTheDocument()
  })

  it('a visitor who has chosen a role, and the desktop layout, never see the prompt', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('executive')
    const { unmount } = renderLayout('/timeline')
    expect(await screen.findByText('Timeline Page')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-role-prompt')).not.toBeInTheDocument()
    unmount()
    usePersonaStore.getState().setPersona(null)
    mockUseIsMobileShell.mockReturnValue(false)
    renderLayout('/timeline')
    expect(await screen.findByText('Timeline Page')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-role-prompt')).not.toBeInTheDocument()
  })
})
