// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))
beforeEach(() => usePersonaStore.getState().setPersona(null))
function renderView(initial = '/library') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
    </MemoryRouter>
  )
}
describe('Library mobile routing', { timeout: 60_000 }, () => {
  // Mobile UX layer (Phase 7). LibraryEmbed.tsx renders this same component
  // inside the simulation at whatever viewport the player is on (simEmbed
  // prop) — O-3 (IMPLEMENTATION-PLAN.md) keeps /simulation entirely outside
  // the mobile shell, so simEmbed must win over isMobileShell regardless of
  // viewport width.
  describe('mobile shell guard', () => {
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('renders the mobile screen when isMobileShell is true and not sim-embedded', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderView()
      expect(screen.getByText('Library')).toBeInTheDocument()
      expect(screen.queryByText('PQC Library')).not.toBeInTheDocument()
    })

    it('still renders the full desktop view when simEmbed is true, even if isMobileShell is true', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <LibraryViewRedesign simEmbed />
        </MemoryRouter>
      )
      expect(screen.queryByText('Library')).not.toBeInTheDocument()
    })
  })
})
