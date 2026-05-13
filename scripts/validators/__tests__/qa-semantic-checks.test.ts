// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Tests for Phase 2.4 / T20 QA-F7..F12 semantic validators.
 *
 * Layered strategy:
 *  - Synthetic-fixture unit tests for F8/F9/F11/F12 (no embedding needed).
 *  - Real-artifact integration tests for F7 and F10 — self-skip when the
 *    embedding artifact or corpus is absent.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runQASemanticChecks, _resetCacheForTesting } from '../qa-semantic-checks.js'
import { loadEmbeddingsFromDisk } from '../../lib/load-embeddings-from-disk.js'
import {
  injectTestRuntime,
  resetEmbeddingRuntime,
} from '../../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const LIVE_CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')

// Per-worker tmp corpus. The validator reads `process.env.RAG_CORPUS_PATH`
// lazily, so synthetic-corpus tests never touch the live file. The original
// design backed up + overwrote `public/data/rag-corpus.json` in place; that
// raced with sibling test files (corpus-trust-invariants, duplicate-checks)
// reading the same path under vitest's parallel pool.
const TMP_CORPUS_PATH = path.join(
  os.tmpdir(),
  `pqctoday-qa-semantic-corpus-${process.pid}-${Date.now()}.json`
)
process.env.RAG_CORPUS_PATH = TMP_CORPUS_PATH

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

function writeSyntheticCorpus(chunks: object[]) {
  fs.writeFileSync(TMP_CORPUS_PATH, JSON.stringify({ chunks }))
  _resetCacheForTesting()
}

function cleanupTmpCorpus() {
  try {
    if (fs.existsSync(TMP_CORPUS_PATH)) fs.unlinkSync(TMP_CORPUS_PATH)
  } catch {
    // best-effort
  }
}

for (const sig of ['exit', 'SIGTERM', 'SIGINT', 'uncaughtException'] as const) {
  process.once(sig, cleanupTmpCorpus)
}

describe('QA-F semantic validators — synthetic corpus', () => {
  afterEach(() => {
    _resetCacheForTesting()
  })
  afterAll(() => {
    cleanupTmpCorpus()
  })

  it('QA-F8 flags an algorithm listed but absent from same-collection content', async () => {
    writeSyntheticCorpus([
      {
        id: 'doc-enrichment-FAKE-001',
        source: 'document-enrichment',
        title: 'Fake',
        content:
          'Title: Fake\nMain Topic: Test.\nPQC Algorithms Covered: ML-KEM-768; UNICORN-999',
        metadata: { refId: 'FAKE-001', collection: 'library' },
      },
      {
        id: 'library-FAKE-001',
        source: 'library',
        title: 'Library Source',
        content: 'This document discusses ML-KEM-768 in depth.',
        metadata: { referenceId: 'FAKE-001' },
      },
    ])
    const results = await runQASemanticChecks({ only: ['QA-F8'] })
    expect(results).toHaveLength(1)
    const f8 = results[0]
    expect(f8.id).toBe('QA-F8')
    expect(f8.findings.map((f) => f.message).some((m) => m.includes('UNICORN-999'))).toBe(true)
    expect(f8.findings.map((f) => f.message).some((m) => m.includes('ML-KEM-768'))).toBe(false)
  })

  it('QA-F9 flags a library enrichment with timeline but no quantum threats', async () => {
    writeSyntheticCorpus([
      {
        id: 'doc-enrichment-LIB-001',
        source: 'document-enrichment',
        title: 'Lib',
        content:
          'Main Topic: x.\nMigration Timeline Info: 2025-2030 migration window.\nQuantum Threats Addressed: None detected',
        metadata: { refId: 'LIB-001', collection: 'library' },
      },
      {
        id: 'doc-enrichment-LIB-002',
        source: 'document-enrichment',
        title: 'Lib2',
        content:
          'Main Topic: x.\nMigration Timeline Info: by 2030.\nQuantum Threats Addressed: Harvest-now-decrypt-later',
        metadata: { refId: 'LIB-002', collection: 'library' },
      },
    ])
    const results = await runQASemanticChecks({ only: ['QA-F9'] })
    expect(results[0].id).toBe('QA-F9')
    const flagged = results[0].findings.map((f) => f.value)
    expect(flagged).toContain('LIB-001')
    expect(flagged).not.toContain('LIB-002')
  })

  it('QA-F11 (INFO) tolerates spelled-out body names that contain a known acronym', async () => {
    writeSyntheticCorpus([
      {
        id: 'doc-enrichment-FAKE-003',
        source: 'document-enrichment',
        title: 'Fake',
        content:
          'Standardization Bodies: National Institute of Standards and Technology (NIST); Made-Up Council',
        metadata: { refId: 'FAKE-003', collection: 'library' },
      },
    ])
    const results = await runQASemanticChecks({ only: ['QA-F11'] })
    const f11 = results[0]
    expect(f11.severity).toBe('INFO')
    // NIST spelled out should NOT be flagged (loose substring match)
    expect(f11.findings.map((f) => f.message).some((m) => m.includes('National Institute'))).toBe(
      false
    )
    // The made-up council should be flagged
    expect(f11.findings.map((f) => f.message).some((m) => m.includes('Made-Up Council'))).toBe(true)
  })

  it('QA-F12 (INFO) accepts known framework name, flags unknown', async () => {
    writeSyntheticCorpus([
      {
        id: 'doc-enrichment-FAKE-004',
        source: 'document-enrichment',
        title: 'Fake',
        content: 'Compliance Frameworks Referenced: FIPS 140-3; Made-Up Local Act 2026',
        metadata: { refId: 'FAKE-004', collection: 'library' },
      },
    ])
    const results = await runQASemanticChecks({ only: ['QA-F12'] })
    expect(results[0].id).toBe('QA-F12')
    expect(results[0].severity).toBe('INFO')
    expect(
      results[0].findings.map((f) => f.message).some((m) => m.includes('Made-Up Local Act'))
    ).toBe(true)
    expect(results[0].findings.map((f) => f.message).some((m) => m.includes('FIPS 140-3'))).toBe(
      false
    )
  })

  it('runs only the requested subset when `only` is passed', async () => {
    writeSyntheticCorpus([
      {
        id: 'doc-enrichment-x',
        source: 'document-enrichment',
        title: 't',
        content: 'Main Topic: x',
        metadata: { refId: 'X', collection: 'library' },
      },
    ])
    const results = await runQASemanticChecks({ only: ['QA-F8', 'QA-F12'] })
    expect(results.map((r) => r.id).sort()).toEqual(['QA-F12', 'QA-F8'])
  })

  it('every check ships at WARNING or INFO severity (no ERROR)', async () => {
    writeSyntheticCorpus([])
    const results = await runQASemanticChecks()
    for (const r of results) {
      expect(['WARNING', 'INFO']).toContain(r.severity)
    }
    expect(results.map((r) => r.id).sort()).toEqual([
      'QA-F10',
      'QA-F11',
      'QA-F12',
      'QA-F7',
      'QA-F8',
      'QA-F9',
    ])
  })
})

