// SPDX-License-Identifier: AGPL-3.0-only
/**
 * PKCS#11 engine adapter (F-3) — the ONE executor both code paths use: the
 * browser panel hands it a module from getSoftHSMCppModule()/
 * getSoftHSMRustModule(); the CLI hands it a module loaded from disk
 * (node/loadEngines.ts). Only standard PKCS#11 v3.2 calls are made:
 *
 *   ml-kem.decapsulate: C_CreateObject(CKO_PRIVATE_KEY, CKK_ML_KEM, CKA_VALUE=dk)
 *                       → C_DecapsulateKey(CKM_ML_KEM, c) → C_GetAttributeValue(CKA_VALUE)
 *   ml-dsa.verify:      C_CreateObject(CKO_PUBLIC_KEY, CKK_ML_DSA, CKA_VALUE=pk)
 *                       → C_MessageVerifyInit(mech, CK_SIGN_ADDITIONAL_CONTEXT{ctx})
 *                       → C_VerifyMessage → C_MessageVerifyFinal
 *   ml-dsa.verify-external-mu (VENDOR-DEFINED mechanism, not PKCS#11 v3.2):
 *                       C_CreateObject(pk) → C_VerifyInit(CKM_ML_DSA_EXTERNAL_MU
 *                       0x0000403c, no parameter) → C_Verify(data = mu, sig) —
 *                       the same call shape as the Playground ML-DSA section
 *                       (src/components/Playground/hsm/acvp/sections/mldsaAcvp.ts).
 *
 * Every imported object is destroyed after its test. The bounded profile
 * uses no RNG seeding, no test-only hooks and no secret-injection seam:
 * decapsulation and verification are deterministic functions of the prompt's
 * own inputs. The EXTENDED profile adds three operations (dispatch.ts X1–X4):
 *
 *   ml-kem.encapsulate (TEST-ONLY, outside PKCS#11): C_CreateObject(ek) →
 *                       C_EncapsulateKey(CKM_ML_KEM, pParameter = NIST's m) →
 *                       c from the output buffer, k from the derived secret.
 *                       Before the first answer the adapter proves the engine
 *                       honours m: the same m twice must give identical
 *                       output and a one-bit-different m a different
 *                       ciphertext; otherwise every encapsulation test is
 *                       unsupported and no value is produced.
 *   ml-kem.key-check:   C_CreateObject(key). CKR_OK → true; exactly
 *                       CKR_ATTRIBUTE_VALUE_INVALID → false; anything else → error.
 *   ml-dsa.verify with the generic CKM_HASH_ML_DSA with a SHA-512/t hash (PKCS#11 v3.3 working draft):
 *                       C_VerifyInit(CK_HASH_SIGN_ADDITIONAL_CONTEXT{hedge,
 *                       context, hash}) + C_Verify(data = PH(M), sig).
 */
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  buildTemplate,
  CKA_CLASS,
  CKA_DECAPSULATE,
  CKA_ENCAPSULATE,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_PARAMETER_SET,
  CKA_SENSITIVE,
  CKA_TOKEN,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKA_VERIFY,
  CKK_ML_KEM,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  CKO_SECRET_KEY,
  freeTemplate,
  hsm_decapsulate,
  hsm_destroyObject,
  hsm_extractKeyValue,
  hsm_getFirstFreeSlot,
  hsm_getMechanismList,
  hsm_importMLDSAPublicKey,
  hsm_importMLKEMPrivateKey,
  hsm_importMLKEMPublicKey,
  hsm_initToken,
  hsm_openUserSession,
  kemParamSet,
  rvName,
  writeBytes,
} from '../../wasm/softhsm'
import {
  CKH_HEDGE_PREFERRED,
  CKM_HASH_ML_DSA_SHA224,
  CKM_HASH_ML_DSA_SHA256,
  CKM_HASH_ML_DSA_SHA384,
  CKM_HASH_ML_DSA_SHA3_224,
  CKM_HASH_ML_DSA_SHA3_256,
  CKM_HASH_ML_DSA_SHA3_384,
  CKM_HASH_ML_DSA_SHA3_512,
  CKM_HASH_ML_DSA_SHA512,
  CKM_HASH_ML_DSA_SHAKE128,
  CKM_HASH_ML_DSA,
  CKM_HASH_ML_DSA_SHAKE256,
  CKM_ML_DSA,
  CKM_ML_KEM,
  CKM_SHA512_224,
  CKM_SHA512_256,
} from '../../wasm/softhsm/constants'
import { bytesToUpperHex, hexToBytes } from './ir'
import {
  UNSUPPORTED_REASONS,
  VENDOR_DEFINED_MECHANISMS,
  type AcvpEngine,
  type EngineIdentity,
  type EngineOutcome,
  type MlDsaVerifyExternalMuOp,
  type MlDsaVerifyOp,
  type MlKemDecapsulateOp,
  type MlKemEncapsulateOp,
  type MlKemKeyCheckOp,
  type PlanOperation,
  type Pkcs11MechanismName,
} from './dispatch'

