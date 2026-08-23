// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { usePersonaStore } from '@/store/usePersonaStore'
import { TILES } from '@/data/exploreTiles'
import { PERSONAS } from '@/data/learningPersonas'
import { MobileExploreGrid } from './MobileExploreGrid'

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
  usePersonaStore.setState({ experienceLevel: null, viewAccess: 'unlocked' })
})

function renderGrid() {
  return render(
    <MemoryRouter>
      <MobileExploreGrid />
    </MemoryRouter>
  )
}

describe('MobileExploreGrid', () => {
  it('renders all ten real tiles with their real titles', () => {
    renderGrid()
    expect(TILES).toHaveLength(10)
    for (const tile of TILES) {
      expect(screen.getByText(tile.title)).toBeInTheDocument()
    }
  })

  it("/learn's minutes come from the active persona's real essentialsMinutes, not the authored placeholder", () => {
    usePersonaStore.getState().setPersona('executive')
    renderGrid()
    expect(screen.getByText(`~${PERSONAS.executive.essentialsMinutes} min`)).toBeInTheDocument()
  })

  it('/learn shows the authored firstLookMinutes placeholder with no persona selected', () => {
    renderGrid()
    const learnTile = TILES.find((t) => t.path === '/learn')!
    expect(screen.getByText(`~${learnTile.firstLookMinutes} min`)).toBeInTheDocument()
  })

  it('marks a recommended tile "For you" for a real, non-curious persona', () => {
    usePersonaStore.getState().setPersona('executive')
    renderGrid()
    expect(screen.getAllByText('For you').length).toBeGreaterThan(0)
  })

  it('shows no "For you" badges for curious', () => {
    usePersonaStore.getState().setPersona('curious')
    renderGrid()
    expect(screen.queryByText('For you')).not.toBeInTheDocument()
  })

  it('shows the unlock prompt when curious and gated, hides it once unlocked', () => {
    usePersonaStore.getState().setPersona('curious')
    usePersonaStore.setState({ viewAccess: 'preview' })
    renderGrid()
    expect(screen.getByText('Ready to go deeper?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Advanced Views' }))
    expect(usePersonaStore.getState().viewAccess).toBe('unlocked')
  })

  it("navigates a gated curious user to a tile's gatedPath instead of its real path", () => {
    usePersonaStore.getState().setPersona('curious')
    usePersonaStore.setState({ viewAccess: 'preview' })
    const gatedTile = TILES.find((t) => t.gatedPath)!
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <Routes>
          <Route path="/explore" element={<MobileExploreGrid />} />
          <Route path={gatedTile.path} element={<div>Real destination</div>} />
          <Route path={gatedTile.gatedPath} element={<div>Gated destination</div>} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(gatedTile.title))
    expect(screen.getByText('Gated destination')).toBeInTheDocument()
    expect(screen.queryByText('Real destination')).not.toBeInTheDocument()
  })
})
