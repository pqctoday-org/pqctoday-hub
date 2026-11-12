// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MigrationRiskMatrix } from './MigrationRiskMatrix'

describe('worked replacement arithmetic in the real migration tool', () => {
  it('shows the card scenario separately from recorded migration prerequisites and timeline windows', () => {
    render(
      <MemoryRouter>
        <MigrationRiskMatrix />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dependencies' }))
    fireEvent.click(
      screen.getAllByRole('button', {
        name: /^Card Personalization & Certificate Issuance Critical$/,
      })[0]
    )
    const example = screen.getByText(/2026 \+ 3–5 = 2029–2031 for fleet replacement/)
    expect(example).toHaveTextContent('Fictional start: 2026')
    expect(example).toHaveTextContent('does not set an end-to-end migration minimum')
    expect(screen.getByText('Recorded dependencies in this sample plan')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Migration timeline overview' })).toHaveTextContent(
      '2028-2033'
    )
  })
})
