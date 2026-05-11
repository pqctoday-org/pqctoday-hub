// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Tests for Phase 2.5 propose-xref-edges generator.
 *
 * Strategy: run the script as a subprocess against the real corpus +
 * embeddings. Validate output shape, filter semantics, and threshold
 * behaviour. Self-skips when artifact is absent.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const REPO_ROOT = process.cwd()
const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')
const CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
const SCRIPT = path.join(REPO_ROOT, 'scripts/propose-xref-edges.ts')
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
const hasArtifact = fs.existsSync(META_PATH) && fs.existsSync(BIN_PATH) && isCorpusParseable()
// `propose-xref-edges.ts` has an explicit "local-only by policy" guard: it
// exits non-zero when run in a CI environment (process.env.CI is set), so
// these tests — which spawn the script via execFileSync — must skip on CI.
// Output is for admin-portal SME review, run on a maintainer machine.
const isCI = !!process.env.CI
const shouldRun = hasArtifact && !isCI

interface CandidateOutput {
  version: 1
  generatedAt: string
  threshold: number
  maxExisting: number
  sourceXrefFile: string
  candidateCount: number
  candidates: Array<{
    resource_type: string
    resource_id: string
    source_id: string
    score: number
    resource_label: string
    source_label: string
  }>
}

function runScript(args: string[] = []): CandidateOutput {
  const outPath = `/tmp/xref-candidates-test-${Date.now()}.json`
  execFileSync('npx', ['tsx', SCRIPT, `--out=${outPath}`, ...args], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  })
  const raw = fs.readFileSync(outPath, 'utf8')
  fs.unlinkSync(outPath)
  return JSON.parse(raw) as CandidateOutput
}

describe.skipIf(!shouldRun)('propose-xref-edges — Phase 2.5 generator', () => {
  let output: CandidateOutput

  beforeAll(() => {
    // One full run, cached for all tests in this describe (it's slow).
    output = runScript(['--top-k=3'])
  }, 240_000)

  it('produces a valid versioned output schema', () => {
    expect(output.version).toBe(1)
    expect(output.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(output.threshold).toBeGreaterThan(0)
    expect(output.maxExisting).toBeGreaterThan(0)
    expect(output.sourceXrefFile).toMatch(/trusted_source_xref_/)
    expect(typeof output.candidateCount).toBe('number')
    expect(output.candidateCount).toBe(output.candidates.length)
  })

  it('candidates have full schema (type, id, source_id, score, labels)', () => {
    if (output.candidates.length === 0) return // dataset may produce zero
    for (const c of output.candidates.slice(0, 20)) {
      expect(c.resource_type).toBeTruthy()
      expect(c.resource_id).toBeTruthy()
      expect(c.source_id).toBeTruthy()
      expect(c.score).toBeGreaterThanOrEqual(output.threshold)
      expect(c.score).toBeLessThanOrEqual(1.0001)
      expect(c.resource_label).toBeTruthy()
      expect(c.source_label).toBeTruthy()
    }
  })

  it('candidates are sorted by descending score', () => {
    for (let i = 1; i < output.candidates.length; i++) {
      expect(output.candidates[i].score).toBeLessThanOrEqual(output.candidates[i - 1].score)
    }
  })

  it('no candidate duplicates an existing (resource_type, resource_id, source_id) edge', () => {
    const xrefPath = path.join(REPO_ROOT, output.sourceXrefFile)
    const raw = fs.readFileSync(xrefPath, 'utf8')
    const existing = Papa.parse(raw, { header: true, skipEmptyLines: true }).data as Array<{
      resource_type: string
      resource_id: string
      source_id: string
    }>
    const existingSet = new Set(
      existing.map((r) => `${r.resource_type}|${r.resource_id}|${r.source_id}`)
    )
    const collisions: string[] = []
    for (const c of output.candidates) {
      const key = `${c.resource_type}|${c.resource_id}|${c.source_id}`
      if (existingSet.has(key)) collisions.push(key)
    }
    expect(collisions, `${collisions.length} candidate collisions with existing xref`).toEqual([])
  })

  it('higher threshold produces fewer candidates', () => {
    // Re-run with a stricter threshold; compare counts.
    const strict = runScript(['--threshold=0.9', '--top-k=3'])
    expect(strict.candidates.length).toBeLessThanOrEqual(output.candidates.length)
  }, 240_000)

  it('respects --max-existing filter — saturated resources excluded', () => {
    // Re-run with maxExisting=0 (no resource accepted) → zero candidates.
    const noResources = runScript(['--max-existing=0', '--top-k=3'])
    expect(noResources.candidates.length).toBe(0)
  }, 240_000)
})
