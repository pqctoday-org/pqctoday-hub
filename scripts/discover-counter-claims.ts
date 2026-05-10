#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * discover-counter-claims.ts — Phase 2.2 / T09 expansion.
 *
 * Offline generator. Clusters Authoritative-tier chunks (library /
 * compliance / timeline with a populated `metadata.trustedSourceId`) by
 * topic via k-means, then within each cluster surfaces pairs whose
 * authors disagree — semantically distant claims from different
 * trusted sources on the same topic.
 *
 * Algorithm (matches plan §2.2 with one simplification — the trusted
 * source is read from chunk metadata, no xref CSV load needed):
 *   1. Filter corpus to library/compliance/timeline chunks with a
 *      trustedSourceId.
 *   2. Run k-means with fixed seed (k=50 default, configurable).
 *   3. Within each cluster, enumerate pairs (a, b) where
 *      trustedSourceId_a ≠ trustedSourceId_b and cosine(a, b) < 0.6.
 *   4. Score each candidate (1 − cosine) × log2(distinct sources in
 *      that cluster).
 *   5. Output top 100 to JSON.
 *
 * POLICY: LOCAL-ONLY. CI hard-fail; output is reviewed by SME via
 * the admin portal (deferred to a separate PR).
 *
 * Usage:
 *   tsx scripts/discover-counter-claims.ts                 # writes /tmp/counter-claim-candidates.json
 *   tsx scripts/discover-counter-claims.ts --k=50          # cluster count
 *   tsx scripts/discover-counter-claims.ts --threshold=0.6 # max cosine for "different stance"
 *   tsx scripts/discover-counter-claims.ts --top-n=100     # output cap
 *   tsx scripts/discover-counter-claims.ts --out=path.json
 *   tsx scripts/discover-counter-claims.ts --seed=42       # k-means init seed
 *   tsx scripts/discover-counter-claims.ts --dry-run       # plan only
 */
import fs from 'node:fs'
import path from 'node:path'
import { loadEmbeddingsFromDisk } from './lib/load-embeddings-from-disk.js'
import {
  getChunkVector,
  getEmbeddingDimensions,
} from '../src/services/search/embeddingRetrieval.js'

// CI hard-fail — same policy as build-embedding-index / propose-xref-edges.
if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  console.error(
    'discover-counter-claims is local-only by policy.\n' +
      'Run on a maintainer machine; output JSON is for admin-portal SME review.'
  )
  process.exit(2)
}

const REPO_ROOT = process.cwd()

interface CliOptions {
  k: number
  threshold: number
  topN: number
  outPath: string
  seed: number
  dryRun: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    k: 50,
    threshold: 0.6,
    topN: 100,
    outPath: '/tmp/counter-claim-candidates.json',
    seed: 42,
    dryRun: false,
  }
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg.startsWith('--k=')) opts.k = Number(arg.slice('--k='.length))
    else if (arg.startsWith('--threshold='))
      opts.threshold = Number(arg.slice('--threshold='.length))
    else if (arg.startsWith('--top-n=')) opts.topN = Number(arg.slice('--top-n='.length))
    else if (arg.startsWith('--out=')) opts.outPath = arg.slice('--out='.length)
    else if (arg.startsWith('--seed=')) opts.seed = Number(arg.slice('--seed='.length))
  }
  return opts
}

interface RagChunk {
  id: string
  source: string
  title: string
  content: string
  metadata?: {
    trustedSourceId?: string
    refId?: string
    referenceId?: string
    [k: string]: unknown
  }
}

interface CandidatePool {
  chunks: RagChunk[]
  vectors: Float32Array[]
  trustedSources: string[]
}

function loadPool(): CandidatePool {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'public/data/rag-corpus.json'), 'utf8')
  )
  const chunks = (corpus.chunks ?? corpus) as RagChunk[]
  const out: CandidatePool = { chunks: [], vectors: [], trustedSources: [] }
  for (const c of chunks) {
    if (!['library', 'compliance', 'timeline'].includes(c.source)) continue
    const tsid = (c.metadata?.trustedSourceId as string) ?? ''
    if (!tsid) continue
    const v = getChunkVector(c.id)
    if (!v) continue
    out.chunks.push(c)
    out.vectors.push(new Float32Array(v)) // copy — we'll renormalize centroids
    out.trustedSources.push(tsid)
  }
  return out
}

// ── Deterministic pseudo-random + k-means ──────────────────────────────────

/** mulberry32 — small, deterministic 32-bit PRNG seeded by integer. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function normalize(v: Float32Array): void {
  let s = 0
  for (let i = 0; i < v.length; i++) s += v[i] * v[i]
  if (s === 0) return
  const inv = 1 / Math.sqrt(s)
  for (let i = 0; i < v.length; i++) v[i] *= inv
}

/**
 * Spherical k-means. All input vectors are pre-normalized so we use
 * cosine similarity (= dot product) as the assignment metric. Centroids
 * are re-normalized each iteration.
 */
