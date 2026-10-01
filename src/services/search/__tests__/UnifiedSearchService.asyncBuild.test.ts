// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cold-start index build must not freeze the page (design note
 * cold-search-index-design-10012026.md). `initialize()` builds the MiniSearch index in
 * slices that yield to the event loop, installs it only when complete, and shares one
 * build between concurrent callers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UnifiedSearchService } from '../UnifiedSearchService'
import { makeChunk } from '@/test/fixtures/trustChunks'

// More than a few 200-document slices, so the build has to yield more than once.
const CORPUS = Array.from({ length: 900 }, (_, i) =>
  makeChunk({
    id: `chunk-${i}`,
    source: 'library',
    title: i === 450 ? 'Purdue reference model' : `Document ${i}`,
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

describe('UnifiedSearchService — non-blocking index build', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('yields to the event loop while building and only installs the finished index', async () => {
    stubCorpusFetch()
    const svc = UnifiedSearchService.getInstance()
    // Sample from timers while the build runs: a mid-build tick is one where the corpus is
    // already prepared but the index is not installed yet. It only exists if the build yields.
    const midBuild: unknown[][] = []
    const sampler = setInterval(() => {
      if (svc.corpusById.size > 0 && !svc.isReady) midBuild.push(svc.searchPalette('purdue'))
    }, 0)

    await svc.initialize()
    clearInterval(sampler)

    expect(midBuild.length).toBeGreaterThan(0) // the page got turns while the index was building
    expect(midBuild.every((hits) => hits.length === 0)).toBe(true) // "not ready", never partial hits
    expect(svc.isReady).toBe(true)
    expect(svc.searchPalette('purdue')[0]?.title).toBe('Purdue reference model')
  })

  it('shares one build between concurrent callers', async () => {
    stubCorpusFetch()
    const svc = UnifiedSearchService.getInstance()
    await Promise.all([svc.initialize(), svc.initialize(), svc.initialize()])
    const first = svc.index
    expect(first).not.toBeNull()
    await svc.initialize()
    expect(svc.index).toBe(first)
  })

  it('discards a build that was invalidated while it was running', async () => {
    stubCorpusFetch()
    const svc = UnifiedSearchService.getInstance()
    setTimeout(() => {
      void svc.invalidateCache()
    }, 0)

    await svc.initialize()

    expect(svc.isReady).toBe(false) // the stale build did not install itself
  })
})
