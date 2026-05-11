// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the Phase 3 useSemanticSearch hook.
 *
 * Strategy: inject a synthetic embedding runtime (Float32 fixtures) and a
 * synthetic UnifiedSearchService corpus, then exercise the hook's modes.
 * Real-model integration is covered by Phase 1's
 * embeddingRetrieval.integration.test.ts.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSemanticSearch } from '../useSemanticSearch'
import { injectTestRuntime, resetEmbeddingRuntime, type EmbeddingMeta } from '../embeddingRetrieval'
import { UnifiedSearchService } from '../UnifiedSearchService'
import type { RAGChunk } from '@/types/ChatTypes'

function vec(values: number[]): Float32Array {
  const v = new Float32Array(values)
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n)
  if (n > 0) for (let i = 0; i < v.length; i++) v[i] /= n
  return v
}

function pack(rows: Float32Array[]): Float32Array {
  const dims = rows[0].length
  const out = new Float32Array(rows.length * dims)
  for (let i = 0; i < rows.length; i++) out.set(rows[i], i * dims)
  return out
}

function makeMeta(ids: string[], dims: number): EmbeddingMeta {
  const offsets: Record<string, number> = {}
  for (let i = 0; i < ids.length; i++) offsets[ids[i]] = i * dims * 4
  return {
    version: 1,
    model: 'fixture',
    modelHash: 'x',
    corpusHash: 'x',
    dimensions: dims,
    dtype: 'float32',
    generatedAt: '',
    generatedBy: 'test',
    chunkCount: ids.length,
    byteOffsets: offsets,
  }
}

function seedCorpus(chunks: RAGChunk[]): void {
  UnifiedSearchService.resetInstance()
  const svc = UnifiedSearchService.getInstance()
  svc.initializeWithCorpus(chunks)
}

describe('useSemanticSearch', () => {
  beforeEach(() => {
    resetEmbeddingRuntime()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    UnifiedSearchService.resetInstance()
    resetEmbeddingRuntime()
    vi.useRealTimers()
  })

  it("mode is 'idle' when the query is empty", () => {
    seedCorpus([])
    const { result } = renderHook(() => useSemanticSearch('library', ''))
    expect(result.current.mode).toBe('idle')
    expect(result.current.hits).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it("mode is 'lexical' (silent fallback) when the embedding runtime is unavailable", async () => {
    seedCorpus([
      {
        id: 'library-FAKE',
        source: 'library',
        title: 'fake',
        content: 'fake',
        metadata: { referenceId: 'FAKE' },
      } as unknown as RAGChunk,
    ])
    const { result } = renderHook(() => useSemanticSearch('library', 'anything'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await waitFor(() => expect(result.current.mode).toBe('lexical'))
    expect(result.current.hits).toEqual([])
  })

  it("mode is 'semantic' and returns ranked resource IDs when the runtime is ready", async () => {
    const dims = 4
    const ids = ['library-A', 'library-B', 'library-C']
    injectTestRuntime({
      vectors: pack([vec([1, 0, 0, 0]), vec([0, 1, 0, 0]), vec([0, 0, 1, 0])]),
      meta: makeMeta(ids, dims),
      // Encoder maps the literal query string to a fixed dim-0 vector,
      // so 'library-A' wins.
      encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
    })
    seedCorpus([
      {
        id: 'library-A',
        source: 'library',
        title: 'A',
        content: 'a',
        metadata: { referenceId: 'A' },
      } as unknown as RAGChunk,
      {
        id: 'library-B',
        source: 'library',
        title: 'B',
        content: 'b',
        metadata: { referenceId: 'B' },
      } as unknown as RAGChunk,
      {
        id: 'library-C',
        source: 'library',
        title: 'C',
        content: 'c',
        metadata: { referenceId: 'C' },
      } as unknown as RAGChunk,
    ])

    const { result } = renderHook(() => useSemanticSearch('library', 'find A'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await waitFor(() => expect(result.current.mode).toBe('semantic'))
    expect(result.current.hits.length).toBe(3)
    expect(result.current.hits[0].id).toBe('A')
    expect(result.current.hits[0].score).toBeGreaterThan(result.current.hits[1].score)
  })

  it('respects `limit` parameter', async () => {
    const dims = 4
    const ids = ['library-A', 'library-B', 'library-C']
    injectTestRuntime({
      vectors: pack([vec([1, 0, 0, 0]), vec([0.9, 0.1, 0, 0]), vec([0.8, 0.2, 0, 0])]),
      meta: makeMeta(ids, dims),
      encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
    })
    seedCorpus([
      {
        id: 'library-A',
        source: 'library',
        title: 'A',
        content: '',
        metadata: { referenceId: 'A' },
      } as unknown as RAGChunk,
      {
        id: 'library-B',
        source: 'library',
        title: 'B',
        content: '',
        metadata: { referenceId: 'B' },
      } as unknown as RAGChunk,
      {
        id: 'library-C',
        source: 'library',
        title: 'C',
        content: '',
        metadata: { referenceId: 'C' },
      } as unknown as RAGChunk,
    ])
    const { result } = renderHook(() => useSemanticSearch('library', 'q', { limit: 2 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await waitFor(() => expect(result.current.mode).toBe('semantic'))
    expect(result.current.hits.length).toBe(2)
  })

  it("returns 'lexical' mode when `disabled` is set", () => {
    seedCorpus([])
    const { result } = renderHook(() => useSemanticSearch('library', 'q', { disabled: true }))
    expect(result.current.mode).toBe('lexical')
    expect(result.current.hits).toEqual([])
  })

  it('debounces — rapid query changes only fire one search', async () => {
    const encoder = vi.fn(async () => ({ data: vec([1, 0, 0, 0]) }))
    injectTestRuntime({
      vectors: pack([vec([1, 0, 0, 0])]),
      meta: makeMeta(['library-A'], 4),
      encoder,
    })
    seedCorpus([
      {
        id: 'library-A',
        source: 'library',
        title: 'A',
        content: '',
        metadata: { referenceId: 'A' },
      } as unknown as RAGChunk,
    ])
    const { rerender } = renderHook(({ q }: { q: string }) => useSemanticSearch('library', q), {
      initialProps: { q: 'a' },
    })
    rerender({ q: 'ab' })
    rerender({ q: 'abc' })
    // Only one encode should happen for the final query after debounce window.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await waitFor(() => expect(encoder).toHaveBeenCalledTimes(1))
  })

  it('falls back to lexical when the collection has no chunks in the corpus', async () => {
    injectTestRuntime({
      vectors: pack([vec([1, 0, 0, 0])]),
      meta: makeMeta(['library-A'], 4),
      encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
    })
    // Corpus has no `migrate` chunks.
    seedCorpus([
      {
        id: 'library-A',
        source: 'library',
        title: 'A',
        content: '',
        metadata: { referenceId: 'A' },
      } as unknown as RAGChunk,
    ])
    const { result } = renderHook(() => useSemanticSearch('migrate', 'q'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await waitFor(() => expect(result.current.mode).toBe('lexical'))
    expect(result.current.hits).toEqual([])
  })
})