const CKR_OK = 0
const CKR_SIGNATURE_INVALID = 0xc0
const CKR_SIGNATURE_LEN_RANGE = 0xc1
const CKR_ATTRIBUTE_VALUE_INVALID = 0x13
/** ML-KEM ciphertext length per variant (FIPS 203 Table 3). */
const CT_LEN: Readonly<Record<number, number>> = { 512: 768, 768: 1088, 1024: 1568 }
const CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191

const SO_PIN = '12345678'
const USER_PIN = 'user1234'
const TOKEN_LABEL = 'ACVP-IO prototype'

/** Lazy for the same production-TLA reason as pqc.ts's prehashMech(). */
const mechanismValue = (name: Pkcs11MechanismName): number =>
  ({
    CKM_ML_KEM,
    CKM_ML_DSA,
    CKM_HASH_ML_DSA,
    CKM_HASH_ML_DSA_SHA224,
    CKM_HASH_ML_DSA_SHA256,
    CKM_HASH_ML_DSA_SHA384,
    CKM_HASH_ML_DSA_SHA512,
    CKM_HASH_ML_DSA_SHA3_224,
    CKM_HASH_ML_DSA_SHA3_256,
    CKM_HASH_ML_DSA_SHA3_384,
    CKM_HASH_ML_DSA_SHA3_512,
    CKM_HASH_ML_DSA_SHAKE128,
    CKM_HASH_ML_DSA_SHAKE256,
    CKM_ML_DSA_EXTERNAL_MU: Number(VENDOR_DEFINED_MECHANISMS.CKM_ML_DSA_EXTERNAL_MU!.value),
  })[name]

const variantOf = (ps: string): number => Number(ps.slice(ps.lastIndexOf('-') + 1))

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e))

/** This prototype's token per module, so repeated browser runs reuse one slot. */
const tokenSlot = new WeakMap<SoftHSMModule, number>()

/**
 * Open a user session on this prototype's own token on `M` (created on first
 * use, re-created if the module was finalized since) and return an AcvpEngine
 * over it. The token is never the Playground's key-inventory session, so a run
 * neither sees nor disturbs other Playground objects.
 */
