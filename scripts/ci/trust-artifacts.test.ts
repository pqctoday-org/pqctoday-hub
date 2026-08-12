// SPDX-License-Identifier: GPL-3.0-only
/**
 * trust-artifacts.test.ts — guards the shared signed-artifact registry
 * (remediation plan item 3.1, 2026-08-10).
 *
 * The list used to exist twice: once in the private signer
 * (`scripts/attestation/artifacts.ts`) and once, hand-mirrored, inside the
 * public verifier. Two copies of "what we attest" is one copy too many — the
 * verifier's own header said so. These tests pin the single-source property
 * and the thing that makes it useful: every required artifact actually having
 * a signature on disk.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = process.cwd()
const REGISTRY = path.join(REPO_ROOT, 'scripts/ci/trust-artifacts.json')

interface Entry {
  path: string
  required: boolean
  label: string
}

function entries(): Entry[] {
  const parsed = JSON.parse(readFileSync(REGISTRY, 'utf-8')) as { artifacts: Entry[] }
  return parsed.artifacts
}

describe('trust-artifacts registry', () => {
  it('declares a non-empty, well-formed list', () => {
    const list = entries()
    expect(list.length).toBeGreaterThan(0)
    for (const e of list) {
      expect(typeof e.path).toBe('string')
      expect(typeof e.label).toBe('string')
      expect(typeof e.required).toBe('boolean')
      expect(e.path.startsWith('public/')).toBe(true)
    }
  })

  it('has a signature on disk for every required artifact', () => {
    // The failure this catches: an artifact appended to the registry without a
    // re-sign. CI's verifier exits 2 on it, but only after a push — here it is
    // a red test locally, before the commit.
    const missing = entries()
      .filter((e) => e.required)
      .filter((e) => existsSync(path.join(REPO_ROOT, e.path)))
      .filter((e) => !existsSync(path.join(REPO_ROOT, e.path + '.sig')))
      .map((e) => e.path)
    expect(missing).toEqual([])
  })

  it('attests the embedding index, not only the corpus it was built from', () => {
    // Signing rag-corpus.json alone attested the text an answer quotes while
    // leaving the vectors that decide WHICH text gets quoted unsigned.
    const paths = entries().map((e) => e.path)
    expect(paths).toContain('public/data/embeddings.bin')
    expect(paths).toContain('public/data/embeddings-meta.json')
  })

  it('is the only place the artifact list is written down', () => {
    // A future hand-mirrored copy would reintroduce exactly the drift this
    // registry exists to end, so the verifier must not carry inline entries.
    const verifier = readFileSync(
      path.join(REPO_ROOT, 'scripts/ci/verify-attestations.ts'),
      'utf-8'
    )
    const inlineEntries = verifier.match(/path:\s*'public\/data\//g) ?? []
    expect(inlineEntries).toEqual([])
    expect(verifier).toContain('trust-artifacts.json')
  })
})
