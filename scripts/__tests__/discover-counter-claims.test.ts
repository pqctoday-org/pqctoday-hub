// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Tests for Phase 2.2 discover-counter-claims generator.
 *
 * Subprocess strategy (matches propose-xref-edges.test.ts): the script is
 * heavy enough that running it through tsx in-process would pull the
 * embedding runtime into Vitest's harness. Subprocess keeps tests isolated
 * and verifies the actual end-to-end output the admin portal will consume.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const REPO_ROOT = process.cwd()
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')
const SCRIPT = path.join(REPO_ROOT, 'scripts/discover-counter-claims.ts')
const hasArtifact = fs.existsSync(META_PATH) && fs.existsSync(BIN_PATH)

interface CcOutput {
  version: 1
  generatedAt: string
  k: number
  threshold: number
  seed: number
  poolSize: number
  distinctSources: number
  candidateCount: number
  candidates: Array<{
    cluster: number
    source_a: string
    source_b: string
    chunk_a: string
    chunk_b: string
    label_a: string
    label_b: string
    cosine: number
    score: number
  }>
}

function runScript(args: string[] = []): CcOutput {
  const outPath = `/tmp/cc-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  execFileSync('npx', ['tsx', SCRIPT, `--out=${outPath}`, ...args], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  })
  const raw = fs.readFileSync(outPath, 'utf8')
  fs.unlinkSync(outPath)
  return JSON.parse(raw) as CcOutput
}

describe.skipIf(!hasArtifact)('discover-counter-claims — Phase 2.2', () => {
  let output: CcOutput

  beforeAll(() => {
    // Single default run — top-N=100, threshold=0.6, k=50, seed=42.
    output = runScript([])
  }, 120_000)

  it('produces a valid versioned output schema', () => {
    expect(output.version).toBe(1)
    expect(output.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(output.k).toBe(50)
    expect(output.threshold).toBe(0.6)
    expect(output.seed).toBe(42)
    expect(output.poolSize).toBeGreaterThan(500) // ≈1067 today
    expect(output.distinctSources).toBeGreaterThan(50)
    expect(output.candidateCount).toBe(output.candidates.length)
  })

  it('every candidate has full schema (cluster, sources, chunks, labels, cosine, score)', () => {
    for (const c of output.candidates.slice(0, 20)) {
      expect(c.cluster).toBeGreaterThanOrEqual(0)
      expect(c.source_a).toBeTruthy()
      expect(c.source_b).toBeTruthy()
      expect(c.source_a).not.toBe(c.source_b) // cross-source by construction
      expect(c.chunk_a).toBeTruthy()
      expect(c.chunk_b).toBeTruthy()
      expect(c.label_a).toBeTruthy()
      expect(c.label_b).toBeTruthy()
      expect(c.cosine).toBeGreaterThanOrEqual(0)
      expect(c.cosine).toBeLessThan(output.threshold)
      expect(c.score).toBeGreaterThan(0)
    }
  })

  it('candidates are sorted by descending score', () => {
    for (let i = 1; i < output.candidates.length; i++) {
      expect(output.candidates[i].score).toBeLessThanOrEqual(output.candidates[i - 1].score)
    }
  })

  it('is deterministic (same seed → identical output)', () => {
    const second = runScript([])
    expect(second.candidateCount).toBe(output.candidateCount)
    // First 10 chunk pairs must match exactly.
    for (let i = 0; i < Math.min(10, output.candidates.length); i++) {
      const a = output.candidates[i]
      const b = second.candidates[i]
      expect(b.chunk_a).toBe(a.chunk_a)
      expect(b.chunk_b).toBe(a.chunk_b)
      expect(b.score).toBeCloseTo(a.score, 5)
    }
  }, 120_000)

  it('reproduces a cross-Tier-1 disagreement (NSA ↔ ANSSI) at calibrated params', () => {
    // At default threshold=0.6, NSA and ANSSI chunks are "too similar = same
    // stance" and get filtered. At threshold=0.75 (and slightly coarser
    // k=30), the actual cosine of ~0.7 between an NSA advisory and an
    // ANSSI page lands inside the window → the algorithm surfaces it.
    const broad = runScript(['--threshold=0.75', '--k=30', '--top-n=20000'])
    const nsaAnssi = broad.candidates.filter((c) => {
      const a = c.source_a.toLowerCase()
      const b = c.source_b.toLowerCase()
      return (a.includes('nsa') && b.includes('anssi')) || (b.includes('nsa') && a.includes('anssi'))
    })
    expect(nsaAnssi.length).toBeGreaterThan(0)
  }, 120_000)

  it('produces a tractable candidate set (≥ 10 candidates at defaults)', () => {
    // Plan §2.2 acceptance signal: "≥ 10 candidate counter-claims".
    expect(output.candidateCount).toBeGreaterThanOrEqual(10)
  })

  it('honors --top-n cap', () => {
    const tight = runScript(['--top-n=5'])
    expect(tight.candidates.length).toBeLessThanOrEqual(5)
  }, 120_000)
})