// ── Real-artifact integration tests ────────────────────────────────────────

describe.skipIf(!hasArtifact)('QA-F semantic validators — real corpus', () => {
  beforeAll(async () => {
    // Point the validator at the live corpus for this block only.
    process.env.RAG_CORPUS_PATH = LIVE_CORPUS_PATH
    _resetCacheForTesting()
    resetEmbeddingRuntime()
    await loadEmbeddingsFromDisk()
  }, 120_000)
  afterAll(() => {
    // Restore the synthetic tmp path so any later test in this worker
    // doesn't accidentally read the live corpus.
    process.env.RAG_CORPUS_PATH = TMP_CORPUS_PATH
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

// ── Embedding-runtime synthetic test ──────────────────────────────────────

describe('QA-F7/F10 with injected synthetic embedding runtime', () => {
  afterEach(() => {
    _resetCacheForTesting()
    resetEmbeddingRuntime()
  })

  it('QA-F7 flags a chunk whose top-1 same-collection cosine is below threshold', async () => {
    // Two enrichment chunks + two library chunks, with hand-built vectors
    // that put one enrichment far from any library chunk.
    const dims = 4
    const meta = {
      version: 1 as const,
      model: 'fixture',
      modelHash: 'x',
      corpusHash: 'x',
      dimensions: dims,
      dtype: 'float32' as const,
      generatedAt: '',
      generatedBy: 'test',
      chunkCount: 4,
      byteOffsets: {
        'doc-enrichment-GROUNDED': 0,
        'doc-enrichment-DRIFTED': 16,
        'library-GROUNDED': 32,
        'library-OTHER': 48,
      },
    }
    // Each row = 4 floats × 4 bytes = 16 bytes. All normalized.
    const v = new Float32Array(16)
    // GROUNDED enrichment + GROUNDED library: aligned on dim 0.
    v[0] = 1
    v[1] = 0
    v[2] = 0
    v[3] = 0 // doc-enr GROUNDED
    v[4] = 0
    v[5] = 0
    v[6] = 0
    v[7] = 1 // doc-enr DRIFTED (orthogonal)
    v[8] = 1
    v[9] = 0
    v[10] = 0
    v[11] = 0 // library GROUNDED
    v[12] = 0
    v[13] = 1
    v[14] = 0
    v[15] = 0 // library OTHER
    injectTestRuntime({
      vectors: v,
      meta,
      encoder: async () => ({ data: new Float32Array(dims) }),
    })
    writeSyntheticCorpus([
      {
        id: 'doc-enrichment-GROUNDED',
        source: 'document-enrichment',
        title: 'Grounded',
        content: 'Main Topic: A topic that is well-grounded in its collection.',
        metadata: { refId: 'GROUNDED', collection: 'library' },
      },
      {
        id: 'doc-enrichment-DRIFTED',
        source: 'document-enrichment',
        title: 'Drifted',
        content: 'Main Topic: A topic that has drifted from any library content.',
        metadata: { refId: 'DRIFTED', collection: 'library' },
      },
      {
        id: 'library-GROUNDED',
        source: 'library',
        title: 'Lib1',
        content: 'lib body',
        metadata: { referenceId: 'GROUNDED' },
      },
      {
        id: 'library-OTHER',
        source: 'library',
        title: 'Lib2',
        content: 'lib body',
        metadata: { referenceId: 'OTHER' },
      },
    ])
    const results = await runQASemanticChecks({ only: ['QA-F7'] })
    const flagged = results[0].findings.map((f) => f.value)
    expect(flagged).toContain('DRIFTED')
    expect(flagged).not.toContain('GROUNDED')
  })
})
