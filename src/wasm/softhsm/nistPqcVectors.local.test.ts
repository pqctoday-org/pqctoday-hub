// SPDX-License-Identifier: GPL-3.0-only
//
// Proves the ML-KEM/ML-DSA/SLH-DSA vectors in src/data/acvp/{mlkem,mldsa,slhdsa_ctx}_test.json
// are genuinely accepted by the real Rust engine — not just structurally valid
// JSON. katRunner.ts's own unit tests mock both the wasm module and these JSON
// files (see katRunner.test.ts), so they cannot catch a vector that parses fine
// but fails real decapsulation/verification. This suite runs the actual C_*
// PKCS#11 calls against the real engine, the same way eddsaPhFlag.local.test.ts
// does for its regression.
//
// Context (2026-08-24 WS-6/H-3/H-4 remediation): the vectors these three files
// held before this commit did not byte-match any real NIST ACVP-Server sample
// case despite having NIST-shaped field names — see each file's own
// `_provenance` block. This suite is the proof that their replacements do not
// just look right, they verify against the real engine.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by `npm run
// test:local`, per the 2026-07-01 project directive that new suites are
// local-only. Real wasm engine, not mocks.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { hexToBytes } from '@/utils/dataInputUtils'
import mlkemTestVectors from '@/data/acvp/mlkem_test.json'
import mldsaTestVectors from '@/data/acvp/mldsa_test.json'
import mldsaExtendedTestVectors from '@/data/acvp/mldsa_extended_test.json'
import slhdsaCtxTestVectors from '@/data/acvp/slhdsa_ctx_test.json'
import sha256TestVectors from '@/data/acvp/sha256_test.json'
import sha384TestVectors from '@/data/acvp/sha384_test.json'
import sha512TestVectors from '@/data/acvp/sha512_test.json'
import sha3_256TestVectors from '@/data/acvp/sha3_256_test.json'
import sha3_512TestVectors from '@/data/acvp/sha3_512_test.json'

const SLH_DSA_CKP: Record<string, number> = {
  'SLH-DSA-SHA2-128s': SoftHSM.CKP_SLH_DSA_SHA2_128S,
  'SLH-DSA-SHA2-128f': SoftHSM.CKP_SLH_DSA_SHA2_128F,
  'SLH-DSA-SHA2-192s': SoftHSM.CKP_SLH_DSA_SHA2_192S,
  'SLH-DSA-SHA2-192f': SoftHSM.CKP_SLH_DSA_SHA2_192F,
  'SLH-DSA-SHA2-256s': SoftHSM.CKP_SLH_DSA_SHA2_256S,
  'SLH-DSA-SHA2-256f': SoftHSM.CKP_SLH_DSA_SHA2_256F,
  'SLH-DSA-SHAKE-128s': SoftHSM.CKP_SLH_DSA_SHAKE_128S,
  'SLH-DSA-SHAKE-128f': SoftHSM.CKP_SLH_DSA_SHAKE_128F,
  'SLH-DSA-SHAKE-192s': SoftHSM.CKP_SLH_DSA_SHAKE_192S,
  'SLH-DSA-SHAKE-192f': SoftHSM.CKP_SLH_DSA_SHAKE_192F,
  'SLH-DSA-SHAKE-256s': SoftHSM.CKP_SLH_DSA_SHAKE_256S,
  'SLH-DSA-SHAKE-256f': SoftHSM.CKP_SLH_DSA_SHAKE_256F,
}