function kMeans(
  vectors: Float32Array[],
  k: number,
  seed: number,
  maxIter = 50
): { assignments: Int32Array; centroids: Float32Array[]; iterations: number } {
  const n = vectors.length
  const dims = vectors[0].length
  const rng = mulberry32(seed)

  // Deterministic init: shuffle indices via the seeded RNG and pick first k.
  const indices = new Int32Array(n)
  for (let i = 0; i < n; i++) indices[i] = i
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }
  const centroids: Float32Array[] = []
  for (let c = 0; c < k; c++) centroids.push(new Float32Array(vectors[indices[c]]))

  const assignments = new Int32Array(n)
  let iterations = 0
  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1
    let changes = 0
    // Assign each point to the centroid with highest cosine.
    for (let i = 0; i < n; i++) {
      let best = -Infinity
      let bestIdx = 0
      for (let c = 0; c < k; c++) {
        const s = dot(vectors[i], centroids[c])
        if (s > best) {
          best = s
          bestIdx = c
        }
      }
      if (assignments[i] !== bestIdx) {
        assignments[i] = bestIdx
        changes++
      }
    }
    if (changes === 0) break

    // Recompute centroids as mean of assigned vectors, then renormalize.
    const next: Float32Array[] = []
    const counts = new Int32Array(k)
    for (let c = 0; c < k; c++) next.push(new Float32Array(dims))
    for (let i = 0; i < n; i++) {
      const c = assignments[i]
      counts[c]++
      const v = vectors[i]
      const tgt = next[c]
      for (let d = 0; d < dims; d++) tgt[d] += v[d]
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) {
        // Empty cluster — reseed with a random unassigned vector.
        next[c].set(vectors[indices[(c + iter) % n]])
      }
      normalize(next[c])
      centroids[c] = next[c]
    }
  }
  return { assignments, centroids, iterations }
}

// ── Candidate scoring ──────────────────────────────────────────────────────

interface CounterClaimCandidate {
  cluster: number
  source_a: string
  source_b: string
  chunk_a: string
  chunk_b: string
  label_a: string
  label_b: string
  cosine: number
  score: number
}

function findCandidates(
  pool: CandidatePool,
  assignments: Int32Array,
  threshold: number,
  k: number
): CounterClaimCandidate[] {
  // Group chunk indices by cluster.
  const byCluster: number[][] = []
  for (let c = 0; c < k; c++) byCluster.push([])
  for (let i = 0; i < assignments.length; i++) byCluster[assignments[i]].push(i)

  const candidates: CounterClaimCandidate[] = []
  for (let c = 0; c < k; c++) {
    const members = byCluster[c]
    if (members.length < 2) continue
    // Distinct sources in this cluster — needed for the diversity bonus.
    const distinctSources = new Set(members.map((i) => pool.trustedSources[i]))
    if (distinctSources.size < 2) continue
    const diversityBonus = Math.log2(distinctSources.size)
    // Cross-source pair enumeration.
    for (let i = 0; i < members.length; i++) {
      const a = members[i]
      const srcA = pool.trustedSources[a]
      for (let j = i + 1; j < members.length; j++) {
        const b = members[j]
        const srcB = pool.trustedSources[b]
        if (srcA === srcB) continue
        const cosine = dot(pool.vectors[a], pool.vectors[b])
        if (cosine >= threshold) continue // too similar = same stance, skip
        const score = (1 - cosine) * diversityBonus
        candidates.push({
          cluster: c,
          source_a: srcA,
          source_b: srcB,
          chunk_a: pool.chunks[a].id,
          chunk_b: pool.chunks[b].id,
          label_a: pool.chunks[a].title,
          label_b: pool.chunks[b].title,
          cosine,
          score,
        })
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score)
  return candidates
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  console.log('discover-counter-claims v1')
  console.log(`  k:         ${opts.k}`)
  console.log(`  threshold: ${opts.threshold}`)
  console.log(`  top-N:     ${opts.topN}`)
  console.log(`  seed:      ${opts.seed}`)
  console.log(`  output:    ${opts.outPath}`)
  console.log(`  dry-run:   ${opts.dryRun}`)
  console.log('')

  await loadEmbeddingsFromDisk()
  const dims = getEmbeddingDimensions()
  console.log(`Embedding runtime ready (dims=${dims}).`)

  const pool = loadPool()
  console.log(
    `Pool: ${pool.chunks.length} chunks across ${new Set(pool.trustedSources).size} trusted sources`
  )
  if (pool.chunks.length < opts.k * 2) {
    console.error(
      `Pool too small (${pool.chunks.length}) for k=${opts.k}. Reduce --k or expand metadata.trustedSourceId coverage.`
    )
    return 2
  }

  const t0 = Date.now()
  const { assignments, iterations } = kMeans(pool.vectors, opts.k, opts.seed)
  console.log(`k-means converged in ${iterations} iterations (${((Date.now() - t0) / 1000).toFixed(2)}s)`)

  const candidates = findCandidates(pool, assignments, opts.threshold, opts.k)
  console.log(`Cross-source candidate pairs: ${candidates.length}`)
  const top = candidates.slice(0, opts.topN)

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    k: opts.k,
    threshold: opts.threshold,
    seed: opts.seed,
    poolSize: pool.chunks.length,
    distinctSources: new Set(pool.trustedSources).size,
    candidateCount: top.length,
    candidates: top,
  }

  if (opts.dryRun) {
    console.log('')
    console.log(`Top ${Math.min(10, top.length)} candidates:`)
    for (const c of top.slice(0, 10)) {
      console.log(
        `  score=${c.score.toFixed(3)} cosine=${c.cosine.toFixed(3)} cluster=${c.cluster}  ${c.source_a}↔${c.source_b}`
      )
      console.log(`    ${c.label_a}`)
      console.log(`    ${c.label_b}`)
    }
    return 0
  }

  fs.writeFileSync(opts.outPath, JSON.stringify(output, null, 2))
  console.log(`Wrote ${opts.outPath} (${(JSON.stringify(output).length / 1024).toFixed(1)} KB)`)
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('discover-counter-claims failed:', err)
    process.exit(1)
  })
