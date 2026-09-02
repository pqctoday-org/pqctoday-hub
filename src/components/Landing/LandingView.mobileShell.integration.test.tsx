// SPDX-License-Identifier: GPL-3.0-only
/**
 * Mounts the REAL MainLayout wrapping the REAL LandingView with
 * useIsMobileShell mocked true — the same "one level up" reasoning
 * LandingView.integration.test.tsx already documents, extended to the
 * mobile UX layer's Phase 4 wiring.
 *
 * The first test below exists specifically because building this caught a
 * real bug: MainLayout's first-run overlay (Phase 3) and LandingView's own
 * pre-existing first-run branch both independently check
 * `!selectedPersona && !hasSkippedPersonalization` and both used to render
 * <RoleHomeView> — two instances sharing RoleHomeView's own
 * "role-home-heading" id. Fixed by having LandingView return null for that
 * state when isMobileShell (MainLayout's overlay is the only one that should
 * render). This test is the regression guard for that fix.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MainLayout } from '../Layout/MainLayout'
import { LandingView } from './LandingView'
import { usePersonaStore } from '../../store/usePersonaStore'
import { PERSONA_JOURNEY_BOARD_VARIANTS, resolveRoleBoardVariant } from '@/data/personaConfig'

vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('../../hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// WhatsNewModal is React.lazy in MainLayout (precache-budget: its
// dataFingerprint dependency statically imports nine full datasets). This
// suite mounts the real MainLayout and relies on OTHER lazy chunks
// (MobileBottomBar) resolving within findBy*'s default window; evaluating
// WhatsNewModal's chunk concurrently — megabytes of synchronous CSV parsing
// — starves that window on a loaded CI runner. Irrelevant to what this file
// tests, so it's mocked out — same fix as MainLayout.mobileShell.test.tsx
// and LandingView.integration.test.tsx.
vi.mock('../ui/WhatsNewModal', () => ({
  WhatsNewModal: () => null,
  getUnseenChangelogSections: () => [],
}))

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingView />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('LandingView — mobile UX layer (Phase 4)', () => {
  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
    usePersonaStore.getState().setPersona(null)
    usePersonaStore.setState({ hasSkippedPersonalization: false, hasSeenPersonaPicker: false })
  })

  it('flag on, no persona, not skipped: exactly ONE "Who\'s asking?" renders — MainLayout\'s overlay, not two', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderApp('/')
    const headings = await screen.findAllByText("Who's asking?")
    expect(headings).toHaveLength(1)
  })

  it('flag on, persona already chosen: renders MobileHomeBoard, not RoleHomeView or the desktop PersonaBoardView chip radiogroup twice', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('executive')
    renderApp('/')
    const board = resolveRoleBoardVariant('executive', undefined).board
    expect(await screen.findByText(board.headline)).toBeInTheDocument()
    expect(screen.queryByText("Who's asking?")).not.toBeInTheDocument()
    // Exactly one radiogroup (MobileHomeBoard's), not a second from a
    // duplicate PersonaBoardView mount.
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1)
  })

  it('flag on, curious persona: MobileHomeBoard supersedes CuriousMobileBoard (no duplicate "PQC Today" header, no old bottom-tab-bar)', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('curious')
    renderApp('/')
    const board = resolveRoleBoardVariant('curious', undefined).board
    expect(await screen.findByText(board.headline)).toBeInTheDocument()
    // CuriousMobileBoard's own distinguishing markers must be absent.
    expect(screen.queryByLabelText('Curious mobile navigation')).not.toBeInTheDocument()
    expect(screen.queryByTestId('labs-gating')).not.toBeInTheDocument()
  })

  it('flag on, all six scenario chips real for every persona', async () => {
    for (const persona of [
      'executive',
      'developer',
      'architect',
      'researcher',
      'ops',
      'curious',
    ] as const) {
      mockUseIsMobileShell.mockReturnValue(true)
      usePersonaStore.getState().setPersona(persona)
      const { unmount } = renderApp('/')
      const variants = PERSONA_JOURNEY_BOARD_VARIANTS[persona]
      expect(variants).toHaveLength(6)
      for (const v of variants) {
        expect(await screen.findByRole('radio', { name: v.chipLabel })).toBeInTheDocument()
      }
      unmount()
      usePersonaStore.getState().setPersona(null)
    }
  })

  it('flag off: unchanged — RoleHomeView renders exactly once, same as before this branch existed', async () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderApp('/')
    const headings = await screen.findAllByText("Who's asking?")
    expect(headings).toHaveLength(1)
  })

  it('the Home board\'s "Change" button opens a role-switch sheet reachable independently of the header pill', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('executive')
    renderApp('/')
    await screen.findByRole('button', { name: 'Change' })
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(await screen.findByText('Change role')).toBeInTheDocument()
  })
})
