// SPDX-License-Identifier: GPL-3.0-only
//
// Raw PKCS#11 helpers for the classical / symmetric / hash / MAC reference-sample
// sections (remediation plan 2026-09-24, WS-E). Like pkcs11Raw.ts, every helper
// returns the exact CK_RV (and the call that produced it) instead of throwing,
// and frees everything it allocates — a negative case must assert the code, and
// the hsm_* wrappers collapse every failure into an exception or `false`.
//
// No module-scope value here is built from @/wasm/softhsm bindings: in the
// production bundle those live in a chunk whose top-level await this chunk
// never awaits, so they are read inside the functions only (build TLA check).
import { writeBytes, hsm_extractKeyValue } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_WRAP,
  CKA_UNWRAP,
  CKA_VALUE,
  CKO_SECRET_KEY,
} from '@/wasm/softhsm/constants'
import { CKR_OK, type AcvpCaseMeta, type MldsaAcvpSectionCtx } from './mldsaAcvp'
import { createObjectRv, withTemplate, type AttrDef } from './pkcs11Raw'

/** Section context for the WS-E sections: the ML-DSA one plus the engine's slot,
 * so a section can read C_GetMechanismInfo (advertised key-size range). */
export interface ClassicalSectionCtx extends MldsaAcvpSectionCtx {
  slot: number
}

/** Upper-case hex, as the upstream files spell it. */
export const hexUp = (b: Uint8Array): string =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

/** Flip the lowest bit of the last byte (a product-authored mutation). */
export const flipLastBit = (b: Uint8Array): Uint8Array => {
  const out = b.slice()
  if (out.length > 0) out[out.length - 1] ^= 0x01
  return out
}

/** A mechanism parameter block in WASM memory plus every pointer it owns. */
export interface ParamBlock {
  ptr: number
  len: number
  allocs: number[]
}

/** A CK_MECHANISM in WASM memory; `free()` releases it and its parameter block. */
export interface RawMech {
  ptr: number
  free: () => void
}

export function rawMech(M: SoftHSMModule, type: number, p: ParamBlock | null = null): RawMech {
  const ptr = M._malloc(12)
  M.setValue(ptr, type, 'i32')
  M.setValue(ptr + 4, p ? p.ptr : 0, 'i32')
  M.setValue(ptr + 8, p ? p.len : 0, 'i32')
  return {
    ptr,
    free: () => {
      M._free(ptr)
      p?.allocs.forEach((a) => M._free(a))
    },
  }
}

const bytesOrNull = (M: SoftHSMModule, b: Uint8Array, allocs: number[]): number => {
  if (b.length === 0) return 0
  const p = writeBytes(M, b)
  allocs.push(p)
  return p
}

/** Raw bytes as the parameter (CBC IV, KW/KWP IV). */
export function pBytes(M: SoftHSMModule, b: Uint8Array): ParamBlock {
  const ptr = M._malloc(Math.max(1, b.length))
  M.HEAPU8.set(b, ptr)
  return { ptr, len: b.length, allocs: [ptr] }
}

/** CK_GCM_PARAMS {pIv, ulIvLen, ulIvBits, pAAD, ulAADLen, ulTagBits} (PKCS#11 v3.2 §6.13.7). */
export function pGcm(M: SoftHSMModule, iv: Uint8Array, aad: Uint8Array, tagBits: number) {
  const allocs: number[] = []
  const ivPtr = bytesOrNull(M, iv, allocs)
  const aadPtr = bytesOrNull(M, aad, allocs)
  const ptr = M._malloc(24)
  allocs.push(ptr)
  M.setValue(ptr, ivPtr, 'i32')
  M.setValue(ptr + 4, iv.length, 'i32')
  M.setValue(ptr + 8, iv.length * 8, 'i32')
  M.setValue(ptr + 12, aadPtr, 'i32')
  M.setValue(ptr + 16, aad.length, 'i32')
  M.setValue(ptr + 20, tagBits, 'i32')
  return { ptr, len: 24, allocs } satisfies ParamBlock
}

/** CK_AES_CTR_PARAMS {ulCounterBits, cb[16]} (PKCS#11 v3.2 §6.11.2). */
export function pCtr(M: SoftHSMModule, counterBits: number, cb: Uint8Array): ParamBlock {
  const ptr = M._malloc(20)
  M.setValue(ptr, counterBits, 'i32')
  M.HEAPU8.set(cb.subarray(0, 16), ptr + 4)
  return { ptr, len: 20, allocs: [ptr] }
}