export const createPkcs11Engine = (M: SoftHSMModule, identity: EngineIdentity): AcvpEngine => {
  const initRv = M._C_Initialize(0) >>> 0
  if (initRv !== CKR_OK && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
    throw new Error(`C_Initialize → ${rvName(initRv)}`)
  }
  let slotId = tokenSlot.get(M)
  let hSession = 0
  if (slotId !== undefined) {
    try {
      hSession = hsm_openUserSession(M, slotId, SO_PIN, USER_PIN)
    } catch {
      slotId = undefined // token gone (module re-initialized elsewhere) — make a new one
    }
  }
  if (slotId === undefined || hSession === 0) {
    slotId = hsm_initToken(M, hsm_getFirstFreeSlot(M), SO_PIN, TOKEN_LABEL)
    hSession = hsm_openUserSession(M, slotId, SO_PIN, USER_PIN)
    tokenSlot.set(M, slotId)
  }
  const advertised = new Set(hsm_getMechanismList(M, slotId).map((m) => m >>> 0))

  const notAdvertised = (name: Pkcs11MechanismName): EngineOutcome | null =>
    advertised.has(mechanismValue(name))
      ? null
      : {
          status: 'unsupported',
          reason: `${identity.label} does not list ${name} in C_GetMechanismList`,
        }

  const destroy = (h: number) => {
    try {
      hsm_destroyObject(M, hSession, h)
    } catch {
      // best effort — a failed destroy must not turn a result into an error
    }
  }

  const decapsulate = (op: MlKemDecapsulateOp): EngineOutcome => {
    const variant = variantOf(op.parameterSet) as 512 | 768 | 1024
    let priv = 0
    let secret = 0
    try {
      priv = hsm_importMLKEMPrivateKey(M, hSession, variant, hexToBytes(op.dk))
      secret = hsm_decapsulate(M, hSession, priv, hexToBytes(op.c), variant)
      return { status: 'ok', value: bytesToUpperHex(hsm_extractKeyValue(M, hSession, secret)) }
    } catch (e) {
      return { status: 'error', reason: errText(e) }
    } finally {
      if (secret) destroy(secret)
      if (priv) destroy(priv)
    }
  }

  const verify = (op: MlDsaVerifyOp): EngineOutcome => {
    const variant = variantOf(op.parameterSet) as 44 | 65 | 87
    const ctx = hexToBytes(op.context)
    const msg = hexToBytes(op.message)
    const sig = hexToBytes(op.signature)
    const ptrs: number[] = []
    const alloc = (n: number) => {
      const p = M._malloc(Math.max(n, 1))
      ptrs.push(p)
      return p
    }
    let pub = 0
    let initialized = false
    try {
      pub = hsm_importMLDSAPublicKey(M, hSession, variant, hexToBytes(op.pk))
      // CK_SIGN_ADDITIONAL_CONTEXT (PKCS#11 v3.2, WASM32 layout, 12 bytes):
      //   hedgeVariant (ignored by verification) | pContext | ulContextLen
      // Always passed — also for an empty context — so ctx = "" is explicit.
      const param = alloc(12)
      M.setValue(param, CKH_HEDGE_PREFERRED, 'i32')
      if (ctx.length > 0) {
        const ctxPtr = alloc(ctx.length)
        M.HEAPU8.set(ctx, ctxPtr)
        M.setValue(param + 4, ctxPtr, 'i32')
      } else {
        M.setValue(param + 4, 0, 'i32')
      }
      M.setValue(param + 8, ctx.length, 'i32')
      if (op.hashMechanism) {
        // Generic CKM_HASH_ML_DSA (single-part only): CK_HASH_SIGN_ADDITIONAL_CONTEXT is the
        // 12-byte context structure plus a trailing hash; the data is PH(M), computed by the planner.
        const hashParam = alloc(16)
        M.setValue(hashParam, CKH_HEDGE_PREFERRED, 'i32')
        M.setValue(hashParam + 4, M.getValue(param + 4, 'i32'), 'i32')
        M.setValue(hashParam + 8, ctx.length, 'i32')
        M.setValue(
          hashParam + 12,
          op.hashMechanism === 'CKM_SHA512_224' ? CKM_SHA512_224 : CKM_SHA512_256,
          'i32'
        )
        const hmech = alloc(12)
        M.setValue(hmech, mechanismValue(op.mechanism), 'i32')
        M.setValue(hmech + 4, hashParam, 'i32')
        M.setValue(hmech + 8, 16, 'i32')
        const phPtr = alloc(msg.length)
        M.HEAPU8.set(msg, phPtr)
        const hsigPtr = alloc(sig.length)
        M.HEAPU8.set(sig, hsigPtr)
        const hInitRv = M._C_VerifyInit(hSession, hmech, pub) >>> 0
        if (hInitRv !== CKR_OK) {
          return { status: 'error', reason: `C_VerifyInit(${op.mechanism}) → ${rvName(hInitRv)}` }
        }
        // A single-part C_Verify always terminates the operation, whatever it returns.
        const hrv = M._C_Verify(hSession, phPtr, msg.length, hsigPtr, sig.length) >>> 0
        if (hrv === CKR_OK) return { status: 'ok', value: true }
        if (hrv === CKR_SIGNATURE_INVALID || hrv === CKR_SIGNATURE_LEN_RANGE) {
          return { status: 'ok', value: false, detail: rvName(hrv) }
        }
        return { status: 'error', reason: `C_Verify(${op.mechanism}) → ${rvName(hrv)}` }
      }
      const mech = alloc(12)
      M.setValue(mech, mechanismValue(op.mechanism), 'i32')
      M.setValue(mech + 4, param, 'i32')
      M.setValue(mech + 8, 12, 'i32')
      const msgPtr = alloc(msg.length)
      M.HEAPU8.set(msg, msgPtr)
      const sigPtr = alloc(sig.length)
      M.HEAPU8.set(sig, sigPtr)

      const initRv = M._C_MessageVerifyInit(hSession, mech, pub) >>> 0
      if (initRv !== CKR_OK) {
        return {
          status: 'error',
          reason: `C_MessageVerifyInit(${op.mechanism}) → ${rvName(initRv)}`,
        }
      }
      initialized = true
      const rv = M._C_VerifyMessage(hSession, 0, 0, msgPtr, msg.length, sigPtr, sig.length) >>> 0
      if (rv === CKR_OK) return { status: 'ok', value: true }
      if (rv === CKR_SIGNATURE_INVALID || rv === CKR_SIGNATURE_LEN_RANGE) {
        return { status: 'ok', value: false, detail: rvName(rv) }
      }
      return { status: 'error', reason: `C_VerifyMessage(${op.mechanism}) → ${rvName(rv)}` }
    } catch (e) {
      return { status: 'error', reason: errText(e) }
    } finally {
      if (initialized) M._C_MessageVerifyFinal(hSession)
      for (const p of ptrs) M._free(p)
      if (pub) destroy(pub)
    }
  }

  const verifyExternalMu = (op: MlDsaVerifyExternalMuOp): EngineOutcome => {
    const variant = variantOf(op.parameterSet) as 44 | 65 | 87
    const mu = hexToBytes(op.mu)
    const sig = hexToBytes(op.signature)
    const ptrs: number[] = []
    const alloc = (n: number) => {
      const p = M._malloc(Math.max(n, 1))
      ptrs.push(p)
      return p
    }
    let pub = 0
    try {
      pub = hsm_importMLDSAPublicKey(M, hSession, variant, hexToBytes(op.pk))
      const mech = alloc(12)
      M.setValue(mech, mechanismValue(op.mechanism), 'i32')
      M.setValue(mech + 4, 0, 'i32')
      M.setValue(mech + 8, 0, 'i32')
      const muPtr = alloc(mu.length)
      M.HEAPU8.set(mu, muPtr)
      const sigPtr = alloc(sig.length)
      M.HEAPU8.set(sig, sigPtr)
      const initRv = M._C_VerifyInit(hSession, mech, pub) >>> 0
      if (initRv !== CKR_OK) {
        return { status: 'error', reason: `C_VerifyInit(${op.mechanism}) → ${rvName(initRv)}` }
      }
      // A single-part C_Verify always terminates the operation, whatever it returns.
      const rv = M._C_Verify(hSession, muPtr, mu.length, sigPtr, sig.length) >>> 0
      if (rv === CKR_OK) return { status: 'ok', value: true }
      if (rv === CKR_SIGNATURE_INVALID || rv === CKR_SIGNATURE_LEN_RANGE) {
        return { status: 'ok', value: false, detail: rvName(rv) }
      }
      return { status: 'error', reason: `C_Verify(${op.mechanism}) → ${rvName(rv)}` }
    } catch (e) {
      return { status: 'error', reason: errText(e) }
    } finally {
      for (const p of ptrs) M._free(p)
      if (pub) destroy(pub)
    }
  }

  /** One C_EncapsulateKey with m as the mechanism parameter → { c, k } or the failing step. */
  const rawEncapsulate = (
    op: MlKemEncapsulateOp,
    m: Uint8Array
  ): { c: Uint8Array; k: Uint8Array } | { error: string } => {
    const variant = variantOf(op.parameterSet) as 512 | 768 | 1024
    const ptrs: number[] = []
    let pub = 0
    let secret = 0
    try {
      pub = hsm_importMLKEMPublicKey(M, hSession, variant, hexToBytes(op.ek))
      const mech = M._malloc(12)
      ptrs.push(mech)
      const mPtr = writeBytes(M, m)
      ptrs.push(mPtr)
      M.setValue(mech, CKM_ML_KEM, 'i32')
      M.setValue(mech + 4, mPtr, 'i32')
      M.setValue(mech + 8, m.length, 'i32')
      const ctLen = CT_LEN[variant]
      const ctPtr = M._malloc(ctLen)
      ptrs.push(ctPtr)
      const lenPtr = M._malloc(4)
      ptrs.push(lenPtr)
      const hPtr = M._malloc(4)
      ptrs.push(hPtr)
      M.setValue(lenPtr, ctLen, 'i32')
      M.setValue(hPtr, 0, 'i32')
      // The derived secret of a public NIST sample is extracted to compare with k.
      const defs = [
        { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_VALUE_LEN, ulongVal: 32 },
        { type: CKA_SENSITIVE, boolVal: false },
        { type: CKA_EXTRACTABLE, boolVal: true },
      ]
      const tpl = buildTemplate(M, defs)
      let rv: number
      try {
        rv =
          M._C_EncapsulateKey(hSession, mech, pub, tpl.ptr, defs.length, ctPtr, lenPtr, hPtr) >>> 0
      } finally {
        freeTemplate(M, tpl, defs.length)
      }
      secret = M.getValue(hPtr, 'i32') >>> 0
      if (rv !== CKR_OK) return { error: `C_EncapsulateKey(CKM_ML_KEM, m) → ${rvName(rv)}` }
      const c = M.HEAPU8.slice(ctPtr, ctPtr + (M.getValue(lenPtr, 'i32') >>> 0))
      const k = new Uint8Array(hsm_extractKeyValue(M, hSession, secret))
      return { c, k }
    } catch (e) {
      return { error: errText(e) }
    } finally {
      for (const p of ptrs) M._free(p)
      if (secret) destroy(secret)
      if (pub) destroy(pub)
    }
  }

  const sameBytes = (a: Uint8Array, b: Uint8Array): boolean =>
    a.length === b.length && a.every((x, i) => x === b[i])

  /** null = not yet probed; true = the engine honours a supplied m; false = it does not. */
  let suppliedMHonoured: boolean | null = null

  const encapsulate = (op: MlKemEncapsulateOp): EngineOutcome => {
    const m = hexToBytes(op.m)
    const first = rawEncapsulate(op, m)
    if ('error' in first) return { status: 'error', reason: first.error }
    if (suppliedMHonoured === null) {
      // Prove once per run that the engine uses the supplied m: the same m must reproduce
      // the output and a one-bit-different m must change the ciphertext. Otherwise a value
      // produced from the engine's own randomness could be reported as an answer.
      const again = rawEncapsulate(op, m)
      const flipped = m.slice()
      flipped[0] ^= 0x01
      const other = rawEncapsulate(op, flipped)
      suppliedMHonoured =
        !('error' in again) &&
        !('error' in other) &&
        sameBytes(first.c, again.c) &&
        sameBytes(first.k, again.k) &&
        !sameBytes(first.c, other.c)
    }
    if (!suppliedMHonoured) {
      return { status: 'unsupported', reason: UNSUPPORTED_REASONS.engineIgnoredSuppliedM }
    }
    return {
      status: 'ok',
      value: bytesToUpperHex(first.k),
      extra: { c: bytesToUpperHex(first.c) },
      detail: 'C_EncapsulateKey(CKM_ML_KEM, pParameter = m) → CKR_OK',
    }
  }

  const keyCheck = (op: MlKemKeyCheckOp): EngineOutcome => {
    const variant = variantOf(op.parameterSet) as 512 | 768 | 1024
    const bytes = hexToBytes(op.key)
    const ps = kemParamSet(variant)
    const valuePtr = writeBytes(M, bytes)
    const hPtr = M._malloc(4)
    M.setValue(hPtr, 0, 'i32')
    const defs =
      op.keyKind === 'ek'
        ? [
            { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
            { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
            { type: CKA_TOKEN, boolVal: false },
            { type: CKA_VERIFY, boolVal: false },
            { type: CKA_ENCAPSULATE, boolVal: true },
            { type: CKA_PARAMETER_SET, ulongVal: ps },
            { type: CKA_VALUE, bytesPtr: valuePtr, bytesLen: bytes.length },
          ]
        : [
            { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
            { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
            { type: CKA_TOKEN, boolVal: false },
            { type: CKA_SENSITIVE, boolVal: false },
            { type: CKA_EXTRACTABLE, boolVal: true },
            { type: CKA_DECAPSULATE, boolVal: true },
            { type: CKA_PARAMETER_SET, ulongVal: ps },
            { type: CKA_VALUE, bytesPtr: valuePtr, bytesLen: bytes.length },
          ]
    const tpl = buildTemplate(M, defs)
    try {
      const rv = M._C_CreateObject(hSession, tpl.ptr, defs.length, hPtr) >>> 0
      if (rv === CKR_OK) {
        destroy(M.getValue(hPtr, 'i32') >>> 0)
        return { status: 'ok', value: true, detail: `C_CreateObject(${op.keyKind}) → CKR_OK` }
      }
      if (rv === CKR_ATTRIBUTE_VALUE_INVALID) {
        return {
          status: 'ok',
          value: false,
          detail: `C_CreateObject(${op.keyKind}) → ${rvName(rv)}`,
        }
      }
      return { status: 'error', reason: `C_CreateObject(${op.keyKind}) → ${rvName(rv)}` }
    } catch (e) {
      return { status: 'error', reason: errText(e) }
    } finally {
      freeTemplate(M, tpl, defs.length)
      M._free(valuePtr)
      M._free(hPtr)
    }
  }

  return {
    identity,
    execute(op: PlanOperation): EngineOutcome {
      const gate = notAdvertised(op.mechanism)
      if (gate) return gate
      if (op.operation === 'ml-kem.decapsulate') return decapsulate(op)
      if (op.operation === 'ml-kem.encapsulate') return encapsulate(op)
      if (op.operation === 'ml-kem.key-check') return keyCheck(op)
      if (op.operation === 'ml-dsa.verify-external-mu') return verifyExternalMu(op)
      return verify(op)
    },
    close() {
      try {
        M._C_CloseSession(hSession)
      } catch {
        // ignore — the module may already have been finalized by another panel
      }
    },
  }
}
