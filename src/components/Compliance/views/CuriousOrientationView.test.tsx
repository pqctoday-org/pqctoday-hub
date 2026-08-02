// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CuriousOrientationView } from './CuriousOrientationView'

function renderView() {
  return render(
    <MemoryRouter>
      <CuriousOrientationView />
    </MemoryRouter>
  )
}

describe('CuriousOrientationView', () => {
  it('renders the "does this affect me?" card', () => {
    renderView()
    expect(screen.getByText('Does this affect me?')).toBeInTheDocument()
  })

  it('renders exactly one link out, to the full Compliance Landscape', () => {
    renderView()
    const link = screen.getByRole('link', { name: /See the full Compliance Landscape/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/compliance?tab=compliance')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('does not render the previous profile editor / applicable-frameworks list', () => {
    renderView()
    expect(screen.queryByText('What applies to you')).not.toBeInTheDocument()
    expect(screen.queryByText(/Start the assessment/)).not.toBeInTheDocument()
  })
})
