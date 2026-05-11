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
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { runQASemanticChecks, _resetCacheForTesting } from '../qa-semantic-checks.js'
import { loadEmbeddingsFromDisk } from '../../lib/load-embeddings-from-disk.js'
import {
  injectTestRuntime,
  resetEmbeddingRuntime,
} from '../../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')
const hasCorpus = fs.existsSync(CORPUS_PATH)
/** Corpus may be mid-write from the enrichment pipeline — self-skip rather than fail. */
function isCorpusParseable(): boolean {
  if (!hasCorpus) return false
  try {
    JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'))
    return true
  } catch {
    return false
  }
}
const hasArtifact =
  hasCorpus && fs.existsSync(META_PATH) && fs.existsSync(BIN_PATH) && isCorpusParseable()

// ── Synthetic-corpus tests ─────────────────────────────────────────────────
//
// These tests work against a temporary corpus written to a tmpdir that
// replaces `public/data/rag-corpus.json`. They cover the structural/lex
// checks (F8, F9, F11, F12) without needing the real embeddings.

const TMP_CORPUS_BACKUP = `${CORPUS_PATH}.qa-semantic-test-backup`

function writeSyntheticCorpus(chunks: object[]) {
  // Back up real corpus once, write the synthetic one.
  if (hasCorpus && !fs.existsSync(TMP_CORPUS_BACKUP)) {
    fs.copyFileSync(CORPUS_PATH, TMP_CORPUS_BACKUP)
  }
  fs.writeFileSync(CORPUS_PATH, JSON.stringify({ chunks }))
  _resetCacheForTesting()
}

function restoreRealCorpus() {
  if (fs.existsSync(TMP_CORPUS_BACKUP)) {
    fs.renameSync(TMP_CORPUS_BACKUP, CORPUS_PATH)
  }
  _resetCacheForTesting()
}

describe('QA-F semantic validators — synthetic corpus', () => {
  afterEach(() => {
    restoreRealCorpus()
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
    resetEmbeddingRuntime()
    await loadEmbeddingsFromDisk()
  }, 120_000)

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
    restoreRealCorpus()
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
