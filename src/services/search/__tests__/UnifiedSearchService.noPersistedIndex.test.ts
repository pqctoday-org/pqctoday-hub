// SPDX-License-Identifier: GPL-3.0-only
/**
 * The ⌘K path no longer saves or restores a serialized index (owner decision
 * 2026-10-01, after browser measurements: saving the ~37 MB copy froze the page
 * ~0.25–1 s after the first search, and in WebKit restoring it was slower than
 * rebuilding). `loadCached()` now shares `initialize()`'s slice-by-slice build and
 * deletes the copy older versions left behind, once, without ever blocking search.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UnifiedSearchService } from '../UnifiedSearchService'
import { makeChunk } from '@/test/fixtures/trustChunks'

const store = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}))
vi.mock('localforage', () => ({ default: store }))

const CORPUS = Array.from({ length: 450 }, (_, i) =>
  makeChunk({
    id: `chunk-${i}`,
    source: 'library',
    title: i === 200 ? 'Purdue reference model' : `Document ${i}`,
    content: `generic content ${i}`,
  })
)

function stubCorpusFetch() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ chunks: CORPUS, generatedAt: '2026-10-01T00:00:00.000Z' }),
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('UnifiedSearchService — no persisted index', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
    store.getItem.mockReset()
    store.setItem.mockReset()
    store.removeItem.mockReset().mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds the index without reading or writing a saved copy', async () => {
    stubCorpusFetch()
    const svc = UnifiedSearchService.getInstance()
    await svc.loadCached()

    expect(svc.isReady).toBe(true)
    expect(svc.searchPalette('purdue')[0]?.title).toBe('Purdue reference model')
    expect(store.getItem).not.toHaveBeenCalled()
    expect(store.setItem).not.toHaveBeenCalled()
  })

  it('deletes the stale saved copy once, and only after the index is ready', async () => {
    stubCorpusFetch()
    const svc = UnifiedSearchService.getInstance()
    let readyWhenRemoved: boolean | null = null
    store.removeItem.mockImplementation(async () => {
      readyWhenRemoved = svc.isReady
    })

    await svc.loadCached()
    await svc.loadCached()
    await Promise.resolve()

    expect(store.removeItem).toHaveBeenCalledTimes(1)
    expect(store.removeItem).toHaveBeenCalledWith('pqc-search-index-v2')
    expect(readyWhenRemoved).toBe(true)
  })

  it('a failing cleanup never fails or delays search', async () => {
    stubCorpusFetch()
    store.removeItem.mockRejectedValue(new Error('storage unavailable'))
    const svc = UnifiedSearchService.getInstance()

    await expect(svc.loadCached()).resolves.toBeUndefined()
    await Promise.resolve()
    expect(svc.isReady).toBe(true)
    expect(svc.searchPalette('purdue')).not.toHaveLength(0)
  })

  it('the palette and the Assistant still share one load and one build', async () => {
    const fetchMock = stubCorpusFetch()
    const svc = UnifiedSearchService.getInstance()

    await Promise.all([svc.loadCached(), svc.initialize(), svc.loadCached()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const built = svc.index
    expect(built).not.toBeNull()
    await svc.loadCached()
    expect(svc.index).toBe(built)
  })
})
