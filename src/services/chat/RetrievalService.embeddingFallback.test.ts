// SPDX-License-Identifier: GPL-3.0-only
/**
 * searchWithEmbeddingFallback() unit tests.
 *
 * search() itself is stubbed via vi.spyOn rather than driven through a real
 * tiny synthetic corpus: MiniSearch's fuzzy(0.2)+prefix matching is
 * empirically far more permissive at a 2-3 document corpus scale than at
 * the real ~16k-chunk production corpus, which made "construct a query
 * search() genuinely can't match" unreliable to build from content alone
 * (an unrelated sentence like "Zebras migrate across the Serengeti" still
 * scored above zero against "RSA algorithm" in a toy 2-doc corpus). That's
 * a property of tiny-corpus MiniSearch behavior, not something to fight —
 * search()'s own matching is already covered by RetrievalService.test.ts
 * and golden-queries.test.ts. This file isolates and tests only
 * searchWithEmbeddingFallback's OWN logic — gap detection, append-only
 * ordering, dedup, quiz/curious suppression, and fail-soft — against a
 * search() whose return value is fully controlled.
 *
 * cosineSearch itself uses synthetic fixture vectors via
 * embeddingRetrieval's injectTestRuntime (same technique as
 * embeddingRetrieval.test.ts) so these stay fast, deterministic, and
 * free of any real network fetch or model download.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { RetrievalService } from './RetrievalService'
import {
  injectTestRuntime,
  resetEmbeddingRuntime,
  type EmbeddingMeta,
} from '@/services/search/embeddingRetrieval'

let embeddingRetrievalEnabled = false
vi.mock('@/services/featureFlags', () => ({
  useEmbeddingRetrieval: () => embeddingRetrievalEnabled,
}))

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
    generatedAt: '2026-08-18T00:00:00Z',
    generatedBy: 'fixture',
    chunkCount: chunkIds.length,
    byteOffsets,
  }
}

function vec(values: number[]): Float32Array {
  const v = new Float32Array(values)
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm)
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm
  return v
}

function pack(chunks: Float32Array[]): Float32Array {
  const dims = chunks[0].length
  const out = new Float32Array(chunks.length * dims)
  chunks.forEach((c, i) => out.set(c, i * dims))
  return out
}

const QUERY = 'RSA algorithm migration guidance'

const LEXICAL_CHUNK: RAGChunk = {
  id: 'lexical-match',
  source: 'algorithms',
  title: 'RSA',
  content: 'RSA is a classical public-key algorithm.',
  category: 'algorithms',
  metadata: {},
}
const SEMANTIC_ONLY_CHUNK: RAGChunk = {
  id: 'semantic-only',
  source: 'algorithms',
  title: 'ECDSA overview',
  content: 'ECDSA is an elliptic-curve signature scheme.',
  category: 'algorithms',
  metadata: {},
}
const QUIZ_CHUNK: RAGChunk = {
  id: 'quiz-embedding-only',
  source: 'quiz',
  title: 'Unrelated quiz chunk',
  content: 'A quiz question findable only via its embedding vector.',
  category: 'quiz',
  metadata: {},
}
const CURIOUS_CHUNK: RAGChunk = {
  id: 'curious-embedding-only',
  source: 'module-curious',
  title: 'Curious-mode summary',
  content: 'A curious-mode-only summary findable only via its embedding vector.',
  category: 'module-curious',
  metadata: {},
}

describe('RetrievalService.searchWithEmbeddingFallback', () => {
  let service: RetrievalService

  beforeEach(() => {
    service = new RetrievalService()
    // corpusById needs every chunk searchWithEmbeddingFallback might resolve
    // a cosineSearch hit against — but query-time matching (search() itself)
    // is stubbed per-test below, so what MiniSearch would or wouldn't match
    // for QUERY against this corpus is irrelevant here.
    service.initializeWithCorpus([LEXICAL_CHUNK, SEMANTIC_ONLY_CHUNK, QUIZ_CHUNK, CURIOUS_CHUNK])
    embeddingRetrievalEnabled = false
    resetEmbeddingRuntime()
  })

  it('returns exactly the stubbed lexical result when the flag is off (default)', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = false

    const results = await service.searchWithEmbeddingFallback(QUERY, 2)
    expect(results.map((c) => c.id)).toEqual(['lexical-match'])
  })

  it('tops up with an embedding-only match when a gap remains and the flag is on', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = true
    const queryVec = vec([1, 0, 0, 0])
    injectTestRuntime({
      vectors: pack([vec([0, 1, 0, 0]), vec([1, 0, 0, 0])]),
      meta: makeMeta(['lexical-match', 'semantic-only'], 4),
      encoder: async () => ({ data: queryVec }),
    })

    const results = await service.searchWithEmbeddingFallback(QUERY, 2)
    // Append-only: the lexical hit keeps rank 0, the embedding hit fills
    // the remaining slot — never reordered ahead of it.
    expect(results.map((c) => c.id)).toEqual(['lexical-match', 'semantic-only'])
  })

  it('does not resurface a quiz chunk via the embedding path unless the query asks for one', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = true
    const v = vec([1, 0, 0, 0])
    injectTestRuntime({
      vectors: pack([vec([0, 1, 0, 0]), v]),
      meta: makeMeta(['lexical-match', 'quiz-embedding-only'], 4),
      encoder: async () => ({ data: v }), // quiz chunk ranks as the top cosine hit
    })

    const results = await service.searchWithEmbeddingFallback(QUERY, 2)
    expect(results.map((c) => c.id)).toEqual(['lexical-match'])
  })

  it('does not resurface a curious-mode summary outside curious experience mode', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = true
    const v = vec([1, 0, 0, 0])
    injectTestRuntime({
      vectors: pack([vec([0, 1, 0, 0]), v]),
      meta: makeMeta(['lexical-match', 'curious-embedding-only'], 4),
      encoder: async () => ({ data: v }),
    })

    const results = await service.searchWithEmbeddingFallback(QUERY, 2, {
      page: 'Algorithms',
      relevantSources: [],
      experienceLevel: 'expert',
    })
    expect(results.map((c) => c.id)).toEqual(['lexical-match'])
  })

  it('does allow a curious-mode summary in curious experience mode', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = true
    const v = vec([1, 0, 0, 0])
    injectTestRuntime({
      vectors: pack([vec([0, 1, 0, 0]), v]),
      meta: makeMeta(['lexical-match', 'curious-embedding-only'], 4),
      encoder: async () => ({ data: v }),
    })

    const results = await service.searchWithEmbeddingFallback(QUERY, 2, {
      page: 'Algorithms',
      relevantSources: [],
      experienceLevel: 'curious',
    })
    expect(results.map((c) => c.id)).toEqual(['lexical-match', 'curious-embedding-only'])
  })

  it('does not duplicate a chunk already present in the lexical result', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = true
    const v = vec([1, 0, 0, 0])
    injectTestRuntime({
      vectors: pack([v]),
      meta: makeMeta(['lexical-match'], 4),
      encoder: async () => ({ data: v }),
    })

    // limit=1: the stubbed lexical result already fills the target, so
    // there's no gap — cosineSearch's top hit (lexical-match itself) must
    // not duplicate the entry already present.
    const results = await service.searchWithEmbeddingFallback(QUERY, 1)
    expect(results.map((c) => c.id)).toEqual(['lexical-match'])
  })

  it('fails soft and returns the lexical-only result if the embedding runtime errors', async () => {
    vi.spyOn(service, 'search').mockReturnValue([LEXICAL_CHUNK])
    embeddingRetrievalEnabled = true
    injectTestRuntime({
      vectors: pack([vec([1, 0, 0, 0])]),
      meta: makeMeta(['lexical-match'], 4),
      encoder: async () => {
        throw new Error('simulated: no WebGPU/wasm backend available')
      },
    })

    const results = await service.searchWithEmbeddingFallback(QUERY, 2)
    expect(results.map((c) => c.id)).toEqual(['lexical-match'])
  })
})
