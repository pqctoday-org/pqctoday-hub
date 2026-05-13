// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Tests for Phase 2.3 DUP-1 semantic-duplicate validator.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runDuplicateChecks } from '../duplicate-checks.js'
import { loadEmbeddingsFromDisk } from '../../lib/load-embeddings-from-disk.js'
import {
  injectTestRuntime,
  resetEmbeddingRuntime,
} from '../../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const LIVE_CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')

// Synthetic-vector tests write a fake corpus to a per-worker tmp file and
// point `duplicate-checks.ts` at it via env var. The live
// `public/data/rag-corpus.json` is never touched, so sibling test files
// running in parallel (qa-semantic-checks, corpus-invariants) always see
// the real corpus.
const TMP_CORPUS_PATH = path.join(
  os.tmpdir(),
  `pqctoday-rag-corpus-test-${process.pid}-${Date.now()}.json`
)
process.env.RAG_CORPUS_PATH = TMP_CORPUS_PATH

const hasCorpus = fs.existsSync(LIVE_CORPUS_PATH)
/** Live corpus may be mid-write from the enrichment pipeline — self-skip rather than fail. */
function isCorpusParseable(): boolean {
  if (!hasCorpus) return false
  try {
    JSON.parse(fs.readFileSync(LIVE_CORPUS_PATH, 'utf8'))
    return true
  } catch {
    return false
  }
}
const hasArtifact =
  hasCorpus && fs.existsSync(META_PATH) && fs.existsSync(BIN_PATH) && isCorpusParseable()

function writeCorpus(chunks: object[]) {
  fs.writeFileSync(TMP_CORPUS_PATH, JSON.stringify({ chunks }))
}

function cleanupTmpCorpus() {
  try {
    if (fs.existsSync(TMP_CORPUS_PATH)) fs.unlinkSync(TMP_CORPUS_PATH)
  } catch {
    // best-effort
  }
}

// Real-corpus integration tests need the live path. Swap back via env var
// inside the relevant describe block (see below).
const REAL_CORPUS_ENV = LIVE_CORPUS_PATH

// Failsafe: even if the worker is force-killed, leave no stale tmp files.
for (const sig of ['exit', 'SIGTERM', 'SIGINT', 'uncaughtException'] as const) {
  process.once(sig, cleanupTmpCorpus)
}

function syntheticRuntime(byteOffsets: Record<string, number>, vectors: Float32Array) {
  injectTestRuntime({
    vectors,
    meta: {
      version: 1,
      model: 'fixture',
      modelHash: 'x',
      corpusHash: 'x',
      dimensions: 4,
      dtype: 'float32',
      generatedAt: '',
      generatedBy: 'test',
      chunkCount: Object.keys(byteOffsets).length,
      byteOffsets,
    },
    encoder: async () => ({ data: new Float32Array(4) }),
  })
}