/** CK_MAC_GENERAL_PARAMS — a CK_ULONG output length in bytes. */
export function pUlong(M: SoftHSMModule, n: number): ParamBlock {
  const ptr = M._malloc(4)
  M.setValue(ptr, n, 'i32')
  return { ptr, len: 4, allocs: [ptr] }
}

/** CK_RSA_PKCS_PSS_PARAMS {hashAlg, mgf, sLen}. */
export function pPss(M: SoftHSMModule, hashMech: number, mgf: number, sLen: number): ParamBlock {
  const ptr = M._malloc(12)
  M.setValue(ptr, hashMech, 'i32')
  M.setValue(ptr + 4, mgf, 'i32')
  M.setValue(ptr + 8, sLen, 'i32')
  return { ptr, len: 12, allocs: [ptr] }
}

/** CK_EDDSA_PARAMS {phFlag (CK_BBOOL, padded), ulContextDataLen, pContextData}. */
export function pEddsa(M: SoftHSMModule, phFlag: boolean, context: Uint8Array): ParamBlock {
  const allocs: number[] = []
  const ctxPtr = bytesOrNull(M, context, allocs)
  const ptr = M._malloc(12)
  allocs.push(ptr)
  // i32 on purpose: the Rust adapter's setValue writes i32 only; little-endian
  // puts the flag in byte 0 and zeroes the padding.
  M.setValue(ptr, phFlag ? 1 : 0, 'i32')
  M.setValue(ptr + 4, context.length, 'i32')
  M.setValue(ptr + 8, ctxPtr, 'i32')
  return { ptr, len: 12, allocs }
}

export type Step = string
export interface RvOut {
  rv: number
  step: Step
  out: Uint8Array | null
}

