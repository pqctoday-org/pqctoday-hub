// SPDX-License-Identifier: GPL-3.0-only
/**
 * embeddingRetrieval — Phase 1 (T16) runtime semantic-retrieval primitive.
 *
 * Loads the pre-computed embedding index (`public/data/embeddings.bin` +
 * `embeddings-meta.json`) on first use, exposes a `selectPassages` API for
 * the chat citation path, and a generic `cosineSearch` for any other code
 * that needs to find the K nearest corpus chunks to a query string.
 *
 * Build-time generation lives in `scripts/build-embedding-index.ts` and is
 * local-only (see pqctoday-priv/docs/platform/data/embedding-optimization.md
 * §6.1). This module reads the committed artifacts as static assets.
 *
 * Lazy load: nothing happens until the first call to `initEmbeddingRuntime()`
 * or `cosineSearch()`. Heavy artefacts (the ~33 MB model + ~16 MB vectors)
 * are fetched on demand so users who don't engage chat/⌘K never pay the
 * cost.
 */
import type { TrustTier } from '@/data/trustScore'

const EMBEDDINGS_BIN_URL = '/data/embeddings.bin'
const EMBEDDINGS_META_URL = '/data/embeddings-meta.json'

export interface EmbeddingMeta {
  version: 1
  model: string
  modelHash: string
  corpusHash: string
  dimensions: number
  dtype: 'float32'
  generatedAt: string
  generatedBy: string
  chunkCount: number
  byteOffsets: Record<string, number>
}

export interface CosineHit {
  chunkId: string
  score: number
}

export interface PassageHit extends CosineHit {
  /** Chunk title — populated by the caller from the corpus map */
  title?: string
  /** Trust tier of the underlying scored resource, if any */
  tier?: TrustTier | null
}

interface Runtime {
  // The pipeline instance from @huggingface/transformers — typed loosely
  // here so this module doesn't carry the dep's surface API into consumers
  // that may stub it for tests.
  encoder: (
    text: string,
    opts: { pooling: string; normalize: boolean }
  ) => Promise<{
    data: Float32Array
  }>
  vectors: Float32Array
  meta: EmbeddingMeta
}

let cachedRuntime: Runtime | null = null
let initPromise: Promise<void> | null = null

/**
 * Lazily initialize the embedding runtime. Fetches the model, the
 * embeddings.bin, and the meta file. Idempotent; concurrent callers share
 * one in-flight init.
 */
export async function initEmbeddingRuntime(): Promise<void> {
  if (cachedRuntime) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    const [meta, vectorsBuf] = await Promise.all([
      fetch(EMBEDDINGS_META_URL).then((r) => {
        if (!r.ok) throw new Error(`embeddings-meta.json fetch failed: ${r.status}`)
        return r.json() as Promise<EmbeddingMeta>
      }),
      fetch(EMBEDDINGS_BIN_URL).then((r) => {
        if (!r.ok) throw new Error(`embeddings.bin fetch failed: ${r.status}`)
        return r.arrayBuffer()
      }),
    ])

    // Sanity-check the file length matches the meta.
    const expectedBytes = meta.chunkCount * meta.dimensions * 4
    if (vectorsBuf.byteLength !== expectedBytes) {
      throw new Error(
        `embeddings.bin size mismatch: expected ${expectedBytes} bytes ` +
          `(${meta.chunkCount} × ${meta.dimensions} × 4), got ${vectorsBuf.byteLength}`
      )
    }

    const { pipeline, env } = await import('@huggingface/transformers')
    env.allowRemoteModels = true
    env.allowLocalModels = false
    const encoder = (await pipeline('feature-extraction', meta.model, {
      dtype: 'q8',
    })) as unknown as Runtime['encoder']

    cachedRuntime = {
      encoder,
      vectors: new Float32Array(vectorsBuf),
      meta,
    }
  })()

  try {
    await initPromise
  } finally {
    initPromise = null
  }
}

/** Internal: dot product of two equal-length Float32 vectors (both normalized). */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

/**
 * Generic cosine search: encode `queryText`, return top-K corpus chunks by
 * cosine similarity. Caller filters the candidate pool via `candidateIds`
 * (e.g., to a single source type) or leaves it undefined to search the
 * entire corpus.
 */
export async function cosineSearch(
  queryText: string,
  opts: { k?: number; candidateIds?: string[] } = {}
): Promise<CosineHit[]> {
  await initEmbeddingRuntime()
  if (!cachedRuntime) return []
  const { encoder, vectors, meta } = cachedRuntime

  const tensor = await encoder(queryText, { pooling: 'mean', normalize: true })
  const query = new Float32Array(tensor.data)
  const dims = meta.dimensions
  const k = opts.k ?? 10

  const ids = opts.candidateIds ?? Object.keys(meta.byteOffsets)
  const hits: CosineHit[] = []
  for (const id of ids) {
    const offset = meta.byteOffsets[id]
    if (offset === undefined) continue
    const start = offset / 4
    const chunkVec = vectors.subarray(start, start + dims)
    hits.push({ chunkId: id, score: cosineSimilarity(query, chunkVec) })
  }
  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, k)
}

/**
 * Select the K source passages most semantically aligned with a claim.
 * Used by the corpus generator at build time to populate
 * `chunk.prov.source_passages`, and at runtime by RetrievalService to
 * choose citation excerpts.
 *
 * `candidatePool` should be the chunk IDs of plausible sources (typically
 * the chunks belonging to the same `source_doc` as the claim's chunk).
 */
export async function selectPassages(
  claimText: string,
  candidatePool: string[],
  k = 5
): Promise<PassageHit[]> {
  return cosineSearch(claimText, { candidateIds: candidatePool, k })
}

/** Reset for testing — clears the cached runtime so the next init re-fetches. */
export function resetEmbeddingRuntime(): void {
  cachedRuntime = null
  initPromise = null
}

/** Test-only: inject a synthetic runtime with fixture vectors. */
export function injectTestRuntime(rt: {
  vectors: Float32Array
  meta: EmbeddingMeta
  encoder: Runtime['encoder']
}): void {
  cachedRuntime = rt
  initPromise = null
}

/** Inspect whether the runtime has been initialized (without triggering init). */
export function isEmbeddingRuntimeReady(): boolean {
  return cachedRuntime !== null
}
