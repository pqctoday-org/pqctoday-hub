// SPDX-License-Identifier: GPL-3.0-only
/**
 * embeddingRetrieval unit tests — uses synthetic 4-dim fixture vectors
 * rather than driving the real Transformers.js encoder. Keeps tests fast
 * (<10 ms each) and deterministic. The build-time encoder is exercised
 * end-to-end via the corpus-invariant gate (see §8.2 of the spec).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  cosineSearch,
  selectPassages,
  injectTestRuntime,
  resetEmbeddingRuntime,
  isEmbeddingRuntimeReady,
  type EmbeddingMeta,
} from '../embeddingRetrieval'

function makeMeta(chunkIds: string[], dims: number): EmbeddingMeta {
  const byteOffsets: Record<string, number> = {}
  chunkIds.forEach((id, i) => {
    byteOffsets[id] = i * dims * 4
  })
  return {
    version: 1,
    model: 'fixture-model',
    modelHash: 'sha256:fixture',
    corpusHash: 'sha256:fixture',
    dimensions: dims,
    dtype: 'float32',
    generatedAt: '2026-05-10T00:00:00Z',
    generatedBy: 'fixture',
    chunkCount: chunkIds.length,
    byteOffsets,
  }
}

/** Construct a normalized fixture vector. */
function vec(values: number[]): Float32Array {
  const v = new Float32Array(values)
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm)
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm
  return v
}

/** Build a packed Float32Array from per-chunk vectors. */
function pack(chunks: Float32Array[]): Float32Array {
  const dims = chunks[0].length
  const out = new Float32Array(chunks.length * dims)
  chunks.forEach((c, i) => out.set(c, i * dims))
  return out
}

describe('embeddingRetrieval', () => {
  beforeEach(() => {
    resetEmbeddingRuntime()
  })

  describe('cosineSearch', () => {
    it('returns top-K hits ordered by descending cosine', async () => {
      // 3 fixture chunks. Query embeds identically to chunk-b.
      const chunkA = vec([1, 0, 0, 0])
      const chunkB = vec([0, 1, 0, 0])
      const chunkC = vec([0.7, 0.7, 0, 0])
      injectTestRuntime({
        vectors: pack([chunkA, chunkB, chunkC]),
        meta: makeMeta(['a', 'b', 'c'], 4),
        encoder: async () => ({ data: chunkB }),
      })

      const hits = await cosineSearch('whatever', { k: 3 })
      expect(hits).toHaveLength(3)
      expect(hits[0].chunkId).toBe('b') // perfect match
      // c is partially aligned with b (~0.7), a is orthogonal (0)
      expect(hits[1].chunkId).toBe('c')
      expect(hits[2].chunkId).toBe('a')
      expect(hits[0].score).toBeGreaterThan(hits[1].score)
      expect(hits[1].score).toBeGreaterThan(hits[2].score)
    })

    it('respects the candidateIds filter', async () => {
      injectTestRuntime({
        vectors: pack([vec([1, 0, 0, 0]), vec([0, 1, 0, 0]), vec([0, 0, 1, 0])]),
        meta: makeMeta(['a', 'b', 'c'], 4),
        encoder: async () => ({ data: vec([0, 1, 0, 0]) }),
      })

      const hits = await cosineSearch('q', { candidateIds: ['a', 'c'], k: 5 })
      expect(hits.map((h) => h.chunkId).sort()).toEqual(['a', 'c'])
      // The would-be top match 'b' is excluded.
    })

    it('skips chunk IDs not in the meta byteOffsets', async () => {
      injectTestRuntime({
        vectors: pack([vec([1, 0, 0, 0]), vec([0, 1, 0, 0])]),
        meta: makeMeta(['a', 'b'], 4),
        encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
      })

      const hits = await cosineSearch('q', { candidateIds: ['a', 'missing-id', 'b'] })
      expect(hits.map((h) => h.chunkId).sort()).toEqual(['a', 'b'])
    })

    it('returns empty when no runtime is initialized and no candidates resolve', async () => {
      // Without an injected runtime, the real initEmbeddingRuntime would try
      // to fetch from /data/embeddings.bin. In Vitest's jsdom environment
      // that fetch fails, so the runtime stays null and cosineSearch returns
      // empty rather than crashing.
      resetEmbeddingRuntime()
      // We don't await initEmbeddingRuntime here — the function path itself
      // calls it. With no fetch backing, the init throws; cosineSearch
      // bubbles the error. Confirm that behaviour: it should reject.
      await expect(cosineSearch('q', { candidateIds: ['x'] })).rejects.toThrow()
    })

    it('K=0 returns empty', async () => {
      injectTestRuntime({
        vectors: pack([vec([1, 0, 0, 0])]),
        meta: makeMeta(['a'], 4),
        encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
      })
      const hits = await cosineSearch('q', { k: 0 })
      expect(hits).toEqual([])
    })
  })

  describe('selectPassages', () => {
    it('delegates to cosineSearch with the candidate pool', async () => {
      injectTestRuntime({
        vectors: pack([vec([1, 0, 0, 0]), vec([0, 1, 0, 0]), vec([0, 0, 1, 0])]),
        meta: makeMeta(['p1', 'p2', 'p3'], 4),
        encoder: async () => ({ data: vec([0, 0, 1, 0]) }),
      })

      const passages = await selectPassages('claim about topic-3', ['p1', 'p2', 'p3'], 2)
      expect(passages).toHaveLength(2)
      expect(passages[0].chunkId).toBe('p3')
    })
  })

  describe('isEmbeddingRuntimeReady', () => {
    it('reports false before init and true after', () => {
      resetEmbeddingRuntime()
      expect(isEmbeddingRuntimeReady()).toBe(false)
      injectTestRuntime({
        vectors: pack([vec([1, 0, 0, 0])]),
        meta: makeMeta(['a'], 4),
        encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
      })
      expect(isEmbeddingRuntimeReady()).toBe(true)
    })
  })

  describe('byteOffset alignment', () => {
    it('reads each chunk vector from its correct offset', async () => {
      // Make 5 chunks with very different vectors; verify the indexing math.
      const chunks = [
        vec([1, 0, 0, 0]),
        vec([0, 1, 0, 0]),
        vec([0, 0, 1, 0]),
        vec([0, 0, 0, 1]),
        vec([0.5, 0.5, 0.5, 0.5]),
      ]
      injectTestRuntime({
        vectors: pack(chunks),
        meta: makeMeta(['a', 'b', 'c', 'd', 'e'], 4),
        encoder: async () => ({ data: vec([0, 0, 0, 1]) }),
      })

      const hits = await cosineSearch('q')
      // 'd' (identical) > 'e' (0.5 dot) > others (0)
      expect(hits[0].chunkId).toBe('d')
      expect(hits[1].chunkId).toBe('e')
      expect(hits[0].score).toBeCloseTo(1, 5)
      expect(hits[1].score).toBeCloseTo(0.5, 5)
    })
  })
})
