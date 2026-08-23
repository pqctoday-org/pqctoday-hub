// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileGroupPanel } from './MobileGroupPanel'

function renderPanel(props: Partial<React.ComponentProps<typeof MobileGroupPanel>> = {}) {
  return render(
    <MemoryRouter>
      <MobileGroupPanel groupId="reference" open onClose={vi.fn()} persona={null} {...props} />
    </MemoryRouter>
  )
}

describe('MobileGroupPanel', () => {
  it('renders nothing when closed', () => {
    renderPanel({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows real page tiles for the no-persona (ungated) case', () => {
    renderPanel({ groupId: 'reference', persona: null })
    // Reference includes Algorithms, Library, Community (Leaders), Patents, Revisions in the ungated set.
    expect(screen.getByRole('button', { name: 'Algorithms' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Library' })).toBeInTheDocument()
  })

  it('always includes Timeline and Threats — RAIL_ALWAYS_VISIBLE_PATHS on desktop, never persona-gated', () => {
    renderPanel({ groupId: 'reference', persona: 'curious' })
    expect(screen.getByRole('button', { name: 'Timeline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Threats' })).toBeInTheDocument()
  })

  it('always includes Business Tools in Practice — real user-reported gap, computeGroupDisplayPaths appends it same as desktop', () => {
    renderPanel({ groupId: 'practice', persona: null })
    expect(screen.getByRole('button', { name: 'Business Tools' })).toBeInTheDocument()
  })

  it('never shows Explore as a Practice tile — dropped from the mobile shell entirely (confirmed decision, 2026-08-23)', () => {
    renderPanel({ groupId: 'practice', persona: null })
    expect(screen.queryByRole('button', { name: 'Explore' })).not.toBeInTheDocument()
  })

  it('gates the tile set per persona — curious has no Patents TILE, matching the real PERSONA_ABSENT_PATHS.curious entry', () => {
    renderPanel({ groupId: 'reference', persona: 'curious' })
    // "Patents" still appears once, inside the absence explanation itself —
    // that's the footer working correctly, not a tile. Assert on the grid
    // specifically via its testid rather than a bare text query.
    const grid = screen.getByTestId('mobile-group-panel-reference').querySelector('.grid')
    expect(within(grid as HTMLElement).queryByText('Patents')).not.toBeInTheDocument()
  })

  it('closes and navigates when a tile is tapped', () => {
    const onClose = vi.fn()
    renderPanel({ groupId: 'reference', persona: null, onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Algorithms' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the real "not offered for your role" reason for curious/Patents', () => {
    renderPanel({ groupId: 'reference', persona: 'curious' })
    expect(screen.getByText(/Patent law is a specialist read/i)).toBeInTheDocument()
  })

  it('navigates to the instead-path when the absence link is tapped', () => {
    const onClose = vi.fn()
    renderPanel({ groupId: 'reference', persona: 'curious', onClose })
    const absenceRow = screen
      .getByText(/Patent law is a specialist read/i)
      .closest('div') as HTMLElement
    fireEvent.click(within(absenceRow).getByRole('button', { name: 'Algorithms' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
