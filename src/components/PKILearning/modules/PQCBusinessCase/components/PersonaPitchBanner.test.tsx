// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithRouter } from '@/test/utils'
import { PersonaPitchBanner } from './PersonaPitchBanner'

describe('PersonaPitchBanner', () => {
  it('names the active supported persona (in the role badge) and shows the objective', () => {
    renderWithRouter(
      <PersonaPitchBanner persona="developer" objective="Align engineering on scope." />
    )
    // "Developer" appears both in the badge (styled) and in the hint ("Developer, Architect, ..."),
    // so scope via the aria-live status container where the badge is first rendered.
    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent(/customized for the/i)
    expect(banner).toHaveTextContent(/\bDeveloper\b/)
    expect(banner).toHaveTextContent(/Align engineering on scope\./)
    expect(screen.getByRole('link', { name: /Change role/i })).toHaveAttribute(
      'href',
      '/#personalization-heading'
    )
  })

  it('labels the variant as default when persona is null', () => {
    renderWithRouter(<PersonaPitchBanner persona={null} objective="Drive alignment." />)
    expect(screen.getByText(/No role selected/i)).toBeInTheDocument()
    expect(screen.getByText(/Executive \/ Board \(default\)/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pick your role/i })).toHaveAttribute(
      'href',
      '/#personalization-heading'
    )
  })

  it('treats researcher and curious personas as unsupported (falls back to default label)', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PersonaPitchBanner persona="researcher" objective="Share the research." />
      </MemoryRouter>
    )
    expect(screen.getByText(/Executive \/ Board \(default\)/)).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <PersonaPitchBanner persona="curious" objective="Learn the basics." />
      </MemoryRouter>
    )
    expect(screen.getByText(/Executive \/ Board \(default\)/)).toBeInTheDocument()
  })
})
