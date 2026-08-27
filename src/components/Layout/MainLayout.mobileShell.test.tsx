// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MainLayout } from './MainLayout'
import { usePersonaStore } from '../../store/usePersonaStore'

vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('../../hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

function renderLayout(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/timeline" element={<div>Timeline Page</div>} />
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

  it('flag on, no persona chosen and not skipped: shows the first-run role picker WITH the header and bottom nav still visible', async () => {
    // Real gap found by the user directly ("i dont see the top bar and
    // bottom bar"): an earlier version rendered the picker as a fixed
    // full-viewport overlay and suppressed the header/nav entirely during
    // first run. Fixed to match the target design, which shows both.
    mockUseIsMobileShell.mockReturnValue(true)
    renderLayout('/')
    expect(await screen.findByText("Who's asking?")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Home/ })).toBeInTheDocument()
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
