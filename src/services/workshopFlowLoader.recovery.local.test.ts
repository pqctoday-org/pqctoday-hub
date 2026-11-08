// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadFlow, _resetCachesForTest } from './workshopFlowLoader'
afterEach(() => {
  vi.unstubAllGlobals()
  _resetCachesForTest()
})
describe('Workshop explicit retry bypasses only the cached file lookup', () => {
  it('retains ordinary caching and permits a fresh response after a requested retry', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'old-sample' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'corrected-sample' }) })
    vi.stubGlobal('fetch', fetch)
    expect((await loadFlow('sample.json')).id).toBe('old-sample')
    expect((await loadFlow('sample.json')).id).toBe('old-sample')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect((await loadFlow('sample.json', true)).id).toBe('corrected-sample')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect((await loadFlow('sample.json')).id).toBe('corrected-sample')
  })
})
