// SPDX-License-Identifier: GPL-3.0-only
//
// Proves the four src/data/acvp/slhdsa_prehash_* files are genuinely exercised
// by the real Rust engine — the same job nistPqcVectors.local.test.ts does for
// the pure SLH-DSA/ML-DSA/ML-KEM vectors. Three things are asserted, and the
// third is the one that matters: that these rows are NOT vacuous.
//
//  1. Positive: all 120 (CKM_HASH_SLH_DSA_<hash> x parameter set) pairs
//     deterministically sign to the upstream signature byte for byte
//     (CKH_DETERMINISTIC_REQUIRED, upstream context), and the upstream
//     signature verifies. Ten mechanisms x twelve parameter sets, ~75 s.
//  2. Negative: every one of the 22 upstream sigVer negatives is rejected with
//     the exact CK_RV its `reason` implies — CKR_SIGNATURE_LEN_RANGE for a
//     too-small/too-large signature (PKCS#11 v3.2 §5.1.6), otherwise
//     CKR_SIGNATURE_INVALID — and the positives return CKR_OK.
//  3. Non-vacuity: a positive case with ONE byte of its expected signature
//     perturbed must FAIL the byte-match and must FAIL verification, and a
//     negative case graded against CKR_OK (i.e. an engine that accepted it)
//     must FAIL. The perturbation is applied to an in-memory copy; no vector
//     file is edited.
//
// Venue: `*.local.test.ts` — excluded from the CI vitest globs, run by
// `npm run test:local`, per the 2026-07-01 directive. Real wasm engine, not
// mocks. The Rust engine only; the C++ engine runs the same rows through
// sections/slhdsaPreHash.ts in the browser workbench.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  CKK_SLH_DSA,
  CKH_DETERMINISTIC_REQUIRED,
  CKM_HASH_SLH_DSA_SHA224,
  CKM_HASH_SLH_DSA_SHA256,
  CKM_HASH_SLH_DSA_SHA384,
  CKM_HASH_SLH_DSA_SHA512,
  CKM_HASH_SLH_DSA_SHA3_224,
  CKM_HASH_SLH_DSA_SHA3_256,
  CKM_HASH_SLH_DSA_SHA3_384,
  CKM_HASH_SLH_DSA_SHA3_512,
  CKM_HASH_SLH_DSA_SHAKE128,
  CKM_HASH_SLH_DSA_SHAKE256,
} from '@/wasm/softhsm/constants'
import sgSha2 from '@/data/acvp/slhdsa_prehash_siggen_sha2_test.json'
import sgShake from '@/data/acvp/slhdsa_prehash_siggen_shake_test.json'
import svSha2 from '@/data/acvp/slhdsa_prehash_sigver_sha2_test.json'
import svShake from '@/data/acvp/slhdsa_prehash_sigver_shake_test.json'

const CKR_OK = 0x00000000
const CKR_SIGNATURE_INVALID = 0x000000c0
const CKR_SIGNATURE_LEN_RANGE = 0x000000c1

