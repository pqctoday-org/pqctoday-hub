// SPDX-License-Identifier: AGPL-3.0-only
//
// NIST ACVP groups that need a value standard PKCS#11 cannot carry: the random
// value an operation would otherwise draw, or the FIPS 205 internal message
// interface. This HSM accepts those values as OPTIONAL TEST INPUTS outside the
// PKCS#11 standard (left out, behaviour is the standard's, byte for byte):
//
//  - ML-KEM encapsulation: CKM_ML_KEM's pParameter is m (32 bytes, FIPS 203
//    Alg 17 ML-KEM.Encaps_internal). C_EncapsulateKey then returns NIST's c,
//    and the shared secret equals NIST's k.
//  - ML-DSA / SLH-DSA hedged signing: the extended signing structure — the
//    standard CK_SIGN_ADDITIONAL_CONTEXT (or CK_HASH_SIGN_ADDITIONAL_CONTEXT
//    for the generic pre-hash mechanisms) followed by pRandom, ulRandomLen and
//    messageEncoding — carries rnd (32 bytes) or addrnd (n bytes). The HSM
//    tells the forms apart by ulParameterLen alone; on wasm32 the extended
//    sizes are 24 and 28 bytes (standard: 12 and 16).
//  - SLH-DSA internal interface (FIPS 205 slh_sign/slh_verify_internal):
//    messageEncoding = internal in the same structure, empty context.
//  - ML-DSA internal interface: no extension. The standard
//    CKM_ML_DSA_EXTERNAL_MU signs or verifies μ, which the workbench computes
//    as μ = SHAKE256(SHAKE256(pk, 64) ‖ M′, 64) (FIPS 204 Alg 7 line 6).
//  - Generic pre-hash: CKM_HASH_ML_DSA / CKM_HASH_SLH_DSA with hash =
//    CKM_SHA512_224 or CKM_SHA512_256 and PH(M) as the data (standard).
//
// Every row that handed the HSM such a value says so in its visible text
// (TEST_INPUT_LABEL) and in caseMeta.testInput. FIPS 203/204/205 reserve these
// interfaces for testing; a validated module would keep them out of its
// approved mode. Rows ids start with `optin-`.
//
// The committed vector files carry a subset of each in-scope NIST group (see
// their _provenance). The local full-vector test runs every case of every
// in-scope group (909) through the same case runners below.
//
// Every CK* value is read inside a function, never captured by a module-scope
// object: in the production bundle the constants live in a chunk whose
// top-level await this chunk does not wait for.
import { sha512_224, sha512_256 } from '@noble/hashes/sha2.js'
import { shake256 } from '@noble/hashes/sha3.js'
import { hexToBytes } from '@/utils/dataInputUtils'
import { logByteComparison } from '../comparisonLog'
import {
  rvName,
  writeBytes,
  hsm_extractKeyValue,
  dsaParamSet,
  kemParamSet,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_ENCAPSULATE,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKA_PARAMETER_SET,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKO_SECRET_KEY,
  CKK_ML_KEM,
  CKK_ML_DSA,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKK_SLH_DSA,
  CKM_ML_KEM,
  CKM_ML_DSA,
  CKM_SLH_DSA,
  CKM_ML_DSA_EXTERNAL_MU,
  CKM_HASH_ML_DSA,
  CKM_HASH_SLH_DSA,
  CKM_SHA512_224,
  CKM_SHA512_256,
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
  CKH_HEDGE_PREFERRED,
  CKH_DETERMINISTIC_REQUIRED,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHAKE_256F,
} from '@/wasm/softhsm/constants'
import {
  acvpHashToMech,
  destroy,
  firstDiff,
  nBytes,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  CKR_SIGNATURE_INVALID,
  TEST_INPUT_LABEL,
  type AcvpCaseMeta,
  type MldsaAcvpSectionCtx,
  type Provenance,
} from './mldsaAcvp'
import { createObjectRv, sha256Tag, withTemplate } from './pkcs11Raw'

const CKR_SIGNATURE_LEN_RANGE = 0x000000c1

/** PKCS#11 messageEncoding values of the extended signing structure. */
export const MESSAGE_ENCODING_STANDARD = 0
export const MESSAGE_ENCODING_INTERNAL = 1

/** wasm32 sizes: CK_ULONG and pointers are 4 bytes. */
export const SIGN_CTX_LEN = 12
export const SIGN_CTX_EXT_LEN = 24
export const HASH_SIGN_CTX_LEN = 16
export const HASH_SIGN_CTX_EXT_LEN = 28

const CT_LEN: Record<number, number> = { 512: 768, 768: 1088, 1024: 1568 }

