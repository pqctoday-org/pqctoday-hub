// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * ACVP Known Answer Tests for the primitives that back our JWS/JWE adapter.
 *
 * Source: src/data/acvp/{mldsa,mlkem}_test.json — NIST ACVP-format vectors
 * already vendored in the repo and used by src/utils/katRunner.ts. These tests
 * replay them against @noble/post-quantum, the primitive @/jwtUtils.ts calls
 * into when backend === 'noble'.
 *
 * If a future @noble release breaks FIPS 203/204 compliance, or someone swaps
 * the import for a non-compliant fork, this file will fail loudly in CI.
 */
import { describe, expect, it } from 'vitest'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { ml_kem512, ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
import mldsaVectors from '@/data/acvp/mldsa_test.json'
import mlkemVectors from '@/data/acvp/mlkem_test.json'

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function bytesEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

interface MldsaTestGroup {
  tgId: number
  parameterSet: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'
  tests: { tcId: number; pk: string; sk: string; msg: string; sig: string }[]
}

interface MlkemTestGroup {
  tgId: number
  parameterSet: 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'
  tests: { tcId: number; pk: string; sk: string; ct: string; ss: string }[]
}

const MLDSA_SUITES = {
  'ML-DSA-44': ml_dsa44,
  'ML-DSA-65': ml_dsa65,
  'ML-DSA-87': ml_dsa87,
} as const

const MLKEM_SUITES = {
  'ML-KEM-512': ml_kem512,
  'ML-KEM-768': ml_kem768,
  'ML-KEM-1024': ml_kem1024,
} as const

describe('FIPS 204 — NIST ACVP ML-DSA vectors', () => {
  for (const g of (mldsaVectors as { testGroups: MldsaTestGroup[] }).testGroups) {
    for (const t of g.tests) {
      it(`${g.parameterSet} tc${t.tcId}: NIST-provided signature verifies under our primitive`, () => {
        const suite = MLDSA_SUITES[g.parameterSet]
        const pk = hexToBytes(t.pk)
        const msg = hexToBytes(t.msg)
        const expectedSig = hexToBytes(t.sig)
        expect(suite.verify(expectedSig, msg, pk)).toBe(true)
      })

      it(`${g.parameterSet} tc${t.tcId}: sign(NIST sk, NIST msg) verifies under NIST pk (hedged)`, () => {
        const suite = MLDSA_SUITES[g.parameterSet]
        const pk = hexToBytes(t.pk)
        const sk = hexToBytes(t.sk)
        const msg = hexToBytes(t.msg)
        const sig = suite.sign(msg, sk)
        expect(suite.verify(sig, msg, pk)).toBe(true)
      })
    }
  }
})

describe('FIPS 203 — NIST ACVP ML-KEM vectors', () => {
  for (const g of (mlkemVectors as { testGroups: MlkemTestGroup[] }).testGroups) {
    for (const t of g.tests) {
      it(`${g.parameterSet} tc${t.tcId}: decapsulate(ct, sk) === NIST shared secret`, () => {
        const suite = MLKEM_SUITES[g.parameterSet]
        const sk = hexToBytes(t.sk)
        const ct = hexToBytes(t.ct)
        const expectedSs = hexToBytes(t.ss)
        const ss = suite.decapsulate(ct, sk)
        expect(bytesEq(ss, expectedSs)).toBe(true)
      })
    }
  }
})