/** Size query then output — the PKCS#11 §5.2 two-call convention, for a single-part call. */
function twoCall(
  M: SoftHSMModule,
  name: string,
  call: (outPtr: number, lenPtr: number) => number
): RvOut {
  const lenPtr = M._malloc(4)
  let outPtr = 0
  try {
    M.setValue(lenPtr, 0, 'i32')
    let rv = call(0, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: `${name}(length)`, out: null }
    const len = M.getValue(lenPtr, 'i32') >>> 0
    outPtr = M._malloc(Math.max(1, len))
    rv = call(outPtr, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: name, out: null }
    return {
      rv,
      step: name,
      out: M.HEAPU8.slice(outPtr, outPtr + (M.getValue(lenPtr, 'i32') >>> 0)),
    }
  } finally {
    M._free(lenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/** C_EncryptInit/C_DecryptInit + single-part C_Encrypt/C_Decrypt. */
export function cryptRv(
  M: SoftHSMModule,
  h: number,
  op: 'encrypt' | 'decrypt',
  mech: RawMech,
  key: number,
  data: Uint8Array
): RvOut {
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  try {
    const init =
      op === 'encrypt'
        ? M._C_EncryptInit(h, mech.ptr, key) >>> 0
        : M._C_DecryptInit(h, mech.ptr, key) >>> 0
    const initName = op === 'encrypt' ? 'C_EncryptInit' : 'C_DecryptInit'
    if (init !== CKR_OK) return { rv: init, step: initName, out: null }
    return op === 'encrypt'
      ? twoCall(M, 'C_Encrypt', (o, l) => M._C_Encrypt(h, dp, data.length, o, l))
      : twoCall(M, 'C_Decrypt', (o, l) => M._C_Decrypt(h, dp, data.length, o, l))
  } finally {
    M._free(dp)
  }
}

/** A multi-part C_Encrypt/C_Decrypt operation: init once, then one call per chunk. */
export function multipartRv(
  M: SoftHSMModule,
  h: number,
  op: 'encrypt' | 'decrypt',
  mech: RawMech,
  key: number
): {
  initRv: number
  update: (chunk: Uint8Array) => RvOut
  final: () => RvOut
} {
  const initRv =
    op === 'encrypt'
      ? M._C_EncryptInit(h, mech.ptr, key) >>> 0
      : M._C_DecryptInit(h, mech.ptr, key) >>> 0
  const name = op === 'encrypt' ? 'C_EncryptUpdate' : 'C_DecryptUpdate'
  return {
    initRv,
    update: (chunk) => {
      const dp = M._malloc(Math.max(1, chunk.length))
      M.HEAPU8.set(chunk, dp)
      const lenPtr = M._malloc(4)
      const outPtr = M._malloc(chunk.length + 32)
      try {
        M.setValue(lenPtr, chunk.length + 32, 'i32')
        const rv =
          (op === 'encrypt'
            ? M._C_EncryptUpdate(h, dp, chunk.length, outPtr, lenPtr)
            : M._C_DecryptUpdate(h, dp, chunk.length, outPtr, lenPtr)) >>> 0
        if (rv !== CKR_OK) return { rv, step: name, out: null }
        return {
          rv,
          step: name,
          out: M.HEAPU8.slice(outPtr, outPtr + (M.getValue(lenPtr, 'i32') >>> 0)),
        }
      } finally {
        M._free(dp)
        M._free(lenPtr)
        M._free(outPtr)
      }
    },
    final: () =>
      twoCall(M, op === 'encrypt' ? 'C_EncryptFinal' : 'C_DecryptFinal', (o, l) =>
        op === 'encrypt' ? M._C_EncryptFinal(h, o, l) : M._C_DecryptFinal(h, o, l)
      ),
  }
}

/** C_SignInit + single-part C_Sign. */
export function signRaw(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  key: number,
  data: Uint8Array
): RvOut {
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  try {
    const init = M._C_SignInit(h, mech.ptr, key) >>> 0
    if (init !== CKR_OK) return { rv: init, step: 'C_SignInit', out: null }
    return twoCall(M, 'C_Sign', (o, l) => M._C_Sign(h, dp, data.length, o, l))
  } finally {
    M._free(dp)
  }
}

/** C_VerifyInit + single-part C_Verify → { initRv, rv } (rv = initRv when init failed). */
export function verifyRaw(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  key: number,
  data: Uint8Array,
  sig: Uint8Array
): { initRv: number; rv: number } {
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  const sp = M._malloc(Math.max(1, sig.length))
  M.HEAPU8.set(sig, sp)
  try {
    const initRv = M._C_VerifyInit(h, mech.ptr, key) >>> 0
    if (initRv !== CKR_OK) return { initRv, rv: initRv }
    return { initRv, rv: M._C_Verify(h, dp, data.length, sp, sig.length) >>> 0 }
  } finally {
    M._free(dp)
    M._free(sp)
  }
}

/** C_DigestInit + single-part C_Digest. */
export function digestRv(M: SoftHSMModule, h: number, mechType: number, data: Uint8Array): RvOut {
  const m = rawMech(M, mechType)
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  try {
    const init = M._C_DigestInit(h, m.ptr) >>> 0
    if (init !== CKR_OK) return { rv: init, step: 'C_DigestInit', out: null }
    return twoCall(M, 'C_Digest', (o, l) => M._C_Digest(h, dp, data.length, o, l))
  } finally {
    m.free()
    M._free(dp)
  }
}

/** C_WrapKey (size query, then wrap). */
export function wrapRv(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  wrappingKey: number,
  key: number
): RvOut {
  return twoCall(M, 'C_WrapKey', (o, l) => M._C_WrapKey(h, mech.ptr, wrappingKey, key, o, l))
}

/** C_UnwrapKey into a session CKO_SECRET_KEY → { rv, handle }. */
export function unwrapRv(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  unwrappingKey: number,
  wrapped: Uint8Array,
  keyType: number
): { rv: number; handle: number } {
  const wp = M._malloc(Math.max(1, wrapped.length))
  M.HEAPU8.set(wrapped, wp)
  const hPtr = M._malloc(4)
  M.setValue(hPtr, 0, 'i32')
  try {
    const defs: AttrDef[] = [
      { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
      { type: CKA_KEY_TYPE, ulongVal: keyType },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_SENSITIVE, boolVal: false },
      { type: CKA_EXTRACTABLE, boolVal: true },
    ]
    const rv = withTemplate(
      M,
      defs,
      [],
      (t, n) => M._C_UnwrapKey(h, mech.ptr, unwrappingKey, wp, wrapped.length, t, n, hPtr) >>> 0
    )
    return { rv, handle: rv === CKR_OK ? M.getValue(hPtr, 'i32') >>> 0 : 0 }
  } finally {
    M._free(wp)
    M._free(hPtr)
  }
}

export interface SecretUse {
  encrypt?: boolean
  decrypt?: boolean
  sign?: boolean
  verify?: boolean
  wrap?: boolean
  unwrap?: boolean
}

/** C_CreateObject for a session secret key (CKA_VALUE = the vector's key bytes). */
export function importSecretRv(
  M: SoftHSMModule,
  h: number,
  keyType: number,
  value: Uint8Array,
  use: SecretUse
): { rv: number; handle: number } {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
      { type: CKA_KEY_TYPE, ulongVal: keyType },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_SENSITIVE, boolVal: false },
      { type: CKA_EXTRACTABLE, boolVal: true },
      { type: CKA_ENCRYPT, boolVal: use.encrypt === true },
      { type: CKA_DECRYPT, boolVal: use.decrypt === true },
      { type: CKA_SIGN, boolVal: use.sign === true },
      { type: CKA_VERIFY, boolVal: use.verify === true },
      { type: CKA_WRAP, boolVal: use.wrap === true },
      { type: CKA_UNWRAP, boolVal: use.unwrap === true },
    ],
    [{ type: CKA_VALUE, bytes: value }]
  )
}

