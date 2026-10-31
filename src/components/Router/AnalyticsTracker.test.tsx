// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { act, render } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import { logPageView } from '@/utils/analytics'
import { AnalyticsTracker } from './AnalyticsTracker'

vi.mock('@/utils/analytics', () => ({ logPageView: vi.fn() }))

type Navigate = ReturnType<typeof useNavigate>
const nav: { go: Navigate | null } = { go: null }
function Nav() {
  const navigate = useNavigate()
  useEffect(() => {
    nav.go = navigate
  }, [navigate])
  return null
}
const go: Navigate = ((...args: Parameters<Navigate>) => nav.go?.(...args)) as Navigate

const mount = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AnalyticsTracker />
      <Nav />
    </MemoryRouter>
  )

describe('AnalyticsTracker', () => {
  beforeEach(() => vi.mocked(logPageView).mockClear())

  it('sends the first page view with the path only', () => {
    mount('/library?q=secret')
    expect(logPageView).toHaveBeenCalledTimes(1)
    expect(logPageView).toHaveBeenCalledWith('/library')
  })

  it('does not send another page view when only the query or hash changes', async () => {
    mount('/library')
    await act(async () => go('/library?q=k', { replace: true }))
    await act(async () => go('/library?q=ky', { replace: true }))
    await act(async () => go('/library?q=ky#top', { replace: true }))
    expect(logPageView).toHaveBeenCalledTimes(1)
  })

  it('sends a page view for each new path', async () => {
    mount('/library')
    await act(async () => go('/compliance'))
    await act(async () => go('/library'))
    expect(vi.mocked(logPageView).mock.calls.map((c) => c[0])).toEqual([
      '/library',
      '/compliance',
      '/library',
    ])
  })
})
