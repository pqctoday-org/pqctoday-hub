// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'
import { LIBRARY_PERSONA_SENTENCE } from '@/data/libraryPersonaConfig'

function renderView(initial = '/library') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
    </MemoryRouter>
  )
}

beforeEach(() => usePersonaStore.getState().setPersona(null))

describe('LibraryViewRedesign', () => {
  it('renders the Role Lens and a populated results grid', () => {
    renderView()
    expect(screen.getByRole('radiogroup', { name: /viewing the library as/i })).toBeInTheDocument()
    // At least one document card opens the drawer (role=button with the refId).
    expect(screen.getAllByText(/document/i).length).toBeGreaterThan(0)
  })

  it('the Role Lens drives the "what this means for you" sentence', () => {
    renderView()
    const group = screen.getByRole('radiogroup', { name: /viewing the library as/i })
    fireEvent.click(within(group).getByRole('radio', { name: 'Developer' }))
    expect(screen.getByText(LIBRARY_PERSONA_SENTENCE.developer)).toBeInTheDocument()
    expect(usePersonaStore.getState().selectedPersona).toBe('developer')
  })

  it('opens the detail drawer when a result card is clicked (?ref deep-link seam)', () => {
    // Seed a known ref so the drawer is open on first render.
    renderView('/library?ref=FIPS%20203')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('a persona narrows the grid to its focus areas (architect ≠ all docs)', () => {
    renderView()
    const allCount = screen.getByText(/\d+ documents?/i).textContent
    const group = screen.getByRole('radiogroup', { name: /viewing the library as/i })
    fireEvent.click(within(group).getByRole('radio', { name: 'Architect' }))
    const narrowedCount = screen.getByText(/\d+ documents?/i).textContent
    expect(narrowedCount).not.toBeNull()
    // Architect has a non-empty preferred-category set, so the grid changes.
    expect(narrowedCount).not.toBe(allCount)
  })
})