describe('NIST ACVP-Server vectors verify against the real Rust engine', () => {
  let M: SoftHSMModule
  let session: number

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'NIST PQC Vector Token')
    session = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
  })

  describe.each([512, 768, 1024] as const)('ML-KEM-%i', (variant) => {
    it('decapsulates the NIST vector to the expected shared secret', () => {
      const group = mlkemTestVectors.testGroups.find((g) => g.parameterSet === `ML-KEM-${variant}`)
      expect(group).toBeDefined()
      const test = group!.tests[0]

      const privHandle = SoftHSM.hsm_importMLKEMPrivateKey(M, session, variant, hexToBytes(test.sk))
      const secretHandle = SoftHSM.hsm_decapsulate(
        M,
        session,
        privHandle,
        hexToBytes(test.ct),
        variant
      )
      const recovered = SoftHSM.hsm_extractKeyValue(M, session, secretHandle)
      expect(Buffer.from(recovered).toString('hex')).toBe(test.ss.toLowerCase())
    })
  })

  describe.each([44, 65, 87] as const)('ML-DSA-%i', (variant) => {
    it('verifies the NIST reference signature', () => {
      const group = mldsaTestVectors.testGroups.find((g) => g.parameterSet === `ML-DSA-${variant}`)
      expect(group).toBeDefined()
      const test = group!.tests[0]

      const pubHandle = SoftHSM.hsm_importMLDSAPublicKey(M, session, variant, hexToBytes(test.pk))
      const isValid = SoftHSM.hsm_verifyBytes(
        M,
        session,
        pubHandle,
        hexToBytes(test.msg),
        hexToBytes(test.sig)
      )
      expect(isValid).toBe(true)
    })
  })

  const MLDSA_VARIANT: Record<string, 44 | 65 | 87> = {
    'ML-DSA-44': 44,
    'ML-DSA-65': 65,
    'ML-DSA-87': 87,
  }

  describe.each(Object.keys(mldsaExtendedTestVectors.context))('ML-DSA context: %s', (paramSet) => {
    it('verifies the NIST vector with a non-empty context string', () => {
      const tv = (
        mldsaExtendedTestVectors.context as Record<
          string,
          (typeof mldsaExtendedTestVectors.context)['ML-DSA-44']
        >
      )[paramSet]
      const pubHandle = SoftHSM.hsm_importMLDSAPublicKey(
        M,
        session,
        MLDSA_VARIANT[paramSet],
        hexToBytes(tv.pk)
      )
      const isValid = SoftHSM.hsm_verifyBytesMLDSA(
        M,
        session,
        pubHandle,
        hexToBytes(tv.message),
        hexToBytes(tv.signature),
        { context: hexToBytes(tv.context) }
      )
      expect(isValid).toBe(true)
    })
  })

  describe.each(Object.keys(mldsaExtendedTestVectors.preHash))(
    'ML-DSA pre-hash: %s',
    (paramSet) => {
      it('verifies the NIST HashML-DSA vector', () => {
        const tv = (
          mldsaExtendedTestVectors.preHash as Record<
            string,
            (typeof mldsaExtendedTestVectors.preHash)['ML-DSA-44']
          >
        )[paramSet]
        const pubHandle = SoftHSM.hsm_importMLDSAPublicKey(
          M,
          session,
          MLDSA_VARIANT[paramSet],
          hexToBytes(tv.pk)
        )
        const isValid = SoftHSM.hsm_verifyBytesMLDSA(
          M,
          session,
          pubHandle,
          hexToBytes(tv.message),
          hexToBytes(tv.signature),
          {
            context: tv.context ? hexToBytes(tv.context) : undefined,
            preHash: tv.hashAlg as SoftHSM.MLDSAPreHash,
          }
        )
        expect(isValid).toBe(true)
      })
    }
  )

  describe.each(Object.keys(SLH_DSA_CKP))('%s', (paramSet) => {
    it('verifies the NIST-derived signature (sigVer)', () => {
      const tv = (
        slhdsaCtxTestVectors.sigVer as Record<
          string,
          (typeof slhdsaCtxTestVectors.sigVer)['SLH-DSA-SHA2-128f']
        >
      )[paramSet]
      expect(tv).toBeDefined()

      const pubHandle = SoftHSM.hsm_importSLHDSAPublicKey(
        M,
        session,
        SLH_DSA_CKP[paramSet],
        hexToBytes(tv.pk)
      )
      const isValid = SoftHSM.hsm_slhdsaVerifyBytes(
        M,
        session,
        pubHandle,
        hexToBytes(tv.message),
        hexToBytes(tv.signature),
        { context: hexToBytes(tv.context) }
      )
      expect(isValid).toBe(tv.testPassed)
    })
  })

  describe.each([
    ['SHA-256', sha256TestVectors, SoftHSM.CKM_SHA256],
    ['SHA-384', sha384TestVectors, SoftHSM.CKM_SHA384],
    ['SHA-512', sha512TestVectors, SoftHSM.CKM_SHA512],
    ['SHA3-256', sha3_256TestVectors, SoftHSM.CKM_SHA3_256],
    ['SHA3-512', sha3_512TestVectors, SoftHSM.CKM_SHA3_512],
  ] as const)('%s', (_label, vectors, mechType) => {
    it.each(vectors.testGroups[0].tests.map((t) => [t.tcId, t] as const))(
      'tcId %i digests to the NIST expected value',
      (_tcId, test) => {
        const computed = SoftHSM.hsm_digest(M, session, hexToBytes(test.msg), mechType)
        expect(Buffer.from(computed).toString('hex')).toBe(test.md.toLowerCase())
      }
    )
  })
})
