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
  // ChangelogView renders the ENTIRE unpaginated release history (200+
  // versions) on every mount. That's fast in isolation but, under the CPU
  // contention of the full ~4600-test suite running concurrently, the render
  // can be slow enough that React's time-slicing gets interrupted mid-commit
  // — confirmed real: this file passes 2/2 standalone, but running the full
  // suite (or even just this test alone via `-t`, with every other file still
  // imported) deterministically reproduces either a transient duplicate-node
  // render or an outright timeout at the default 5000ms. Bumping the timeout
  // gives the expensive render enough headroom without touching component
  // behavior — same rationale as this repo's E2E suite's 60s WASM-load
  // timeout override for another known-expensive operation.
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
  }, 15000)

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
  }, 15000)
})
