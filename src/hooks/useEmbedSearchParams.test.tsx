// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useEmbedSearchParams } from './useEmbedSearchParams'
import { EmbedSearchParamsProvider } from '@/components/shared/EmbedSearchParamsProvider'

const router =
  (embedded: boolean, initial?: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/simulation?open=x']}>
      {embedded ? (
        <EmbedSearchParamsProvider initial={initial}>{children}</EmbedSearchParamsProvider>
      ) : (
        children
      )}
    </MemoryRouter>
  )

// Two independent callers, like a page and its filter bar.
const useTwo = () => {
  const a = useEmbedSearchParams()
  const b = useEmbedSearchParams()
  return { a, b, search: useLocation().search }
}

describe('useEmbedSearchParams', () => {
  it('standalone: reads and writes the page URL exactly like useSearchParams', () => {
    const { result } = renderHook(useTwo, { wrapper: router(false) })
    expect(result.current.a[0].get('open')).toBe('x')
    act(() => result.current.a[1]({ industry: 'Finance' }))
    expect(result.current.search).toBe('?industry=Finance')
  })

  it('embedded: never touches the host URL, and every caller shares one state', () => {
    const { result } = renderHook(useTwo, { wrapper: router(true, 'tab=landscape') })
    expect(result.current.a[0].get('open')).toBeNull()
    expect(result.current.a[0].get('tab')).toBe('landscape')
    act(() =>
      result.current.a[1]((prev) => {
        const next = new URLSearchParams(prev)
        next.set('industry', 'Finance')
        return next
      })
    )
    expect(result.current.b[0].get('industry')).toBe('Finance')
    expect(result.current.search).toBe('?open=x')
  })

  it('embedded: an unchanged update keeps the same params object', () => {
    const { result } = renderHook(useTwo, { wrapper: router(true, 'a=1') })
    const before = result.current.a[0]
    act(() => result.current.a[1](new URLSearchParams('a=1')))
    expect(result.current.a[0]).toBe(before)
  })
})
