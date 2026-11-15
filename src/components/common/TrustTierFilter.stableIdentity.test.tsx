// SPDX-License-Identifier: AGPL-3.0-only
// The selected tiers keep their array between renders. A new array per render made every
// dependent memo recompute, and the records table, which reports its rows back up, looped.
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { useTrustTierFilter } from './TrustTierFilter'

function hookAt(url: string) {
  return renderHook(() => useTrustTierFilter(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    ),
  })
}

describe('useTrustTierFilter identity', () => {
  it('returns the same array on every render while the tiers do not change', () => {
    const { result, rerender } = hookAt('/compliance?tier=High&tier=Low')
    const first = result.current
    expect(first).toEqual(['High', 'Low'])
    rerender()
    rerender()
    expect(result.current).toBe(first)
  })

  it('returns an empty list, the same one each time, when no tier is selected', () => {
    const { result, rerender } = hookAt('/compliance')
    const first = result.current
    expect(first).toEqual([])
    rerender()
    expect(result.current).toBe(first)
  })

  it('returns the new tiers when the selection changes, and drops unknown ones', () => {
    const { result, rerender } = renderHook(
      ({ p }: { p: URLSearchParams }) => useTrustTierFilter(p),
      {
        initialProps: { p: new URLSearchParams('tier=High&tier=bogus') },
        wrapper: ({ children }: { children: ReactNode }) => (
          <MemoryRouter initialEntries={['/compliance']}>{children}</MemoryRouter>
        ),
      }
    )
    expect(result.current).toEqual(['High'])
    const before = result.current
    rerender({ p: new URLSearchParams('tier=Low') })
    expect(result.current).toEqual(['Low'])
    expect(result.current).not.toBe(before)
  })
})
