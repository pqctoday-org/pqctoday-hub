// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Local-only: real corpus integration for QA-F7..F12 (needs the live
 * embedding model, which requires network access to fetch from
 * HuggingFace on a cold cache -- never run in CI, see vite.config.ts's
 * `*.local.test.*` exclude and package.json's `test:local` script).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { runQASemanticChecks, _resetCacheForTesting } from '../qa-semantic-checks.js'
import { loadEmbeddingsFromDisk } from '../../lib/load-embeddings-from-disk.js'
import { resetEmbeddingRuntime } from '../../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const LIVE_CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')

const hasCorpus = fs.existsSync(LIVE_CORPUS_PATH)
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

describe.skipIf(!hasArtifact)('QA-F semantic validators — real corpus', () => {
  beforeAll(async () => {
    process.env.RAG_CORPUS_PATH = LIVE_CORPUS_PATH
    _resetCacheForTesting()
    resetEmbeddingRuntime()
    await loadEmbeddingsFromDisk()
  }, 120_000)
  afterAll(() => {
    resetEmbeddingRuntime()
    _resetCacheForTesting()
  })

  it('full run completes in < 60s on the real corpus', async () => {
    const t0 = Date.now()
    const results = await runQASemanticChecks()
    const elapsed = (Date.now() - t0) / 1000
    expect(results).toHaveLength(6)
    expect(elapsed).toBeLessThan(60)
  }, 90_000)

  it('produces at least one WARNING-severity finding (T20 catches enrichment drift)', async () => {
    const results = await runQASemanticChecks()
    const warnFindings = results
      .filter((r) => r.severity === 'WARNING')
      .reduce((n, r) => n + r.findings.length, 0)
    // Plan acceptance: ≥ 15 WARNING findings across F7-F12.
    expect(warnFindings).toBeGreaterThanOrEqual(15)
  }, 90_000)

  it('no check returns ERROR severity (calibration not yet complete)', async () => {
    const results = await runQASemanticChecks()
    for (const r of results) {
      expect(r.severity).not.toBe('ERROR')
    }
  }, 90_000)
})
