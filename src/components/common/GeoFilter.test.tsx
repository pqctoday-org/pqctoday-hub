// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useGeoFilter, matchesGeoFilter } from './GeoFilter'

// W8: the read-hooks accept an optional params override so that, when the Library
// is embedded in the sim, filters read from the embed's local state instead of the
// parent page URL. useGeoFilter is representative — the sector/tier/algo hooks share
// the exact same `(override ?? urlParams).getAll(key)` pattern.
const wrapper =
  (url: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  )

describe('useGeoFilter override (W8 — sim embed)', () => {
  it('reads from the override params, ignoring the page URL', () => {
    const override = new URLSearchParams('geo=US&geo=FR')
    const { result } = renderHook(() => useGeoFilter(override), {
      wrapper: wrapper('/library?geo=DE'),
    })
    expect(result.current).toEqual(['US', 'FR'])
  })

  it('falls back to the page URL when no override is given (standalone /library)', () => {
    const { result } = renderHook(() => useGeoFilter(), { wrapper: wrapper('/library?geo=DE') })
    expect(result.current).toEqual(['DE'])
  })
})

describe('matchesGeoFilter (regression — multi-value region cells already split upstream)', () => {
  it('matches a bare country code', () => {
    expect(matchesGeoFilter(['US'], ['US', 'PQC-REGION-GLOBAL'])).toBe(true)
  })
  it('returns true when no geo filter is active', () => {
    expect(matchesGeoFilter([], ['anything'])).toBe(true)
  })
})
