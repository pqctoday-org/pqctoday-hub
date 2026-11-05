// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TransparencyBanner } from './TransparencyBanner'
describe('platform source metadata is not blanket independent review', () => {
  it('keeps the source and date limitation explicit without inventing a review date', () => {
    render(
      <MemoryRouter>
        <TransparencyBanner />
      </MemoryRouter>
    )
    expect(screen.getByText(/Source links and recorded checking dates/)).toHaveTextContent(
      'do not establish independent review of every claim'
    )
    expect(screen.queryByText(/thorough verification/)).not.toBeInTheDocument()
    expect(screen.getByText(/inclusion of an organization or source/)).toHaveTextContent(
      'does not imply endorsement'
    )
    expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
      'href',
      '/about#about-transparency'
    )
  })
})
