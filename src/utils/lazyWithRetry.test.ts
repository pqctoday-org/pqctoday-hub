// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Guards the fix for a real production bug (the /navigate crash loop,
 * 2026-08-29): the reload guard used to clear itself on every 'load' event,
 * which fires on the reload it triggers too — so a chunk that still fails
 * after that reload cleared its own guard and reloaded again, forever.
 * Reproduced 5 times in 12s against a real build before this fix. The flag
 * must now only clear on an actual successful import.
 */
describe('lazyWithRetry — reload-loop prevention', () => {
  const RELOAD_KEY = 'chunk-reload-attempted'
  let reloadCalls = 0

  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
    reloadCalls = 0
    vi.useFakeTimers()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: () => reloadCalls++ },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reloads once on exhausted retries, then does not reload again on the next failure within the same session', async () => {
    vi.doMock('react', async (orig) => {
      const actual = await orig<typeof import('react')>()
      return { ...actual, lazy: (fn: () => Promise<unknown>) => fn }
    })
    const { lazyWithRetry } = await import('./lazyWithRetry')

    const alwaysFails = () => Promise.reject(new Error('chunk load failed'))
    const load = lazyWithRetry(alwaysFails as never) as unknown as () => Promise<unknown>

    const p1 = load().catch(() => 'rejected-1')
    await vi.runAllTimersAsync()
    await p1
    expect(reloadCalls).toBe(1)
    expect(sessionStorage.getItem(RELOAD_KEY)).toBe('1')

    // A second, independent failed import in the same (un-reloaded, since
    // reload() is mocked) session must NOT trigger a second reload — this is
    // exactly the scenario that looped in production.
    const p2 = load().catch(() => 'rejected-2')
    await vi.runAllTimersAsync()
    await p2
    expect(reloadCalls).toBe(1)
  })

  it('clears the reload guard on a genuine successful import, not on page load', async () => {
    vi.doMock('react', async (orig) => {
      const actual = await orig<typeof import('react')>()
      return { ...actual, lazy: (fn: () => Promise<unknown>) => fn }
    })
    const { lazyWithRetry } = await import('./lazyWithRetry')
    sessionStorage.setItem(RELOAD_KEY, '1')

    const succeeds = () => Promise.resolve({ default: () => null })
    const load = lazyWithRetry(succeeds as never) as unknown as () => Promise<unknown>
    await load()

    expect(sessionStorage.getItem(RELOAD_KEY)).toBeNull()
  })
})