/** CKA_VALUE of an extractable, non-sensitive secret (throws only on a PKCS#11 error). */
export const valueOf = (M: SoftHSMModule, h: number, handle: number): Uint8Array =>
  new Uint8Array(hsm_extractKeyValue(M, h, handle))

/** Uppercase/lowercase-insensitive hex equality of bytes against an upstream hex string. */
export const eqHex = (b: Uint8Array | null, hex: string): boolean => {
  if (!b || b.length * 2 !== hex.length) return false
  const lower = hex.toLowerCase()
  for (let i = 0; i < b.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    if (b[i].toString(16).padStart(2, '0') !== lower.slice(2 * i, 2 * i + 2)) return false
  }
  return true
}

// ── Row plumbing shared by the WS-E sections ────────────────────────────────

export interface RowOutcome {
  ok: boolean
  /** Machine-comparable observation (byte-equal, a CK_RV name, …) — lands in caseMeta.observed. */
  observed: string
  details: string
}

/** Execute one case and record exactly one result row (a throw is a 'fail' row, never dropped). */
export async function runRow(
  ctx: MldsaAcvpSectionCtx,
  row: {
    id: string
    algorithm: string
    testCase: string
    meta: AcvpCaseMeta
    source: string
    // A case may be async so a very long inner loop (the 100-iteration MCTs,
    // 100 000 WASM calls per row) can yield to the event loop between outer
    // iterations — without that the allocation churn never gets a full GC and
    // the renderer OOMs. See sections/mctFullAcvp.ts.
    exec: () => RowOutcome | Promise<RowOutcome>
  }
): Promise<void> {
  const { pushResult, addLog, referenceUrl, eName } = ctx
  let out: RowOutcome
  try {
    out = await row.exec()
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    out = { ok: false, observed: m, details: m }
  }
  await pushResult({
    id: row.id,
    algorithm: row.algorithm,
    testCase: row.testCase,
    referenceUrl,
    status: out.ok ? 'pass' : 'fail',
    details: `${out.details} · ${row.source}`,
    caseMeta: { ...row.meta, observed: out.observed },
  })
  addLog(
    `${out.ok ? '' : '[DISCREPANCY] '}[${eName}] [id:${row.id}] ${row.testCase}: ${out.ok ? 'PASS' : `FAIL (${out.observed})`}`
  )
}

/** Record a 'skip' row: nothing executed, the reason is visible, never a pass. */
export async function skipRow(
  ctx: MldsaAcvpSectionCtx,
  row: { id: string; algorithm: string; testCase: string; meta: AcvpCaseMeta; why: string }
): Promise<void> {
  ctx.addLog(`[${ctx.eName}] [SKIP] ${row.testCase}: ${row.why}`)
  await ctx.pushResult({
    id: row.id,
    algorithm: row.algorithm,
    testCase: row.testCase,
    referenceUrl: ctx.referenceUrl,
    status: 'skip',
    details: `Skipped — ${row.why}`,
    caseMeta: { ...row.meta, expected: 'not-run', origin: 'not-executed' },
  })
}