// ── JSON shapes ─────────────────────────────────────────────────────────────
export interface EncapCase {
  tcId: number
  ek: string
  m: string
  c: string
  k: string
}
export interface EncapGroup {
  tgId: number
  parameterSet: string
  function: string
  tests: EncapCase[]
}
export interface OptSigGenCase {
  tcId: number
  hashAlg: string
  sk: string
  pk?: string
  message?: string
  mu?: string
  context?: string
  rnd?: string
  additionalRandomness?: string
  signature: string
}
export interface OptSigGenGroup {
  tgId: number
  parameterSet: string
  deterministic: boolean
  signatureInterface: string
  preHash: string
  externalMu?: boolean
  tests: OptSigGenCase[]
}
export interface OptSigVerCase {
  tcId: number
  testPassed: boolean
  reason: string
  hashAlg: string
  pk: string
  message: string
  signature: string
}
export interface OptSigVerGroup {
  tgId: number
  parameterSet: string
  signatureInterface: string
  preHash: string
  externalMu?: boolean
  tests: OptSigVerCase[]
}
export interface OptVectorFile<G> {
  _provenance: Provenance
  testGroups: G[]
}

/** Outcome of one case, before it becomes a row. */
export interface CaseOutcome {
  ok: boolean
  observed: string
  details: string
}

// ── Mechanism parameters ────────────────────────────────────────────────────

/** Which optional input a signing case supplies. */
export interface ExtSignParams {
  hedge: number
  context: Uint8Array
  /** CK_HASH_SIGN_ADDITIONAL_CONTEXT.hash — set only for the generic pre-hash mechanisms. */
  hash?: number
  /** rnd / addrnd; null = absent (ulRandomLen 0). */
  random: Uint8Array | null
  messageEncoding: number
}

/**
 * CK_MECHANISM whose parameter is the EXTENDED signing structure (wasm32):
 * hedgeVariant, pContext, ulContextLen, [hash,] pRandom, ulRandomLen,
 * messageEncoding — 24 bytes, or 28 with `hash`.
 */
export function allocExtSignMech(
  M: SoftHSMModule,
  mechType: number,
  p: ExtSignParams,
  /** Override ulParameterLen (sabotage / length tests only). */
  lenOverride?: number
): { mech: number; allocs: number[] } {
  const allocs: number[] = []
  const mech = M._malloc(12)
  allocs.push(mech)
  const hashForm = p.hash !== undefined
  const len = hashForm ? HASH_SIGN_CTX_EXT_LEN : SIGN_CTX_EXT_LEN
  const s = M._malloc(len)
  allocs.push(s)
  M.setValue(s, p.hedge, 'i32')
  if (p.context.length > 0) {
    const c = writeBytes(M, p.context)
    allocs.push(c)
    M.setValue(s + 4, c, 'i32')
  } else {
    M.setValue(s + 4, 0, 'i32')
  }
  M.setValue(s + 8, p.context.length, 'i32')
  let off = 12
  if (hashForm) {
    M.setValue(s + 12, p.hash!, 'i32')
    off = 16
  }
  if (p.random && p.random.length > 0) {
    const r = writeBytes(M, p.random)
    allocs.push(r)
    M.setValue(s + off, r, 'i32')
    M.setValue(s + off + 4, p.random.length, 'i32')
  } else {
    M.setValue(s + off, 0, 'i32')
    M.setValue(s + off + 4, 0, 'i32')
  }
  M.setValue(s + off + 8, p.messageEncoding, 'i32')
  M.setValue(mech, mechType, 'i32')
  M.setValue(mech + 4, s, 'i32')
  M.setValue(mech + 8, lenOverride ?? len, 'i32')
  return { mech, allocs }
}

/** CK_MECHANISM with a raw byte parameter (shape 1: ML-KEM m, ECDSA k), or none. */
function allocRawMech(
  M: SoftHSMModule,
  mechType: number,
  param: Uint8Array | null
): { mech: number; allocs: number[] } {
  const allocs: number[] = []
  const mech = M._malloc(12)
  allocs.push(mech)
  M.setValue(mech, mechType, 'i32')
  if (param && param.length > 0) {
    const p = writeBytes(M, param)
    allocs.push(p)
    M.setValue(mech + 4, p, 'i32')
    M.setValue(mech + 8, param.length, 'i32')
  } else {
    M.setValue(mech + 4, 0, 'i32')
    M.setValue(mech + 8, 0, 'i32')
  }
  return { mech, allocs }
}

