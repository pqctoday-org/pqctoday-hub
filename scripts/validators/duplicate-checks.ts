// SPDX-License-Identifier: GPL-3.0-only
/**
 * duplicate-checks.ts — Phase 2.3 / DUP-1.
 *
 * Pair-wise semantic-duplicate detection across the library / migrate /
 * timeline chunk pools, using pre-encoded vectors from the Phase 1
 * embedding index. WARNING severity; SME triages each pair manually.
 *
 * Per-CSV thresholds (from the plan; calibration over time):
 *   library  0.92  (stricter — standards often share boilerplate)
 *   migrate  0.90
 *   timeline 0.88
 *
 * Performance. Direct dot-product over Float32 vector slices, no
 * re-encoding. For 789 library chunks the inner loop is
 * 789 × 788 / 2 × 384 ≈ 120M FLOPS — sub-second. Total runtime over
 * all three pools is single-digit seconds.
 *
 * Caller must initialize the embedding runtime first
 * (`loadEmbeddingsFromDisk`); otherwise the check self-skips.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { CheckResult, Finding } from './types.js'
import {
  isEmbeddingRuntimeReady,
  cosineSearchByChunkId,
} from '../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')

interface RagChunk {
  id: string
  source: string
  title: string
  metadata?: { refId?: string; referenceId?: string; [k: string]: unknown }
}

interface DupPool {
  source: 'library' | 'migrate' | 'timeline'
  threshold: number
}

const POOLS: DupPool[] = [
  { source: 'library', threshold: 0.92 },
  { source: 'migrate', threshold: 0.9 },
  { source: 'timeline', threshold: 0.88 },
]

function loadChunks(): RagChunk[] {
  if (!fs.existsSync(CORPUS_PATH)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'))
    return (raw.chunks ?? raw) as RagChunk[]
  } catch {
    // Corpus is mid-write from enrichment — caller gets an empty pool.
    return []
  }
}

function poolChunkIds(chunks: RagChunk[], source: DupPool['source']): RagChunk[] {
  return chunks.filter((c) => c.source === source)
}

export interface DuplicateCheckOptions {
  /** Override per-source thresholds (e.g. `{ library: 0.85 }`). */
  thresholds?: Partial<Record<DupPool['source'], number>>
}

/**
 * Run DUP-1 across library, migrate, timeline pools. Returns one
 * CheckResult per source plus a roll-up. WARNING severity throughout.
 */
export async function runDuplicateChecks(
  opts: DuplicateCheckOptions = {}
): Promise<CheckResult[]> {
  if (!isEmbeddingRuntimeReady()) {
    return POOLS.map((p) => ({
      id: `DUP-1:${p.source}`,
      category: 'duplicate' as const,
      description: `Pair-wise semantic duplicates within ${p.source} (cosine ≥ ${opts.thresholds?.[p.source] ?? p.threshold})`,
      sourceA: `corpus chunks where source=${p.source}`,
      sourceB: null,
      severity: 'WARNING' as const,
      status: 'SKIP' as const,
      findings: [],
    }))
  }

  const chunks = loadChunks()
  const results: CheckResult[] = []

  for (const p of POOLS) {
    const threshold = opts.thresholds?.[p.source] ?? p.threshold
    const pool = poolChunkIds(chunks, p.source)
    const findings = await findDuplicates(pool, threshold)
    results.push({
      id: `DUP-1:${p.source}`,
      category: 'duplicate',
      description: `Pair-wise semantic duplicates within ${p.source} (cosine ≥ ${threshold})`,
      sourceA: `corpus chunks where source=${p.source}`,
      sourceB: null,
      severity: 'WARNING',
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      findings,
    })
  }

  return results
}

/**
 * Find all duplicate pairs above `threshold` within a pool. Uses
 * `cosineSearchByChunkId` per chunk and deduplicates pairs (A→B and
 * B→A collapse).
 */
async function findDuplicates(pool: RagChunk[], threshold: number): Promise<Finding[]> {
  const seen = new Set<string>()
  const findings: Finding[] = []
  const candidateIds = pool.map((c) => c.id)
  // Title map for human-readable messages.
  const titleById = new Map(pool.map((c) => [c.id, c.title]))
  // refId map (for collapsing pre-known equivalents — same row, multiple chunks).
  const refIdById = new Map(
    pool.map((c) => [c.id, (c.metadata?.referenceId ?? c.metadata?.refId ?? '') as string])
  )

  for (const chunk of pool) {
    // Pull top-10 nearest; bail when score drops below threshold.
    const hits = await cosineSearchByChunkId(chunk.id, { candidateIds, k: 10 })
    for (const hit of hits) {
      if (hit.score < threshold) break
      const a = chunk.id
      const b = hit.chunkId
      // Pair key: lexicographic ordering for set-membership.
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      if (seen.has(key)) continue
      seen.add(key)
      // Same refId is not a duplicate finding — it's the same logical record
      // chunked twice (e.g., library-FIPS-203 + library-FIPS-203-overview).
      const refA = refIdById.get(a)
      const refB = refIdById.get(b)
      if (refA && refB && refA === refB) continue
      findings.push({
        csv: `enrichment:${chunk.source}`,
        row: null,
        field: 'cosine',
        value: `${a} ↔ ${b}`,
        message: `near-duplicate (cosine ${hit.score.toFixed(3)}): "${titleById.get(a) ?? a}" ↔ "${titleById.get(b) ?? b}"`,
      })
    }
  }

  findings.sort((a, b) => {
    // Sort by cosine descending — embed score is in the message text.
    const sa = Number(a.message.match(/cosine ([\d.]+)/)?.[1] ?? 0)
    const sb = Number(b.message.match(/cosine ([\d.]+)/)?.[1] ?? 0)
    return sb - sa
  })

  return findings
}