/**
 * PKCS#11 v3.2 mechanism numbers the WS-E sections use, as plain literals (so
 * they are safe at module scope — no softhsm binding involved). Each value is
 * checked against the generated mechanism inventory's name → type map by
 * useAcvpSuite.classicalAcvp.local.test.ts.
 */
export const WSE_MECH = {
  CKM_SHA_1: 0x220,
  CKM_SHA224: 0x255,
  CKM_SHA256: 0x250,
  CKM_SHA384: 0x260,
  CKM_SHA512: 0x270,
  CKM_SHA512_224: 0x48,
  CKM_SHA512_256: 0x4c,
  CKM_SHA3_224: 0x2b5,
  CKM_SHA3_256: 0x2b0,
  CKM_SHA3_384: 0x2c0,
  CKM_SHA3_512: 0x2d0,
  CKM_SHA_1_HMAC_GENERAL: 0x222,
  CKM_SHA224_HMAC_GENERAL: 0x257,
  CKM_SHA256_HMAC_GENERAL: 0x252,
  CKM_SHA384_HMAC_GENERAL: 0x262,
  CKM_SHA512_HMAC_GENERAL: 0x272,
  CKM_SHA512_224_HMAC_GENERAL: 0x4a,
  CKM_SHA512_256_HMAC_GENERAL: 0x4e,
  CKM_SHA3_224_HMAC_GENERAL: 0x2b7,
  CKM_SHA3_256_HMAC_GENERAL: 0x2b2,
  CKM_SHA3_384_HMAC_GENERAL: 0x2c2,
  CKM_SHA3_512_HMAC_GENERAL: 0x2d2,
  CKM_ECDSA_SHA224: 0x1043,
  CKM_ECDSA_SHA256: 0x1044,
  CKM_ECDSA_SHA384: 0x1045,
  CKM_ECDSA_SHA512: 0x1046,
  CKM_ECDSA_SHA3_224: 0x1047,
  CKM_ECDSA_SHA3_256: 0x1048,
  CKM_ECDSA_SHA3_384: 0x1049,
  CKM_ECDSA_SHA3_512: 0x104a,
  CKM_EDDSA: 0x1057,
  CKM_SHA256_RSA_PKCS: 0x40,
  CKM_SHA3_256_RSA_PKCS_PSS: 0x63,
  CKM_AES_CBC: 0x1082,
  CKM_AES_CTR: 0x1086,
  CKM_AES_GCM: 0x1087,
  CKM_AES_KEY_WRAP: 0x2109,
  CKM_AES_KEY_WRAP_KWP: 0x210b,
  // gap-closure P5 (sections/kdfDeriveAcvp.ts): SP 800-108 PRFs (Table 196) and KDF mechanisms.
  CKM_SHA_1_HMAC: 0x221,
  CKM_SHA224_HMAC: 0x256,
  CKM_SHA256_HMAC: 0x251,
  CKM_SHA384_HMAC: 0x261,
  CKM_SHA512_HMAC: 0x271,
  CKM_SHA3_224_HMAC: 0x2b6,
  CKM_SHA3_256_HMAC: 0x2b1,
  CKM_SHA3_384_HMAC: 0x2c1,
  CKM_SHA3_512_HMAC: 0x2d1,
  CKM_AES_CMAC: 0x108a,
  CKM_HKDF_DERIVE: 0x402a,
  CKM_SP800_108_COUNTER_KDF: 0x3ac,
  CKM_SP800_108_FEEDBACK_KDF: 0x3ad,
  CKM_SP800_108_DOUBLE_PIPELINE_KDF: 0x3ae,
} as const
export type WseMechName = keyof typeof WSE_MECH

/** PKCS#11 v3.2 key types / object classes / attributes used by the WS-E importers. */
export const WSE_CK = {
  CKO_PUBLIC_KEY: 0x2,
  CKK_EC: 0x3,
  CKK_GENERIC_SECRET: 0x10,
  CKK_AES: 0x1f,
  CKK_EC_EDWARDS: 0x40,
  CKO_PRIVATE_KEY: 0x3,
  CKA_DERIVE: 0x10c,
  CKA_VALUE_LEN: 0x161,
  CKA_EC_PARAMS: 0x180,
  CKA_EC_POINT: 0x181,
} as const
