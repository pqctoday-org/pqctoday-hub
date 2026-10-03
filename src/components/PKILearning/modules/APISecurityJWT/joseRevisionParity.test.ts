// SPDX-License-Identifier: GPL-3.0-only
/**
 * Revision parity for the JOSE drafts the workshop implements.
 *
 * Each draft the workshop implements is pinned to one revision by the vector
 * file it is verified against. Code, Learn text, the workshop registry and the
 * Protocol Matrix must all name that same revision: a stale "-03" next to a
 * "-04" implementation tells a reader the tool follows a revision it does not.
 *
 * The drafts snapshot (public/data/jose-drafts-snapshot.json) is allowed to be
 * AHEAD of the implementation — that is upstream drift, reported on the
 * protocol-matrix refresh
 * — but never behind it: an implementation newer than the snapshot means the
 * snapshot was not refreshed when the implementation moved.
 *
 * To move a draft to a new revision: re-import its published vectors, update
 * the implementation, then every mention this test lists, in one change.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import compositeExamples from '@/data/acvp/composite-sigs-04-jose-examples.json'
import sphincsExamples from '@/data/acvp/cose-sphincs-plus-10-examples.json'
import hpkeExamples from '@/data/acvp/jose-hpke-pq-pqt-01-examples.json'
import snapshot from '../../../../../public/data/jose-drafts-snapshot.json'
import { HPKE_JWE_SPEC } from './hpkeJwe'

const ROOT = join(__dirname, '../../../../..')
const MODULE_DIR = __dirname

/** "draft-ietf-jose-pq-composite-sigs-04" → ["draft-ietf-jose-pq-composite-sigs", "04"] */
function split(spec: string): [string, string] {
  const m = /^(draft-[a-z0-9-]+?)-(\d{2})$/.exec(spec)
  if (!m) throw new Error(`not a revisioned draft name: ${spec}`)
  return [m[1], m[2]]
}

/** Implemented revision per draft, taken from the vector files themselves. */
const IMPLEMENTED = new Map<string, string>(
  [compositeExamples.spec, sphincsExamples.spec, hpkeExamples.spec, hpkeExamples.jwe_spec].map(
    split
  )
)

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return listFiles(p)
    return /\.(ts|tsx|md)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : []
  })
}

const SCANNED = [
  ...listFiles(MODULE_DIR),
  join(ROOT, 'src/data/pqcProtocolMatrix.ts'),
  join(ROOT, 'src/components/Playground/workshopRegistry.tsx'),
]

describe('JOSE draft revision parity', () => {
  it('the vector files pin the four implemented drafts', () => {
    expect([...IMPLEMENTED.keys()].sort()).toEqual([
      'draft-ietf-cose-sphincs-plus',
      'draft-ietf-jose-hpke-encrypt',
      'draft-ietf-jose-hpke-pq-pqt',
      'draft-ietf-jose-pq-composite-sigs',
    ])
  })

  it('hpkeJwe.ts names the revisions its vector file was published for', () => {
    expect(HPKE_JWE_SPEC.suites).toBe(hpkeExamples.spec)
    expect(HPKE_JWE_SPEC.jwe).toBe(hpkeExamples.jwe_spec)
  })

  it('code, Learn text, registry and Matrix name only the implemented revision', () => {
    const stale: string[] = []
    for (const file of SCANNED) {
      const text = readFileSync(file, 'utf8')
      for (const [draft, rev] of IMPLEMENTED) {
        const re = new RegExp(`${draft}-(\\d{2})(?!\\d)`, 'g')
        for (const m of text.matchAll(re)) {
          if (m[1] !== rev) stale.push(`${relative(ROOT, file)}: ${m[0]} (implemented: -${rev})`)
        }
      }
    }
    expect(stale).toEqual([])
  })

  it('the drafts snapshot is never behind the implementation', () => {
    const drafts = (snapshot as { drafts: Record<string, { current_version: string }> }).drafts
    for (const [draft, rev] of IMPLEMENTED) {
      const snap = drafts[draft]
      expect(snap, `${draft} missing from jose-drafts-snapshot.json`).toBeDefined()
      expect(Number(snap.current_version), draft).toBeGreaterThanOrEqual(Number(rev))
    }
  })
})
