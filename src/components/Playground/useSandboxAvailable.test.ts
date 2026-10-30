// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSandboxAvailable } from './useSandboxAvailable'

describe('useSandboxAvailable', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('becomes available and cancels the unread response body once the health check answers', async () => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', 'http://localhost:4000')
    const res = new Response('{"status":"ok"}', { status: 200 })
    const cancel = vi.spyOn(res.body!, 'cancel')
    const fetchMock = vi.fn().mockResolvedValue(res)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useSandboxAvailable())
    expect(result.current).toBe('checking')
    await waitFor(() => expect(result.current).toBe('available'))

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/status',
      expect.objectContaining({ mode: 'cors' })
    )
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('still cancels the body when the hook unmounted before the answer arrived', async () => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', 'http://localhost:4000')
    const res = new Response('{"status":"ok"}', { status: 200 })
    const cancel = vi.spyOn(res.body!, 'cancel')
    let answer!: (r: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<Response>((resolve) => (answer = resolve)))
    )

    const { unmount } = renderHook(() => useSandboxAvailable())
    unmount()
    answer(res)

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1))
  })

  it('is unavailable when the health check fails', async () => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', 'http://localhost:4000')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const { result } = renderHook(() => useSandboxAvailable())
    await waitFor(() => expect(result.current).toBe('unavailable'))
  })

  it('is unavailable without any request when no base URL is configured', () => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useSandboxAvailable())
    expect(result.current).toBe('unavailable')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
