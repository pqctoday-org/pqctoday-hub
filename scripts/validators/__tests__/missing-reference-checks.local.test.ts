// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Local-only: real-artifact integration for proposeReferenceCandidates /
 * runMissingReferenceChecks (needs the live embedding model, which
 * requires network access to fetch from HuggingFace on a cold cache --
 * never run in CI, see vite.config.ts's `*.local.test.*` exclude and
 * package.json's `test:local` script).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { resetEmbeddingRuntime } from '../../../src/services/search/embeddingRetrieval'
import { proposeReferenceCandidates, runMissingReferenceChecks } from '../missing-reference-checks'
import { loadEmbeddingsFromDisk } from '../../lib/load-embeddings-from-disk'

const REPO_ROOT = process.cwd()
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')
const CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')

/** Corpus may be mid-write from the enrichment pipeline — self-skip rather than fail. */
function isCorpusParseable(): boolean {
  if (!fs.existsSync(CORPUS_PATH)) return false
  try {
    JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'))
    return true
  } catch {
    return false
  }
}
const hasEmbeddingArtifact = fs.existsSync(META_PATH) && fs.existsSync(BIN_PATH)
const hasRealArtifact = hasEmbeddingArtifact && isCorpusParseable()

describe.skipIf(!hasRealArtifact)('proposeReferenceCandidates — Phase 2.1 (real artifact)', () => {
  beforeEach(() => {
    resetEmbeddingRuntime()
  })

  it('returns 3 ranked candidates with descending scores against real artifact', async () => {
    // Use the real on-disk embedding runtime via the Node loader. This is
    // the same path runMissingReferenceChecks uses when --with-candidates
    // is enabled.
    await loadEmbeddingsFromDisk()

    const candidates = await proposeReferenceCandidates(
      'FIPS 140-3 cryptographic module validation programme',
      3
    )
    expect(candidates).toHaveLength(3)
    // Scores in [0, 1] and descending
    for (const c of candidates) {
      expect(c.score).toBeGreaterThan(0)
      expect(c.score).toBeLessThanOrEqual(1.0001)
      expect(c.id).toMatch(/^trusted-source-/)
      expect(c.label).toBeTruthy()
    }
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i].score).toBeLessThanOrEqual(candidates[i - 1].score)
    }
  })
})

describe.skipIf(!hasRealArtifact)(
  'runMissingReferenceChecks — Phase 2.1 candidates wiring (real artifact)',
  () => {
    beforeEach(() => {
      resetEmbeddingRuntime()
    })

    // Timeout: loads the on-disk embedding artifact + cosine candidate
    // search over the full corpus — well under 5s locally but slower on CI.
    it('findings have populated candidates when withCandidates=true and runtime loaded', async () => {
      await loadEmbeddingsFromDisk()
      const result = await runMissingReferenceChecks({ withCandidates: true })
      if (result.findings.length === 0) {
        // No findings to enrich; not a failure of the candidate path.
        return
      }
      const sampled = result.findings.slice(0, 5)
      for (const f of sampled) {
        expect(f.candidates, `finding ${f.value} should have candidates`).toBeDefined()
        expect(f.candidates).toHaveLength(3)
      }
    }, 30000)
  }
)
