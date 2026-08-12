// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sponsor-acknowledgment panel on /changelog — makes /sponsor's "Thank-you
 * note in the monthly changelog" benefit literally true (ACCURACY-0709-3).
 * Wired to the same src/data/sponsors.ts registry that drives the /migrate
 * "Sponsor" badge, not a hardcoded name.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { Sponsor } from '@/data/sponsors'

/** findBy* retries for asyncUtilTimeout (1000ms) unless told otherwise. */
const QUERY = { timeout: 20_000 } as const

describe('ChangelogView sponsor acknowledgment', () => {
  // FIXED 2026-07-14 (second-pass audit, P2-3.6): vi.doUnmock() used to be
  // the last line of each test body, so a failed assertion above it (or any
  // other throw mid-test) skipped the unmock, leaking the mocked
  // @/data/sponsors into whichever test ran next in this file. afterEach
  // runs regardless of pass/fail.
  afterEach(() => vi.doUnmock('@/data/sponsors'))

  // ChangelogView renders the ENTIRE unpaginated release history (200+
  // versions) on every mount. That's fast in isolation but, under the CPU
  // contention of the full ~5600-test suite running concurrently, the render
  // can be slow enough that React's time-slicing gets interrupted mid-commit
  // — confirmed real: this file passes 2/2 standalone but fails in the full
  // run.
  //
  // A 15000ms timeout was added for this on 2026-07-14 and did NOT hold; it
  // failed again on 2026-08-11, at `getByText`, well inside that budget. The
  // timeout was treating the wrong thing. The failure is not "the render
  // needs longer than the deadline", it is "a SYNCHRONOUS query ran while the
  // render was still mid-commit" — and no timeout fixes a query that only
  // looks once. These now use async `findBy*`, which retries until the commit
  // settles, and the absence assertion waits for the page's own <h1> first so
  // it cannot pass simply because nothing had rendered yet.
  //
  // The budget is 30s rather than 15s because retrying IS the fix, and each
  // retry rescans a 200-release DOM: standalone runs land between 10s and 15s
  // depending on what else the machine is doing, which left no headroom at
  // all under full-suite contention. Queries are kept as cheap as the
  // assertion allows — findByText with a selector instead of findByRole, and
  // a sync query once an await has already proved the panel committed.
  //
  // QUERY is not decoration. testing-library's asyncUtilTimeout defaults to
  // 1000ms and nothing in this repo overrides it, so `findBy*` on its own
  // gives up after ONE second no matter what the test timeout says. Raising
  // the test budget to 30s without this would have left the retry window at
  // 1s — the same cliff, one second later. Caught reviewing this fix.
  it('renders nothing when there are no active sponsors', async () => {
    vi.resetModules()
    vi.doMock('@/data/sponsors', () => ({ SPONSORS: [] as Sponsor[] }))
    const { ChangelogView } = await import('./ChangelogView')
    render(
      <MemoryRouter>
        <ChangelogView />
      </MemoryRouter>
    )
    // Wait for the page itself before asserting the panel is absent —
    // otherwise "not in the document" is satisfied by an empty document.
    // findByText with a selector, not findByRole: a role query has to compute
    // the accessible name of every node, and this DOM holds 200+ releases.
    expect(await screen.findByText('Changelog', { selector: 'h1' }, QUERY)).toBeInTheDocument()
    expect(screen.queryByText(/Thank you to our sponsors/i)).not.toBeInTheDocument()
  }, 30000)

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
    expect(
      await screen.findByText(/Thank you to our sponsors/i, undefined, QUERY)
    ).toBeInTheDocument()
    // Sync is safe here: the await above already proved the panel committed,
    // and a second retrying role query would rescan the whole release history.
    const link = screen.getByRole('link', { name: 'Acme HSM Corp' })
    expect(link).toHaveAttribute('href', 'https://acme-hsm.example.com')
  }, 30000)
})