const HASH_MECH: Record<string, number> = {
  'SHA2-224': CKM_HASH_SLH_DSA_SHA224,
  'SHA2-256': CKM_HASH_SLH_DSA_SHA256,
  'SHA2-384': CKM_HASH_SLH_DSA_SHA384,
  'SHA2-512': CKM_HASH_SLH_DSA_SHA512,
  'SHA3-224': CKM_HASH_SLH_DSA_SHA3_224,
  'SHA3-256': CKM_HASH_SLH_DSA_SHA3_256,
  'SHA3-384': CKM_HASH_SLH_DSA_SHA3_384,
  'SHA3-512': CKM_HASH_SLH_DSA_SHA3_512,
  'SHAKE-128': CKM_HASH_SLH_DSA_SHAKE128,
  'SHAKE-256': CKM_HASH_SLH_DSA_SHAKE256,
}
const CKP: Record<string, number> = {
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

interface SgCase {
  tcId: number
  hashAlg: string
  sk: string
  pk: string
  message: string
  context: string
  signature: string
}
interface SvCase {
  tcId: number
  testPassed: boolean
  reason: string
  hashAlg: string
  pk: string
  message: string
  context: string
  signature: string
}
interface Grp<C> {
  tgId: number
  parameterSet: string
  tests: C[]
}

const sgGroups = [
  ...(sgSha2.testGroups as unknown as Grp<SgCase>[]),
  ...(sgShake.testGroups as unknown as Grp<SgCase>[]),
]
const svGroups = [
  ...(svSha2.testGroups as unknown as Grp<SvCase>[]),
  ...(svShake.testGroups as unknown as Grp<SvCase>[]),
]

/** All 120 (mechanism x parameter set) pairs the two sigGen files carry. */
const sgAll = sgGroups.flatMap((g) => g.tests.map((t) => [g.parameterSet, g.tgId, t] as const))
const svAll = svGroups.flatMap((g) => g.tests.map((t) => [g.parameterSet, g.tgId, t] as const))

const expectedRvFor = (t: SvCase) =>
  t.testPassed
    ? CKR_OK
    : /invalid signature - too (small|large)/.test(t.reason)
      ? CKR_SIGNATURE_LEN_RANGE
      : CKR_SIGNATURE_INVALID

const hex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

describe('SLH-DSA pre-hash NIST ACVP vectors against the real Rust engine', () => {
  let M: SoftHSMModule
  let session: number

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'SLH-DSA preHash Token')
    session = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
  })

  /** Import the upstream sk as a session private key; caller destroys. */
  const importPriv = (ps: string, sk: Uint8Array) => {
    const skPtr = SoftHSM.writeBytes(M, sk)
    const tpl = SoftHSM.buildTemplate(M, [
      { type: SoftHSM.CKA_CLASS, ulongVal: SoftHSM.CKO_PRIVATE_KEY },
      { type: SoftHSM.CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
      { type: SoftHSM.CKA_TOKEN, boolVal: false },
      { type: SoftHSM.CKA_PRIVATE, boolVal: true },
      { type: SoftHSM.CKA_SENSITIVE, boolVal: true },
      { type: SoftHSM.CKA_SIGN, boolVal: true },
      { type: SoftHSM.CKA_PARAMETER_SET, ulongVal: CKP[ps] },
      { type: SoftHSM.CKA_VALUE, bytesPtr: skPtr, bytesLen: sk.length },
    ])
    const hPtr = M._malloc(4)
    M.setValue(hPtr, 0, 'i32')
    try {
      const rv = M._C_CreateObject(session, tpl.ptr, 8, hPtr) >>> 0
      expect(rv).toBe(CKR_OK)
      return M.getValue(hPtr, 'i32') >>> 0
    } finally {
      SoftHSM.freeTemplate(M, tpl, 8)
      M._free(skPtr)
      M._free(hPtr)
    }
  }

  /** CK_MECHANISM + CK_SIGN_ADDITIONAL_CONTEXT{hedgeVariant, context}. */
  const allocMech = (mechType: number, hedge: number, context: Uint8Array) => {
    const allocs: number[] = []
    const mech = M._malloc(12)
    allocs.push(mech)
    M.setValue(mech, mechType, 'i32')
    const p = M._malloc(12)
    allocs.push(p)
    M.setValue(p, hedge, 'i32')
    if (context.length > 0) {
      const c = SoftHSM.writeBytes(M, context)
      allocs.push(c)
      M.setValue(p + 4, c, 'i32')
      M.setValue(p + 8, context.length, 'i32')
    } else {
      M.setValue(p + 4, 0, 'i32')
      M.setValue(p + 8, 0, 'i32')
    }
    M.setValue(mech + 4, p, 'i32')
    M.setValue(mech + 8, 12, 'i32')
    return { mech, allocs }
  }

  const signDet = (priv: number, mechType: number, msg: Uint8Array, context: Uint8Array) => {
    const { mech, allocs } = allocMech(mechType, CKH_DETERMINISTIC_REQUIRED, context)
    const dp = SoftHSM.writeBytes(M, msg)
    const lenPtr = M._malloc(4)
    let sp = 0
    try {
      expect(M._C_SignInit(session, mech, priv) >>> 0).toBe(CKR_OK)
      M.setValue(lenPtr, 0, 'i32')
      expect(M._C_Sign(session, dp, msg.length, 0, lenPtr) >>> 0).toBe(CKR_OK)
      const len = M.getValue(lenPtr, 'i32') >>> 0
      sp = M._malloc(Math.max(1, len))
      expect(M._C_Sign(session, dp, msg.length, sp, lenPtr) >>> 0).toBe(CKR_OK)
      return M.HEAPU8.slice(sp, sp + (M.getValue(lenPtr, 'i32') >>> 0))
    } finally {
      allocs.forEach((a) => M._free(a))
      M._free(dp)
      M._free(lenPtr)
      if (sp) M._free(sp)
    }
  }

  const verify = (
    pub: number,
    mechType: number,
    msg: Uint8Array,
    sig: Uint8Array,
    context: Uint8Array
  ) => {
    const { mech, allocs } = allocMech(mechType, CKH_DETERMINISTIC_REQUIRED, context)
    const dp = SoftHSM.writeBytes(M, msg)
    const sp = SoftHSM.writeBytes(M, sig)
    try {
      const initRv = M._C_VerifyInit(session, mech, pub) >>> 0
      if (initRv !== CKR_OK) return initRv
      return M._C_Verify(session, dp, msg.length, sp, sig.length) >>> 0
    } finally {
      allocs.forEach((a) => M._free(a))
      M._free(dp)
      M._free(sp)
    }
  }

  // ── 1. positives ──────────────────────────────────────────────────────────
  it('covers all ten CKM_HASH_SLH_DSA_<hash> mechanisms in the fast subset', () => {
    expect(new Set(sgAll.map(([, , t]) => t.hashAlg))).toEqual(new Set(Object.keys(HASH_MECH)))
    expect(sgAll).toHaveLength(120)
  })

  it.each(sgAll.map(([ps, tg, t]) => [`${ps} ${t.hashAlg} tg${tg}/tc${t.tcId}`, ps, t] as const))(
    'sigGen %s: deterministic signature is byte-equal to NIST, and NIST signature verifies',
    (_label, ps, t) => {
      const mech = HASH_MECH[t.hashAlg]
      const msg = hexToBytes(t.message)
      const ctx = hexToBytes(t.context)
      const pub = SoftHSM.hsm_importSLHDSAPublicKey(M, session, CKP[ps], hexToBytes(t.pk))
      const priv = importPriv(ps, hexToBytes(t.sk))
      try {
        expect(hex(signDet(priv, mech, msg, ctx))).toBe(t.signature.toLowerCase())
        expect(verify(pub, mech, msg, hexToBytes(t.signature), ctx)).toBe(CKR_OK)
      } finally {
        M._C_DestroyObject(session, pub)
        M._C_DestroyObject(session, priv)
      }
    }
  )

  // ── 2. negatives ──────────────────────────────────────────────────────────
  it('carries 22 upstream negatives across all six upstream reasons', () => {
    const negs = svAll.filter(([, , t]) => !t.testPassed)
    expect(negs).toHaveLength(22)
    expect(new Set(negs.map(([, , t]) => t.reason))).toEqual(
      new Set([
        'modified message',
        'modified signature - R',
        'modified signature - SIGHT',
        'modified signature - SIGFORS',
        'invalid signature - too small',
        'invalid signature - too large',
      ])
    )
  })

  it.each(
    svAll.map(
      ([ps, tg, t]) => [`${ps} ${t.hashAlg} tg${tg}/tc${t.tcId} (${t.reason})`, ps, t] as const
    )
  )('sigVer %s: engine returns the CK_RV the upstream disposition implies', (_label, ps, t) => {
    const pub = SoftHSM.hsm_importSLHDSAPublicKey(M, session, CKP[ps], hexToBytes(t.pk))
    try {
      expect(
        verify(
          pub,
          HASH_MECH[t.hashAlg],
          hexToBytes(t.message),
          hexToBytes(t.signature),
          hexToBytes(t.context)
        )
      ).toBe(expectedRvFor(t))
    } finally {
      M._C_DestroyObject(session, pub)
    }
  })

  // ── 3. non-vacuity ────────────────────────────────────────────────────────
  describe('non-vacuity (sabotage of in-memory COPIES — no vector file is edited)', () => {
    it('a positive case whose expected signature is perturbed by one byte FAILS both assertions', () => {
      const [ps, , t] = sgAll[0]
      const mech = HASH_MECH[t.hashAlg]
      const msg = hexToBytes(t.message)
      const ctx = hexToBytes(t.context)
      // COPY, then flip one bit of the last byte of the expected signature.
      const sabotaged = hexToBytes(t.signature)
      sabotaged[sabotaged.length - 1] ^= 0x01
      expect(hex(sabotaged)).not.toBe(t.signature.toLowerCase())

      const pub = SoftHSM.hsm_importSLHDSAPublicKey(M, session, CKP[ps], hexToBytes(t.pk))
      const priv = importPriv(ps, hexToBytes(t.sk))
      try {
        // (a) the byte-match assertion the row makes would fail
        expect(hex(signDet(priv, mech, msg, ctx))).not.toBe(hex(sabotaged))
        // (b) the verify assertion the row makes would fail
        expect(verify(pub, mech, msg, sabotaged, ctx)).not.toBe(CKR_OK)
      } finally {
        M._C_DestroyObject(session, pub)
        M._C_DestroyObject(session, priv)
      }
    })

    it('every negative case FAILS when graded as if the engine had accepted it', () => {
      for (const [ps, , t] of svAll) {
        if (t.testPassed) continue
        const pub = SoftHSM.hsm_importSLHDSAPublicKey(M, session, CKP[ps], hexToBytes(t.pk))
        try {
          const rv = verify(
            pub,
            HASH_MECH[t.hashAlg],
            hexToBytes(t.message),
            hexToBytes(t.signature),
            hexToBytes(t.context)
          )
          // Sabotaged grading: expect CKR_OK (an engine that accepted the bad
          // signature). The real return must differ, so the row is not vacuous.
          expect(rv).not.toBe(CKR_OK)
        } finally {
          M._C_DestroyObject(session, pub)
        }
      }
    })

    it('the length-labelled negatives really carry a wrong-length signature', () => {
      const lens = svAll.filter(([, , t]) => /too (small|large)/.test(t.reason))
      expect(lens.length).toBeGreaterThan(0)
      for (const [, , t] of lens) {
        const got = t.signature.length / 2
        // 7856 B is the FIPS 205 Table 2 length for both 128s parameter sets.
        if (/too small/.test(t.reason)) expect(got).toBeLessThan(7856)
        else expect(got).toBeGreaterThan(7856)
      }
    })
  })
})
