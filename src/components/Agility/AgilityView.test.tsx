// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AgilityView } from './AgilityView'

function renderView() {
  return render(
    <MemoryRouter>
      <AgilityView />
    </MemoryRouter>
  )
}

describe('AgilityView (/agility)', () => {
  it('renders the page header with CSWP 39 title', () => {
    renderView()
    expect(
      screen.getByRole('heading', { name: /cryptographic-agility maturity/i })
    ).toBeInTheDocument()
  })

  it('renders the three KPI cells', () => {
    renderView()
    expect(screen.getByText(/grid coverage/i)).toBeInTheDocument()
    expect(screen.getByText(/mean confidence/i)).toBeInTheDocument()
    expect(screen.getByText(/source records/i)).toBeInTheDocument()
  })

  it('either shows the grid or the empty-state callout depending on CSV extraction state', () => {
    renderView()
    // One of the two MUST be present; the test must not break whether the
    // CSWP 39 extraction has been run or not.
    const hasGrid =
      screen.queryAllByText(/inventory|governance|lifecycle|observability|assurance/i).length > 0
    const hasEmpty = screen.queryByText(/no cswp 39 maturity requirements have been extracted yet/i)
    expect(hasGrid || hasEmpty).toBeTruthy()
  })
})
