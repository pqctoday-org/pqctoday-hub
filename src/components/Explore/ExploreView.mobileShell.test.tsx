// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ExploreView } from './ExploreView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { TILES } from '@/data/exploreTiles'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  usePersonaStore.getState().setPersona(null)
})

function renderExplore() {
  return render(
    <MemoryRouter>
      <ExploreView />
    </MemoryRouter>
  )
}

describe('ExploreView — mobile UX layer wiring', () => {
  it('flag off: renders the desktop grid — its distinguishing "for a first look" time copy', () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderExplore()
    expect(screen.getByText('Explore PQC Today')).toBeInTheDocument()
    expect(screen.getAllByText(/for a first look/).length).toBeGreaterThan(0)
  })

  it('flag on: renders MobileExploreGrid instead — same real tiles, its own compact time copy (no "for a first look")', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderExplore()
    expect(screen.getByText('Explore PQC Today')).toBeInTheDocument()
    expect(screen.queryByText(/for a first look/)).not.toBeInTheDocument()
    for (const tile of TILES) {
      expect(screen.getByText(tile.title)).toBeInTheDocument()
    }
  })
})
