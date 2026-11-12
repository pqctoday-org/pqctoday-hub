// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logLibrarySearch } from '@/utils/analytics'
vi.mock('@/utils/analytics', async (orig) => ({
  ...(await orig<typeof import('@/utils/analytics')>()),
  logLibrarySearch: vi.fn(),
}))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
beforeEach(() => usePersonaStore.getState().setPersona(null))
function renderView(initial = '/library') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
    </MemoryRouter>
  )
}
describe('Library search and role interactions', { timeout: 60_000 }, () => {
  it('logs one search event after the search text settles, and none for a short one', async () => {
    vi.mocked(logLibrarySearch).mockClear()
    const { unmount } = renderView('/library?q=ab')
    await new Promise((r) => setTimeout(r, 800))
    expect(logLibrarySearch).not.toHaveBeenCalled()
    unmount()

    renderView('/library?q=kyber')
    await vi.waitFor(() => expect(logLibrarySearch).toHaveBeenCalledWith('kyber'), {
      timeout: 5000,
    })
    expect(logLibrarySearch).toHaveBeenCalledTimes(1)
  })

  // Explicit timeout: this is the heaviest test in the file — it renders the
  // whole Library view over the full document corpus, then forces a complete
  // re-filter and re-render by changing persona. It takes ~2.5s on a dev
  // machine, and the GitHub runner is roughly 8x slower on this suite (565s
  // there vs ~70s locally), which puts it over vitest's 5s default. It timed
  // out in CI on 2026-08-02 while passing locally and in earlier CI runs —
  // borderline, not broken. Measured with and without that day's setup.ts
  // cleanup() change: 2.5s either way, so the timeout is about runner speed,
  // not about anything the test or the harness is doing wrong.
  it('a persona set globally (top-bar control) narrows the grid to its focus areas (architect ≠ all docs)', () => {
    renderView()
    const allCount = screen.getByText(/^\d+ documents?$/i).textContent
    // The page only reads selectedPersona now — persona changes come from the
    // shared top-bar role switcher, so drive the store directly here rather
    // than clicking a local control (LibraryRoleLens was removed).
    act(() => {
      usePersonaStore.getState().setPersona('architect')
    })
    const narrowedCount = screen.getByText(/^\d+ documents?$/i).textContent
    expect(narrowedCount).not.toBeNull()
    // Architect has a non-empty preferred-category set, so the grid changes.
    expect(narrowedCount).not.toBe(allCount)
  }, 60_000)
})
