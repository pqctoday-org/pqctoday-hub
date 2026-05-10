#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * build-embedding-index.ts — Phase 1 (T16) embedding index generator.
 *
 * Encodes every RAG corpus chunk into a 384-dim sentence vector using
 * `bge-small-en-v1.5` (quantized int8) and writes a packed Float32 binary
 * to `public/data/embeddings.bin` plus a JSON sidecar mapping chunk-IDs
 * to byte offsets at `public/data/embeddings-meta.json`.
 *
 * POLICY: this script is LOCAL-ONLY. It refuses to run in any CI
 * environment (see embedding-optimization.md §6.1, §6.4). The committed
 * embeddings.bin is the authoritative artifact; CI consumes it as a
 * static file alongside rag-corpus.json.
 *
 * Maintainer workflow (see embedding-optimization.md §6.5):
 *   1. npm run generate-rag-corpus   # produces fresh rag-corpus.json
 *   2. npm run generate-embeddings   # this script
 *   3. (optional) sign with ATTESTATION_PRIVATE_KEY_FILE
 *   4. git add public/data/{rag-corpus.json,embeddings.bin,embeddings-meta.json}
 *   5. commit + PR
 *
 * Usage:
 *   npm run generate-embeddings
 *   npm run generate-embeddings:dry          # plan only, no writes
 *   tsx scripts/build-embedding-index.ts --workers=4
 *   tsx scripts/build-embedding-index.ts --model=Xenova/bge-small-en-v1.5
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

// CI hard-fail per §6.4 — keep this at the very top so even a misconfigured
// workflow file fails closed with a clear log line, no time wasted spinning
// up the WASM runtime.
if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  console.error(
    'build-embedding-index is local-only by policy. The committed\n' +
      'public/data/embeddings.bin should be used as-is in CI.\n' +
      'See pqctoday-priv/docs/platform/data/embedding-optimization.md §6\n' +
      'for the maintainer workflow.'
  )
  process.exit(2)
}

const REPO_ROOT = path.resolve(process.cwd())
const CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const EMBEDDINGS_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')

const DEFAULT_MODEL = 'Xenova/bge-small-en-v1.5'
const DEFAULT_DIMS = 384
const DEFAULT_DTYPE = 'float32' as const

interface CliOptions {
  dryRun: boolean
  workers: number
  model: string
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false, workers: 4, model: DEFAULT_MODEL }
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg.startsWith('--workers=')) opts.workers = Number(arg.slice('--workers='.length))
    else if (arg.startsWith('--model=')) opts.model = arg.slice('--model='.length)
  }
  return opts
}

interface CorpusChunk {
  id: string
  source: string
  title: string
  content: string
  category?: string
  metadata?: Record<string, unknown>
}

interface EmbeddingMeta {
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

function sha256Hex(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex')
}

function loadCorpus(): CorpusChunk[] {
  if (!existsSync(CORPUS_PATH)) {
    throw new Error(
      `No corpus at ${CORPUS_PATH}. Run \`npm run generate-rag-corpus\` first.`
    )
  }
  const raw = readFileSync(CORPUS_PATH, 'utf8')
  const parsed = JSON.parse(raw)
  return (parsed.chunks ?? parsed) as CorpusChunk[]
}

function buildText(chunk: CorpusChunk): string {
  // Title carries the most signal per token; content provides the long-form
  // body. Title-first concatenation matches how RAG passes context to the
  // generator, so the vector aligns with retrieval-time expectations.
  return `${chunk.title}\n\n${chunk.content ?? ''}`.slice(0, 8192)
}

async function loadEncoder(model: string) {
  // Dynamic import keeps the dep optional at module load (the package is
  // local-only, never bundled into the browser build path).
  const { pipeline, env } = await import('@huggingface/transformers')
  // Run on-device, WASM backend; SIMD enabled by default in Node 24.
  env.allowRemoteModels = true
  env.useBrowserCache = false
  return pipeline('feature-extraction', model, { dtype: 'q8' })
}

async function encodeAll(
  chunks: CorpusChunk[],
  encoder: Awaited<ReturnType<typeof loadEncoder>>,
  dims: number,
  workers: number
): Promise<{ vectors: Float32Array; offsets: Record<string, number> }> {
  const vectors = new Float32Array(chunks.length * dims)
  const offsets: Record<string, number> = {}
  const total = chunks.length

  // Simple round-robin batching. Transformers.js's WASM runtime is internally
  // multi-threaded; we serialize batches at this layer to keep memory bounded
  // and progress reporting deterministic. The `workers` flag is reserved for
  // future Web Worker parallelization (currently unused — see §7.1).
  const batchSize = 8 // batch chunks together for ONNX runtime efficiency
  let lastReport = Date.now()
  let processed = 0

  for (let i = 0; i < total; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, total))
    const texts = batch.map(buildText)
    const tensors = await encoder(texts, { pooling: 'mean', normalize: true })

