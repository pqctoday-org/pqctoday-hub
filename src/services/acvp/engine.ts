// SPDX-License-Identifier: GPL-3.0-only
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
 *
 * Every imported object is destroyed after its test. No RNG seeding, no
 * test-only hooks, no secret-injection seam: decapsulation and verification
 * are deterministic functions of the prompt's own inputs.
 */
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_decapsulate,
  hsm_destroyObject,
  hsm_extractKeyValue,
  hsm_getFirstFreeSlot,
  hsm_getMechanismList,
  hsm_importMLDSAPublicKey,
  hsm_importMLKEMPrivateKey,
  hsm_initToken,
  hsm_openUserSession,
  rvName,
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
  CKM_HASH_ML_DSA_SHAKE256,
  CKM_ML_DSA,
  CKM_ML_KEM,
} from '../../wasm/softhsm/constants'
import { bytesToUpperHex, hexToBytes } from './ir'
import type {
  AcvpEngine,
  EngineIdentity,
  EngineOutcome,
  MlDsaVerifyOp,
  MlKemDecapsulateOp,
  PlanOperation,
  Pkcs11MechanismName,
} from './dispatch'

const CKR_OK = 0
const CKR_SIGNATURE_INVALID = 0xc0
const CKR_SIGNATURE_LEN_RANGE = 0xc1
const CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191

const SO_PIN = '12345678'
const USER_PIN = 'user1234'
const TOKEN_LABEL = 'ACVP-IO prototype'

/** Lazy for the same production-TLA reason as pqc.ts's prehashMech(). */
const mechanismValue = (name: Pkcs11MechanismName): number =>
  ({
    CKM_ML_KEM,
    CKM_ML_DSA,
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

  return {
    identity,
    execute(op: PlanOperation): EngineOutcome {
      const gate = notAdvertised(op.mechanism)
      if (gate) return gate
      return op.operation === 'ml-kem.decapsulate' ? decapsulate(op) : verify(op)
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
