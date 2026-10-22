// SPDX-License-Identifier: AGPL-3.0-only
//
// The IETF LAMPS composite test vectors are vendored twice: here (for the
// Build test bench and the v3.3 draft checks) and in the pqctoday-hsm engine
// repository (rust/kat/pkcs11-v33/PROVENANCE.md), which runs the same files
// in its own tests. No copy may drift (plan V7). This test re-hashes the
// hub copies and compares them with:
//   1. the sha256 the engine repository's PROVENANCE.md records — copied
//      below as constants, so a change on either side fails here;
//   2. this directory's own _provenance.json.
// It also checks coverage: every one of the 30 CKP_COMP_* sets has exactly
// one vector, matched by the draft algorithm name.
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import provenance from './_provenance.json'
import { COMPOSITE_KEM_SETS, COMPOSITE_SIG_SETS } from '@/wasm/softhsm/compositeParams'

/** sha256 values recorded in pqctoday-hsm rust/kat/pkcs11-v33/PROVENANCE.md
 * (engine commit 9445d030, 2026-10-21). Update only together with that file. */
const ENGINE_PROVENANCE_SHA256 = {
  'composite-kem/testvectors.json':
    '1b8d80f3ce623f368466eda44820f8b82ca67c9955e213d212c997137ef9ff24',
  'composite-sig/testvectors.json':
    'a60f697f9fd94c3cd5e4501a40c4396d9a9ffc7cf0f8a1ddd87dedbb46a7abf0',
} as const

/** Upstream commits recorded in the same file. */
const ENGINE_PROVENANCE_COMMIT = {
  'composite-kem/testvectors.json': 'd77e75420034d826e14cbef0b779986511f114e9',
  'composite-sig/testvectors.json': 'f0627ab34acfe1aee0abce4bee91ed2b577eab76',
} as const

const DIR = path.resolve(process.cwd(), 'src/data/pkcs11-v33')
const sha256 = (rel: string) =>
  createHash('sha256')
    .update(readFileSync(path.join(DIR, rel)))
    .digest('hex')

type Files = keyof typeof ENGINE_PROVENANCE_SHA256

describe('PKCS#11 v3.3 composite vectors: provenance', () => {
  for (const rel of Object.keys(ENGINE_PROVENANCE_SHA256) as Files[]) {
    it(`${rel} is byte-identical to the engine repository's pinned copy`, () => {
      expect(sha256(rel)).toBe(ENGINE_PROVENANCE_SHA256[rel])
    })

    it(`${rel} matches _provenance.json (hash, size, commit)`, () => {
      // eslint-disable-next-line security/detect-object-injection -- keys from a const literal
      const rec = provenance.files[rel]
      expect(rec.sha256).toBe(ENGINE_PROVENANCE_SHA256[rel])
      expect(rec.source_commit).toBe(ENGINE_PROVENANCE_COMMIT[rel])
      expect(rec.source_url).toContain(ENGINE_PROVENANCE_COMMIT[rel])
      expect(readFileSync(path.join(DIR, rel)).length).toBe(rec.size_bytes)
    })
  }
})

describe('PKCS#11 v3.3 composite vectors: coverage of all 30 sets', () => {
  const kem = JSON.parse(readFileSync(path.join(DIR, 'composite-kem/testvectors.json'), 'utf8'))
  const sig = JSON.parse(readFileSync(path.join(DIR, 'composite-sig/testvectors.json'), 'utf8'))

  it('every CKP_COMP_KEM_* set has exactly one KEM vector', () => {
    for (const s of COMPOSITE_KEM_SETS) {
      const n = kem.tests.filter((t: { tcId: string }) => t.tcId === s.draftName).length
      expect(n, s.ckpName).toBe(1)
    }
  })

  it('every CKP_COMP_SIG_* set has exactly one signature vector', () => {
    for (const s of COMPOSITE_SIG_SETS) {
      const n = sig.tests.filter((t: { tcId: string }) => t.tcId === s.draftName).length
      expect(n, s.ckpName).toBe(1)
    }
  })

  it('vector field shapes: KEM has dk/c/k, signatures have pk/s/sWithContext over shared m, ctx', () => {
    for (const t of kem.tests) {
      for (const f of ['tcId', 'ek', 'dk', 'c', 'k']) expect(t[f], `${t.tcId}.${f}`).toBeTruthy()
    }
    expect(typeof sig.m).toBe('string')
    expect(typeof sig.ctx).toBe('string')
    for (const t of sig.tests) {
      for (const f of ['tcId', 'pk', 's', 'sWithContext'])
        expect(t[f], `${t.tcId}.${f}`).toBeTruthy()
    }
  })

  it('composite public key sizes in the vectors equal the table (non-RSA sets are exact)', () => {
    const len = (b64: string) => Buffer.from(b64, 'base64').length
    for (const s of COMPOSITE_KEM_SETS) {
      const t = kem.tests.find((x: { tcId: string }) => x.tcId === s.draftName)
      if (s.publicKeyIsMax) expect(len(t.ek)).toBeLessThanOrEqual(s.publicKeyBytes)
      else expect(len(t.ek), s.ckpName).toBe(s.publicKeyBytes)
      expect(len(t.k)).toBe(32)
      expect(len(t.c), s.ckpName).toBe(s.ciphertextBytes)
    }
    for (const s of COMPOSITE_SIG_SETS) {
      const t = sig.tests.find((x: { tcId: string }) => x.tcId === s.draftName)
      if (s.publicKeyIsMax) expect(len(t.pk)).toBeLessThanOrEqual(s.publicKeyBytes)
      else expect(len(t.pk), s.ckpName).toBe(s.publicKeyBytes)
    }
  })
})