describe('DUP-1 — synthetic vectors', () => {
  afterEach(() => {
    resetEmbeddingRuntime()
  })
  afterAll(() => {
    cleanupTmpCorpus()
  })

  it('flags an identical pair within the same source above threshold', async () => {
    const v = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0])
    syntheticRuntime({ 'library-A': 0, 'library-B': 16 }, v)
    writeCorpus([
      {
        id: 'library-A',
        source: 'library',
        title: 'A',
        metadata: { referenceId: 'A' },
      },
      {
        id: 'library-B',
        source: 'library',
        title: 'B',
        metadata: { referenceId: 'B' },
      },
    ])
    const results = await runDuplicateChecks({ thresholds: { library: 0.9 } })
    const lib = results.find((r) => r.id === 'DUP-1:library')!
    expect(lib.findings.length).toBe(1)
    expect(lib.findings[0].value).toMatch(/library-A.*library-B|library-B.*library-A/)
  })

  it('does NOT flag two pre-known equivalent chunks (same refId)', async () => {
    const v = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0])
    syntheticRuntime({ 'library-SAME-1': 0, 'library-SAME-2': 16 }, v)
    writeCorpus([
      {
        id: 'library-SAME-1',
        source: 'library',
        title: 'X',
        metadata: { referenceId: 'SAME' },
      },
      {
        id: 'library-SAME-2',
        source: 'library',
        title: 'X-alt',
        metadata: { referenceId: 'SAME' },
      },
    ])
    const results = await runDuplicateChecks({ thresholds: { library: 0.9 } })
    const lib = results.find((r) => r.id === 'DUP-1:library')!
    expect(lib.findings.length).toBe(0)
  })

  it('respects the per-source threshold', async () => {
    // Two vectors with cosine ~0.85 — under 0.92, above 0.80.
    const v = new Float32Array([1, 0, 0, 0, 0.85, 0.527, 0, 0])
    syntheticRuntime({ 'library-A': 0, 'library-B': 16 }, v)
    writeCorpus([
      { id: 'library-A', source: 'library', title: 'A', metadata: { referenceId: 'A' } },
      { id: 'library-B', source: 'library', title: 'B', metadata: { referenceId: 'B' } },
    ])
    const strict = await runDuplicateChecks({ thresholds: { library: 0.92 } })
    expect(strict.find((r) => r.id === 'DUP-1:library')!.findings.length).toBe(0)
    const loose = await runDuplicateChecks({ thresholds: { library: 0.8 } })
    expect(loose.find((r) => r.id === 'DUP-1:library')!.findings.length).toBe(1)
  })

  it('deduplicates A↔B and B↔A into a single finding', async () => {
    const v = new Float32Array([1, 0, 0, 0, 0.99, 0.141, 0, 0])
    syntheticRuntime({ 'library-A': 0, 'library-B': 16 }, v)
    writeCorpus([
      { id: 'library-A', source: 'library', title: 'A', metadata: { referenceId: 'A' } },
      { id: 'library-B', source: 'library', title: 'B', metadata: { referenceId: 'B' } },
    ])
    const r = await runDuplicateChecks({ thresholds: { library: 0.9 } })
    expect(r.find((cr) => cr.id === 'DUP-1:library')!.findings.length).toBe(1)
  })

  it('returns SKIP for all pools when embedding runtime is not ready', async () => {
    resetEmbeddingRuntime()
    writeCorpus([])
    const r = await runDuplicateChecks()
    expect(r.every((cr) => cr.status === 'SKIP')).toBe(true)
    expect(r.map((cr) => cr.id).sort()).toEqual([
      'DUP-1:library',
      'DUP-1:migrate',
      'DUP-1:timeline',
    ])
  })
})

describe.skipIf(!hasArtifact)('DUP-1 — real corpus integration', () => {
  beforeAll(async () => {
    // Point the validator at the live corpus for this block only.
    process.env.RAG_CORPUS_PATH = REAL_CORPUS_ENV
    resetEmbeddingRuntime()
    await loadEmbeddingsFromDisk()
  }, 120_000)
  afterAll(() => {
    // Restore the synthetic tmp path so any later test file that imports
    // this validator doesn't accidentally read the live corpus.
    process.env.RAG_CORPUS_PATH = TMP_CORPUS_PATH
  })

  it('full run completes in < 30s', async () => {
    const t0 = Date.now()
    const results = await runDuplicateChecks()
    const elapsed = (Date.now() - t0) / 1000
    expect(results).toHaveLength(3)
    expect(elapsed).toBeLessThan(30)
  }, 60_000)

  it('all checks are WARNING severity (no ERROR)', async () => {
    const results = await runDuplicateChecks()
    for (const r of results) expect(r.severity).toBe('WARNING')
  }, 60_000)

  it('produces at least one duplicate pair somewhere across the three pools', async () => {
    const results = await runDuplicateChecks()
    const total = results.reduce((n, r) => n + r.findings.length, 0)
    expect(total).toBeGreaterThan(0)
  }, 60_000)

  it('all reported pair cosines are at or above the per-source threshold', async () => {
    const results = await runDuplicateChecks()
    for (const r of results) {
      const source = r.id.replace('DUP-1:', '') as 'library' | 'migrate' | 'timeline'
      const threshold = { library: 0.92, migrate: 0.9, timeline: 0.88 }[source]
      for (const f of r.findings) {
        const cosine = Number(f.message.match(/cosine ([\d.]+)/)?.[1] ?? 0)
        expect(cosine).toBeGreaterThanOrEqual(threshold)
      }
    }
  }, 60_000)
})
