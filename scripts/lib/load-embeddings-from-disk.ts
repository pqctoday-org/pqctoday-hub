// SPDX-License-Identifier: GPL-3.0-only
/**
 * Node-side embedding loader. The browser-facing `embeddingRetrieval.ts`
 * uses `fetch()` against `/data/embeddings.bin`, which only works in a
 * browser. Phase 2 validators run in Node (tsx scripts), so they read
 * the artifact from disk and inject it into the runtime via
 * `injectTestRuntime`.
 *
 * Idempotent: calling twice is a no-op once the runtime is loaded.
 * Throws if the artifact is missing (Phase 2 validators have a hard
 * dependency on Phase 1's output).
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  injectTestRuntime,
  isEmbeddingRuntimeReady,
  type EmbeddingMeta,
} from '../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')

export async function loadEmbeddingsFromDisk(): Promise<EmbeddingMeta> {
  if (isEmbeddingRuntimeReady()) {
    // Already loaded — return whatever meta we can reconstruct from disk.
    return JSON.parse(fs.readFileSync(META_PATH, 'utf8'))
  }

  if (!fs.existsSync(META_PATH) || !fs.existsSync(BIN_PATH)) {
    throw new Error(
      `Embedding artifacts missing. Run \`npm run generate-embeddings\` first.\n` +
        `  expected: ${META_PATH}\n` +
        `  expected: ${BIN_PATH}`
    )
  }

  const meta: EmbeddingMeta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'))
  const buf = fs.readFileSync(BIN_PATH)
  const expectedBytes = meta.chunkCount * meta.dimensions * 4
  if (buf.byteLength !== expectedBytes) {
    throw new Error(
      `embeddings.bin size mismatch: expected ${expectedBytes} bytes, got ${buf.byteLength}`
    )
  }
  const vectors = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)

  const { pipeline, env } = await import('@huggingface/transformers')
  env.allowRemoteModels = true
  env.allowLocalModels = true
  const encoder = (await pipeline('feature-extraction', meta.model, {
    dtype: 'q8',
  })) as unknown as (
    t: string,
    opts: { pooling: string; normalize: boolean }
  ) => Promise<{ data: Float32Array }>

  injectTestRuntime({ encoder, vectors, meta })
  return meta
}