/** C_SignInit(mech) + C_Sign (size query, then sign). The caller owns `mech`. */
export function signWithMech(
  M: SoftHSMModule,
  h: number,
  priv: number,
  mech: number,
  data: Uint8Array
): { rv: number; step: string; sig: Uint8Array | null } {
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  const lenPtr = M._malloc(4)
  let sp = 0
  try {
    let rv = M._C_SignInit(h, mech, priv) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_SignInit', sig: null }
    M.setValue(lenPtr, 0, 'i32')
    rv = M._C_Sign(h, dp, data.length, 0, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_Sign(length)', sig: null }
    const len = M.getValue(lenPtr, 'i32') >>> 0
    sp = M._malloc(Math.max(1, len))
    rv = M._C_Sign(h, dp, data.length, sp, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_Sign', sig: null }
    return { rv, step: 'C_Sign', sig: M.HEAPU8.slice(sp, sp + (M.getValue(lenPtr, 'i32') >>> 0)) }
  } finally {
    M._free(dp)
    M._free(lenPtr)
    if (sp) M._free(sp)
  }
}

/** C_VerifyInit(mech) + C_Verify. The caller owns `mech`. */
export function verifyWithMech(
  M: SoftHSMModule,
  h: number,
  pub: number,
  mech: number,
  data: Uint8Array,
  sig: Uint8Array
): { initRv: number; rv: number } {
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  const sp = M._malloc(Math.max(1, sig.length))
  M.HEAPU8.set(sig, sp)
  try {
    const initRv = M._C_VerifyInit(h, mech, pub) >>> 0
    if (initRv !== CKR_OK) return { initRv, rv: initRv }
    const rv = M._C_Verify(h, dp, data.length, sp, sig.length) >>> 0
    return { initRv, rv }
  } finally {
    M._free(dp)
    M._free(sp)
  }
}

const freeAll = (M: SoftHSMModule, allocs: number[]) => allocs.forEach((a) => M._free(a))

// ── Key import (session objects, destroyed after each case) ─────────────────
const slhParamSet = (ps: string): number | undefined =>
  (
    ({
      'SLH-DSA-SHA2-128s': CKP_SLH_DSA_SHA2_128S,
      'SLH-DSA-SHA2-128f': CKP_SLH_DSA_SHA2_128F,
      'SLH-DSA-SHA2-192s': CKP_SLH_DSA_SHA2_192S,
      'SLH-DSA-SHA2-192f': CKP_SLH_DSA_SHA2_192F,
      'SLH-DSA-SHA2-256s': CKP_SLH_DSA_SHA2_256S,
      'SLH-DSA-SHA2-256f': CKP_SLH_DSA_SHA2_256F,
      'SLH-DSA-SHAKE-128s': CKP_SLH_DSA_SHAKE_128S,
      'SLH-DSA-SHAKE-128f': CKP_SLH_DSA_SHAKE_128F,
      'SLH-DSA-SHAKE-192s': CKP_SLH_DSA_SHAKE_192S,
      'SLH-DSA-SHAKE-192f': CKP_SLH_DSA_SHAKE_192F,
      'SLH-DSA-SHAKE-256s': CKP_SLH_DSA_SHAKE_256S,
      'SLH-DSA-SHAKE-256f': CKP_SLH_DSA_SHAKE_256F,
    }) as Record<string, number>
  )[ps]

const dsaVariant = (ps: string) => parseInt(ps.split('-')[2], 10) as 44 | 65 | 87
const kemVariant = (ps: string) => parseInt(ps.split('-')[2], 10) as 512 | 768 | 1024

/** C_CreateObject for an ML-DSA / SLH-DSA key from NIST bytes → { rv, handle }. */
export function importKey(
  M: SoftHSMModule,
  h: number,
  family: 'ML-DSA' | 'SLH-DSA',
  ps: string,
  cls: 'private' | 'public',
  value: Uint8Array
) {
  const keyType = family === 'ML-DSA' ? CKK_ML_DSA : CKK_SLH_DSA
  const paramSet = family === 'ML-DSA' ? dsaParamSet(dsaVariant(ps)) : slhParamSet(ps)
  const defs =
    cls === 'private'
      ? [
          { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
          { type: CKA_KEY_TYPE, ulongVal: keyType },
          { type: CKA_TOKEN, boolVal: false },
          { type: CKA_PRIVATE, boolVal: true },
          { type: CKA_SENSITIVE, boolVal: true },
          { type: CKA_SIGN, boolVal: true },
          { type: CKA_PARAMETER_SET, ulongVal: paramSet ?? 0 },
        ]
      : [
          { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
          { type: CKA_KEY_TYPE, ulongVal: keyType },
          { type: CKA_TOKEN, boolVal: false },
          { type: CKA_VERIFY, boolVal: true },
          { type: CKA_PARAMETER_SET, ulongVal: paramSet ?? 0 },
        ]
  return createObjectRv(M, h, defs, [{ type: CKA_VALUE, bytes: value }])
}

/** μ = SHAKE256(tr ‖ M′, 64), tr = SHAKE256(pk, 64) — FIPS 204 Alg 7 lines 1 and 6. */
export const mlDsaMu = (pk: Uint8Array, mPrime: Uint8Array): Uint8Array => {
  const tr = shake256(pk, { dkLen: 64 })
  const buf = new Uint8Array(tr.length + mPrime.length)
  buf.set(tr, 0)
  buf.set(mPrime, tr.length)
  return shake256(buf, { dkLen: 64 })
}

/** The PKCS#11 route of a pre-hash case: the hash-on-token mechanism, or the
 * generic one with PH(M) computed here (SHA-512/224 and SHA-512/256). */
export function preHashRoute(
  family: 'ML-DSA' | 'SLH-DSA',
  hashAlg: string,
  message: Uint8Array
): { mech: number | undefined; label: string; hash?: number; data: Uint8Array } {
  if (hashAlg === 'SHA2-512/224' || hashAlg === 'SHA2-512/256') {
    const t224 = hashAlg === 'SHA2-512/224'
    return {
      mech: family === 'ML-DSA' ? CKM_HASH_ML_DSA : CKM_HASH_SLH_DSA,
      label: `${family === 'ML-DSA' ? 'CKM_HASH_ML_DSA' : 'CKM_HASH_SLH_DSA'} (generic, hash = ${t224 ? 'CKM_SHA512_224' : 'CKM_SHA512_256'}, PH(M) supplied)`,
      hash: t224 ? CKM_SHA512_224 : CKM_SHA512_256,
      data: t224 ? sha512_224(message) : sha512_256(message),
    }
  }
  const mech = family === 'ML-DSA' ? acvpHashToMech()[hashAlg] : slhHashToMech()[hashAlg] // eslint-disable-line security/detect-object-injection
  const suffix = hashAlg
    .replace('SHA2-', 'SHA')
    .replace('SHA3-', 'SHA3_')
    .replace('SHAKE-', 'SHAKE')
  return {
    mech,
    label: `CKM_HASH_${family === 'ML-DSA' ? 'ML_DSA' : 'SLH_DSA'}_${suffix}`,
    data: message,
  }
}

/** ACVP hashAlg → CKM_HASH_SLH_DSA_<hash> (PKCS#11 v3.2 §6.69.7), built at call time. */
const slhHashToMech = (): Readonly<Record<string, number>> => ({
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
})

// ── Case runners (pure: one case in, one outcome out) ───────────────────────

/** ML-KEM encapsulation AFT with NIST's m as the CKM_ML_KEM parameter. */
export function runEncapCase(
  M: SoftHSMModule,
  h: number,
  ps: string,
  t: EncapCase,
  log?: (expected: string, got: Uint8Array, what: string) => void
): CaseOutcome {
  const v = kemVariant(ps)
  const pub = createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_ENCAPSULATE, boolVal: true },
      { type: CKA_PARAMETER_SET, ulongVal: kemParamSet(v) },
    ],
    [{ type: CKA_VALUE, bytes: hexToBytes(t.ek) }]
  )
  if (pub.rv !== CKR_OK) {
    const o = `C_CreateObject(ek) → ${rvName(pub.rv)}`
    return { ok: false, observed: o, details: o }
  }
  const { mech, allocs } = allocRawMech(M, CKM_ML_KEM, hexToBytes(t.m))
  const ctLen = CT_LEN[v] // eslint-disable-line security/detect-object-injection
  const ctPtr = M._malloc(ctLen)
  const lenPtr = M._malloc(4)
  const hPtr = M._malloc(4)
  M.setValue(lenPtr, ctLen, 'i32')
  M.setValue(hPtr, 0, 'i32')
  let secret = 0
  try {
    const rv = withTemplate(
      M,
      [
        { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_VALUE_LEN, ulongVal: 32 },
        // Test-only: the secret of a public NIST sample, extracted to compare with k.
        { type: CKA_SENSITIVE, boolVal: false },
        { type: CKA_EXTRACTABLE, boolVal: true },
      ],
      [],
      (tp, tn) => M._C_EncapsulateKey(h, mech, pub.handle, tp, tn, ctPtr, lenPtr, hPtr) >>> 0
    )
    secret = M.getValue(hPtr, 'i32') >>> 0
    if (rv !== CKR_OK) {
      const o = `C_EncapsulateKey(CKM_ML_KEM, m) → ${rvName(rv)}`
      return { ok: false, observed: o, details: o }
    }
    const c = M.HEAPU8.slice(ctPtr, ctPtr + (M.getValue(lenPtr, 'i32') >>> 0))
    const k = new Uint8Array(hsm_extractKeyValue(M, h, secret))
    log?.(t.c, c, 'ciphertext c')
    const cDiff = firstDiff(c, hexToBytes(t.c))
    const kDiff = firstDiff(k, hexToBytes(t.k))
    const ok = cDiff === 'identical' && kDiff === 'identical'
    return ok
      ? {
          ok,
          observed: 'c and k byte-equal',
          details: `c [${c.length}B] (${sha256Tag(c)}) and the shared secret [${k.length}B] byte-equal to NIST's`,
        }
      : // Never print the secret: report a position, not a value.
        { ok, observed: `c: ${cDiff}; k: ${kDiff}`, details: `mismatch — c: ${cDiff}; k: ${kDiff}` }
  } finally {
    freeAll(M, allocs)
    M._free(ctPtr)
    M._free(lenPtr)
    M._free(hPtr)
    destroy(M, h, secret)
    destroy(M, h, pub.handle)
  }
}

/** What a signing / verification case hands the HSM, and through which mechanism. */
export interface SignPlan {
  mech: number | undefined
  mechLabel: string
  data: Uint8Array
  /** null = the standard structure (or none); otherwise the extended one. */
  ext: ExtSignParams | null
  /** Standard-structure fallback when ext is null. */
  std: { hedge: number; context: Uint8Array } | null
  testInput: AcvpCaseMeta['testInput']
  mode: NonNullable<AcvpCaseMeta['mode']>
}

/** The PKCS#11 route of one ML-DSA / SLH-DSA signing case. */
export function planSign(
  family: 'ML-DSA' | 'SLH-DSA',
  g: OptSigGenGroup,
  t: OptSigGenCase
): SignPlan {
  const random = t.rnd ?? t.additionalRandomness
  const rnd = random ? hexToBytes(random) : null
  const hedge = g.deterministic ? CKH_DETERMINISTIC_REQUIRED : CKH_HEDGE_PREFERRED
  const context = hexToBytes(t.context ?? '')
  const rndInput = family === 'ML-DSA' ? 'rnd' : 'addrnd'
  if (g.signatureInterface === 'internal') {
    if (family === 'ML-DSA') {
      // Standard route: CKM_ML_DSA_EXTERNAL_MU over μ (given, or computed from pk and M′).
      const mu = t.mu
        ? hexToBytes(t.mu)
        : mlDsaMu(hexToBytes(t.pk ?? ''), hexToBytes(t.message ?? ''))
      return {
        mech: CKM_ML_DSA_EXTERNAL_MU,
        mechLabel: t.mu
          ? 'CKM_ML_DSA_EXTERNAL_MU (NIST μ)'
          : 'CKM_ML_DSA_EXTERNAL_MU (μ from pk and M′)',
        data: mu,
        ext: rnd
          ? {
              hedge,
              context: new Uint8Array(0),
              random: rnd,
              messageEncoding: MESSAGE_ENCODING_STANDARD,
            }
          : null,
        std: rnd ? null : { hedge, context: new Uint8Array(0) },
        testInput: rnd ? 'rnd' : undefined,
        mode: t.mu ? 'externalMu' : 'internal',
      }
    }
    return {
      mech: CKM_SLH_DSA,
      mechLabel: 'CKM_SLH_DSA (messageEncoding = internal)',
      data: hexToBytes(t.message ?? ''),
      ext: {
        hedge,
        context: new Uint8Array(0),
        random: rnd,
        messageEncoding: MESSAGE_ENCODING_INTERNAL,
      },
      std: null,
      testInput: rnd ? 'addrnd+internal-encoding' : 'internal-encoding',
      mode: 'internal',
    }
  }
  if (g.preHash === 'preHash') {
    const r = preHashRoute(family, t.hashAlg, hexToBytes(t.message ?? ''))
    return {
      mech: r.mech,
      mechLabel: r.label,
      data: r.data,
      ext: rnd
        ? { hedge, context, hash: r.hash, random: rnd, messageEncoding: MESSAGE_ENCODING_STANDARD }
        : null,
      std: rnd ? null : { hedge, context },
      testInput: rnd ? rndInput : undefined,
      mode: 'preHash',
    }
  }
  return {
    mech: family === 'ML-DSA' ? CKM_ML_DSA : CKM_SLH_DSA,
    mechLabel: family === 'ML-DSA' ? 'CKM_ML_DSA' : 'CKM_SLH_DSA',
    data: hexToBytes(t.message ?? ''),
    ext: rnd ? { hedge, context, random: rnd, messageEncoding: MESSAGE_ENCODING_STANDARD } : null,
    std: rnd ? null : { hedge, context },
    testInput: rnd ? rndInput : undefined,
    mode: 'pure',
  }
}

/** Standard CK_SIGN_ADDITIONAL_CONTEXT (12 bytes, wasm32). */
function allocStdSignMech(
  M: SoftHSMModule,
  mechType: number,
  p: { hedge: number; context: Uint8Array }
) {
  return allocExtSignMech(M, mechType, { ...p, random: null, messageEncoding: 0 }, SIGN_CTX_LEN)
}

/** Sign one case and byte-compare with NIST's signature. */
export function runSignCase(
  M: SoftHSMModule,
  h: number,
  family: 'ML-DSA' | 'SLH-DSA',
  g: OptSigGenGroup,
  t: OptSigGenCase,
  log?: (expected: string, got: Uint8Array, what: string) => void
): CaseOutcome {
  const plan = planSign(family, g, t)
  if (plan.mech === undefined) {
    const o = `no PKCS#11 route for ${t.hashAlg}`
    return { ok: false, observed: o, details: o }
  }
  const priv = importKey(M, h, family, g.parameterSet, 'private', hexToBytes(t.sk))
  if (priv.rv !== CKR_OK) {
    const o = `C_CreateObject(sk) → ${rvName(priv.rv)}`
    return { ok: false, observed: o, details: o }
  }
  const { mech, allocs } = plan.ext
    ? allocExtSignMech(M, plan.mech, plan.ext)
    : allocStdSignMech(M, plan.mech, plan.std!)
  try {
    const out = signWithMech(M, h, priv.handle, mech, plan.data)
    if (!out.sig) {
      const o = `${out.step} → ${rvName(out.rv)}`
      return { ok: false, observed: o, details: o }
    }
    log?.(t.signature, out.sig, 'signature')
    const diff = firstDiff(out.sig, hexToBytes(t.signature))
    return diff === 'identical'
      ? {
          ok: true,
          observed: 'byte-equal',
          details: `signature [${out.sig.length}B] byte-equal to NIST's (${sha256Tag(out.sig)})`,
        }
      : { ok: false, observed: diff, details: `mismatch — ${diff}` }
  } finally {
    freeAll(M, allocs)
    destroy(M, h, priv.handle)
  }
}

/** The CK_RV a sigVer case must return. */
export const expectedVerifyRv = (t: OptSigVerCase) =>
  t.testPassed
    ? CKR_OK
    : /invalid signature - too (small|large)/.test(t.reason)
      ? CKR_SIGNATURE_LEN_RANGE
      : CKR_SIGNATURE_INVALID

/** Verify one internal-interface case and check the return code. */
export function runVerifyInternalCase(
  M: SoftHSMModule,
  h: number,
  family: 'ML-DSA' | 'SLH-DSA',
  g: OptSigVerGroup,
  t: OptSigVerCase
): CaseOutcome {
  const pk = hexToBytes(t.pk)
  const msg = hexToBytes(t.message)
  const pub = importKey(M, h, family, g.parameterSet, 'public', pk)
  if (pub.rv !== CKR_OK) {
    const o = `C_CreateObject(pk) → ${rvName(pub.rv)}`
    return { ok: false, observed: o, details: o }
  }
  const { mech, allocs } =
    family === 'ML-DSA'
      ? allocRawMech(M, CKM_ML_DSA_EXTERNAL_MU, null)
      : allocExtSignMech(M, CKM_SLH_DSA, {
          hedge: CKH_HEDGE_PREFERRED,
          context: new Uint8Array(0),
          random: null,
          messageEncoding: MESSAGE_ENCODING_INTERNAL,
        })
  try {
    const data = family === 'ML-DSA' ? mlDsaMu(pk, msg) : msg
    const r = verifyWithMech(M, h, pub.handle, mech, data, hexToBytes(t.signature))
    const want = expectedVerifyRv(t)
    const where = r.initRv !== CKR_OK ? 'C_VerifyInit' : 'C_Verify'
    const o = `${where} → ${rvName(r.rv)}`
    return {
      ok: r.initRv === CKR_OK && r.rv === want,
      observed: o,
      details: `${o} (expected ${rvName(want)})`,
    }
  } finally {
    freeAll(M, allocs)
    destroy(M, h, pub.handle)
  }
}

// ── Section ─────────────────────────────────────────────────────────────────
export type OptionalInputFamily = 'ml_kem' | 'ml_dsa' | 'slh_dsa'

/** Vector data the section runs; tests may pass the full upstream groups. */
export interface OptionalInputVectors {
  encap?: OptVectorFile<EncapGroup>
  mldsaSigGen?: OptVectorFile<OptSigGenGroup>
  mldsaSigVer?: OptVectorFile<OptSigVerGroup>
  slhdsaSigGen?: OptVectorFile<OptSigGenGroup>
  slhdsaSigVer?: OptVectorFile<OptSigVerGroup>
}

/** Load the committed subsets for one family. */
export async function loadOptionalInputVectors(
  family: OptionalInputFamily
): Promise<OptionalInputVectors> {
  if (family === 'ml_kem')
    return {
      encap: (await import('@/data/acvp/mlkem_encap_aft_test.json'))
        .default as unknown as OptVectorFile<EncapGroup>,
    }
  if (family === 'ml_dsa') {
    const [g, v] = await Promise.all([
      import('@/data/acvp/mldsa_siggen_optional_input_test.json'),
      import('@/data/acvp/mldsa_sigver_internal_test.json'),
    ])
    return {
      mldsaSigGen: g.default as unknown as OptVectorFile<OptSigGenGroup>,
      mldsaSigVer: v.default as unknown as OptVectorFile<OptSigVerGroup>,
    }
  }
  const [g, v] = await Promise.all([
    import('@/data/acvp/slhdsa_siggen_optional_input_test.json'),
    import('@/data/acvp/slhdsa_sigver_internal_test.json'),
  ])
  return {
    slhdsaSigGen: g.default as unknown as OptVectorFile<OptSigGenGroup>,
    slhdsaSigVer: v.default as unknown as OptVectorFile<OptSigVerGroup>,
  }
}

const groupKind = (g: OptSigGenGroup) =>
  g.signatureInterface === 'internal'
    ? g.externalMu
      ? 'internal (external μ)'
      : 'internal'
    : g.preHash === 'preHash'
      ? 'pre-hash'
      : 'pure'

/** Run the optional-input rows of one family for ONE engine. */
export async function runOptionalInputSection(
  ctx: MldsaAcvpSectionCtx,
  family: OptionalInputFamily,
  vectors?: OptionalInputVectors
): Promise<void> {
  const { M, hSession: h, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const v = vectors ?? (await loadOptionalInputVectors(family))
  const logFor =
    (id: string) =>
    (expected: string, got: Uint8Array, what: string): void => {
      logByteComparison(addLog, `[${eName}] [id:${id}]`, got, expected, what)
    }

  const push = async (
    id: string,
    algorithm: string,
    testCase: string,
    meta: AcvpCaseMeta,
    prov: Provenance,
    skipWhy: string | null,
    exec: () => CaseOutcome
  ) => {
    if (skipWhy) {
      addLog(`[${eName}] [SKIP] ${algorithm} ${testCase}: ${skipWhy}`)
      await pushResult({
        id,
        algorithm,
        testCase,
        referenceUrl,
        status: 'skip',
        details: `Skipped — ${skipWhy}`,
        caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
      })
      return
    }
    let out: CaseOutcome
    try {
      out = exec()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      out = { ok: false, observed: msg, details: msg }
    }
    const label = meta.testInput ? ` · ${TEST_INPUT_LABEL}` : ''
    await pushResult({
      id,
      algorithm,
      testCase,
      referenceUrl,
      status: out.ok ? 'pass' : 'fail',
      details: `${out.details}${label} · ${srcTag(prov)}`,
      caseMeta: { ...meta, observed: out.observed },
    })
    addLog(
      `${out.ok ? '' : '[DISCREPANCY] '}[${eName}] [id:${id}] ${testCase}: ${out.ok ? 'PASS' : `FAIL (${out.observed})`}`
    )
  }

  // ── ML-KEM encapsulation with m ────────────────────────────────────────
  if (v.encap) {
    const P = v.encap._provenance
    const why = unsupportedReason(mechs, CKM_ML_KEM, 'CKM_ML_KEM')
    for (const g of v.encap.testGroups)
      for (const t of g.tests) {
        const id = `optin-mlkem-encap-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const testCase = `Encapsulate · NIST encapDecap AFT tg${g.tgId}/tc${t.tcId} · C_EncapsulateKey(CKM_ML_KEM, pParameter = NIST m) · expect NIST c and k · ${TEST_INPUT_LABEL}`
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'encapsulation',
          localOperation: 'encapsulation',
          parameterSet: g.parameterSet,
          expected: 'byte-match',
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(P),
          testInput: 'm',
        }
        await push(id, `${g.parameterSet} (${eName})`, testCase, meta, P, why, () =>
          runEncapCase(M, h, g.parameterSet, t, logFor(id))
        )
      }
  }

  // ── ML-DSA / SLH-DSA signing ───────────────────────────────────────────
  const signFiles: ['ML-DSA' | 'SLH-DSA', OptVectorFile<OptSigGenGroup> | undefined][] = [
    ['ML-DSA', v.mldsaSigGen],
    ['SLH-DSA', v.slhdsaSigGen],
  ]
  for (const [fam, file] of signFiles) {
    if (!file) continue
    const P = file._provenance
    const stem = fam === 'ML-DSA' ? 'mldsa' : 'slhdsa'
    for (const g of file.testGroups)
      for (const t of g.tests) {
        const plan = planSign(fam, g, t)
        const id = `optin-${stem}-siggen-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const ctxLen = nBytes(t.context)
        const testCase =
          `SigGen · NIST sigGen tg${g.tgId}/tc${t.tcId} · ${groupKind(g)} · ${g.deterministic ? 'deterministic' : 'hedged'}` +
          (g.preHash === 'preHash' ? ` · ${t.hashAlg}` : '') +
          (g.signatureInterface === 'external' ? ` · ctx ${ctxLen}B` : '') +
          ` · ${plan.mechLabel}` +
          (plan.testInput === 'rnd' ? ' + NIST rnd' : '') +
          (plan.testInput === 'addrnd' || plan.testInput === 'addrnd+internal-encoding'
            ? ' + NIST addrnd'
            : '') +
          ' · expect NIST signature byte-match' +
          (plan.testInput ? ` · ${TEST_INPUT_LABEL}` : '')
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'sigGen',
          localOperation: g.deterministic ? 'sigGen-deterministic' : 'sigGen-hedged',
          parameterSet: g.parameterSet,
          mode: plan.mode,
          hashAlg: t.hashAlg,
          contextBytes: g.signatureInterface === 'external' ? ctxLen : undefined,
          messageBytes: nBytes(t.mu ?? t.message),
          expected: 'byte-match',
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(P),
          ...(plan.testInput ? { testInput: plan.testInput } : {}),
        }
        await push(
          id,
          `${g.parameterSet} (${eName})`,
          testCase,
          meta,
          P,
          unsupportedReason(mechs, plan.mech, plan.mechLabel),
          () => runSignCase(M, h, fam, g, t, logFor(id))
        )
      }
  }

  // ── Internal-interface verification ────────────────────────────────────
  const verFiles: ['ML-DSA' | 'SLH-DSA', OptVectorFile<OptSigVerGroup> | undefined][] = [
    ['ML-DSA', v.mldsaSigVer],
    ['SLH-DSA', v.slhdsaSigVer],
  ]
  for (const [fam, file] of verFiles) {
    if (!file) continue
    const P = file._provenance
    const stem = fam === 'ML-DSA' ? 'mldsa' : 'slhdsa'
    const mech = fam === 'ML-DSA' ? CKM_ML_DSA_EXTERNAL_MU : CKM_SLH_DSA
    const mechLabel =
      fam === 'ML-DSA'
        ? 'CKM_ML_DSA_EXTERNAL_MU (μ from pk and M′)'
        : 'CKM_SLH_DSA (messageEncoding = internal)'
    for (const g of file.testGroups)
      for (const t of g.tests) {
        const id = `optin-${stem}-sigver-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const want = rvName(expectedVerifyRv(t))
        const testCase =
          `SigVer · NIST sigVer tg${g.tgId}/tc${t.tcId} · internal · ${mechLabel} · expect ` +
          (t.testPassed ? 'valid' : `invalid (${t.reason}) → ${want}`) +
          (fam === 'SLH-DSA' ? ` · ${TEST_INPUT_LABEL}` : '')
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'sigVer',
          localOperation: 'sigVer',
          parameterSet: g.parameterSet,
          mode: 'internal',
          hashAlg: t.hashAlg,
          messageBytes: nBytes(t.message),
          expected: t.testPassed ? 'valid' : 'invalid',
          expectedReason: t.reason,
          expectedRv: want,
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(P),
          ...(fam === 'SLH-DSA' ? { testInput: 'internal-encoding' as const } : {}),
        }
        await push(
          id,
          `${g.parameterSet} (${eName})`,
          testCase,
          meta,
          P,
          unsupportedReason(mechs, mech, mechLabel),
          () => runVerifyInternalCase(M, h, fam, g, t)
        )
      }
  }
}
