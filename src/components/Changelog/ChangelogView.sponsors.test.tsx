// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sponsor-acknowledgment panel on /changelog — makes /sponsor's "Thank-you
 * note in the monthly changelog" benefit literally true (ACCURACY-0709-3).
 * Wired to the same src/data/sponsors.ts registry that drives the /migrate
 * "Sponsor" badge, not a hardcoded name.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import type { Sponsor } from '@/data/sponsors'

describe('ChangelogView sponsor acknowledgment', () => {
  it('renders nothing when there are no active sponsors', async () => {
    vi.resetModules()
    vi.doMock('@/data/sponsors', () => ({ SPONSORS: [] as Sponsor[] }))
    const { ChangelogView } = await import('./ChangelogView')
    render(
      <MemoryRouter>
        <ChangelogView />
      </MemoryRouter>
    )
    expect(screen.queryByText(/Thank you to our sponsors/i)).not.toBeInTheDocument()
    vi.doUnmock('@/data/sponsors')
  })

  it('thanks each active sponsor by name, linked to their real website', async () => {
    vi.resetModules()
    const fixture: Sponsor[] = [
      {
        name: 'Acme HSM Corp',
        tier: 'strategic',
        logoUrl: '/sponsors/acme.svg',
        website: 'https://acme-hsm.example.com',
        since: '2026-07-01',
      },
    ]
    vi.doMock('@/data/sponsors', () => ({ SPONSORS: fixture }))
    const { ChangelogView } = await import('./ChangelogView')
    render(
      <MemoryRouter>
        <ChangelogView />
      </MemoryRouter>
    )
    expect(screen.getByText(/Thank you to our sponsors/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Acme HSM Corp' })
    expect(link).toHaveAttribute('href', 'https://acme-hsm.example.com')
    vi.doUnmock('@/data/sponsors')
  })
})
