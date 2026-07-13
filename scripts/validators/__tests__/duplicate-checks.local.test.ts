// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Local-only: real corpus integration for DUP-1 (needs the live
 * embedding model, which requires network access to fetch from
 * HuggingFace on a cold cache -- never run in CI, see vite.config.ts's
 * `*.local.test.*` exclude and package.json's `test:local` script).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { runDuplicateChecks } from '../duplicate-checks.js'
import { loadEmbeddingsFromDisk } from '../../lib/load-embeddings-from-disk.js'
import { resetEmbeddingRuntime } from '../../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const LIVE_CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')

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

describe.skipIf(!hasArtifact)('DUP-1 — real corpus integration', () => {
  beforeAll(async () => {
    process.env.RAG_CORPUS_PATH = LIVE_CORPUS_PATH
    resetEmbeddingRuntime()
    await loadEmbeddingsFromDisk()
  }, 120_000)
  afterAll(() => {
    resetEmbeddingRuntime()
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