    // `feature-extraction` returns a Tensor whose .data is a Float32Array of
    // length batch * dims when given an array of texts.
    const flat = tensors.data as Float32Array
    for (let b = 0; b < batch.length; b++) {
      const chunk = batch[b]
      const offset = (i + b) * dims
      const slice = flat.subarray(b * dims, (b + 1) * dims)
      vectors.set(slice, offset)
      offsets[chunk.id] = offset * 4 // byte offset into the eventual file
    }

    processed += batch.length
    const now = Date.now()
    if (now - lastReport > 5000 || processed === total) {
      const pct = ((processed / total) * 100).toFixed(1)
      const rate = processed / ((now - lastReport + 1) / 1000)
      console.log(
        `  encoded ${processed}/${total} chunks (${pct}%, ~${rate.toFixed(0)} ch/s)`
      )
      lastReport = now
    }
  }

  void workers // reserved for future Worker parallelization
  return { vectors, offsets }
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  console.log('build-embedding-index v1')
  console.log(`  corpus: ${CORPUS_PATH}`)
  console.log(`  model:  ${opts.model}`)
  console.log(`  output: ${EMBEDDINGS_PATH}`)
  console.log(`  dry-run: ${opts.dryRun}`)
  console.log('')

  const corpus = loadCorpus()
  const corpusHash = sha256Hex(readFileSync(CORPUS_PATH))
  console.log(`Loaded ${corpus.length} chunks (corpus sha256: ${corpusHash.slice(0, 12)}...)`)

  // Incremental rebuild: if the existing meta's corpusHash matches AND the
  // model matches, the work is already done.
  if (!opts.dryRun && existsSync(META_PATH) && existsSync(EMBEDDINGS_PATH)) {
    try {
      const existingMeta: EmbeddingMeta = JSON.parse(readFileSync(META_PATH, 'utf8'))
      if (existingMeta.corpusHash === corpusHash && existingMeta.model === opts.model) {
        console.log(
          'Existing embeddings.bin already matches this corpus + model. Nothing to do.'
        )
        return 0
      }
      console.log(
        `Existing meta mismatch (corpusHash ${existingMeta.corpusHash !== corpusHash ? 'differs' : 'matches'}, ` +
          `model ${existingMeta.model !== opts.model ? 'differs' : 'matches'}); rebuilding.`
      )
    } catch {
      // fall through to rebuild
    }
  }

  if (opts.dryRun) {
    const estimatedBytes = corpus.length * DEFAULT_DIMS * 4
    console.log('')
    console.log('Dry-run plan:')
    console.log(`  chunks to encode: ${corpus.length}`)
    console.log(`  output size:      ~${(estimatedBytes / 1024 / 1024).toFixed(1)} MB`)
    console.log(`  estimated time:   ~30 min on M-class CPU (per §7.1)`)
    console.log('')
    console.log('No files written. Re-run without --dry-run to encode.')
    return 0
  }

  console.log('Loading encoder...')
  const startEncoder = Date.now()
  const encoder = await loadEncoder(opts.model)
  console.log(`  encoder ready in ${((Date.now() - startEncoder) / 1000).toFixed(1)}s`)

  console.log('Encoding corpus...')
  const startEncode = Date.now()
  const { vectors, offsets } = await encodeAll(corpus, encoder, DEFAULT_DIMS, opts.workers)
  const encodeSec = (Date.now() - startEncode) / 1000
  console.log(`  encoded ${corpus.length} chunks in ${encodeSec.toFixed(1)}s`)

  console.log('Writing artifacts...')
  // Write as a packed Float32Array little-endian binary blob.
  writeFileSync(EMBEDDINGS_PATH, Buffer.from(vectors.buffer))

  const meta: EmbeddingMeta = {
    version: 1,
    model: opts.model,
    modelHash: sha256Hex(opts.model), // placeholder: real model SHA256 lands once we pin a download
    corpusHash,
    dimensions: DEFAULT_DIMS,
    dtype: DEFAULT_DTYPE,
    generatedAt: new Date().toISOString(),
    generatedBy: 'build-embedding-index@v1',
    chunkCount: corpus.length,
    byteOffsets: offsets,
  }
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2))

  const binSize = (vectors.byteLength / 1024 / 1024).toFixed(1)
  console.log(`  embeddings.bin:       ${binSize} MB`)
  console.log(`  embeddings-meta.json: ${(JSON.stringify(meta).length / 1024).toFixed(1)} KB`)
  console.log('')
  console.log('Done. Commit alongside the rag-corpus.json change.')

  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('build-embedding-index failed:', err)
    process.exit(1)
  })
