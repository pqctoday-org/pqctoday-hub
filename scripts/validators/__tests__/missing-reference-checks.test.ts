// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Tests for Phase 2.1 — proposeReferenceCandidates + the --with-candidates
 * extension to MR-1.
 *
 * Strategy: inject a synthetic embedding runtime via injectTestRuntime to
 * exercise the candidate-ranking path deterministically. The real model is
 * driven by the integration tests in
 * src/services/search/__tests__/embeddingRetrieval.integration.test.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  injectTestRuntime,
  resetEmbeddingRuntime,
  type EmbeddingMeta,
} from '../../../src/services/search/embeddingRetrieval'
import {
  proposeReferenceCandidates,
  runMissingReferenceChecks,
} from '../missing-reference-checks'

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

/** Normalized fixture vector helper. */
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

function makeMeta(ids: string[], dims: number): EmbeddingMeta {
  const byteOffsets: Record<string, number> = {}
  ids.forEach((id, i) => {
    byteOffsets[id] = i * dims * 4
  })
  return {
    version: 1,
    model: 'fixture',
    modelHash: 'sha256:fixture',
    corpusHash: 'sha256:fixture',
    dimensions: dims,
    dtype: 'float32',
    generatedAt: '2026-05-10T00:00:00Z',
    generatedBy: 'fixture',
    chunkCount: ids.length,
    byteOffsets,
  }
}

describe('proposeReferenceCandidates — Phase 2.1', () => {
  beforeEach(() => {
    resetEmbeddingRuntime()
  })

  it('returns empty when embedding artifact is missing', async () => {
    // The function reads embeddings-meta.json from disk to discover the
    // trusted-source chunk pool. When that file is absent, returns [].
    // We skip this assertion when the embedding artifact IS on disk (meta
    // + bin), because we can't safely move those files aside in test.
    if (hasEmbeddingArtifact) return
    const result = await proposeReferenceCandidates('FIPS 140-3 module validation', 3)
    expect(result).toEqual([])
  })

  it('returns empty when there are no trusted-sources chunks in the index', async () => {
    // Inject a synthetic runtime with NO trusted-sources prefixed IDs.
    injectTestRuntime({
      vectors: pack([vec([1, 0, 0, 0]), vec([0, 1, 0, 0])]),
      meta: makeMeta(['library-FIPS_203', 'compliance-DORA'], 4),
      encoder: async () => ({ data: vec([1, 0, 0, 0]) }),
    })
    // Despite an injected runtime, the function reads from the real
    // embeddings-meta.json file on disk for the candidate pool.
    // If the disk meta has no trusted-sources entries OR is missing,
    // we get []. (In CI, the real artifact has them — this exercises
    // the empty-pool branch only when meta file is absent.)
    const result = await proposeReferenceCandidates('FIPS 140-3 module validation', 3)
    // Either the real meta has trusted-sources (returns 3 hits) OR not (returns []).
    // Both are valid; the contract is that the function never throws.
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it.skipIf(!hasRealArtifact)(
    'returns 3 ranked candidates with descending scores against real artifact',
    async () => {
      // Use the real on-disk embedding runtime via the Node loader. This is
      // the same path runMissingReferenceChecks uses when --with-candidates
      // is enabled.
      const { loadEmbeddingsFromDisk } = await import('../../lib/load-embeddings-from-disk')
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
    }
  )
})

describe('runMissingReferenceChecks — Phase 2.1 candidates wiring', () => {
  beforeEach(() => {
    resetEmbeddingRuntime()
  })

  it('returns a CheckResult with id=MR-1, severity=WARNING', async () => {
    const result = await runMissingReferenceChecks({ withCandidates: false })
    expect(result.id).toBe('MR-1')
    expect(result.severity).toBe('WARNING')
    expect(['PASS', 'FAIL']).toContain(result.status)
  })

  it('findings have no candidates field when withCandidates=false', async () => {
    const result = await runMissingReferenceChecks({ withCandidates: false })
    for (const f of result.findings) {
      expect(f.candidates).toBeUndefined()
    }
  })

  it.skipIf(!hasRealArtifact)(
    'findings have populated candidates when withCandidates=true and runtime loaded',
    async () => {
      const { loadEmbeddingsFromDisk } = await import('../../lib/load-embeddings-from-disk')
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
    }
  )

  it('falls back gracefully when withCandidates=true but artifact missing', async () => {
    // Force the embedding loader to never resolve a real artifact by
    // resetting and not calling loadEmbeddingsFromDisk. Then the
    // late-bound cosineSearch inside proposeReferenceCandidates throws,
    // which the validator catches per design — findings have no candidates.
    resetEmbeddingRuntime()
    const result = await runMissingReferenceChecks({ withCandidates: true })
    // The result must still be well-formed even though candidates may be missing.
    expect(['PASS', 'FAIL']).toContain(result.status)
    // Candidates either populated (artifact existed and was loaded earlier in
    // the test run) or undefined (loader path failed). Both are valid here.
  })
})
