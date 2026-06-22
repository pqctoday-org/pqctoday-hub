// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PatentsViewRedesign } from './PatentsViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'

function renderView(initial = '/patents') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <PatentsViewRedesign />
    </MemoryRouter>
  )
}

beforeEach(() => {
  usePersonaStore.getState().setPersona(null)
  localStorage.clear()
})

describe('PatentsViewRedesign', () => {
  it('renders the scope control and the KPI strip', () => {
    renderView()
    expect(screen.getByRole('radiogroup', { name: /corpus scope/i })).toBeInTheDocument()
    expect(screen.getByText(/Patents in scope/i)).toBeInTheDocument()
  })

  it('a KPI drill-down switches to Explore filtered (drill-down handoff works)', () => {
    renderView()
    // Default tab is Insights; the drill banner should not be visible yet.
    expect(screen.queryByText(/Filtered from the/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(/High migration impact/i))
    // Now on Explore: the drill banner + filter bar count appear.
    expect(screen.getByText(/Filtered from the/i)).toBeInTheDocument()
    // The Explore filter bar is now mounted (its search input is unique to it).
    expect(screen.getByPlaceholderText(/Search patents — title/i)).toBeInTheDocument()
  })

  it('opens the detail drawer from a ?patent deep link', () => {
    renderView('/patents?tab=explore&patent=US20260156001')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('the scope toggle is a labelled segmented control, not a hidden switch', () => {
    renderView()
    const group = screen.getByRole('radiogroup', { name: /corpus scope/i })
    expect(within(group).getByRole('radio', { name: /PQC & hybrid/i })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: /All crypto/i })).toBeInTheDocument()
  })
})
